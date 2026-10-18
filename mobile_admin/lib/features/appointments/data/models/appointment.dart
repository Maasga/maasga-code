class Appointment {
  final String id;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final DateTime date;
  final String time;
  final String? heureFin;
  final String status;
  final String? address;
  final String? quartier;
  final String? technician;
  final String type; // 'devis', 'installation', 'entretien', 'depannage'
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
    this.heureFin,
    required this.status,
    this.address,
    this.quartier,
    this.technician,
    this.type = 'installation',
    this.notes,
    required this.createdAt,
    this.updatedAt,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id']?.toString() ?? '',
      customerName: json['name'] ?? json['customerName'] ?? json['nom'] ?? '',
      customerPhone: json['phone'] ?? json['customerPhone'] ?? json['telephone'] ?? '',
      customerEmail: json['email']?.toString(),
      date: DateTime.tryParse(json['date']?.toString() ?? '') ?? DateTime.now(),
      time: json['heure_debut'] ?? json['time'] ?? '08:00',
      heureFin: json['heure_fin']?.toString(),
      status: json['status'] ?? 'pending',
      address: json['adresse_precise']?.toString() ?? json['address']?.toString(),
      quartier: json['quartier']?.toString(),
      technician: json['technician']?.toString() ?? json['technicien']?.toString(),
      type: json['type']?.toString().toLowerCase() ?? 'installation',
      notes: json['notes']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
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
      'heure_fin': heureFin,
      'status': status,
      'adresse_precise': address,
      'quartier': quartier,
      'technician': technician,
      'type': type,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Appointment copyWith({
    String? id,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
    DateTime? date,
    String? time,
    String? heureFin,
    String? status,
    String? address,
    String? quartier,
    String? technician,
    String? type,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Appointment(
      id: id ?? this.id,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerEmail: customerEmail ?? this.customerEmail,
      date: date ?? this.date,
      time: time ?? this.time,
      heureFin: heureFin ?? this.heureFin,
      status: status ?? this.status,
      address: address ?? this.address,
      quartier: quartier ?? this.quartier,
      technician: technician ?? this.technician,
      type: type ?? this.type,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
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

  String get formattedType {
    switch (type.toLowerCase()) {
      case 'devis':
        return 'Devis sur place';
      case 'installation':
        return 'Installation';
      case 'entretien':
        return 'Entretien';
      case 'depannage':
        return 'Dépannage';
      default:
        return type;
    }
  }

  String get formattedDate {
    final d = date.day.toString().padLeft(2, '0');
    final m = date.month.toString().padLeft(2, '0');
    return '$d/$m/${date.year}';
  }
}
