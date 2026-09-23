import 'package:dio/dio.dart';
import '../models/audit_log.dart';
import '../../../../core/network/api_endpoints.dart';

class AuditRepository {
  final Dio _dio;

  AuditRepository(this._dio);

  Future<List<AuditLog>> getAuditLogs({int limit = 50, int offset = 0}) async {
    try {
      print('📋 Chargement des logs d\'audit');
      final response = await _dio.get(
        ApiEndpoints.audit,
        queryParameters: {'limit': limit, 'offset': offset},
      );
      print('✅ Logs d\'audit chargés');
      final List<dynamic> data = response.data;
      return data.map((json) => AuditLog.fromJson(json)).toList();
    } catch (e) {
      print('❌ Erreur lors du chargement des logs: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors du chargement des logs: $e');
    }
  }
}