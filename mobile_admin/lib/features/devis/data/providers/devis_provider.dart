import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/devis_repository.dart';
import '../models/devis.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final devisRepositoryProvider = Provider<DevisRepository>((ref) {
  return DevisRepository(ref.watch(dioProvider));
});

// Devis list provider
final devisProvider = FutureProvider.autoDispose<List<Devis>>((ref) async {
  final repository = ref.watch(devisRepositoryProvider);
  return repository.getDevis();
});

// Devis detail provider
final devisDetailProvider = FutureProvider.autoDispose.family<Devis, int>((ref, id) async {
  final repository = ref.watch(devisRepositoryProvider);
  return repository.getDevisById(id);
});

// Devis stats provider
final devisStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(devisRepositoryProvider);
  return repository.getDevisStats();
});

// Create devis provider
final createDevisProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(devisRepositoryProvider);
  final result = await repository.createDevis(data);
  // Invalidate devis provider to refresh the list
  ref.invalidate(devisProvider);
  ref.invalidate(devisStatsProvider);
  return result;
});

// Update devis status provider
final updateDevisStatusProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(devisRepositoryProvider);
  final result = await repository.updateDevisStatus(data['id'] as int, data['status'] as String);
  // Invalidate devis provider to refresh the list
  ref.invalidate(devisProvider);
  ref.invalidate(devisStatsProvider);
  return result;
});

// Convert devis to order provider
final convertDevisProvider = FutureProvider.autoDispose.family<bool, int>((ref, id) async {
  final repository = ref.watch(devisRepositoryProvider);
  final result = await repository.convertDevisToOrder(id);
  // Invalidate devis provider to refresh the list
  ref.invalidate(devisProvider);
  ref.invalidate(devisStatsProvider);
  return result;
});