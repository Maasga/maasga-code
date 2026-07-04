import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../shared/widgets/main_bottom_nav.dart';
import '../../../shared/widgets/maasga_primary_button.dart';
import '../../../shared/widgets/maasga_shell.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  static final Uri _whatsAppUri = Uri.parse(
    'https://wa.me/22655996418?text=Bonjour%20MAASGA,%20j%27ai%20besoin%20d%27assistance.',
  );

  @override
  Widget build(BuildContext context) {
    return MaasgaShell(
      title: 'Support',
      bottomNavigationBar: const MainBottomNav(currentPath: '/service'),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Support client',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            const Text('V1: support via WhatsApp. Le chat in-app arrive en V2.'),
            const SizedBox(height: 20),
            MaasgaPrimaryButton(
              label: 'Contacter sur WhatsApp',
              icon: Icons.chat_bubble_outline,
              onPressed: () async {
                await launchUrl(_whatsAppUri, mode: LaunchMode.externalApplication);
              },
            ),
          ],
        ),
      ),
    );
  }
}
