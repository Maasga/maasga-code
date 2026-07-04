import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/catalog_repository.dart';
import '../../../../shared/utils/asset_utils.dart';
import '../../domain/product.dart';

class CompareBottomSheet extends ConsumerStatefulWidget {
  const CompareBottomSheet({super.key, required this.currentProduct});

  final Product currentProduct;

  @override
  ConsumerState<CompareBottomSheet> createState() => _CompareBottomSheetState();
}

class _CompareBottomSheetState extends ConsumerState<CompareBottomSheet> {
  Product? _selectedCompareProduct;

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE0E0E0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Comparer les produits',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1A1A1A),
            ),
          ),
          Text(
            'Sélectionnez un produit à comparer',
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: const Color(0xFF757575),
            ),
          ),
          const SizedBox(height: 20),

          // Produit Actuel (fixe)
          _buildCurrentProductCard(),

          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.compare_arrows, color: Color(0xFF1B3A8D), size: 20),
              const SizedBox(width: 8),
              Text(
                'VS',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1B3A8D),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Liste des produits à comparer
          Expanded(
            child: productsAsync.when(
              data: (products) {
                final comparable = products.where((p) => p.id != widget.currentProduct.id).toList();
                return Column(
                  children: [
                    Expanded(
                      child: RadioGroup<int>(
                        groupValue: _selectedCompareProduct?.id,
                        onChanged: (id) {
                          setState(() {
                            _selectedCompareProduct = comparable.firstWhere((p) => p.id == id);
                          });
                        },
                        child: ListView.builder(
                          itemCount: comparable.length,
                          itemBuilder: (context, index) {
                            final product = comparable[index];
                            final isSelected = _selectedCompareProduct?.id == product.id;
                            return _buildCompareItem(product, isSelected);
                          },
                        ),
                      ),
                    ),
                    if (_selectedCompareProduct != null) ...[
                      const SizedBox(height: 16),
                      _buildComparisonTable(),
                    ],
                  ],
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Erreur: $e')),
            ),
          ),

          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1B3A8D),
              minimumSize: const Size(double.infinity, 52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              'Voir les deux produits',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentProductCard() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F4FF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildImageBox(widget.currentProduct.image),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.currentProduct.name,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1B3A8D),
                  ),
                ),
                Text(
                  '${widget.currentProduct.price} FCFA',
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1B3A8D),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF1B3A8D),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'Actuel',
              style: GoogleFonts.poppins(fontSize: 10, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompareItem(Product product, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCompareProduct = product;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF0F4FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFFE0E0E0),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            _buildImageBox(product.image),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1A1A1A),
                    ),
                  ),
                  Text(
                    '${product.price} FCFA',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1B3A8D),
                    ),
                  ),
                ],
              ),
            ),
            Radio<int>(
              value: product.id,
              activeColor: const Color(0xFF1B3A8D),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageBox(String image) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 50,
        height: 50,
        color: const Color(0xFFF5F5F5),
        child: Image.asset(
          AssetUtils.getAssetPath(image),
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => Image.asset('assets/products/product_placeholder.png'),
        ),
      ),
    );
  }

  Widget _buildComparisonTable() {
    if (_selectedCompareProduct == null) return const SizedBox.shrink();

    final specs = [
      {'label': 'Prix', 'p1': '${widget.currentProduct.price}', 'p2': '${_selectedCompareProduct!.price}'},
      {'label': 'BTU', 'p1': '${widget.currentProduct.btu ?? 12000}', 'p2': '${_selectedCompareProduct!.btu ?? 12000}'},
      {'label': 'Classe Ener.', 'p1': 'A+++', 'p2': 'A++'},
      {'label': 'Sonore', 'p1': '21 dB', 'p2': '24 dB'},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Comparaison Rapide',
            style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          Table(
            columnWidths: const {
              0: FlexColumnWidth(1.2),
              1: FlexColumnWidth(1),
              2: FlexColumnWidth(1),
            },
            children: [
              TableRow(
                decoration: const BoxDecoration(color: Color(0xFF1B3A8D)),
                children: [
                  _tableHeader('Spec'),
                  _tableHeader('Actuel'),
                  _tableHeader('Comparé'),
                ],
              ),
              ...specs.map((s) => TableRow(
                children: [
                  _tableCell(s['label']!, isLabel: true),
                  _tableCell(s['p1']!),
                  _tableCell(s['p2']!),
                ],
              )),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tableHeader(String text) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Text(
        text,
        style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _tableCell(String text, {bool isLabel = false}) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Text(
        text,
        style: GoogleFonts.poppins(
          fontSize: 11,
          fontWeight: isLabel ? FontWeight.w500 : FontWeight.w400,
          color: isLabel ? const Color(0xFF757575) : const Color(0xFF1A1A1A),
        ),
        textAlign: isLabel ? TextAlign.start : TextAlign.center,
      ),
    );
  }
}
