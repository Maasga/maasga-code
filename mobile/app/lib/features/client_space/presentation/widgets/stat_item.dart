import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class StatItem extends StatelessWidget {
  const StatItem({
    required this.icon,
    required this.count,
    required this.label,
    super.key,
  });

  final IconData icon;
  final String count;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(icon, size: 24, color: const Color(0xFF1B3A8D)),
        const SizedBox(height: 4),
        Text(
          count,
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF1B3A8D),
          ),
        ),
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 11,
            fontWeight: FontWeight.w400,
            color: const Color(0xFF757575),
          ),
        ),
      ],
    );
  }
}
