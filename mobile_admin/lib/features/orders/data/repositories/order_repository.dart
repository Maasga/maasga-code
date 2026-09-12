import 'package:dio/dio.dart';
import '../models/order.dart';
import '../../../../core/network/api_endpoints.dart';

class OrderRepository {
  final Dio _dio;

  OrderRepository(this._dio);

  Future<List<Order>> getOrders() async {
    try {
      print('📦 Chargement des commandes depuis: ${ApiEndpoints.orders}');
      final response = await _dio.get(ApiEndpoints.orders);
      print('✅ Réponse reçue - Status: ${response.statusCode}');
      print('📊 Données: ${response.data}');
      final List<dynamic> data = response.data;
      final orders = data.map((json) => Order.fromJson(json)).toList();
      print('📦 ${orders.length} commandes chargées');
      return orders;
    } catch (e) {
      print('❌ Erreur lors du chargement des commandes: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors du chargement des commandes: $e');
    }
  }

  Future<Order> getOrder(String id) async {
    try {
      print('📦 Chargement de la commande $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.orders, {'id': id}),
      );
      print('✅ Commande $id chargée');
      return Order.fromJson(response.data);
    } catch (e) {
      print('❌ Erreur lors du chargement de la commande $id: $e');
      throw Exception('Erreur lors du chargement de la commande: $e');
    }
  }

  Future<Order> updateOrderStatus(String id, String status) async {
    try {
      print('📦 Mise à jour du statut de la commande $id: $status');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.orders, {'id': id}),
        data: {'status': status},
      );
      print('✅ Statut de la commande $id mis à jour');
      return Order.fromJson(response.data);
    } catch (e) {
      print('❌ Erreur lors de la mise à jour du statut: $e');
      throw Exception('Erreur lors de la mise à jour du statut: $e');
    }
  }

  Future<void> cancelOrder(String id) async {
    try {
      print('📦 Annulation de la commande $id');
      await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.orders, {'id': id}),
        data: {'status': 'annule'},
      );
      print('✅ Commande $id annulée');
    } catch (e) {
      print('❌ Erreur lors de l\'annulation de la commande: $e');
      throw Exception('Erreur lors de l\'annulation de la commande: $e');
    }
  }
}
