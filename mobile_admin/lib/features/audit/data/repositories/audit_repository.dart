import 'package:dio/dio.dart';
import '../models/audit_log.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/app_logger.dart';

class AuditRepository {
  final Dio _dio;

  AuditRepository(this._dio);

  Future<List<AuditLog>> getAuditLogs({int limit = 50, int offset = 0}) async {
    try {
      AppLogger.info('Chargement des logs d\'audit');
      final response = await _dio.get(
        ApiEndpoints.audit,
        queryParameters: {'limit': limit, 'offset': offset},
      );
      final List<dynamic> data = response.data;
      final logs = data.map((json) => AuditLog.fromJson(json)).toList();
      AppLogger.response(ApiEndpoints.audit, response.statusCode, logs.length);
      return logs;
    } catch (e) {
      AppLogger.error(e, null, 'AuditRepository.getAuditLogs');
      throw Exception('Erreur lors du chargement des logs: $e');
    }
  }
}