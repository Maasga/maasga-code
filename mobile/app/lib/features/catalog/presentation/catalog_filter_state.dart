import 'package:flutter_riverpod/flutter_riverpod.dart';

class CatalogFilterNotifier extends Notifier<Map<String, dynamic>> {
  @override
  Map<String, dynamic> build() => {};

  void updateFilters(Map<String, dynamic> filters) {
    state = filters;
  }
}

final catalogFilterProvider = NotifierProvider<CatalogFilterNotifier, Map<String, dynamic>>(CatalogFilterNotifier.new);
