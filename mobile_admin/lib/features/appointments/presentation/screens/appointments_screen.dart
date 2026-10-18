import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/appointment_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import '../widgets/appointment_card.dart';
import '../widgets/appointment_form.dart';
import '../widgets/calendar_tab.dart';
import 'appointment_detail_screen.dart';

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedStatus = 'Tous';
  String _selectedType = 'Tous';
  String _searchQuery = '';

  final List<String> _typeFilters = [
    'Tous',
    'Devis',
    'Installation',
    'Entretien',
    'Dépannage',
  ];

  final List<String> _statusFilters = [
    'Tous',
    'pending',
    'confirmed',
    'done',
    'cancelled',
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

  String _formatStatusLabel(String s) {
    switch (s.toLowerCase()) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'done':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return s;
    }
  }

  @override
  Widget build(BuildContext context) {
    final appointmentsAsync = ref.watch(appointmentsProvider);

    final pendingCount = appointmentsAsync.maybeWhen(
      data: (list) => list.where((a) => a.status.toLowerCase() == 'pending').length,
      orElse: () => 0,
    );

    return Scaffold(
      backgroundColor: AdminTheme.background,
      body: Column(
        children: [
          // En-tête des onglets Liste / Calendrier + Badge en attente
          Container(
            color: AdminTheme.surface,
            padding: const EdgeInsets.symmetric(horizontal: MaasgaTokens.spacingMd, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 42,
                    decoration: BoxDecoration(
                      color: AdminTheme.background,
                      borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                    ),
                    child: TabBar(
                      controller: _tabController,
                      indicatorSize: TabBarIndicatorSize.tab,
                      indicator: BoxDecoration(
                        color: AdminTheme.primary,
                        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                      ),
                      labelColor: Colors.white,
                      unselectedLabelColor: AdminTheme.textSecondary,
                      labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      tabs: const [
                        Tab(
                          iconMargin: EdgeInsets.zero,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.list_alt, size: 18),
                              SizedBox(width: 6),
                              Text('Liste'),
                            ],
                          ),
                        ),
                        Tab(
                          iconMargin: EdgeInsets.zero,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.calendar_month, size: 18),
                              SizedBox(width: 6),
                              Text('Calendrier'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (pendingCount > 0) ...[
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AdminTheme.warning.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AdminTheme.warning),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.schedule, size: 14, color: AdminTheme.warning),
                        const SizedBox(width: 4),
                        Text(
                          '$pendingCount en attente',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AdminTheme.warning,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Contenu selon l'onglet sélectionné
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // ── Onglet 1: Vue Liste avec filtres ──
                Column(
                  children: [
                    // Barre de recherche et filtres par Statut et Type
                    Container(
                      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                      decoration: const BoxDecoration(
                        color: AdminTheme.surface,
                        border: Border(bottom: BorderSide(color: AdminTheme.border)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextField(
                            decoration: InputDecoration(
                              hintText: 'Rechercher un RDV (nom, téléphone, quartier)...',
                              prefixIcon: const Icon(Icons.search, size: 20),
                              filled: true,
                              fillColor: AdminTheme.background,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            onChanged: (value) => setState(() => _searchQuery = value),
                          ),
                          const SizedBox(height: 10),

                          // Filtres horizontaux par Type de RDV
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: _typeFilters.map((type) {
                                final isSelected = _selectedType == type;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: FilterChip(
                                    label: Text(type),
                                    selected: isSelected,
                                    onSelected: (_) => setState(() => _selectedType = type),
                                    selectedColor: AdminTheme.primary.withValues(alpha: 0.15),
                                    checkmarkColor: AdminTheme.primary,
                                    labelStyle: TextStyle(
                                      fontSize: 12,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      color: isSelected ? AdminTheme.primary : AdminTheme.textSecondary,
                                    ),
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(20),
                                      side: BorderSide(
                                        color: isSelected ? AdminTheme.primary : AdminTheme.border,
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                          const SizedBox(height: 6),

                          // Filtres horizontaux par Statut
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: _statusFilters.map((st) {
                                final isSelected = _selectedStatus == st;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: ChoiceChip(
                                    label: Text(_formatStatusLabel(st)),
                                    selected: isSelected,
                                    onSelected: (_) => setState(() => _selectedStatus = st),
                                    selectedColor: AdminTheme.accent.withValues(alpha: 0.2),
                                    labelStyle: TextStyle(
                                      fontSize: 11,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      color: isSelected ? AdminTheme.primary : AdminTheme.textSecondary,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      side: BorderSide(
                                        color: isSelected ? AdminTheme.accent : AdminTheme.border,
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Liste filtrée
                    Expanded(
                      child: appointmentsAsync.when(
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (error, _) => Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.error_outline, size: 48, color: AdminTheme.error),
                              const SizedBox(height: MaasgaTokens.spacingMd),
                              Text('Erreur: $error'),
                              const SizedBox(height: MaasgaTokens.spacingSm),
                              ElevatedButton(
                                onPressed: () => ref.invalidate(appointmentsProvider),
                                child: const Text('Réessayer'),
                              ),
                            ],
                          ),
                        ),
                        data: (appointments) {
                          var filtered = appointments;

                          if (_selectedStatus != 'Tous') {
                            filtered = filtered
                                .where((a) => a.status.toLowerCase() == _selectedStatus.toLowerCase())
                                .toList();
                          }

                          if (_selectedType != 'Tous') {
                            filtered = filtered.where((a) {
                              final normType = a.type.toLowerCase();
                              final target = _selectedType.toLowerCase();
                              if (target == 'dépannage') return normType.contains('depan');
                              return normType.contains(target);
                            }).toList();
                          }

                          if (_searchQuery.isNotEmpty) {
                            final q = _searchQuery.toLowerCase();
                            filtered = filtered.where((a) {
                              return a.customerName.toLowerCase().contains(q) ||
                                  a.customerPhone.contains(q) ||
                                  a.id.toLowerCase().contains(q) ||
                                  (a.quartier?.toLowerCase().contains(q) ?? false);
                            }).toList();
                          }

                          if (filtered.isEmpty) {
                            return RefreshIndicator(
                              onRefresh: () async => ref.invalidate(appointmentsProvider),
                              child: ListView(
                                children: const [
                                  SizedBox(height: 80),
                                  Center(
                                    child: Column(
                                      children: [
                                        Icon(Icons.event_busy_outlined, size: 56, color: AdminTheme.textSecondary),
                                        SizedBox(height: MaasgaTokens.spacingMd),
                                        Text('Aucun rendez-vous trouvé pour ces critères'),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }

                          return RefreshIndicator(
                            onRefresh: () async => ref.invalidate(appointmentsProvider),
                            child: ListView.builder(
                              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                              itemCount: filtered.length,
                              itemBuilder: (context, index) {
                                final app = filtered[index];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
                                  child: InkWell(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              AppointmentDetailScreen(appointmentId: app.id),
                                        ),
                                      );
                                    },
                                    borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                                    child: AppointmentCard(
                                      appointment: app,
                                      onStatusChange: (newStatus) async {
                                        try {
                                          if (newStatus.toLowerCase() == 'confirmed') {
                                            await ref.read(confirmAppointmentProvider(app.id).future);
                                          } else if (newStatus.toLowerCase() == 'done') {
                                            await ref.read(
                                              updateAppointmentStatusProvider((id: app.id, status: 'done')).future,
                                            );
                                          }
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(
                                                content: Text('Statut mis à jour : $newStatus'),
                                                backgroundColor: AdminTheme.success,
                                              ),
                                            );
                                          }
                                        } catch (e) {
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('Erreur: $e'), backgroundColor: AdminTheme.error),
                                            );
                                          }
                                        }
                                      },
                                      onCancel: () async {
                                        final controller = TextEditingController();
                                        final confirmed = await showDialog<bool>(
                                          context: context,
                                          builder: (context) => AlertDialog(
                                            title: const Text('Annuler le rendez-vous'),
                                            content: Column(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Text('Voulez-vous vraiment annuler ce RDV ?'),
                                                const SizedBox(height: 16),
                                                TextField(
                                                  controller: controller,
                                                  decoration: const InputDecoration(
                                                    labelText: 'Motif (optionnel)',
                                                    border: OutlineInputBorder(),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            actions: [
                                              TextButton(
                                                onPressed: () => Navigator.pop(context, false),
                                                child: const Text('Retour'),
                                              ),
                                              ElevatedButton(
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: AdminTheme.error,
                                                  foregroundColor: Colors.white,
                                                ),
                                                onPressed: () => Navigator.pop(context, true),
                                                child: const Text('Annuler le RDV'),
                                              ),
                                            ],
                                          ),
                                        );

                                        if (confirmed == true) {
                                          try {
                                            await ref.read(
                                              cancelAppointmentProvider((
                                                id: app.id,
                                                reason: controller.text.trim().isEmpty ? null : controller.text.trim(),
                                              )).future,
                                            );
                                            if (context.mounted) {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                const SnackBar(
                                                  content: Text('Rendez-vous annulé'),
                                                  backgroundColor: AdminTheme.success,
                                                ),
                                              );
                                            }
                                          } catch (e) {
                                            if (context.mounted) {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(content: Text('Erreur: $e'), backgroundColor: AdminTheme.error),
                                              );
                                            }
                                          }
                                        }
                                      },
                                    ),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),

                // ── Onglet 2: Vue Calendrier ──
                const SingleChildScrollView(
                  child: CalendarTab(),
                ),
              ],
            ),
          ),
        ],
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
              child: const AppointmentForm(),
            ),
          );
        },
        backgroundColor: AdminTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
