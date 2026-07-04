import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../catalog/domain/product.dart';

class CartLine {
  CartLine({required this.product, required this.quantity});
  final Product product;
  final int quantity;

  int get total => product.price * quantity;
}

class CartNotifier extends Notifier<List<CartLine>> {
  @override
  List<CartLine> build() => [];

  void add(Product product) {
    final index = state.indexWhere((line) => line.product.id == product.id);
    if (index == -1) {
      state = [...state, CartLine(product: product, quantity: 1)];
      return;
    }
    final updated = [...state];
    final line = updated[index];
    updated[index] = CartLine(product: line.product, quantity: line.quantity + 1);
    state = updated;
  }

  void remove(Product product) {
    final index = state.indexWhere((line) => line.product.id == product.id);
    if (index == -1) return;
    final updated = [...state];
    final line = updated[index];
    if (line.quantity <= 1) {
      updated.removeAt(index);
    } else {
      updated[index] = CartLine(product: line.product, quantity: line.quantity - 1);
    }
    state = updated;
  }

  void clear() => state = [];
}

final cartProvider = NotifierProvider<CartNotifier, List<CartLine>>(CartNotifier.new);

final cartTotalProvider = Provider<int>((ref) {
  return ref.watch(cartProvider).fold(0, (sum, line) => sum + line.total);
});
