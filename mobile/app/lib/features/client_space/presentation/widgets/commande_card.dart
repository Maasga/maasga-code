import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/commande.dart';

class CommandeCard extends StatelessWidget {
  const CommandeCard({
    required this.commande,
    this.onViewInvoice,
    this.onCancel,
    this.onDownloadDevis,
    this.onViewDevis,
    this.onAcceptDevis,
    this.onRejectDevis,
    super.key,
  });

  final Commande commande;
  final VoidCallback? onViewInvoice;
  final VoidCallback? onCancel;
  final VoidCallback? onDownloadDevis;
  final VoidCallback? onViewDevis;
  final VoidCallback? onAcceptDevis;
  final VoidCallback? onRejectDevis;

  Color _getStatusBgColor(CommandeStatus status) {
    if (status == CommandeStatus.installed) return const Color(0xFFE8F5E9);
    if (status == CommandeStatus.paid || status == CommandeStatus.devisValide) return const Color(0xFFE0F7FA);
    if (status == CommandeStatus.livre) return const Color(0xFFE0F2F1);
    if (status == CommandeStatus.validationTerrain || status == CommandeStatus.devisEnAttente) return const Color(0xFFFFF3E0);
    if (status == CommandeStatus.cancelled || status == CommandeStatus.devisRefuse) return const Color(0xFFFFEBEE);
    if (status == CommandeStatus.refunded) return const Color(0xFFF3E5F5);
    return Colors.grey.shade100;
  }

  Color _getStatusTextColor(CommandeStatus status) {
    if (status == CommandeStatus.installed) return const Color(0xFF2E7D32);
    if (status == CommandeStatus.paid || status == CommandeStatus.devisValide) return const Color(0xFF0288D1);
    if (status == CommandeStatus.livre) return const Color(0xFF00897B);
    if (status == CommandeStatus.validationTerrain || status == CommandeStatus.devisEnAttente) return const Color(0xFFEF6C00);
    if (status == CommandeStatus.cancelled || status == CommandeStatus.devisRefuse) return const Color(0xFFC62828);
    if (status == CommandeStatus.refunded) return const Color(0xFF7B1FA2);
    return Colors.grey.shade700;
  }

  @override
  Widget build(BuildContext context) {
    final isCancelled = commande.status == CommandeStatus.cancelled || commande.status == CommandeStatus.refunded;

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
          // Info Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 50,
                  height: 50,
                  color: const Color(0xFFF5F5F5),
                  child: Image.asset(
                    commande.productImage ?? 'assets/products/product_placeholder.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(Icons.ac_unit, size: 24, color: Color(0xFF1B3A8D)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      commande.productName,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1A1A1A),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '#${commande.id} · ${commande.date}',
                      style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF757575)),
                    ),
                    Text(
                      commande.price,
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
                  color: _getStatusBgColor(commande.status),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  commande.status.label,
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: _getStatusTextColor(commande.status),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (isCancelled)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withAlpha(12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.withAlpha(51)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.cancel, color: Colors.red, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Commande annulée', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.red)),
                        Text('Cette commande ne peut plus être suivie.', style: GoogleFonts.poppins(fontSize: 10, color: Colors.red.shade800)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 16),
          // Actions
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if ([CommandeStatus.paid, CommandeStatus.livre, CommandeStatus.validationTerrain, CommandeStatus.devisEnAttente, CommandeStatus.devisValide, CommandeStatus.devisRefuse, CommandeStatus.installed, CommandeStatus.cancelled, CommandeStatus.refunded].contains(commande.status))
                OutlinedButton.icon(
                  onPressed: onViewInvoice,
                  icon: const Icon(Icons.receipt_long_outlined, size: 14),
                  label: Text('Reçu de paiement', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1B3A8D),
                    backgroundColor: const Color(0xFF1B3A8D).withAlpha(20),
                    side: BorderSide(color: const Color(0xFF1B3A8D).withAlpha(51)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                ),
              if (commande.status == CommandeStatus.devisEnAttente || commande.status == CommandeStatus.devisValide)
                OutlinedButton.icon(
                  onPressed: onDownloadDevis,
                  icon: const Icon(Icons.file_download_outlined, size: 14),
                  label: Text('Télécharger Devis', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF2563EB),
                    backgroundColor: const Color(0xFF2563EB).withAlpha(25),
                    side: BorderSide(color: const Color(0xFF2563EB).withAlpha(51)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                ),
              if (commande.status == CommandeStatus.devisEnAttente || commande.status == CommandeStatus.devisValide || commande.status == CommandeStatus.devisRefuse)
                OutlinedButton.icon(
                  onPressed: onViewDevis,
                  icon: const Icon(Icons.description_outlined, size: 14),
                  label: Text('Voir le devis', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF1B3A8D),
                    backgroundColor: const Color(0xFF1B3A8D).withAlpha(25),
                    side: BorderSide(color: const Color(0xFF1B3A8D).withAlpha(51)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                ),
              if (commande.status == CommandeStatus.devisEnAttente)
                ElevatedButton.icon(
                   onPressed: onAcceptDevis,
                  icon: const Icon(Icons.check_circle_outline, size: 14),
                  label: Text('Valider devis', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600)),
                  style: ElevatedButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: const Color(0xFF10B981),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                ),
              if (commande.status == CommandeStatus.devisEnAttente)
                OutlinedButton.icon(
                  onPressed: onRejectDevis,
                  icon: const Icon(Icons.highlight_off, size: 14),
                  label: Text('Refuser devis', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    backgroundColor: const Color(0xFFEF4444).withAlpha(18),
                    side: BorderSide(color: const Color(0xFFEF4444).withAlpha(51)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                ),
              if ([CommandeStatus.paid, CommandeStatus.livre, CommandeStatus.validationTerrain, CommandeStatus.devisEnAttente, CommandeStatus.devisRefuse].contains(commande.status))
                OutlinedButton.icon(
                  onPressed: onCancel,
                  icon: const Icon(Icons.undo, size: 14),
                  label: Text('Annuler et rembourser', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF991B1B),
                    backgroundColor: const Color(0xFF7F1D1D).withAlpha(15),
                    side: BorderSide(color: const Color(0xFF7F1D1D).withAlpha(30)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    minimumSize: Size.zero,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}


