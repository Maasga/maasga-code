import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:dio/dio.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../features/client_space/domain/commande.dart';
import '../../features/client_space/domain/user_profile.dart';
import '../../features/cart/presentation/cart_state.dart';

class PdfService {
  /// Fetches an HTML invoice from backend, converts it to PDF and displays it in-app
  static Future<void> displayRemoteInvoice({
    required Dio dio,
    required String contractId,
  }) async {
    try {
      // 1. Fetch JSON data instead of HTML to allow native PDF generation on all platforms
      final response = await dio.get(
        '/api/maintenance/invoice/$contractId',
        queryParameters: {'format': 'json'},
        options: Options(headers: {'Accept': 'application/json'}),
      );
      
      final data = response.data as Map<String, dynamic>;

      // 2. Build the PDF document natively using Dart
      final pdfBytes = await _buildMaintenanceInvoicePdf(data);

      // 3. Display it using Printing layout (works on Web and Mobile natively)
      await Printing.layoutPdf(
        onLayout: (format) async => pdfBytes,
        name: 'FACTURE_MAASGA_MC_$contractId.pdf',
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Builds a professional maintenance invoice PDF natively
  static Future<Uint8List> _buildMaintenanceInvoicePdf(Map<String, dynamic> data) async {
    final pdf = pw.Document();
    
    final contract = data['contract'] as Map<String, dynamic>;
    final client = data['client'] as Map<String, dynamic>;
    final visits = (data['visits'] as List? ?? []);
    final payment = data['payment'] as Map<String, dynamic>?;
    final company = data['company'] as Map<String, dynamic>;

    final logoData = await rootBundle.load('assets/logo_maasga.png');
    final logoImage = pw.MemoryImage(logoData.buffer.asUint8List());

    final planLabels = {
      'trimestriel': 'Trimestriel (3 mois)',
      'semestriel': 'Semestriel (6 mois)',
      'annuel': 'Annuel Premium (12 mois)'
    };

    final visitStatusLabels = {
      'planifiee': 'Planifiée',
      'confirmee': 'Confirmée',
      'effectuee': 'Effectuée',
      'annulee': 'Annulée'
    };

    final payMethodLabels = {
      'orange_money': 'Orange Money',
      'moov_money': 'Moov Money',
      'wave': 'Wave',
      'carte_bancaire': 'Carte bancaire',
      'a_confirmer': 'À confirmer',
      'cash': 'Espèces'
    };

    final invoiceNum = 'MAASGA-MC-${contract['id'].toString().padLeft(5, '0')}';
    final invoiceDate = DateFormat('dd MMMM yyyy', 'fr_FR').format(DateTime.now());

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return [
            // HEADER
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Image(logoImage, width: 80),
                    pw.SizedBox(height: 10),
                    pw.Text(company['name'], style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                    pw.Text(company['address'], style: const pw.TextStyle(fontSize: 9)),
                    pw.Text('Tél: ${company['phone']}', style: const pw.TextStyle(fontSize: 9)),
                    pw.Text('IFU: ${company['ifu']}', style: const pw.TextStyle(fontSize: 9)),
                  ],
                ),
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.end,
                  children: [
                    pw.Text('FACTURE DE MAINTENANCE', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold, color: secondaryColor)),
                    pw.SizedBox(height: 5),
                    pw.Text('N° $invoiceNum', style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Date: $invoiceDate', style: const pw.TextStyle(fontSize: 10)),
                  ],
                ),
              ],
            ),
            pw.SizedBox(height: 30),
            pw.Divider(thickness: 1, color: borderColor),
            pw.SizedBox(height: 20),

            // INFO CARDS
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Expanded(
                  child: _buildInfoCard('CLIENT', [
                    '${client['name']}',
                    'Tél: ${client['phone']}',
                    'Email: ${client['email'] ?? '—'}',
                  ]),
                ),
                pw.SizedBox(width: 20),
                pw.Expanded(
                  child: _buildInfoCard('CONTRAT', [
                    'Type: ${planLabels[contract['plan_type']] ?? contract['plan_type']}',
                    'Statut: ${contract['status'] == 'active' ? 'ACTIF' : 'ACTIF'}',
                    'Date début: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(contract['start_date']))}',
                  ]),
                ),
              ],
            ),
            pw.SizedBox(height: 30),

            // VISITS TABLE
            pw.Text('JOURNAL DES VISITES', style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: primaryColor)),
            pw.SizedBox(height: 10),
            pw.Table(
              columnWidths: {
                0: const pw.FlexColumnWidth(2),
                1: const pw.FlexColumnWidth(2),
                2: const pw.FlexColumnWidth(2),
                3: const pw.FlexColumnWidth(2),
              },
              border: pw.TableBorder.all(color: borderColor, width: 0.5),
              children: [
                pw.TableRow(
                  decoration: pw.BoxDecoration(color: primaryColor),
                  children: [
                    _tableCell('Date', isHeader: true, align: pw.TextAlign.left),
                    _tableCell('Type', isHeader: true, align: pw.TextAlign.left),
                    _tableCell('Statut', isHeader: true, align: pw.TextAlign.center),
                    _tableCell('Technicien', isHeader: true, align: pw.TextAlign.left),
                  ],
                ),
                ...visits.map((v) => pw.TableRow(
                  children: [
                    _tableCell(DateFormat('dd/MM/yyyy').format(DateTime.parse(v['visit_date'])), align: pw.TextAlign.left),
                    _tableCell(v['visit_type'] == 'preventive' ? 'Préventive' : v['visit_type'].toString(), align: pw.TextAlign.left),
                    _tableCell(visitStatusLabels[v['status']] ?? v['status'].toString(), align: pw.TextAlign.center, isBold: true),
                    _tableCell(v['technician'] ?? '—', align: pw.TextAlign.left),
                  ],
                )),
              ],
            ),
            pw.SizedBox(height: 40),

            // PAYMENT SUMMARY
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.end,
              children: [
                pw.Container(
                  width: 200,
                  child: pw.Column(
                    children: [
                      pw.Divider(thickness: 1, color: borderColor),
                      _totalLine('Mode de paiement', payment != null ? (payMethodLabels[payment['method']] ?? payment['method'].toString()) : 'À confirmer'),
                      _totalLine('Statut paiement', (payment != null && payment['status'] == 'completed') ? 'Payé' : 'À confirmer', color: (payment != null && payment['status'] == 'completed') ? PdfColors.green700 : PdfColors.amber700),
                      pw.SizedBox(height: 10),
                      pw.Container(
                        padding: const pw.EdgeInsets.all(10),
                        decoration: pw.BoxDecoration(color: bgColor, borderRadius: const pw.BorderRadius.all(pw.Radius.circular(5))),
                        child: _totalLine('TOTAL PAYÉ', '${_formatPrice((contract['plan_price'] ?? 0).toDouble())} FCFA', color: primaryColor),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            
            pw.SizedBox(height: 50),
            pw.Center(
              child: pw.Text('Merci de votre confiance. MAASGA - Le froid en toute sérénité.', style: pw.TextStyle(fontSize: 8, color: PdfColors.grey600, fontStyle: pw.FontStyle.italic)),
            ),
          ];
        },
      ),
    );

    return pdf.save();
  }

  // Brand Colors (Aligned with Web)
  static final primaryColor = PdfColor.fromInt(0xFF03045E);
  static final secondaryColor = PdfColor.fromInt(0xFF0077B6);
  static final accentColor = PdfColor.fromInt(0xFF00B4D8);
  static final bgColor = PdfColor.fromInt(0xFFF8FAFC);
  static final borderColor = PdfColor.fromInt(0xFFE2E8F0);

  /// Generates a professional Devis (Quote) for an Order
  static Future<void> generateOrderDevis({
    required UserProfile profile,
    required Commande commande,
  }) async {
    final pdf = pw.Document();
    final logoData = await rootBundle.load('assets/logo_maasga.png');
    final logoImage = pw.MemoryImage(logoData.buffer.asUint8List());

    // Prepare items for the table
    final List<_OrderPdfItem> items = [];
    
    // Main Product
    final prodPrice = (commande.produitPrix ?? 0).toDouble();
    final prodQty = (commande.produitQuantite ?? 1).clamp(1, 999);
    
    String displayName = commande.productName;
    if (commande.btu != null && !displayName.contains(commande.btu.toString())) {
      displayName += ' (${commande.brand ?? 'MAASGA'} ${commande.btu} BTU)';
    }
    
    if (prodPrice > 0) {
      items.add(_OrderPdfItem(
        name: displayName,
        price: prodPrice,
        quantity: prodQty,
        total: prodPrice * prodQty,
      ));
    }

    // Installation
    if ((commande.installationPrix ?? 0) > 0) {
      items.add(_OrderPdfItem(
        name: 'Installation Standard & Mise en service',
        price: commande.installationPrix!.toDouble(),
        quantity: 1,
        total: commande.installationPrix!.toDouble(),
      ));
    }

    // Accessories
    if (commande.accessoires != null) {
      for (var acc in commande.accessoires!) {
        items.add(_OrderPdfItem(
          name: acc['nom'] ?? 'Accessoire',
          price: (acc['prix'] ?? 0).toDouble(),
          quantity: 1,
          total: (acc['prix'] ?? 0).toDouble(),
        ));
      }
    }

    final subtotal = items.fold(0.0, (sum, item) => sum + item.total);
    final remisePct = commande.remise ?? 0;
    final remiseMt = (subtotal * remisePct / 100).roundToDouble();
    final totalNet = subtotal - remiseMt;

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (context) => _buildPdfLayout(
          title: 'DEVIS',
          ref: commande.devisNumero ?? 'DEV-${commande.id}',
          date: commande.date,
          expiry: commande.expiresAt,
          clientName: profile.fullName,
          clientPhone: profile.phone,
          clientEmail: commande.devisClientEmail ?? profile.email,
          clientQuartier: commande.devisClientQuartier ?? profile.quartier,
          items: items,
          subtotal: subtotal,
          remisePct: remisePct,
          remiseMt: remiseMt,
          totalNet: totalNet,
          logoImage: logoImage,
          status: commande.devisStatus,
          messageClient: commande.messageClient,
        ),
      ),
    );

    await Printing.layoutPdf(
      onLayout: (format) async => pdf.save(),
      name: 'DEVIS_MAASGA_${commande.devisNumero ?? commande.id}.pdf',
    );
  }

  /// Generates a professional Purchase Invoice from an existing historical Order
  static Future<void> generateOrderInvoice({
    required UserProfile profile,
    required Commande commande,
  }) async {
    final List<_OrderPdfItem> items = [];
    
    // 1. Determine Unit Base (Same logic as generateOrderDevis)
    final int unitQty = (commande.produitQuantite ?? 1).clamp(1, 999);
    double unitPrice = 0.0;
    
    // Prioritize produitPrix if available as it's the raw unit price
    if ((commande.produitPrix ?? 0) > 0) {
      unitPrice = commande.produitPrix!.toDouble();
    } else {
      // Fallback: parse from formatted price string
      final cleaned = commande.price.replaceAll(RegExp(r'\D'), '');
      final totalFromPrice = double.tryParse(cleaned) ?? 0.0;
      unitPrice = totalFromPrice / unitQty;
    }

    // Add Main Product Line
    items.add(_OrderPdfItem(
      name: commande.productName + (commande.btu != null ? ' (${commande.btu} BTU)' : ''),
      price: unitPrice,
      quantity: unitQty,
      total: unitPrice * unitQty,
    ));

    // 2. Add Extras (Installation + Accessories) - Match Web "Simplicité"
    final bool hasExtras = (commande.installationPrix ?? 0) > 0 || (commande.accessoires != null && commande.accessoires!.isNotEmpty);
    
    if (hasExtras) {
      final double instPrice = (commande.installationPrix ?? 0).toDouble();
      double accsTotal = 0.0;
      if (commande.accessoires != null) {
        for (var acc in commande.accessoires!) {
          accsTotal += (acc['prix'] ?? 0).toDouble();
        }
      }
      
      final subTotalExtras = instPrice + accsTotal;
      final remisePct = commande.remise ?? 0;
      final double devisTotalExtras = subTotalExtras - (subTotalExtras * remisePct / 100);

      if (devisTotalExtras > 0) {
        items.add(_OrderPdfItem(
          name: 'Installations & Prestations (Réf. ${commande.devisNumero ?? 'Devis'})',
          price: devisTotalExtras,
          quantity: 1,
          total: devisTotalExtras,
        ));
      }
    }

    final globalSubtotal = items.fold(0.0, (sum, item) => sum + item.total);
    final globalTotalTotal = globalSubtotal;

    final pdf = pw.Document();
    final logoData = await rootBundle.load('assets/logo_maasga.png');
    final logoImage = pw.MemoryImage(logoData.buffer.asUint8List());

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (context) => _buildPdfLayout(
          title: 'FACTURE',
          ref: 'FAC-${commande.id.split('-').last.padLeft(5, '0')}',
          date: commande.date,
          clientName: profile.fullName,
          clientPhone: profile.phone,
          clientEmail: profile.email,
          clientQuartier: profile.quartier,
          clientId: commande.clientId, // Pass clientId here
          items: items,
          subtotal: globalSubtotal,
          remisePct: 0,
          remiseMt: 0,
          totalNet: globalTotalTotal,
          logoImage: logoImage,
          status: 'paid',
        ),
      ),
    );

    await Printing.layoutPdf(
      onLayout: (format) async => pdf.save(),
      name: 'FACTURE_MAASGA_${commande.id}.pdf',
    );
  }

  /// Generates a professional Purchase Invoice from cart lines (Pre-order)
  static Future<void> generateCartInvoice({
    required String clientName,
    required String clientPhone,
    required String clientQuartier,
    required List<CartLine> items,
    required int totalAmount,
  }) async {
    final pdfItems = items.map((e) => _OrderPdfItem(
      name: e.product.name,
      price: e.product.price.toDouble(),
      quantity: e.quantity,
      total: e.total.toDouble(),
    )).toList();

    final pdf = pw.Document();
    final logoData = await rootBundle.load('assets/logo_maasga.png');
    final logoImage = pw.MemoryImage(logoData.buffer.asUint8List());

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (context) => _buildPdfLayout(
          title: 'FACTURE PROFORMA',
          ref: 'PRO-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
          date: DateFormat('dd/MM/yyyy').format(DateTime.now()),
          clientName: clientName,
          clientPhone: clientPhone,
          clientQuartier: clientQuartier,
          items: pdfItems,
          subtotal: totalAmount.toDouble(),
          remisePct: 0,
          remiseMt: 0,
          totalNet: totalAmount.toDouble(),
          logoImage: logoImage,
          status: 'pending',
        ),
      ),
    );

    await Printing.layoutPdf(
      onLayout: (format) async => pdf.save(),
      name: 'PROFORMA_MAASGA_${DateTime.now().millisecondsSinceEpoch}.pdf',
    );
  }

  static pw.Widget _buildPdfLayout({
    required String title,
    required String ref,
    required String date,
    String? expiry,
    required String clientName,
    required String clientPhone,
    String? clientEmail,
    required String clientQuartier,
    required List<_OrderPdfItem> items,
    required double subtotal,
    required int remisePct,
    required double remiseMt,
    required double totalNet,
    required pw.MemoryImage logoImage,
    String? status,
    String? messageClient,
    int? clientId,
  }) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        // 1. Website-like Header
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            // Logo
            pw.Image(logoImage, width: 70),
            // Company Info (Center)
            pw.Column(
              children: [
                pw.Text('MAASGA', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                pw.Text('FROID & CLIMATISATION', style: pw.TextStyle(fontSize: 9, color: secondaryColor, fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 4),
                pw.Text('Ouagadougou, Burkina Faso · +226 55 99 64 18', style: pw.TextStyle(fontSize: 7, color: PdfColors.grey600)),
              ],
            ),
            // Title & Ref (Right)
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Text(title, style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                pw.Text('N° $ref', style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: secondaryColor)),
                pw.SizedBox(height: 4),
                pw.Text('Date : $date', style: pw.TextStyle(fontSize: 8)),
                if (expiry != null) pw.Text('Valable jusqu\'au : $expiry', style: pw.TextStyle(fontSize: 8, color: PdfColors.grey700)),
              ],
            ),
          ],
        ),

        pw.SizedBox(height: 20),
        pw.Divider(thickness: 1, color: secondaryColor),
        pw.SizedBox(height: 15),

        // 2. Info Boxes (Informations Client / Émetteur)
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              child: _buildInfoCard('INFORMATIONS CLIENT', [
                clientName,
                'Téléphone : $clientPhone',
                if (clientEmail != null && clientEmail.isNotEmpty) 'Email : $clientEmail',
                'Adresse : ${clientQuartier.isEmpty ? 'Ouagadougou' : '$clientQuartier, Ouagadougou'}',
                if (clientId != null) 'Réf. client : CLI-${clientId.toString().padLeft(5, '0')}',
              ]),
            ),
            pw.SizedBox(width: 15),
            pw.Expanded(
              child: _buildInfoCard('ÉMETTEUR', [
                'MAASGA SARL',
                'Activité : Froid & Climatisation',
                'Tel : +226 55 99 64 18',
                'Email : maasgabf@gmail.com',
                'RCCM : BF OUA 2023 B 1234',
              ]),
            ),
          ],
        ),

        pw.SizedBox(height: 25),

        // 3. Table with dark header
        pw.Table(
          children: [
            // Header
            pw.TableRow(
              decoration: pw.BoxDecoration(color: primaryColor),
              children: [
                _tableCell('DÉSIGNATION', isHeader: true, align: pw.TextAlign.left),
                _tableCell('QTÉ', isHeader: true),
                _tableCell('PRIX UNITAIRE', isHeader: true),
                _tableCell('TOTAL', isHeader: true),
              ],
            ),
            // Rows
            ...items.map((item) => pw.TableRow(
              children: [
                _tableCell(item.name, align: pw.TextAlign.left, isBold: item.name == items.first.name),
                _tableCell(item.quantity.toString()),
                _tableCell('${_formatPrice(item.price)} FCFA'),
                _tableCell('${_formatPrice(item.total)} FCFA', isBold: true),
              ],
            )),
          ],
        ),

        // 4. Detailed Summary (Subtotal, Discount, Net)
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.end,
          children: [
            pw.Container(
              width: 180,
              padding: const pw.EdgeInsets.symmetric(vertical: 10),
              child: pw.Column(
                children: [
                  _totalLine('Sous-total HT', '${_formatPrice(subtotal)} FCFA'),
                  if (remiseMt > 0) 
                    _totalLine('Remise ($remisePct%)', '- ${_formatPrice(remiseMt)} FCFA', color: PdfColors.green),
                  pw.SizedBox(height: 5),
                  pw.Divider(color: borderColor, thickness: 0.5),
                  pw.SizedBox(height: 5),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('TOTAL TTC', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.end,
                        children: [
                          pw.Text('${_formatPrice(totalNet)} FCFA', style: pw.TextStyle(fontSize: 13, fontWeight: pw.FontWeight.bold, color: secondaryColor)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),



        // 6. Message Team Block
        if (messageClient != null && messageClient.isNotEmpty) ...[
          pw.SizedBox(height: 15),
          pw.Container(
            padding: const pw.EdgeInsets.all(12),
            decoration: pw.BoxDecoration(
              color: PdfColor.fromInt(0xFFF0F9FF),
              border: pw.Border(left: pw.BorderSide(color: secondaryColor, width: 4)),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('MESSAGE DE L\'ÉQUIPE', style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: secondaryColor)),
                pw.SizedBox(height: 4),
                pw.Text(messageClient, style: pw.TextStyle(fontSize: 9, color: PdfColors.blueGrey800, lineSpacing: 1.5)),
              ],
            ),
          ),
        ],

        pw.Spacer(),

        // Footer small print
        pw.Center(
          child: pw.Text(
            'MAASGA SARL - Votre confort, notre priorité.\nSolutions de climatisation certifiées à Ouagadougou',
            textAlign: pw.TextAlign.center,
            style: pw.TextStyle(fontSize: 7, color: PdfColors.grey600),
          ),
        ),
      ],
    );
  }

  static pw.Widget _totalLine(String label, String value, {PdfColor? color}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 2),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: pw.TextStyle(fontSize: 9, color: PdfColors.grey700)),
          pw.Text(value, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: color ?? PdfColors.black)),
        ],
      ),
    );
  }



  static pw.Widget _tableCell(String text, {bool isHeader = false, pw.TextAlign align = pw.TextAlign.right, bool isBold = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: pw.Text(
        text,
        textAlign: align,
        style: pw.TextStyle(
          fontSize: isHeader ? 10 : 9,
          fontWeight: isHeader || isBold ? pw.FontWeight.bold : pw.FontWeight.normal,
          color: isHeader ? PdfColors.white : PdfColors.black,
        ),
      ),
    );
  }

  static pw.Widget _buildInfoCard(String title, List<String> lines) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: bgColor,
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
        border: pw.Border.all(color: borderColor),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(title, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: secondaryColor)),
          pw.SizedBox(height: 8),
          ...lines.map((line) => pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 2),
            child: pw.Text(line, style: pw.TextStyle(fontSize: 10, fontWeight: line == lines[0] ? pw.FontWeight.bold : pw.FontWeight.normal)),
          )),
        ],
      ),
    );
  }

  static String _formatPrice(double price) {
    return NumberFormat("#,###", "fr_FR").format(price.toInt()).replaceAll(',', ' ');
  }
}

class _OrderPdfItem {
  final String name;
  final double price;
  final int quantity;
  final double total;
  _OrderPdfItem({required this.name, required this.price, required this.quantity, required this.total});
}
