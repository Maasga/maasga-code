import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/badge_providers.dart';

class BottomNav extends ConsumerWidget {
  final String currentRoute;
  final Function(String) onNavigate;

  const BottomNav({
    super.key,
    required this.currentRoute,
    required this.onNavigate,
  });

  static const List<_BottomNavItem> _items = [
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
      badgeKey: 'orders',
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
    _BottomNavItem(
      icon: Icons.people_outlined,
      activeIcon: Icons.people,
      label: 'Clients',
      route: '/clients',
    ),
    _BottomNavItem(
      icon: Icons.star_outlined,
      activeIcon: Icons.star,
      label: 'Avis',
      route: '/avis',
    ),
    _BottomNavItem(
      icon: Icons.image_outlined,
      activeIcon: Icons.image,
      label: 'Bannières',
      route: '/banners',
    ),
    _BottomNavItem(
      icon: Icons.settings_outlined,
      activeIcon: Icons.settings,
      label: 'Paramètres',
      route: '/parametres',
    ),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIndex = _items.indexWhere(
      (item) => item.route == currentRoute,
    );

    final ordersBadge = ref.watch(ordersBadgeProvider);
    final messagesBadge = ref.watch(messagesBadgeProvider);
    final savBadge = ref.watch(savBadgeProvider);

    Map<String, int> badges = {
      'orders': ordersBadge,
      'messages': messagesBadge,
      'sav': savBadge,
    };

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
          final badgeCount = item.badgeKey != null
              ? (badges[item.badgeKey] ?? 0)
              : 0;

          Widget iconWidget = Icon(isActive ? item.activeIcon : item.icon);

          if (badgeCount > 0) {
            iconWidget = Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(isActive ? item.activeIcon : item.icon),
                Positioned(
                  right: -6,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    decoration: const BoxDecoration(
                      color: Color(0xFFEF4444),
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      badgeCount > 99 ? '99+' : '$badgeCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            );
          }

          return BottomNavigationBarItem(
            icon: iconWidget,
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
  final String? badgeKey;

  const _BottomNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.route,
    this.badgeKey,
  });
}
