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

// Order status update provider
final orderStatusUpdateProvider =
    FutureProvider.family<void, ({String id, String status})>((
      ref,
      params,
    ) async {
      final repository = ref.watch(orderRepositoryProvider);
      await repository.updateOrderStatus(params.id, params.status);
      // Invalidate orders provider to refresh the list
      ref.invalidate(ordersProvider);
    });

// Order cancellation provider
final orderCancelProvider = FutureProvider.family<void, String>((
  ref,
  id,
) async {
  final repository = ref.watch(orderRepositoryProvider);
  await repository.cancelOrder(id);
  // Invalidate orders provider to refresh the list
  ref.invalidate(ordersProvider);
});
