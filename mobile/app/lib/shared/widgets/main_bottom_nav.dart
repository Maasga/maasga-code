import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_nav_bar/google_nav_bar.dart';

import '../../features/cart/presentation/cart_state.dart';

class MainBottomNav extends ConsumerWidget {
  const MainBottomNav({super.key, required this.currentPath});

  final String currentPath;

  static const _primaryBlue = Color(0xFF1B3A8D);
  static const _unselected = Color(0xFF9E9E9E);

  int _indexFromPath() {
    if (currentPath.startsWith('/catalog') || currentPath.startsWith('/catalogue')) return 1;
    if (currentPath.startsWith('/simulator') || currentPath.startsWith('/simulateur')) return 2;
    if (currentPath.startsWith('/rdv') || currentPath.startsWith('/rendez-vous') || currentPath.startsWith('/service') || currentPath.startsWith('/support')) return 3;
    if (currentPath.startsWith('/maintenance')) return 4;
    if (currentPath.startsWith('/cart')) return 5;
    if (currentPath.startsWith('/client-space') || currentPath.startsWith('/espace-client')) return 6;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lines = ref.watch(cartProvider);
    final cartCount = lines.fold<int>(0, (sum, line) => sum + line.quantity);

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            blurRadius: 20,
            color: Colors.black.withValues(alpha: .1),
          )
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 8),
          child: GNav(
            rippleColor: _primaryBlue.withValues(alpha: 0.2),
            hoverColor: _primaryBlue.withValues(alpha: 0.1),
            gap: 6,
            activeColor: _primaryBlue,
            iconSize: 22,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            duration: const Duration(milliseconds: 400),
            tabBackgroundColor: _primaryBlue.withValues(alpha: 0.1),
            color: _unselected,
            selectedIndex: _indexFromPath(),
            onTabChange: (index) {
              const routes = <String>[
                '/home',
                '/catalog',
                '/simulator',
                '/rdv',
                '/maintenance',
                '/cart',
                '/client-space',
              ];
              context.go(routes[index]);
            },
            tabs: [
              const GButton(
                icon: Icons.home_outlined,
                text: 'Accueil',
                textStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _primaryBlue),
              ),
              const GButton(
                icon: Icons.grid_view_outlined,
                text: 'Catalogue',
                textStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _primaryBlue),
              ),
              const GButton(
                icon: Icons.calculate_outlined,
                text: 'Simul.',
                textStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _primaryBlue),
              ),
              const GButton(
                icon: Icons.build_outlined,
                text: 'Services',
                textStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _primaryBlue),
              ),
              const GButton(
                icon: Icons.verified_user_outlined,
                text: 'Contrat',
                textStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _primaryBlue),
              ),
              GButton(
                icon: Icons.shopping_cart_outlined,
                text: 'Panier',
                leading: _CartIcon(cartCount: cartCount, isSelected: _indexFromPath() == 5),
                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _primaryBlue),
              ),
              const GButton(
                icon: Icons.person_outline,
                text: 'Profil',
                textStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _primaryBlue),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CartIcon extends StatelessWidget {
  const _CartIcon({required this.cartCount, required this.isSelected});

  final int cartCount;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    const badgeColor = Color(0xFFE53935);
    final iconColor = isSelected ? const Color(0xFF1B3A8D) : const Color(0xFF9E9E9E);

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(
          isSelected ? Icons.shopping_cart : Icons.shopping_cart_outlined, 
          color: iconColor,
          size: 22,
        ),
        if (cartCount > 0)
          Positioned(
            right: -6,
            top: -6,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: badgeColor,
                border: Border.all(color: Colors.white, width: 1),
              ),
              constraints: const BoxConstraints(
                minWidth: 14,
                minHeight: 14,
              ),
              alignment: Alignment.center,
              child: Text(
                cartCount > 9 ? '9' : '$cartCount',
                style: GoogleFonts.poppins(
                  fontSize: 8,
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
