import 'package:flutter/material.dart';
import '../../../../shared/widgets/placeholder_screen.dart';

class SAVScreen extends StatelessWidget {
  const SAVScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreenWithTitle(
      title: 'SAV',
      description: 'Service Après-Vente et support client',
      icon: Icons.support_agent,
    );
  }
}
