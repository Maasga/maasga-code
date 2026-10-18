import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/devis_provider.dart';
import '../../data/models/devis.dart';
import '../widgets/devis_form.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class DevisScreen extends ConsumerStatefulWidget {
  const DevisScreen({super.key});

  @override
  ConsumerState<DevisScreen> createState() => _DevisScreenState();
}

class _DevisScreenState extends ConsumerState<DevisScreen> {
  String _searchQuery = '';
  String _statusFilter = 'all';

  final List<String> _statusFilters = [
    'all',
    'draft',
    'sent',
    'accepted',
    'rejected',
  ];

  void _refreshDevis() {
    ref.invalidate(devisProvider);
    ref.invalidate(devisStatsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final devisAsync = ref.watch(devisProvider);
    final statsAsync = ref.watch(devisStatsProvider);

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: const Text(
          'Gestion des Devis',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AdminTheme.primary),
            tooltip: 'Actualiser',
            onPressed: _refreshDevis,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(160),
          child: Column(
            children: [
              // Stats cards
              statsAsync.when(
                data: (stats) => _buildStatsBar(stats),
                loading: () => const SizedBox(
                  height: 60,
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (_, _) => const SizedBox.shrink(),
              ),
              // Search input
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: MaasgaTokens.spacingMd,
                  vertical: MaasgaTokens.spacingXs,
                ),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher un devis...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: MaasgaTokens.spacingMd,
                      vertical: MaasgaTokens.spacingSm,
                    ),
                    filled: true,
                    fillColor: AdminTheme.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusMd,
                      ),
                      borderSide: const BorderSide(color: AdminTheme.border),
                    ),
                  ),
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val.trim().toLowerCase();
                    });
                  },
                ),
              ),
              // Status filter chips
              SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: MaasgaTokens.spacingMd,
                  ),
                  itemCount: _statusFilters.length,
                  itemBuilder: (context, index) {
                    final filter = _statusFilters[index];
                    final isSelected = _statusFilter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(
                        right: MaasgaTokens.spacingSm,
                      ),
                      child: FilterChip(
                        label: Text(
                          filter == 'all'
                              ? 'Tous'
                              : filter == 'draft'
                              ? 'Brouillons'
                              : filter == 'sent'
                              ? 'Envoyés'
                              : filter == 'accepted'
                              ? 'Acceptés'
                              : 'Refusés',
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            _statusFilter = selected ? filter : 'all';
                          });
                        },
                        selectedColor: AdminTheme.primary.withValues(
                          alpha: 0.2,
                        ),
                        labelStyle: TextStyle(
                          color: isSelected
                              ? AdminTheme.primary
                              : AdminTheme.textSecondary,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      body: devisAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 48,
                color: AdminTheme.error,
              ),
              const SizedBox(height: MaasgaTokens.spacingMd),
              Text('Erreur: $error'),
              const SizedBox(height: MaasgaTokens.spacingSm),
              ElevatedButton(
                onPressed: _refreshDevis,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (devisList) {
          var filteredDevis = devisList;

          // Apply search filter
          if (_searchQuery.isNotEmpty) {
            filteredDevis = filteredDevis.where((d) {
              return d.clientName.toLowerCase().contains(_searchQuery) ||
                  d.clientPhone.contains(_searchQuery);
            }).toList();
          }

          // Apply status filter
          if (_statusFilter != 'all') {
            filteredDevis = filteredDevis
                .where((d) => d.status == _statusFilter)
                .toList();
          }

          if (filteredDevis.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.description_outlined,
                    size: 64,
                    color: AdminTheme.textSecondary,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingMd),
                  const Text('Aucun devis trouvé'),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _refreshDevis(),
            child: ListView.separated(
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              itemCount: filteredDevis.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _buildDevisCard(filteredDevis[index]);
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (context) => Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: const DevisForm(),
            ),
          );
        },
        backgroundColor: AdminTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildDevisCard(Devis devis) {
    Color getStatusColor(String status) {
      switch (status) {
        case 'draft':
          return AdminTheme.secondary;
        case 'sent':
          return AdminTheme.info;
        case 'accepted':
          return AdminTheme.success;
        case 'rejected':
          return AdminTheme.error;
        default:
          return AdminTheme.secondary;
      }
    }

    final statusColor = getStatusColor(devis.status);

    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '#DEV-${devis.id}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AdminTheme.primary,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      devis.formattedDate,
                      style: TextStyle(
                        fontSize: 12,
                        color: AdminTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  devis.statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.person,
                size: 16,
                color: AdminTheme.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                devis.clientName,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '• ${devis.clientPhone}',
                style: const TextStyle(
                  color: AdminTheme.textSecondary,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.list, size: 16, color: AdminTheme.textSecondary),
              const SizedBox(width: 6),
              Text(
                '${devis.items.length} article(s)',
                style: TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                devis.formattedTotal,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: AdminTheme.primary,
                ),
              ),
              Wrap(
                spacing: 6,
                children: [
                  if (devis.status == 'sent') ...[
                    OutlinedButton.icon(
                      onPressed: () => _confirmRejectDevis(devis),
                      icon: const Icon(Icons.close, size: 14),
                      label: const Text(
                        'Refuser',
                        style: TextStyle(fontSize: 12),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AdminTheme.error,
                        side: const BorderSide(color: AdminTheme.error),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 6,
                        ),
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _confirmConvertDevis(devis),
                      icon: const Icon(Icons.shopping_cart, size: 14),
                      label: const Text(
                        'Convertir',
                        style: TextStyle(fontSize: 12),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AdminTheme.success,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                      ),
                    ),
                  ],
                  if (devis.status == 'rejected' || devis.status == 'expired')
                    TextButton.icon(
                      onPressed: () => _archiveDevis(devis.id),
                      icon: const Icon(Icons.archive_outlined, size: 16),
                      label: const Text(
                        'Archiver',
                        style: TextStyle(fontSize: 12),
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor: AdminTheme.textSecondary,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _confirmRejectDevis(Devis devis) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Refuser le devis'),
        content: Text(
          'Voulez-vous marquer le devis #DEV-${devis.id} comme refusé ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AdminTheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Refuser', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm == true && mounted) {
      await ref.read(
        updateDevisStatusProvider({
          'id': devis.id,
          'status': 'rejected',
        }).future,
      );
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Devis refusé')));
      }
    }
  }

  Future<void> _confirmConvertDevis(Devis devis) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Convertir en commande'),
        content: Text(
          'Convertir le devis #DEV-${devis.id} en commande client ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AdminTheme.success,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Convertir',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
    if (confirm == true && mounted) {
      await ref.read(convertDevisProvider(devis.id).future);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Devis converti en commande avec succès'),
          ),
        );
      }
    }
  }

  Future<void> _archiveDevis(int id) async {
    await ref.read(
      updateDevisStatusProvider({'id': id, 'status': 'archived'}).future,
    );
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Devis archivé')));
    }
  }

  Widget _buildStatsBar(Map<String, dynamic> stats) {
    final total =
        stats['total'] as Map<String, dynamic>? ?? {'count': 0, 'amount': 0};
    final drafts = (stats['draft'] is num
        ? (stats['draft'] as num).toInt()
        : 0);
    final accepted = (stats['accepted'] is num
        ? (stats['accepted'] as num).toInt()
        : 0);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: MaasgaTokens.spacingMd,
        vertical: MaasgaTokens.spacingSm,
      ),
      color: AdminTheme.surface,
      child: Row(
        children: [
          Expanded(
            child: _buildStatChip(
              'Total',
              '${total['count']}',
              AdminTheme.primary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatChip(
              'Brouillons',
              '$drafts',
              AdminTheme.secondary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatChip('Acceptés', '$accepted', AdminTheme.success),
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: AdminTheme.textSecondary,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
