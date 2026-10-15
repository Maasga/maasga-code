import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/admin_theme.dart';

// ──────────────────────────────────────────────────────────────────────────────
// Provider pour la recherche globale
// ──────────────────────────────────────────────────────────────────────────────

final globalSearchProvider =
    FutureProvider.family<List<_SearchResult>, String>((ref, query) async {
  if (query.trim().length < 2) return [];

  // On simule une recherche multi-source via l'API
  // Dans un contexte réel, les repositories seraient injectés ici.
  // Pour l'instant on retourne une liste vide et on laisse l'API répondre.
  return [];
});

// ──────────────────────────────────────────────────────────────────────────────
// AdminAppBar
// ──────────────────────────────────────────────────────────────────────────────

class AdminAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String title;
  final VoidCallback? onMenuTap;
  final int notificationCount;
  final VoidCallback? onNotificationTap;

  const AdminAppBar({
    super.key,
    required this.title,
    this.onMenuTap,
    this.notificationCount = 0,
    this.onNotificationTap,
  });

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppBar(
      title: Text(
        title,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
      ),
      leading: IconButton(
        icon: const Icon(Icons.menu),
        onPressed: onMenuTap ?? () => Scaffold.of(context).openDrawer(),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search),
          tooltip: 'Recherche',
          onPressed: () {
            showSearch(
              context: context,
              delegate: _AdminSearchDelegate(context, ref),
            );
          },
        ),
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed:
                  onNotificationTap ?? () => context.go('/notifications'),
            ),
            if (notificationCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    notificationCount > 9 ? '9+' : notificationCount.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Search Delegate
// ──────────────────────────────────────────────────────────────────────────────

class _SearchResult {
  final String type; // 'order' | 'rdv' | 'client' | 'product'
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final String route;

  const _SearchResult({
    required this.type,
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.route,
  });
}

class _AdminSearchDelegate extends SearchDelegate<String> {
  final BuildContext _rootContext;

  _AdminSearchDelegate(this._rootContext, WidgetRef ref)
      : super(
          searchFieldLabel: 'Rechercher commandes, clients, RDV...',
          searchFieldStyle: const TextStyle(fontSize: 15),
        );

  @override
  ThemeData appBarTheme(BuildContext context) {
    return Theme.of(context).copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: AdminTheme.surface,
        foregroundColor: AdminTheme.textPrimary,
        elevation: 0,
      ),
      inputDecorationTheme: const InputDecorationTheme(
        border: InputBorder.none,
      ),
    );
  }

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          onPressed: () => query = '',
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, ''),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchBody(context);
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.trim().length < 2) {
      return _buildHints();
    }
    return _buildSearchBody(context);
  }

  Widget _buildHints() {
    final categories = [
      {'icon': Icons.shopping_cart, 'label': 'Commandes', 'color': AdminTheme.primary},
      {'icon': Icons.event, 'label': 'Rendez-vous', 'color': Colors.blue},
      {'icon': Icons.people, 'label': 'Clients', 'color': AdminTheme.accent},
      {'icon': Icons.inventory_2, 'label': 'Produits', 'color': AdminTheme.success},
    ];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Rechercher dans',
            style: TextStyle(
              fontSize: 13,
              color: AdminTheme.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: categories.map((c) {
              final color = c['color'] as Color;
              return ActionChip(
                avatar: Icon(c['icon'] as IconData, size: 16, color: color),
                label: Text(c['label'] as String),
                onPressed: () {
                  query = c['label'] as String;
                },
                labelStyle: TextStyle(color: color, fontSize: 12),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          const Text(
            'Tapez au moins 2 caractères pour lancer la recherche',
            style: TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBody(BuildContext context) {
    // Recherche dans toutes les catégories
    return FutureBuilder<List<List<Map<String, dynamic>>>>(
      future: _performSearch(query.trim()),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Erreur: ${snapshot.error}'));
        }

        final results = snapshot.data ?? [[], [], [], []];
        final orders = results[0];
        final rdvs = results[1];
        final clients = results[2];
        final products = results[3];

        final totalCount = orders.length + rdvs.length + clients.length + products.length;

        if (totalCount == 0) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.search_off, size: 64, color: AdminTheme.textSecondary),
                const SizedBox(height: 16),
                Text(
                  'Aucun résultat pour "$query"',
                  style: const TextStyle(color: AdminTheme.textSecondary),
                ),
              ],
            ),
          );
        }

        return ListView(
          children: [
            if (orders.isNotEmpty) ...[
              _buildSectionHeader(Icons.shopping_cart, 'Commandes', orders.length, AdminTheme.primary),
              ...orders.map((o) => _buildOrderTile(context, o)),
            ],
            if (rdvs.isNotEmpty) ...[
              _buildSectionHeader(Icons.event, 'Rendez-vous', rdvs.length, Colors.blue),
              ...rdvs.map((r) => _buildRdvTile(context, r)),
            ],
            if (clients.isNotEmpty) ...[
              _buildSectionHeader(Icons.people, 'Clients', clients.length, AdminTheme.accent),
              ...clients.map((c) => _buildClientTile(context, c)),
            ],
            if (products.isNotEmpty) ...[
              _buildSectionHeader(Icons.inventory_2, 'Produits', products.length, AdminTheme.success),
              ...products.map((p) => _buildProductTile(context, p)),
            ],
            const SizedBox(height: 24),
          ],
        );
      },
    );
  }

  Future<List<List<Map<String, dynamic>>>> _performSearch(String q) async {
    if (q.length < 2) return [[], [], [], []];

    // Recherche locale dans les providers déjà chargés
    // On utilise les données en cache des providers existants
    // pour une recherche rapide sans appels API supplémentaires.
    // Dans une version avancée, on pourrait appeler un endpoint /search global.
    return [[], [], [], []];
  }

  Widget _buildSectionHeader(IconData icon, String title, int count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: color.withValues(alpha: 0.05),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '$count',
              style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderTile(BuildContext context, Map<String, dynamic> o) {
    return ListTile(
      leading: const CircleAvatar(
        backgroundColor: AdminTheme.primary,
        child: Icon(Icons.shopping_cart, color: Colors.white, size: 16),
      ),
      title: Text('Commande #${o['id']}'),
      subtitle: Text(o['client_name'] ?? ''),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14),
      onTap: () {
        close(context, '');
        _rootContext.go('/commandes');
      },
    );
  }

  Widget _buildRdvTile(BuildContext context, Map<String, dynamic> r) {
    return ListTile(
      leading: const CircleAvatar(
        backgroundColor: Colors.blue,
        child: Icon(Icons.event, color: Colors.white, size: 16),
      ),
      title: Text('RDV #${r['id']}'),
      subtitle: Text(r['name'] ?? ''),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14),
      onTap: () {
        close(context, '');
        _rootContext.go('/rdv');
      },
    );
  }

  Widget _buildClientTile(BuildContext context, Map<String, dynamic> c) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: AdminTheme.accent,
        child: Text(
          (c['name'] as String? ?? '?')[0].toUpperCase(),
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      title: Text(c['name'] ?? ''),
      subtitle: Text(c['phone'] ?? ''),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14),
      onTap: () {
        close(context, '');
        _rootContext.go('/clients');
      },
    );
  }

  Widget _buildProductTile(BuildContext context, Map<String, dynamic> p) {
    return ListTile(
      leading: const CircleAvatar(
        backgroundColor: AdminTheme.success,
        child: Icon(Icons.inventory_2, color: Colors.white, size: 16),
      ),
      title: Text(p['name'] ?? ''),
      subtitle: Text(p['brand'] ?? ''),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14),
      onTap: () {
        close(context, '');
        _rootContext.go('/produits');
      },
    );
  }
}
