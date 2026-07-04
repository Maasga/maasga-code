import 'dart:convert';


enum CommandeStatus {
  pending,
  paid,
  validationTerrain,
  devisEnAttente,
  devisValide,
  devisRefuse,
  livre,
  installed,
  cancelled,
  refunded,
  unknown;

  String get label {
    switch (this) {
      case pending: return 'En attente';
      case paid: return 'Payée';
      case validationTerrain: return 'Validation terrain';
      case devisEnAttente: return 'Devis envoyé';
      case devisValide: return 'Devis accepté';
      case devisRefuse: return 'Devis refusé';
      case livre: return 'Livrée';
      case installed: return 'Installée';
      case cancelled: return 'Annulée';
      case refunded: return 'Remboursée';
      case unknown: return 'Inconnu';
    }
  }

  static CommandeStatus fromString(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'en attente':
        return CommandeStatus.pending;
      case 'paid':
      case 'payée':
      case 'payee':
        return CommandeStatus.paid;
      case 'validation_terrain':
        return CommandeStatus.validationTerrain;
      case 'devis_en_attente':
        return CommandeStatus.devisEnAttente;
      case 'devis_valide':
        return CommandeStatus.devisValide;
      case 'devis_refuse':
        return CommandeStatus.devisRefuse;
      case 'livre':
      case 'livrée':
        return CommandeStatus.livre;
      case 'installed':
      case 'installée':
        return CommandeStatus.installed;
      case 'cancelled':
      case 'annulée':
        return CommandeStatus.cancelled;
      case 'refunded':
      case 'remboursée':
        return CommandeStatus.refunded;
      default:
        return CommandeStatus.unknown;
    }
  }

}

class Commande {
  Commande({
    required this.id,
    required this.productName,
    required this.date,
    required this.price,
    required this.status,
    required this.currentStep,
    this.productImage,
    this.invoiceUrl,
    // New Devis Fields
    this.devisNumero,
    this.produitPrix,
    this.produitQuantite,
    this.installationPrix,
    this.accessoires,
    this.remise,
    this.expiresAt,
    this.acceptedAt,
    this.devisStatus,
    this.brand,
    this.btu,
    this.totalHt,
    this.messageClient,
    this.devisClientEmail,
    this.devisClientQuartier,
    this.clientId,
  });

  final String id;
  final String productName;
  final String date;
  final String price;
  final CommandeStatus status;
  final int currentStep;
  final String? productImage;
  final String? invoiceUrl;
  final int? clientId;

  // New Devis Fields
  final String? devisNumero;
  final int? produitPrix;
  final int? produitQuantite;
  final int? installationPrix;
  final List<dynamic>? accessoires;
  final int? remise;
  final String? expiresAt;
  final String? acceptedAt;
  final String? devisStatus;
  final String? brand;
  final int? btu;
  final int? totalHt;
  final String? messageClient;
  final String? devisClientEmail;
  final String? devisClientQuartier;

  factory Commande.fromJson(Map<String, dynamic> json) {
    // Universal price mapping with all possible keys
    dynamic rawPrice = json['price'] ?? json['total_price'] ?? json['climatiseur_prix'] ?? json['total_amount'] ?? json['produit_prix'];
    String formattedPrice = '0 FCFA';

    if (rawPrice != null) {
      // Clean everything that is not a digit to avoid parsing errors
      final s = rawPrice.toString().replaceAll(RegExp(r'\D'), '');
      if (s.isNotEmpty) {
        final val = int.tryParse(s) ?? 0;
        final reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
        formattedPrice = '${val.toString().replaceAllMapped(reg, (Match m) => '${m[1]} ')} FCFA';
      }
    }

    // Accessoires parsing
    List<dynamic>? parsedAccs;
    if (json['accessoires'] != null) {
      if (json['accessoires'] is String && json['accessoires'].toString().startsWith('[')) {
        try {
          parsedAccs = jsonDecode(json['accessoires'] as String) as List<dynamic>;
        } catch (_) {}
      } else if (json['accessoires'] is List) {
        parsedAccs = json['accessoires'] as List<dynamic>;
      }
    }

    int? safeInt(dynamic v) {
      if (v == null) return null;
      if (v is num) return v.toInt();
      if (v is String) {
        final cleaned = v.replaceAll(RegExp(r'[^0-9]'), '');
        return int.tryParse(cleaned);
      }
      return null;
    }

    return Commande(
      id: json['id']?.toString() ?? '',
      productName: json['product_name'] ?? json['climatiseur_nom'] ?? json['produit_nom'] ?? 'Produit MAASGA',
      date: json['date'] ?? json['created_at'] ?? '',
      price: formattedPrice,
      status: CommandeStatus.fromString(json['status']),
      currentStep: safeInt(json['current_step']) ?? 1,
      productImage: json['product_image'],
      invoiceUrl: json['invoice_url'],
      devisNumero: json['devis_numero'] ?? json['numero'],
      produitPrix: safeInt(json['produit_prix'] ?? json['climatiseur_prix'] ?? json['total_price'] ?? json['total_amount']),
      produitQuantite: safeInt(json['produit_quantite']) ?? 1,
      installationPrix: safeInt(json['installation_prix'] ?? json['main_oeuvre_prix']),
      accessoires: parsedAccs ?? (json['fournitures'] is String ? jsonDecode(json['fournitures']) : json['fournitures']),
      remise: safeInt(json['remise']),
      totalHt: safeInt(json['devis_total_ht'] ?? json['total_amount']),
      messageClient: json['message_client'],
      devisClientEmail: json['devis_client_email'],
      devisClientQuartier: json['devis_client_quartier'],
      expiresAt: json['expires_at'],
      acceptedAt: json['accepted_at'],
      devisStatus: json['devis_status'] ?? json['status'],
      brand: json['brand'],
      btu: safeInt(json['btu'] ?? json['produit_btu']),
      clientId: safeInt(json['client_id']),
    );
  }
}
