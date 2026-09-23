import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/settings_repository.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  return SettingsRepository(ref.watch(dioProvider));
});

// Settings provider
final settingsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(settingsRepositoryProvider);
  return repository.getSettings();
});

// Update settings provider
final updateSettingsProvider =
    FutureProvider.family<void, Map<String, dynamic>>((ref, settings) async {
      final repository = ref.watch(settingsRepositoryProvider);
      await repository.updateSettings(settings);
      ref.invalidate(settingsProvider);
    });
