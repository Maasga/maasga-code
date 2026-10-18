import 'package:dio/dio.dart';
import '../models/devis.dart';
import '../../../../core/network/api_endpoints.dart';

class DevisRepository {
  final Dio _dio;

  DevisRepository(this._dio);

  Future<List<Devis>> getDevis({
    String? search,
    String? status,
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

      final response = await _dio.get(
        ApiEndpoints.devis,
        queryParameters: queryParams,
      );

      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data)
            .map((json) => Devis.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Devis> getDevisById(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.devisDetail,
        {'id': id.toString()},
      );
      final response = await _dio.get(endpoint);
      return Devis.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch devis: $e');
    }
  }

  Future<Map<String, dynamic>> getDevisStats() async {
    try {
      final response = await _dio.get(ApiEndpoints.devisStats);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      return {
        'total': {'count': 0, 'amount': 0},
        'draft': {'count': 0, 'amount': 0},
        'sent': {'count': 0, 'amount': 0},
        'accepted': {'count': 0, 'amount': 0},
      };
    }
  }

  Future<bool> createDevis(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.devis,
        data: data,
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to create devis: $e');
    }
  }

  Future<bool> updateDevisStatus(int id, String status) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.devisStatus,
        {'id': id.toString()},
      );
      final response = await _dio.patch(
        endpoint,
        data: {'status': status},
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to update devis status: $e');
    }
  }

  Future<bool> convertDevisToOrder(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.devisConvert,
        {'id': id.toString()},
      );
      final response = await _dio.post(endpoint);
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to convert devis to order: $e');
    }
  }
}