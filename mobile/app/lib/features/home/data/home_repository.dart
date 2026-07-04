import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../models/promo.dart';

class HomeRepository {
  HomeRepository(this._dio);
  final Dio _dio;

  Future<List<Promo>> getBanners() async {
    try {
      final response = await _dio.get('/api/mobile/banners');
      final list = response.data as List<dynamic>? ?? const [];
      return list.map((e) => Promo.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      // Fallback or rethrow based on strategy
      return [];
    }
  }
}

final homeRepositoryProvider = FutureProvider<HomeRepository>((ref) async {
  final dio = await ref.watch(dioProvider.future);
  return HomeRepository(dio);
});

final bannersProvider = FutureProvider<List<Promo>>((ref) async {
  final repo = await ref.watch(homeRepositoryProvider.future);
  return repo.getBanners();
});
