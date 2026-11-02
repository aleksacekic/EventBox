using System.Linq.Expressions;

namespace Models
{
    // Podaci o korisniku koji smeju da odu klijentu. Entitet User ima i PasswordHash, Token
    // i TokenExpiresAt - oni se NIKAD ne vracaju kroz API.
    public class UserDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Username { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Email { get; set; }
        public string? ProfileImage { get; set; }

        // Izraz (a ne obicna metoda) da ga EF prevede u SQL i iz baze povuce samo ova polja.
        public static readonly Expression<Func<User, UserDto>> Projection = u => new UserDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Username = u.Username,
            DateOfBirth = u.DateOfBirth,
            Email = u.Email,
            ProfileImage = u.ProfileImage,
        };
    }
}
