import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CategoryChip extends StatelessWidget {
  const CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
    super.key,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        margin: const EdgeInsets.only(right: 10),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF1B3A8D) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: selected
              ? null
              : Border.all(color: const Color(0xFFE0E0E0), width: 1),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 13,
            fontWeight: FontWeight.w500, // Medium
            color: selected ? Colors.white : const Color(0xFF757575),
          ),
        ),
      ),
    );
  }
}
