import 'package:flutter/material.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class ProductFilter extends StatelessWidget {
  final String selectedCategory;
  final String? selectedBrand;
  final int? selectedBtu;
  final Function(String) onCategoryChanged;
  final Function(String?) onBrandChanged;
  final Function(int?) onBtuChanged;

  const ProductFilter({
    super.key,
    required this.selectedCategory,
    this.selectedBrand,
    this.selectedBtu,
    required this.onCategoryChanged,
    required this.onBrandChanged,
    required this.onBtuChanged,
  });

  static const List<String> categories = [
    'Tous',
    'Mural/Split',
    'Climatiseurs',
  ];

  static const List<String> btuRanges = [
    'Tous',
    '0-5000 BTU',
    '5000-9000 BTU',
    '9000-12000 BTU',
    '12000-18000 BTU',
    '18000+ BTU',
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Filtre catégorie
        SizedBox(
          height: 40,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final category = categories[index];
              final isSelected = category == selectedCategory;

              return Padding(
                padding: const EdgeInsets.only(right: MaasgaTokens.spacingSm),
                child: FilterChip(
                  label: Text(category),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) {
                      onCategoryChanged(category);
                    }
                  },
                  selectedColor: AdminTheme.primary.withValues(alpha: 0.2),
                  checkmarkColor: AdminTheme.primary,
                  labelStyle: TextStyle(
                    color: isSelected
                        ? AdminTheme.primary
                        : AdminTheme.textSecondary,
                    fontWeight: isSelected
                        ? FontWeight.bold
                        : FontWeight.normal,
                  ),
                  backgroundColor: AdminTheme.background,
                  side: BorderSide(
                    color: isSelected ? AdminTheme.primary : AdminTheme.border,
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: MaasgaTokens.spacingSm),
        // Filtre BTU
        SizedBox(
          height: 40,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: btuRanges.length,
            itemBuilder: (context, index) {
              final btuRange = btuRanges[index];
              final isSelected = _isBtuSelected(btuRange);

              return Padding(
                padding: const EdgeInsets.only(right: MaasgaTokens.spacingSm),
                child: FilterChip(
                  label: Text(btuRange),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) {
                      onBtuChanged(_getBtuValue(btuRange));
                    } else {
                      onBtuChanged(null);
                    }
                  },
                  selectedColor: AdminTheme.primary.withValues(alpha: 0.2),
                  checkmarkColor: AdminTheme.primary,
                  labelStyle: TextStyle(
                    color: isSelected
                        ? AdminTheme.primary
                        : AdminTheme.textSecondary,
                    fontWeight: isSelected
                        ? FontWeight.bold
                        : FontWeight.normal,
                  ),
                  backgroundColor: AdminTheme.background,
                  side: BorderSide(
                    color: isSelected ? AdminTheme.primary : AdminTheme.border,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  bool _isBtuSelected(String btuRange) {
    if (selectedBtu == null) return btuRange == 'Tous';
    return _getBtuValue(btuRange) == selectedBtu;
  }

  int? _getBtuValue(String btuRange) {
    switch (btuRange) {
      case '0-5000 BTU':
        return 5000;
      case '5000-9000 BTU':
        return 9000;
      case '9000-12000 BTU':
        return 12000;
      case '12000-18000 BTU':
        return 18000;
      case '18000+ BTU':
        return 999999;
      default:
        return null;
    }
  }
}
