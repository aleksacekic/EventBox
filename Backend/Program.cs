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


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddDbContext<EventBoxContext>(options => 
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("EventBoxDB"));
});

builder.Services.AddCors(options =>
            {
                options.AddPolicy("CORS", builder =>
                {
                    builder.WithOrigins(new string[]
                    {
                        "http://localhost:8080",
                        "https://localhost:8080",
                        "http://127.0.0.1:8080",
                        "https://127.0.0.1:8080",
                        "http://127.0.0.1:5500",
                        "http://localhost:5500",
                        "http://127.0.0.1:5500",
                        "https://localhost:5500",
			            "http://localhost:3000"
                    })
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
                });
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
    FileProvider = new PhysicalFileProvider(Directory.CreateDirectory(Path.Combine(builder.Environment.ContentRootPath, "Uploads")).FullName),
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