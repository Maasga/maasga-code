import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/brand_media_image.dart';
import '../repositories/brand_media_repository.dart';
import '../../../../core/network/dio_provider.dart';

final brandMediaRepositoryProvider = Provider<BrandMediaRepository>((ref) {
  return BrandMediaRepository(ref.watch(dioProvider));
});

// Images list provider with optional brand filter
final brandMediaImagesProvider = FutureProvider.family<List<BrandMediaImage>, String?>((ref, brand) async {
  final repo = ref.watch(brandMediaRepositoryProvider);
  return repo.getMediaImages(brand: (brand != null && brand.isNotEmpty) ? brand : null);
});

// Upload media image provider
final uploadBrandMediaProvider = FutureProvider.family<BrandMediaImage, ({String brand, File file, String? label})>(
  (ref, params) async {
    final repo = ref.watch(brandMediaRepositoryProvider);
    final res = await repo.uploadMediaImage(
      brand: params.brand,
      file: params.file,
      label: params.label,
    );
    return res;
  },
);

// Delete media image provider
final deleteBrandMediaProvider = FutureProvider.family<void, int>((ref, id) async {
  final repo = ref.watch(brandMediaRepositoryProvider);
  await repo.deleteMediaImage(id);
});

// Assign media image provider
final assignBrandMediaProvider = FutureProvider.family<String, ({int mediaId, String scope, int? productId, String target})>(
  (ref, params) async {
    final repo = ref.watch(brandMediaRepositoryProvider);
    final msg = await repo.assignMediaImage(
      mediaId: params.mediaId,
      scope: params.scope,
      productId: params.productId,
      target: params.target,
    );
    return msg;
  },
);
