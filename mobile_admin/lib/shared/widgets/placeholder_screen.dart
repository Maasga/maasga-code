import 'package:flutter/material.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class PlaceholderScreenWithTitle extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;

  const PlaceholderScreenWithTitle({
    super.key,
    required this.title,
    this.description = 'Fonctionnalité en développement',
    this.icon = Icons.construction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: AdminTheme.textSecondary),
          const SizedBox(height: MaasgaTokens.spacingMd),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          Text(
            description,
            style: TextStyle(color: AdminTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}