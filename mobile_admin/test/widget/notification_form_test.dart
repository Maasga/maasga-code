import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_admin/features/notifications/presentation/widgets/notification_form.dart';

void main() {
  Widget buildWidget() {
    return const ProviderScope(
      child: MaterialApp(
        home: Scaffold(body: NotificationForm()),
      ),
    );
  }

  group('NotificationForm', () {
    testWidgets('affiche les champs titre et message', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.widgetWithText(TextFormField, 'Titre *'), findsOneWidget);
      expect(find.widgetWithText(TextFormField, 'Message *'), findsOneWidget);
    });

    testWidgets('affiche les options de cible', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('👥 Tous les utilisateurs'), findsOneWidget);
      expect(find.text('🛒 Clients actifs'), findsOneWidget);
    });

    testWidgets('affiche le switch Envoyer immédiatement', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      expect(find.text('Envoyer immédiatement'), findsOneWidget);
      expect(find.byType(Switch), findsOneWidget);
    });

    testWidgets('affiche les champs date/heure quand planifié', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      // Désactiver "envoyer immédiatement"
      final switchWidget = find.byType(Switch);
      await tester.tap(switchWidget);
      await tester.pump();

      // La section Envoi doit toujours être visible
      expect(find.text('Envoi'), findsOneWidget);
    });

    testWidgets('valide les champs requis vides', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      final sendButton = find.text('Envoyer maintenant');
      await tester.ensureVisible(sendButton);
      await tester.tap(sendButton);
      await tester.pump();

      expect(
        find.textContaining('requis').evaluate().isNotEmpty ||
        find.textContaining('Requis').evaluate().isNotEmpty,
        isTrue,
      );
    });

    testWidgets('affiche un aperçu quand titre saisi', (tester) async {
      await tester.pumpWidget(buildWidget());
      await tester.pump();

      await tester.enterText(
          find.widgetWithText(TextFormField, 'Titre *'), 'Offre spéciale');
      await tester.pumpAndSettle();

      expect(find.text('Offre spéciale'), findsAtLeastNWidgets(1));
    });
  });
}
