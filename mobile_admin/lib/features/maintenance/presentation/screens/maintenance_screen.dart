import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../data/providers/maintenance_admin_provider.dart';

class MaintenanceScreen extends ConsumerStatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  ConsumerState<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends ConsumerState<MaintenanceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _refreshAll() {
    ref.invalidate(maintenanceSummaryProvider);
    ref.invalidate(maintenanceContractsProvider);
    ref.invalidate(maintenanceRequestsProvider);
    ref.invalidate(maintenanceVisitsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final summaryAsync = ref.watch(maintenanceSummaryProvider);

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: const Text(
          'Gestion Maintenance',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AdminTheme.primary),
            tooltip: 'Actualiser',
            onPressed: _refreshAll,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(106),
          child: Column(
            children: [
              // Search input
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: MaasgaTokens.spacingMd,
                  vertical: MaasgaTokens.spacingXs,
                ),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher un client, contrat...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: MaasgaTokens.spacingMd,
                      vertical: MaasgaTokens.spacingSm,
                    ),
                    filled: true,
                    fillColor: AdminTheme.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
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
              TabBar(
                controller: _tabController,
                indicatorColor: AdminTheme.primary,
                labelColor: AdminTheme.primary,
                unselectedLabelColor: AdminTheme.textSecondary,
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
                tabs: const [
                  Tab(icon: Icon(Icons.assignment, size: 18), text: 'Contrats'),
                  Tab(icon: Icon(Icons.pending_actions, size: 18), text: 'Demandes'),
                  Tab(icon: Icon(Icons.calendar_today, size: 18), text: 'Visites'),
                ],
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          // KPI Banner
          summaryAsync.when(
            data: (summary) => _buildKpiBar(summary),
            loading: () => const LinearProgressIndicator(),
            error: (_, _) => const SizedBox.shrink(),
          ),
          // Tab views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildContractsTab(),
                _buildRequestsTab(),
                _buildVisitsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiBar(Map<String, dynamic> summary) {
    final pendingContracts = (summary['pending_contracts'] ?? 0) as int;
    final pendingRequests = (summary['pending_requests'] ?? 0) as int;
    final activeContracts = (summary['active_contracts'] ?? 0) as int;
    final dueVisits = (summary['due_visits'] ?? 0) as int;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: MaasgaTokens.spacingMd,
        vertical: MaasgaTokens.spacingSm,
      ),
      color: AdminTheme.surface,
      child: Row(
        children: [
          Expanded(
            child: _kpiChip(
              'En attente',
              (pendingContracts + pendingRequests).toString(),
              (pendingContracts + pendingRequests) > 0
                  ? AdminTheme.warning
                  : AdminTheme.secondary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _kpiChip(
              'Contrats actifs',
              activeContracts.toString(),
              AdminTheme.success,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _kpiChip(
              'Visites à faire',
              dueVisits.toString(),
              dueVisits > 0 ? AdminTheme.error : AdminTheme.info,
            ),
          ),
        ],
      ),
    );
  }

  Widget _kpiChip(String label, String value, Color color) {
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

  // ================= TAB 1: CONTRATS =================
  Widget _buildContractsTab() {
    final contractsAsync = ref.watch(maintenanceContractsProvider);

    return contractsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 40, color: AdminTheme.error),
            const SizedBox(height: 8),
            Text('Erreur: $e'),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => ref.invalidate(maintenanceContractsProvider),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
      data: (contracts) {
        var filtered = contracts;
        if (_searchQuery.isNotEmpty) {
          filtered = filtered.where((c) {
            final name = (c['user_name'] ?? c['name'] ?? '').toString().toLowerCase();
            final phone = (c['user_phone'] ?? c['phone'] ?? '').toString().toLowerCase();
            final plan = (c['plan_type'] ?? '').toString().toLowerCase();
            final ref = (c['contract_number'] ?? '').toString().toLowerCase();
            return name.contains(_searchQuery) ||
                phone.contains(_searchQuery) ||
                plan.contains(_searchQuery) ||
                ref.contains(_searchQuery);
          }).toList();
        }

        if (filtered.isEmpty) {
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(maintenanceContractsProvider),
            child: ListView(
              children: const [
                SizedBox(height: 80),
                Center(
                  child: Text(
                    'Aucun contrat de maintenance trouvé.',
                    style: TextStyle(color: AdminTheme.textSecondary),
                  ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(maintenanceContractsProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            itemCount: filtered.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final contract = filtered[index];
              return _buildContractCard(contract);
            },
          ),
        );
      },
    );
  }

  Widget _buildContractCard(Map<String, dynamic> c) {
    final status = (c['status'] ?? 'en_attente').toString();
    final isPending = status == 'en_attente';
    final planType = (c['plan_type'] ?? 'residentiel').toString();
    final contractNum = c['contract_number'] ?? '#CONT-${c['id']}';
    final clientName = c['user_name'] ?? c['name'] ?? 'Client';
    final clientPhone = c['user_phone'] ?? c['phone'] ?? '';
    final clims = c['nb_climatiseurs'] ?? 1;
    final freq = c['frequence_visites'] ?? 'Confort';
    final quartier = c['quartier'] ?? c['address'] ?? '';
    final total = c['montant_annuel'] ?? c['total_price'] ?? 0;

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
                child: Text(
                  contractNum,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AdminTheme.primary,
                    fontSize: 14,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isPending
                      ? AdminTheme.warning.withValues(alpha: 0.15)
                      : AdminTheme.success.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  isPending ? 'En attente' : status.toUpperCase(),
                  style: TextStyle(
                    color: isPending ? AdminTheme.warning : AdminTheme.success,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.person, size: 16, color: AdminTheme.textSecondary),
              const SizedBox(width: 6),
              Text(
                clientName,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              if (clientPhone.isNotEmpty) ...[
                const SizedBox(width: 8),
                Text(
                  '• $clientPhone',
                  style: const TextStyle(color: AdminTheme.textSecondary, fontSize: 13),
                ),
              ],
            ],
          ),
          if (quartier.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.location_on, size: 16, color: AdminTheme.textSecondary),
                const SizedBox(width: 6),
                Text(
                  quartier,
                  style: const TextStyle(color: AdminTheme.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ],
          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Formule: ${planType.toUpperCase()}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                  ),
                  Text(
                    '$clims clims • $freq',
                    style: const TextStyle(fontSize: 11, color: AdminTheme.textSecondary),
                  ),
                ],
              ),
              if (total != null && total != 0)
                Text(
                  '$total F CFA',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: AdminTheme.primary,
                  ),
                ),
            ],
          ),
          if (isPending) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AdminTheme.success,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                  ),
                ),
                icon: const Icon(Icons.check_circle_outline, size: 18),
                label: const Text('Activer le contrat'),
                onPressed: () => _activateContract(c['id'] as int),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _activateContract(int contractId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Activer ce contrat ?'),
        content: const Text(
          'Cette action va passer le contrat en statut ACTIF et programmer les premières visites de maintenance.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AdminTheme.success),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Activer'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final repo = ref.read(maintenanceAdminRepositoryProvider);
    final ok = await repo.activateContract(contractId);

    if (mounted) {
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Contrat activé avec succès !'),
            backgroundColor: AdminTheme.success,
          ),
        );
        _refreshAll();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Échec de l\'activation.'),
            backgroundColor: AdminTheme.error,
          ),
        );
      }
    }
  }

  // ================= TAB 2: DEMANDES =================
  Widget _buildRequestsTab() {
    final requestsAsync = ref.watch(maintenanceRequestsProvider);

    return requestsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 40, color: AdminTheme.error),
            const SizedBox(height: 8),
            Text('Erreur: $e'),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => ref.invalidate(maintenanceRequestsProvider),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
      data: (requests) {
        var filtered = requests;
        if (_searchQuery.isNotEmpty) {
          filtered = filtered.where((r) {
            final name = (r['name'] ?? '').toString().toLowerCase();
            final phone = (r['phone'] ?? '').toString().toLowerCase();
            final desc = (r['description'] ?? '').toString().toLowerCase();
            return name.contains(_searchQuery) ||
                phone.contains(_searchQuery) ||
                desc.contains(_searchQuery);
          }).toList();
        }

        if (filtered.isEmpty) {
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(maintenanceRequestsProvider),
            child: ListView(
              children: const [
                SizedBox(height: 80),
                Center(
                  child: Text(
                    'Aucune demande de maintenance.',
                    style: TextStyle(color: AdminTheme.textSecondary),
                  ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(maintenanceRequestsProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            itemCount: filtered.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final req = filtered[index];
              return _buildRequestCard(req);
            },
          ),
        );
      },
    );
  }

  Widget _buildRequestCard(Map<String, dynamic> r) {
    final status = (r['status'] ?? 'pending').toString();
    final isPending = status == 'pending';
    final name = r['name'] ?? 'Client';
    final phone = r['phone'] ?? '';
    final address = r['address'] ?? '';
    final desc = r['description'] ?? '';
    final equip = r['equipment_type'] ?? '';
    final planType = r['plan_type'] ?? '';

    Color badgeColor = AdminTheme.secondary;
    if (status == 'pending') badgeColor = AdminTheme.warning;
    if (status == 'contacted') badgeColor = AdminTheme.info;
    if (status == 'done') badgeColor = AdminTheme.success;

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
                child: Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    color: badgeColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          if (phone.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.phone, size: 14, color: AdminTheme.textSecondary),
                const SizedBox(width: 6),
                Text(phone, style: const TextStyle(color: AdminTheme.textSecondary, fontSize: 13)),
              ],
            ),
          ],
          if (address.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.location_on, size: 14, color: AdminTheme.textSecondary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    address,
                    style: const TextStyle(color: AdminTheme.textSecondary, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
          if (desc.isNotEmpty || equip.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AdminTheme.background,
                borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (planType.isNotEmpty)
                    Text(
                      'Formule: $planType',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  if (equip.isNotEmpty)
                    Text('Équipement: $equip', style: const TextStyle(fontSize: 12)),
                  if (desc.isNotEmpty)
                    Text(desc, style: const TextStyle(fontSize: 12, color: AdminTheme.textSecondary)),
                ],
              ),
            ),
          ],
          if (isPending) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                    ),
                    onPressed: () => _updateRequestStatus(r['id'] as int, 'contacted'),
                    child: const Text('Contacté', style: TextStyle(fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AdminTheme.success,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 6),
                    ),
                    onPressed: () => _updateRequestStatus(r['id'] as int, 'done'),
                    child: const Text('Terminer', style: TextStyle(fontSize: 12)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _updateRequestStatus(int reqId, String status) async {
    final repo = ref.read(maintenanceAdminRepositoryProvider);
    final ok = await repo.updateRequestStatus(reqId, status);
    if (mounted) {
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Statut mis à jour: $status'),
            backgroundColor: AdminTheme.success,
          ),
        );
        _refreshAll();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Erreur lors de la mise à jour'),
            backgroundColor: AdminTheme.error,
          ),
        );
      }
    }
  }

  // ================= TAB 3: VISITES =================
  Widget _buildVisitsTab() {
    final visitsAsync = ref.watch(maintenanceVisitsProvider);

    return visitsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 40, color: AdminTheme.error),
            const SizedBox(height: 8),
            Text('Erreur: $e'),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => ref.invalidate(maintenanceVisitsProvider),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
      data: (visits) {
        var filtered = visits;
        if (_searchQuery.isNotEmpty) {
          filtered = filtered.where((v) {
            final name = (v['client_name'] ?? '').toString().toLowerCase();
            final num = (v['contract_number'] ?? '').toString().toLowerCase();
            return name.contains(_searchQuery) || num.contains(_searchQuery);
          }).toList();
        }

        if (filtered.isEmpty) {
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(maintenanceVisitsProvider),
            child: ListView(
              children: const [
                SizedBox(height: 80),
                Center(
                  child: Text(
                    'Aucune visite programmée.',
                    style: TextStyle(color: AdminTheme.textSecondary),
                  ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(maintenanceVisitsProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            itemCount: filtered.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final v = filtered[index];
              return _buildVisitCard(v);
            },
          ),
        );
      },
    );
  }

  Widget _buildVisitCard(Map<String, dynamic> v) {
    final status = (v['status'] ?? 'planifiee').toString();
    final isDone = status == 'terminee' || status == 'effectuee';
    final clientName = v['client_name'] ?? 'Client';
    final contractNum = v['contract_number'] ?? '#CONT-${v['contract_id']}';
    final scheduledDate = v['scheduled_date'] ?? 'À définir';
    final notes = v['notes'] ?? '';

    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Visite - $scheduledDate',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: AdminTheme.primary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isDone
                      ? AdminTheme.success.withValues(alpha: 0.15)
                      : AdminTheme.info.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    color: isDone ? AdminTheme.success : AdminTheme.info,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            clientName,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          Text(
            'Contrat: $contractNum',
            style: const TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
          ),
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              notes,
              style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic),
            ),
          ],
          if (!isDone) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AdminTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                  ),
                ),
                icon: const Icon(Icons.done_all, size: 16),
                label: const Text('Valider l\'entretien'),
                onPressed: () => _validateVisitDialog(v['id'] as int),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _validateVisitDialog(int visitId) async {
    final techController = TextEditingController(text: 'Technicien MAASGA');
    final notesController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Validation de visite'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: techController,
              decoration: const InputDecoration(labelText: 'Technicien'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(labelText: 'Rapport / Remarques'),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AdminTheme.primary),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );

    if (result != true) return;

    final repo = ref.read(maintenanceAdminRepositoryProvider);
    final ok = await repo.validateVisit(
      visitId,
      technician: techController.text,
      notes: notesController.text,
    );

    if (mounted) {
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Visite validée avec succès !'),
            backgroundColor: AdminTheme.success,
          ),
        );
        _refreshAll();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Erreur lors de la validation'),
            backgroundColor: AdminTheme.error,
          ),
        );
      }
    }
  }
}
