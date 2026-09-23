import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/client_repository.dart';
import '../models/client.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final clientRepositoryProvider = Provider<ClientRepository>((ref) {
  return ClientRepository(ref.watch(dioProvider));
});

// Clients provider
final clientsProvider = FutureProvider<List<Client>>((ref) async {
  final repository = ref.watch(clientRepositoryProvider);
  return repository.getClients();
});

// Create client provider
final createClientProvider = FutureProvider.family<Client, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(clientRepositoryProvider);
  return repository.createClient(data);
});

// Update client provider
final updateClientProvider = FutureProvider.family<Client, ({String id, Map<String, dynamic> data})>((ref, params) async {
  final repository = ref.watch(clientRepositoryProvider);
  return repository.updateClient(params.id, params.data);
});

// Client orders provider
final clientOrdersProvider = FutureProvider.family<List<dynamic>, String>((ref, id) async {
  final repository = ref.watch(clientRepositoryProvider);
  return repository.getClientOrders(id);
});

// Client RDV provider
final clientRdvProvider = FutureProvider.family<List<dynamic>, String>((ref, id) async {
  final repository = ref.watch(clientRepositoryProvider);
  return repository.getClientRdv(id);
});