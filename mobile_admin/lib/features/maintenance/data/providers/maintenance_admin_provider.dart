import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_provider.dart';
import '../repositories/maintenance_admin_repository.dart';

final maintenanceAdminRepositoryProvider = Provider<MaintenanceAdminRepository>((ref) {
  return MaintenanceAdminRepository(ref.watch(dioProvider));
});

final maintenanceSummaryProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(maintenanceAdminRepositoryProvider);
  return repository.getSummary();
});

final maintenanceContractsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repository = ref.watch(maintenanceAdminRepositoryProvider);
  return repository.getContracts();
});

final maintenanceRequestsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repository = ref.watch(maintenanceAdminRepositoryProvider);
  return repository.getRequests();
});

final maintenanceVisitsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repository = ref.watch(maintenanceAdminRepositoryProvider);
  return repository.getVisits();
});
