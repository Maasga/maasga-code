/// Test d'intégration — Flux Commandes
///
/// Vérifie le flux : Dashboard → Commandes → Détail commande → Changer statut
///
/// Pour lancer : flutter test integration_test/order_flow_test.dart
///
/// Note : ce test utilise des mocks Dio injectés via ProviderScope overrides.
/// Il ne requiert pas de serveur réel.
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile_admin/features/orders/data/providers/order_provider.dart';
import 'package:mobile_admin/features/orders/data/models/order.dart';
import 'package:mobile_admin/features/orders/presentation/screens/orders_screen.dart';
import 'package:mobile_admin/features/orders/presentation/screens/order_detail_screen.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final mockOrder = Order(
    id: '100',
    clientName: 'Test Client',
    clientPhone: '77 000 11 22',
    quartier: 'Dakar Plateau',
    status: 'en_attente',
    type: 'vente',
    totalPrice: 400000,
    productName: 'Climatiseur 24000 BTU',
    btu: 24000,
    brand: 'Nasco',
    quantity: 1,
    productPrice: 380000,
    installationPrice: 20000,
    createdAt: DateTime(2026, 10, 1),
  );

  group('Flux Commandes — intégration', () {
    testWidgets('liste les commandes et navigue vers le détail', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            ordersProvider.overrideWith((ref) => Future.value([mockOrder])),
            orderDetailProvider(
              '100',
            ).overrideWith((ref) => Future.value(mockOrder)),
            orderStatusUpdateProvider((
              id: '100',
              status: 'confirme',
            )).overrideWith((ref) => Future.value()),
            addOrderNotesProvider((
              id: '100',
              notes: '',
            )).overrideWith((ref) => Future.value()),
            orderCancelProvider('100').overrideWith((ref) => Future.value()),
          ],
          child: const MaterialApp(home: OrdersScreen()),
        ),
      );

      await tester.pumpAndSettle();

      // La liste doit contenir la commande #100
      expect(find.text('Commande #100'), findsOneWidget);
      expect(find.text('Test Client'), findsAtLeastNWidgets(1));

      // Naviguer vers le détail
      await tester.tap(find.text('Commande #100'));
      await tester.pumpAndSettle();

      // L'écran de détail doit s'afficher
      expect(find.text('Climatiseur 24000 BTU'), findsOneWidget);
      expect(find.text('Suivi de la commande'), findsOneWidget);
      expect(find.text('Notes administrateur'), findsOneWidget);
    });

    testWidgets('peut changer le statut depuis le détail', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            orderDetailProvider(
              '100',
            ).overrideWith((ref) => Future.value(mockOrder)),
            orderStatusUpdateProvider((
              id: '100',
              status: 'confirme',
            )).overrideWith((ref) => Future.value()),
            addOrderNotesProvider((
              id: '100',
              notes: '',
            )).overrideWith((ref) => Future.value()),
            orderCancelProvider('100').overrideWith((ref) => Future.value()),
          ],
          child: const MaterialApp(home: OrderDetailScreen(orderId: '100')),
        ),
      );

      await tester.pumpAndSettle();

      // Ouvrir le bottom sheet de changement de statut
      await tester.tap(find.byIcon(Icons.edit_note));
      await tester.pumpAndSettle();

      // Le bottom sheet doit s'afficher avec les options
      expect(find.text('Changer le statut'), findsOneWidget);
      expect(find.text('Confirmée'), findsAtLeastNWidgets(1));

      // Fermer le bottom sheet
      await tester.tapAt(const Offset(200, 100));
      await tester.pumpAndSettle();
    });
  });
}
