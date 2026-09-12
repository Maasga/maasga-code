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
