import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/message_provider.dart';
import '../../data/models/message.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  String _searchQuery = '';
  String _statusFilter = 'all';

  final List<String> _statusFilters = ['all', 'unread', 'read', 'responded'];

  void _refreshMessages() {
    ref.invalidate(messagesProvider);
    ref.invalidate(messagesStatsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(messagesProvider);
    final statsAsync = ref.watch(messagesStatsProvider);

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: const Text(
          'Messages Clients',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AdminTheme.primary),
            tooltip: 'Actualiser',
            onPressed: _refreshMessages,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(120),
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
              // Search input
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: MaasgaTokens.spacingMd,
                  vertical: MaasgaTokens.spacingXs,
                ),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher un message...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: MaasgaTokens.spacingMd,
                      vertical: MaasgaTokens.spacingSm,
                    ),
                    filled: true,
                    fillColor: AdminTheme.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusMd,
                      ),
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
                              ? 'Tous'
                              : filter == 'unread'
                              ? 'Non lus'
                              : filter == 'read'
                              ? 'Lus'
                              : 'Répondus',
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
      body: messagesAsync.when(
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
                onPressed: _refreshMessages,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (messagesList) {
          var filteredMessages = messagesList;

          // Apply search filter
          if (_searchQuery.isNotEmpty) {
            filteredMessages = filteredMessages.where((m) {
              return m.clientName.toLowerCase().contains(_searchQuery) ||
                  m.clientPhone.contains(_searchQuery) ||
                  (m.subject?.toLowerCase().contains(_searchQuery) ?? false) ||
                  m.message.toLowerCase().contains(_searchQuery);
            }).toList();
          }

          // Apply status filter
          if (_statusFilter != 'all') {
            filteredMessages = filteredMessages
                .where((m) => m.status == _statusFilter)
                .toList();
          }

          if (filteredMessages.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.inbox_outlined,
                    size: 64,
                    color: AdminTheme.textSecondary,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingMd),
                  const Text('Aucun message trouvé'),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _refreshMessages(),
            child: ListView.separated(
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              itemCount: filteredMessages.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _buildMessageCard(filteredMessages[index]);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildMessageCard(ClientMessage message) {
    Color getStatusColor(String status) {
      switch (status) {
        case 'unread':
          return AdminTheme.error;
        case 'read':
          return AdminTheme.info;
        case 'responded':
          return AdminTheme.success;
        default:
          return AdminTheme.secondary;
      }
    }

    final statusColor = getStatusColor(message.status);

    return Container(
      decoration: message.isUnread
          ? AdminTheme.cardDecoration.copyWith(
              border: Border.all(color: AdminTheme.primary, width: 2),
            )
          : AdminTheme.cardDecoration,
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
                    Row(
                      children: [
                        if (message.isUnread)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AdminTheme.error,
                              shape: BoxShape.circle,
                            ),
                          ),
                        const SizedBox(width: 8),
                        Text(
                          message.clientName,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      message.formattedDate,
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
                  message.statusLabel,
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
          if (message.subject != null && message.subject!.isNotEmpty) ...[
            Text(
              message.subject!,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
            const SizedBox(height: 8),
          ],
          Text(
            message.message,
            style: TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.phone, size: 14, color: AdminTheme.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    message.clientPhone,
                    style: TextStyle(
                      fontSize: 11,
                      color: AdminTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  if (!message.isResponded)
                    TextButton.icon(
                      onPressed: () => _showResponseDialog(message),
                      icon: const Icon(Icons.reply, size: 16),
                      label: const Text('Répondre'),
                      style: TextButton.styleFrom(
                        foregroundColor: AdminTheme.primary,
                      ),
                    ),
                  if (message.isResponded)
                    TextButton.icon(
                      onPressed: () => _showMessageDetail(message),
                      icon: const Icon(Icons.visibility, size: 16),
                      label: const Text('Voir'),
                      style: TextButton.styleFrom(
                        foregroundColor: AdminTheme.info,
                      ),
                    ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 18),
                    onPressed: () => _deleteMessage(message.id),
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

  void _showResponseDialog(ClientMessage message) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Répondre à ${message.clientName}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.subject != null) ...[
              Text(
                message.subject!,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
            ],
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AdminTheme.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                message.message,
                style: TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Votre réponse',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.isNotEmpty) {
                final navigator = Navigator.of(context);
                final messenger = ScaffoldMessenger.of(context);
                try {
                  await ref.read(
                    respondToMessageProvider({
                      'id': message.id,
                      'response': controller.text,
                    }).future,
                  );
                  navigator.pop();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Réponse envoyée avec succès'),
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
              }
            },
            child: const Text('Envoyer'),
          ),
        ],
      ),
    );
  }

  void _showMessageDetail(ClientMessage message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Message de ${message.clientName}'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (message.subject != null) ...[
                Text(
                  message.subject!,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
              ],
              Text(message.message, style: const TextStyle(fontSize: 14)),
              if (message.adminResponse != null) ...[
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),
                const Text(
                  'Votre réponse:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  message.adminResponse!,
                  style: TextStyle(fontSize: 14, color: AdminTheme.primary),
                ),
              ],
              const SizedBox(height: 16),
              Text(
                'Envoyé le ${message.formattedDate} à ${message.formattedTime}',
                style: TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }

  void _deleteMessage(int messageId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer ce message?'),
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
                await ref.read(deleteMessageProvider(messageId).future);
                navigator.pop();
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Message supprimé'),
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
    final unread = (stats['unread'] is num
        ? (stats['unread'] as num).toInt()
        : 0);
    final responded = (stats['responded'] is num
        ? (stats['responded'] as num).toInt()
        : 0);

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
            child: _buildStatChip('Non lus', '$unread', AdminTheme.error),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatChip('Répondus', '$responded', AdminTheme.success),
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
