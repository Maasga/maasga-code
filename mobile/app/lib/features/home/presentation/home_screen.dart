import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../catalog/data/catalog_repository.dart';
import '../../catalog/domain/product.dart';
import '../widgets/brand_scroll.dart';
import '../../../shared/widgets/main_bottom_nav.dart';
import '../../../shared/widgets/maasga_app_bar.dart';
import '../../../shared/utils/asset_utils.dart';
import '../widgets/promo_banner.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {

  final int _notificationsCount = 3;

  final List<String> _brandAssets = const <String>[
    'assets/brands/daikin.png',
    'assets/brands/mitsubishi.png',
    'assets/brands/panasonic.png',
    'assets/brands/toshiba.png',
    'assets/brands/aero.png',
  ];


  String _formatPrice(int price) {
    final f = NumberFormat.currency(locale: 'fr_FR', symbol: 'FCFA', decimalDigits: 0);
    return f.format(price);
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: MaasgaAppBar(notificationsCount: _notificationsCount),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SearchBar().animate().fadeIn(duration: 400.ms).slideY(begin: -0.2, end: 0),
            _LocationRow().animate().fadeIn(delay: 100.ms),
            BrandScroll(brandAssetPaths: _brandAssets).animate().fadeIn(delay: 200.ms),
            const PromoBanner().animate().fadeIn(delay: 300.ms).scale(begin: const Offset(0.95, 0.95)),
            _InnovationsSection(
              productsAsync: productsAsync,
              formatPrice: _formatPrice,
            ),
            const SizedBox(height: 18),
          ],
        ),
      ),
      bottomNavigationBar: const MainBottomNav(currentPath: '/home'),
    );
  }
}

// ─── Search Bar ────────────────────────────────────────────────────────────────
class _SearchBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const textColor = Color(0xFF9E9E9E);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: const Color(0xFFE0E0E0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(25),
        onTap: () => context.go('/catalog'),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          child: Row(
            children: [
              const Icon(Icons.search, color: textColor, size: 20),
              const SizedBox(width: 10),
              Text(
                'Rechercher votre climatiseur...',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: textColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Location Row ──────────────────────────────────────────────────────────────
class _LocationRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      child: Row(
        children: [
          const Icon(Icons.location_on, color: Color(0xFFFF6F00), size: 18),
          const SizedBox(width: 8),
          Text(
            'Ouagadougou, Burkina Faso',
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF1A1A1A),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Innovations Section (uses real API data) ──────────────────────────────────
class _InnovationsSection extends StatelessWidget {
  const _InnovationsSection({
    required this.productsAsync,
    required this.formatPrice,
  });

  final AsyncValue<List<Product>> productsAsync;
  final String Function(int price) formatPrice;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          Row(
            children: [
              Text(
                'Dernières Innovations',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF1A1A1A),
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => context.go('/catalog'),
                child: Text(
                  'Voir tout',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF1B3A8D),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Skeletonizer(
            enabled: productsAsync.isLoading,
            child: productsAsync.when(
              loading: () => GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: 6,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.78,
                ),
                itemBuilder: (context, index) => _ProductCard(
                  product: Product(id: 0, name: 'Chargement...', brand: 'MAASGA', price: 150000, category: 'Split', image: '', stock: 0),
                  priceLabel: '150 000 F',
                ),
              ),
              error: (_, __) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    'Impossible de charger les produits.',
                    style: GoogleFonts.poppins(color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              data: (products) {
                final displayed = products.take(6).toList();
                if (displayed.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text('Aucun produit disponible.', style: GoogleFonts.poppins(color: Colors.grey)),
                    ),
                  );
                }
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: displayed.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.78,
                  ),
                  itemBuilder: (context, index) {
                    final p = displayed[index];
                    return _ProductCard(
                      product: p,
                      priceLabel: formatPrice(p.price),
                    ).animate().fadeIn(delay: (index * 100).ms).slideY(begin: 0.1, end: 0);
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 4),
        ],
      ),
    );
  }
}

// ─── Product Card (uses real Product model) ────────────────────────────────────
class _ProductCard extends StatelessWidget {
  const _ProductCard({
    required this.product,
    required this.priceLabel,
  });

  final Product product;
  final String priceLabel;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('/catalog'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.07),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: Container(
                    width: double.infinity,
                    height: 130,
                    color: const Color(0xFFF5F5F5),
                    alignment: Alignment.center,
                    child: product.imageUrl != null && 
                           product.imageUrl!.isNotEmpty && 
                           !AssetUtils.getAssetPath(product.imageUrl!).contains('logo_maasga')
                        ? CachedNetworkImage(
                            imageUrl: product.imageUrl!,
                            width: 110,
                            height: 110,
                            fit: BoxFit.contain,
                            placeholder: (context, url) => const Center(
                              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                            ),
                            errorWidget: (context, url, error) => Image.asset(
                              'assets/products/product_placeholder.png',
                              width: 80,
                              height: 80,
                            ),
                          )
                        : Image.asset(
                            AssetUtils.getAssetPath(product.image.isNotEmpty
                                ? product.image
                                : (product.imageUrl ?? 'assets/products/product_placeholder.png')),
                            width: 110,
                            height: 110,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => Image.asset(
                              'assets/products/product_placeholder.png',
                              width: 80,
                              height: 80,
                            ),
                          ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.brand,
                    style: GoogleFonts.poppins(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF9E9E9E),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    product.name,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF1A1A1A),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    priceLabel,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1B3A8D),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
