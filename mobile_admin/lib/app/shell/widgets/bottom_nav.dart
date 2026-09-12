import 'package:flutter/material.dart';

class BottomNav extends StatelessWidget {
  final String currentRoute;
  final Function(String) onNavigate;

  const BottomNav({
    super.key,
    required this.currentRoute,
    required this.onNavigate,
  });

  final List<_BottomNavItem> _items = const [
    _BottomNavItem(
      icon: Icons.dashboard_outlined,
      activeIcon: Icons.dashboard,
      label: 'Dashboard',
      route: '/dashboard',
    ),
    _BottomNavItem(
      icon: Icons.shopping_cart_outlined,
      activeIcon: Icons.shopping_cart,
      label: 'Commandes',
      route: '/commandes',
    ),
    _BottomNavItem(
      icon: Icons.calendar_today_outlined,
      activeIcon: Icons.calendar_today,
      label: 'RDV',
      route: '/rdv',
    ),
    _BottomNavItem(
      icon: Icons.inventory_2_outlined,
      activeIcon: Icons.inventory_2,
      label: 'Produits',
      route: '/produits',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _items.indexWhere(
      (item) => item.route == currentRoute,
    );

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: selectedIndex < 0 ? 0 : selectedIndex,
        onTap: (index) => onNavigate(_items[index].route),
        type: BottomNavigationBarType.fixed,
        items: _items.map((item) {
          final isActive = currentRoute == item.route;
          return BottomNavigationBarItem(
            icon: Icon(isActive ? item.activeIcon : item.icon),
            label: item.label,
          );
        }).toList(),
      ),
    );
  }
}

class _BottomNavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String route;

  const _BottomNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.route,
  });
}
