import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/appointment_provider.dart';
import '../../data/models/appointment.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import '../widgets/appointment_card.dart';
import '../widgets/appointment_filter.dart';

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen> {
  String _selectedStatus = 'Tous';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final appointmentsAsync = ref.watch(appointmentsProvider);

    return Scaffold(
      body: Column(
        children: [
          // Header avec filtres
          Container(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            decoration: BoxDecoration(
              color: AdminTheme.surface,
              border: Border(bottom: BorderSide(color: AdminTheme.border)),
            ),
            child: Column(
              children: [
                // Barre de recherche
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher un RDV...',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: AdminTheme.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusMd,
                      ),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                // Filtre statut
                AppointmentFilter(
                  selectedStatus: _selectedStatus,
                  onStatusChanged: (status) {
                    setState(() {
                      _selectedStatus = status;
                    });
                  },
                ),
              ],
            ),
          ),

          // Liste des RDV
          Expanded(
            child: appointmentsAsync.when(
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
                      onPressed: () => ref.invalidate(appointmentsProvider),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
              data: (appointments) {
                // Filtrer les RDV
                List<Appointment> filteredAppointments = appointments;
                if (_selectedStatus != 'Tous') {
                  filteredAppointments = filteredAppointments
                      .where(
                        (a) =>
                            a.status.toLowerCase() ==
                            _selectedStatus.toLowerCase(),
                      )
                      .toList();
                }
                if (_searchQuery.isNotEmpty) {
                  filteredAppointments = filteredAppointments
                      .where(
                        (a) =>
                            a.customerName.toLowerCase().contains(
                              _searchQuery.toLowerCase(),
                            ) ||
                            a.id.toLowerCase().contains(
                              _searchQuery.toLowerCase(),
                            ),
                      )
                      .toList();
                }

                if (filteredAppointments.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.event_busy_outlined,
                          size: 64,
                          color: AdminTheme.textSecondary,
                        ),
                        const SizedBox(height: MaasgaTokens.spacingMd),
                        const Text('Aucun RDV trouvé'),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                  itemCount: filteredAppointments.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(
                        bottom: MaasgaTokens.spacingSm,
                      ),
                      child: AppointmentCard(
                        appointment: filteredAppointments[index],
                        onStatusChange: (newStatus) async {
                          try {
                            if (newStatus.toLowerCase() == 'confirmed') {
                              await ref.read(
                                confirmAppointmentProvider(
                                  filteredAppointments[index].id,
                                ).future,
                              );
                            } else {
                              // Pour l'instant, seule la confirmation est implémentée
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Statut $newStatus pas encore implémenté',
                                  ),
                                ),
                              );
                              return;
                            }
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('RDV confirmé avec succès'),
                                  backgroundColor: AdminTheme.success,
                                ),
                              );
                              ref.invalidate(appointmentsProvider);
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Erreur: $e'),
                                  backgroundColor: AdminTheme.error,
                                ),
                              );
                            }
                          }
                        },
                        onCancel: () async {
                          // Dialog de confirmation avec raison optionnelle
                          final controller = TextEditingController();
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('Annuler le RDV'),
                              content: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text(
                                    'Voulez-vous vraiment annuler ce RDV ?',
                                  ),
                                  const SizedBox(height: 16),
                                  TextField(
                                    controller: controller,
                                    decoration: const InputDecoration(
                                      labelText: 'Raison (optionnel)',
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                ],
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(context).pop(false),
                                  child: const Text('Annuler'),
                                ),
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(context).pop(true),
                                  child: const Text('Confirmer'),
                                ),
                              ],
                            ),
                          );

                          controller.dispose();

                          if (confirmed != true) return; // User cancelled

                          try {
                            await ref.read(
                              cancelAppointmentProvider((
                                id: filteredAppointments[index].id,
                                reason: controller.text.isEmpty
                                    ? null
                                    : controller.text,
                              )).future,
                            );
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('RDV annulé avec succès'),
                                  backgroundColor: AdminTheme.success,
                                ),
                              );
                              ref.invalidate(appointmentsProvider);
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Erreur: $e'),
                                  backgroundColor: AdminTheme.error,
                                ),
                              );
                            }
                          }
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
