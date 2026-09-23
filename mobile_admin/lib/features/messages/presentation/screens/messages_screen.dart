import 'package:flutter/material.dart';
import '../../../../shared/widgets/placeholder_screen.dart';

class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreenWithTitle(
      title: 'Messages',
      description: 'Boîte de réception et gestion des messages',
      icon: Icons.message,
    );
  }
}
