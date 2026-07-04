import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';

class MaintenanceRepository {
  MaintenanceRepository(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> submitRequest(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/api/maintenance/request', data: data);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw e.response?.data?['error'] ?? 'Une erreur est survenue lors de l\'envoi de votre demande.';
    } catch (e) {
      throw 'Erreur réseau. Veuillez réessayer.';
    }
  }
}

final maintenanceRepositoryProvider = FutureProvider<MaintenanceRepository>((ref) async {
  final dio = await ref.watch(dioProvider.future);
  return MaintenanceRepository(dio);
});
