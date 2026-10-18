import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/sav_provider.dart';
import '../../data/models/sav_ticket.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import 'sav_detail_screen.dart';
import '../widgets/sav_form.dart';

class SAVScreen extends ConsumerStatefulWidget {
  const SAVScreen({super.key});

  @override
  ConsumerState<SAVScreen> createState() => _SAVScreenState();
}

class _SAVScreenState extends ConsumerState<SAVScreen> {
  String _searchQuery = '';
  String _statusFilter = 'all';
  String _priorityFilter = 'all';

  final List<String> _statusFilters = [
    'all',
    'open',
    'in_progress',
    'resolved',
  ];

  final List<String> _priorityFilters = [
    'all',
    'urgent',
    'high',
    'normal',
    'low',
  ];

  void _refreshSavTickets() {
    ref.invalidate(savTicketsProvider);
    ref.invalidate(savStatsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final savTicketsAsync = ref.watch(savTicketsProvider);
    final statsAsync = ref.watch(savStatsProvider);

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: const Text(
          'Service Après-Vente',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AdminTheme.primary),
            tooltip: 'Actualiser',
            onPressed: _refreshSavTickets,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(200),
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
                    hintText: 'Rechercher un ticket...',
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
                              : filter == 'open'
                              ? 'Ouverts'
                              : filter == 'in_progress'
                              ? 'En cours'
                              : 'Résolus',
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
              // Priority filter chips
              SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: MaasgaTokens.spacingMd,
                  ),
                  itemCount: _priorityFilters.length,
                  itemBuilder: (context, index) {
                    final filter = _priorityFilters[index];
                    final isSelected = _priorityFilter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(
                        right: MaasgaTokens.spacingSm,
                      ),
                      child: FilterChip(
                        label: Text(
                          filter == 'all'
                              ? 'Toutes priorités'
                              : filter == 'urgent'
                              ? 'Urgent'
                              : filter == 'high'
                              ? 'Élevé'
                              : filter == 'normal'
                              ? 'Normal'
                              : 'Faible',
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            _priorityFilter = selected ? filter : 'all';
                          });
                        },
                        selectedColor: isSelected && filter == 'urgent'
                            ? AdminTheme.error.withValues(alpha: 0.2)
                            : AdminTheme.primary.withValues(alpha: 0.2),
                        labelStyle: TextStyle(
                          color: isSelected
                              ? (filter == 'urgent'
                                    ? AdminTheme.error
                                    : AdminTheme.primary)
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
      body: savTicketsAsync.when(
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
                onPressed: _refreshSavTickets,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (tickets) {
          var filteredTickets = tickets;

          // Apply search filter
          if (_searchQuery.isNotEmpty) {
            filteredTickets = filteredTickets.where((t) {
              return t.clientName.toLowerCase().contains(_searchQuery) ||
                  t.clientPhone.contains(_searchQuery) ||
                  (t.serialNumber?.toLowerCase().contains(_searchQuery) ??
                      false) ||
                  t.issueDescription.toLowerCase().contains(_searchQuery);
            }).toList();
          }

          // Apply status filter
          if (_statusFilter != 'all') {
            filteredTickets = filteredTickets
                .where((t) => t.status == _statusFilter)
                .toList();
          }

          // Apply priority filter
          if (_priorityFilter != 'all') {
            filteredTickets = filteredTickets
                .where((t) => t.priority == _priorityFilter)
                .toList();
          }

          if (filteredTickets.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.support_agent_outlined,
                    size: 64,
                    color: AdminTheme.textSecondary,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingMd),
                  const Text('Aucun ticket SAV trouvé'),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _refreshSavTickets(),
            child: ListView.separated(
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              itemCount: filteredTickets.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          SAVDetailScreen(ticketId: filteredTickets[index].id),
                    ),
                  ),
                  child: _buildSavTicketCard(filteredTickets[index]),
                );
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
              child: const SAVForm(),
            ),
          );
        },
        backgroundColor: AdminTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildSavTicketCard(SavTicket ticket) {
    Color getStatusColor(String status) {
      switch (status) {
        case 'open':
          return AdminTheme.error;
        case 'in_progress':
          return AdminTheme.warning;
        case 'resolved':
          return AdminTheme.success;
        default:
          return AdminTheme.secondary;
      }
    }

    Color getPriorityColor(String priority) {
      switch (priority) {
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

    final statusColor = getStatusColor(ticket.status);
    final priorityColor = getPriorityColor(ticket.priority);

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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (ticket.isUrgent)
                          const Icon(
                            Icons.priority_high,
                            size: 16,
                            color: AdminTheme.error,
                          ),
                        const SizedBox(width: 8),
                        Text(
                          '#SAV-${ticket.id}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AdminTheme.primary,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      ticket.formattedDate,
                      style: TextStyle(
                        fontSize: 12,
                        color: AdminTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: priorityColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      ticket.priorityLabel,
                      style: TextStyle(
                        color: priorityColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      ticket.statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.person,
                size: 16,
                color: AdminTheme.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                ticket.clientName,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '• ${ticket.clientPhone}',
                style: const TextStyle(
                  color: AdminTheme.textSecondary,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          if (ticket.equipmentType != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.ac_unit,
                  size: 16,
                  color: AdminTheme.textSecondary,
                ),
                const SizedBox(width: 6),
                Text(
                  ticket.equipmentType!,
                  style: TextStyle(
                    fontSize: 12,
                    color: AdminTheme.textSecondary,
                  ),
                ),
                if (ticket.serialNumber != null) ...[
                  const SizedBox(width: 8),
                  Text(
                    '• S/N: ${ticket.serialNumber}',
                    style: TextStyle(
                      fontSize: 11,
                      color: AdminTheme.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ],
          const SizedBox(height: 8),
          Text(
            ticket.issueDescription,
            style: TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (ticket.assignedTechnician != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.engineering,
                  size: 14,
                  color: AdminTheme.textSecondary,
                ),
                const SizedBox(width: 6),
                Text(
                  'Technicien: ${ticket.assignedTechnician}',
                  style: TextStyle(fontSize: 11, color: AdminTheme.primary),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  if (ticket.isOpen)
                    IconButton(
                      icon: const Icon(Icons.person_add, size: 18),
                      onPressed: () => _showAssignDialog(ticket),
                      tooltip: 'Assigner technicien',
                      color: AdminTheme.info,
                    ),
                  if (ticket.isInProgress)
                    IconButton(
                      icon: const Icon(Icons.check_circle, size: 18),
                      onPressed: () => _showResolveDialog(ticket),
                      tooltip: 'Résoudre',
                      color: AdminTheme.success,
                    ),
                ],
              ),
              if (ticket.isResolved)
                Text(
                  'Résolu le ${ticket.resolutionDate != null ? DateTime.parse(ticket.resolutionDate!).day : ''}/${ticket.resolutionDate != null ? DateTime.parse(ticket.resolutionDate!).month : ''}',
                  style: TextStyle(fontSize: 10, color: AdminTheme.success),
                ),
            ],
          ),
        ],
      ),
    );
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
              if (controller.text.isNotEmpty) {
                final navigator = Navigator.of(context);
                final messenger = ScaffoldMessenger.of(context);
                try {
                  await ref.read(
                    assignTechnicianProvider({
                      'id': ticket.id,
                      'technician': controller.text,
                    }).future,
                  );
                  navigator.pop();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Technicien assigné avec succès'),
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
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Problème: ${ticket.issueDescription}',
              style: const TextStyle(
                fontSize: 12,
                color: AdminTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Description de la résolution',
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
                    resolveSavTicketProvider({
                      'id': ticket.id,
                      'resolution': controller.text,
                    }).future,
                  );
                  navigator.pop();
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Ticket résolu avec succès'),
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
            child: const Text('Résoudre'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsBar(Map<String, dynamic> stats) {
    final total = (stats['total'] is num ? (stats['total'] as num).toInt() : 0);
    final open = (stats['open'] is num ? (stats['open'] as num).toInt() : 0);
    final inProgress = (stats['in_progress'] is num
        ? (stats['in_progress'] as num).toInt()
        : 0);
    final urgent = (stats['urgent'] is num
        ? (stats['urgent'] as num).toInt()
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
          Expanded(child: _buildStatChip('Ouverts', '$open', AdminTheme.error)),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatChip(
              'En cours',
              '$inProgress',
              AdminTheme.warning,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatChip('Urgents', '$urgent', AdminTheme.error),
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
