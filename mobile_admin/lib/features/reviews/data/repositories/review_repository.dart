import 'package:dio/dio.dart';
import '../models/review.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/app_logger.dart';

class ReviewRepository {
  final Dio _dio;

  ReviewRepository(this._dio);

  Future<List<Review>> getReviews() async {
    try {
      AppLogger.info('Chargement des avis');
      final response = await _dio.get(ApiEndpoints.adminReviews);
      final List<dynamic> data = response.data;
      final reviews = data.map((json) => Review.fromJson(json)).toList();
      AppLogger.response(ApiEndpoints.adminReviews, response.statusCode, reviews.length);
      return reviews;
    } catch (e) {
      AppLogger.error(e, null, 'ReviewRepository.getReviews');
      throw Exception('Erreur lors du chargement des avis: $e');
    }
  }

  Future<void> updateReviewStatus(String id, bool approved) async {
    try {
      AppLogger.info('Mise à jour de l\'avis $id: approved=$approved');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.adminReviewDetail, {'id': id}),
        data: {'approved': approved},
      );
      AppLogger.response(ApiEndpoints.adminReviewDetail, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la mise à jour');
      }
    } catch (e) {
      AppLogger.error(e, null, 'ReviewRepository.updateReviewStatus');
      throw Exception('Erreur lors de la mise à jour de l\'avis: $e');
    }
  }

  Future<void> deleteReview(String id) async {
    try {
      AppLogger.info('Suppression de l\'avis $id');
      final response = await _dio.delete(
        ApiEndpoints.replacePath(ApiEndpoints.adminReviewDetail, {'id': id}),
      );
      AppLogger.response(ApiEndpoints.adminReviewDetail, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la suppression');
      }
    } catch (e) {
      AppLogger.error(e, null, 'ReviewRepository.deleteReview');
      throw Exception('Erreur lors de la suppression de l\'avis: $e');
    }
  }
}