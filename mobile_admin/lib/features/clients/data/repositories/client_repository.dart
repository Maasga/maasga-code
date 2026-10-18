import 'package:dio/dio.dart';
import '../models/client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/app_logger.dart';

class ClientRepository {
  final Dio _dio;

  ClientRepository(this._dio);

  Future<List<Client>> getClients() async {
    try {
      AppLogger.info('Chargement des clients');
      final response = await _dio.get(ApiEndpoints.clients);
      final List<dynamic> data = response.data;
      final clients = data.map((json) => Client.fromJson(json)).toList();
      AppLogger.response(ApiEndpoints.clients, response.statusCode, clients.length);
      return clients;
    } catch (e) {
      AppLogger.error(e, null, 'ClientRepository.getClients');
      throw Exception('Erreur lors du chargement des clients: $e');
    }
  }

  Future<Client> getClient(String id) async {
    try {
      AppLogger.info('Chargement du client $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.clientDetail, {'id': id}),
      );
      AppLogger.response(ApiEndpoints.clientDetail, response.statusCode);
      return Client.fromJson(response.data);
    } catch (e) {
      AppLogger.error(e, null, 'ClientRepository.getClient');
      throw Exception('Erreur lors du chargement du client $id: $e');
    }
  }

  Future<Client> createClient(Map<String, dynamic> data) async {
    try {
      AppLogger.info('Création d\'un nouveau client');
      final response = await _dio.post(ApiEndpoints.clients, data: data);
      AppLogger.response(ApiEndpoints.clients, response.statusCode);
      return Client.fromJson({...data, 'id': response.data['id'].toString()});
    } catch (e) {
      AppLogger.error(e, null, 'ClientRepository.createClient');
      throw Exception('Erreur lors de la création du client: $e');
    }
  }

  Future<Client> updateClient(String id, Map<String, dynamic> data) async {
    try {
      AppLogger.info('Mise à jour du client $id');
      final response = await _dio.put(
        ApiEndpoints.replacePath(ApiEndpoints.clientDetail, {'id': id}),
        data: data,
      );
      AppLogger.response(ApiEndpoints.clientDetail, response.statusCode);
      return Client.fromJson({...data, 'id': id});
    } catch (e) {
      AppLogger.error(e, null, 'ClientRepository.updateClient');
      throw Exception('Erreur lors de la mise à jour du client: $e');
    }
  }

  Future<List<dynamic>> getClientOrders(String id) async {
    try {
      AppLogger.info('Chargement des commandes du client $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.clientOrders, {'id': id}),
      );
      AppLogger.response(ApiEndpoints.clientOrders, response.statusCode);
      return response.data as List<dynamic>;
    } catch (e) {
      AppLogger.error(e, null, 'ClientRepository.getClientOrders');
      throw Exception('Erreur lors du chargement des commandes: $e');
    }
  }

  Future<List<dynamic>> getClientRdv(String id) async {
    try {
      AppLogger.info('Chargement des RDV du client $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.clientRdv, {'id': id}),
      );
      AppLogger.response(ApiEndpoints.clientRdv, response.statusCode);
      return response.data as List<dynamic>;
    } catch (e) {
      AppLogger.error(e, null, 'ClientRepository.getClientRdv');
      throw Exception('Erreur lors du chargement des RDV: $e');
    }
  }
}