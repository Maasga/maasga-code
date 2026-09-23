import 'package:flutter/material.dart';
import '../../../../shared/widgets/placeholder_screen.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const PlaceholderScreenWithTitle(
      title: 'Notifications',
      description: 'Gestion des notifications push et messages',
      icon: Icons.notifications,
    );
  }
}
