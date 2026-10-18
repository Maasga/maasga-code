class SavTicket {
  final int id;
  final int? clientId;
  final String clientName;
  final String clientPhone;
  final String? clientEmail;
  final String? equipmentType;
  final String? serialNumber;
  final String issueDescription;
  final String priority;
  final String status;
  final String? assignedTechnician;
  final String? resolution;
  final String? resolutionDate;
  final DateTime createdAt;
  final DateTime updatedAt;

  SavTicket({
    required this.id,
    this.clientId,
    required this.clientName,
    required this.clientPhone,
    this.clientEmail,
    this.equipmentType,
    this.serialNumber,
    required this.issueDescription,
    this.priority = 'normal',
    this.status = 'open',
    this.assignedTechnician,
    this.resolution,
    this.resolutionDate,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SavTicket.fromJson(Map<String, dynamic> json) {
    return SavTicket(
      id: json['id'] as int,
      clientId: json['client_id'] as int?,
      clientName: json['client_name'] as String,
      clientPhone: json['client_phone'] as String,
      clientEmail: json['client_email'] as String?,
      equipmentType: json['equipment_type'] as String?,
      serialNumber: json['serial_number'] as String?,
      issueDescription: json['issue_description'] as String,
      priority: json['priority'] as String? ?? 'normal',
      status: json['status'] as String? ?? 'open',
      assignedTechnician: json['assigned_technician'] as String?,
      resolution: json['resolution'] as String?,
      resolutionDate: json['resolution_date'] as String?,
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
      'equipment_type': equipmentType,
      'serial_number': serialNumber,
      'issue_description': issueDescription,
      'priority': priority,
      'status': status,
      'assigned_technician': assignedTechnician,
      'resolution': resolution,
      'resolution_date': resolutionDate,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get formattedDate => '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  String get formattedTime => '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';
  String get statusLabel {
    switch (status) {
      case 'open':
        return 'Ouvert';
      case 'in_progress':
        return 'En cours';
      case 'resolved':
        return 'Résolu';
      case 'closed':
        return 'Fermé';
      default:
        return status;
    }
  }

  String get priorityLabel {
    switch (priority) {
      case 'low':
        return 'Faible';
      case 'normal':
        return 'Normal';
      case 'high':
        return 'Élevé';
      case 'urgent':
        return 'Urgent';
      default:
        return priority;
    }
  }

  bool get isUrgent => priority == 'urgent';
  bool get isHigh => priority == 'high';
  bool get isOpen => status == 'open';
  bool get isInProgress => status == 'in_progress';
  bool get isResolved => status == 'resolved';
}