using Models;
using Microsoft.EntityFrameworkCore;
using EventBoxApi.Repo.Abstract;
using EventBoxApi.Repo.Implementation;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.SignalR;


var builder = WebApplication.CreateBuilder(args);

static void CheckSameSite(HttpContext httpContext, CookieOptions options)
{
    if (options.SameSite == SameSiteMode.None)
    {
        var userAgent = httpContext.Request.Headers["User-Agent"].ToString();
        if (DisallowsSameSiteNone(userAgent))
        {
            options.SameSite = SameSiteMode.Unspecified;
        }
    }
}

static bool DisallowsSameSiteNone(string userAgent)
{


    if (string.IsNullOrEmpty(userAgent))
    {
        return false;
    }

    if (userAgent.Contains("CPU iPhone OS 12")
        || userAgent.Contains("iPad; CPU OS 12"))
    {
        return true;
    }

    if (userAgent.Contains("Macintosh; Intel Mac OS X 10_14")
        && userAgent.Contains("Version/") && userAgent.Contains("Safari"))
    {
        return true;
    }

    if (userAgent.Contains("Chrome/5") || userAgent.Contains("Chrome/6"))
    {
        return true;
    }

    return false;
}

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


builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.None;
    options.OnAppendCookie = cookieContext =>
        CheckSameSite(cookieContext.Context, cookieContext.CookieOptions);
    options.OnDeleteCookie = cookieContext =>
        CheckSameSite(cookieContext.Context, cookieContext.CookieOptions);
});


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddTransient<IFileService, FileService>();
builder.Services.AddTransient<IDogadjajRepo, DogadjajRepo>();
builder.Services.AddTransient<IKorisnikRepo, KorisnikRepo>();
builder.Services.AddControllersWithViews();
builder.Services.AddSignalR();

//OVO JE MNOGO POMOGLO ZA SIGNALR !!!!!!!
builder.Services.AddSingleton<IUserIdProvider, CustomUserIdProvider>();



var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles(new StaticFileOptions {
    FileProvider = new PhysicalFileProvider(Path.Combine(builder.Environment.ContentRootPath,"Uploads")),
    RequestPath = "/Resources"
});


app.UseCookiePolicy();

app.MapControllers();

// Postavi rute za SignalR
app.UseRouting();
app.UseCors("CORS");
app.MapHub<NotificationHub>("/notificationHub");


app.Run();