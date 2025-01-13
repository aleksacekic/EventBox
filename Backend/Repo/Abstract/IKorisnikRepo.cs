using Models;

namespace EventBoxApi.Repo.Abstract
{
    public interface IKorisnikRepo
    {
        bool Add(Korisnik model);
    }
}