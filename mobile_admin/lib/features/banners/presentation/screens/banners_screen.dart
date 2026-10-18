import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/providers/banner_provider.dart';
import '../../data/providers/brand_provider.dart';
import '../../data/models/banner.dart' as banner_model;
import '../widgets/banner_form.dart';
import '../widgets/brand_card.dart';
import '../widgets/brand_form.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class BannersScreen extends ConsumerStatefulWidget {
  const BannersScreen({super.key});

  @override
  ConsumerState<BannersScreen> createState() => _BannersScreenState();
}

class _BannersScreenState extends ConsumerState<BannersScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _addBanner() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('Nouvelle bannière carrousel'),
            backgroundColor: AdminTheme.surface,
          ),
          body: BannerForm(onSave: (_) => ref.invalidate(bannersProvider)),
        ),
      ),
    );
  }

  void _addBrand() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('Nouvelle marque partenaire'),
            backgroundColor: AdminTheme.surface,
          ),
          body: BrandForm(onSave: (_) => ref.invalidate(brandsProvider)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AdminTheme.background,
      body: Column(
        children: [
          // ── Onglets Segmentés Modernes (Bannières / Marques) ──
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: AdminTheme.primary,
                  boxShadow: [
                    BoxShadow(
                      color: AdminTheme.primary.withValues(alpha: 0.25),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: Colors.white,
                unselectedLabelColor: AdminTheme.textSecondary,
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
                unselectedLabelStyle: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
                tabs: const [
                  Tab(
                    icon: Icon(Icons.view_carousel_outlined, size: 18),
                    text: 'Bannières carrousel',
                  ),
                  Tab(
                    icon: Icon(Icons.branding_watermark_outlined, size: 18),
                    text: 'Marques partenaires',
                  ),
                ],
              ),
            ),
          ),

          // ── Contenu des onglets ──
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _BannersTab(onAdd: _addBanner),
                _BrandsTab(onAdd: _addBrand),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _tabController.index == 0 ? _addBanner : _addBrand,
        backgroundColor: AdminTheme.primary,
        icon: const Icon(
          Icons.add_photo_alternate_outlined,
          color: Colors.white,
        ),
        label: Text(
          _tabController.index == 0
              ? 'Ajouter une bannière'
              : 'Ajouter une marque',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Onglet Bannières
// ══════════════════════════════════════════════════════════════════

class _BannersTab extends ConsumerWidget {
  final VoidCallback onAdd;

  const _BannersTab({required this.onAdd});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bannersAsync = ref.watch(bannersProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(bannersProvider),
      child: bannersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 48,
                  color: AdminTheme.error,
                ),
                const SizedBox(height: 12),
                Text(
                  error.toString().replaceAll('Exception: ', ''),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => ref.invalidate(bannersProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Réessayer'),
                ),
              ],
            ),
          ),
        ),
        data: (banners) {
          return ListView(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            children: [
              // ── Header d'explication et raccourcis ──
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.blue.shade100),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AdminTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.photo_size_select_actual_outlined,
                        color: AdminTheme.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Carrousel d\'accueil (${banners.length} bannière${banners.length > 1 ? 's' : ''})',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Uploadez des photos depuis votre mobile pour le site web et l\'app.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AdminTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.collections_outlined,
                        color: AdminTheme.primary,
                      ),
                      tooltip: 'Médiathèque de groupe',
                      onPressed: () => context.push('/mediatheque'),
                    ),
                  ],
                ),
              ),

              if (banners.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.image_not_supported_outlined,
                          size: 64,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Aucune bannière configurée',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Ajoutez une première bannière avec votre photo.',
                          style: TextStyle(
                            color: AdminTheme.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: onAdd,
                          icon: const Icon(Icons.add, color: Colors.white),
                          label: const Text(
                            'Créer une bannière',
                            style: TextStyle(color: Colors.white),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AdminTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...banners.map(
                  (banner) => _buildBannerCard(context, ref, banner),
                ),

              const SizedBox(height: 60),
            ],
          );
        },
      ),
    );
  }

  Widget _buildBannerCard(
    BuildContext context,
    WidgetRef ref,
    banner_model.Banner banner,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Image avec badge statut ──
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(13),
                ),
                child: banner.imageUrl.isNotEmpty
                    ? Image.network(
                        banner.imageUrl,
                        height: 140,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          height: 140,
                          color: AdminTheme.background,
                          child: const Center(
                            child: Icon(
                              Icons.broken_image,
                              size: 40,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                      )
                    : Container(
                        height: 140,
                        color: AdminTheme.background,
                        child: const Center(
                          child: Icon(
                            Icons.image,
                            size: 40,
                            color: Colors.grey,
                          ),
                        ),
                      ),
              ),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: banner.isActive
                        ? Colors.green.shade600
                        : Colors.grey.shade700,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        banner.isActive
                            ? Icons.check_circle
                            : Icons.visibility_off,
                        color: Colors.white,
                        size: 12,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        banner.isActive ? 'Actif' : 'Masqué',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Ordre: ${banner.displayOrder}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),

          // ── Détails & Actions ──
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        banner.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    Switch(
                      value: banner.isActive,
                      activeThumbColor: AdminTheme.primary,
                      onChanged: (value) async {
                        try {
                          await ref.read(
                            toggleBannerProvider((
                              id: banner.id,
                              isActive: value,
                            )).future,
                          );
                        } catch (e) {
                          if (context.mounted) {
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
                  ],
                ),
                if (banner.subtitle != null && banner.subtitle!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    banner.subtitle!,
                    style: const TextStyle(
                      color: AdminTheme.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (banner.targetPage != null &&
                        banner.targetPage!.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AdminTheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AdminTheme.primary.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.link,
                              size: 12,
                              color: AdminTheme.primary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              banner.targetPage!,
                              style: const TextStyle(
                                fontSize: 11,
                                color: AdminTheme.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    const Spacer(),
                    // Bouton Modifier
                    IconButton(
                      icon: const Icon(
                        Icons.edit_outlined,
                        size: 20,
                        color: AdminTheme.primary,
                      ),
                      tooltip: 'Modifier',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => Scaffold(
                              appBar: AppBar(
                                title: const Text('Modifier la bannière'),
                                backgroundColor: AdminTheme.surface,
                              ),
                              body: BannerForm(
                                banner: banner,
                                onSave: (_) => ref.invalidate(bannersProvider),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    // Bouton Supprimer
                    IconButton(
                      icon: const Icon(
                        Icons.delete_outline,
                        size: 20,
                        color: AdminTheme.error,
                      ),
                      tooltip: 'Supprimer',
                      onPressed: () async {
                        final confirmed = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Supprimer la bannière ?'),
                            content: Text(
                              'Voulez-vous supprimer "${banner.title}" ?',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Annuler'),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AdminTheme.error,
                                ),
                                onPressed: () => Navigator.pop(context, true),
                                child: const Text(
                                  'Supprimer',
                                  style: TextStyle(color: Colors.white),
                                ),
                              ),
                            ],
                          ),
                        );
                        if (confirmed == true) {
                          try {
                            await ref.read(
                              deleteBannerProvider(banner.id).future,
                            );
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Bannière supprimée'),
                                  backgroundColor: AdminTheme.success,
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Erreur: $e'),
                                  backgroundColor: AdminTheme.error,
                                ),
                              );
                            }
                          }
                        }
                      },
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
}

// ══════════════════════════════════════════════════════════════════
// Onglet Marques
// ══════════════════════════════════════════════════════════════════

class _BrandsTab extends ConsumerWidget {
  final VoidCallback onAdd;

  const _BrandsTab({required this.onAdd});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brandsAsync = ref.watch(brandsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(brandsProvider),
      child: brandsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 48,
                  color: AdminTheme.error,
                ),
                const SizedBox(height: 12),
                Text(
                  error.toString().replaceAll('Exception: ', ''),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => ref.invalidate(brandsProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Réessayer'),
                ),
              ],
            ),
          ),
        ),
        data: (brands) {
          return ListView(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            children: [
              // ── Header d'explication ──
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.purple.shade100),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.purple.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.branding_watermark_outlined,
                        color: Colors.purple,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Marques partenaires (${brands.length})',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Ajoutez les logos des marques (DAIKIN, LG, etc.) affichées sur l\'accueil.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AdminTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.photo_library_outlined,
                        color: Colors.purple,
                      ),
                      tooltip: 'Médiathèque groupée par marque',
                      onPressed: () => context.push('/mediatheque'),
                    ),
                  ],
                ),
              ),

              if (brands.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.branding_watermark_outlined,
                          size: 64,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Aucune marque partenaire',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Ajoutez les marques officielles pour les afficher sur le site.',
                          style: TextStyle(
                            color: AdminTheme.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: onAdd,
                          icon: const Icon(Icons.add, color: Colors.white),
                          label: const Text(
                            'Ajouter une marque',
                            style: TextStyle(color: Colors.white),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AdminTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...brands.map(
                  (brand) => BrandCard(
                    brand: brand,
                    onEdit: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => Scaffold(
                          appBar: AppBar(
                            title: Text('Modifier: ${brand.name}'),
                            backgroundColor: AdminTheme.surface,
                          ),
                          body: BrandForm(
                            brand: brand,
                            onSave: (_) => ref.invalidate(brandsProvider),
                          ),
                        ),
                      ),
                    ),
                    onDelete: () async {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Supprimer la marque ?'),
                          content: Text(
                            'Voulez-vous supprimer la marque "${brand.name}" ?',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: const Text('Annuler'),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AdminTheme.error,
                              ),
                              onPressed: () => Navigator.pop(context, true),
                              child: const Text(
                                'Supprimer',
                                style: TextStyle(color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      );
                      if (confirmed == true) {
                        try {
                          await ref.read(deleteBrandProvider(brand.id).future);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Marque supprimée'),
                                backgroundColor: AdminTheme.success,
                              ),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Erreur: $e'),
                                backgroundColor: AdminTheme.error,
                              ),
                            );
                          }
                        }
                      }
                    },
                  ),
                ),

              const SizedBox(height: 60),
            ],
          );
        },
      ),
    );
  }
}
