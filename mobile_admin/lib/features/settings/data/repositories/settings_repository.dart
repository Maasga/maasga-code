import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/app_logger.dart';

class SettingsRepository {
  final Dio _dio;

  SettingsRepository(this._dio);

  Future<Map<String, dynamic>> getSettings() async {
    try {
      AppLogger.info('Chargement des paramètres');
      final response = await _dio.get(ApiEndpoints.settings);
      AppLogger.response(ApiEndpoints.settings, response.statusCode);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      AppLogger.error(e, null, 'SettingsRepository.getSettings');
      throw Exception('Erreur lors du chargement des paramètres: $e');
    }
  }

  Future<void> updateSettings(Map<String, dynamic> settings) async {
    try {
      AppLogger.info('Mise à jour des paramètres');
      final response = await _dio.patch(ApiEndpoints.settings, data: settings);
      AppLogger.response(ApiEndpoints.settings, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la mise à jour');
      }
    } catch (e) {
      AppLogger.error(e, null, 'SettingsRepository.updateSettings');
      throw Exception('Erreur lors de la mise à jour des paramètres: $e');
    }
  }
}

