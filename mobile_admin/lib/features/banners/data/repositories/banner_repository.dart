import 'package:dio/dio.dart';
import '../models/banner.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/app_logger.dart';

class BannerRepository {
  final Dio _dio;

  BannerRepository(this._dio);

  String _formatError(dynamic e) {
    if (e is DioException) {
      final dynamic data = e.response?.data;
      if (data is Map) {
        final err = data['error'] ?? data['message'];
        if (err != null && err.toString().trim().isNotEmpty) {
          return err.toString();
        }
      }
      if (data is String && data.isNotEmpty && !data.contains('<html') && !data.contains('<!DOCTYPE')) {
        return data;
      }
      if (e.response?.statusCode != null) {
        return 'Erreur serveur (Code ${e.response?.statusCode})';
      }
      return e.message ?? 'Erreur réseau';
    }
    return e.toString();
  }

  Future<List<Banner>> getBanners() async {
    try {
      AppLogger.info('Chargement des bannières');
      final response = await _dio.get(ApiEndpoints.adminBanners);
      final dynamic raw = response.data;
      final List<dynamic> list = raw is List
          ? raw
          : (raw is Map && raw['banners'] is List
              ? (raw['banners'] as List)
              : (raw is Map && raw['results'] is List ? (raw['results'] as List) : []));

      final banners = list
          .whereType<Map<String, dynamic>>()
          .map((json) => Banner.fromJson(json))
          .toList();

      AppLogger.response(ApiEndpoints.adminBanners, response.statusCode, banners.length);
      return banners;
    } catch (e) {
      AppLogger.error(e, null, 'BannerRepository.getBanners');
      throw Exception('Erreur lors du chargement des bannières: ${_formatError(e)}');
    }
  }

  Future<Banner> createBanner(Map<String, dynamic> data) async {
    try {
      AppLogger.info('Création de la bannière');
      final response = await _dio.post(ApiEndpoints.adminBanners, data: data);
      AppLogger.response(ApiEndpoints.adminBanners, response.statusCode);

      final dynamic resData = response.data;
      final String id = (resData is Map && resData['id'] != null)
          ? resData['id'].toString()
          : (resData is Map && resData['banner'] is Map && resData['banner']['id'] != null
              ? resData['banner']['id'].toString()
              : DateTime.now().millisecondsSinceEpoch.toString());

      return Banner.fromJson({...data, 'id': id});
    } catch (e) {
      AppLogger.error(e, null, 'BannerRepository.createBanner');
      throw Exception('Erreur lors de la création de la bannière: ${_formatError(e)}');
    }
  }

  Future<void> updateBanner(String id, Map<String, dynamic> data) async {
    try {
      AppLogger.info('Mise à jour de la bannière $id');
      final response = await _dio.put(
        ApiEndpoints.replacePath(ApiEndpoints.adminBannerDetail, {'id': id}),
        data: data,
      );
      AppLogger.response(ApiEndpoints.adminBannerDetail, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la mise à jour');
      }
    } catch (e) {
      AppLogger.error(e, null, 'BannerRepository.updateBanner');
      throw Exception('Erreur lors de la mise à jour de la bannière: ${_formatError(e)}');
    }
  }

  Future<void> deleteBanner(String id) async {
    try {
      AppLogger.info('Suppression de la bannière $id');
      final response = await _dio.delete(
        ApiEndpoints.replacePath(ApiEndpoints.adminBannerDetail, {'id': id}),
      );
      AppLogger.response(ApiEndpoints.adminBannerDetail, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la suppression');
      }
    } catch (e) {
      AppLogger.error(e, null, 'BannerRepository.deleteBanner');
      throw Exception('Erreur lors de la suppression de la bannière: ${_formatError(e)}');
    }
  }

  Future<void> toggleBanner(String id, bool isActive) async {
    try {
      AppLogger.info('Activation de la bannière $id: $isActive');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.adminBannerToggle, {'id': id}),
        data: {'is_active': isActive},
      );
      AppLogger.response(ApiEndpoints.adminBannerToggle, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de l\'activation');
      }
    } catch (e) {
      AppLogger.error(e, null, 'BannerRepository.toggleBanner');
      throw Exception("Erreur lors de l'activation de la bannière: ${_formatError(e)}");
    }
  }
}