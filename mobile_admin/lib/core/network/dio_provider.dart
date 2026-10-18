import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_endpoints.dart';
import '../../features/auth/data/providers/firebase_provider.dart';
import '../utils/app_logger.dart';

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

  // 1. Intercepteur d'authentification standard (injection du token)
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final auth = ref.read(firebaseAuthProvider);
        final user = auth.currentUser;
        if (user != null) {
          try {
            final token = await user.getIdToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          } catch (e) {
            AppLogger.error(e, null, 'DioAuthInterceptor.getIdToken');
          }
        }
        return handler.next(options);
      },
    ),
  );

  // 2. Intercepteur de gestion d'erreur & Retry 401 avec forceRefresh
  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (DioException error, ErrorInterceptorHandler handler) async {
        final statusCode = error.response?.statusCode;

        if (statusCode == 401) {
          final isAlreadyRetrying = error.requestOptions.extra['isRetry'] == true;

          if (!isAlreadyRetrying) {
            final auth = ref.read(firebaseAuthProvider);
            final user = auth.currentUser;

            if (user != null) {
              AppLogger.warning('Token expiré (401). Tentative de renouvellement forcé...');
              error.requestOptions.extra['isRetry'] = true;

              try {
                // Force le rafraîchissement du token Firebase
                final freshToken = await user.getIdToken(true);

                if (freshToken != null && freshToken.isNotEmpty) {
                  AppLogger.info('Token rafraîchi avec succès. Rejeu de la requête HTTP...');
                  error.requestOptions.headers['Authorization'] = 'Bearer $freshToken';

                  // Rejouer la requête avec le nouveau token
                  final response = await dio.fetch(error.requestOptions);
                  return handler.resolve(response);
                } else {
                  AppLogger.warning('Impossible d\'obtenir un token rafraîchi. Déconnexion.');
                  await auth.signOut();
                }
              } catch (refreshError) {
                AppLogger.error(refreshError, null, 'DioRefreshToken');
                await auth.signOut();
              }
            }
          } else {
            AppLogger.warning('Échec après retry 401. Déconnexion requise.');
            await ref.read(firebaseAuthProvider).signOut();
          }
        }

        return handler.next(error);
      },
    ),
  );

  return dio;
});
