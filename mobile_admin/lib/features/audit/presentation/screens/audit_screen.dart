import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/audit_provider.dart';
import '../../data/models/audit_log.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class AuditScreen extends ConsumerStatefulWidget {
  const AuditScreen({super.key});

  @override
  ConsumerState<AuditScreen> createState() => _AuditScreenState();
}

class _AuditScreenState extends ConsumerState<AuditScreen> {
  final ScrollController _scrollController = ScrollController();
  String _searchQuery = '';
  String _filterAction = 'all';

  final List<String> _actionFilters = [
    'all',
    'create',
    'update',
    'delete',
    'approve',
    'reject',
    'login',
    'logout',
  ];

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  List<AuditLog> _filterLogs(List<AuditLog> logs) {
    var filtered = logs;

    // Filter by action
    if (_filterAction != 'all') {
      filtered = filtered
          .where((log) => log.action.toLowerCase().contains(_filterAction))
          .toList();
    }

    // Filter by search
    if (_searchQuery.isNotEmpty) {
      filtered = filtered
          .where(
            (log) =>
                log.action.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                (log.detail?.toLowerCase().contains(
                      _searchQuery.toLowerCase(),
                    ) ??
                    false) ||
                (log.ip?.contains(_searchQuery) ?? false),
          )
          .toList();
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    final logsAsync = ref.watch(auditLogsProvider);

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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Logs d\'audit',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () => ref.invalidate(auditLogsProvider),
                      icon: const Icon(Icons.refresh),
                    ),
                  ],
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                // Search bar
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher dans les logs...',
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
                // Action filter chips
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _actionFilters.length,
                    itemBuilder: (context, index) {
                      final filter = _actionFilters[index];
                      final isSelected = _filterAction == filter;
                      return Padding(
                        padding: const EdgeInsets.only(
                          right: MaasgaTokens.spacingSm,
                        ),
                        child: FilterChip(
                          label: Text(filter == 'all' ? 'Tous' : filter),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              _filterAction = selected ? filter : 'all';
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
          // Liste des logs
          Expanded(
            child: logsAsync.when(
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
                      onPressed: () => ref.invalidate(auditLogsProvider),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
              data: (logs) {
                final filteredLogs = _filterLogs(logs);

                if (filteredLogs.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.history,
                          size: 64,
                          color: AdminTheme.textSecondary,
                        ),
                        const SizedBox(height: MaasgaTokens.spacingMd),
                        const Text('Aucun log d\'audit'),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                  itemCount: filteredLogs.length,
                  itemBuilder: (context, index) {
                    final log = filteredLogs[index];
                    return Card(
                      margin: const EdgeInsets.only(
                        bottom: MaasgaTokens.spacingSm,
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: _getColorForAction(log.actionColor),
                          child: Text(
                            log.actionIcon,
                            style: const TextStyle(fontSize: 20),
                          ),
                        ),
                        title: Text(
                          log.action,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (log.detail != null) ...[
                              Text(
                                log.detail!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                            Row(
                              children: [
                                Text(
                                  log.formattedDate,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AdminTheme.textDisabled,
                                  ),
                                ),
                                if (log.ip != null) ...[
                                  const SizedBox(width: 8),
                                  Text(
                                    '• IP: ${log.ip}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AdminTheme.textDisabled,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                        onTap: () {
                          showDialog(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: Text('${log.actionIcon} ${log.action}'),
                              content: SingleChildScrollView(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (log.detail != null) ...[
                                      const Text(
                                        'Détail:',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(log.detail!),
                                      const SizedBox(height: 16),
                                    ],
                                    Row(
                                      children: [
                                        const Text(
                                          'Date: ',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(log.formattedDate),
                                      ],
                                    ),
                                    if (log.ip != null) ...[
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Text(
                                            'IP: ',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          Text(log.ip!),
                                        ],
                                      ),
                                    ],
                                    if (log.userAgent != null) ...[
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Text(
                                            'User Agent: ',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          Expanded(
                                            child: Text(
                                              log.userAgent!,
                                              style: TextStyle(fontSize: 12),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
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

  Color _getColorForAction(String colorName) {
    switch (colorName) {
      case 'green':
        return AdminTheme.success;
      case 'blue':
        return AdminTheme.info;
      case 'red':
        return AdminTheme.error;
      case 'purple':
        return Colors.purple;
      case 'orange':
        return AdminTheme.warning;
      default:
        return AdminTheme.secondary;
    }
  }
}
