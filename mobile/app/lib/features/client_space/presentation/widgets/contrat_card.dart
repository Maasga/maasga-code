import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/contrat_maintenance.dart';

class ContratCard extends StatelessWidget {
  const ContratCard({
    required this.contrat,
    this.onViewInvoice,
    super.key,
  });

  final ContratMaintenance contrat;
  final VoidCallback? onViewInvoice;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF0F0F0)),
      ),
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
                      contrat.type,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1A1A1A),
                      ),
                    ),
                    Text(
                      contrat.period,
                      style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF757575)),
                    ),
                    Text(
                      contrat.quartier,
                      style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF757575)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      contrat.price,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1B3A8D),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  contrat.status,
                  style: GoogleFonts.poppins(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF43A047),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress visits
          Row(
            children: [
              Text(
                'Visites : ${contrat.visitesEffectuees}/${contrat.visitesTotales}',
                style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: contrat.visitesTotales > 0 ? contrat.visitesEffectuees / contrat.visitesTotales : 0,
              backgroundColor: const Color(0xFFF0F0F0),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1B3A8D)),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: onViewInvoice,
            icon: const Icon(Icons.picture_as_pdf, size: 16),
            label: Text('Facture PDF', style: GoogleFonts.poppins(fontSize: 11)),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF1B3A8D),
              side: const BorderSide(color: Color(0xFF1B3A8D)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
          if (contrat.visites.isNotEmpty) ...[
            const Divider(height: 24, color: Color(0xFFF0F0F0)),
            Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                dense: true,
                title: Text(
                  'VISITES EFFECTUÉES (${contrat.visitesEffectuees})',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1B3A8D),
                  ),
                ),
                children: contrat.visites.map((v) => _VisiteItem(visite: v)).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _VisiteItem extends StatelessWidget {
  const _VisiteItem({required this.visite});
  final VisiteContrat visite;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            visite.isCompleted ? Icons.check_circle : Icons.pending_outlined,
            size: 16,
            color: visite.isCompleted ? const Color(0xFF43A047) : const Color(0xFFFB8C00),
          ),
          const SizedBox(width: 8),
          Text(
            visite.date,
            style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF1A1A1A)),
          ),
          const Spacer(),
          Text(
            'Tech: ${visite.technicianName}',
            style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF757575)),
          ),
          const SizedBox(width: 8),
          if (visite.isCompleted)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'Effectuée',
                style: GoogleFonts.poppins(fontSize: 9, color: const Color(0xFF43A047), fontWeight: FontWeight.w600),
              ),
            ),
        ],
      ),
    );
  }
}
