using System.ComponentModel.DataAnnotations;

namespace Models
{
    // Korisnik aplikacije (tabela Users). Lozinka, token i rok sesije se NIKAD ne vracaju
    // kroz API - klijent dobija UserDto.
    public class User : IHasId
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string FirstName { get; set; }
        [Required]
        public string LastName { get; set; }
        [Required]
        [MaxLength(UsernameRules.MaxLength)] // jedinstveno (indeks u EventBoxContext)
        public string Username { get; set; }
        [Required]
        public string PasswordHash { get; set; } // PBKDF2 heš (vidi Auth/Passwords.cs)
        public DateTime DateOfBirth { get; set; }
        [Required]
        [MaxLength(EmailRules.MaxLength)] // jedinstveno (indeks u EventBoxContext)
        public string Email { get; set; }
        // Blokiran nalog ne moze da se prijavi, a njegov sadrzaj se ne prikazuje ostalima
        public bool IsBlocked { get; set; }

        // Sesija: nasumican token (32 bajta kao hex, jedinstven) i do kad vazi (UTC)
        [Required]
        [MaxLength(64)]
        public string Token { get; set; }
        public DateTime TokenExpiresAt { get; set; }

        // Ime fajla profilne slike u Uploads (null = nema slike)
        public string? ProfileImage { get; set; }

        public virtual List<Event> CreatedEvents { get; set; }
        public virtual List<Notification> Notifications { get; set; }
    }
}
