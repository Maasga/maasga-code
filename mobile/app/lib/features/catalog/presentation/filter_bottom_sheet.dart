import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'catalog_filter_state.dart';

class FilterBottomSheet extends ConsumerStatefulWidget {
  const FilterBottomSheet({required this.onApply, super.key});

  final void Function(Map<String, dynamic> filters) onApply;

  @override
  ConsumerState<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends ConsumerState<FilterBottomSheet> {
  final Set<String> _selectedPowers = {};
  final Set<String> _selectedBrands = {};
  double _minPrice = 0;
  double _maxPrice = 2000000; // Increased for FCFA
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    // Initialize from global state
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final filters = ref.read(catalogFilterProvider);
      if (filters.isNotEmpty) {
        setState(() {
          _selectedPowers.addAll(filters['powers'] as Set<String>? ?? {});
          _selectedBrands.addAll(filters['brands'] as Set<String>? ?? {});
          _minPrice = filters['minPrice'] as double? ?? 0;
          _maxPrice = filters['maxPrice'] as double? ?? 2000000;
          _selectedCategory = filters['category'] as String?;
        });
      }
    });
  }

  final List<String> _powerOptions = ['1cv', '1.5cv', '2cv', '3cv', '5cv'];
  final List<String> _brandOptions = [
    'AERO',
    'DAIKIN',
    'PANASONIC',
    'TOSHIBA',
    'MAASGA',
    'MITSUBISHI'
  ];
  final List<String> _categoryOptions = ['Split / Mural', 'Armoire'];

  void _resetAllFilters() {
    setState(() {
      _selectedPowers.clear();
      _selectedBrands.clear();
      _minPrice = 0;
      _maxPrice = 2000000;
      _selectedCategory = null;
    });
  }

  void _applyFilters() {
    widget.onApply({
      'powers': _selectedPowers,
      'brands': _selectedBrands,
      'minPrice': _minPrice,
      'maxPrice': _maxPrice,
      'category': _selectedCategory,
    });
    Navigator.pop(context);
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        title,
        style: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w600, // SemiBold
          color: const Color(0xFF1A1A1A),
        ),
      ),
    );
  }

  Widget _buildChip(
    String label,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1B3A8D) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: isSelected
              ? null
              : Border.all(color: const Color(0xFFE0E0E0), width: 1),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 13,
            fontWeight: FontWeight.w500, // Medium
            color: isSelected ? Colors.white : const Color(0xFF757575),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
      ),
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle Bar
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
            // Title
            Text(
              'Filtres',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600, // SemiBold
                color: const Color(0xFF1A1A1A),
              ),
            ),
            const SizedBox(height: 20),

            // Section 1: Puissance
            _buildSectionTitle('Puissance'),
            Wrap(
              spacing: 10,
              runSpacing: 8,
              children: _powerOptions.map((power) {
                final isSelected = _selectedPowers.contains(power);
                return _buildChip(power, isSelected, () {
                  setState(() {
                    if (isSelected) {
                      _selectedPowers.remove(power);
                    } else {
                      _selectedPowers.add(power);
                    }
                  });
                });
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Section 2: Marques
            _buildSectionTitle('Marques'),
            Wrap(
              spacing: 10,
              runSpacing: 8,
              children: _brandOptions.map((brand) {
                final isSelected = _selectedBrands.contains(brand);
                return _buildChip(brand, isSelected, () {
                  setState(() {
                    if (isSelected) {
                      _selectedBrands.remove(brand);
                    } else {
                      _selectedBrands.add(brand);
                    }
                  });
                });
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Section 3: Prix
            _buildSectionTitle('Prix'),
            RangeSlider(
              min: 0,
              max: 2000000,
              divisions: 100,
              activeColor: const Color(0xFF1B3A8D),
              inactiveColor: const Color(0xFFE0E0E0),
              values: RangeValues(_minPrice, _maxPrice),
              labels: RangeLabels(
                '${_minPrice.toInt()} FCFA',
                '${_maxPrice.toInt()} FCFA',
              ),
              onChanged: (values) {
                setState(() {
                  _minPrice = values.start;
                  _maxPrice = values.end;
                });
              },
            ),
            Row(
              children: [
                Text(
                  '${_minPrice.toInt()} FCFA',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w400, // Regular
                    color: const Color(0xFF757575),
                  ),
                ),
                const Spacer(),
                Text(
                  '${_maxPrice.toInt()} FCFA',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w400, // Regular
                    color: const Color(0xFF757575),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Section 4: Catégorie
            _buildSectionTitle('Catégorie'),
            Wrap(
              spacing: 10,
              runSpacing: 8,
              children: _categoryOptions.map((category) {
                final isSelected = _selectedCategory == category;
                return _buildChip(category, isSelected, () {
                  setState(() {
                    if (isSelected) {
                      _selectedCategory = null;
                    } else {
                      _selectedCategory = category;
                    }
                  });
                });
              }).toList(),
            ),
            const SizedBox(height: 24),

            // Boutons Bas
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _resetAllFilters,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF1B3A8D)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(
                      'Réinitialiser',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w500, // Medium
                        color: const Color(0xFF1B3A8D),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _applyFilters,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1B3A8D),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(
                      'Appliquer',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600, // SemiBold
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8), // Padding bottom for safe area
          ],
        ),
      ),
    );
  }
}
