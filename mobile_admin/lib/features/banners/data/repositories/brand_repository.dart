import 'dart:io';
import 'package:dio/dio.dart';
import '../models/brand.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/app_logger.dart';

class BrandRepository {
  final Dio _dio;

  BrandRepository(this._dio);

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
      return e.message ?? 'Erreur de connexion';
    }
    return e.toString();
  }

  // ── Upload image vers ImgBB via le backend mobile admin ───────────────
  Future<String> uploadImage(File file) async {
    try {
      AppLogger.info('Upload image via mobile admin endpoint');
      final ext = file.path.split('.').last.toLowerCase();
      final mime = ext == 'png'
          ? 'image/png'
          : (ext == 'webp' ? 'image/webp' : 'image/jpeg');

      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          file.path,
          filename: 'upload.$ext',
          contentType: DioMediaType.parse(mime),
        ),
      });

      final response = await _dio.post(
        ApiEndpoints.adminUploadImage,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      final dynamic data = response.data;
      final String? url = (data is Map) ? data['url'] as String? : null;
      if (url == null || url.isEmpty) {
        throw Exception("URL manquante dans la réponse de l'upload");
      }
      AppLogger.response(ApiEndpoints.adminUploadImage, response.statusCode);
      return url;
    } catch (e) {
      AppLogger.error(e, null, 'BrandRepository.uploadImage');
      throw Exception("Erreur upload image: ${_formatError(e)}");
    }
  }

  // ── CRUD Marques ───────────────────────────────────────────────────────

  Future<List<Brand>> getBrands() async {
    try {
      AppLogger.info('Chargement des marques');
      final response = await _dio.get(ApiEndpoints.adminBrands);
      final dynamic raw = response.data;
      final List<dynamic> list = raw is List
          ? raw
          : (raw is Map && raw['brands'] is List
              ? (raw['brands'] as List)
              : (raw is Map && raw['results'] is List ? (raw['results'] as List) : []));

      final brands = list
          .whereType<Map<String, dynamic>>()
          .map((json) => Brand.fromJson(json))
          .toList();

      AppLogger.response(ApiEndpoints.adminBrands, response.statusCode, brands.length);
      return brands;
    } catch (e) {
      AppLogger.error(e, null, 'BrandRepository.getBrands');
      throw Exception('Erreur lors du chargement des marques: ${_formatError(e)}');
    }
  }

  Future<Brand> createBrand(Map<String, dynamic> data) async {
    try {
      AppLogger.info('Création de la marque');
      final response = await _dio.post(ApiEndpoints.adminBrands, data: data);
      AppLogger.response(ApiEndpoints.adminBrands, response.statusCode);

      final dynamic resData = response.data;
      final String id = (resData is Map && resData['id'] != null)
          ? resData['id'].toString()
          : (resData is Map && resData['brand'] is Map && resData['brand']['id'] != null
              ? resData['brand']['id'].toString()
              : DateTime.now().millisecondsSinceEpoch.toString());

      return Brand.fromJson({...data, 'id': id});
    } catch (e) {
      AppLogger.error(e, null, 'BrandRepository.createBrand');
      throw Exception('Erreur lors de la création de la marque: ${_formatError(e)}');
    }
  }

  Future<void> updateBrand(String id, Map<String, dynamic> data) async {
    try {
      AppLogger.info('Mise à jour de la marque $id');
      final response = await _dio.put(
        ApiEndpoints.replacePath(ApiEndpoints.adminBrandDetail, {'id': id}),
        data: data,
      );
      AppLogger.response(ApiEndpoints.adminBrandDetail, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la mise à jour');
      }
    } catch (e) {
      AppLogger.error(e, null, 'BrandRepository.updateBrand');
      throw Exception('Erreur lors de la mise à jour de la marque: ${_formatError(e)}');
    }
  }

  Future<void> deleteBrand(String id) async {
    try {
      AppLogger.info('Suppression de la marque $id');
      final response = await _dio.delete(
        ApiEndpoints.replacePath(ApiEndpoints.adminBrandDetail, {'id': id}),
      );
      AppLogger.response(ApiEndpoints.adminBrandDetail, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la suppression');
      }
    } catch (e) {
      AppLogger.error(e, null, 'BrandRepository.deleteBrand');
      throw Exception('Erreur lors de la suppression de la marque: ${_formatError(e)}');
    }
  }

  Future<void> toggleBrand(String id, bool isActive) async {
    try {
      AppLogger.info('Activation marque $id: $isActive');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.adminBrandToggle, {'id': id}),
        data: {'is_active': isActive},
      );
      AppLogger.response(ApiEndpoints.adminBrandToggle, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception("Erreur lors de l'activation");
      }
    } catch (e) {
      AppLogger.error(e, null, 'BrandRepository.toggleBrand');
      throw Exception("Erreur lors de l'activation de la marque: ${_formatError(e)}");
    }
  }
}
