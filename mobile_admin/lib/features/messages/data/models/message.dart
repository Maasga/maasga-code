class ClientMessage {
  final int id;
  final int? clientId;
  final String clientName;
  final String clientPhone;
  final String? clientEmail;
  final String? subject;
  final String message;
  final String status;
  final String? adminResponse;
  final String? respondedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  ClientMessage({
    required this.id,
    this.clientId,
    required this.clientName,
    required this.clientPhone,
    this.clientEmail,
    this.subject,
    required this.message,
    this.status = 'unread',
    this.adminResponse,
    this.respondedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ClientMessage.fromJson(Map<String, dynamic> json) {
    return ClientMessage(
      id: json['id'] as int,
      clientId: json['client_id'] as int?,
      clientName: json['client_name'] as String,
      clientPhone: json['client_phone'] as String,
      clientEmail: json['client_email'] as String?,
      subject: json['subject'] as String?,
      message: json['message'] as String,
      status: json['status'] as String? ?? 'unread',
      adminResponse: json['admin_response'] as String?,
      respondedAt: json['responded_at'] as String?,
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
      'subject': subject,
      'message': message,
      'status': status,
      'admin_response': adminResponse,
      'responded_at': respondedAt,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get formattedDate => '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  String get formattedTime => '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
  String get statusLabel {
    switch (status) {
      case 'unread':
        return 'Non lu';
      case 'read':
        return 'Lu';
      case 'responded':
        return 'Répondu';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  }

  bool get isUnread => status == 'unread';
  bool get isResponded => status == 'responded';
}