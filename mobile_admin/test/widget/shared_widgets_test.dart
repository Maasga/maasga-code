import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_admin/shared/widgets/status_badge.dart';
import 'package:mobile_admin/shared/widgets/empty_state.dart';
import 'package:mobile_admin/shared/widgets/error_state.dart';
import 'package:mobile_admin/shared/widgets/stat_chip.dart';

void main() {
  group('StatusBadge Widget', () {
    testWidgets('renders label text', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatusBadge(
              label: 'En attente',
              color: Colors.orange,
            ),
          ),
        ),
      );
      expect(find.text('En attente'), findsOneWidget);
    });
  });

  group('EmptyState Widget', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'Aucune commande',
              subtitle: 'Il n\'y a rien ici.',
              icon: Icons.inbox_outlined,
            ),
          ),
        ),
      );
      expect(find.text('Aucune commande'), findsOneWidget);
      expect(find.text('Il n\'y a rien ici.'), findsOneWidget);
    });

    testWidgets('shows CTA button when provided', (tester) async {
      bool tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EmptyState(
              title: 'Vide',
              ctaLabel: 'Ajouter',
              onCta: () => tapped = true,
            ),
          ),
        ),
      );
      expect(find.text('Ajouter'), findsOneWidget);
      await tester.tap(find.text('Ajouter'));
      expect(tapped, true);
    });
  });

  group('ErrorState Widget', () {
    testWidgets('renders error message and retry button', (tester) async {
      bool retried = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ErrorState(
              message: 'Erreur réseau',
              onRetry: () => retried = true,
            ),
          ),
        ),
      );
      expect(find.text('Erreur réseau'), findsOneWidget);
      expect(find.text('Réessayer'), findsOneWidget);
      await tester.tap(find.text('Réessayer'));
      expect(retried, true);
    });
  });

  group('StatChip Widget', () {
    testWidgets('renders label and value', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatChip(
              label: 'Total',
              value: '42',
              color: Colors.blue,
            ),
          ),
        ),
      );
      expect(find.text('Total'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
    });
  });
}
