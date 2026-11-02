using System.ComponentModel.DataAnnotations;

namespace Models
{
    // Administrator (tabela Admins). Nije korisnik: nema profil, dogadjaje ni cet.
    public class Admin
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string FirstName { get; set; }
        [Required]
        public string LastName { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        [MaxLength(UsernameRules.MaxLength)] // jedinstveno (indeks u EventBoxContext)
        public string Username { get; set; }
        [Required]
        public string PasswordHash { get; set; } // PBKDF2 heš (vidi Auth/Passwords.cs)
        // Sesija administratora (isto kao User.Token / TokenExpiresAt); null = odjavljen
        [MaxLength(64)]
        public string? Token { get; set; }
        public DateTime? TokenExpiresAt { get; set; }
    }
}
