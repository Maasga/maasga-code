import 'dart:convert';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/utils/asset_utils.dart';
import '../../cart/presentation/cart_state.dart';
import '../domain/product.dart';
import 'widgets/compare_bottom_sheet.dart';
import 'widgets/fiche_complete_bottom_sheet.dart';
import 'widgets/spec_card.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.product});

  final Product product;

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _selectedImageIndex = 0;
  bool _isFavorite = false;
  int _quantity = 1;
  final CarouselSliderController _carouselController = CarouselSliderController();

  void _incrementQty() => setState(() => _quantity++);
  void _decrementQty() {
    if (_quantity > 1) setState(() => _quantity--);
  }

  void _toggleFavorite() {
    setState(() => _isFavorite = !_isFavorite);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _addToCart() {
    for (var i = 0; i < _quantity; i++) {
      ref.read(cartProvider.notifier).add(widget.product);
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${widget.product.name} ajouté au panier'),
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

  Widget _buildImageWidget(String imgUrl, BoxFit fit) {
    if (imgUrl.isEmpty || imgUrl == '??') return Image.asset('assets/products/product_placeholder.png', fit: fit);
    if (imgUrl.trim().startsWith('data:image')) {
      try {
        final base64Str = imgUrl.split(',').last;
        return Image.memory(
          base64Decode(base64Str),
          fit: fit,
          errorBuilder: (_, __, ___) => Image.asset('assets/products/product_placeholder.png', fit: fit),
        );
      } catch (e) {
        return Image.asset('assets/products/product_placeholder.png', fit: fit);
      }
    } else if (imgUrl.startsWith('http')) {
      return Image.network(
        imgUrl,
        fit: fit,
        errorBuilder: (_, __, ___) => Image.asset('assets/products/product_placeholder.png', fit: fit),
      );
    } else {
      return Image.asset(
        AssetUtils.getAssetPath(imgUrl),
        fit: fit,
        errorBuilder: (_, __, ___) => Image.asset('assets/products/product_placeholder.png', fit: fit),
      );
    }
  }

  void _showFicheComplete() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FicheCompleteBottomSheet(product: widget.product),
    );
  }

  void _showCompare() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CompareBottomSheet(currentProduct: widget.product),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              _buildAppBar(),
              _buildCarousel(),
              _buildThumbnails(),
              _buildProductInfo(),
              _buildTechnicalBrief(),
              _buildFullSheetButton(),
              const SliverToBoxAdapter(child: SizedBox(height: 120)), // Space for fixed bottom bar
            ],
          ),
          _buildBottomAction(),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      pinned: true,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: _buildCircleButton(
          icon: Icons.arrow_back,
          onTap: () => Navigator.pop(context),
        ),
      ),
      title: Text(
        'Détails du Produit',
        style: GoogleFonts.poppins(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF1A1A1A),
        ),
      ),
      centerTitle: true,
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 16),
          child: _buildCircleButton(
            icon: Icons.compare_arrows_outlined,
            onTap: _showCompare,
          ),
        ),
      ],
    );
  }

  Widget _buildCircleButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Icon(icon, color: const Color(0xFF1A1A1A), size: 20),
      ),
    );
  }

  Widget _buildCarousel() {
    return SliverToBoxAdapter(
      child: Stack(
        children: [
          CarouselSlider(
            items: widget.product.images.map((img) {
              return Container(
                width: double.infinity,
                color: const Color(0xFFF5F5F5),
                child: _buildImageWidget(img, BoxFit.contain),
              );
            }).toList(),
            carouselController: _carouselController,
            options: CarouselOptions(
              height: 300,
              viewportFraction: 1.0,
              enlargeCenterPage: false,
              onPageChanged: (index, _) {
                setState(() => _selectedImageIndex = index);
              },
            ),
          ),
          Positioned(
            bottom: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${_selectedImageIndex + 1}/${widget.product.images.length}',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF1A1A1A),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildThumbnails() {
    return SliverToBoxAdapter(
      child: Container(
        height: 80,
        margin: const EdgeInsets.only(top: 12),
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: widget.product.images.length,
          itemBuilder: (context, index) {
            final isSelected = _selectedImageIndex == index;
            return GestureDetector(
              onTap: () {
                setState(() => _selectedImageIndex = index);
                _carouselController.animateToPage(index);
              },
              child: Container(
                width: 66,
                height: 66,
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFFE0E0E0),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: _buildImageWidget(widget.product.images[index], BoxFit.cover),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildProductInfo() {
    final discount = widget.product.oldPrice != null 
      ? (((widget.product.oldPrice! - widget.product.price) / widget.product.oldPrice!) * 100).round()
      : 0;

    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.product.name,
                        style: GoogleFonts.poppins(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1A1A1A),
                        ),
                      ),
                      Text(
                        'Marque: ${widget.product.brand} · ${widget.product.category}',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: const Color(0xFF757575),
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: _toggleFavorite,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFE0E0E0)),
                    ),
                    child: Icon(
                      _isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: _isFavorite ? const Color(0xFFE53935) : const Color(0xFF9E9E9E),
                      size: 24,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Text(
                  '${widget.product.price} FCFA',
                  style: GoogleFonts.poppins(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1B3A8D),
                  ),
                ),
                if (widget.product.oldPrice != null) ...[
                  const SizedBox(width: 12),
                  Text(
                    '${widget.product.oldPrice} FCFA',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: const Color(0xFF9E9E9E),
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '-$discount%',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF43A047),
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 20),
            const Divider(height: 1, color: Color(0xFFF0F0F0)),
          ],
        ),
      ),
    );
  }

  Widget _buildTechnicalBrief() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'FICHE TECHNIQUE',
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
                color: const Color(0xFF1A1A1A),
              ),
            ),
            const SizedBox(height: 16),
            GridView(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 2.3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              children: const [
                SpecCard(icon: Icons.energy_savings_leaf_outlined, value: 'A+++ / A++', label: 'Classe Énergétique'),
                SpecCard(icon: Icons.volume_down_outlined, value: '21 dB(A)', label: 'Niveau Sonore'),
                SpecCard(icon: Icons.air_outlined, value: 'HEPA H13', label: 'Système Filtration'),
                SpecCard(icon: Icons.wifi_outlined, value: 'Smart Link', label: 'Connectivité App'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFullSheetButton() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: OutlinedButton(
          onPressed: _showFicheComplete,
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Color(0xFF1B3A8D), width: 2),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            minimumSize: const Size(double.infinity, 54),
          ),
          child: Text(
            'DÉCOUVRIR LA FICHE COMPLÈTE',
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
              color: const Color(0xFF1B3A8D),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomAction() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Quantity Selector
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(30),
              ),
              child: Row(
                children: [
                  _buildQtyBtn(icon: Icons.remove, isRemove: true, onTap: _decrementQty),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      '$_quantity',
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  _buildQtyBtn(icon: Icons.add, isRemove: false, onTap: _incrementQty),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _addToCart,
                icon: const Icon(Icons.shopping_cart_outlined, size: 20, color: Colors.white),
                label: Text(
                  'Ajouter au Panier',
                  style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1B3A8D),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  minimumSize: const Size(double.infinity, 54),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQtyBtn({required IconData icon, required bool isRemove, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: isRemove ? Colors.white : const Color(0xFF1B3A8D),
          shape: BoxShape.circle,
          border: isRemove ? Border.all(color: const Color(0xFF1B3A8D), width: 2) : null,
        ),
        child: Icon(icon, size: 18, color: isRemove ? const Color(0xFF1B3A8D) : Colors.white),
      ),
    );
  }
}
