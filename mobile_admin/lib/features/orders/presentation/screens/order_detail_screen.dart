import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/order_provider.dart';
import '../../data/models/order.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../core/utils/error_handler.dart';
import '../../../devis/data/providers/devis_provider.dart';

class OrderDetailScreen extends ConsumerStatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  ConsumerState<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends ConsumerState<OrderDetailScreen> {
  final _notesController = TextEditingController();
  bool _isSavingNotes = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderAsync = ref.watch(orderDetailProvider(widget.orderId));

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: Text(
          'Commande #${widget.orderId}',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AdminTheme.primary),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          orderAsync.when(
            data: (order) => IconButton(
              icon: const Icon(Icons.edit_note, color: AdminTheme.primary),
              tooltip: 'Changer le statut',
              onPressed: () => _showStatusBottomSheet(order),
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: orderAsync.when(
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
                onPressed: () =>
                    ref.invalidate(orderDetailProvider(widget.orderId)),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (order) {
          _notesController.text = order.notes ?? '';
          return SingleChildScrollView(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildStatusCard(order),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildClientCard(order),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildProductCard(order),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildTimelineCard(order),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildNotesCard(order),
                const SizedBox(height: MaasgaTokens.spacingMd),
                _buildActionsCard(order),
                const SizedBox(height: MaasgaTokens.spacingXl),
              ],
            ),
          );
        },
      ),
    );
  }

  // ────────────────────── CARDS ──────────────────────

  Widget _buildStatusCard(Order order) {
    final statusInfo = _getStatusInfo(order.status);
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
                  'Commande #${order.id}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AdminTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Créée le ${_formatDate(order.createdAt)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AdminTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: statusInfo.color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: statusInfo.color),
            ),
            child: Text(
              order.formattedStatus,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: statusInfo.color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClientCard(Order order) {
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(Icons.person, 'Informations client'),
          const SizedBox(height: MaasgaTokens.spacingMd),
          _buildInfoRow(Icons.person_outline, 'Nom', order.clientName),
          _buildInfoRow(Icons.phone, 'Téléphone', order.clientPhone),
          if (order.clientEmail != null)
            _buildInfoRow(Icons.email, 'Email', order.clientEmail!),
          _buildInfoRow(Icons.location_on, 'Quartier', order.quartier),
          _buildInfoRow(Icons.category, 'Type', order.type),
        ],
      ),
    );
  }

  Widget _buildProductCard(Order order) {
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(Icons.inventory_2, 'Articles commandés'),
          const SizedBox(height: MaasgaTokens.spacingMd),
          if (order.productName != null) ...[
            Container(
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              decoration: BoxDecoration(
                color: AdminTheme.background,
                borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                border: Border.all(color: AdminTheme.border),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AdminTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusSm,
                      ),
                    ),
                    child: const Icon(
                      Icons.ac_unit,
                      color: AdminTheme.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: MaasgaTokens.spacingMd),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.productName!,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        if (order.brand != null || order.btu != null)
                          Text(
                            [
                              if (order.brand != null) order.brand!,
                              if (order.btu != null) '${order.btu} BTU',
                            ].join(' • '),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AdminTheme.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'x${order.quantity ?? 1}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AdminTheme.textSecondary,
                        ),
                      ),
                      if (order.productPrice != null)
                        Text(
                          '${order.productPrice!.toStringAsFixed(0)} FCFA',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ] else ...[
            const Center(
              child: Text(
                'Aucun article enregistré',
                style: TextStyle(color: AdminTheme.textSecondary),
              ),
            ),
          ],
          const Divider(height: MaasgaTokens.spacingLg),
          if (order.installationPrice != null && order.installationPrice! > 0)
            Padding(
              padding: const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Installation',
                    style: TextStyle(color: AdminTheme.textSecondary),
                  ),
                  Text(
                    '${order.installationPrice!.toStringAsFixed(0)} FCFA',
                    style: const TextStyle(color: AdminTheme.textSecondary),
                  ),
                ],
              ),
            ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              Text(
                '${order.totalPrice.toStringAsFixed(0)} FCFA',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: AdminTheme.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineCard(Order order) {
    final steps = [
      _TimelineStep(
        status: 'en_attente',
        label: 'En attente',
        subtitle: 'Commande reçue',
        icon: Icons.inbox,
        color: Colors.orange,
      ),
      _TimelineStep(
        status: 'confirme',
        label: 'Confirmée',
        subtitle: 'Commande confirmée',
        icon: Icons.check_circle_outline,
        color: Colors.blue,
      ),
      _TimelineStep(
        status: 'en_livraison',
        label: 'En cours de livraison',
        subtitle: 'Expédition vers le client',
        icon: Icons.local_shipping,
        color: Colors.purple,
      ),
      _TimelineStep(
        status: 'livre',
        label: 'Livrée & Installée',
        subtitle: 'Livraison achevée',
        icon: Icons.done_all,
        color: AdminTheme.success,
      ),
    ];

    final currentIndex = _getStatusIndex(order.status);
    final isCancelled = order.status == 'annule';

    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(Icons.timeline, 'Suivi et actions par étape'),
          const SizedBox(height: MaasgaTokens.spacingMd),
          if (isCancelled)
            Container(
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              decoration: BoxDecoration(
                color: AdminTheme.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                border: Border.all(
                  color: AdminTheme.error.withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.cancel, color: AdminTheme.error),
                      SizedBox(width: 8),
                      Text(
                        'Commande annulée',
                        style: TextStyle(
                          color: AdminTheme.error,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ElevatedButton.icon(
                    onPressed: () => _updateStatus(order.id, 'en_attente'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AdminTheme.primary,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.replay, size: 16),
                    label: const Text('Réactiver la commande'),
                  ),
                ],
              ),
            )
          else
            ...steps.asMap().entries.map((entry) {
              final index = entry.key;
              final step = entry.value;
              final isDone = index <= currentIndex;
              final isActive = index == currentIndex;

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: isDone ? step.color : AdminTheme.border,
                          shape: BoxShape.circle,
                          border: isActive
                              ? Border.all(color: step.color, width: 3)
                              : null,
                        ),
                        child: Icon(
                          isDone ? Icons.check : step.icon,
                          color: isDone
                              ? Colors.white
                              : AdminTheme.textDisabled,
                          size: 16,
                        ),
                      ),
                      if (index < steps.length - 1)
                        Container(
                          width: 2,
                          height: isActive ? 60 : 32,
                          color: isDone && index < currentIndex
                              ? step.color
                              : AdminTheme.border,
                        ),
                    ],
                  ),
                  const SizedBox(width: MaasgaTokens.spacingMd),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                step.label,
                                style: TextStyle(
                                  fontWeight: isActive
                                      ? FontWeight.bold
                                      : FontWeight.normal,
                                  color: isDone
                                      ? AdminTheme.textPrimary
                                      : AdminTheme.textDisabled,
                                ),
                              ),
                              if (isActive) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: step.color.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    'Étape actuelle',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: step.color,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          Text(
                            step.subtitle,
                            style: TextStyle(
                              fontSize: 12,
                              color: isDone
                                  ? AdminTheme.textSecondary
                                  : AdminTheme.textDisabled,
                            ),
                          ),
                          // Actions contextuelles sous l'étape active
                          if (isActive) ...[
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: [
                                if (step.status == 'en_attente') ...[
                                  ElevatedButton.icon(
                                    onPressed: () =>
                                        _updateStatus(order.id, 'confirme'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AdminTheme.success,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 6,
                                      ),
                                      textStyle: const TextStyle(fontSize: 12),
                                    ),
                                    icon: const Icon(Icons.check, size: 14),
                                    label: const Text('Confirmer'),
                                  ),
                                  OutlinedButton.icon(
                                    onPressed: () =>
                                        _createDevisFromOrder(order),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: AdminTheme.primary,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 6,
                                      ),
                                      textStyle: const TextStyle(fontSize: 12),
                                    ),
                                    icon: const Icon(
                                      Icons.request_quote_outlined,
                                      size: 14,
                                    ),
                                    label: const Text('Créer devis associé'),
                                  ),
                                ],
                                if (step.status == 'confirme') ...[
                                  ElevatedButton.icon(
                                    onPressed: () =>
                                        _updateStatus(order.id, 'en_livraison'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.purple,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 6,
                                      ),
                                      textStyle: const TextStyle(fontSize: 12),
                                    ),
                                    icon: const Icon(
                                      Icons.local_shipping,
                                      size: 14,
                                    ),
                                    label: const Text('Marquer en livraison'),
                                  ),
                                ],
                                if (step.status == 'en_livraison') ...[
                                  ElevatedButton.icon(
                                    onPressed: () =>
                                        _updateStatus(order.id, 'livre'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AdminTheme.success,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 6,
                                      ),
                                      textStyle: const TextStyle(fontSize: 12),
                                    ),
                                    icon: const Icon(Icons.done_all, size: 14),
                                    label: const Text('Confirmer livraison'),
                                  ),
                                ],
                                if (step.status == 'livre') ...[
                                  OutlinedButton.icon(
                                    onPressed: () {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'Redirection vers Contrats de maintenance',
                                          ),
                                        ),
                                      );
                                    },
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: AdminTheme.primary,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 6,
                                      ),
                                      textStyle: const TextStyle(fontSize: 12),
                                    ),
                                    icon: const Icon(
                                      Icons.build_circle_outlined,
                                      size: 14,
                                    ),
                                    label: const Text(
                                      'Créer contrat maintenance',
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }),
        ],
      ),
    );
  }

  Widget _buildNotesCard(Order order) {
    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(Icons.note_alt, 'Notes administrateur'),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextField(
            controller: _notesController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: 'Ajouter une note interne sur cette commande...',
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
              contentPadding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton.icon(
              onPressed: _isSavingNotes ? null : () => _saveNotes(order.id),
              icon: _isSavingNotes
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.save, size: 16),
              label: const Text('Sauvegarder'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AdminTheme.primary,
                foregroundColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionsCard(Order order) {
    if (order.status == 'annule' || order.status == 'livre') {
      return const SizedBox.shrink();
    }

    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(Icons.settings, 'Actions'),
          const SizedBox(height: MaasgaTokens.spacingMd),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showStatusBottomSheet(order),
                  icon: const Icon(Icons.update, size: 16),
                  label: const Text('Changer statut'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AdminTheme.primary,
                    side: const BorderSide(color: AdminTheme.primary),
                  ),
                ),
              ),
              const SizedBox(width: MaasgaTokens.spacingSm),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _confirmCancel(order.id),
                  icon: const Icon(Icons.cancel_outlined, size: 16),
                  label: const Text('Annuler'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AdminTheme.error,
                    side: const BorderSide(color: AdminTheme.error),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ────────────────────── ACTIONS ──────────────────────

  void _showStatusBottomSheet(Order order) {
    final statuses = [
      ('en_attente', 'En attente', Colors.orange),
      ('confirme', 'Confirmée', Colors.blue),
      ('en_livraison', 'En cours', Colors.purple),
      ('livre', 'Livrée', AdminTheme.success),
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(MaasgaTokens.radiusXl),
        ),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(MaasgaTokens.spacingLg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Changer le statut',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: AdminTheme.textPrimary,
              ),
            ),
            const SizedBox(height: MaasgaTokens.spacingMd),
            ...statuses.map((s) {
              final isSelected = order.status == s.$1;
              return ListTile(
                leading: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: s.$3,
                    shape: BoxShape.circle,
                  ),
                ),
                title: Text(s.$2),
                trailing: isSelected
                    ? const Icon(Icons.check, color: AdminTheme.primary)
                    : null,
                selected: isSelected,
                onTap: isSelected
                    ? null
                    : () async {
                        Navigator.pop(context);
                        await _updateStatus(order.id, s.$1);
                      },
              );
            }),
            const SizedBox(height: MaasgaTokens.spacingMd),
          ],
        ),
      ),
    );
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    try {
      await ref.read(
        orderStatusUpdateProvider((id: orderId, status: newStatus)).future,
      );
      ref.invalidate(orderDetailProvider(widget.orderId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Statut mis à jour avec succès'),
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
    }
  }

  Future<void> _saveNotes(String orderId) async {
    setState(() => _isSavingNotes = true);
    try {
      await ref.read(
        addOrderNotesProvider((
          id: orderId,
          notes: _notesController.text,
        )).future,
      );
      ref.invalidate(orderDetailProvider(widget.orderId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notes sauvegardées'),
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
      if (mounted) setState(() => _isSavingNotes = false);
    }
  }

  void _confirmCancel(String orderId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Annuler la commande?'),
        content: const Text(
          'Cette action est irréversible. La commande sera marquée comme annulée.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Retour'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AdminTheme.error),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              try {
                await ref.read(orderCancelProvider(orderId).future);
                ref.invalidate(orderDetailProvider(widget.orderId));
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Commande annulée'),
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
            child: const Text('Annuler la commande'),
          ),
        ],
      ),
    );
  }

  // ────────────────────── CONVERSION COMMANDE → DEVIS ──────────────────────

  void _createDevisFromOrder(Order order) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.request_quote, color: AdminTheme.primary),
            SizedBox(width: 8),
            Text('Créer un devis', style: TextStyle(fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Un devis sera créé pré-rempli avec les données de cette commande :',
              style: TextStyle(color: AdminTheme.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 12),
            _devisInfoRow('Client', order.clientName),
            if (order.productName != null)
              _devisInfoRow('Produit', order.productName!),
            _devisInfoRow(
              'Montant',
              '${order.totalPrice.toStringAsFixed(0)} FCFA',
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: AdminTheme.primaryButtonStyle,
            onPressed: () async {
              Navigator.pop(ctx);
              await _doCreateDevis(order);
            },
            child: const Text('Créer le devis'),
          ),
        ],
      ),
    );
  }

  Widget _devisInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text(
            '$label : ',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }

  Future<void> _doCreateDevis(Order order) async {
    try {
      final data = {
        'client_name': order.clientName,
        'client_phone': order.clientPhone,
        'client_email': order.clientEmail,
        'quartier': order.quartier,
        'product_name': order.productName,
        'amount': order.totalPrice,
        'order_id': order.id,
        'status': 'draft',
        'notes': 'Devis créé depuis la commande #${order.id}',
      };
      final success = await ref.read(createDevisProvider(data).future);
      if (mounted) {
        if (success) {
          ErrorHandler.showSuccess(context, 'Devis créé avec succès');
        } else {
          ErrorHandler.showError(context, 'Échec de la création du devis');
        }
      }
    } catch (e) {
      if (mounted) ErrorHandler.showError(context, e);
    }
  }

  // ────────────────────── HELPERS ──────────────────────

  Widget _buildSectionHeader(IconData icon, String title) {
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

  Widget _buildInfoRow(IconData icon, String label, String value) {
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

  _StatusInfo _getStatusInfo(String status) {
    switch (status) {
      case 'en_attente':
        return _StatusInfo(Colors.orange, Icons.inbox);
      case 'confirme':
        return _StatusInfo(Colors.blue, Icons.check_circle_outline);
      case 'en_livraison':
        return _StatusInfo(Colors.purple, Icons.local_shipping);
      case 'livre':
        return _StatusInfo(AdminTheme.success, Icons.done_all);
      case 'annule':
        return _StatusInfo(AdminTheme.error, Icons.cancel);
      default:
        return _StatusInfo(AdminTheme.secondary, Icons.help_outline);
    }
  }

  int _getStatusIndex(String status) {
    switch (status) {
      case 'en_attente':
        return 0;
      case 'confirme':
        return 1;
      case 'en_livraison':
        return 2;
      case 'livre':
        return 3;
      default:
        return 0;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}

class _StatusInfo {
  final Color color;
  final IconData icon;
  _StatusInfo(this.color, this.icon);
}

class _TimelineStep {
  final String status;
  final String label;
  final String subtitle;
  final IconData icon;
  final Color color;

  _TimelineStep({
    required this.status,
    required this.label,
    required this.subtitle,
    required this.icon,
    required this.color,
  });
}
