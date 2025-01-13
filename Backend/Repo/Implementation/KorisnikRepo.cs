using EventBoxApi.Repo.Abstract;
using Models;

namespace EventBoxApi.Repo.Implementation
{
    public class KorisnikRepo : IKorisnikRepo
    {
        public EventBoxContext _context;
        public KorisnikRepo(EventBoxContext context)
        {
            this._context = context;
        }
        public bool Add(Korisnik model) 
        {
            try
            {
                upisivanje(model);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
        public void upisivanje(Korisnik model)
        {
            //_context.Korisnici.Add(model);
            _context.SaveChanges();
        }
    }
}