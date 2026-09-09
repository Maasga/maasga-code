import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/dashboard_repository.dart';
import '../data/models/dashboard_data.dart';
import '../data/providers/dashboard_provider.dart';
import '../widgets/kpi_card.dart';
import '../widgets/chart_widget.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  DashboardData? _data;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final repository = ref.read(dashboardRepositoryProvider);
      final data = await repository.getDashboardData();
      if (mounted) {
        setState(() {
          _data = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_data == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AdminTheme.error),
            const SizedBox(height: MaasgaTokens.spacingMd),
            const Text('Erreur de chargement'),
            const SizedBox(height: MaasgaTokens.spacingSm),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_data!.pendingRdv > 0) _buildAlertCard(_data!),

          const SizedBox(height: MaasgaTokens.spacingMd),

          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: MaasgaTokens.spacingSm,
            crossAxisSpacing: MaasgaTokens.spacingSm,
            childAspectRatio: 1.2,
            children: [
              KpiCard(
                label: 'RDV en attente',
                value: _data!.pendingRdv.toString(),
                subLabel: '${_data!.confirmedRdv + _data!.doneRdv} total',
                icon: Icons.calendar_today,
                color: AdminTheme.info,
                onTap: () => Navigator.pushNamed(context, '/rdv'),
              ),
              KpiCard(
                label: 'Alertes stock',
                value: (_data!.lowStock + _data!.outOfStock).toString(),
                subLabel:
                    '${_data!.outOfStock} rupture · ${_data!.lowStock} limité',
                icon: Icons.inventory_2,
                color: AdminTheme.warning,
                onTap: () => Navigator.pushNamed(context, '/produits'),
              ),
              KpiCard(
                label: 'Avis en attente',
                value: _data!.pendingReviews.toString(),
                subLabel:
                    '${_data!.approvedReviews} publiés · ${_data!.avgNote}/5',
                icon: Icons.star,
                color: AdminTheme.accent,
                onTap: () => Navigator.pushNamed(context, '/avis'),
              ),
              KpiCard(
                label: 'Chiffre d\'affaires',
                value: '${(_data!.estimatedCA / 1000).toStringAsFixed(0)}K',
                subLabel: 'FCFA · commandes validées',
                icon: Icons.trending_up,
                color: AdminTheme.success,
                onTap: () => Navigator.pushNamed(context, '/commandes'),
              ),
            ],
          ),

          const SizedBox(height: MaasgaTokens.spacingLg),

          ChartWidget(
            data: _data!.rdvChartData,
            title: 'RDV des 7 derniers jours',
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(DashboardData data) {
    return Container(
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      decoration: BoxDecoration(
        color: AdminTheme.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusLg),
        border: Border.all(color: AdminTheme.error.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: AdminTheme.error,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_active,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: MaasgaTokens.spacingSm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Nouveaux rendez-vous en attente',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AdminTheme.error,
                      ),
                    ),
                    Text(
                      '${data.pendingRdv} rendez-vous à confirmer',
                      style: TextStyle(
                        fontSize: MaasgaTokens.fontSizeCaption,
                        color: AdminTheme.error.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/rdv'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AdminTheme.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('Voir les RDV'),
          ),
        ],
      ),
    );
  }
}
