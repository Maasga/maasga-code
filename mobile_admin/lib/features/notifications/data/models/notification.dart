class NotificationCampaign {
  final int id;
  final String title;
  final String body;
  final String targetSegment;
  final String? scheduledFor;
  final String? sentAt;
  final String status;
  final int recipientCount;
  final int openedCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  NotificationCampaign({
    required this.id,
    required this.title,
    required this.body,
    this.targetSegment = 'all',
    this.scheduledFor,
    this.sentAt,
    this.status = 'draft',
    this.recipientCount = 0,
    this.openedCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory NotificationCampaign.fromJson(Map<String, dynamic> json) {
    return NotificationCampaign(
      id: json['id'] as int,
      title: json['title'] as String,
      body: json['body'] as String,
      targetSegment: json['target_segment'] as String? ?? 'all',
      scheduledFor: json['scheduled_for'] as String?,
      sentAt: json['sent_at'] as String?,
      status: json['status'] as String? ?? 'draft',
      recipientCount: json['recipient_count'] as int? ?? 0,
      openedCount: json['opened_count'] as int? ?? 0,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'target_segment': targetSegment,
      'scheduled_for': scheduledFor,
      'sent_at': sentAt,
      'status': status,
      'recipient_count': recipientCount,
      'opened_count': openedCount,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get formattedDate => '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  String get formattedTime => '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
  String get statusLabel {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'scheduled':
        return 'Programmée';
      case 'sent':
        return 'Envoyée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  }

  String get targetSegmentLabel {
    switch (targetSegment) {
      case 'all':
        return 'Tous les utilisateurs';
      case 'active':
        return 'Utilisateurs actifs';
      case 'clients':
        return 'Clients';
      case 'subscribers':
        return 'Abonnés';
      default:
        return targetSegment;
    }
  }

  double get openRate {
    if (recipientCount == 0) return 0.0;
    return (openedCount / recipientCount * 100);
  }

  bool get isDraft => status == 'draft';
  bool get isSent => status == 'sent';
  bool get isScheduled => status == 'scheduled';
}