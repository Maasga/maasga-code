import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/review_repository.dart';
import '../models/review.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  return ReviewRepository(ref.watch(dioProvider));
});

// Reviews provider
final reviewsProvider = FutureProvider<List<Review>>((ref) async {
  final repository = ref.watch(reviewRepositoryProvider);
  return repository.getReviews();
});

// Update review status provider
final updateReviewStatusProvider = FutureProvider.family<void, ({String id, bool approved})>((ref, params) async {
  final repository = ref.watch(reviewRepositoryProvider);
  await repository.updateReviewStatus(params.id, params.approved);
  ref.invalidate(reviewsProvider);
});

// Delete review provider
final deleteReviewProvider = FutureProvider.family<void, String>((ref, id) async {
  final repository = ref.watch(reviewRepositoryProvider);
  await repository.deleteReview(id);
  ref.invalidate(reviewsProvider);
});