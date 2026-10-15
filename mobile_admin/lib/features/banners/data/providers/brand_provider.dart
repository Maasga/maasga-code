import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/brand_repository.dart';
import '../models/brand.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final brandRepositoryProvider = Provider<BrandRepository>((ref) {
  return BrandRepository(ref.watch(dioProvider));
});

// Brands list provider (auto-refreshable)
final brandsProvider = FutureProvider<List<Brand>>((ref) async {
  final repository = ref.watch(brandRepositoryProvider);
  return repository.getBrands();
});

// Upload image provider — prend un File, retourne l'URL ImgBB
final uploadBrandImageProvider = FutureProvider.family<String, File>((ref, file) async {
  final repository = ref.watch(brandRepositoryProvider);
  return repository.uploadImage(file);
});

// Create brand provider
final createBrandProvider =
    FutureProvider.family<Brand, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(brandRepositoryProvider);
  final brand = await repository.createBrand(data);
  ref.invalidate(brandsProvider);
  return brand;
});

// Update brand provider
final updateBrandProvider =
    FutureProvider.family<void, ({String id, Map<String, dynamic> data})>(
        (ref, params) async {
  final repository = ref.watch(brandRepositoryProvider);
  await repository.updateBrand(params.id, params.data);
  ref.invalidate(brandsProvider);
});

// Delete brand provider
final deleteBrandProvider =
    FutureProvider.family<void, String>((ref, id) async {
  final repository = ref.watch(brandRepositoryProvider);
  await repository.deleteBrand(id);
  ref.invalidate(brandsProvider);
});

// Toggle brand provider
final toggleBrandProvider =
    FutureProvider.family<void, ({String id, bool isActive})>(
        (ref, params) async {
  final repository = ref.watch(brandRepositoryProvider);
  await repository.toggleBrand(params.id, params.isActive);
  ref.invalidate(brandsProvider);
});
