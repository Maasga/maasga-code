import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/payment_repository.dart';
import '../models/payment.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(ref.watch(dioProvider));
});

// Payments list provider
final paymentsProvider = FutureProvider.autoDispose<List<Payment>>((ref) async {
  final repository = ref.watch(paymentRepositoryProvider);
  return repository.getPayments();
});

// Payment detail provider
final paymentDetailProvider = FutureProvider.autoDispose.family<Payment, int>((ref, id) async {
  final repository = ref.watch(paymentRepositoryProvider);
  return repository.getPaymentById(id);
});

// Payment stats provider
final paymentStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final repository = ref.watch(paymentRepositoryProvider);
  return repository.getPaymentStats();
});

// Create payment provider
final createPaymentProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(paymentRepositoryProvider);
  final result = await repository.createPayment(data);
  // Invalidate payments provider to refresh the list
  ref.invalidate(paymentsProvider);
  ref.invalidate(paymentStatsProvider);
  return result;
});

// Update payment status provider
final updatePaymentStatusProvider = FutureProvider.autoDispose.family<bool, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(paymentRepositoryProvider);
  final result = await repository.updatePaymentStatus(data['id'] as int, data['status'] as String);
  // Invalidate payments provider to refresh the list
  ref.invalidate(paymentsProvider);
  ref.invalidate(paymentStatsProvider);
  return result;
});