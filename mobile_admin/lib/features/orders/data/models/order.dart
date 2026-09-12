class Order {
  final String id;
  final String customerName;
  final String customerPhone;
  final String customerEmail;
  final String address;
  final List<OrderItem> items;
  final double totalAmount;
  final String status;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String? notes;

  Order({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    required this.customerEmail,
    required this.address,
    required this.items,
    required this.totalAmount,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    this.notes,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final itemsList = json['items'] as List<dynamic>?;
    return Order(
      id: json['id']?.toString() ?? '',
      customerName: json['customer_name'] ?? json['customerName'] ?? '',
      customerPhone: json['customer_phone'] ?? json['customerPhone'] ?? '',
      customerEmail: json['customer_email'] ?? json['customerEmail'] ?? '',
      address: json['address'] ?? '',
      items: itemsList?.map((item) => OrderItem.fromJson(item)).toList() ?? [],
      totalAmount: (json['total_amount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] ?? 'pending',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at']) : null,
      notes: json['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customer_name': customerName,
      'customer_phone': customerPhone,
      'customer_email': customerEmail,
      'address': address,
      'items': items.map((item) => item.toJson()).toList(),
      'total_amount': totalAmount,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'notes': notes,
    };
  }

  String get formattedStatus {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'in_progress':
        return 'En cours';
      case 'delivered':
        return 'Livrée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  }

  String get formattedTotal => '${totalAmount.toStringAsFixed(0)} FCFA';
}

class OrderItem {
  final String productId;
  final String productName;
  final int quantity;
  final double price;

  OrderItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.price,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      productId: json['product_id']?.toString() ?? json['productId'] ?? '',
      productName: json['product_name'] ?? json['productName'] ?? '',
      quantity: json['quantity'] as int? ?? 0,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'product_name': productName,
      'quantity': quantity,
      'price': price,
    };
  }

  double get total => quantity * price;
}
