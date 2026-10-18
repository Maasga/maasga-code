import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_admin/features/clients/data/providers/client_provider.dart';
import 'package:mobile_admin/features/clients/data/models/client.dart';
import 'package:mobile_admin/features/clients/presentation/screens/client_detail_screen.dart';

void main() {
  final testClient = Client(
    id: '7',
    name: 'Mariama Diallo',
    phone: '76 888 99 00',
    email: 'mariama@test.sn',
    quartier: 'Fann',
    adressePrecise: '15 Rue de Fann',
    notes: 'Client fidèle depuis 2022',
    orderCount: 4,
    rdvCount: 6,
    createdAt: DateTime(2022, 3, 15),
  );

  Widget buildWidget() {
    return ProviderScope(
      overrides: [
        clientOrdersProvider('7').overrideWith((ref) => Future.value([
              {'id': 101, 'total_price': 300000, 'status': 'livre', 'product_name': 'Daikin 18000 BTU'},
              {'id': 102, 'total_price': 180000, 'status': 'confirme', 'product_name': 'General 12000 BTU'},
            ])),
        clientRdvProvider('7').overrideWith((ref) => Future.value([
              {'id': 20, 'date': '2026-10-15', 'status': 'confirmed', 'quartier': 'Fann'},
              {'id': 21, 'date': '2026-11-01', 'status': 'pending', 'quartier': 'Fann'},
            ])),
      ],
      child: MaterialApp(
        home: ClientDetailScreen(client: testClient),
      ),
    );
  }

  group('ClientDetailScreen', () {
    testWidgets('affiche le nom du client dans l\'AppBar', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('Mariama Diallo'), findsAtLeastNWidgets(1));
    });

    testWidgets('affiche les 3 onglets', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('Infos'), findsOneWidget);
      expect(find.text('Commandes'), findsOneWidget);
      expect(find.text('RDV'), findsOneWidget);
    });

    testWidgets('onglet Infos affiche le téléphone et email', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();

      expect(find.text('76 888 99 00'), findsAtLeastNWidgets(1));
      expect(find.text('mariama@test.sn'), findsAtLeastNWidgets(1));
    });

    testWidgets('onglet Infos affiche le quartier et l\'adresse', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();

      expect(find.text('Fann'), findsAtLeastNWidgets(1));
    });

    testWidgets('onglet Infos affiche les badges commandes et RDV', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();

      expect(find.text('4 commandes'), findsOneWidget);
      expect(find.text('6 RDV'), findsOneWidget);
    });

    testWidgets('onglet Commandes affiche les commandes', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();

      // Naviguer vers l'onglet Commandes
      await tester.tap(find.text('Commandes'));
      await tester.pumpAndSettle();

      expect(find.text('Commande #101'), findsOneWidget);
      expect(find.text('Daikin 18000 BTU'), findsOneWidget);
    });

    testWidgets('onglet RDV affiche les rendez-vous', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pumpAndSettle();

      // Naviguer vers l'onglet RDV
      await tester.tap(find.text('RDV'));
      await tester.pumpAndSettle();

      expect(find.text('RDV #20'), findsOneWidget);
      expect(find.text('RDV #21'), findsOneWidget);
    });

    testWidgets('affiche le bouton Modifier dans l\'AppBar', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.byIcon(Icons.edit), findsOneWidget);
    });
  });
}
