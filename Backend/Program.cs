using Models;
using Microsoft.EntityFrameworkCore;
using EventBoxApi.Repo.Abstract;
using EventBoxApi.Repo.Implementation;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.OpenApi.Models;
using EventBoxApi.Auth;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddDbContext<EventBoxContext>(options => 
{
    // Retry: besplatna Azure SQL baza je serverless i posle neaktivnosti se pauzira. Dok se budi
    // (do ~1 min), odbija konekcije privremenom greskom - EF tada sam ponovi upit umesto da
    // korisnik dobije 500. Rucne transakcije zato moraju kroz CreateExecutionStrategy (Pr_dog).
    options.UseSqlServer(builder.Configuration.GetConnectionString("EventBoxDB"),
        sql => sql.EnableRetryOnFailure(maxRetryCount: 6, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null));
});

// Dozvoljene adrese frontenda: Cors:Origins u appsettings.json (lokalno http://localhost:3000).
// Na serveru se zadaju promenljivom okruzenja, npr. Cors__Origins__0=https://eventbox.vercel.app
var dozvoljeneAdrese = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("CORS", policy => policy
        .WithOrigins(dozvoljeneAdrese)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// Iza proksija (Azure App Service) zahtev stize sa adrese proksija i preko HTTP-a. Prava IP adresa
// korisnika i https su u X-Forwarded-For / X-Forwarded-Proto - bez ovoga bi rate limit po IP-u
// delili svi korisnici, a UseHttpsRedirection bi mogao da preusmerava u krug.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear(); // adresa Azure proksija nije unapred poznata
    o.KnownProxies.Clear();
});


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Dugme "Authorize" u Swagger-u: nalepi token dobijen pri prijavi
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        Description = "Token dobijen od /Korisnik/LogovanjeKorisnik"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            new string[] { }
        }
    });
});

// Autentifikacija po tokenu (vidi Auth/TokenAuthenticationHandler.cs)
builder.Services.AddAuthentication(TokenAuthenticationHandler.Sema)
    .AddScheme<AuthenticationSchemeOptions, TokenAuthenticationHandler>(TokenAuthenticationHandler.Sema, null);
builder.Services.AddAuthorization();
builder.Services.AddTransient<IFileService, FileService>();
builder.Services.AddScoped<Obavestenja>();
// Zastita prijave: ograničenje po IP adresi + zaključavanje naloga posle 5 pogrešnih lozinki
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ZastitaPrijave>();
builder.Services.AddRateLimiter(ZastitaPrijave.Podesi);
// SignalR: korisnik se prepoznaje po tokenu (claim NameIdentifier), podrazumevani IUserIdProvider
// to vec radi - zato vise nema CustomUserIdProvider-a koji je verovao ?userID= iz adrese
builder.Services.AddSignalR();



var app = builder.Build();

// Prvo: prava IP adresa i protokol iz zaglavlja proksija (vidi ForwardedHeadersOptions gore)
app.UseForwardedHeaders();

// Globalni handler gresaka: svaki neocekivan izuzetak (baza nedostupna, bug u kodu...) se upise
// u log sa svim detaljima, a klijent dobija 500 i opstu poruku - bez teksta izuzetka, jer bi
// on otkrio semu baze i unutrasnjost servera. traceId povezuje odgovor sa zapisom u logu.
// Kontroleri zato vise nemaju try/catch: 400 vracaju samo za greske klijenta (neispravan unos).
app.UseExceptionHandler(greska => greska.Run(async http =>
{
    var izuzetak = http.Features.Get<IExceptionHandlerPathFeature>();
    app.Logger.LogError(izuzetak?.Error, "Neobradjena greska: {Metoda} {Putanja} (traceId {TraceId})",
        http.Request.Method, izuzetak?.Path, http.TraceIdentifier);

    http.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await http.Response.WriteAsJsonAsync(new
    {
        message = "Doslo je do greske na serveru. Pokusajte ponovo.",
        traceId = http.TraceIdentifier,
        // samo u razvoju (dotnet run): tekst izuzetka da se ne trazi po logu
        detalj = app.Environment.IsDevelopment() ? izuzetak?.Error.Message : null,
    });
}));

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Slike korisnika iz Uploads na /Resources/<ime>. Upload proverava da je sadrzaj zaista slika,
// a nosniff zabranjuje pregledacu da fajl "pogadja" kao nesto drugo (npr. HTML sa skriptom).
// Ime fajla je nasumicni GUID koji se nikad ne menja, pa slika moze dugo da stoji u kesu.
app.UseStaticFiles(new StaticFileOptions {
    FileProvider = new PhysicalFileProvider(Directory.CreateDirectory(FileService.Folder(builder.Configuration, builder.Environment)).FullName),
    RequestPath = "/Resources",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.XContentTypeOptions = "nosniff";
        ctx.Context.Response.Headers.CacheControl = "public, max-age=604800";
    }
});


// Redosled je bitan: rutiranje -> CORS -> ko je korisnik -> sme li -> ogranicenje zahteva,
// pa tek onda kontroleri i hub
app.UseRouting();
app.UseCors("CORS");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");


app.Run();