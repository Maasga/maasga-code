import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final themeControllerProvider = NotifierProvider<ThemeController, ThemeMode>(() {
  return ThemeController();
});

class ThemeController extends Notifier<ThemeMode> {
  static const _key = 'theme_mode';

  @override
  ThemeMode build() {
    // Initial fetch from preferences will be done async
    // but the provider itself will start with system mode
    _loadTheme();
    return ThemeMode.system;
  }

  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final index = prefs.getInt(_key);
      if (index != null) {
        state = ThemeMode.values[index];
      }
    } catch (_) {
      // Fallback to system
    }
  }

  Future<void> toggleTheme() async {
    final current = state;
    ThemeMode next;
    
    if (current == ThemeMode.light) {
      next = ThemeMode.dark;
    } else if (current == ThemeMode.dark) {
      next = ThemeMode.system;
    } else {
      // If was system, check actual brightness to decide next
      // But for simplicity, system -> light -> dark -> system
      next = ThemeMode.light;
    }

    state = next;
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_key, next.index);
    } catch (_) {}
  }

  Future<void> setTheme(ThemeMode mode) async {
    state = mode;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_key, mode.index);
    } catch (_) {}
  }
}
