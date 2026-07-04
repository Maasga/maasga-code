import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/rendez_vous.dart';

class RdvCard extends StatelessWidget {
  const RdvCard({
    required this.rdv,
    super.key,
  });

  final RendezVous rdv;

  Color _getStatusColor(RdvStatus status) {
    switch (status) {
      case RdvStatus.enAttente: return const Color(0xFFFB8C00);
      case RdvStatus.confirme: return const Color(0xFF43A047);
      case RdvStatus.effectue: return const Color(0xFF1B3A8D);
      case RdvStatus.annule: return const Color(0xFFE53935);
      default: return Colors.grey;
    }
  }

  Color _getStatusBgColor(RdvStatus status) {
    switch (status) {
      case RdvStatus.enAttente: return const Color(0xFFFFF3E0);
      case RdvStatus.confirme: return const Color(0xFFE8F5E9);
      case RdvStatus.effectue: return const Color(0xFFE3F2FD);
      case RdvStatus.annule: return const Color(0xFFFFEBEE);
      default: return Colors.grey.shade100;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Status indicator border
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: Container(
              width: 4,
              color: _getStatusColor(rdv.status),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                const SizedBox(width: 8), // Spacing for the left indicator stripe
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        rdv.type,
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF1A1A1A),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 13, color: Color(0xFF757575)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              rdv.date,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: const Color(0xFF757575),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusBgColor(rdv.status),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    rdv.status.label,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: _getStatusColor(rdv.status),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
