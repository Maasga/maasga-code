import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../data/providers/appointment_provider.dart';
import '../../data/models/appointment.dart';
import '../widgets/reschedule_form.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class AppointmentDetailScreen extends ConsumerStatefulWidget {
  final String appointmentId;

  const AppointmentDetailScreen({super.key, required this.appointmentId});

  @override
  ConsumerState<AppointmentDetailScreen> createState() => _AppointmentDetailScreenState();
}

class _AppointmentDetailScreenState extends ConsumerState<AppointmentDetailScreen> {
  late TextEditingController _notesController;
  bool _isSavingNotes = false;

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _callCustomer(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible de lancer l\'appel')),
      );
    }
  }

  void _showAssignTechnicianDialog(Appointment appointment) {
    final techController = TextEditingController(text: appointment.technician ?? '');
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Assigner un technicien'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Indiquez le nom ou l\'équipe de techniciens assignée :',
              style: TextStyle(fontSize: 13, color: AdminTheme.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: techController,
              decoration: const InputDecoration(
                labelText: 'Nom du technicien',
                hintText: 'Ex: Oumar Traoré / Équipe A',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.badge_outlined),
              ),
              autofocus: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AdminTheme.primary,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              final tech = techController.text.trim();
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              if (tech.isEmpty) return;

              try {
                await ref.read(
                  assignTechnicianProvider((
                    id: appointment.id,
                    technician: tech,
                  )).future,
                );
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Technicien assigné avec succès'),
                    backgroundColor: AdminTheme.success,
                  ),
                );
              } catch (e) {
                messenger.showSnackBar(
                  SnackBar(content: Text('Erreur: $e'), backgroundColor: AdminTheme.error),
                );
              }
            },
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }

  Future<void> _saveNotes(Appointment appointment) async {
    setState(() => _isSavingNotes = true);
    try {
      await ref.read(
        updateAppointmentNotesProvider((
          id: appointment.id,
          notes: _notesController.text.trim(),
        )).future,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notes terrain enregistrées avec succès'),
            backgroundColor: AdminTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: AdminTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSavingNotes = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appointmentAsync = ref.watch(appointmentDetailProvider(widget.appointmentId));

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: Text(
          'RDV #${widget.appointmentId}',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AdminTheme.primary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: appointmentAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AdminTheme.error),
              const SizedBox(height: MaasgaTokens.spacingMd),
              Text('Erreur: $error'),
              const SizedBox(height: MaasgaTokens.spacingSm),
              ElevatedButton(
                onPressed: () => ref.invalidate(appointmentDetailProvider(widget.appointmentId)),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (appointment) {
          // Initialize notes if not yet modified
          if (_notesController.text.isEmpty && appointment.notes != null) {
            _notesController.text = appointment.notes!;
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderCard(appointment),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildClientCard(appointment),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildDetailsCard(appointment),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildTechnicianCard(appointment),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildNotesCard(appointment),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildActionsCard(context, ref, appointment),
                const SizedBox(height: MaasgaTokens.spacingXl),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeaderCard(Appointment appointment) {
    final statusInfo = _getStatusInfo(appointment.status);
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: statusInfo.color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
            ),
            child: Icon(statusInfo.icon, color: statusInfo.color, size: 24),
          ),
          const SizedBox(width: MaasgaTokens.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'RDV #${appointment.id}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AdminTheme.textPrimary,
                  ),
                ),
                Text(
                  '${appointment.formattedDate} à ${appointment.time}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AdminTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: statusInfo.color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: statusInfo.color),
            ),
            child: Text(
              appointment.formattedStatus,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: statusInfo.color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClientCard(Appointment appointment) {
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _sectionHeader(Icons.person, 'Client'),
              if (appointment.customerPhone.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.phone_forwarded, color: AdminTheme.primary, size: 20),
                  tooltip: 'Appeler le client',
                  onPressed: () => _callCustomer(appointment.customerPhone),
                ),
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          _infoRow(Icons.person_outline, 'Nom', appointment.customerName),
          _infoRow(Icons.phone, 'Téléphone', appointment.customerPhone),
          if (appointment.customerEmail != null)
            _infoRow(Icons.email, 'Email', appointment.customerEmail!),
          if (appointment.address != null)
            _infoRow(Icons.location_on, 'Adresse', appointment.address!),
          if (appointment.quartier != null)
            _infoRow(Icons.map_outlined, 'Quartier', appointment.quartier!),
        ],
      ),
    );
  }

  Widget _buildDetailsCard(Appointment appointment) {
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(Icons.event, 'Détails du rendez-vous'),
          const SizedBox(height: MaasgaTokens.spacingMd),
          _infoRow(Icons.category_outlined, 'Type', appointment.formattedType),
          _infoRow(Icons.calendar_today, 'Date', appointment.formattedDate),
          _infoRow(Icons.access_time, 'Heure début', appointment.time),
          if (appointment.heureFin != null)
            _infoRow(Icons.timer_off_outlined, 'Heure fin', appointment.heureFin!),
          _infoRow(
            Icons.info_outline,
            'Créé le',
            '${appointment.createdAt.day}/${appointment.createdAt.month}/${appointment.createdAt.year}',
          ),
        ],
      ),
    );
  }

  Widget _buildTechnicianCard(Appointment appointment) {
    final hasTechnician = appointment.technician != null && appointment.technician!.isNotEmpty;

    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _sectionHeader(Icons.engineering_outlined, 'Technicien assigné'),
              TextButton.icon(
                onPressed: () => _showAssignTechnicianDialog(appointment),
                icon: Icon(hasTechnician ? Icons.edit : Icons.person_add_alt_1, size: 16),
                label: Text(hasTechnician ? 'Modifier' : 'Assigner'),
              ),
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: hasTechnician ? AdminTheme.primary.withValues(alpha: 0.05) : AdminTheme.background,
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
              border: Border.all(
                color: hasTechnician ? AdminTheme.primary.withValues(alpha: 0.3) : AdminTheme.border,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  hasTechnician ? Icons.check_circle_outline : Icons.help_outline,
                  color: hasTechnician ? AdminTheme.primary : AdminTheme.textDisabled,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    hasTechnician ? appointment.technician! : 'Aucun technicien assigné pour le moment',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: hasTechnician ? FontWeight.w600 : FontWeight.normal,
                      color: hasTechnician ? AdminTheme.textPrimary : AdminTheme.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotesCard(Appointment appointment) {
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(Icons.sticky_note_2_outlined, 'Notes terrain & observations'),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextField(
            controller: _notesController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Ajouter des notes techniques, contraintes d\'accès...',
              filled: true,
              fillColor: AdminTheme.background,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                borderSide: const BorderSide(color: AdminTheme.border),
              ),
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton.icon(
              onPressed: _isSavingNotes ? null : () => _saveNotes(appointment),
              style: ElevatedButton.styleFrom(
                backgroundColor: AdminTheme.primary,
                foregroundColor: Colors.white,
              ),
              icon: _isSavingNotes
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.save, size: 16),
              label: const Text('Enregistrer les notes'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionsCard(BuildContext context, WidgetRef ref, Appointment appointment) {
    final isDone = appointment.status == 'done' || appointment.status == 'completed';
    final isCancelled = appointment.status == 'cancelled';

    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(Icons.touch_app_outlined, 'Actions & Gestion'),
          const SizedBox(height: MaasgaTokens.spacingMd),

          // Confirm button
          if (appointment.status == 'pending')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _confirmAppointment(context, ref, appointment.id),
                icon: const Icon(Icons.check_circle, size: 18),
                label: const Text('Confirmer le RDV'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AdminTheme.success,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),

          // Mark done button
          if (appointment.status == 'confirmed') ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _markDone(context, ref, appointment.id),
                icon: const Icon(Icons.done_all, size: 18),
                label: const Text('Marquer comme terminé (Done)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AdminTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(height: MaasgaTokens.spacingSm),
          ],

          // Reschedule button
          if (!isCancelled && !isDone) ...[
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => RescheduleForm.show(context, appointment),
                icon: const Icon(Icons.edit_calendar_outlined, size: 18),
                label: const Text('Reprogrammer le RDV'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AdminTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(height: MaasgaTokens.spacingSm),
          ],

          // Quick conversions: Devis & Commande
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    context.go('/devis');
                  },
                  icon: const Icon(Icons.request_quote_outlined, size: 16),
                  label: const Text('Créer un devis', style: TextStyle(fontSize: 12)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    context.go('/commandes');
                  },
                  icon: const Icon(Icons.shopping_bag_outlined, size: 16),
                  label: const Text('Créer commande', style: TextStyle(fontSize: 12)),
                ),
              ),
            ],
          ),

          // Cancel button
          if (!isCancelled && !isDone) ...[
            const SizedBox(height: MaasgaTokens.spacingSm),
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: () => _cancelAppointment(context, ref, appointment.id),
                icon: const Icon(Icons.cancel_outlined, size: 18),
                label: const Text('Annuler le RDV'),
                style: TextButton.styleFrom(
                  foregroundColor: AdminTheme.error,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _confirmAppointment(BuildContext context, WidgetRef ref, String id) async {
    try {
      await ref.read(confirmAppointmentProvider(id).future);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('RDV confirmé avec succès'),
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

  Future<void> _markDone(BuildContext context, WidgetRef ref, String id) async {
    try {
      await ref.read(
        updateAppointmentStatusProvider((id: id, status: 'done')).future,
      );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('RDV marqué comme terminé'),
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

  void _cancelAppointment(BuildContext context, WidgetRef ref, String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Annuler le RDV?'),
        content: const Text('Le client sera notifié de l\'annulation.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Retour'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AdminTheme.error),
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ref.read(
                  cancelAppointmentProvider((id: id, reason: null)).future,
                );
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('RDV annulé'),
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
            child: const Text('Annuler le RDV'),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AdminTheme.primary),
        const SizedBox(width: MaasgaTokens.spacingSm),
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: AdminTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AdminTheme.textSecondary),
          const SizedBox(width: MaasgaTokens.spacingSm),
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: AdminTheme.textSecondary),
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

  ({Color color, IconData icon}) _getStatusInfo(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return (color: AdminTheme.info, icon: Icons.event_available);
      case 'done':
      case 'completed':
        return (color: AdminTheme.success, icon: Icons.check_circle);
      case 'cancelled':
        return (color: AdminTheme.error, icon: Icons.cancel);
      case 'pending':
      default:
        return (color: AdminTheme.warning, icon: Icons.schedule);
    }
  }
}
