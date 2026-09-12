import 'package:flutter/material.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class AppointmentFilter extends StatelessWidget {
  final String selectedStatus;
  final Function(String) onStatusChanged;

  const AppointmentFilter({
    super.key,
    required this.selectedStatus,
    required this.onStatusChanged,
  });

  static const List<String> statuses = [
    'Tous',
    'En attente',
    'Confirmé',
    'Terminé',
    'Annulé',
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: statuses.length,
        itemBuilder: (context, index) {
          final status = statuses[index];
          final isSelected = status == selectedStatus;

          return Padding(
            padding: const EdgeInsets.only(right: MaasgaTokens.spacingSm),
            child: FilterChip(
              label: Text(status),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) {
                  onStatusChanged(status);
                }
              },
              selectedColor: AdminTheme.primary.withValues(alpha: 0.2),
              checkmarkColor: AdminTheme.primary,
              labelStyle: TextStyle(
                color: isSelected ? AdminTheme.primary : AdminTheme.textSecondary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              backgroundColor: AdminTheme.background,
              side: BorderSide(
                color: isSelected ? AdminTheme.primary : AdminTheme.border,
              ),
            ),
          );
        },
      ),
    );
  }
}
