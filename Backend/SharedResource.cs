// Ime projekta ima razmake ("Novi backend za SWE"), pa se lokalizaciji kaze koji je koreni
// namespace - po njemu nalazi prevode u Resources/SharedResource*.resx.
[assembly: Microsoft.Extensions.Localization.RootNamespace("Novi_backend_za_SWE")]

namespace Novi_backend_za_SWE
{
    // Poruke koje API vraca korisniku (greske, potvrde), na engleskom i srpskom.
    // Prevodi su u Resources/SharedResource.resx (engleski, podrazumevani) i SharedResource.sr.resx.
    // Jezik bira frontend zaglavljem Accept-Language (vidi UseRequestLocalization u Program.cs).
    // U kontroleru: IStringLocalizer<SharedResource> se dobije kroz konstruktor, pa _t["Kljuc", argumenti].
    public class SharedResource
    {
    }
}
