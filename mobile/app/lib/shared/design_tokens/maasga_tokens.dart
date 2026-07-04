import 'package:flutter/material.dart';

class MaasgaTokens {
  static const Color white = Color(0xFFFFFFFF);
  static const Color bgSoft = Color(0xFFF4FAFF);
  static const Color bgMuted = Color(0xFFE9F4FF);
  static const Color blue900 = Color(0xFF0B3F8A);
  static const Color blue700 = Color(0xFF0077B6);
  static const Color cyan500 = Color(0xFF00B4D8);
  static const Color cyan300 = Color(0xFF7CD9EA);
  static const Color textPrimary = Color(0xFF101828);
  static const Color textSecondary = Color(0xFF475467);
  static const Color success = Color(0xFF12B76A);
  static const double radiusMd = 16;
  static const double radiusLg = 24;
  static const double radiusPill = 999;
  static const double spaceMd = 16;
  static const double spaceLg = 24;

  static const LinearGradient brandGradient = LinearGradient(
    colors: [blue900, cyan500],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient pageGradient = LinearGradient(
    colors: [bgSoft, white, bgMuted],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // Styles de saisie pour garantir la lisibilité (fix contrastes)
  static const TextStyle inputTextStyle = TextStyle(
    color: textPrimary,
    fontSize: 15,
    fontWeight: FontWeight.w500,
  );
}
