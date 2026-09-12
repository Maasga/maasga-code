import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_endpoints.dart';
import '../../features/auth/data/providers/firebase_provider.dart';

// Dio provider
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiEndpoints.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Add interceptors for auth token
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token if available
        final auth = ref.read(firebaseAuthProvider);
        final user = auth.currentUser;
        if (user != null) {
          try {
            final token = await user.getIdToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          } catch (e) {
            // Token fetch failed, continue without token
          }
        } else {
          // Temporairement: ajouter un token de test si pas d'utilisateur Firebase
          // options.headers['Authorization'] = 'Bearer test_token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        // Handle errors globally
        return handler.next(error);
      },
    ),
  );

  return dio;
});
