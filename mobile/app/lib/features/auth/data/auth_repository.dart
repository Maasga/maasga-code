import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/network/api_client.dart';

class AuthRepository {
  AuthRepository(this._dio, this._storage);
  final Dio _dio;
  final FlutterSecureStorage _storage;

  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    final cleanId = identifier.trim().replaceAll(' ', '');
    try {
      final response = await _dio.post(
        '/api/mobile/login',
        data: {'identifier': cleanId, 'password': password},
      );
      final token = response.data['token'];
      if (token != null) {
        await _storage.write(key: 'maasga_token', value: token as String);
      }
    } on DioException catch (e) {
      debugPrint('AUTH LOGIN ERROR: ${e.response?.statusCode} - ${e.response?.data}');
      rethrow;
    }
  }

  Future<void> register({
    required String name,
    required String phone,
    required String email,
    required String quartier,
    required String password,
  }) async {
    try {
      final cleanPhone = phone.trim().replaceAll(' ', '');
      final response = await _dio.post(
        '/api/mobile/register',
        data: {
          'name': name,
          'phone': cleanPhone,
          'email': email.trim(),
          'quartier': quartier,
          'password': password,
        },
      );
      final token = response.data['token'];
      if (token != null) {
        await _storage.write(key: 'maasga_token', value: token as String);
      }
    } on DioException catch (e) {
      debugPrint('AUTH REGISTER ERROR: ${e.response?.statusCode} - ${e.response?.data}');
      rethrow;
    }
  }

  Future<void> loginWithGoogle({
    required String accessToken,
  }) async {
    await _dio.post(
      '/api/auth/google/mobile',
      data: {'accessToken': accessToken},
      options: Options(
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      ),
    );
  }

  Future<bool> hasActiveSession() async {
    final token = await _storage.read(key: 'maasga_token');
    if (token == null) return false;

    try {
      final response = await _dio.get('/api/mobile/profile');
      return response.statusCode == 200 && response.data != null;
    } catch (_) {
      await _storage.delete(key: 'maasga_token');
      return false;
    }
  }

  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final response = await _dio.get('/api/mobile/profile');
      if (response.statusCode == 200 && response.data != null) {
        return response.data['user'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>?;
      }
    } catch (_) {}
    return null;
  }

  Future<void> logout() async {
    try {
      await _dio.get('/api/logout');
    } catch (_) {}
    await _storage.delete(key: 'maasga_token');
  }
}

final authRepositoryProvider = FutureProvider<AuthRepository>((ref) async {
  final dio = await ref.watch(dioProvider.future);
  final storage = ref.watch(secureStorageProvider);
  return AuthRepository(dio, storage);
});

final userProfileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final repo = await ref.watch(authRepositoryProvider.future);
  // Optional: only fetch if logged in
  return repo.getProfile();
});
