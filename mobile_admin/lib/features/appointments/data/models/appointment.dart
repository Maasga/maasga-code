class Appointment {
  final String id;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final DateTime date;
  final String time;
  final String status;
  final String? address;
  final String? notes;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Appointment({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    required this.date,
    required this.time,
    required this.status,
    this.address,
    this.notes,
    required this.createdAt,
    this.updatedAt,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    // Adapter pour la structure réelle de la base de données D1
    return Appointment(
      id: json['id']?.toString() ?? '',
      customerName: json['name'] ?? json['customerName'] ?? '',
      customerPhone: json['phone'] ?? json['customerPhone'] ?? '',
      customerEmail: json['email']?.toString(),
      date:
          DateTime.tryParse(json['date'] ?? json['date'] ?? '') ??
          DateTime.now(),
      time:
          json['heure_debut'] ?? json['time'] ?? json['heure_debut'] ?? '08:00',
      status: json['status'] ?? 'pending',
      address:
          json['adresse_precise']?.toString() ?? json['address']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': customerName,
      'phone': customerPhone,
      'email': customerEmail,
      'date': date.toIso8601String().split('T')[0],
      'heure_debut': time,
      'status': status,
      'adresse_precise': address,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  String get formattedStatus {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'done':
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  String get formattedDate {
    return '${date.day}/${date.month}/${date.year}';
  }
}
