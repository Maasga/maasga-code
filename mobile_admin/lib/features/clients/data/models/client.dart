class Client {
  final String id;
  final String name;
  final String? email;
  final String phone;
  final String? quartier;
  final String? adressePrecise;
  final String? notes;
  final int orderCount;
  final int rdvCount;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Client({
    required this.id,
    required this.name,
    this.email,
    required this.phone,
    this.quartier,
    this.adressePrecise,
    this.notes,
    this.orderCount = 0,
    this.rdvCount = 0,
    required this.createdAt,
    this.updatedAt,
  });

  factory Client.fromJson(Map<String, dynamic> json) {
    return Client(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      email: json['email']?.toString(),
      phone: json['phone'] ?? '',
      quartier: json['quartier']?.toString(),
      adressePrecise: json['adresse_precise']?.toString(),
      notes: json['notes']?.toString(),
      orderCount: json['order_count'] as int? ?? 0,
      rdvCount: json['rdv_count'] as int? ?? 0,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'quartier': quartier,
      'adresse_precise': adressePrecise,
      'notes': notes,
      'order_count': orderCount,
      'rdv_count': rdvCount,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  String get formattedPhone {
    final phone = this.phone.replaceAll(RegExp(r'\D'), '');
    if (phone.length == 8) {
      return '+226 ${phone.substring(0, 2)} ${phone.substring(2, 5)} ${phone.substring(5)}';
    }
    return this.phone;
  }

  String get formattedDate {
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }
}