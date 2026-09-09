import 'package:flutter/material.dart';

class AdminTheme {
  // Couleurs
  static const Color primary = Color(0xFF1A1A2E);
  static const Color primaryLight = Color(0xFF16213E);
  static const Color accent = Color(0xFFD4AF37);
  static const Color success = Color(0xFF34D399);
  static const Color warning = Color(0xFFFBBF24);
  static const Color error = Color(0xFFF87171);
  static const Color info = Color(0xFF38BDF8);

  // Backgrounds
  static const Color bgDark = Color(0xFF0F0F1A);
  static const Color cardBg = Color(0xFF1A1A2E);
  static const Color cardBgLight = Color(0xFFF8FAFC);

  // Text
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textMutedLight = Color(0xFF64748B);

  // Border
  static const Color border = Color(0xFF334155);
  static const Color borderLight = Color(0xFFE2E8F0);

  // Shadows
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.1),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> get elevatedShadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.15),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];
}
