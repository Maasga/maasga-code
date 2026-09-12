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
                      .where((a) => a.status.toLowerCase() == _selectedStatus.toLowerCase())
                      .toList();
                }
                if (_searchQuery.isNotEmpty) {
                  filteredAppointments = filteredAppointments
                      .where((a) =>
                          a.customerName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                          a.id.toLowerCase().contains(_searchQuery.toLowerCase()))
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
                      padding: const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
                      child: AppointmentCard(
                        appointment: filteredAppointments[index],
                        onStatusChange: (newStatus) {
                          // TODO: Implémenter le changement de statut
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Statut changé en $newStatus (simulation)')),
                          );
                        },
                        onCancel: () {
                          // TODO: Implémenter l'annulation
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Annulation du RDV (simulation)')),
                          );
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
