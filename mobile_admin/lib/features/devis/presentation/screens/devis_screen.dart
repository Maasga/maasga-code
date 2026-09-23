import 'package:flutter/material.dart';
import '../../../../shared/widgets/placeholder_screen.dart';

class DevisScreen extends StatelessWidget {
  const DevisScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreenWithTitle(
      title: 'Devis',
      description: 'Gestion des devis et factures proforma',
      icon: Icons.description,
    );
  }
}
