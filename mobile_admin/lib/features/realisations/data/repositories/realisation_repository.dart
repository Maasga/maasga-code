import 'package:dio/dio.dart';
import '../models/realisation.dart';
import '../../../../core/network/api_endpoints.dart';

class RealisationRepository {
  final Dio _dio;

  RealisationRepository(this._dio);

  Future<List<Realisation>> getRealisations({
    String? category,
    String? status,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        'offset': offset,
      };

      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }

      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }

      final response = await _dio.get(
        ApiEndpoints.realisations,
        queryParameters: queryParams,
      );

      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data)
            .map((json) => Realisation.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Realisation> getRealisationById(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.realisationDetail,
        {'id': id.toString()},
      );
      final response = await _dio.get(endpoint);
      return Realisation.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch realisation: $e');
    }
  }

  Future<Map<String, dynamic>> getRealisationsStats() async {
    try {
      final response = await _dio.get(ApiEndpoints.realisationsStats);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      return {
        'total': 0,
        'published': 0,
        'featured': 0,
        'draft': 0,
      };
    }
  }

  Future<bool> createRealisation(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.realisations,
        data: data,
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to create realisation: $e');
    }
  }

  Future<bool> updateRealisation(int id, Map<String, dynamic> data) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.realisationDetail,
        {'id': id.toString()},
      );
      final response = await _dio.put(
        endpoint,
        data: data,
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to update realisation: $e');
    }
  }

  Future<bool> toggleFeatured(int id, bool featured) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.realisationFeatured,
        {'id': id.toString()},
      );
      final response = await _dio.patch(
        endpoint,
        data: {'featured': featured},
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to toggle featured: $e');
    }
  }

  Future<bool> deleteRealisation(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.realisationDetail,
        {'id': id.toString()},
      );
      final response = await _dio.delete(endpoint);
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to delete realisation: $e');
    }
  }
}