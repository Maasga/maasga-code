import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
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
  String _selectedPlanFilter = 'all';

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

  ({String title, String badgeText, String subtitle, IconData icon, Color color, Color bgColor}) _getPlanDetails(String rawPlan) {
    final p = rawPlan.trim().toLowerCase();
    if (p.contains('residentiel') || p.contains('résidentiel')) {
      return (
        title: 'Formule Résidentielle',
        badgeText: 'RÉSIDENTIEL',
        subtitle: '1 à 4 climatiseurs • Idéal appartements & villas',
        icon: Icons.home_work_outlined,
        color: const Color(0xFF2563EB),
        bgColor: const Color(0xFFEFF6FF),
      );
    } else if (p.contains('professionnel') || p.contains('pro') || p.contains('pme')) {
      return (
        title: 'Formule Professionnelle / PME',
        badgeText: 'PRO / PME',
        subtitle: '5 à 15 climatiseurs • Suivi continu pour bureaux & commerces',
        icon: Icons.business_center_outlined,
        color: const Color(0xFF059669),
        bgColor: const Color(0xFFECFDF5),
      );
    } else if (p.contains('industriel')) {
      return (
        title: 'Formule Industrielle',
        badgeText: 'INDUSTRIEL',
        subtitle: '16+ climatiseurs • Maintenance préventive intensive',
        icon: Icons.factory_outlined,
        color: const Color(0xFF7C3AED),
        bgColor: const Color(0xFFF5F3FF),
      );
    } else if (p.contains('sav') || p.contains('gratuit')) {
      return (
        title: 'Garantie SAV Gratuit',
        badgeText: 'SAV GRATUIT (1 AN)',
        subtitle: 'Entretien & suivi inclus avec l\'achat du climatiseur',
        icon: Icons.verified_outlined,
        color: const Color(0xFF0284C7),
        bgColor: const Color(0xFFF0F9FF),
      );
    } else if (p.contains('trimestriel')) {
      return (
        title: 'Formule Trimestrielle',
        badgeText: 'TRIMESTRIEL (4 VISITES)',
        subtitle: '4 passages d\'entretien et nettoyage par an',
        icon: Icons.event_repeat_outlined,
        color: const Color(0xFF4F46E5),
        bgColor: const Color(0xFFEEF2FF),
      );
    } else if (p.contains('semestriel')) {
      return (
        title: 'Formule Semestrielle',
        badgeText: 'SEMESTRIEL (2 VISITES)',
        subtitle: '2 passages d\'entretien et révision par an',
        icon: Icons.calendar_month_outlined,
        color: const Color(0xFF0D9488),
        bgColor: const Color(0xFFF0FDFA),
      );
    } else if (p.contains('annuel')) {
      return (
        title: 'Formule Annuelle',
        badgeText: 'ANNUEL (1 VISITE)',
        subtitle: '1 visite annuelle complète avant la saison chaude',
        icon: Icons.calendar_today_outlined,
        color: const Color(0xFF475569),
        bgColor: const Color(0xFFF8FAFC),
      );
    } else if (p.contains('sur_mesure') || p.contains('mesure')) {
      return (
        title: 'Formule Sur Mesure',
        badgeText: 'SUR MESURE',
        subtitle: 'Contrat personnalisé pour grand parc de climatiseurs',
        icon: Icons.tune_outlined,
        color: const Color(0xFFD97706),
        bgColor: const Color(0xFFFFFBEB),
      );
    }
    return (
      title: 'Contrat d\'entretien ${rawPlan.toUpperCase()}',
      badgeText: rawPlan.toUpperCase(),
      subtitle: 'Contrat de maintenance préventive climatisation',
      icon: Icons.build_circle_outlined,
      color: const Color(0xFF0369A1),
      bgColor: const Color(0xFFF0F9FF),
    );
  }

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
        var filtered = contracts.where((c) {
          final name = (c['client_name'] ?? c['user_name'] ?? c['name'] ?? '').toString().toLowerCase();
          final phone = (c['client_phone'] ?? c['user_phone'] ?? c['phone'] ?? '').toString().toLowerCase();
          final plan = (c['plan_type'] ?? '').toString().toLowerCase();
          final ref = (c['contract_number'] ?? '#CONT-${c['id']}').toString().toLowerCase();
          final notes = (c['notes'] ?? c['admin_notes'] ?? '').toString().toLowerCase();

          final matchesSearch = _searchQuery.isEmpty ||
              name.contains(_searchQuery) ||
              phone.contains(_searchQuery) ||
              plan.contains(_searchQuery) ||
              ref.contains(_searchQuery) ||
              notes.contains(_searchQuery);

          if (!matchesSearch) return false;

          if (_selectedPlanFilter != 'all') {
            if (_selectedPlanFilter == 'en_attente' || _selectedPlanFilter == 'actif') {
              final status = (c['status'] ?? 'en_attente').toString().toLowerCase();
              if (status != _selectedPlanFilter) return false;
            } else {
              if (!plan.contains(_selectedPlanFilter)) return false;
            }
          }
          return true;
        }).toList();

        final filterOptions = [
          {'id': 'all', 'label': 'Tous (${contracts.length})'},
          {'id': 'en_attente', 'label': 'En attente'},
          {'id': 'actif', 'label': 'Actifs'},
          {'id': 'residentiel', 'label': 'Résidentiel'},
          {'id': 'pro', 'label': 'Pro / PME'},
          {'id': 'trimestriel', 'label': 'Trimestriel'},
          {'id': 'semestriel', 'label': 'Semestriel'},
          {'id': 'sav', 'label': 'SAV Gratuit'},
        ];

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(maintenanceContractsProvider),
          child: Column(
            children: [
              // Chips de filtrage par formule et statut
              Container(
                padding: const EdgeInsets.symmetric(horizontal: MaasgaTokens.spacingMd, vertical: 8),
                color: AdminTheme.surface,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: filterOptions.map((opt) {
                      final isSelected = _selectedPlanFilter == opt['id'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(
                            opt['label']!,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              color: isSelected ? Colors.white : AdminTheme.textPrimary,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: AdminTheme.primary,
                          backgroundColor: AdminTheme.background,
                          onSelected: (val) {
                            setState(() {
                              _selectedPlanFilter = opt['id']!;
                            });
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              Expanded(
                child: filtered.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 80),
                          Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.assignment_outlined, size: 48, color: AdminTheme.textSecondary),
                                SizedBox(height: 12),
                                Text(
                                  'Aucun contrat ne correspond à ce filtre.',
                                  style: TextStyle(color: AdminTheme.textSecondary, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                        itemCount: filtered.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          final contract = filtered[index];
                          return _buildContractCard(contract);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContractCard(Map<String, dynamic> c) {
    final status = (c['status'] ?? 'en_attente').toString().toLowerCase();
    final isPending = status == 'en_attente';
    final isActive = status == 'actif';
    final rawPlan = (c['plan_type'] ?? 'residentiel').toString();
    final planInfo = _getPlanDetails(rawPlan);

    final contractId = c['id'];
    final contractNum = c['contract_number'] ?? '#CONT-$contractId';
    final clientName = (c['client_name'] ?? c['user_name'] ?? c['name'] ?? 'Client non spécifié').toString();
    final clientPhone = (c['client_phone'] ?? c['user_phone'] ?? c['phone'] ?? '').toString();
    final clientEmail = (c['client_email'] ?? c['email'] ?? '').toString();
    final quartier = (c['quartier'] ?? c['address'] ?? '').toString();

    final clims = c['nb_climatiseurs'] ?? 1;
    final totalVisits = int.tryParse(c['total_visits']?.toString() ?? '') ?? 0;
    final completedVisits = int.tryParse(c['completed_visits']?.toString() ?? '') ?? 0;
    final nextVisitDate = c['next_visit_date']?.toString();
    final startDate = c['start_date']?.toString();
    final endDate = c['end_date']?.toString();
    final total = c['plan_price'] ?? c['montant_annuel'] ?? c['total_price'] ?? 0;
    final notes = (c['notes'] ?? c['admin_notes'] ?? '').toString();

    // Progress
    final progress = totalVisits > 0 ? (completedVisits / totalVisits).clamp(0.0, 1.0) : 0.0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPending ? Colors.amber.shade300 : Colors.grey.shade200,
          width: isPending ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── HEADER DU CONTRAT : Référence + Statut ─────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isPending ? Colors.amber.shade50 : AdminTheme.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AdminTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.assignment, size: 16, color: AdminTheme.primary),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      contractNum,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AdminTheme.primary,
                        fontSize: 14,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isPending
                        ? Colors.amber.shade100
                        : isActive
                            ? Colors.green.shade100
                            : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isPending
                          ? Colors.amber.shade400
                          : isActive
                              ? Colors.green.shade400
                              : Colors.grey.shade400,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isPending
                            ? Icons.hourglass_top
                            : isActive
                                ? Icons.check_circle
                                : Icons.info_outline,
                        size: 13,
                        color: isPending
                            ? Colors.amber.shade900
                            : isActive
                                ? Colors.green.shade800
                                : Colors.grey.shade700,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isPending ? 'EN ATTENTE' : status.toUpperCase(),
                        style: TextStyle(
                          color: isPending
                              ? Colors.amber.shade900
                              : isActive
                                  ? Colors.green.shade800
                                  : Colors.grey.shade700,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── SECTION 1 : QUI EST LE CLIENT ? ───────────────────────────
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: AdminTheme.primary.withValues(alpha: 0.12),
                      child: Text(
                        clientName.isNotEmpty ? clientName[0].toUpperCase() : 'C',
                        style: const TextStyle(
                          color: AdminTheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  clientName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: AdminTheme.textPrimary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          if (clientPhone.isNotEmpty)
                            InkWell(
                              onTap: () async {
                                final uri = Uri.parse('tel:$clientPhone');
                                if (await canLaunchUrl(uri)) await launchUrl(uri);
                              },
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.phone, size: 14, color: Colors.green),
                                  const SizedBox(width: 4),
                                  Text(
                                    clientPhone,
                                    style: const TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                      decoration: TextDecoration.underline,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Icon(Icons.call_made, size: 12, color: Colors.green),
                                ],
                              ),
                            ),
                          if (clientEmail.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              clientEmail,
                              style: const TextStyle(color: AdminTheme.textSecondary, fontSize: 12),
                            ),
                          ],
                          if (quartier.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 14, color: AdminTheme.textSecondary),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    quartier,
                                    style: const TextStyle(color: AdminTheme.textSecondary, fontSize: 12),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // ── SECTION 2 : QUEL TYPE DE FORMULE SOUSCRIT ? ──────────────
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: planInfo.bgColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: planInfo.color.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: planInfo.color.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(planInfo.icon, size: 20, color: planInfo.color),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  planInfo.title,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: planInfo.color,
                                  ),
                                ),
                                Text(
                                  planInfo.subtitle,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey.shade700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Divider(height: 1),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.ac_unit, size: 14, color: AdminTheme.textSecondary),
                              const SizedBox(width: 4),
                              Text(
                                '$clims climatiseur(s) couvert(s)',
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                              ),
                            ],
                          ),
                          if (total != null && total != 0)
                            Text(
                              '$total F CFA',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: planInfo.color,
                              ),
                            )
                          else
                            const Text(
                              'Inclus / Sur devis',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: AdminTheme.textSecondary,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // ── SECTION 3 : PROGRESSION DES VISITES D'ENTRETIEN ────────────
                if (totalVisits > 0) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Visites effectuées : $completedVisits / $totalVisits',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      Text(
                        '${(progress * 100).toInt()}%',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: planInfo.color),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(planInfo.color),
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 8),
                ],

                // Dates début/fin & Prochaine visite
                if (startDate != null || endDate != null || nextVisitDate != null) ...[
                  Row(
                    children: [
                      if (startDate != null && endDate != null)
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.date_range, size: 13, color: AdminTheme.textSecondary),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  '$startDate → $endDate',
                                  style: const TextStyle(fontSize: 11, color: AdminTheme.textSecondary),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (nextVisitDate != null && nextVisitDate.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.amber.shade50,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.amber.shade300),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.schedule, size: 11, color: Colors.amber),
                              const SizedBox(width: 4),
                              Text(
                                'Prochaine : $nextVisitDate',
                                style: TextStyle(fontSize: 10, color: Colors.amber.shade900, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                ],

                // Notes éventuelles
                if (notes.isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Text(
                      'Note : $notes',
                      style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.grey.shade700),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],

                // ── SECTION 4 : BOUTON ACTION ACTIVATION ──────────────────────
                if (isPending) ...[
                  const SizedBox(height: 4),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AdminTheme.success,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      icon: const Icon(Icons.check_circle_outline, size: 18),
                      label: const Text(
                        'Activer ce contrat de maintenance',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      onPressed: () => _activateContract(contractId as int),
                    ),
                  ),
                ],
              ],
            ),
          ),
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
    final status = (r['status'] ?? 'pending').toString().toLowerCase();
    final isPending = status == 'pending';
    final name = (r['client_name'] ?? r['name'] ?? 'Client non spécifié').toString();
    final phone = (r['client_phone'] ?? r['phone'] ?? '').toString();
    final address = (r['quartier'] ?? r['address'] ?? '').toString();
    final desc = (r['description'] ?? '').toString();
    final equip = (r['equipment_type'] ?? '').toString();
    final rawPlan = (r['plan_type'] ?? r['request_type'] ?? '').toString();
    final planInfo = _getPlanDetails(rawPlan);

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
                  if (rawPlan.isNotEmpty)
                    Text(
                      'Formule demandée: ${planInfo.title}',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: planInfo.color),
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
    final status = (v['status'] ?? 'planifiee').toString().toLowerCase();
    final isDone = status == 'terminee' || status == 'effectuee';
    final clientName = (v['client_name'] ?? 'Client').toString();
    final clientPhone = (v['client_phone'] ?? '').toString();
    final contractNum = v['contract_number'] ?? '#CONT-${v['contract_id'] ?? ''}';
    final scheduledDate = (v['visit_date'] ?? v['scheduled_date'] ?? 'À définir').toString();
    final technician = (v['technician'] ?? '').toString();
    final actions = (v['actions_performed'] ?? v['description'] ?? '').toString();
    final notes = (v['notes'] ?? '').toString();

    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 16, color: AdminTheme.primary),
                  const SizedBox(width: 6),
                  Text(
                    'Visite - $scheduledDate',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: AdminTheme.primary,
                    ),
                  ),
                ],
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
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.person_outline, size: 15, color: AdminTheme.textSecondary),
              const SizedBox(width: 6),
              Text(
                clientName,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              if (clientPhone.isNotEmpty) ...[
                const SizedBox(width: 8),
                Text(
                  '• $clientPhone',
                  style: const TextStyle(color: AdminTheme.textSecondary, fontSize: 12),
                ),
              ],
            ],
          ),
          const SizedBox(height: 2),
          Text(
            'Contrat: $contractNum',
            style: const TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
          ),
          if (technician.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.handyman_outlined, size: 14, color: AdminTheme.primary),
                const SizedBox(width: 6),
                Text(
                  'Technicien : $technician',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AdminTheme.primary),
                ),
              ],
            ),
          ],
          if (actions.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Actions : $actions',
              style: const TextStyle(fontSize: 11, color: Colors.black87),
            ),
          ],
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              notes,
              style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AdminTheme.textSecondary),
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
