import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../domain/rdv_request.dart';

class RdvRepository {
  final Dio _dio;

  RdvRepository(this._dio);

  Future<void> submitRdv(RdvRequest request) async {
    try {
      await _dio.post(
        '/api/mobile/rdv',
        data: request.toJson(),
      );
    } catch (e) {
      if (e is DioException) {
        throw Exception(e.response?.data?['message'] ?? 'Erreur lors de la soumission de la demande');
      }
      rethrow;
    }
  }
}

final rdvRepositoryProvider = FutureProvider<RdvRepository>((ref) async {
  final dio = await ref.watch(dioProvider.future);
  return RdvRepository(dio);
});
