import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class StepIndicator extends StatelessWidget {
  final int currentStep;

  const StepIndicator({super.key, required this.currentStep});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF0F0F0))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildStep(0, 'Type'),
          _buildConnector(1),
          _buildStep(1, 'Détails'),
          _buildConnector(2),
          _buildStep(2, 'Confirmation'),
        ],
      ),
    );
  }

  Widget _buildStep(int step, String label) {
    final bool isActiveIndex = currentStep == step;
    final bool isPassed = currentStep > step;
    final bool isActive = isActiveIndex || isPassed;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? const Color(0xFF1B3A8D) : const Color(0xFFF0F0F0),
          ),
          alignment: Alignment.center,
          child: Text(
            '${step + 1}',
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isActive ? Colors.white : const Color(0xFF9E9E9E),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 10,
            fontWeight: isActiveIndex ? FontWeight.w600 : FontWeight.w400,
            color: isActiveIndex ? const Color(0xFF1B3A8D) : const Color(0xFF9E9E9E),
          ),
        ),
      ],
    );
  }

  Widget _buildConnector(int nextStep) {
    final bool isPassed = currentStep >= nextStep;
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 14), // Align with circles
        child: Container(
          height: 2,
          color: isPassed ? const Color(0xFF1B3A8D) : const Color(0xFFE0E0E0),
        ),
      ),
    );
  }
}
