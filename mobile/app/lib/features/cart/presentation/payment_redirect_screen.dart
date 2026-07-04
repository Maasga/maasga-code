import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../shared/widgets/maasga_primary_button.dart';

class PaymentRedirectScreen extends StatelessWidget {
  const PaymentRedirectScreen({super.key, required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Paiement')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Paiement Ligdicash',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 20),
            ),
            const SizedBox(height: 12),
            const Text(
              'Le paiement est lancé dans votre navigateur sécurisé. Revenez ensuite dans l’application pour suivre la commande.',
            ),
            const SizedBox(height: 20),
            MaasgaPrimaryButton(
              onPressed: () async {
                final uri = Uri.parse(url);
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              },
              icon: Icons.open_in_new,
              label: 'Ouvrir le lien de paiement',
            ),
            const SizedBox(height: 8),
            Text(url, style: const TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
