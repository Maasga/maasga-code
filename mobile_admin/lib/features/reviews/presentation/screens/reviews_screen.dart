import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/review_provider.dart';
import '../../data/models/review.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class ReviewsScreen extends ConsumerStatefulWidget {
  const ReviewsScreen({super.key});

  @override
  ConsumerState<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends ConsumerState<ReviewsScreen> {
  @override
  Widget build(BuildContext context) {
    final reviewsAsync = ref.watch(reviewsProvider);

    return Scaffold(
      body: reviewsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AdminTheme.error),
              const SizedBox(height: MaasgaTokens.spacingMd),
              Text('Erreur: $error'),
              const SizedBox(height: MaasgaTokens.spacingSm),
              ElevatedButton(
                onPressed: () => ref.invalidate(reviewsProvider),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (reviews) {
          final pendingReviews = reviews.where((r) => !r.approved).toList();
          final approvedReviews = reviews.where((r) => r.approved).toList();

          return ListView(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            children: [
              if (pendingReviews.isNotEmpty) ...[
                Text(
                  'En attente (${pendingReviews.length})',
                  style: TextStyle(
                    fontSize: MaasgaTokens.fontSizeBody,
                    fontWeight: MaasgaTokens.fontWeightBold,
                    color: AdminTheme.warning,
                  ),
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                ...pendingReviews.map((review) => _buildReviewCard(review)),
                const SizedBox(height: MaasgaTokens.spacingLg),
              ],
              Text(
                'Approuvés (${approvedReviews.length})',
                style: TextStyle(
                  fontSize: MaasgaTokens.fontSizeBody,
                  fontWeight: MaasgaTokens.fontWeightBold,
                  color: AdminTheme.success,
                ),
              ),
              const SizedBox(height: MaasgaTokens.spacingSm),
              ...approvedReviews.map((review) => _buildReviewCard(review)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildReviewCard(Review review) {
    return Card(
      margin: const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
      child: Padding(
        padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        review.name,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: List.generate(5, (index) {
                          return Icon(
                            index < review.rating ? Icons.star : Icons.star_border,
                            color: Colors.amber,
                            size: 16,
                          );
                        }),
                      ),
                    ],
                  ),
                ),
                if (!review.approved)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AdminTheme.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
                      border: Border.all(color: AdminTheme.warning),
                    ),
                    child: Text(
                      'En attente',
                      style: TextStyle(
                        fontSize: 12,
                        color: AdminTheme.warning,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: MaasgaTokens.spacingSm),
            Text(
              review.comment,
              style: TextStyle(color: AdminTheme.textSecondary),
            ),
            if (review.service != null) ...[
              const SizedBox(height: MaasgaTokens.spacingSm),
              Text(
                review.service!,
                style: TextStyle(
                  fontSize: 12,
                  color: AdminTheme.textDisabled,
                ),
              ),
            ],
            const SizedBox(height: MaasgaTokens.spacingSm),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  review.formattedDate,
                  style: TextStyle(
                    fontSize: 12,
                    color: AdminTheme.textDisabled,
                  ),
                ),
                Row(
                  children: [
                    if (!review.approved)
                      IconButton(
                        onPressed: () async {
                          try {
                            await ref.read(updateReviewStatusProvider((
                              id: review.id,
                              approved: true
                            )).future);
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Erreur: $e')),
                              );
                            }
                          }
                        },
                        icon: const Icon(Icons.check_circle, color: AdminTheme.success),
                        tooltip: 'Approuver',
                      ),
                    IconButton(
                      onPressed: () async {
                        try {
                          await ref.read(deleteReviewProvider(review.id).future);
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Erreur: $e')),
                            );
                          }
                        }
                      },
                      icon: const Icon(Icons.delete, color: AdminTheme.error),
                      tooltip: 'Supprimer',
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}