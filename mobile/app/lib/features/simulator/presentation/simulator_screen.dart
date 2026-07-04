import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../shared/widgets/main_bottom_nav.dart';
import '../../../shared/widgets/maasga_shell.dart';
import '../../catalog/presentation/catalog_filter_state.dart';
import '../services/btu_calculator.dart';

class SimulatorScreen extends ConsumerStatefulWidget {
  const SimulatorScreen({super.key});

  @override
  ConsumerState<SimulatorScreen> createState() => _SimulatorScreenState();
}

class _SimulatorScreenState extends ConsumerState<SimulatorScreen> {
  final _scrollController = ScrollController();
  final _resultKey = GlobalKey();

  // State
  String? _selectedSurfaceChip;
  final _longueurCtrl = TextEditingController();
  final _largeurCtrl = TextEditingController();
  
  String _selectedHauteur = 'Standard';
  String _selectedFenetres = '1';
  String _selectedExposition = 'Modérée';
  String _selectedTypePiece = 'Chambre';

  bool _showResult = false;
  double _btuExact = 0;
  int _btuArrondi = 0;
  String _cvRecommande = '';
  double _surfaceCalculated = 0;

  @override
  void dispose() {
    _longueurCtrl.dispose();
    _largeurCtrl.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _calculate() {
    double surface = 0;
    if (_longueurCtrl.text.isNotEmpty && _largeurCtrl.text.isNotEmpty) {
      double l = double.tryParse(_longueurCtrl.text) ?? 0;
      double w = double.tryParse(_largeurCtrl.text) ?? 0;
      surface = l * w;
    } else if (_selectedSurfaceChip != null) {
      // Use middle of range
      switch (_selectedSurfaceChip) {
        case '9 - 15 m²': surface = 12; break;
        case '15 - 25 m²': surface = 20; break;
        case '25 - 40 m²': surface = 32.5; break;
        case '40 - 60 m²': surface = 50; break;
      }
    }

    if (surface <= 0) return;

    double heightValue = 2.5;
    if (_selectedHauteur == 'Moyen') heightValue = 2.7;
    if (_selectedHauteur == 'Haut') heightValue = 3.0;
    if (_selectedHauteur == 'Très haut') heightValue = 3.5;

    int windowsCount = int.tryParse(_selectedFenetres.replaceAll('+', '')) ?? 1;

    final btu = BtuCalculator.calculate(
      surface: surface,
      height: heightValue,
      solarExposure: _selectedExposition,
      windows: windowsCount,
      roomType: _selectedTypePiece,
    );

    setState(() {
      _btuExact = btu;
      _btuArrondi = BtuCalculator.getCommercialBtu(btu);
      _cvRecommande = BtuCalculator.getCvRecommendation(btu);
      _surfaceCalculated = surface;
      _showResult = true;
    });

    // Auto-scroll to result
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Scrollable.ensureVisible(
        _resultKey.currentContext!,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaasgaShell(
      title: 'Simulateur BTU & CV',
      showDrawer: false,
      bottomNavigationBar: const MainBottomNav(currentPath: '/simulator'),
      child: Column(
        children: [
          // Header (fixed in MaasgaShell title usually, but let's follow the prompts structure)
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildIntroCard(),
                  
                  _SectionCard(
                    icon: Icons.square_foot_outlined,
                    title: 'Surface de votre pièce ?',
                    child: _buildSurfaceSection(),
                  ),
                  
                  _SectionCard(
                    icon: Icons.height_outlined,
                    title: 'Hauteur du plafond',
                    child: _buildHeightSection(),
                  ),
                  
                  _SectionCard(
                    icon: Icons.window_outlined,
                    title: 'Nombre de fenêtres / ouvertures',
                    child: _buildWindowsSection(),
                  ),
                  
                  _SectionCard(
                    icon: Icons.wb_sunny_outlined,
                    title: 'Exposition solaire de la pièce',
                    child: _buildExpositionSection(),
                  ),
                  
                  _SectionCard(
                    icon: Icons.meeting_room_outlined,
                    title: 'Type de pièce',
                    child: _buildRoomTypeSection(),
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: ElevatedButton.icon(
                      onPressed: _calculate,
                      icon: const Icon(Icons.calculate_outlined, color: Colors.white),
                      label: Text(
                        'Calculer la puissance recommandée',
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15, color: Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1B3A8D),
                        minimumSize: const Size(double.infinity, 54),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),

                  if (_showResult) ...[
                    _buildResultCard(key: _resultKey),
                    const SizedBox(height: 16),
                  ],

                  _buildGuideSection(),
                  
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIntroCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFE8EEFF),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: Color(0xFF1B3A8D), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Outil gratuit · Résultat immédiat',
                  style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1B3A8D)),
                ),
                Text(
                  'Remplissez les champs pour calculer la puissance idéale pour votre pièce.',
                  style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF757575)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSurfaceSection() {
    final chips = [
      {'val': '9 - 15 m²', 'desc': 'Chambre, bureau indiv.'},
      {'val': '15 - 25 m²', 'desc': 'Salon, chambre p.'},
      {'val': '25 - 40 m²', 'desc': 'Grand salon, open space'},
      {'val': '40 - 60 m²', 'desc': 'Commerce, réunion'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Sélection rapide', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF9E9E9E))),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 2.3, // Adjusted for better text fitting
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
          ),
          itemCount: chips.length,
          itemBuilder: (context, index) {
            final chip = chips[index];
            final isSelected = _selectedSurfaceChip == chip['val'];
            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedSurfaceChip = isSelected ? null : chip['val'];
                  _longueurCtrl.clear();
                  _largeurCtrl.clear();
                });
              },
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFE8EEFF) : const Color(0xFFF5F5F5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFFE0E0E0),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      chip['val']!,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFF1A1A1A),
                      ),
                    ),
                    Text(
                      chip['desc']!,
                      style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF757575)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            const Expanded(child: Divider()),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Text('ou saisir manuellement', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF9E9E9E))),
            ),
            const Expanded(child: Divider()),
          ],
        ),
        const SizedBox(height: 12),
        Text('Dimensions exactes', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF9E9E9E))),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildNumberField(_longueurCtrl, 'Longueur (m) *', '4.5'),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildNumberField(_largeurCtrl, 'Largeur (m) *', '3.0'),
            ),
          ],
        ),
        if (_longueurCtrl.text.isNotEmpty && _largeurCtrl.text.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              '→ Surface calculée : ${(double.tryParse(_longueurCtrl.text) ?? 0) * (double.tryParse(_largeurCtrl.text) ?? 0)} m²',
              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF1B3A8D)),
            ),
          ),
      ],
    );
  }

  Widget _buildNumberField(TextEditingController ctrl, String label, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 4),
        TextField(
          controller: ctrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          onChanged: (val) {
             if (val.isNotEmpty) setState(() => _selectedSurfaceChip = null);
          },
          decoration: InputDecoration(
            hintText: hint,
            suffixText: 'm',
            filled: true,
            fillColor: const Color(0xFFF5F5F5),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
          style: GoogleFonts.poppins(fontSize: 13),
        ),
      ],
    );
  }

  Widget _buildHeightSection() {
    final options = [
      {'lbl': 'Standard', 'val': '2,5 m'},
      {'lbl': 'Moyen', 'val': '2,7 m'},
      {'lbl': 'Haut', 'val': '3,0 m'},
      {'lbl': 'Très haut', 'val': '3,5 m+'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: options.map((opt) {
          final isSelected = _selectedHauteur == opt['lbl'];
          return GestureDetector(
            onTap: () => setState(() => _selectedHauteur = opt['lbl']!),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFE8EEFF) : const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFFE0E0E0)),
              ),
              child: Column(
                children: [
                  Text(opt['lbl']!, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFF1A1A1A))),
                  Text(opt['val']!, style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF757575))),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildWindowsSection() {
    final options = ['0', '1', '2', '3+'];
    return Row(
      children: options.map((opt) {
        final isSelected = _selectedFenetres == opt;
        return GestureDetector(
          onTap: () => setState(() => _selectedFenetres = opt),
          child: Container(
            width: 60,
            height: 44,
            alignment: Alignment.center,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFE8EEFF) : const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFFE0E0E0)),
            ),
            child: Text(opt, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFF1A1A1A))),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildExpositionSection() {
    final options = [
      {'val': 'Faible', 'desc': 'Peu de soleil direct, côté nord'},
      {'val': 'Modérée', 'desc': 'Soleil partiel, côté est/ouest'},
      {'val': 'Forte', 'desc': 'Plein soleil, côté sud'},
    ];

    return Column(
      children: options.map((opt) {
        final isSelected = _selectedExposition == opt['val'];
        return GestureDetector(
          onTap: () => setState(() => _selectedExposition = opt['val']!),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFE8EEFF) : const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFFE0E0E0),
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF1B3A8D), width: 1.5),
                  ),
                  child: isSelected 
                      ? Center(child: Container(width: 10, height: 10, decoration: const BoxDecoration(color: Color(0xFF1B3A8D), shape: BoxShape.circle)))
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(opt['val']!, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                      Text(opt['desc']!, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF757575))),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRoomTypeSection() {
    final options = ['Chambre', 'Bureau', 'Salon', 'Cuisine', 'Commerce'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: options.map((opt) {
          final isSelected = _selectedTypePiece == opt;
          return GestureDetector(
            onTap: () => setState(() => _selectedTypePiece = opt),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFE8EEFF) : const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFFE0E0E0)),
              ),
              child: Text(opt, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: isSelected ? const Color(0xFF1B3A8D) : const Color(0xFF1A1A1A))),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildResultCard({Key? key}) {
    final isMulti = _surfaceCalculated > 60 || _btuArrondi > 36000;
    
    return Container(
      key: key,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF43A047), width: 2),
        boxShadow: [
          BoxShadow(color: const Color(0xFF43A047).withValues(alpha: 0.15), blurRadius: 15, offset: const Offset(0, 5)),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(color: Color(0xFFE8F5E9), shape: BoxShape.circle),
                child: const Icon(Icons.check_circle, color: Color(0xFF43A047), size: 22),
              ),
              const SizedBox(width: 10),
              Text('Résultat Recommandé', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600, color: const Color(0xFF43A047))),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            '$_btuArrondi BTU / $_cvRecommande',
            style: GoogleFonts.poppins(fontSize: 26, fontWeight: FontWeight.bold, color: const Color(0xFF1B3A8D)),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.meeting_room_outlined, color: Color(0xFF757575), size: 16),
              const SizedBox(width: 4),
              Text(
                'Adapté pour votre $_selectedTypePiece',
                style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF757575)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: const Color(0xFFF5F5F5), borderRadius: BorderRadius.circular(12)),
            child: Column(
              children: [
                _buildResultDetail('Surface analysée', '${_surfaceCalculated.toStringAsFixed(1)} m²'),
                const Divider(height: 16),
                _buildResultDetail('Majoration Ouagadougou', '+12%'),
                const Divider(height: 16),
                _buildResultDetail('BTU calculé exact', '${_btuExact.round()} BTU'),
              ],
            ),
          ),
          
          if (isMulti)
             Container(
               margin: const EdgeInsets.only(top: 12),
               padding: const EdgeInsets.all(12),
               decoration: BoxDecoration(color: const Color(0xFFFFF3E0), borderRadius: BorderRadius.circular(12)),
               child: Row(
                 children: [
                   const Icon(Icons.info_outline, color: Color(0xFFFB8C00), size: 20),
                   const SizedBox(width: 8),
                   Expanded(
                     child: Text(
                       'Installation multi-unités recommandée pour cette surface.',
                       style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFFFB8C00)),
                     ),
                   ),
                 ],
               ),
             ),
             
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: () {
              final powerKey = BtuCalculator.getPowerKey(_btuExact);
              // Set global filter
              ref.read(catalogFilterProvider.notifier).updateFilters({
                'powers': {powerKey},
                'brands': <String>{},
                'minPrice': 0.0,
                'maxPrice': 2000000.0,
                'category': null,
              });
              context.push('/catalog'); 
            },
            icon: const Icon(Icons.grid_view_outlined, color: Colors.white, size: 20),
            label: Text('Voir les climatiseurs compatibles', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1B3A8D),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () {
              // Navigator.push ServiceScreen avec Devis pré-sélectionné
              context.push('/rdv');
            },
            icon: const Icon(Icons.design_services_outlined, size: 20),
            label: Text('Demander un devis personnalisé', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14, color: const Color(0xFF1B3A8D))),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF1B3A8D)),
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultDetail(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF757575))),
        Text(value, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF1A1A1A))),
      ],
    );
  }

  Widget _buildGuideSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Guide rapide BTU', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10)],
            ),
            child: Column(
              children: [
                _buildGuideItem('9 000 BTU / 1 CV · 9 – 15 m²', 'Chambre, bureau individuel'),
                _buildGuideItem('12 000 BTU / 1.5 CV · 15 – 25 m²', 'Salon, chambre principale'),
                _buildGuideItem('18 000 BTU / 2 CV · 25 – 40 m²', 'Grand salon, open space'),
                _buildGuideItem('24 000 BTU / 3 CV · 35 – 55 m²', 'Grand commerce, restaurant'),
                _buildGuideItem('36 000 BTU / 5 CV · 55 – 80 m²', 'Grande salle, boutique', isLast: true),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: const Color(0xFFFFF8E1), borderRadius: BorderRadius.circular(10)),
            child: Row(
              children: [
                const Icon(Icons.wb_sunny, color: Color(0xFFFB8C00), size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'En climat tropical (Ouagadougou), une majoration de 12% est automatiquement appliquée au calcul.',
                    style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF757575)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuideItem(String title, String subtitle, {bool isLast = false}) {
    return Container(
      padding: const EdgeInsets.all(10),
      margin: EdgeInsets.only(bottom: isLast ? 0 : 8),
      decoration: BoxDecoration(color: const Color(0xFFF8F9FF), borderRadius: BorderRadius.circular(10)),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: const Color(0xFF1B3A8D), borderRadius: BorderRadius.circular(4))),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1B3A8D))),
                Text(subtitle, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF757575))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;

  const _SectionCard({required this.icon, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: const Color(0xFF1B3A8D)),
              const SizedBox(width: 8),
              Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1A1A1A))),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
