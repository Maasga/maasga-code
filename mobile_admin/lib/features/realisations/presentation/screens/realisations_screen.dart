import 'package:flutter/material.dart';
import '../../../../shared/widgets/placeholder_screen.dart';

class RealisationsScreen extends StatelessWidget {
  const RealisationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreenWithTitle(
      title: 'Réalisations',
      description: 'Galerie des réalisations et projets',
      icon: Icons.photo_library,
    );
  }
}
