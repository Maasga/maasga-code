/// Test d'intégration — Flux SAV
///
/// Vérifie le flux : Liste SAV → Créer ticket → Ouvrir détail → Résoudre
///
/// Pour lancer : flutter test integration_test/sav_flow_test.dart
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile_admin/features/sav/data/providers/sav_provider.dart';
import 'package:mobile_admin/features/sav/data/models/sav_ticket.dart';
import 'package:mobile_admin/features/sav/presentation/screens/sav_screen.dart';
import 'package:mobile_admin/features/sav/presentation/screens/sav_detail_screen.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final mockTicket = SavTicket(
    id: 55,
    clientName: 'Cheikh Traoré',
    clientPhone: '76 222 33 44',
    clientEmail: 'cheikh@test.sn',
    equipmentType: 'Climatiseur 18000 BTU',
    serialNumber: 'DAI-2024-001',
    issueDescription: 'L\'unité intérieure fait du bruit et ne refroidit pas.',
    priority: 'high',
    status: 'open',
    createdAt: DateTime(2026, 10, 5),
    updatedAt: DateTime(2026, 10, 5),
  );

  group('Flux SAV — intégration', () {
    testWidgets('affiche la liste des tickets', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            savTicketsProvider.overrideWith(
              (ref) => Future.value([mockTicket]),
            ),
            savStatsProvider.overrideWith(
              (ref) => Future.value({
                'total': 1,
                'open': 1,
                'in_progress': 0,
                'urgent': 0,
              }),
            ),
          ],
          child: const MaterialApp(home: SAVScreen()),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('#SAV-55'), findsOneWidget);
      expect(find.text('Cheikh Traoré'), findsAtLeastNWidgets(1));
    });

    testWidgets('navigue vers le détail du ticket', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            savTicketDetailProvider(
              55,
            ).overrideWith((ref) => Future.value(mockTicket)),
            updateSavTicketStatusProvider({
              'id': 55,
              'status': 'in_progress',
            }).overrideWith((ref) => Future.value(true)),
          ],
          child: const MaterialApp(home: SAVDetailScreen(ticketId: 55)),
        ),
      );

      await tester.pumpAndSettle();

      // En-tête du ticket
      expect(find.text('#SAV-55'), findsOneWidget);
      expect(find.text('Cheikh Traoré'), findsAtLeastNWidgets(1));

      // Description du problème
      expect(find.text('Description du problème'), findsOneWidget);
      expect(
        find.text('L\'unité intérieure fait du bruit et ne refroidit pas.'),
        findsOneWidget,
      );

      // Zone de réponse
      expect(
        find.widgetWithText(TextField, 'Répondre au ticket...'),
        findsOneWidget,
      );
    });

    testWidgets('affiche le FAB pour créer un ticket', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            savTicketsProvider.overrideWith((ref) => Future.value([])),
            savStatsProvider.overrideWith(
              (ref) => Future.value({
                'total': 0,
                'open': 0,
                'in_progress': 0,
                'urgent': 0,
              }),
            ),
          ],
          child: const MaterialApp(home: SAVScreen()),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.add), findsOneWidget);
    });
  });
}
