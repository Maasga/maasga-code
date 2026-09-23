import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/product_provider.dart';
import '../../data/models/product.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import '../widgets/product_card.dart';
import '../widgets/product_filter.dart';
import '../widgets/product_form.dart';

class ProductsScreen extends ConsumerStatefulWidget {
  const ProductsScreen({super.key});

  @override
  ConsumerState<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends ConsumerState<ProductsScreen> {
  String _selectedCategory = 'Tous';
  String? _selectedBrand;
  int? _selectedBtu;
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);

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
                // Barre de recherche
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher un produit...',
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
                // Filtre marque
                DropdownButtonFormField<String>(
                  initialValue: _selectedBrand,
                  decoration: InputDecoration(
                    labelText: 'Marque',
                    border: OutlineInputBorder(),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: null,
                      child: Text('Toutes les marques'),
                    ),
                    DropdownMenuItem(value: 'Nasco', child: Text('Nasco')),
                    DropdownMenuItem(value: 'General', child: Text('General')),
                    DropdownMenuItem(value: 'Daikin', child: Text('Daikin')),
                    DropdownMenuItem(
                      value: 'Mitsubishi',
                      child: Text('Mitsubishi'),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedBrand = value;
                    });
                  },
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                // Filtre catégorie + BTU
                ProductFilter(
                  selectedCategory: _selectedCategory,
                  selectedBrand: _selectedBrand,
                  selectedBtu: _selectedBtu,
                  onCategoryChanged: (category) {
                    setState(() {
                      _selectedCategory = category;
                    });
                  },
                  onBrandChanged: (brand) {
                    setState(() {
                      _selectedBrand = brand;
                    });
                  },
                  onBtuChanged: (btu) {
                    setState(() {
                      _selectedBtu = btu;
                    });
                  },
                ),
              ],
            ),
          ),

          // Liste des produits
          Expanded(
            child: productsAsync.when(
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
                      onPressed: () => ref.invalidate(productsProvider),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
              data: (products) {
                // Filtrer les produits
                List<Product> filteredProducts = products;
                if (_selectedCategory != 'Tous') {
                  filteredProducts = filteredProducts
                      .where((p) => p.category == _selectedCategory)
                      .toList();
                }
                if (_selectedBrand != null) {
                  filteredProducts = filteredProducts
                      .where((p) => p.brand == _selectedBrand)
                      .toList();
                }
                if (_selectedBtu != null) {
                  filteredProducts = filteredProducts
                      .where((p) => p.btu != null && p.btu! <= _selectedBtu!)
                      .toList();
                }
                if (_searchQuery.isNotEmpty) {
                  filteredProducts = filteredProducts
                      .where(
                        (p) =>
                            p.name.toLowerCase().contains(
                              _searchQuery.toLowerCase(),
                            ) ||
                            p.description.toLowerCase().contains(
                              _searchQuery.toLowerCase(),
                            ),
                      )
                      .toList();
                }

                if (filteredProducts.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.inventory_2_outlined,
                          size: 64,
                          color: AdminTheme.textSecondary,
                        ),
                        const SizedBox(height: MaasgaTokens.spacingMd),
                        const Text('Aucun produit trouvé'),
                        const SizedBox(height: MaasgaTokens.spacingSm),
                        ElevatedButton.icon(
                          onPressed: _showAddProductDialog,
                          icon: const Icon(Icons.add),
                          label: const Text('Ajouter un produit'),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                  itemCount: filteredProducts.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(
                        bottom: MaasgaTokens.spacingSm,
                      ),
                      child: ProductCard(
                        product: filteredProducts[index],
                        onEdit: () =>
                            _showEditProductDialog(filteredProducts[index]),
                        onDelete: () =>
                            _showDeleteDialog(filteredProducts[index]),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddProductDialog,
        backgroundColor: AdminTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _showAddProductDialog() {
    showDialog(
      context: context,
      builder: (context) => ProductForm(
        onSubmit: (data) async {
          Navigator.pop(context);
          try {
            await ref.read(createProductProvider(data).future);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Produit "${data["name"]}" ajouté avec succès'),
                  backgroundColor: AdminTheme.success,
                ),
              );
              ref.invalidate(productsProvider);
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Erreur lors de l\'ajout: $e'),
                  backgroundColor: AdminTheme.error,
                ),
              );
            }
          }
        },
      ),
    );
  }

  void _showEditProductDialog(Product product) {
    showDialog(
      context: context,
      builder: (context) => ProductForm(
        product: product,
        onSubmit: (data) async {
          Navigator.pop(context);
          try {
            await ref.read(
              updateProductProvider((id: product.id, data: data)).future,
            );
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Produit "${data["name"]}" modifié avec succès',
                  ),
                  backgroundColor: AdminTheme.success,
                ),
              );
              ref.invalidate(productsProvider);
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Erreur lors de la modification: $e'),
                  backgroundColor: AdminTheme.error,
                ),
              );
            }
          }
        },
      ),
    );
  }

  void _showDeleteDialog(Product product) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer le produit'),
        content: Text('Voulez-vous vraiment supprimer "${product.name}" ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ref.read(deleteProductProvider(product.id).future);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'Produit "${product.name}" supprimé avec succès',
                      ),
                      backgroundColor: AdminTheme.success,
                    ),
                  );
                  ref.invalidate(productsProvider);
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erreur lors de la suppression: $e'),
                      backgroundColor: AdminTheme.error,
                    ),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: AdminTheme.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}
