import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';

class MaintenanceAdminRepository {
  final Dio _dio;

  MaintenanceAdminRepository(this._dio);

  Future<Map<String, dynamic>> getSummary() async {
    try {
      final response = await _dio.get(ApiEndpoints.maintenanceSummary);
      if (response.data is Map<String, dynamic>) {
        return response.data;
      }
      return {
        'active_contracts': 0,
        'pending_contracts': 0,
        'pending_requests': 0,
        'due_visits': 0,
        'total_visits': 0,
      };
    } catch (_) {
      return {
        'active_contracts': 0,
        'pending_contracts': 0,
        'pending_requests': 0,
        'due_visits': 0,
        'total_visits': 0,
      };
    }
  }

  Future<List<Map<String, dynamic>>> getContracts() async {
    try {
      final response = await _dio.get(ApiEndpoints.maintenanceContracts);
      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getRequests() async {
    try {
      final response = await _dio.get(ApiEndpoints.maintenanceRequests);
      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getVisits() async {
    try {
      final response = await _dio.get(ApiEndpoints.maintenanceVisits);
      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> activateContract(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.maintenanceActivateContract,
        {'id': id.toString()},
      );
      final response = await _dio.post(endpoint);
      return response.data?['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateRequestStatus(int id, String status) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.maintenanceRequestStatus,
        {'id': id.toString()},
      );
      final response = await _dio.post(endpoint, data: {'status': status});
      return response.data?['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> validateVisit(
    int id, {
    String? technician,
    String? actions,
    String? notes,
  }) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.maintenanceValidateVisit,
        {'id': id.toString()},
      );
      final response = await _dio.post(
        endpoint,
        data: {
          'technician': technician ?? 'Technicien MAASGA',
          'actions': actions ?? 'Entretien effectué',
          'notes': notes ?? '',
        },
      );
      return response.data?['success'] == true;
    } catch (e) {
      return false;
    }
  }
}
