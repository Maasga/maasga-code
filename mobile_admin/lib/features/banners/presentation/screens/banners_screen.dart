import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/banner_provider.dart';
import '../../data/models/banner.dart' as banner_model;
import '../widgets/banner_form.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class BannersScreen extends ConsumerStatefulWidget {
  const BannersScreen({super.key});

  @override
  ConsumerState<BannersScreen> createState() => _BannersScreenState();
}

class _BannersScreenState extends ConsumerState<BannersScreen> {
  @override
  Widget build(BuildContext context) {
    final bannersAsync = ref.watch(bannersProvider);

    return Scaffold(
      body: bannersAsync.when(
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
                  Icon(
                    Icons.broken_image,
                    size: 64,
                    color: AdminTheme.textSecondary,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingMd),
                  const Text('Aucune bannière'),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => Scaffold(
                            appBar: AppBar(
                              title: const Text('Nouvelle bannière'),
                            ),
                            body: BannerForm(
                              onSave: (savedBanner) {
                                ref.invalidate(bannersProvider);
                              },
                            ),
                          ),
                        ),
                      );
                    },
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
                margin: const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Image preview
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(8),
                      ),
                      child: Image.network(
                        banner.imageUrl,
                        height: 120,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            height: 120,
                            color: AdminTheme.background,
                            child: const Center(
                              child: Icon(Icons.broken_image),
                            ),
                          );
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
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
                                  ),
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
                                    if (mounted) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(content: Text('Erreur: $e')),
                                      );
                                    }
                                  }
                                },
                              ),
                            ],
                          ),
                          if (banner.subtitle != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              banner.subtitle!,
                              style: TextStyle(color: AdminTheme.textSecondary),
                            ),
                          ],
                          const SizedBox(height: MaasgaTokens.spacingSm),
                          Row(
                            children: [
                              Chip(
                                label: Text('Ordre: ${banner.displayOrder}'),
                                backgroundColor: AdminTheme.primary.withValues(
                                  alpha: 0.1,
                                ),
                              ),
                              if (banner.targetPage != null) ...[
                                const SizedBox(width: 8),
                                Chip(
                                  label: Text(banner.targetPage!),
                                  backgroundColor: AdminTheme.accent.withValues(
                                    alpha: 0.1,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: MaasgaTokens.spacingSm),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              IconButton(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => Scaffold(
                                        appBar: AppBar(
                                          title: Text(
                                            'Modifier: ${banner.title}',
                                          ),
                                        ),
                                        body: BannerForm(
                                          banner: banner_model.Banner.fromJson(
                                            banner.toJson(),
                                          ),
                                          onSave: (savedBanner) {
                                            ref.invalidate(bannersProvider);
                                          },
                                        ),
                                      ),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.edit),
                                color: AdminTheme.primary,
                              ),
                              IconButton(
                                onPressed: () async {
                                  final confirmed = await showDialog<bool>(
                                    context: context,
                                    builder: (context) => AlertDialog(
                                      title: const Text('Supprimer'),
                                      content: const Text(
                                        'Voulez-vous vraiment supprimer cette bannière ?',
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () =>
                                              Navigator.pop(context, false),
                                          child: const Text('Annuler'),
                                        ),
                                        TextButton(
                                          onPressed: () =>
                                              Navigator.pop(context, true),
                                          child: const Text('Supprimer'),
                                        ),
                                      ],
                                    ),
                                  );

                                  if (confirmed == true) {
                                    try {
                                      await ref.read(
                                        deleteBannerProvider(banner.id).future,
                                      );
                                    } catch (e) {
                                      if (mounted) {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          SnackBar(content: Text('Erreur: $e')),
                                        );
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
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => Scaffold(
                appBar: AppBar(title: const Text('Nouvelle bannière')),
                body: BannerForm(
                  onSave: (savedBanner) {
                    ref.invalidate(bannersProvider);
                  },
                ),
              ),
            ),
          );
        },
        backgroundColor: AdminTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
