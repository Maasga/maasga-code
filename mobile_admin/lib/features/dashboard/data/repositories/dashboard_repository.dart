import 'package:dio/dio.dart';
import '../models/dashboard_data.dart';
import '../../../core/network/api_endpoints.dart';

class DashboardRepository {
  final Dio _dio;

  DashboardRepository(this._dio);

  Future<DashboardData> getDashboardData() async {
    try {
      final response = await _dio.get(ApiEndpoints.dashboard);
      return DashboardData.fromJson(response.data);
    } catch (e) {
      throw Exception('Erreur lors du chargement du dashboard: $e');
    }
  }
}
