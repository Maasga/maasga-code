import 'dart:io';
import 'package:dio/dio.dart';
import '../models/brand_media_image.dart';
import '../../../../core/network/api_endpoints.dart';

class BrandMediaRepository {
  final Dio _dio;

  BrandMediaRepository(this._dio);

  String _formatError(dynamic e, String defaultMsg) {
    if (e is DioException) {
      final statusCode = e.response?.statusCode;
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
      if (statusCode == 404) {
        return 'Endpoint médiathèque non disponible (404). Vérifiez le déploiement du serveur.';
      }
      if (statusCode == 401 || statusCode == 403) {
        return 'Accès non autorisé ($statusCode). Veuillez vous reconnecter en tant qu\'administrateur.';
      }
      if (statusCode != null) {
        return 'Erreur serveur ($statusCode). Veuillez réessayer.';
      }
      return e.message ?? defaultMsg;
    }
    return e.toString();
  }

  Future<List<BrandMediaImage>> getMediaImages({String? brand}) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.adminMediaBrand,
        queryParameters: (brand != null && brand.isNotEmpty) ? {'brand': brand} : null,
      );
      final dynamic raw = response.data;
      final List<dynamic> list = (raw is Map && raw['images'] is List)
          ? (raw['images'] as List)
          : (raw is List ? raw : []);
      return list
          .whereType<Map<String, dynamic>>()
          .map((item) => BrandMediaImage.fromJson(item))
          .toList();
    } catch (e) {
      throw Exception('Erreur chargement médiathèque: ${_formatError(e, 'Impossible de charger la médiathèque')}');
    }
  }

  Future<BrandMediaImage> uploadMediaImage({
    required String brand,
    required File file,
    String? label,
  }) async {
    try {
      final fileName = file.path.split(Platform.pathSeparator).last;
      final formData = FormData.fromMap({
        'brand': brand,
        'label': label ?? '',
        'image': await MultipartFile.fromFile(file.path, filename: fileName),
      });

      final response = await _dio.post(
        ApiEndpoints.adminMediaBrandUpload,
        data: formData,
      );

      final dynamic data = response.data;
      if (data is Map) {
        if (data['image'] is Map) {
          return BrandMediaImage.fromJson(Map<String, dynamic>.from(data['image'] as Map));
        }
        final rawId = data['id'];
        final int id = rawId is num ? rawId.toInt() : (int.tryParse(rawId?.toString() ?? '') ?? 0);
        final String url = data['url']?.toString() ?? '';
        return BrandMediaImage(
          id: id,
          brand: brand,
          url: url,
          label: label,
        );
      }
      throw Exception('Format de réponse inattendu lors de l\'upload');
    } catch (e) {
      throw Exception('Erreur upload médiathèque: ${_formatError(e, 'Échec de l\'envoi de l\'image')}');
    }
  }

  Future<void> deleteMediaImage(int id) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.adminMediaBrandDelete,
        data: {'id': id},
      );
      if (response.statusCode != 200) {
        final dynamic data = response.data;
        final errorMsg = (data is Map) ? (data['error']?.toString() ?? 'Échec de suppression') : 'Échec de suppression';
        throw Exception(errorMsg);
      }
    } catch (e) {
      throw Exception('Erreur suppression image: ${_formatError(e, 'Impossible de supprimer l\'image')}');
    }
  }

  Future<String> assignMediaImage({
    required int mediaId,
    required String scope,
    int? productId,
    required String target,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.adminMediaBrandAssign,
        data: {
          'media_id': mediaId,
          'scope': scope,
          if (productId != null) 'product_id': productId,
          'target': target,
        },
      );
      final dynamic data = response.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
      return 'Image affectée avec succès';
    } catch (e) {
      throw Exception('Erreur affectation: ${_formatError(e, 'Impossible d\'affecter l\'image')}');
    }
  }
}
