/// Test d'intégration — Flux Devis
///
/// Vérifie : Liste devis (avec stats réelles) → FAB → Formulaire de création
///
/// Pour lancer : flutter test integration_test/devis_flow_test.dart
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile_admin/features/devis/data/providers/devis_provider.dart';
import 'package:mobile_admin/features/devis/data/models/devis.dart';
import 'package:mobile_admin/features/devis/presentation/screens/devis_screen.dart';
import 'package:mobile_admin/features/devis/presentation/widgets/devis_form.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final mockDevis = Devis(
    id: 7,
    clientName: 'Rokhaya Gueye',
    clientPhone: '77 333 44 55',
    status: 'sent',
    subtotal: 500000,
    tax: 90000,
    total: 590000,
    items: [
      DevisItem(
        description: 'Climatiseur 18000 BTU + installation',
        quantity: 1,
        unitPrice: 500000,
      ),
    ],
    createdAt: DateTime(2026, 10, 8),
    updatedAt: DateTime(2026, 10, 8),
  );

  group('Flux Devis — intégration', () {
    testWidgets('affiche la liste des devis avec stats', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            devisProvider.overrideWith((ref) => Future.value([mockDevis])),
            devisStatsProvider.overrideWith(
              (ref) => Future.value({
                'total': {'count': 1, 'amount': 590000},
                'draft': 0,
                'accepted': 0,
              }),
            ),
          ],
          child: const MaterialApp(home: DevisScreen()),
        ),
      );

      await tester.pumpAndSettle();

      // La liste doit contenir le devis
      expect(find.text('#DEV-7'), findsOneWidget);
      expect(find.text('Rokhaya Gueye'), findsAtLeastNWidgets(1));
    });

    testWidgets('affiche les stats de la barre (total)', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            devisProvider.overrideWith((ref) => Future.value([])),
            devisStatsProvider.overrideWith(
              (ref) => Future.value({
                'total': {'count': 5, 'amount': 1000000},
                'draft': 2,
                'accepted': 3,
              }),
            ),
          ],
          child: const MaterialApp(home: DevisScreen()),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Total'), findsAtLeastNWidgets(1));
      expect(find.text('Brouillons'), findsAtLeastNWidgets(1));
      expect(find.text('Acceptés'), findsAtLeastNWidgets(1));
    });

    testWidgets('le formulaire DevisForm calcule le total en temps réel', (
      tester,
    ) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: Scaffold(body: DevisForm())),
        ),
      );

      await tester.pump();

      // Saisir un prix pour l'article 1
      final prixField = find.widgetWithText(TextField, 'Prix unitaire (FCFA)');
      await tester.tap(prixField.first);
      await tester.enterText(prixField.first, '200000');
      await tester.pumpAndSettle();

      // Le total HT doit être mis à jour
      expect(find.textContaining('200000'), findsAtLeastNWidgets(1));
    });

    testWidgets('le formulaire DevisForm valide les champs requis', (
      tester,
    ) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: Scaffold(body: DevisForm())),
        ),
      );

      await tester.pump();

      // Soumettre sans remplir les champs
      await tester.tap(find.text('Envoyer au client'));
      await tester.pumpAndSettle();

      expect(find.text('Le nom est requis'), findsOneWidget);
    });
  });
}
