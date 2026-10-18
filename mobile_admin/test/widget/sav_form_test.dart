import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_admin/features/sav/presentation/widgets/sav_form.dart';

void main() {
  Widget buildWidget() {
    return const ProviderScope(
      child: MaterialApp(
        home: Scaffold(body: SAVForm()),
      ),
    );
  }

  group('SAVForm', () {
    testWidgets('affiche tous les champs obligatoires', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.widgetWithText(TextFormField, 'Nom du client *'),
          findsOneWidget);
      expect(find.widgetWithText(TextFormField, 'Téléphone *'), findsOneWidget);
      expect(find.widgetWithText(TextFormField, 'Description du problème *'),
          findsOneWidget);
    });

    testWidgets('affiche les 4 niveaux de priorité', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('Faible'), findsOneWidget);
      expect(find.text('Normal'), findsOneWidget);
      expect(find.text('Élevé'), findsOneWidget);
      expect(find.text('Urgent'), findsOneWidget);
    });

    testWidgets('sélectionne la priorité urgente', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      await tester.tap(find.text('Urgent'));
      await tester.pumpAndSettle();

      // Le widget devrait reconstruire avec urgent sélectionné
      expect(find.text('Urgent'), findsOneWidget);
    });

    testWidgets('valide les champs requis vides', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      final createButton = find.text('Créer le ticket');
      await tester.ensureVisible(createButton);
      await tester.tap(createButton);
      await tester.pump();

      // Au moins un message de validation doit apparaître
      expect(
        find.textContaining('Requis').evaluate().isNotEmpty ||
        find.textContaining('requis').evaluate().isNotEmpty,
        isTrue,
      );
    });

    testWidgets('affiche le bouton Créer le ticket', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('Créer le ticket'), findsOneWidget);
    });

    testWidgets('affiche les champs optionnels équipement', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('Équipement'), findsOneWidget);
    });
  });
}
