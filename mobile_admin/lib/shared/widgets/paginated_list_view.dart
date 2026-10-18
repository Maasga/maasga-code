import 'package:flutter/material.dart';
import '../../core/providers/pagination_notifier.dart';
import '../widgets/empty_state.dart';
import '../widgets/error_state.dart';

/// Widget réutilisable pour les listes infinies paginées.
/// Affiche un loader en bas de liste quand hasMore == true.
class PaginatedListView<T> extends StatefulWidget {
  final PaginationState<T> state;
  final Widget Function(BuildContext, T, int) itemBuilder;
  final VoidCallback onLoadMore;
  final VoidCallback onRefresh;
  final String emptyTitle;
  final String? emptySubtitle;
  final IconData emptyIcon;
  final EdgeInsets? padding;
  final Widget? Function(BuildContext)? headerBuilder;

  const PaginatedListView({
    super.key,
    required this.state,
    required this.itemBuilder,
    required this.onLoadMore,
    required this.onRefresh,
    this.emptyTitle = 'Aucun élément',
    this.emptySubtitle,
    this.emptyIcon = Icons.inbox_outlined,
    this.padding,
    this.headerBuilder,
  });

  @override
  State<PaginatedListView<T>> createState() => _PaginatedListViewState<T>();
}

class _PaginatedListViewState<T> extends State<PaginatedListView<T>> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      widget.onLoadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;

    if (s.error != null && s.items.isEmpty) {
      return ErrorState(
        message: s.error!,
        onRetry: widget.onRefresh,
      );
    }

    if (!s.isLoading && s.items.isEmpty) {
      return EmptyState(
        title: widget.emptyTitle,
        subtitle: widget.emptySubtitle,
        icon: widget.emptyIcon,
      );
    }

    final header = widget.headerBuilder?.call(context);
    final totalCount = s.items.length + (s.hasMore ? 1 : 0) + (header != null ? 1 : 0);
    int offset = header != null ? 1 : 0;

    return RefreshIndicator(
      onRefresh: () async => widget.onRefresh(),
      child: ListView.builder(
        controller: _scrollController,
        padding: widget.padding ?? const EdgeInsets.all(16),
        itemCount: totalCount,
        itemBuilder: (context, index) {
          if (header != null && index == 0) return header;

          final itemIndex = index - offset;

          // Loader de fin de liste
          if (itemIndex >= s.items.length) {
            if (s.isLoading) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            return const SizedBox.shrink();
          }

          return widget.itemBuilder(context, s.items[itemIndex], itemIndex);
        },
      ),
    );
  }
}
