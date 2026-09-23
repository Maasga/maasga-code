import 'package:dio/dio.dart';
import '../models/client.dart';
import '../../../../core/network/api_endpoints.dart';

class ClientRepository {
  final Dio _dio;

  ClientRepository(this._dio);

  Future<List<Client>> getClients() async {
    try {
      print('👥 Chargement des clients depuis: ${ApiEndpoints.clients}');
      final response = await _dio.get(ApiEndpoints.clients);
      print('✅ Réponse reçue - Status: ${response.statusCode}');
      final List<dynamic> data = response.data;
      final clients = data.map((json) => Client.fromJson(json)).toList();
      print('👥 ${clients.length} clients chargés');
      return clients;
    } catch (e) {
      print('❌ Erreur lors du chargement des clients: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors du chargement des clients: $e');
    }
  }

  Future<Client> getClient(String id) async {
    try {
      print('👥 Chargement du client $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.clientDetail, {'id': id}),
      );
      print('✅ Client $id chargé');
      return Client.fromJson(response.data);
    } catch (e) {
      print('❌ Erreur lors du chargement du client $id: $e');
      throw Exception('Erreur lors du chargement du client: $e');
    }
  }

  Future<Client> createClient(Map<String, dynamic> data) async {
    try {
      print('👥 Création du client: ${data["name"]}');
      final response = await _dio.post(ApiEndpoints.clients, data: data);
      print('✅ Client créé avec ID: ${response.data['id']}');
      return Client.fromJson({...data, 'id': response.data['id'].toString()});
    } catch (e) {
      print('❌ Erreur lors de la création du client: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors de la création du client: $e');
    }
  }

  Future<Client> updateClient(String id, Map<String, dynamic> data) async {
    try {
      print('👥 Mise à jour du client $id: ${data["name"]}');
      final response = await _dio.put(
        ApiEndpoints.replacePath(ApiEndpoints.clientDetail, {'id': id}),
        data: data,
      );
      print('✅ Client $id mis à jour');
      return Client.fromJson({...data, 'id': id});
    } catch (e) {
      print('❌ Erreur lors de la mise à jour du client: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors de la mise à jour du client: $e');
    }
  }

  Future<List<dynamic>> getClientOrders(String id) async {
    try {
      print('📦 Chargement des commandes du client $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.clientOrders, {'id': id}),
      );
      print('✅ Commandes chargées');
      return response.data as List<dynamic>;
    } catch (e) {
      print('❌ Erreur lors du chargement des commandes: $e');
      throw Exception('Erreur lors du chargement des commandes: $e');
    }
  }

  Future<List<dynamic>> getClientRdv(String id) async {
    try {
      print('📅 Chargement des RDV du client $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.clientRdv, {'id': id}),
      );
      print('✅ RDV chargés');
      return response.data as List<dynamic>;
    } catch (e) {
      print('❌ Erreur lors du chargement des RDV: $e');
      throw Exception('Erreur lors du chargement des RDV: $e');
    }
  }
}