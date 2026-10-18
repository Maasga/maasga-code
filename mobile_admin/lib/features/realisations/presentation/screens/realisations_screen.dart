import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/realisation_provider.dart';
import '../../data/models/realisation.dart';
import '../widgets/realisation_form.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class RealisationsScreen extends ConsumerStatefulWidget {
  const RealisationsScreen({super.key});

  @override
  ConsumerState<RealisationsScreen> createState() => _RealisationsScreenState();
}

class _RealisationsScreenState extends ConsumerState<RealisationsScreen> {
  String _categoryFilter = 'all';
  String _statusFilter = 'all';

  final List<String> _categoryFilters = [
    'all',
    'residential',
    'commercial',
    'industrial',
    'maintenance',
  ];

  final List<String> _statusFilters = ['all', 'published', 'draft'];

  void _refreshRealisations() {
    ref.invalidate(realisationsProvider);
    ref.invalidate(realisationsStatsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final realisationsAsync = ref.watch(realisationsProvider);
    final statsAsync = ref.watch(realisationsStatsProvider);

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: const Text(
          'Galerie Réalisations',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AdminTheme.primary),
            tooltip: 'Actualiser',
            onPressed: _refreshRealisations,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(160),
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
              // Category filter chips
              SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: MaasgaTokens.spacingMd,
                  ),
                  itemCount: _categoryFilters.length,
                  itemBuilder: (context, index) {
                    final filter = _categoryFilters[index];
                    final isSelected = _categoryFilter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(
                        right: MaasgaTokens.spacingSm,
                      ),
                      child: FilterChip(
                        label: Text(
                          filter == 'all'
                              ? 'Toutes'
                              : filter == 'residential'
                              ? 'Résidentiel'
                              : filter == 'commercial'
                              ? 'Commercial'
                              : filter == 'industrial'
                              ? 'Industriel'
                              : 'Maintenance',
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            _categoryFilter = selected ? filter : 'all';
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
                              ? 'Tous statuts'
                              : filter == 'published'
                              ? 'Publiés'
                              : 'Brouillons',
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
      body: realisationsAsync.when(
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
                onPressed: _refreshRealisations,
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (realisations) {
          var filteredRealisations = realisations;

          // Apply category filter
          if (_categoryFilter != 'all') {
            filteredRealisations = filteredRealisations
                .where((r) => r.category == _categoryFilter)
                .toList();
          }

          // Apply status filter
          if (_statusFilter != 'all') {
            filteredRealisations = filteredRealisations
                .where((r) => r.status == _statusFilter)
                .toList();
          }

          if (filteredRealisations.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.photo_library_outlined,
                    size: 64,
                    color: AdminTheme.textSecondary,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingMd),
                  const Text('Aucune réalisation trouvée'),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _refreshRealisations(),
            child: GridView.builder(
              padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.8,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: filteredRealisations.length,
              itemBuilder: (context, index) {
                return _buildRealisationCard(filteredRealisations[index]);
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
              child: const RealisationForm(),
            ),
          );
        },
        backgroundColor: AdminTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildRealisationCard(Realisation realisation) {
    return Container(
      decoration: realisation.isFeatured
          ? AdminTheme.cardDecoration.copyWith(
              border: Border.all(color: AdminTheme.warning, width: 2),
            )
          : AdminTheme.cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          Expanded(
            child: Stack(
              children: [
                if (realisation.images.isNotEmpty)
                  Image.network(
                    realisation.images.first,
                    fit: BoxFit.cover,
                    width: double.infinity,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: AdminTheme.background,
                      child: const Center(
                        child: Icon(
                          Icons.broken_image,
                          size: 32,
                          color: AdminTheme.textSecondary,
                        ),
                      ),
                    ),
                  )
                else
                  Container(
                    color: AdminTheme.background,
                    child: const Center(
                      child: Icon(
                        Icons.photo_library,
                        size: 32,
                        color: AdminTheme.textSecondary,
                      ),
                    ),
                  ),
                if (realisation.isFeatured)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AdminTheme.warning,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.star, size: 12, color: Colors.white),
                          SizedBox(width: 4),
                          Text(
                            'En avant',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                Positioned(
                  bottom: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      realisation.statusLabel,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(MaasgaTokens.spacingSm),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  realisation.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                if (realisation.category != null)
                  Text(
                    realisation.category!.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      color: AdminTheme.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                const SizedBox(height: 4),
                if (realisation.location != null)
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 12,
                        color: AdminTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          realisation.location!,
                          style: TextStyle(
                            fontSize: 10,
                            color: AdminTheme.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.photo_library,
                      size: 12,
                      color: AdminTheme.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${realisation.images.length} image(s)',
                      style: TextStyle(
                        fontSize: 10,
                        color: AdminTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      realisation.formattedDate,
                      style: TextStyle(
                        fontSize: 9,
                        color: AdminTheme.textDisabled,
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.star_border, size: 16),
                          onPressed: () => _toggleFeatured(
                            realisation.id,
                            !realisation.featured,
                          ),
                          color: realisation.isFeatured
                              ? AdminTheme.warning
                              : AdminTheme.textSecondary,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        IconButton(
                          icon: const Icon(Icons.edit, size: 16),
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (context) => Padding(
                                padding: EdgeInsets.only(
                                  bottom: MediaQuery.of(
                                    context,
                                  ).viewInsets.bottom,
                                ),
                                child: RealisationForm(
                                  realisation: realisation,
                                ),
                              ),
                            );
                          },
                          color: AdminTheme.info,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 16),
                          onPressed: () => _deleteRealisation(realisation.id),
                          color: AdminTheme.error,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _toggleFeatured(int id, bool featured) async {
    try {
      await ref.read(
        toggleFeaturedProvider({'id': id, 'featured': featured}).future,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              featured ? 'Mis en avant' : 'Retiré de la mise en avant',
            ),
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

  void _deleteRealisation(int id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer cette réalisation?'),
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
                await ref.read(deleteRealisationProvider(id).future);
                navigator.pop();
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Réalisation supprimée'),
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
    final published = (stats['published'] is num
        ? (stats['published'] as num).toInt()
        : 0);
    final featured = (stats['featured'] is num
        ? (stats['featured'] as num).toInt()
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
            child: _buildStatChip('Publiés', '$published', AdminTheme.success),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatChip('En avant', '$featured', AdminTheme.warning),
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
