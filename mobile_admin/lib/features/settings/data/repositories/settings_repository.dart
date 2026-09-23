import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class SettingsRepository {
  final Dio _dio;

  SettingsRepository(this._dio);

  Future<Map<String, dynamic>> getSettings() async {
    try {
      print('⚙️ Chargement des paramètres');
      final response = await _dio.get(ApiEndpoints.settings);
      print('✅ Paramètres chargés');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      print('❌ Erreur lors du chargement des paramètres: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors du chargement des paramètres: $e');
    }
  }

  Future<void> updateSettings(Map<String, dynamic> settings) async {
    try {
      print('⚙️ Mise à jour des paramètres');
      final response = await _dio.patch(ApiEndpoints.settings, data: settings);
      print('✅ Paramètres mis à jour');
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la mise à jour');
      }
    } catch (e) {
      print('❌ Erreur lors de la mise à jour des paramètres: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors de la mise à jour des paramètres: $e');
    }
  }
}
