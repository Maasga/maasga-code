import 'package:flutter/material.dart';
import '../../../../shared/widgets/placeholder_screen.dart';

class PaiementsScreen extends StatelessWidget {
  const PaiementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreenWithTitle(
      title: 'Paiements',
      description: 'Gestion des paiements et synchronisation LigdiCash',
      icon: Icons.payment,
    );
  }
}
