class VisiteContrat {
  VisiteContrat({
    required this.date,
    required this.technicianName,
    required this.isCompleted,
  });

  final String date;
  final String technicianName;
  final bool isCompleted;

  factory VisiteContrat.fromJson(Map<String, dynamic> json) {
    return VisiteContrat(
      date: json['date'] ?? '',
      technicianName: json['technician_name'] ?? 'Inconnu',
      isCompleted: json['is_completed'] ?? false,
    );
  }
}

class ContratMaintenance {
  ContratMaintenance({
    required this.id,
    required this.type,
    required this.period,
    required this.price,
    required this.status,
    required this.visites,
    required this.visitesEffectuees,
    required this.visitesTotales,
    required this.quartier,
    required this.planType,
    this.invoiceUrl,
  });

  final String id;
  final String type; // ex: Trimestriel (3 visites/an)
  final String period; // ex: Février 2026 - Février 2027
  final String price; // ex: 50 000 FCFA
  final String status; // ex: Actif
  final List<VisiteContrat> visites;
  final int visitesEffectuees;
  final int visitesTotales;
  final String quartier;
  final String planType;
  final String? invoiceUrl;

  factory ContratMaintenance.fromJson(Map<String, dynamic> json) {
    final visitesList = (json['visites'] as List<dynamic>?)
            ?.map((v) => VisiteContrat.fromJson(v as Map<String, dynamic>))
            .toList() ??
        [];
    return ContratMaintenance(
      id: json['id']?.toString() ?? '',
      type: json['type'] ?? 'Contrat de maintenance',
      period: json['period'] ?? '',
      price: json['price'] ?? '0 FCFA',
      status: json['status'] ?? 'Actif',
      visites: visitesList,
      visitesEffectuees: (json['visites_effectuees'] as int?) ?? 0,
      visitesTotales: (json['visites_totales'] as int?) ?? 1,
      quartier: json['quartier'] ?? 'Ouagadougou',
      planType: json['plan_type'] ?? '',
      invoiceUrl: json['invoice_url'],
    );
  }
}
