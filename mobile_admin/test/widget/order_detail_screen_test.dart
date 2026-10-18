import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_admin/features/orders/data/providers/order_provider.dart';
import 'package:mobile_admin/features/orders/data/models/order.dart';
import 'package:mobile_admin/features/orders/presentation/screens/order_detail_screen.dart';

void main() {
  final testOrder = Order(
    id: '42',
    clientName: 'Abdoulaye Sarr',
    clientPhone: '77 444 55 66',
    clientEmail: 'abdoulaye@test.sn',
    quartier: 'Sicap Liberté',
    productName: 'Climatiseur 12000 BTU',
    btu: 12000,
    brand: 'Mitsubishi',
    status: 'en_attente',
    type: 'vente',
    totalPrice: 275000,
    installationPrice: 25000,
    productId: 5,
    quantity: 1,
    productPrice: 250000,
    createdAt: DateTime(2026, 10, 1),
  );

  Widget buildTestWidget(Order order) {
    return ProviderScope(
      overrides: [
        orderDetailProvider('42').overrideWith(
          (ref) => Future.value(order),
        ),
        orderStatusUpdateProvider(
          (id: '42', status: 'confirme'),
        ).overrideWith((ref) => Future.value()),
        addOrderNotesProvider(
          (id: '42', notes: 'test'),
        ).overrideWith((ref) => Future.value()),
      ],
      child: const MaterialApp(
        home: OrderDetailScreen(orderId: '42'),
      ),
    );
  }

  group('OrderDetailScreen', () {
    testWidgets('affiche le nom du client', (tester) async {
      await tester.pumpWidget(buildTestWidget(testOrder));
      await tester.pumpAndSettle();

      expect(find.text('Abdoulaye Sarr'), findsAtLeastNWidgets(1));
    });

    testWidgets('affiche le produit commandé', (tester) async {
      await tester.pumpWidget(buildTestWidget(testOrder));
      await tester.pumpAndSettle();

      expect(find.text('Climatiseur 12000 BTU'), findsOneWidget);
    });

    testWidgets('affiche le statut en_attente', (tester) async {
      await tester.pumpWidget(buildTestWidget(testOrder));
      await tester.pumpAndSettle();

      expect(find.text('En attente'), findsAtLeastNWidgets(1));
    });

    testWidgets('affiche la section Notes administrateur', (tester) async {
      await tester.pumpWidget(buildTestWidget(testOrder));
      await tester.pumpAndSettle();

      expect(find.text('Notes administrateur'), findsOneWidget);
    });

    testWidgets('affiche le bouton Sauvegarder dans la section notes',
        (tester) async {
      await tester.pumpWidget(buildTestWidget(testOrder));
      await tester.pumpAndSettle();

      expect(find.text('Sauvegarder'), findsOneWidget);
    });

    testWidgets('affiche la timeline de suivi', (tester) async {
      await tester.pumpWidget(buildTestWidget(testOrder));
      await tester.pumpAndSettle();

      expect(find.text('Suivi de la commande'), findsOneWidget);
      expect(find.text('Confirmée'), findsAtLeastNWidgets(1));
      expect(find.text('Livrée'), findsAtLeastNWidgets(1));
    });

    testWidgets('affiche loading state pendant le chargement', (tester) async {
      final completer = Completer<Order>();
      final widget = ProviderScope(
        overrides: [
          orderDetailProvider('42').overrideWith(
            (ref) => completer.future,
          ),
        ],
        child: const MaterialApp(
          home: OrderDetailScreen(orderId: '42'),
        ),
      );

      await tester.pumpWidget(widget);
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Compléter le future pour éviter les timers en attente
      completer.complete(testOrder);
      await tester.pumpAndSettle();
    });

    testWidgets('affiche erreur state sur exception', (tester) async {
      final widget = ProviderScope(
        overrides: [
          orderDetailProvider('42').overrideWith(
            (ref) => Future.error('Connexion impossible'),
          ),
        ],
        child: const MaterialApp(
          home: OrderDetailScreen(orderId: '42'),
        ),
      );

      await tester.pumpWidget(widget);
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.error_outline), findsOneWidget);
      expect(find.text('Réessayer'), findsOneWidget);
    });
  });
}
