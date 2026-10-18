import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/realisation_repository.dart';
import '../models/realisation.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final realisationRepositoryProvider = Provider<RealisationRepository>((ref) {
  return RealisationRepository(ref.watch(dioProvider));
});

// Realisations list provider
final realisationsProvider = FutureProvider.autoDispose<List<Realisation>>((ref) async {
  final repository = ref.watch(realisationRepositoryProvider);
  return repository.getRealisations();
});

// Realisation detail provider
final realisationDetailProvider = FutureProvider.autoDispose.family<Realisation, int>((ref, id) async {
  final repository = ref.watch(realisationRepositoryProvider);
  return repository.getRealisationById(id);
});

// Realisations stats provider
final realisationsStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(realisationRepositoryProvider);
  return repository.getRealisationsStats();
});

// Create realisation provider
final createRealisationProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(realisationRepositoryProvider);
  final result = await repository.createRealisation(data);
  // Invalidate realisations provider to refresh the list
  ref.invalidate(realisationsProvider);
  ref.invalidate(realisationsStatsProvider);
  return result;
});

// Update realisation provider
final updateRealisationProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(realisationRepositoryProvider);
  final result = await repository.updateRealisation(data['id'] as int, data);
  // Invalidate realisations provider to refresh the list
  ref.invalidate(realisationsProvider);
  ref.invalidate(realisationsStatsProvider);
  return result;
});

// Toggle featured provider
final toggleFeaturedProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(realisationRepositoryProvider);
  final result = await repository.toggleFeatured(data['id'] as int, data['featured'] as bool);
  // Invalidate realisations provider to refresh the list
  ref.invalidate(realisationsProvider);
  ref.invalidate(realisationsStatsProvider);
  return result;
});

// Delete realisation provider
final deleteRealisationProvider = FutureProvider.autoDispose.family<bool, int>((ref, id) async {
  final repository = ref.watch(realisationRepositoryProvider);
  final result = await repository.deleteRealisation(id);
  // Invalidate realisations provider to refresh the list
  ref.invalidate(realisationsProvider);
  ref.invalidate(realisationsStatsProvider);
  return result;
});