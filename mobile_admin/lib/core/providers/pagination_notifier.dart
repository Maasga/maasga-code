import 'package:flutter_riverpod/flutter_riverpod.dart';

/// État de pagination générique pour les listes infinies.
class PaginationState<T> {
  final List<T> items;
  final bool isLoading;
  final bool hasMore;
  final String? error;
  final int page;

  const PaginationState({
    this.items = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.error,
    this.page = 0,
  });

  PaginationState<T> copyWith({
    List<T>? items,
    bool? isLoading,
    bool? hasMore,
    String? error,
    int? page,
  }) {
    return PaginationState<T>(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      error: error,
      page: page ?? this.page,
    );
  }
}

/// Notifier générique pour la pagination infinie (20 items par page).
abstract class PaginatedNotifier<T> extends Notifier<PaginationState<T>> {
  static const int pageSize = 20;

  @override
  PaginationState<T> build() {
    // Charger la première page au démarrage
    Future.microtask(() => loadMore());
    return const PaginationState();
  }

  /// Méthode à implémenter dans les sous-classes pour charger une page.
  Future<List<T>> fetchPage(int offset, int limit);

  /// Charge la page suivante.
  Future<void> loadMore() async {
    final current = state;
    if (current.isLoading || !current.hasMore) return;

    state = current.copyWith(isLoading: true, error: null);

    try {
      final offset = current.items.length;
      final newItems = await fetchPage(offset, pageSize);
      state = current.copyWith(
        items: [...current.items, ...newItems],
        isLoading: false,
        hasMore: newItems.length >= pageSize,
        page: current.page + 1,
      );
    } catch (e) {
      state = current.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Réinitialise et recharge depuis le début.
  Future<void> refresh() async {
    state = const PaginationState();
    await loadMore();
  }
}
