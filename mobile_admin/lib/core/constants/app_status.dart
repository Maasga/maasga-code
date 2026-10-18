import 'package:flutter/material.dart';

/// Constantes de statuts centralisées pour toute l'application MaasGa Admin.
class AppStatus {
  // ── Commandes ────────────────────────────────────────────────
  static const String orderPending = 'en_attente';
  static const String orderConfirmed = 'confirme';
  static const String orderInDelivery = 'en_livraison';
  static const String orderDelivered = 'livre';
  static const String orderInstalled = 'installe';
  static const String orderCancelled = 'annule';

  // ── Rendez-vous ──────────────────────────────────────────────
  static const String rdvPending = 'pending';
  static const String rdvConfirmed = 'confirmed';
  static const String rdvDone = 'done';
  static const String rdvCancelled = 'cancelled';

  // ── Devis ────────────────────────────────────────────────────
  static const String devisDraft = 'draft';
  static const String devisSent = 'sent';
  static const String devisAccepted = 'accepted';
  static const String devisRejected = 'rejected';

  // ── Paiements ────────────────────────────────────────────────
  static const String paymentPending = 'pending';
  static const String paymentCompleted = 'completed';
  static const String paymentFailed = 'failed';
  static const String paymentRefunded = 'refunded';

  // ── SAV ──────────────────────────────────────────────────────
  static const String savOpen = 'open';
  static const String savInProgress = 'in_progress';
  static const String savResolved = 'resolved';
  static const String savClosed = 'closed';
  static const String savCritical = 'critical';

  // ── Messages ─────────────────────────────────────────────────
  static const String messageUnread = 'unread';
  static const String messageRead = 'read';
  static const String messageResponded = 'responded';

  // ── Helpers couleurs ─────────────────────────────────────────

  /// Retourne la couleur associée au statut d'une commande.
  static Color orderColor(String status) {
    switch (status.toLowerCase()) {
      case orderPending:
        return const Color(0xFFF59E0B);
      case orderConfirmed:
        return const Color(0xFF3B82F6);
      case orderInDelivery:
        return const Color(0xFF8B5CF6);
      case orderDelivered:
      case orderInstalled:
        return const Color(0xFF10B981);
      case orderCancelled:
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  /// Retourne la couleur associée au statut d'un paiement.
  static Color paymentColor(String status) {
    switch (status.toLowerCase()) {
      case paymentCompleted:
        return const Color(0xFF10B981);
      case paymentPending:
        return const Color(0xFFF59E0B);
      case paymentFailed:
        return const Color(0xFFEF4444);
      case paymentRefunded:
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFF64748B);
    }
  }

  /// Retourne la couleur associée au statut d'un SAV.
  static Color savColor(String status) {
    switch (status.toLowerCase()) {
      case savOpen:
        return const Color(0xFF3B82F6);
      case savInProgress:
        return const Color(0xFFF59E0B);
      case savResolved:
        return const Color(0xFF10B981);
      case savClosed:
        return const Color(0xFF64748B);
      case savCritical:
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  /// Retourne le libellé français du statut d'une commande.
  static String orderLabel(String status) {
    switch (status.toLowerCase()) {
      case orderPending:
        return 'En attente';
      case orderConfirmed:
        return 'Confirmée';
      case orderInDelivery:
        return 'En livraison';
      case orderDelivered:
        return 'Livrée';
      case orderInstalled:
        return 'Installée';
      case orderCancelled:
        return 'Annulée';
      default:
        return status;
    }
  }

  /// Retourne le libellé français du statut d'un devis.
  static String devisLabel(String status) {
    switch (status.toLowerCase()) {
      case devisDraft:
        return 'Brouillon';
      case devisSent:
        return 'Envoyé';
      case devisAccepted:
        return 'Accepté';
      case devisRejected:
        return 'Refusé';
      default:
        return status;
    }
  }

  /// Retourne le libellé français du statut d'un paiement.
  static String paymentLabel(String status) {
    switch (status.toLowerCase()) {
      case paymentCompleted:
        return 'Payé';
      case paymentPending:
        return 'En attente';
      case paymentFailed:
        return 'Échoué';
      case paymentRefunded:
        return 'Remboursé';
      default:
        return status;
    }
  }

  /// Retourne le libellé français du statut d'un SAV.
  static String savLabel(String status) {
    switch (status.toLowerCase()) {
      case savOpen:
        return 'Ouvert';
      case savInProgress:
        return 'En cours';
      case savResolved:
        return 'Résolu';
      case savClosed:
        return 'Fermé';
      case savCritical:
        return 'Critique';
      default:
        return status;
    }
  }
}
