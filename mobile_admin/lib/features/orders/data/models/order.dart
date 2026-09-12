class Order {
  final String id;
  final String clientName;
  final String clientPhone;
  final String? clientEmail;
  final String quartier;
  final String? productName;
  final int? btu;
  final String? brand;
  final String status;
  final String type;
  final String? notes;
  final double totalPrice;
  final double? installationPrice;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Order({
    required this.id,
    required this.clientName,
    required this.clientPhone,
    this.clientEmail,
    required this.quartier,
    this.productName,
    this.btu,
    this.brand,
    required this.status,
    required this.type,
    this.notes,
    required this.totalPrice,
    this.installationPrice,
    required this.createdAt,
    this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id']?.toString() ?? '',
      clientName: json['client_name'] ?? json['customerName'] ?? '',
      clientPhone: json['client_phone'] ?? json['customerPhone'] ?? '',
      clientEmail:
          json['client_email']?.toString() ?? json['customerEmail']?.toString(),
      quartier: json['quartier'] ?? json['address'] ?? '',
      productName: json['product_name']?.toString(),
      btu: json['btu'] as int?,
      brand: json['brand']?.toString(),
      status: json['status'] ?? 'pending',
      type: json['type'] ?? 'vente',
      notes: json['notes']?.toString(),
      totalPrice: (json['total_price'] as num?)?.toDouble() ?? 0.0,
      installationPrice: (json['installation_price'] as num?)?.toDouble(),
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'client_name': clientName,
      'client_phone': clientPhone,
      'client_email': clientEmail,
      'quartier': quartier,
      'product_name': productName,
      'btu': btu,
      'brand': brand,
      'status': status,
      'type': type,
      'notes': notes,
      'total_price': totalPrice,
      'installation_price': installationPrice,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  String get formattedStatus {
    switch (status.toLowerCase()) {
      case 'en_attente':
        return 'En attente';
      case 'confirme':
        return 'Confirmée';
      case 'en_livraison':
        return 'En cours';
      case 'livre':
        return 'Livrée';
      case 'annule':
        return 'Annulée';
      default:
        return status;
    }
  }

  String get formattedTotal => '${totalPrice.toStringAsFixed(0)} FCFA';
}
