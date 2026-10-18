import 'package:dio/dio.dart';
import '../models/sav_ticket.dart';
import '../../../../core/network/api_endpoints.dart';

class SavRepository {
  final Dio _dio;

  SavRepository(this._dio);

  Future<List<SavTicket>> getSavTickets({
    String? search,
    String? status,
    String? priority,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        'offset': offset,
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }

      if (priority != null && priority.isNotEmpty) {
        queryParams['priority'] = priority;
      }

      final response = await _dio.get(
        ApiEndpoints.sav,
        queryParameters: queryParams,
      );

      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data)
            .map((json) => SavTicket.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<SavTicket> getSavTicketById(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.savDetail,
        {'id': id.toString()},
      );
      final response = await _dio.get(endpoint);
      return SavTicket.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch SAV ticket: $e');
    }
  }

  Future<Map<String, dynamic>> getSavStats() async {
    try {
      final response = await _dio.get(ApiEndpoints.savStats);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      return {
        'total': 0,
        'open': 0,
        'in_progress': 0,
        'resolved': 0,
        'urgent': 0,
      };
    }
  }

  Future<bool> createSavTicket(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.sav,
        data: data,
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to create SAV ticket: $e');
    }
  }

  Future<bool> updateSavTicketStatus(int id, String status) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.savStatus,
        {'id': id.toString()},
      );
      final response = await _dio.patch(
        endpoint,
        data: {'status': status},
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to update SAV ticket status: $e');
    }
  }

  Future<bool> assignTechnician(int id, String technician) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.savAssign,
        {'id': id.toString()},
      );
      final response = await _dio.patch(
        endpoint,
        data: {'technician': technician},
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to assign technician: $e');
    }
  }

  Future<bool> resolveSavTicket(int id, String resolution) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.savResolve,
        {'id': id.toString()},
      );
      final response = await _dio.patch(
        endpoint,
        data: {'resolution': resolution},
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to resolve SAV ticket: $e');
    }
  }
}