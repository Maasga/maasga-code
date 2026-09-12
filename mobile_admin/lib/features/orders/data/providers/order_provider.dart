import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/order_repository.dart';
import '../models/order.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  return OrderRepository(ref.watch(dioProvider));
});

// Orders provider using FutureProvider
final ordersProvider = FutureProvider<List<Order>>((ref) async {
  final repository = ref.watch(orderRepositoryProvider);
  return repository.getOrders();
});
