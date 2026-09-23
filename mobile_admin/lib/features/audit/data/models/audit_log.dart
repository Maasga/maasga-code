class AuditLog {
  final String id;
  final String action;
  final String? detail;
  final String? ip;
  final String? userAgent;
  final DateTime createdAt;

  AuditLog({
    required this.id,
    required this.action,
    this.detail,
    this.ip,
    this.userAgent,
    required this.createdAt,
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) {
    return AuditLog(
      id: json['id']?.toString() ?? '',
      action: json['action'] ?? '',
      detail: json['detail']?.toString(),
      ip: json['ip']?.toString(),
      userAgent: json['user_agent']?.toString(),
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }

  String get formattedDate {
    return '${createdAt.day}/${createdAt.month}/${createdAt.year} ${createdAt.hour}:${createdAt.minute.toString().padLeft(2, '0')}';
  }

  String get actionIcon {
    switch (action.toLowerCase()) {
      case 'create':
      case 'add':
        return '➕';
      case 'update':
      case 'edit':
        return '✏️';
      case 'delete':
      case 'remove':
        return '🗑️';
      case 'login':
        return '🔐';
      case 'logout':
        return '🚪';
      case 'approve':
        return '✅';
      case 'reject':
        return '❌';
      case 'cancel':
        return '⏹️';
      case 'confirm':
        return '📋';
      default:
        return '📝';
    }
  }

  String get actionColor {
    switch (action.toLowerCase()) {
      case 'create':
      case 'add':
      case 'approve':
      case 'confirm':
        return 'green';
      case 'update':
      case 'edit':
        return 'blue';
      case 'delete':
      case 'remove':
      case 'reject':
      case 'cancel':
        return 'red';
      case 'login':
        return 'purple';
      case 'logout':
        return 'orange';
      default:
        return 'gray';
    }
  }
}