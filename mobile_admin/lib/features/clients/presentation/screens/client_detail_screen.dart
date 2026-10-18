import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/client_provider.dart';
import '../../data/models/client.dart';
import '../widgets/client_form.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class ClientDetailScreen extends ConsumerStatefulWidget {
  final Client client;

  const ClientDetailScreen({super.key, required this.client});

  @override
  ConsumerState<ClientDetailScreen> createState() => _ClientDetailScreenState();
}

class _ClientDetailScreenState extends ConsumerState<ClientDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late Client _client;

  @override
  void initState() {
    super.initState();
    _client = widget.client;
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: Text(
          _client.name,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AdminTheme.primary),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit, color: AdminTheme.primary),
            tooltip: 'Modifier',
            onPressed: _openEditForm,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AdminTheme.primary,
          unselectedLabelColor: AdminTheme.textSecondary,
          indicatorColor: AdminTheme.primary,
          tabs: const [
            Tab(text: 'Infos', icon: Icon(Icons.person, size: 18)),
            Tab(text: 'Commandes', icon: Icon(Icons.shopping_cart, size: 18)),
            Tab(text: 'RDV', icon: Icon(Icons.event, size: 18)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _InfoTab(client: _client),
          _OrdersTab(clientId: _client.id),
          _RdvTab(clientId: _client.id),
        ],
      ),
    );
  }

  void _openEditForm() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('Modifier le client'),
            backgroundColor: AdminTheme.surface,
          ),
          body: ClientForm(
            client: _client,
            onSave: (updatedClient) {
              setState(() => _client = updatedClient);
              ref.invalidate(clientsProvider);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Client modifié avec succès'),
                  backgroundColor: AdminTheme.success,
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

// ────────────────── ONGLET INFORMATIONS ──────────────────

class _InfoTab extends StatelessWidget {
  final Client client;

  const _InfoTab({required this.client});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        children: [
          // Avatar + nom
          Container(
            decoration: AdminTheme.cardDecoration,
            padding: const EdgeInsets.all(MaasgaTokens.spacingLg),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: AdminTheme.primary,
                  child: Text(
                    client.name[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: MaasgaTokens.spacingMd),
                Text(
                  client.name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AdminTheme.textPrimary,
                  ),
                ),
                Text(
                  'Client depuis ${client.formattedDate}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AdminTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: MaasgaTokens.spacingMd),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _StatBadge(
                      icon: Icons.shopping_cart,
                      label: '${client.orderCount} commandes',
                      color: AdminTheme.primary,
                    ),
                    const SizedBox(width: MaasgaTokens.spacingMd),
                    _StatBadge(
                      icon: Icons.event,
                      label: '${client.rdvCount} RDV',
                      color: AdminTheme.accent,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          // Coordonnées
          Container(
            decoration: AdminTheme.cardDecoration,
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _SectionHeader(
                  icon: Icons.contact_phone,
                  title: 'Coordonnées',
                ),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _InfoRow(
                  icon: Icons.phone,
                  label: 'Téléphone',
                  value: client.phone,
                ),
                if (client.email != null)
                  _InfoRow(
                    icon: Icons.email,
                    label: 'Email',
                    value: client.email!,
                  ),
                if (client.quartier != null)
                  _InfoRow(
                    icon: Icons.location_city,
                    label: 'Quartier',
                    value: client.quartier!,
                  ),
                if (client.adressePrecise != null)
                  _InfoRow(
                    icon: Icons.location_on,
                    label: 'Adresse',
                    value: client.adressePrecise!,
                  ),
              ],
            ),
          ),
          if (client.notes != null && client.notes!.isNotEmpty) ...[
            const SizedBox(height: MaasgaTokens.spacingMd),
            Container(
              decoration: AdminTheme.cardDecoration,
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _SectionHeader(icon: Icons.notes, title: 'Notes'),
                  const SizedBox(height: MaasgaTokens.spacingMd),
                  Text(
                    client.notes!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AdminTheme.textPrimary,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ────────────────── ONGLET COMMANDES ──────────────────

class _OrdersTab extends ConsumerWidget {
  final String clientId;

  const _OrdersTab({required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(clientOrdersProvider(clientId));

    return ordersAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AdminTheme.error),
            const SizedBox(height: MaasgaTokens.spacingMd),
            Text('Erreur: $e'),
            const SizedBox(height: MaasgaTokens.spacingSm),
            ElevatedButton(
              onPressed: () => ref.invalidate(clientOrdersProvider(clientId)),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
      data: (orders) {
        if (orders.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.shopping_cart_outlined,
                  size: 64,
                  color: AdminTheme.textSecondary,
                ),
                SizedBox(height: MaasgaTokens.spacingMd),
                Text('Aucune commande pour ce client'),
              ],
            ),
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
          itemCount: orders.length,
          separatorBuilder: (_, _) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final order = orders[index] as Map<String, dynamic>;
            return _OrderListTile(order: order);
          },
        );
      },
    );
  }
}

class _OrderListTile extends StatelessWidget {
  final Map<String, dynamic> order;

  const _OrderListTile({required this.order});

  @override
  Widget build(BuildContext context) {
    final status = order['status'] as String? ?? '';
    final statusColor = _statusColor(status);
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
            ),
            child: Icon(Icons.shopping_bag, color: statusColor, size: 20),
          ),
          const SizedBox(width: MaasgaTokens.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Commande #${order['id']}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                Text(
                  order['product_name'] ?? 'Produit',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AdminTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${order['total_price'] ?? 0} FCFA',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AdminTheme.primary,
                  fontSize: 13,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _statusLabel(status),
                  style: TextStyle(
                    fontSize: 10,
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'en_attente':
        return Colors.orange;
      case 'confirme':
        return Colors.blue;
      case 'en_livraison':
        return Colors.purple;
      case 'livre':
        return AdminTheme.success;
      case 'annule':
        return AdminTheme.error;
      default:
        return AdminTheme.secondary;
    }
  }

  String _statusLabel(String s) {
    switch (s) {
      case 'en_attente':
        return 'En attente';
      case 'confirme':
        return 'Confirmée';
      case 'en_livraison':
        return 'En cours';
      case 'livre':
        return 'Livrée';
      case 'annule':
        return 'Annulée';
      default:
        return s;
    }
  }
}

// ────────────────── ONGLET RDV ──────────────────

class _RdvTab extends ConsumerWidget {
  final String clientId;

  const _RdvTab({required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rdvAsync = ref.watch(clientRdvProvider(clientId));

    return rdvAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AdminTheme.error),
            const SizedBox(height: MaasgaTokens.spacingMd),
            Text('Erreur: $e'),
            const SizedBox(height: MaasgaTokens.spacingSm),
            ElevatedButton(
              onPressed: () => ref.invalidate(clientRdvProvider(clientId)),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
      data: (rdvList) {
        if (rdvList.isEmpty) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.event_busy,
                  size: 64,
                  color: AdminTheme.textSecondary,
                ),
                SizedBox(height: MaasgaTokens.spacingMd),
                Text('Aucun RDV pour ce client'),
              ],
            ),
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
          itemCount: rdvList.length,
          separatorBuilder: (_, _) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final rdv = rdvList[index] as Map<String, dynamic>;
            return _RdvListTile(rdv: rdv);
          },
        );
      },
    );
  }
}

class _RdvListTile extends StatelessWidget {
  final Map<String, dynamic> rdv;

  const _RdvListTile({required this.rdv});

  @override
  Widget build(BuildContext context) {
    final status = rdv['status'] as String? ?? '';
    final statusColor = _statusColor(status);
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
            ),
            child: Icon(Icons.event, color: statusColor, size: 20),
          ),
          const SizedBox(width: MaasgaTokens.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'RDV #${rdv['id']}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                Text(
                  '${rdv['date'] ?? ''} ${rdv['heure_debut'] != null ? 'à ${rdv['heure_debut']}' : ''}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AdminTheme.textSecondary,
                  ),
                ),
                if (rdv['quartier'] != null)
                  Text(
                    rdv['quartier'] as String,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AdminTheme.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _statusLabel(status),
              style: TextStyle(
                fontSize: 10,
                color: statusColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.blue;
      case 'done':
      case 'completed':
        return AdminTheme.success;
      case 'cancelled':
        return AdminTheme.error;
      default:
        return AdminTheme.secondary;
    }
  }

  String _statusLabel(String s) {
    switch (s) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'done':
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return s;
    }
  }
}

// ────────────────── SHARED WIDGETS ──────────────────

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  const _SectionHeader({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AdminTheme.primary),
        const SizedBox(width: MaasgaTokens.spacingSm),
        Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AdminTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AdminTheme.textSecondary),
          const SizedBox(width: MaasgaTokens.spacingSm),
          Text(
            '$label : ',
            style: const TextStyle(
              fontSize: 13,
              color: AdminTheme.textSecondary,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AdminTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _StatBadge({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
