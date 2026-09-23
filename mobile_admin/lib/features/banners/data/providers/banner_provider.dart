import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/banner_repository.dart';
import '../models/banner.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final bannerRepositoryProvider = Provider<BannerRepository>((ref) {
  return BannerRepository(ref.watch(dioProvider));
});

// Banners provider
final bannersProvider = FutureProvider<List<Banner>>((ref) async {
  final repository = ref.watch(bannerRepositoryProvider);
  return repository.getBanners();
});

// Create banner provider
final createBannerProvider = FutureProvider.family<Banner, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(bannerRepositoryProvider);
  return repository.createBanner(data);
});

// Update banner provider
final updateBannerProvider = FutureProvider.family<void, ({String id, Map<String, dynamic> data})>((ref, params) async {
  final repository = ref.watch(bannerRepositoryProvider);
  await repository.updateBanner(params.id, params.data);
  ref.invalidate(bannersProvider);
});

// Delete banner provider
final deleteBannerProvider = FutureProvider.family<void, String>((ref, id) async {
  final repository = ref.watch(bannerRepositoryProvider);
  await repository.deleteBanner(id);
  ref.invalidate(bannersProvider);
});

// Toggle banner provider
final toggleBannerProvider = FutureProvider.family<void, ({String id, bool isActive})>((ref, params) async {
  final repository = ref.watch(bannerRepositoryProvider);
  await repository.toggleBanner(params.id, params.isActive);
  ref.invalidate(bannersProvider);
});