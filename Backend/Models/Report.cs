using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    // Prijavljen dogadjaj (tabela Reports): jedan red po dogadjaju, sa brojem prijava i
    // razlozima. Admin stranica ga dobija ceo, zajedno sa dogadjajem.
    public class Report : IHasId
    {
        [Key]
        public int Id { get; set; }

        public int EventId { get; set; }
        [ForeignKey(nameof(EventId))]
        public virtual Event Event { get; set; }

        // Broj razloga (racuna se iz ReportReasons, vidi ReportsController)
        public int ReportCount { get; set; }

        public virtual List<ReportReason> Reasons { get; set; }
    }
}
