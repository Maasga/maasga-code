import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // MAASGA Brand Primary Color
  static const Color primaryColor = Color(0xFF1B3A8D);

  static ThemeData light() {
    return FlexThemeData.light(
      colors: const FlexSchemeColor(
        primary: primaryColor,
        primaryContainer: Color(0xFFD0E4FF),
        secondary: Color(0xFF0077B6),
        secondaryContainer: Color(0xFFCEE9FF),
        tertiary: Color(0xFF006875),
        tertiaryContainer: Color(0xFF95F0FF),
        appBarColor: Color(0xFFCEE9FF),
        error: Color(0xFFB00020),
      ),
      surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
      blendLevel: 7,
      subThemesData: const FlexSubThemesData(
        blendOnLevel: 10,
        blendOnColors: false,
        useMaterial3Typography: true,
        useM2StyleDividerInM3: true,
        alignedDropdown: true,
        useInputDecoratorThemeInDialogs: true,
        defaultRadius: 12.0,
        inputDecoratorBorderType: FlexInputBorderType.outline,
        inputDecoratorUnfocusedBorderIsColored: false,
      ),
      visualDensity: FlexColorScheme.comfortablePlatformDensity,
      useMaterial3: true,
      fontFamily: GoogleFonts.poppins().fontFamily,
    );
  }

  static ThemeData dark() {
    return FlexThemeData.dark(
      colors: const FlexSchemeColor(
        primary: Color(0xFFB1C5FF),
        primaryContainer: primaryColor,
        secondary: Color(0xFFB0CCFF),
        secondaryContainer: Color(0xFF004881),
        tertiary: Color(0xFF4FD8EB),
        tertiaryContainer: Color(0xFF004E59),
        appBarColor: Color(0xFF004881),
        error: Color(0xFFCF6679),
      ),
      surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
      blendLevel: 13,
      subThemesData: const FlexSubThemesData(
        blendOnLevel: 20,
        useMaterial3Typography: true,
        useM2StyleDividerInM3: true,
        alignedDropdown: true,
        useInputDecoratorThemeInDialogs: true,
        defaultRadius: 12.0,
        inputDecoratorBorderType: FlexInputBorderType.outline,
        inputDecoratorUnfocusedBorderIsColored: false,
      ),
      visualDensity: FlexColorScheme.comfortablePlatformDensity,
      useMaterial3: true,
      fontFamily: GoogleFonts.poppins().fontFamily,
    );
  }
}
