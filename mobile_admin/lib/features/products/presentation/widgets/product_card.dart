import 'package:flutter/material.dart';
import '../../data/models/product.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const ProductCard({
    super.key,
    required this.product,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AdminTheme.surface,
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusLg),
        border: Border.all(color: AdminTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Image du produit
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AdminTheme.background,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(MaasgaTokens.radiusLg),
                bottomLeft: Radius.circular(MaasgaTokens.radiusLg),
              ),
            ),
            child: product.imageUrl != null
                ? ClipRRect(
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(MaasgaTokens.radiusLg),
                      bottomLeft: Radius.circular(MaasgaTokens.radiusLg),
                    ),
                    child: Image.network(
                      product.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(
                          Icons.image,
                          color: AdminTheme.textSecondary,
                        );
                      },
                    ),
                  )
                : const Icon(Icons.image, color: AdminTheme.textSecondary),
          ),

          // Informations du produit
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    product.brand,
                    style: TextStyle(
                      fontSize: 12,
                      color: AdminTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        product.formattedPrice,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AdminTheme.primary,
                        ),
                      ),
                      const SizedBox(width: MaasgaTokens.spacingSm),
                      if (product.btu != null)
                        Text(
                          '${product.btu} BTU',
                          style: TextStyle(
                            fontSize: 11,
                            color: AdminTheme.textSecondary,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  _buildStockBadge(),
                ],
              ),
            ),
          ),

          // Actions
          Padding(
            padding: const EdgeInsets.all(MaasgaTokens.spacingSm),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, size: 20),
                  onPressed: onEdit,
                  color: AdminTheme.info,
                ),
                IconButton(
                  icon: const Icon(Icons.delete, size: 20),
                  onPressed: onDelete,
                  color: AdminTheme.error,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStockBadge() {
    Color badgeColor;
    if (product.stock == 0) {
      badgeColor = AdminTheme.error;
    } else if (product.stock <= 5) {
      badgeColor = AdminTheme.warning;
    } else {
      badgeColor = AdminTheme.success;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
      ),
      child: Text(
        '${product.stock} en stock',
        style: TextStyle(
          fontSize: 10,
          color: badgeColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
