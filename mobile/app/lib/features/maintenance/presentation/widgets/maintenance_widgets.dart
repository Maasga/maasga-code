import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─── BENEFIT CARD ─────────────────────────────────────────────────────────────
class BenefitCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const BenefitCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              color: Color(0xFFE8EEFF),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFF1B3A8D), size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1B3A8D),
            ),
          ),
          Text(
            subtitle,
            style: GoogleFonts.poppins(
              fontSize: 11,
              color: const Color(0xFF757575),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── COMPARISON TABLE ───────────────────────────────────────────────────────────
class ComparisonTable extends StatelessWidget {
  const ComparisonTable({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Table(
        border: TableBorder.all(color: const Color(0xFFF0F0F0), width: 1),
        columnWidths: const {
          0: FlexColumnWidth(1.2),
          1: FlexColumnWidth(1),
          2: FlexColumnWidth(1),
          3: FlexColumnWidth(1),
        },
        children: [
          _buildHeaderRow(),
          _buildDataRow('Prix', '30 000 F', '55 000 F', '100 000 F'),
          _buildDataRow('Visites', '3', '6', '12', isAlt: true),
          _buildDataRow('Coût/visite', '10 000 F', '~9 166 F', '~8 333 F'),
          _buildCheckRow('Diag. offert', false, true, true, isAlt: true),
          _buildCheckRow('Recharge gaz', false, false, true),
          _buildDataRow('Réduction', '—', '—', '10%', isAlt: true),
          _buildCheckRow('Support Prio.', false, true, true),
        ],
      ),
    );
  }

  TableRow _buildHeaderRow() {
    return TableRow(
      decoration: const BoxDecoration(color: Color(0xFF1B3A8D)),
      children: ['', 'Trim.', 'Sem.', 'Ann.'].map((text) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: GoogleFonts.poppins(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
        ),
      )).toList(),
    );
  }

  TableRow _buildDataRow(String label, String v1, String v2, String v3, {bool isAlt = false}) {
    return TableRow(
      decoration: BoxDecoration(color: isAlt ? const Color(0xFFF8F9FF) : Colors.white),
      children: [
        _cell(label, isLabel: true),
        _cell(v1),
        _cell(v2, isPrimary: true),
        _cell(v3, isPrimary: true),
      ],
    );
  }

  TableRow _buildCheckRow(String label, bool c1, bool c2, bool c3, {bool isAlt = false}) {
    return TableRow(
      decoration: BoxDecoration(color: isAlt ? const Color(0xFFF8F9FF) : Colors.white),
      children: [
        _cell(label, isLabel: true),
        _checkCell(c1),
        _checkCell(c2),
        _checkCell(c3),
      ],
    );
  }

  Widget _cell(String text, {bool isLabel = false, bool isPrimary = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      child: Text(
        text,
        textAlign: isLabel ? TextAlign.start : TextAlign.center,
        style: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: isLabel ? FontWeight.w500 : FontWeight.w600,
          color: isLabel ? const Color(0xFF1A1A1A) : (text == '—' ? const Color(0xFFD0D0D0) : const Color(0xFF1B3A8D)),
        ),
      ),
    );
  }

  Widget _checkCell(bool checked) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Center(
        child: checked 
          ? const Icon(Icons.check_circle, color: Color(0xFF43A047), size: 16)
          : Text('—', style: GoogleFonts.poppins(color: const Color(0xFFD0D0D0), fontSize: 12)),
      ),
    );
  }
}

// ─── PAYMENT OPTION CARD ───────────────────────────────────────────────────────
class PaymentOptionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const PaymentOptionCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primaryColor = const Color(0xFF1B3A8D);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE8EEFF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? primaryColor : const Color(0xFFE0E0E0),
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(icon, size: 20, color: primaryColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1A1A1A)),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF757575)),
                  ),
                ],
              ),
            ),
            _MaasgaRadio(isSelected: isSelected),
          ],
        ),
      ),
    );
  }
}

class _MaasgaRadio extends StatelessWidget {
  final bool isSelected;
  const _MaasgaRadio({required this.isSelected});

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF1B3A8D);
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: isSelected ? primaryColor : const Color(0xFFD0D0D0),
          width: 2,
        ),
      ),
      child: Center(
        child: isSelected
            ? Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: primaryColor,
                  shape: BoxShape.circle,
                ),
              )
            : null,
      ),
    );
  }
}
