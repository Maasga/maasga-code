import 'package:dio/dio.dart';
import '../models/message.dart';
import '../../../../core/network/api_endpoints.dart';

class MessageRepository {
  final Dio _dio;

  MessageRepository(this._dio);

  Future<List<ClientMessage>> getMessages({
    String? search,
    String? status,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
        'offset': offset,
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }

      final response = await _dio.get(
        ApiEndpoints.messages,
        queryParameters: queryParams,
      );

      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data)
            .map((json) => ClientMessage.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<ClientMessage> getMessageById(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.messageDetail,
        {'id': id.toString()},
      );
      final response = await _dio.get(endpoint);
      return ClientMessage.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch message: $e');
    }
  }

  Future<Map<String, dynamic>> getMessagesStats() async {
    try {
      final response = await _dio.get(ApiEndpoints.messagesStats);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      return {
        'total': 0,
        'unread': 0,
        'responded': 0,
        'today': 0,
      };
    }
  }

  Future<bool> respondToMessage(int id, String response) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.messageRespond,
        {'id': id.toString()},
      );
      final res = await _dio.post(
        endpoint,
        data: {'response': response},
      );
      return res.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to respond to message: $e');
    }
  }

  Future<bool> updateMessageStatus(int id, String status) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.messageStatus,
        {'id': id.toString()},
      );
      final response = await _dio.patch(
        endpoint,
        data: {'status': status},
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to update message status: $e');
    }
  }

  Future<bool> deleteMessage(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.messageDetail,
        {'id': id.toString()},
      );
      final response = await _dio.delete(endpoint);
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to delete message: $e');
    }
  }
}