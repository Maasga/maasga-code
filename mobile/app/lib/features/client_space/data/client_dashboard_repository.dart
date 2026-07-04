import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/commande.dart';
import '../domain/contrat_maintenance.dart';
import '../domain/rendez_vous.dart';
import '../domain/user_profile.dart';

class ClientDashboardData {
  ClientDashboardData({
    required this.profile,
    required this.orders,
    required this.rdvs,
    required this.maintenanceContracts,
    required this.freeMaintenances,
    required this.payments,
  });

  final UserProfile profile;
  final List<Commande> orders;
  final List<RendezVous> rdvs;
  final List<ContratMaintenance> maintenanceContracts;
  final List<dynamic> freeMaintenances;
  final List<dynamic> payments;
}

class ClientDashboardRepository {
  ClientDashboardRepository(this._dio);
  final Dio _dio;

  Future<ClientDashboardData> fetchDashboard() async {
    final response = await _dio.get('/api/mobile/client-dashboard');
    final data = response.data as Map<String, dynamic>? ?? const {};
    
    return ClientDashboardData(
      profile: UserProfile.fromJson((data['client'] as Map?)?.cast<String, dynamic>() ?? {}),
      orders: (data['orders'] as List<dynamic>?)?.map((o) => Commande.fromJson(o)).toList() ?? [],
      rdvs: (data['rdvs'] as List<dynamic>?)?.map((r) => RendezVous.fromJson(r)).toList() ?? [],
      maintenanceContracts: (data['maintenanceContracts'] as List<dynamic>?)?.map((m) => ContratMaintenance.fromJson(m)).toList() ?? [],
      freeMaintenances: data['freeMaintenances'] as List<dynamic>? ?? [],
      payments: data['payments'] as List<dynamic>? ?? const [],
    );
  }

  Future<void> handleDevisAction(String orderId, String action, {String? reason}) async {
    await _dio.post('/api/mobile/order/$orderId/devis-action', data: {
      'action': action,
      'reason': reason,
    });
  }


}

final clientDashboardRepositoryProvider = FutureProvider<ClientDashboardRepository>((
  ref,
) async {
  final dio = await ref.watch(dioProvider.future);
  return ClientDashboardRepository(dio);
});

final clientDashboardProvider = FutureProvider<ClientDashboardData>((ref) async {
  final repo = await ref.watch(clientDashboardRepositoryProvider.future);
  return repo.fetchDashboard();
});
