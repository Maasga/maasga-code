import 'package:flutter/material.dart';
import '../../core/theme/admin_theme.dart';

/// Widget d'état vide réutilisable avec message, icône et CTA optionnel.
class EmptyState extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData icon;
  final String? ctaLabel;
  final VoidCallback? onCta;

  const EmptyState({
    super.key,
    required this.title,
    this.subtitle,
    this.icon = Icons.inbox_outlined,
    this.ctaLabel,
    this.onCta,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AdminTheme.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(40),
              ),
              child: Icon(
                icon,
                size: 40,
                color: AdminTheme.primary.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AdminTheme.textPrimary,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: AdminTheme.textSecondary,
                ),
              ),
            ],
            if (ctaLabel != null && onCta != null) ...[
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: onCta,
                style: AdminTheme.primaryButtonStyle,
                child: Text(ctaLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
