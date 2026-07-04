enum RdvStatus {
  enAttente,
  confirme,
  effectue,
  annule,
  unknown;

  String get label {
    switch (this) {
      case enAttente: return 'En attente';
      case confirme: return 'Confirmé';
      case effectue: return 'Effectué';
      case annule: return 'Annulé';
      case unknown: return 'Inconnu';
    }
  }

  static RdvStatus fromString(String? status) {
    switch (status?.toLowerCase()) {
      case 'en attente':
      case 'pending':
        return RdvStatus.enAttente;
      case 'confirmé':
      case 'confirme':
      case 'confirmed':
        return RdvStatus.confirme;
      case 'effectué':
      case 'effectue':
      case 'completed':
        return RdvStatus.effectue;
      case 'annulé':
      case 'annule':
      case 'cancelled':
        return RdvStatus.annule;
      default:
        return RdvStatus.unknown;
    }
  }
}

class RendezVous {
  RendezVous({
    required this.id,
    required this.type,
    required this.date,
    required this.status,
    this.technicianName,
  });

  final String id;
  final String type; // ex: Installation, Maintenance
  final String date; // ex: '8 Juin 2026, 08:00-10:00, Lundi'
  final RdvStatus status;
  final String? technicianName;

  factory RendezVous.fromJson(Map<String, dynamic> json) {
    return RendezVous(
      id: json['id']?.toString() ?? '',
      type: json['type'] ?? 'Rendez-vous',
      date: json['date'] ?? '',
      status: RdvStatus.fromString(json['status']),
      technicianName: json['technician_name'],
    );
  }
}
