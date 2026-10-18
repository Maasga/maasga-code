import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_admin/core/constants/app_status.dart';

void main() {
  group('AppStatus - Order colors and labels', () {
    test('orderColor returns amber for en_attente', () {
      final color = AppStatus.orderColor(AppStatus.orderPending);
      expect(color.value, 0xFFF59E0B);
    });

    test('orderColor returns blue for confirme', () {
      final color = AppStatus.orderColor(AppStatus.orderConfirmed);
      expect(color.value, 0xFF3B82F6);
    });

    test('orderColor returns green for livre', () {
      final color = AppStatus.orderColor(AppStatus.orderDelivered);
      expect(color.value, 0xFF10B981);
    });

    test('orderColor returns red for annule', () {
      final color = AppStatus.orderColor(AppStatus.orderCancelled);
      expect(color.value, 0xFFEF4444);
    });

    test('orderLabel returns correct French labels', () {
      expect(AppStatus.orderLabel(AppStatus.orderPending), 'En attente');
      expect(AppStatus.orderLabel(AppStatus.orderConfirmed), 'Confirmée');
      expect(AppStatus.orderLabel(AppStatus.orderInDelivery), 'En livraison');
      expect(AppStatus.orderLabel(AppStatus.orderDelivered), 'Livrée');
      expect(AppStatus.orderLabel(AppStatus.orderCancelled), 'Annulée');
    });
  });

  group('AppStatus - Payment colors and labels', () {
    test('paymentColor returns green for completed', () {
      expect(AppStatus.paymentColor('completed').value, 0xFF10B981);
    });

    test('paymentColor returns red for failed', () {
      expect(AppStatus.paymentColor('failed').value, 0xFFEF4444);
    });

    test('paymentLabel returns correct French labels', () {
      expect(AppStatus.paymentLabel('completed'), 'Payé');
      expect(AppStatus.paymentLabel('pending'), 'En attente');
      expect(AppStatus.paymentLabel('failed'), 'Échoué');
      expect(AppStatus.paymentLabel('refunded'), 'Remboursé');
    });
  });

  group('AppStatus - SAV colors and labels', () {
    test('savColor returns red for critical', () {
      expect(AppStatus.savColor(AppStatus.savCritical).value, 0xFFEF4444);
    });

    test('savLabel returns correct French labels', () {
      expect(AppStatus.savLabel('open'), 'Ouvert');
      expect(AppStatus.savLabel('in_progress'), 'En cours');
      expect(AppStatus.savLabel('resolved'), 'Résolu');
      expect(AppStatus.savLabel('closed'), 'Fermé');
      expect(AppStatus.savLabel('critical'), 'Critique');
    });
  });

  group('AppStatus - Devis labels', () {
    test('devisLabel returns correct French labels', () {
      expect(AppStatus.devisLabel('draft'), 'Brouillon');
      expect(AppStatus.devisLabel('sent'), 'Envoyé');
      expect(AppStatus.devisLabel('accepted'), 'Accepté');
      expect(AppStatus.devisLabel('rejected'), 'Refusé');
    });
  });
}
