import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/product_repository.dart';
import '../models/product.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository(ref.watch(dioProvider));
});

// Products provider using FutureProvider
final productsProvider = FutureProvider<List<Product>>((ref) async {
  final repository = ref.watch(productRepositoryProvider);
  return repository.getProducts();
});

// Create product provider
final createProductProvider =
    FutureProvider.family<Product, Map<String, dynamic>>((ref, data) async {
      final repository = ref.watch(productRepositoryProvider);
      return repository.createProduct(data);
    });

// Update product provider
final updateProductProvider =
    FutureProvider.family<Product, ({String id, Map<String, dynamic> data})>((
      ref,
      params,
    ) async {
      final repository = ref.watch(productRepositoryProvider);
      return repository.updateProduct(params.id, params.data);
    });

// Delete product provider
final deleteProductProvider = FutureProvider.family<void, String>((
  ref,
  id,
) async {
  final repository = ref.watch(productRepositoryProvider);
  return repository.deleteProduct(id);
});
