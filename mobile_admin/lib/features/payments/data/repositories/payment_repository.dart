import 'package:dio/dio.dart';
import '../models/payment.dart';
import '../../../../core/network/api_endpoints.dart';

class PaymentRepository {
  final Dio _dio;

  PaymentRepository(this._dio);

  Future<List<Payment>> getPayments({
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
        ApiEndpoints.payments,
        queryParameters: queryParams,
      );

      if (response.data is List) {
        return List<Map<String, dynamic>>.from(response.data)
            .map((json) => Payment.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Payment> getPaymentById(int id) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.paymentDetail,
        {'id': id.toString()},
      );
      final response = await _dio.get(endpoint);
      return Payment.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch payment: $e');
    }
  }

  Future<Map<String, dynamic>> getPaymentStats() async {
    try {
      final response = await _dio.get(ApiEndpoints.paymentsStats);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      return {
        'total': {'count': 0, 'amount': 0},
        'pending': {'count': 0, 'amount': 0},
        'failed': {'count': 0, 'amount': 0},
        'today': {'count': 0, 'amount': 0},
      };
    }
  }

  Future<bool> createPayment(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.payments,
        data: data,
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to create payment: $e');
    }
  }

  Future<bool> updatePaymentStatus(int id, String status) async {
    try {
      final endpoint = ApiEndpoints.replacePath(
        ApiEndpoints.paymentStatus,
        {'id': id.toString()},
      );
      final response = await _dio.patch(
        endpoint,
        data: {'status': status},
      );
      return response.data?['success'] == true;
    } catch (e) {
      throw Exception('Failed to update payment status: $e');
    }
  }
}