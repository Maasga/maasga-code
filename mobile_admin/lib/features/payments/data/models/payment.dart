class Payment {
  final int id;
  final int? orderId;
  final int? clientId;
  final double amount;
  final String currency;
  final String status;
  final String? paymentMethod;
  final String? transactionId;
  final String? ligdiStatus;
  final String? ligdiResponse;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  Payment({
    required this.id,
    this.orderId,
    this.clientId,
    required this.amount,
    this.currency = 'XOF',
    this.status = 'pending',
    this.paymentMethod,
    this.transactionId,
    this.ligdiStatus,
    this.ligdiResponse,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] as int,
      orderId: json['order_id'] as int?,
      clientId: json['client_id'] as int?,
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'XOF',
      status: json['status'] as String? ?? 'pending',
      paymentMethod: json['payment_method'] as String?,
      transactionId: json['transaction_id'] as String?,
      ligdiStatus: json['ligdi_status'] as String?,
      ligdiResponse: json['ligdi_response'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_id': orderId,
      'client_id': clientId,
      'amount': amount,
      'currency': currency,
      'status': status,
      'payment_method': paymentMethod,
      'transaction_id': transactionId,
      'ligdi_status': ligdiStatus,
      'ligdi_response': ligdiResponse,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get formattedAmount => '${amount.toStringAsFixed(0)} $currency';
  String get formattedDate => '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  String get formattedTime => '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';

  String get statusLabel {
    switch (status) {
      case 'completed':
        return 'Payé';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  }
}