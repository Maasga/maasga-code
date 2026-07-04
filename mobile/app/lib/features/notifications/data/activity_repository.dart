import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class UserActivity {
  UserActivity({
    required this.id,
    required this.type,
    required this.status,
    required this.createdAt,
    this.notes,
    this.totalPrice,
  });

  final int id;
  final String type; // 'rdv' or 'order'
  final String status;
  final String createdAt;
  final String? notes;
  final int? totalPrice;

  factory UserActivity.fromJson(Map<String, dynamic> json) {
    return UserActivity(
      id: (json['id'] as num?)?.toInt() ?? 0,
      type: json['_type'] as String? ?? 'rdv',
      status: json['status'] as String? ?? 'pending',
      createdAt: json['created_at'] as String? ?? '',
      notes: json['notes'] as String?,
      totalPrice: (json['total_price'] as num?)?.toInt(),
    );
  }
}

class ActivityRepository {
  ActivityRepository(this._dio);
  final Dio _dio;

  Future<List<UserActivity>> fetchActivity() async {
    try {
      final response = await _dio.get('/api/mobile/activity');
      final list = response.data as List<dynamic>? ?? [];
      return list.map((e) => UserActivity.fromJson(e)).toList();
    } catch (e) {
      return [];
    }
  }
}

final activityRepositoryProvider = FutureProvider<ActivityRepository>((ref) async {
  final dio = await ref.watch(dioProvider.future);
  return ActivityRepository(dio);
});

final userActivityProvider = FutureProvider<List<UserActivity>>((ref) async {
  final repo = await ref.watch(activityRepositoryProvider.future);
  return repo.fetchActivity();
});
