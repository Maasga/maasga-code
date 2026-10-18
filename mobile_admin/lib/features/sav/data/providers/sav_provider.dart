import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/sav_repository.dart';
import '../models/sav_ticket.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final savRepositoryProvider = Provider<SavRepository>((ref) {
  return SavRepository(ref.watch(dioProvider));
});

// SAV tickets list provider
final savTicketsProvider = FutureProvider.autoDispose<List<SavTicket>>((ref) async {
  final repository = ref.watch(savRepositoryProvider);
  return repository.getSavTickets();
});

// SAV ticket detail provider
final savTicketDetailProvider = FutureProvider.autoDispose.family<SavTicket, int>((ref, id) async {
  final repository = ref.watch(savRepositoryProvider);
  return repository.getSavTicketById(id);
});

// SAV stats provider
final savStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(savRepositoryProvider);
  return repository.getSavStats();
});

// Create SAV ticket provider
final createSavTicketProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(savRepositoryProvider);
  final result = await repository.createSavTicket(data);
  // Invalidate SAV tickets provider to refresh the list
  ref.invalidate(savTicketsProvider);
  ref.invalidate(savStatsProvider);
  return result;
});

// Update SAV ticket status provider
final updateSavTicketStatusProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(savRepositoryProvider);
  final result = await repository.updateSavTicketStatus(data['id'] as int, data['status'] as String);
  // Invalidate SAV tickets provider to refresh the list
  ref.invalidate(savTicketsProvider);
  ref.invalidate(savStatsProvider);
  return result;
});

// Assign technician provider
final assignTechnicianProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(savRepositoryProvider);
  final result = await repository.assignTechnician(data['id'] as int, data['technician'] as String);
  // Invalidate SAV tickets provider to refresh the list
  ref.invalidate(savTicketsProvider);
  ref.invalidate(savStatsProvider);
  return result;
});

// Resolve SAV ticket provider
final resolveSavTicketProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(savRepositoryProvider);
  final result = await repository.resolveSavTicket(data['id'] as int, data['resolution'] as String);
  // Invalidate SAV tickets provider to refresh the list
  ref.invalidate(savTicketsProvider);
  ref.invalidate(savStatsProvider);
  return result;
});