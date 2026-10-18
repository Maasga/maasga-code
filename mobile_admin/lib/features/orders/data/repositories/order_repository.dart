import 'package:dio/dio.dart';
import '../models/order.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/app_logger.dart';

class OrderRepository {
  final Dio _dio;

  OrderRepository(this._dio);

  Future<List<Order>> getOrders() async {
    try {
      AppLogger.info('Chargement des commandes');
      final response = await _dio.get(ApiEndpoints.orders);
      final List<dynamic> data = response.data;
      final orders = data.map((json) => Order.fromJson(json)).toList();
      AppLogger.response(ApiEndpoints.orders, response.statusCode, orders.length);
      return orders;
    } catch (e) {
      AppLogger.error(e, null, 'OrderRepository.getOrders');
      throw Exception('Erreur lors du chargement des commandes: $e');
    }
  }

  Future<Order> getOrder(String id) async {
    try {
      AppLogger.info('Chargement de la commande $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.adminOrderDetail, {'id': id}),
      );
      AppLogger.response(ApiEndpoints.adminOrderDetail, response.statusCode);
      return Order.fromJson(response.data);
    } catch (e) {
      AppLogger.error(e, null, 'OrderRepository.getOrder');
      throw Exception('Erreur lors du chargement de la commande: $e');
    }
  }

  Future<Order> updateOrderStatus(String id, String status) async {
    try {
      AppLogger.info('Mise à jour du statut de la commande $id: $status');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.orderDetail, {'id': id}),
        data: {'status': status},
      );
      AppLogger.response(ApiEndpoints.orderDetail, response.statusCode);
      return Order.fromJson(response.data);
    } catch (e) {
      AppLogger.error(e, null, 'OrderRepository.updateOrderStatus');
      throw Exception('Erreur lors de la mise à jour du statut: $e');
    }
  }

  Future<void> cancelOrder(String id) async {
    try {
      AppLogger.info('Annulation de la commande $id');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.orderDetail, {'id': id}),
        data: {'status': 'annule'},
      );
      AppLogger.response(ApiEndpoints.orderDetail, response.statusCode);
    } catch (e) {
      AppLogger.error(e, null, 'OrderRepository.cancelOrder');
      throw Exception('Erreur lors de l\'annulation de la commande: $e');
    }
  }

  Future<void> addOrderNotes(String id, String notes) async {
    try {
      AppLogger.info('Ajout notes à la commande $id');
      final response = await _dio.post(
        ApiEndpoints.replacePath(ApiEndpoints.orderNotes, {'id': id}),
        data: {'notes': notes},
      );
      AppLogger.response(ApiEndpoints.orderNotes, response.statusCode);
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de l\'ajout des notes');
      }
    } catch (e) {
      AppLogger.error(e, null, 'OrderRepository.addOrderNotes');
      throw Exception('Erreur lors de l\'ajout des notes: $e');
    }
  }

  Future<Map<String, dynamic>> getOrdersStats() async {
    try {
      AppLogger.info('Chargement statistiques commandes');
      final response = await _dio.get(ApiEndpoints.ordersStats);
      AppLogger.response(ApiEndpoints.ordersStats, response.statusCode);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      AppLogger.error(e, null, 'OrderRepository.getOrdersStats');
      throw Exception('Erreur lors du chargement des statistiques: $e');
    }
  }
}

