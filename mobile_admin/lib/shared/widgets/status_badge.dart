import 'package:flutter/material.dart';

/// Badge de statut réutilisable avec couleur et libellé dynamiques.
class StatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final double fontSize;
  final EdgeInsets? padding;

  const StatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.fontSize = 11,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ??
          const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.6)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
