namespace Models
{
    // Tela zahteva za naloge (korisnici i administratori)

    public class RegisterRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Email { get; set; }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class UpdateUserRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Username { get; set; }
        public string? Password { get; set; }        // nova lozinka; prazno = lozinka se ne menja
        public string? CurrentPassword { get; set; } // obavezna samo kad se menja lozinka
        public DateTime DateOfBirth { get; set; }
        public string Email { get; set; }
    }

    // Brisanje naloga trazi lozinku - token sam nije dovoljan za nepovratnu akciju
    public class DeleteAccountRequest
    {
        public string? Password { get; set; }
    }

    public class CreateAdminRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
