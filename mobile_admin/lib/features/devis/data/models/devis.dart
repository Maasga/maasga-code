import 'dart:convert';

class Devis {
  final int id;
  final int? clientId;
  final String clientName;
  final String clientPhone;
  final String? clientEmail;
  final List<DevisItem> items;
  final double subtotal;
  final double tax;
  final double total;
  final String status;
  final String? notes;
  final String? validUntil;
  final DateTime createdAt;
  final DateTime updatedAt;

  Devis({
    required this.id,
    this.clientId,
    required this.clientName,
    required this.clientPhone,
    this.clientEmail,
    required this.items,
    required this.subtotal,
    this.tax = 0,
    required this.total,
    this.status = 'draft',
    this.notes,
    this.validUntil,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Devis.fromJson(Map<String, dynamic> json) {
    List<DevisItem> parseItems(dynamic itemsJson) {
      if (itemsJson is String) {
        try {
          final List<dynamic> parsed = jsonDecode(itemsJson);
          return parsed.map((item) => DevisItem.fromJson(item)).toList();
        } catch (_) {
          return [];
        }
      } else if (itemsJson is List) {
        return itemsJson.map((item) => DevisItem.fromJson(item)).toList();
      }
      return [];
    }

    return Devis(
      id: json['id'] as int,
      clientId: json['client_id'] as int?,
      clientName: json['client_name'] as String,
      clientPhone: json['client_phone'] as String,
      clientEmail: json['client_email'] as String?,
      items: parseItems(json['items']),
      subtotal: (json['subtotal'] as num).toDouble(),
      tax: (json['tax'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num).toDouble(),
      status: json['status'] as String? ?? 'draft',
      notes: json['notes'] as String?,
      validUntil: json['valid_until'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'client_id': clientId,
      'client_name': clientName,
      'client_phone': clientPhone,
      'client_email': clientEmail,
      'items': jsonEncode(items.map((item) => item.toJson()).toList()),
      'subtotal': subtotal,
      'tax': tax,
      'total': total,
      'status': status,
      'notes': notes,
      'valid_until': validUntil,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get formattedTotal => '${total.toStringAsFixed(0)} F CFA';
  String get formattedDate =>
      '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  String get statusLabel {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyé';
      case 'accepted':
        return 'Accepté';
      case 'rejected':
        return 'Refusé';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  }
}

class DevisItem {
  final String description;
  final int quantity;
  final double unitPrice;
  final double total;

  DevisItem({
    required this.description,
    required this.quantity,
    required this.unitPrice,
  }) : total = quantity * unitPrice;

  factory DevisItem.fromJson(Map<String, dynamic> json) {
    return DevisItem(
      description: json['description'] as String,
      quantity: json['quantity'] as int,
      unitPrice: (json['unit_price'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'description': description,
      'quantity': quantity,
      'unit_price': unitPrice,
      'total': total,
    };
  }
}
