import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/sav_provider.dart';
import '../../data/models/sav_ticket.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class SAVDetailScreen extends ConsumerStatefulWidget {
  final int ticketId;

  const SAVDetailScreen({super.key, required this.ticketId});

  @override
  ConsumerState<SAVDetailScreen> createState() => _SAVDetailScreenState();
}

class _SAVDetailScreenState extends ConsumerState<SAVDetailScreen> {
  final _replyController = TextEditingController();
  bool _isSending = false;

  @override
  void dispose() {
    _replyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ticketAsync = ref.watch(savTicketDetailProvider(widget.ticketId));

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: Text(
          'Ticket SAV #${widget.ticketId}',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AdminTheme.primary),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          ticketAsync.when(
            data: (ticket) => PopupMenuButton<String>(
              onSelected: (action) => _handleAction(action, ticket),
              itemBuilder: (context) => [
                if (ticket.isOpen)
                  const PopupMenuItem(
                    value: 'assign',
                    child: ListTile(
                      leading: Icon(Icons.person_add, color: AdminTheme.info),
                      title: Text('Assigner technicien'),
                      dense: true,
                    ),
                  ),
                if (ticket.isInProgress)
                  const PopupMenuItem(
                    value: 'resolve',
                    child: ListTile(
                      leading: Icon(
                        Icons.check_circle,
                        color: AdminTheme.success,
                      ),
                      title: Text('Résoudre'),
                      dense: true,
                    ),
                  ),
                if (!ticket.isResolved)
                  const PopupMenuItem(
                    value: 'close',
                    child: ListTile(
                      leading: Icon(Icons.lock, color: AdminTheme.secondary),
                      title: Text('Fermer le ticket'),
                      dense: true,
                    ),
                  ),
              ],
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: ticketAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 48,
                color: AdminTheme.error,
              ),
              const SizedBox(height: MaasgaTokens.spacingMd),
              Text('Erreur: $e'),
              const SizedBox(height: MaasgaTokens.spacingSm),
              ElevatedButton(
                onPressed: () =>
                    ref.invalidate(savTicketDetailProvider(widget.ticketId)),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (ticket) => Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeaderCard(ticket),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    _buildClientCard(ticket),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    _buildProblemCard(ticket),
                    if (ticket.assignedTechnician != null) ...[
                      const SizedBox(height: MaasgaTokens.spacingMd),
                      _buildTechnicianCard(ticket),
                    ],
                    if (ticket.isResolved && ticket.resolution != null) ...[
                      const SizedBox(height: MaasgaTokens.spacingMd),
                      _buildResolutionCard(ticket),
                    ],
                    const SizedBox(height: MaasgaTokens.spacingXl),
                  ],
                ),
              ),
            ),
            // Zone de réponse fixe en bas
            if (!ticket.isResolved && ticket.status != 'closed')
              _buildReplyBar(ticket),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderCard(SavTicket ticket) {
    final statusColor = _statusColor(ticket.status);
    final priorityColor = _priorityColor(ticket.priority);

    return Container(
      decoration: ticket.isUrgent
          ? AdminTheme.cardDecoration.copyWith(
              border: Border.all(color: AdminTheme.error, width: 2),
            )
          : AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '#SAV-${ticket.id}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AdminTheme.primary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: priorityColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  ticket.priorityLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: priorityColor,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  ticket.statusLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          Text(
            'Créé le ${ticket.formattedDate} à ${ticket.formattedTime}',
            style: const TextStyle(
              fontSize: 12,
              color: AdminTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClientCard(SavTicket ticket) {
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(Icons.person, 'Client'),
          const SizedBox(height: MaasgaTokens.spacingMd),
          _infoRow(Icons.person_outline, 'Nom', ticket.clientName),
          _infoRow(Icons.phone, 'Téléphone', ticket.clientPhone),
          if (ticket.clientEmail != null)
            _infoRow(Icons.email, 'Email', ticket.clientEmail!),
          if (ticket.equipmentType != null)
            _infoRow(Icons.ac_unit, 'Équipement', ticket.equipmentType!),
          if (ticket.serialNumber != null)
            _infoRow(Icons.qr_code, 'N° Série', ticket.serialNumber!),
        ],
      ),
    );
  }

  Widget _buildProblemCard(SavTicket ticket) {
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(Icons.report_problem, 'Description du problème'),
          const SizedBox(height: MaasgaTokens.spacingMd),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            decoration: BoxDecoration(
              color: AdminTheme.background,
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
              border: Border.all(color: AdminTheme.border),
            ),
            child: Text(
              ticket.issueDescription,
              style: const TextStyle(
                fontSize: 14,
                color: AdminTheme.textPrimary,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTechnicianCard(SavTicket ticket) {
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AdminTheme.info.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
            ),
            child: const Icon(
              Icons.engineering,
              color: AdminTheme.info,
              size: 22,
            ),
          ),
          const SizedBox(width: MaasgaTokens.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Technicien assigné',
                  style: TextStyle(
                    fontSize: 12,
                    color: AdminTheme.textSecondary,
                  ),
                ),
                Text(
                  ticket.assignedTechnician!,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: AdminTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResolutionCard(SavTicket ticket) {
    return Container(
      decoration: AdminTheme.cardDecoration.copyWith(
        border: Border.all(color: AdminTheme.success.withValues(alpha: 0.3)),
      ),
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.check_circle,
                color: AdminTheme.success,
                size: 18,
              ),
              const SizedBox(width: MaasgaTokens.spacingSm),
              const Text(
                'Résolution',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AdminTheme.success,
                ),
              ),
              if (ticket.resolutionDate != null) ...[
                const Spacer(),
                Text(
                  _formatDate(ticket.resolutionDate!),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AdminTheme.textSecondary,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          Text(
            ticket.resolution!,
            style: const TextStyle(
              fontSize: 13,
              color: AdminTheme.textPrimary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReplyBar(SavTicket ticket) {
    return Container(
      decoration: BoxDecoration(
        color: AdminTheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      padding: EdgeInsets.only(
        left: MaasgaTokens.spacingMd,
        right: MaasgaTokens.spacingMd,
        top: MaasgaTokens.spacingMd,
        bottom:
            MaasgaTokens.spacingMd + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _replyController,
              maxLines: 3,
              minLines: 1,
              decoration: InputDecoration(
                hintText: 'Répondre au ticket...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                  borderSide: const BorderSide(color: AdminTheme.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                  borderSide: const BorderSide(color: AdminTheme.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                  borderSide: const BorderSide(
                    color: AdminTheme.primary,
                    width: 2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: MaasgaTokens.spacingMd,
                  vertical: MaasgaTokens.spacingSm,
                ),
              ),
            ),
          ),
          const SizedBox(width: MaasgaTokens.spacingSm),
          _isSending
              ? const CircularProgressIndicator()
              : FloatingActionButton.small(
                  onPressed: () => _sendReply(ticket),
                  backgroundColor: AdminTheme.primary,
                  child: const Icon(Icons.send, color: Colors.white, size: 18),
                ),
        ],
      ),
    );
  }

  Future<void> _sendReply(SavTicket ticket) async {
    final text = _replyController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isSending = true);
    try {
      // Move ticket to in_progress if it's open
      if (ticket.isOpen) {
        await ref.read(
          updateSavTicketStatusProvider({
            'id': ticket.id,
            'status': 'in_progress',
          }).future,
        );
      }
      _replyController.clear();
      ref.invalidate(savTicketDetailProvider(widget.ticketId));
      ref.invalidate(savTicketsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Réponse envoyée et ticket mis en cours'),
            backgroundColor: AdminTheme.success,
          ),
        );
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
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _handleAction(String action, SavTicket ticket) {
    switch (action) {
      case 'assign':
        _showAssignDialog(ticket);
        break;
      case 'resolve':
        _showResolveDialog(ticket);
        break;
      case 'close':
        _closeTicket(ticket);
        break;
    }
  }

  void _showAssignDialog(SavTicket ticket) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Assigner un technicien'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Nom du technicien',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.isEmpty) return;
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              try {
                await ref.read(
                  assignTechnicianProvider({
                    'id': ticket.id,
                    'technician': controller.text,
                  }).future,
                );
                ref.invalidate(savTicketDetailProvider(widget.ticketId));
                ref.invalidate(savTicketsProvider);
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Technicien assigné'),
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
            child: const Text('Assigner'),
          ),
        ],
      ),
    );
  }

  void _showResolveDialog(SavTicket ticket) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Résoudre le ticket'),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Description de la résolution',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AdminTheme.success,
            ),
            onPressed: () async {
              if (controller.text.isEmpty) return;
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              try {
                await ref.read(
                  resolveSavTicketProvider({
                    'id': ticket.id,
                    'resolution': controller.text,
                  }).future,
                );
                ref.invalidate(savTicketDetailProvider(widget.ticketId));
                ref.invalidate(savTicketsProvider);
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Ticket résolu'),
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
            child: const Text('Résoudre'),
          ),
        ],
      ),
    );
  }

  void _closeTicket(SavTicket ticket) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Fermer le ticket?'),
        content: const Text('Le ticket sera marqué comme fermé.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              try {
                await ref.read(
                  updateSavTicketStatusProvider({
                    'id': ticket.id,
                    'status': 'closed',
                  }).future,
                );
                ref.invalidate(savTicketDetailProvider(widget.ticketId));
                ref.invalidate(savTicketsProvider);
              } catch (e) {
                messenger.showSnackBar(
                  SnackBar(
                    content: Text('Erreur: $e'),
                    backgroundColor: AdminTheme.error,
                  ),
                );
              }
            },
            child: const Text('Fermer'),
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
            fontSize: 15,
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

  Color _statusColor(String s) {
    switch (s) {
      case 'open':
        return AdminTheme.error;
      case 'in_progress':
        return AdminTheme.warning;
      case 'resolved':
        return AdminTheme.success;
      case 'closed':
        return AdminTheme.secondary;
      default:
        return AdminTheme.secondary;
    }
  }

  Color _priorityColor(String p) {
    switch (p) {
      case 'urgent':
        return AdminTheme.error;
      case 'high':
        return AdminTheme.warning;
      case 'normal':
        return AdminTheme.info;
      default:
        return AdminTheme.secondary;
    }
  }

  String _formatDate(String dateStr) {
    try {
      final d = DateTime.parse(dateStr);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
