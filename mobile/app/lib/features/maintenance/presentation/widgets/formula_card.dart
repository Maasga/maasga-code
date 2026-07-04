import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FormulaCard extends StatelessWidget {
  final String title;
  final String price;
  final String period;
  final String subtitle;
  final String economy;
  final List<String> inclusions;
  final String target;
  final String? bonusTitle;
  final String? bonusDesc;
  final bool isRecommended;
  final bool isPremium;
  final VoidCallback onSelect;

  const FormulaCard({
    super.key,
    required this.title,
    required this.price,
    required this.period,
    required this.subtitle,
    this.economy = '',
    required this.inclusions,
    required this.target,
    this.bonusTitle,
    this.bonusDesc,
    this.isRecommended = false,
    this.isPremium = false,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final primaryColor = const Color(0xFF1B3A8D);
    final backgroundColor = isPremium ? primaryColor : Colors.white;
    final textColor = isPremium ? Colors.white : const Color(0xFF1A1A1A);
    final secondaryTextColor = isPremium ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF757575);
    final borderColor = isRecommended ? primaryColor : (isPremium ? Colors.transparent : const Color(0xFFE0E0E0));

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor, width: isRecommended ? 2 : 1),
        boxShadow: [
          BoxShadow(
            color: isRecommended ? primaryColor.withValues(alpha: 0.15) : Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          if (isRecommended || isPremium)
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isPremium ? Colors.white.withValues(alpha: 0.2) : primaryColor,
                  borderRadius: const BorderRadius.only(
                    topRight: Radius.circular(20),
                    bottomLeft: Radius.circular(12),
                  ),
                ),
                child: Text(
                  isPremium ? 'MEILLEUR CHOIX' : 'RECOMMANDÉ',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(20),
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
                            title,
                            style: GoogleFonts.poppins(
                              color: isPremium ? Colors.white.withValues(alpha: 0.8) : (isRecommended ? primaryColor : const Color(0xFF757575)),
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                price,
                                style: GoogleFonts.poppins(
                                  color: textColor,
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                ' F CFA',
                                style: GoogleFonts.poppins(
                                  color: secondaryTextColor,
                                  fontSize: 14,
                                  fontWeight: FontWeight.normal,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            subtitle,
                            style: GoogleFonts.poppins(
                              color: isPremium ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF9E9E9E),
                              fontSize: 11,
                            ),
                          ),
                          if (economy.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isPremium ? Colors.white.withValues(alpha: 0.15) : const Color(0xFFE8F5E9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                economy,
                                style: GoogleFonts.poppins(
                                  color: isPremium ? Colors.white : const Color(0xFF43A047),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isPremium ? Colors.white.withValues(alpha: 0.15) : (isRecommended ? const Color(0xFFE8EEFF) : const Color(0xFFF5F5F5)),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isPremium ? Icons.workspace_premium_outlined : (isRecommended ? Icons.calendar_month_outlined : Icons.calendar_view_week_outlined),
                        color: isPremium ? Colors.white : (isRecommended ? primaryColor : const Color(0xFF757575)),
                        size: 22,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Divider(color: isPremium ? Colors.white.withValues(alpha: 0.2) : const Color(0xFFF0F0F0)),
                const SizedBox(height: 12),
                Text(
                  'Ce qui est inclus :',
                  style: GoogleFonts.poppins(
                    color: secondaryTextColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 12),
                ...inclusions.map((item) => _BulletItem(text: item, isPremium: isPremium)),
                const SizedBox(height: 12),
                if (bonusTitle != null && bonusDesc != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isPremium ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFFFF8E1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          bonusTitle!,
                          style: GoogleFonts.poppins(
                            color: isPremium ? const Color(0xFFFFD700) : const Color(0xFFFB8C00),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          bonusDesc!,
                          style: GoogleFonts.poppins(
                            color: isPremium ? Colors.white.withValues(alpha: 0.9) : const Color(0xFF757575),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                if (target.isNotEmpty)
                  Text(
                    target,
                    style: GoogleFonts.poppins(
                      color: isPremium ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF9E9E9E),
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: onSelect,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isPremium ? Colors.white : (isRecommended ? primaryColor : const Color(0xFFF5F5F5)),
                      foregroundColor: isPremium ? primaryColor : (isRecommended ? Colors.white : const Color(0xFF1A1A1A)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: Text(
                      'Choisir cette offre',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
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

class _BulletItem extends StatelessWidget {
  final String text;
  final bool isPremium;

  const _BulletItem({required this.text, required this.isPremium});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.check_circle_outline,
            color: isPremium ? const Color(0xFFFFD700) : const Color(0xFF43A047),
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.poppins(
                color: isPremium ? Colors.white : const Color(0xFF1A1A1A),
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
