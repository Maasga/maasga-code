import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../features/auth/data/repositories/auth_repository.dart';
import '../../../features/auth/data/providers/firebase_provider.dart';

class NavDrawer extends ConsumerWidget {
  const NavDrawer({super.key});

  final List<NavItem> _navItems = const [
    NavItem(
      icon: Icons.dashboard_outlined,
      label: 'Dashboard',
      route: '/dashboard',
      category: 'Principal',
    ),
    NavItem(
      icon: Icons.inventory_2_outlined,
      label: 'Produits',
      route: '/produits',
      category: 'Principal',
    ),
    NavItem(
      icon: Icons.shopping_cart_outlined,
      label: 'Commandes',
      route: '/commandes',
      category: 'Principal',
    ),
    NavItem(
      icon: Icons.calendar_today_outlined,
      label: 'Rendez-vous',
      route: '/rdv',
      category: 'Principal',
    ),
    NavItem(
      icon: Icons.description_outlined,
      label: 'Devis',
      route: '/devis',
      category: 'Commercial',
    ),
    NavItem(
      icon: Icons.payment_outlined,
      label: 'Paiements',
      route: '/paiements',
      category: 'Commercial',
    ),
    NavItem(
      icon: Icons.people_outline,
      label: 'Clients',
      route: '/clients',
      category: 'Commercial',
    ),
    NavItem(
      icon: Icons.build_outlined,
      label: 'Maintenance',
      route: '/maintenance',
      category: 'Service',
    ),
    NavItem(
      icon: Icons.support_agent_outlined,
      label: 'SAV',
      route: '/sav',
      category: 'Service',
    ),
    NavItem(
      icon: Icons.message_outlined,
      label: 'Messages',
      route: '/messages',
      category: 'Service',
    ),
    NavItem(
      icon: Icons.star_outline,
      label: 'Avis',
      route: '/avis',
      category: 'Marketing',
    ),
    NavItem(
      icon: Icons.photo_library_outlined,
      label: 'Réalisations',
      route: '/realisations',
      category: 'Marketing',
    ),
    NavItem(
      icon: Icons.campaign_outlined,
      label: 'Bannières',
      route: '/banners',
      category: 'Marketing',
    ),
    NavItem(
      icon: Icons.receipt_long_outlined,
      label: 'Audit',
      route: '/audit',
      category: 'Système',
    ),
    NavItem(
      icon: Icons.notifications_outlined,
      label: 'Notifications',
      route: '/notifications',
      category: 'Système',
    ),
    NavItem(
      icon: Icons.settings_outlined,
      label: 'Paramètres',
      route: '/parametres',
      category: 'Système',
    ),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentRoute = ModalRoute.of(context)?.settings.name ?? '/';

    return Drawer(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0F1A2E), Color(0xFF1A3478)],
          ),
        ),
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              decoration: BoxDecoration(color: Colors.transparent),
              accountName: const Text(
                'Administrateur',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              accountEmail: const Text(
                'admin@maasga.bf',
                style: TextStyle(color: Color(0xFF93C5FD)),
              ),
              currentAccountPicture: CircleAvatar(
                backgroundColor: const Color(0xFFD4AF37),
                child: Icon(Icons.person, color: Colors.black[87]),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: _buildNavItems(currentRoute),
              ),
            ),
            _buildFooter(context, ref),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildNavItems(String currentRoute) {
    String? currentCategory;
    List<Widget> items = [];

    for (final item in _navItems) {
      if (item.category != currentCategory) {
        currentCategory = item.category;
        items.add(
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              currentCategory!,
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
          ),
        );
      }

      final isActive = currentRoute == item.route;
      items.add(
        ListTile(
          leading: Icon(
            item.icon,
            color: isActive ? Colors.white : const Color(0xFF93C5FD),
          ),
          title: Text(
            item.label,
            style: TextStyle(
              color: isActive ? Colors.white : const Color(0xFF93C5FD),
              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          onTap: () {
            Navigator.pushReplacementNamed(context, item.route);
          },
          selected: isActive,
          selectedTileColor: Colors.white.withOpacity(0.2),
        ),
      );
    }

    return items;
  }

  Widget _buildFooter(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        const Divider(color: Colors.white24),
        ListTile(
          leading: const Icon(Icons.public, color: Color(0xFF93C5FD)),
          title: const Text(
            'Voir le site public',
            style: TextStyle(color: Color(0xFF93C5FD)),
          ),
          onTap: () {
            // TODO: Ouvrir site public
          },
        ),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.redAccent),
          title: const Text(
            'Déconnexion',
            style: TextStyle(color: Colors.redAccent),
          ),
          onTap: () async {
            final authRepository = ref.read(authRepositoryProvider);
            await authRepository.signOut();
            Navigator.pushReplacementNamed(context, '/login');
          },
        ),
      ],
    );
  }
}

class NavItem {
  final IconData icon;
  final String label;
  final String route;
  final String category;

  const NavItem({
    required this.icon,
    required this.label,
    required this.route,
    required this.category,
  });
}
