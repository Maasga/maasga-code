import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/payment_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import '../widgets/payment_card.dart';
import '../widgets/payment_stats_card.dart';
import '../widgets/payment_form.dart';

class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  String _statusFilter = 'all';

  final List<String> _statusFilters = [
    'all',
    'pending',
    'completed',
    'failed',
    'refunded',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _refreshPayments() {
    ref.invalidate(paymentsProvider);
    ref.invalidate(paymentStatsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final paymentsAsync = ref.watch(paymentsProvider);
    final statsAsync = ref.watch(paymentStatsProvider);

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: const Text(
          'Gestion des Paiements',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AdminTheme.primary),
            tooltip: 'Actualiser',
            onPressed: _refreshPayments,
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
                    hintText: 'Rechercher un paiement...',
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
                              : filter == 'pending'
                              ? 'En attente'
                              : filter == 'completed'
                              ? 'Payés'
                              : filter == 'failed'
                              ? 'Échoués'
                              : 'Remboursés',
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
      body: paymentsAsync.when(
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
                onPressed: _refreshPayments,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (payments) {
          var filteredPayments = payments;

          // Apply search filter
          if (_searchQuery.isNotEmpty) {
            filteredPayments = filteredPayments.where((p) {
              final transactionId = p.transactionId?.toLowerCase();
              final ligdiStatus = p.ligdiStatus?.toLowerCase();
              final paymentMethod = p.paymentMethod?.toLowerCase();
              return (transactionId?.contains(_searchQuery) ?? false) ||
                  (ligdiStatus?.contains(_searchQuery) ?? false) ||
                  (paymentMethod?.contains(_searchQuery) ?? false);
            }).toList();
          }

          // Apply status filter
          if (_statusFilter != 'all') {
            filteredPayments = filteredPayments
                .where((p) => p.status == _statusFilter)
                .toList();
          }

          if (filteredPayments.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.payments_outlined,
                    size: 64,
                    color: AdminTheme.textSecondary,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingMd),
                  const Text('Aucun paiement trouvé'),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _refreshPayments(),
            child: ListView.separated(
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              itemCount: filteredPayments.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return PaymentCard(
                  payment: filteredPayments[index],
                  onStatusUpdate: (newStatus) async {
                    final messenger = ScaffoldMessenger.of(context);
                    try {
                      await ref.read(
                        updatePaymentStatusProvider({
                          'id': filteredPayments[index].id,
                          'status': newStatus,
                        }).future,
                      );
                      messenger.showSnackBar(
                        const SnackBar(
                          content: Text('Statut mis à jour avec succès'),
                          backgroundColor: AdminTheme.success,
                        ),
                      );
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('Erreur: $e'),
                          backgroundColor: AdminTheme.error,
                        ),
                      );
                    }
                  },
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => Scaffold(
                appBar: AppBar(title: const Text('Nouveau Paiement')),
                body: PaymentForm(
                  onSave: () {
                    _refreshPayments();
                  },
                ),
              ),
            ),
          );
        },
        backgroundColor: AdminTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildStatsBar(Map<String, dynamic> stats) {
    // Safe extraction — API may return Map<String,int> instead of Map<String,dynamic>
    Map<String, dynamic> safeMap(dynamic raw) {
      if (raw is Map) {
        return {'count': raw['count'] ?? 0, 'amount': raw['amount'] ?? 0};
      }
      return {'count': 0, 'amount': 0};
    }

    final total = safeMap(stats['total']);
    final pending = safeMap(stats['pending']);
    final today = safeMap(stats['today']);
    String fmt(dynamic v) => ((v as num?) ?? 0).toDouble().toStringAsFixed(0);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: MaasgaTokens.spacingMd,
        vertical: MaasgaTokens.spacingSm,
      ),
      color: AdminTheme.surface,
      child: Row(
        children: [
          Expanded(
            child: PaymentStatsCard(
              label: 'Total',
              value: '${total['count']}',
              amount: '${fmt(total['amount'])} F',
              color: AdminTheme.primary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: PaymentStatsCard(
              label: 'En attente',
              value: '${pending['count']}',
              amount: '${fmt(pending['amount'])} F',
              color: AdminTheme.warning,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: PaymentStatsCard(
              label: "Aujourd'hui",
              value: '${today['count']}',
              amount: '${fmt(today['amount'])} F',
              color: AdminTheme.success,
            ),
          ),
        ],
      ),
    );
  }
}
