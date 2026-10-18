import 'package:dio/dio.dart';
import '../models/notification.dart';
import '../../../../core/network/api_endpoints.dart';

class NotificationRepository {
  final Dio _dio;

  NotificationRepository(this._dio);

  Future<List<NotificationCampaign>> getNotifications({
    String? status,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        'offset': offset,
      };

      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }

      final response = await _dio.get(
        ApiEndpoints.notifications,
        queryParameters: queryParams,
      );

      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data)
            .map((json) => NotificationCampaign.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<NotificationCampaign> getNotificationById(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.notificationDetail,
        {'id': id.toString()},
      );
      final response = await _dio.get(endpoint);
      return NotificationCampaign.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch notification: $e');
    }
  }

  Future<Map<String, dynamic>> getNotificationsStats() async {
    try {
      final response = await _dio.get(ApiEndpoints.notificationsStats);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      return {
        'total': 0,
        'sent': {'count': 0, 'recipients': 0},
        'draft': 0,
        'opened': 0,
      };
    }
  }

  Future<bool> createNotification(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.notifications,
        data: data,
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to create notification: $e');
    }
  }

  Future<bool> sendNotification(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.notificationSend,
        {'id': id.toString()},
      );
      final response = await _dio.post(endpoint);
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to send notification: $e');
    }
  }

  Future<bool> updateNotificationStatus(int id, String status) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.notificationStatus,
        {'id': id.toString()},
      );
      final response = await _dio.patch(
        endpoint,
        data: {'status': status},
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to update notification status: $e');
    }
  }

  Future<bool> deleteNotification(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.notificationDetail,
        {'id': id.toString()},
      );
      final response = await _dio.delete(endpoint);
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to delete notification: $e');
    }
  }
}