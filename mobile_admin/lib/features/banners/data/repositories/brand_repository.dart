import 'dart:io';
import 'package:dio/dio.dart';
import '../models/brand.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/app_logger.dart';

class BrandRepository {
  final Dio _dio;

  BrandRepository(this._dio);

  // ── Upload image vers ImgBB via le backend mobile admin ───────────────
  Future<String> uploadImage(File file) async {
    try {
      AppLogger.info('Upload image via mobile admin endpoint');
      final ext = file.path.split('.').last.toLowerCase();
      final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
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
      final url = response.data['url'] as String?;
      if (url == null || url.isEmpty) {
        throw Exception("URL manquante dans la réponse de l'upload");
      }
      AppLogger.response(ApiEndpoints.adminUploadImage, response.statusCode);
      return url;
    } catch (e) {
      AppLogger.error(e, null, 'BrandRepository.uploadImage');
      throw Exception("Erreur upload image: $e");
    }
  }

  // ── CRUD Marques ───────────────────────────────────────────────────────

  Future<List<Brand>> getBrands() async {
    try {
      AppLogger.info('Chargement des marques');
      final response = await _dio.get(ApiEndpoints.adminBrands);
      final List<dynamic> data = response.data;
      final brands = data.map((json) => Brand.fromJson(json)).toList();
      AppLogger.response(ApiEndpoints.adminBrands, response.statusCode, brands.length);
      return brands;
    } catch (e) {
      AppLogger.error(e, null, 'BrandRepository.getBrands');
      throw Exception('Erreur lors du chargement des marques: $e');
    }
  }

  Future<Brand> createBrand(Map<String, dynamic> data) async {
    try {
      AppLogger.info('Création de la marque');
      final response = await _dio.post(ApiEndpoints.adminBrands, data: data);
      AppLogger.response(ApiEndpoints.adminBrands, response.statusCode);
      return Brand.fromJson({...data, 'id': response.data['id'].toString()});
    } catch (e) {
      AppLogger.error(e, null, 'BrandRepository.createBrand');
      throw Exception('Erreur lors de la création de la marque: $e');
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
      throw Exception('Erreur lors de la mise à jour de la marque: $e');
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
      throw Exception('Erreur lors de la suppression de la marque: $e');
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
      throw Exception("Erreur lors de l'activation de la marque: $e");
    }
  }
}
