import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/notification_provider.dart';
import '../../data/models/notification.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import '../widgets/notification_form.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  String _statusFilter = 'all';

  final List<String> _statusFilters = ['all', 'draft', 'scheduled', 'sent'];

  void _refreshNotifications() {
    ref.invalidate(notificationsProvider);
    ref.invalidate(notificationsStatsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(notificationsProvider);
    final statsAsync = ref.watch(notificationsStatsProvider);

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: const Text(
          'Notifications Push',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AdminTheme.primary),
            tooltip: 'Actualiser',
            onPressed: _refreshNotifications,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(110),
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
                              ? 'Toutes'
                              : filter == 'draft'
                              ? 'Brouillons'
                              : filter == 'scheduled'
                              ? 'Programmées'
                              : 'Envoyées',
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
      body: notificationsAsync.when(
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
                onPressed: _refreshNotifications,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (notifications) {
          var filteredNotifications = notifications;

          // Apply status filter
          if (_statusFilter != 'all') {
            filteredNotifications = filteredNotifications
                .where((n) => n.status == _statusFilter)
                .toList();
          }

          if (filteredNotifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_none_outlined,
                    size: 64,
                    color: AdminTheme.textSecondary,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingMd),
                  const Text('Aucune notification trouvée'),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _refreshNotifications(),
            child: ListView.separated(
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              itemCount: filteredNotifications.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _buildNotificationCard(filteredNotifications[index]);
              },
            ),
          );
        },
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
              child: const NotificationForm(),
            ),
          );
        },
        backgroundColor: AdminTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildNotificationCard(NotificationCampaign notification) {
    Color getStatusColor(String status) {
      switch (status) {
        case 'draft':
          return AdminTheme.secondary;
        case 'scheduled':
          return AdminTheme.info;
        case 'sent':
          return AdminTheme.success;
        case 'cancelled':
          return AdminTheme.error;
        default:
          return AdminTheme.secondary;
      }
    }

    final statusColor = getStatusColor(notification.status);

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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '#NOTIF-${notification.id}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AdminTheme.primary,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.formattedDate,
                      style: TextStyle(
                        fontSize: 12,
                        color: AdminTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  notification.statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            notification.title,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Text(
            notification.body,
            style: TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.group, size: 14, color: AdminTheme.textSecondary),
              const SizedBox(width: 6),
              Text(
                notification.targetSegmentLabel,
                style: TextStyle(fontSize: 11, color: AdminTheme.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.people, size: 14, color: AdminTheme.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    '${notification.recipientCount} destinataires',
                    style: TextStyle(
                      fontSize: 11,
                      color: AdminTheme.textSecondary,
                    ),
                  ),
                  if (notification.isSent) ...[
                    const SizedBox(width: 12),
                    Icon(
                      Icons.visibility,
                      size: 14,
                      color: AdminTheme.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${notification.openRate.toStringAsFixed(1)}% ouverture',
                      style: TextStyle(fontSize: 11, color: AdminTheme.primary),
                    ),
                  ],
                ],
              ),
              Row(
                children: [
                  if (notification.isDraft)
                    IconButton(
                      icon: const Icon(Icons.send, size: 18),
                      onPressed: () => _sendNotification(notification.id),
                      tooltip: 'Envoyer',
                      color: AdminTheme.success,
                    ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 18),
                    onPressed: () => _deleteNotification(notification.id),
                    color: AdminTheme.error,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _sendNotification(int notificationId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Envoyer cette notification?'),
        content: const Text(
          'Cette action enverra la notification à tous les destinataires ciblés.',
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
              final navigator = Navigator.of(context);
              final messenger = ScaffoldMessenger.of(context);
              try {
                await ref.read(sendNotificationProvider(notificationId).future);
                navigator.pop();
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Notification envoyée avec succès'),
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
            child: const Text('Envoyer'),
          ),
        ],
      ),
    );
  }

  void _deleteNotification(int notificationId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer cette notification?'),
        content: const Text('Cette action est irréversible.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AdminTheme.error),
            onPressed: () async {
              final navigator = Navigator.of(context);
              final messenger = ScaffoldMessenger.of(context);
              try {
                await ref.read(
                  deleteNotificationProvider(notificationId).future,
                );
                navigator.pop();
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Notification supprimée'),
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
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsBar(Map<String, dynamic> stats) {
    final total = (stats['total'] is num ? (stats['total'] as num).toInt() : 0);
    final sentData =
        stats['sent'] as Map<String, dynamic>? ?? {'count': 0, 'recipients': 0};
    final sent = sentData['count'] as int? ?? 0;
    const draft = 0;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: MaasgaTokens.spacingMd,
        vertical: MaasgaTokens.spacingSm,
      ),
      color: AdminTheme.surface,
      child: Row(
        children: [
          Expanded(
            child: _buildStatChip('Total', '$total', AdminTheme.primary),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatChip('Envoyées', '$sent', AdminTheme.success),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatChip('Brouillons', '$draft', AdminTheme.secondary),
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(String label, String value, Color color) {
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
}
