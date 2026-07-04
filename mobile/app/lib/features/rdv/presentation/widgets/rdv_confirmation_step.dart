import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../domain/rdv_request.dart';
import 'package:intl/intl.dart';

class RdvConfirmationStep extends StatelessWidget {
  final RdvRequest request;
  final VoidCallback onGoToMyRdv;

  const RdvConfirmationStep({
    super.key,
    required this.request,
    required this.onGoToMyRdv,
  });

  Future<void> _launchWhatsApp() async {
    final phone = '22655996418';
    final message = 'Bonjour MAASGA, je viens d\'envoyer une demande de rendez-vous pour : ${request.serviceType}.';
    final url = Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(message)}');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEEE d MMMM yyyy', 'fr_FR');
    final dateStr = dateFormat.format(request.date);
    final timeStr = request.startTime != null && request.endTime != null
        ? '${request.startTime!.format(context)} - ${request.endTime!.format(context)}'
        : 'À confirmer';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFE8F5E9),
            ),
            child: const Icon(
              Icons.check_circle_outline,
              color: Color(0xFF43A047),
              size: 48,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Demande envoyée !',
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Nous vous rappelons sous 2h pour valider votre créneau.',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: const Color(0xFF757575),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE1F1FF)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildRecapRow('Service', request.serviceType),
                _buildRecapRow('Nom', request.fullName),
                _buildRecapRow('Téléphone', request.phone),
                _buildRecapRow('Quartier', request.quartier),
                _buildRecapRow('Date', dateStr),
                _buildRecapRow('Horaire', timeStr, isLast: true),
              ],
            ),
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _launchWhatsApp,
                  icon: const Icon(Icons.chat, color: Color(0xFF43A047)),
                  label: Text(
                    'WhatsApp',
                    style: GoogleFonts.poppins(color: const Color(0xFF43A047)),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF43A047)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: onGoToMyRdv,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B3A8D),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Mes RDV',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecapRow(String label, String value, {bool isLast = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: const Color(0xFF757575),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: const Color(0xFF1A1A1A),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
