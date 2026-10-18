import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_admin/features/devis/data/providers/devis_provider.dart';
import 'package:mobile_admin/features/devis/presentation/widgets/devis_form.dart';

void main() {
  Widget buildWidget({bool createSuccess = true}) {
    return ProviderScope(
      overrides: [
        if (!createSuccess)
          createDevisProvider({}).overrideWith(
            (ref) => Future.error('Erreur réseau'),
          ),
      ],
      child: const MaterialApp(
        home: Scaffold(body: DevisForm()),
      ),
    );
  }

  group('DevisForm', () {
    testWidgets('affiche les champs client', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.widgetWithText(TextFormField, 'Nom du client *'),
          findsOneWidget);
      expect(find.widgetWithText(TextFormField, 'Téléphone *'), findsOneWidget);
    });

    testWidgets('affiche le bouton Envoyer au client', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('Envoyer au client'), findsOneWidget);
    });

    testWidgets('affiche le bouton Brouillon', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('Brouillon'), findsOneWidget);
    });

    testWidgets('affiche le récapitulatif total TTC', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('Total TTC'), findsOneWidget);
    });

    testWidgets('valide les champs requis vides', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      // Tap Envoyer sans remplir les champs
      final sendButton = find.text('Envoyer au client');
      await tester.ensureVisible(sendButton);
      await tester.tap(sendButton);
      await tester.pump(); // permet le rendu de la validation

      // Au moins un message de validation doit apparaître
      expect(
        find.textContaining('requis').evaluate().isNotEmpty ||
        find.textContaining('Requis').evaluate().isNotEmpty,
        isTrue,
      );
    });

    testWidgets('bouton Ajouter crée un nouvel item', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      // Un item de base existe déjà
      expect(find.text('Article 1'), findsOneWidget);

      // Ajouter un deuxième article
      await tester.tap(find.text('Ajouter'));
      await tester.pumpAndSettle();

      expect(find.text('Article 2'), findsOneWidget);
    });

    testWidgets('affiche le total à 0 FCFA par défaut', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('0 FCFA'), findsAtLeastNWidgets(1));
    });
  });
}
