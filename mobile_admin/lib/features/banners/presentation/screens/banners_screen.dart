import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/banner_provider.dart';
import '../../data/providers/brand_provider.dart';
import '../../data/models/banner.dart' as banner_model;
import '../../data/models/brand.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: AppBar(
          automaticallyImplyLeading: false,
          title: null,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(kTextTabBarHeight),
            child: TabBar(
              controller: _tabController,
              labelColor: AdminTheme.primary,
              unselectedLabelColor: AdminTheme.textSecondary,
              indicatorColor: AdminTheme.primary,
              tabs: const [
                Tab(icon: Icon(Icons.image_outlined), text: 'Bannières'),
                Tab(
                  icon: Icon(Icons.branding_watermark_outlined),
                  text: 'Marques',
                ),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _BannersTab(),
          _BrandsTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _tabController.index == 0
            ? _addBanner
            : _addBrand,
        backgroundColor: AdminTheme.primary,
        tooltip: _tabController.index == 0
            ? 'Nouvelle bannière'
            : 'Nouvelle marque',
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _addBanner() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: const Text('Nouvelle bannière')),
          body: BannerForm(
            onSave: (savedBanner) => ref.invalidate(bannersProvider),
          ),
        ),
      ),
    );
  }

  void _addBrand() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: const Text('Nouvelle marque')),
          body: BrandForm(
            onSave: (savedBrand) => ref.invalidate(brandsProvider),
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
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bannersAsync = ref.watch(bannersProvider);

    return bannersAsync.when(
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
              onPressed: () => ref.invalidate(bannersProvider),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
      data: (banners) {
        if (banners.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.broken_image,
                    size: 64, color: AdminTheme.textSecondary),
                const SizedBox(height: MaasgaTokens.spacingMd),
                const Text('Aucune bannière'),
                const SizedBox(height: MaasgaTokens.spacingSm),
                ElevatedButton.icon(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => Scaffold(
                        appBar:
                            AppBar(title: const Text('Nouvelle bannière')),
                        body: BannerForm(
                          onSave: (_) => ref.invalidate(bannersProvider),
                        ),
                      ),
                    ),
                  ),
                  icon: const Icon(Icons.add),
                  label: const Text('Ajouter'),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
          itemCount: banners.length,
          itemBuilder: (context, index) {
            final banner = banners[index];
            return Card(
              margin:
                  const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(8)),
                    child: Image.network(
                      banner.imageUrl,
                      height: 120,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          Container(
                        height: 120,
                        color: AdminTheme.background,
                        child: const Center(
                            child: Icon(Icons.broken_image)),
                      ),
                    ),
                  ),
                  Padding(
                    padding:
                        const EdgeInsets.all(MaasgaTokens.spacingMd),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                banner.title,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                            Switch(
                              value: banner.isActive,
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
                                    ScaffoldMessenger.of(context)
                                        .showSnackBar(SnackBar(
                                            content: Text('Erreur: $e')));
                                  }
                                }
                              },
                            ),
                          ],
                        ),
                        if (banner.subtitle != null) ...[
                          const SizedBox(height: 4),
                          Text(banner.subtitle!,
                              style: TextStyle(
                                  color: AdminTheme.textSecondary)),
                        ],
                        const SizedBox(height: MaasgaTokens.spacingSm),
                        Row(
                          children: [
                            Chip(
                              label: Text('Ordre: ${banner.displayOrder}'),
                              backgroundColor: AdminTheme.primary
                                  .withValues(alpha: 0.1),
                            ),
                            if (banner.targetPage != null) ...[
                              const SizedBox(width: 8),
                              Chip(
                                label: Text(banner.targetPage!),
                                backgroundColor: AdminTheme.accent
                                    .withValues(alpha: 0.1),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: MaasgaTokens.spacingSm),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            IconButton(
                              onPressed: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => Scaffold(
                                    appBar: AppBar(
                                        title: Text(
                                            'Modifier: ${banner.title}')),
                                    body: BannerForm(
                                      banner:
                                          banner_model.Banner.fromJson(
                                              banner.toJson()),
                                      onSave: (_) => ref
                                          .invalidate(bannersProvider),
                                    ),
                                  ),
                                ),
                              ),
                              icon: const Icon(Icons.edit),
                              color: AdminTheme.primary,
                            ),
                            IconButton(
                              onPressed: () async {
                                final confirmed =
                                    await showDialog<bool>(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: const Text('Supprimer'),
                                    content: const Text(
                                        'Voulez-vous vraiment supprimer cette bannière ?'),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(
                                            context, false),
                                        child: const Text('Annuler'),
                                      ),
                                      TextButton(
                                        onPressed: () => Navigator.pop(
                                            context, true),
                                        child: const Text('Supprimer'),
                                      ),
                                    ],
                                  ),
                                );
                                if (confirmed == true) {
                                  try {
                                    await ref.read(
                                        deleteBannerProvider(banner.id)
                                            .future);
                                  } catch (e) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(SnackBar(
                                              content:
                                                  Text('Erreur: $e')));
                                    }
                                  }
                                }
                              },
                              icon: const Icon(Icons.delete),
                              color: AdminTheme.error,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

// ══════════════════════════════════════════════════════════════════
// Onglet Marques
// ══════════════════════════════════════════════════════════════════

class _BrandsTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brandsAsync = ref.watch(brandsProvider);

    return brandsAsync.when(
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
              onPressed: () => ref.invalidate(brandsProvider),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
      data: (brands) {
        if (brands.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.branding_watermark_outlined,
                    size: 64, color: AdminTheme.textSecondary),
                const SizedBox(height: MaasgaTokens.spacingMd),
                const Text('Aucune marque'),
                const SizedBox(height: MaasgaTokens.spacingSm),
                ElevatedButton.icon(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => Scaffold(
                        appBar:
                            AppBar(title: const Text('Nouvelle marque')),
                        body: BrandForm(
                          onSave: (_) => ref.invalidate(brandsProvider),
                        ),
                      ),
                    ),
                  ),
                  icon: const Icon(Icons.add),
                  label: const Text('Ajouter'),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
          itemCount: brands.length,
          itemBuilder: (context, index) {
            final brand = brands[index];
            return BrandCard(
              brand: brand,
              onEdit: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => Scaffold(
                    appBar: AppBar(title: Text('Modifier: ${brand.name}')),
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
                    title: const Text('Supprimer la marque'),
                    content: Text(
                        'Voulez-vous vraiment supprimer "${brand.name}" ?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Annuler'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
                        child: const Text(
                          'Supprimer',
                          style: TextStyle(color: AdminTheme.error),
                        ),
                      ),
                    ],
                  ),
                );
                if (confirmed == true) {
                  try {
                    await ref.read(deleteBrandProvider(brand.id).future);
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Erreur: $e')));
                    }
                  }
                }
              },
            );
          },
        );
      },
    );
  }
}
