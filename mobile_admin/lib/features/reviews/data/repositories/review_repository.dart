import 'package:dio/dio.dart';
import '../models/review.dart';
import '../../../../core/network/api_endpoints.dart';

class ReviewRepository {
  final Dio _dio;

  ReviewRepository(this._dio);

  Future<List<Review>> getReviews() async {
    try {
      print('⭐ Chargement des avis depuis: ${ApiEndpoints.adminReviews}');
      final response = await _dio.get(ApiEndpoints.adminReviews);
      print('✅ Réponse reçue - Status: ${response.statusCode}');
      final List<dynamic> data = response.data;
      final reviews = data.map((json) => Review.fromJson(json)).toList();
      print('⭐ ${reviews.length} avis chargés');
      return reviews;
    } catch (e) {
      print('❌ Erreur lors du chargement des avis: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors du chargement des avis: $e');
    }
  }

  Future<void> updateReviewStatus(String id, bool approved) async {
    try {
      print('⭐ Mise à jour de l\'avis $id: approved=$approved');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.adminReviewDetail, {'id': id}),
        data: {'approved': approved},
      );
      print('✅ Avis $id mis à jour');
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la mise à jour');
      }
    } catch (e) {
      print('❌ Erreur lors de la mise à jour de l\'avis: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors de la mise à jour de l\'avis: $e');
    }
  }

  Future<void> deleteReview(String id) async {
    try {
      print('⭐ Suppression de l\'avis $id');
      final response = await _dio.delete(
        ApiEndpoints.replacePath(ApiEndpoints.adminReviewDetail, {'id': id}),
      );
      print('✅ Avis $id supprimé');
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la suppression');
      }
    } catch (e) {
      print('❌ Erreur lors de la suppression de l\'avis: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors de la suppression de l\'avis: $e');
    }
  }
}