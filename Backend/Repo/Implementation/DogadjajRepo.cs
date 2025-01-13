using EventBoxApi.Repo.Abstract;
using Models;

namespace EventBoxApi.Repo.Implementation
{
    public class DogadjajRepo : IDogadjajRepo
    {
        public EventBoxContext _context;
        public DogadjajRepo(EventBoxContext context)
        {
            this._context = context;
        }
        public bool Add(Dogadjaj model) 
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
        public void upisivanje(Dogadjaj model)
        {
            //_context.Dogadjaji.Add(model);
            _context.SaveChanges();
        }
    }
}