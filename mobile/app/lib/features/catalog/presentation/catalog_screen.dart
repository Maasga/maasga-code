import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../data/catalog_repository.dart';
import '../../../shared/widgets/main_bottom_nav.dart';
import '../../../shared/widgets/maasga_app_bar.dart';
import '../domain/product.dart';
import '../../cart/presentation/cart_state.dart';
import 'catalog_filter_state.dart';
import 'category_chip.dart';
import 'filter_bottom_sheet.dart';
import 'product_list_card.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key});

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  final List<String> _categories = [
    'Mural/Split',
    'Armoire',
    'Mobile'
  ];
  String _selectedCategory = 'Mural/Split';

  void _openFilterBottomSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FilterBottomSheet(
        onApply: (filters) {
          ref.read(catalogFilterProvider.notifier).updateFilters(filters);
        },
      ),
    );
  }

  void _addToCart(Product product) {
    ref.read(cartProvider.notifier).add(product);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product.name} ajouté au panier').animate().slideX(begin: 1, end: 0),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
        backgroundColor: const Color(0xFF1B3A8D),
        action: SnackBarAction(
          label: 'VOIR',
          textColor: Colors.white,
          onPressed: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
            context.push('/cart');
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);
    final allProducts = productsAsync.asData?.value ?? [];
    final activeFilters = ref.watch(catalogFilterProvider);

    // Filtrage dynamique
    final filteredProducts = allProducts.where((product) {
      if (product.category != _selectedCategory) return false;

      if (activeFilters.isNotEmpty) {
        final powers = activeFilters['powers'] as Set<String>;
        final brands = activeFilters['brands'] as Set<String>;
        final minPrice = activeFilters['minPrice'] as double;
        final maxPrice = activeFilters['maxPrice'] as double;
        final sheetCategory = activeFilters['category'] as String?;

        if (powers.isNotEmpty && !powers.contains(product.power)) return false;
        if (brands.isNotEmpty && !brands.contains(product.brand)) return false;
        if (product.price < minPrice || product.price > maxPrice) return false;
        
        if (sheetCategory != null) {
          final mappedCat = sheetCategory == 'Split / Mural' ? 'Mural/Split' : sheetCategory;
          if (product.category != mappedCat) return false;
        }
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: MaasgaAppBar(
        trailingAction: IconButton(
          onPressed: _openFilterBottomSheet,
          icon: const Icon(Icons.tune, color: Color(0xFF1A1A1A)),
          padding: EdgeInsets.zero,
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // CHIPS CATÉGORIES
            SizedBox(
              height: 52,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final category = _categories[index];
                  final isSelected = category == _selectedCategory;
                  return CategoryChip(
                    label: category,
                    selected: isSelected,
                    onTap: () {
                      setState(() {
                        _selectedCategory = category;
                      });
                    },
                  );
                },
              ).animate().fadeIn(duration: 400.ms),
            ),

            // LISTE PRODUITS
            Expanded(
              child: Skeletonizer(
                enabled: productsAsync.isLoading,
                child: productsAsync.when(
                  loading: () => ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: 5,
                    itemBuilder: (context, index) => ProductListCard(
                      product: Product(id: 0, name: 'Chargement...', brand: 'MAASGA', price: 150000, category: 'Split', image: '', stock: 0),
                      onTap: () {},
                      onAddToCart: () {},
                    ),
                  ),
                  error: (e, st) => Center(child: Text('Erreur: $e')),
                  data: (_) {
                    if (filteredProducts.isEmpty) {
                      return const Center(child: Text('Aucun produit trouvé.'));
                    }
                    return ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: filteredProducts.length,
                      itemBuilder: (context, index) {
                        final product = filteredProducts[index];
                        return ProductListCard(
                          product: product,
                          onTap: () {
                            context.push('/catalog/product', extra: product);
                          },
                          onAddToCart: () => _addToCart(product),
                        ).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1, end: 0);
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const MainBottomNav(currentPath: '/catalog'),
    );
  }
}
