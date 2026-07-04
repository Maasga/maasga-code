import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../config/env.dart';

final cookieJarProvider = FutureProvider<CookieJar>((ref) async {
  if (kIsWeb) {
    return CookieJar();
  }
  final dir = await getApplicationDocumentsDirectory();
  return PersistCookieJar(
    storage: FileStorage('${dir.path}/.cookies/'),
    ignoreExpires: false,
  );
});

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final dioProvider = FutureProvider<Dio>((ref) async {
  final jar = await ref.watch(cookieJarProvider.future);
  final dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: kIsWeb ? null : const Duration(seconds: 20),
      headers: {'Accept': 'application/json'},
      extra: {'withCredentials': true},
    ),
  );
  if (!kIsWeb) {
    dio.interceptors.add(CookieManager(jar));
  }
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final storage = ref.read(secureStorageProvider);
        final token = await storage.read(key: 'maasga_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401) {
          final storage = ref.read(secureStorageProvider);
          await storage.delete(key: 'maasga_token');
        }
        return handler.next(e);
      },
    ),
  );
  return dio;
});

final plainHttpProvider = Provider<Dio>((ref) {
  return Dio(BaseOptions(
    baseUrl: Env.apiBaseUrl,
    extra: {'withCredentials': true},
  ));
});
