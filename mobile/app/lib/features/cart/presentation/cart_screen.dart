import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/widgets/main_bottom_nav.dart';
import 'cart_item_card.dart';
import 'cart_state.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  final TextEditingController _promoController = TextEditingController();
  bool _isPromoValid = false;
  bool _isPromoInvalid = false;
  static const double _remise = 100.0;
  static const String _validPromoCode = 'DROPSYEARAND';

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  void _applyPromo() {
    final code = _promoController.text.trim().toUpperCase();
    setState(() {
      if (code == _validPromoCode) {
        _isPromoValid = true;
        _isPromoInvalid = false;
      } else {
        _isPromoValid = false;
        _isPromoInvalid = true;
      }
    });
  }

  Future<bool?> _showDeleteDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          "Supprimer l'article ?",
          style: GoogleFonts.poppins(
              fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF1A1A1A)),
        ),
        content: Text(
          'Voulez-vous retirer ce produit du panier ?',
          style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF757575)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'Annuler',
              style: GoogleFonts.poppins(
                  fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFF757575)),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE53935),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              'Supprimer',
              style: GoogleFonts.poppins(
                  fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  String _formatPrice(double price) {
    final intPart = price.toInt().toString().replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ');
    return '$intPart FCFA';
  }


  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final cartNotifier = ref.read(cartProvider.notifier);

    final double sousTotal = cart.fold(0.0, (sum, line) => sum + line.product.price * line.quantity);
    final double remise = _isPromoValid ? _remise : 0.0;
    final double total = sousTotal - remise;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Column(
          children: [
            // 1. HEADER
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Color.fromRGBO(0, 0, 0, 0.05),
                    blurRadius: 12,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/home');
                      }
                    },
                    icon: const Icon(Icons.arrow_back, color: Color(0xFF1A1A1A)),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  Expanded(
                    child: Center(
                      child: Text(
                        'Panier',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1A1A1A),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            // 2-4. SCROLLABLE CONTENT
            Expanded(
              child: cart.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.shopping_cart_outlined,
                              size: 64, color: Color(0xFFBDBDBD)),
                          const SizedBox(height: 16),
                          Text(
                            'Votre panier est vide',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF757575),
                            ),
                          ),
                        ],
                      ),
                    )
                  : SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // LISTE PRODUITS
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            itemCount: cart.length,
                            itemBuilder: (context, index) {
                              final line = cart[index];
                              return Dismissible(
                                key: ValueKey(line.product.id),
                                direction: DismissDirection.endToStart,
                                confirmDismiss: (_) async {
                                  return await _showDeleteDialog(context) ?? false;
                                },
                                onDismissed: (_) {
                                  // Remove all quantity of this product
                                  final notifier = ref.read(cartProvider.notifier);
                                  for (int i = 0; i < line.quantity; i++) {
                                    notifier.remove(line.product);
                                  }
                                },
                                background: Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE53935),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 20),
                                  child: const Icon(Icons.delete_outline,
                                      color: Colors.white, size: 28),
                                ),
                                child: CartItemCard(
                                  line: line,
                                  onIncrement: () => cartNotifier.add(line.product),
                                  onDecrement: () async {
                                    if (line.quantity == 1) {
                                      final confirmed =
                                          await _showDeleteDialog(context) ?? false;
                                      if (confirmed) {
                                        cartNotifier.remove(line.product);
                                      }
                                    } else {
                                      cartNotifier.remove(line.product);
                                    }
                                  },
                                ),
                              );
                            },
                          ),

                          // 3. CODE PROMO
                          Container(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Avez-vous un code promo ?',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF1A1A1A),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Expanded(
                                      child: TextField(
                                        controller: _promoController,
                                        textCapitalization:
                                            TextCapitalization.characters,
                                        style: GoogleFonts.poppins(
                                            fontSize: 13,
                                            color: const Color(0xFF1A1A1A)),
                                        decoration: InputDecoration(
                                          hintText: 'Entrez votre code',
                                          hintStyle: GoogleFonts.poppins(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w400,
                                            color: const Color(0xFF9E9E9E),
                                          ),
                                          contentPadding:
                                              const EdgeInsets.symmetric(
                                                  horizontal: 12, vertical: 14),
                                          filled: true,
                                          fillColor: const Color(0xFFF5F5F5),
                                          border: OutlineInputBorder(
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            borderSide: const BorderSide(
                                                color: Color(0xFFE0E0E0)),
                                          ),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            borderSide: const BorderSide(
                                                color: Color(0xFFE0E0E0)),
                                          ),
                                          focusedBorder: OutlineInputBorder(
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            borderSide: const BorderSide(
                                                color: Color(0xFF1B3A8D)),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    ElevatedButton(
                                      onPressed: _applyPromo,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor:
                                            const Color(0xFF1B3A8D),
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 14, vertical: 14),
                                      ),
                                      child: Text(
                                        'Appliquer',
                                        style: GoogleFonts.poppins(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                if (_isPromoValid) ...[
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      const Icon(Icons.check_circle,
                                          color: Color(0xFF43A047), size: 16),
                                      const SizedBox(width: 6),
                                      Text(
                                        _promoController.text.trim(),
                                        style: GoogleFonts.poppins(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: const Color(0xFF1A1A1A),
                                        ),
                                      ),
                                      const Spacer(),
                                      Text(
                                        'Available',
                                        style: GoogleFonts.poppins(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: const Color(0xFF43A047),
                                        ),
                                      ),
                                    ],
                                  ),
                                ] else if (_isPromoInvalid) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    'Code invalide',
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w400,
                                      color: const Color(0xFFE53935),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),

                          // 4. RÉCAPITULATIF
                          Container(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      'Sous-total',
                                      style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w400,
                                          color: const Color(0xFF757575)),
                                    ),
                                    const Spacer(),
                                    Text(
                                      _formatPrice(sousTotal),
                                      style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF1A1A1A)),
                                    ),
                                  ],
                                ),
                                if (_isPromoValid) ...[
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Text(
                                        'Remise',
                                        style: GoogleFonts.poppins(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w400,
                                            color: const Color(0xFF757575)),
                                      ),
                                      const Spacer(),
                                      Text(
                                        '-${_formatPrice(remise)}',
                                        style: GoogleFonts.poppins(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: const Color(0xFFE53935)),
                                      ),
                                    ],
                                  ),
                                ],
                                const Divider(height: 20, color: Color(0xFFF0F0F0)),
                                Row(
                                  children: [
                                    Text(
                                      'Total',
                                      style: GoogleFonts.poppins(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF1A1A1A)),
                                    ),
                                    const Spacer(),
                                    Text(
                                      _formatPrice(total),
                                      style: GoogleFonts.poppins(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF1B3A8D)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                        ],
                      ),
                    ),
            ),

            // 5. BOUTON VALIDER (fixe en bas)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Color.fromRGBO(0, 0, 0, 0.08),
                    blurRadius: 12,
                    offset: Offset(0, -3),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: cart.isEmpty
                      ? null
                      : () => context.push('/checkout'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B3A8D),
                    disabledBackgroundColor: const Color(0xFFBDBDBD),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    'Valider la commande',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),

            // Bottom nav
            const MainBottomNav(currentPath: '/cart'),
          ],
        ),
      ),
    );
  }
}
