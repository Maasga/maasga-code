import 'package:dio/dio.dart';
import '../models/dashboard_data.dart';
import '../../../../core/network/api_endpoints.dart';

class DashboardRepository {
  final Dio _dio;

  DashboardRepository(this._dio);

  Future<DashboardData> getDashboardData() async {
    try {
      print('📊 Chargement du dashboard depuis: ${ApiEndpoints.dashboard}');
      final response = await _dio.get(ApiEndpoints.dashboard);
      print('✅ Réponse reçue - Status: ${response.statusCode}');
      print('📊 Données: ${response.data}');
      return DashboardData.fromJson(response.data);
    } catch (e) {
      print('❌ Erreur lors du chargement du dashboard: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      // Fallback avec valeurs par défaut (0) si l'API échoue
      print('⚠️ Utilisation des valeurs par défaut (0) pour le dashboard');
      return _getDefaultDashboardData();
    }
  }

  DashboardData _getDefaultDashboardData() {
    return DashboardData(
      pendingRdv: 0,
      confirmedRdv: 0,
      doneRdv: 0,
      lowStock: 0,
      outOfStock: 0,
      pendingReviews: 0,
      approvedReviews: 0,
      avgNote: 0,
      estimatedCA: 0,
      rdvThisWeek: 0,
      ordersThisWeek: 0,
      rdvChartData: [
        DailyCount(day: 'Lun', count: 0),
        DailyCount(day: 'Mar', count: 0),
        DailyCount(day: 'Mer', count: 0),
        DailyCount(day: 'Jeu', count: 0),
        DailyCount(day: 'Ven', count: 0),
        DailyCount(day: 'Sam', count: 0),
        DailyCount(day: 'Dim', count: 0),
      ],
      alerts: [],
    );
  }
}
