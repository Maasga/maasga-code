import 'package:dio/dio.dart';
import '../models/banner.dart';
import '../../../../core/network/api_endpoints.dart';

class BannerRepository {
  final Dio _dio;

  BannerRepository(this._dio);

  Future<List<Banner>> getBanners() async {
    try {
      print('🎨 Chargement des bannières depuis: ${ApiEndpoints.adminBanners}');
      final response = await _dio.get(ApiEndpoints.adminBanners);
      print('✅ Réponse reçue - Status: ${response.statusCode}');
      final List<dynamic> data = response.data;
      final banners = data.map((json) => Banner.fromJson(json)).toList();
      print('🎨 ${banners.length} bannières chargées');
      return banners;
    } catch (e) {
      print('❌ Erreur lors du chargement des bannières: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors du chargement des bannières: $e');
    }
  }

  Future<Banner> createBanner(Map<String, dynamic> data) async {
    try {
      print('🎨 Création de la bannière: ${data["title"]}');
      final response = await _dio.post(ApiEndpoints.adminBanners, data: data);
      print('✅ Bannière créée avec ID: ${response.data['id']}');
      return Banner.fromJson({...data, 'id': response.data['id'].toString()});
    } catch (e) {
      print('❌ Erreur lors de la création de la bannière: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors de la création de la bannière: $e');
    }
  }

  Future<void> updateBanner(String id, Map<String, dynamic> data) async {
    try {
      print('🎨 Mise à jour de la bannière $id');
      final response = await _dio.put(
        ApiEndpoints.replacePath(ApiEndpoints.adminBannerDetail, {'id': id}),
        data: data,
      );
      print('✅ Bannière $id mise à jour');
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la mise à jour');
      }
    } catch (e) {
      print('❌ Erreur lors de la mise à jour de la bannière: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors de la mise à jour de la bannière: $e');
    }
  }

  Future<void> deleteBanner(String id) async {
    try {
      print('🎨 Suppression de la bannière $id');
      final response = await _dio.delete(
        ApiEndpoints.replacePath(ApiEndpoints.adminBannerDetail, {'id': id}),
      );
      print('✅ Bannière $id supprimée');
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la suppression');
      }
    } catch (e) {
      print('❌ Erreur lors de la suppression de la bannière: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors de la suppression de la bannière: $e');
    }
  }

  Future<void> toggleBanner(String id, bool isActive) async {
    try {
      print('🎨 Activation de la bannière $id: $isActive');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.adminBannerToggle, {'id': id}),
        data: {'is_active': isActive},
      );
      print('✅ Bannière $id activée/désactivée');
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de l\'activation');
      }
    } catch (e) {
      print('❌ Erreur lors de l\'activation de la bannière: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors de l\'activation de la bannière: $e');
    }
  }
}