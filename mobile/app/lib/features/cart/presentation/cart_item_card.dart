import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/utils/asset_utils.dart';
import 'cart_state.dart';

class CartItemCard extends StatelessWidget {
  const CartItemCard({
    required this.line,
    required this.onIncrement,
    required this.onDecrement,
    super.key,
  });

  final CartLine line;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  String _formatPrice(int price) {
    return '${price.toString().replaceAllMapped(RegExp(r"(\d{1,3})(?=(\d{3})+(?!\d))"), (m) => "${m[1]} ")} FCFA';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 80,
              height: 80,
              color: const Color(0xFFF5F5F5),
              child: Image.asset(
                AssetUtils.getAssetPath(line.product.image),
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => Image.asset('assets/products/product_placeholder.png'),
              ),
            ),
          ),
          // Infos
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    line.product.name,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1A1A1A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        _formatPrice(line.product.price),
                        style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF1B3A8D),
                        ),
                      ),
                      const Spacer(),
                      // Quantity controls
                      Row(
                        children: [
                          // Minus button
                          GestureDetector(
                            onTap: onDecrement,
                            child: Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF5F5F5),
                                shape: BoxShape.circle,
                                border: Border.all(
                                    color: const Color(0xFFE0E0E0), width: 1),
                              ),
                              child: const Icon(Icons.remove,
                                  size: 14, color: Color(0xFF1A1A1A)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            '${line.quantity}',
                            style: GoogleFonts.poppins(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF1A1A1A),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Plus button
                          GestureDetector(
                            onTap: onIncrement,
                            child: Container(
                              width: 26,
                              height: 26,
                              decoration: const BoxDecoration(
                                color: Color(0xFF1B3A8D),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.add,
                                  size: 14, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
