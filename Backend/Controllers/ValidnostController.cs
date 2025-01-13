using Models;

namespace EventBoxApi.Controllers
{
    public class Validnost
    {
        public static async Task Validiraj(EventBoxContext _context, HttpRequest _request)
        {
            var token = _request.Cookies["token"];
            var user_id = _request.Cookies["userID"];

            if(token == null)
                throw new AUTHException();

            if(user_id == null)
                throw new AUTHException();
            
            Korisnik k  = await _context.Korisnici.FindAsync(Int32.Parse(user_id));
            if(token != k.Token)
                throw new AUTHException();

	    if(DateTime.Compare(DateTime.Now, k.Validnost) > 0)
                throw new AUTHException();

            k.Validnost = DateTime.Now.AddMinutes(30);
            _context.Korisnici.Update(k);
            await _context.SaveChangesAsync();
            

        }


    }

    public class AUTHException : Exception
    {
        public AUTHException() : base("Autentifikacija je neuspela")
        {

        }
    }
}

