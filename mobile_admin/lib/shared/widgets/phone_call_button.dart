import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/admin_theme.dart';

/// Bouton d'appel téléphonique direct.
class PhoneCallButton extends StatelessWidget {
  final String phone;
  final String? label;
  final bool compact;

  const PhoneCallButton({
    super.key,
    required this.phone,
    this.label,
    this.compact = false,
  });

  Future<void> _call() async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (compact) {
      return IconButton(
        onPressed: _call,
        icon: const Icon(Icons.phone, color: AdminTheme.success),
        tooltip: 'Appeler $phone',
      );
    }
    return OutlinedButton.icon(
      onPressed: _call,
      icon: const Icon(Icons.phone, size: 18, color: AdminTheme.success),
      label: Text(
        label ?? phone,
        style: const TextStyle(color: AdminTheme.success),
      ),
      style: OutlinedButton.styleFrom(
        side: const BorderSide(color: AdminTheme.success),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}
