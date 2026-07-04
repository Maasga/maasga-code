import 'package:flutter/material.dart';

import '../../../shared/widgets/maasga_shell.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return MaasgaShell(
      title: 'Réglages',
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _Section(title: 'Langue', subtitle: 'Français', icon: Icons.language_outlined),
          _Section(title: 'Notifications', subtitle: 'Actives', icon: Icons.notifications_outlined),
          _Section(title: 'Sécurité', subtitle: 'PIN / biométrie (bientôt)', icon: Icons.security_outlined),
          _Section(title: 'Thème', subtitle: 'Clair', icon: Icons.light_mode_outlined),
          _Section(title: 'Version', subtitle: 'MAASGA Mobile v1', icon: Icons.info_outline),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.subtitle, required this.icon});

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: CircleAvatar(child: Icon(icon)),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
