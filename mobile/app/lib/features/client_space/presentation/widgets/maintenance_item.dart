import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MaintenanceItem extends StatelessWidget {
  const MaintenanceItem({
    required this.date,
    required this.technicianName,
    required this.isCompleted,
    super.key,
  });

  final String date;
  final String technicianName;
  final bool isCompleted;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            isCompleted ? Icons.check_circle : Icons.pending_outlined,
            size: 20,
            color: isCompleted ? const Color(0xFF43A047) : const Color(0xFFFB8C00),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  date,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF1A1A1A),
                  ),
                ),
                Text(
                  'Tech: $technicianName',
                  style: GoogleFonts.poppins(
                    fontSize: 11,
                    color: const Color(0xFF757575),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isCompleted ? const Color(0xFFE8F5E9) : const Color(0xFFFFF3E0),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              isCompleted ? 'Effectuée' : 'À venir',
              style: GoogleFonts.poppins(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: isCompleted ? const Color(0xFF43A047) : const Color(0xFFFB8C00),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
