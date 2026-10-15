import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/brand.dart';
import '../../data/providers/brand_provider.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';

class BrandCard extends ConsumerWidget {
  final Brand brand;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const BrandCard({
    super.key,
    required this.brand,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
      child: Padding(
        padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
        child: Row(
          children: [
            // ── Logo ───────────────────────────────────────────────────
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AdminTheme.background,
                borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                border: Border.all(color: AdminTheme.border),
              ),
              child: brand.logoUrl != null && brand.logoUrl!.isNotEmpty
                  ? ClipRRect(
                      borderRadius:
                          BorderRadius.circular(MaasgaTokens.radiusMd),
                      child: Image.network(
                        brand.logoUrl!,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.branding_watermark_outlined,
                          size: 28,
                        ),
                      ),
                    )
                  : const Icon(
                      Icons.branding_watermark_outlined,
                      size: 28,
                    ),
            ),
            const SizedBox(width: MaasgaTokens.spacingMd),
            // ── Infos ──────────────────────────────────────────────────
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    brand.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  if (brand.assetKey != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      brand.assetKey!,
                      style: TextStyle(
                        fontSize: 12,
                        color: AdminTheme.textSecondary,
                      ),
                    ),
                  ],
                  const SizedBox(height: 4),
                  Chip(
                    label: Text('Ordre: ${brand.displayOrder}'),
                    padding: EdgeInsets.zero,
                    labelStyle: const TextStyle(fontSize: 11),
                    backgroundColor:
                        AdminTheme.primary.withValues(alpha: 0.1),
                  ),
                ],
              ),
            ),
            // ── Toggle actif ──────────────────────────────────────────
            Switch(
              value: brand.isActive,
              onChanged: (value) async {
                try {
                  await ref.read(
                    toggleBrandProvider((
                      id: brand.id,
                      isActive: value,
                    )).future,
                  );
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Erreur: $e')),
                    );
                  }
                }
              },
            ),
            // ── Actions ───────────────────────────────────────────────
            IconButton(
              onPressed: onEdit,
              icon: const Icon(Icons.edit),
              color: AdminTheme.primary,
              tooltip: 'Modifier',
            ),
            IconButton(
              onPressed: onDelete,
              icon: const Icon(Icons.delete),
              color: AdminTheme.error,
              tooltip: 'Supprimer',
            ),
          ],
        ),
      ),
    );
  }
}
