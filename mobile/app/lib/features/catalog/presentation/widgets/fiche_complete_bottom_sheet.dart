import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/product.dart';

class FicheCompleteBottomSheet extends StatelessWidget {
  const FicheCompleteBottomSheet({super.key, required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
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
            'Fiche Technique Complète',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1A1A1A),
            ),
          ),
          Text(
            product.name,
            style: GoogleFonts.poppins(
              fontSize: 13,
              color: const Color(0xFF757575),
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                children: [
                  _buildSection('Caractéristiques générales', {
                    'Marque': product.brand,
                    'Modèle': product.name,
                    'Type': product.category,
                    'Garantie': '2 ans',
                  }),
                  _buildSection('Performances', {
                    'Puissance BTU': '${product.btu ?? 12000}',
                    'Puissance CV': product.power.toUpperCase(),
                    'Classe énergétique': 'A+++ / A++',
                    'Fluide frigorigène': 'R32',
                  }),
                  _buildSection('Confort & Son', {
                    'Niveau sonore int.': '21 dB(A)',
                    'Niveau sonore ext.': '48 dB(A)',
                    'Modes': 'Froid, Chaud, Déshumidification',
                  }),
                  _buildSection('Connectivité', {
                    'WiFi': 'Intégré',
                    'App Mobile': 'Compatible MAASGA App',
                    'Assistant Vocal': 'Google Home / Alexa',
                  }),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.push('/rdv'); // Go to Devis/Appointment
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1B3A8D),
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              'Demander un devis',
              style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, Map<String, String> items) {
    return Column(
      children: [
        Theme(
          data: ThemeData().copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            tilePadding: EdgeInsets.zero,
            title: Text(
              title,
              style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1A1A1A),
              ),
            ),
            children: items.entries.map((entry) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Text(
                          entry.key,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            color: const Color(0xFF757575),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          entry.value,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF1A1A1A),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Divider(height: 1, color: Color(0xFFF5F5F5)),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
