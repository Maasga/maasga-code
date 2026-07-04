import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:lottie/lottie.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../../shared/widgets/main_bottom_nav.dart';
import '../widgets/formula_card.dart';
import '../widgets/maintenance_widgets.dart';
import 'package:app/features/auth/data/auth_repository.dart';
import '../../../../shared/widgets/maasga_app_bar.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../data/repositories/maintenance_repository.dart';

class MaintenanceScreen extends ConsumerStatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  ConsumerState<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends ConsumerState<MaintenanceScreen> {
  final _scrollController = ScrollController();
  bool _isLoading = false;

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Lottie.asset(
              'assets/animations/success_check.json',
              width: 120,
              height: 120,
              repeat: false,
            ),
            const SizedBox(height: 8),
            Text(
              'Demande envoyée !',
              style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Nous vous confirmons votre souscription sous 2h. Notre équipe vous contactera sur WhatsApp.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF757575)),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1B3A8D),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('Parfait', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF1B3A8D);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: Column(
        children: [
          MaasgaAppBar(notificationsCount: 3),
          if (_isLoading)
            const LinearProgressIndicator(
              backgroundColor: Colors.transparent,
              valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
              minHeight: 2,
            ),
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. BANNIÈRE INTRO
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: primaryColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Maintenance préventive · MAASGA',
                          style: GoogleFonts.poppins(color: Colors.white.withValues(alpha: 0.8), fontSize: 11, letterSpacing: 1.0),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Contrats de Maintenance',
                          style: GoogleFonts.poppins(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Protégez votre investissement. Un entretien régulier prolonge la durée de vie de vos climatiseurs et réduit votre consommation.',
                          style: GoogleFonts.poppins(color: Colors.white.withValues(alpha: 0.85), fontSize: 13),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.bolt, color: Color(0xFFFFD700), size: 16),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Un climatiseur bien entretenu consomme jusqu\'à 30% d\'énergie en moins et dure 2× plus longtemps.',
                                  style: GoogleFonts.poppins(color: Colors.white, fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  // POURQUOI UN CONTRAT
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Pourquoi un contrat de maintenance ?',
                      style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF1A1A1A)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.5,
                    children: const [
                      BenefitCard(icon: Icons.electric_bolt_outlined, title: '-30% énergie', subtitle: 'Économies sur votre facture'),
                      BenefitCard(icon: Icons.timelapse_outlined, title: '2× durée de vie', subtitle: 'Votre clim dure plus longtemps'),
                      BenefitCard(icon: Icons.air_outlined, title: 'Air pur', subtitle: 'Filtres propres, air sain garanti'),
                      BenefitCard(icon: Icons.shield_outlined, title: 'Zéro panne', subtitle: 'Diagnostic précoce des problèmes'),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // CHOISISSEZ VOTRE FORMULE
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Choisissez votre formule',
                      style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF1A1A1A)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        FormulaCard(
                          title: 'TRIMESTRIEL',
                          price: '30 000',
                          period: '/ trimestre',
                          subtitle: 'soit 10 000 F par maintenance',
                          target: 'Idéal pour : logements et petits bureaux',
                          inclusions: const [
                            '3 maintenances préventives',
                            'Vérification complète du système',
                            'Nettoyage des filtres',
                            'Contrôle performances froid',
                            'Vérification du gaz',
                            'Diagnostic technique',
                          ],
                          onSelect: () => _showSubscriptionForm('TRIMESTRIEL'),
                        ),
                        FormulaCard(
                          title: 'SEMESTRIEL',
                          price: '55 000',
                          period: '/ 6 mois',
                          subtitle: 'soit ~9 166 F par maintenance',
                          economy: '💰 Économie : 5 000 F',
                          isRecommended: true,
                          bonusTitle: 'Bonus client :',
                          bonusDesc: '1 diagnostic panne offert dans l\'année',
                          inclusions: const [
                            '6 maintenances préventives',
                            'Nettoyage unité int. + ext.',
                            'Vérification du gaz',
                            'Diagnostic complet',
                            'Priorité sur les interventions',
                            'Conseils d\'optimisation',
                          ],
                          onSelect: () => _showSubscriptionForm('SEMESTRIEL'),
                          target: 'Recommandé pour : bureaux et commerces',
                        ),
                        FormulaCard(
                          title: 'ANNUEL PREMIUM',
                          price: '100 000',
                          period: '/ an',
                          subtitle: 'soit ~8 333 F par maintenance',
                          economy: '💰 Économie : 20 000 F',
                          isPremium: true,
                          bonusTitle: 'Avantages exclusifs :',
                          bonusDesc: '• 1 recharge gaz gratuite\n• 10% de réduction réparations\n• Support prioritaire',
                          inclusions: const [
                            '12 maintenances préventives',
                            'Nettoyage complet pro',
                            'Vérification gaz et pression',
                            'Diagnostic complet expert',
                            'Intervention prioritaire',
                            'Conseils sur mesure',
                            'Suivi personnalisé',
                          ],
                          onSelect: () => _showSubscriptionForm('ANNUEL PREMIUM'),
                          target: 'Idéal pour : restaurants, hôtels et serveurs',
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  const _WhatsAppCTA(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: const MainBottomNav(currentPath: '/maintenance'),
    );
  }

  void _showSubscriptionForm(String initialFormule) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _SubscriptionFormModal(
        initialFormule: initialFormule,
        onSubmit: _submitRequestFromModal,
      ),
    );
  }

  Future<void> _submitRequestFromModal(Map<String, dynamic> data) async {
    setState(() => _isLoading = true);
    try {
      final repo = await ref.read(maintenanceRepositoryProvider.future);
      await repo.submitRequest(data);
      if (mounted) {
        _showSuccessDialog();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}

class _SubscriptionFormModal extends ConsumerStatefulWidget {
  final String initialFormule;
  final Function(Map<String, dynamic>) onSubmit;

  const _SubscriptionFormModal({
    required this.initialFormule,
    required this.onSubmit,
  });

  @override
  ConsumerState<_SubscriptionFormModal> createState() => _SubscriptionFormModalState();
}

class _SubscriptionFormModalState extends ConsumerState<_SubscriptionFormModal> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _quartierCtrl = TextEditingController();

  late String _selectedFormule;

  @override
  void initState() {
    super.initState();
    _selectedFormule = widget.initialFormule;
    _fillUserData();
  }

  void _fillUserData() {
    final user = ref.read(userProfileProvider).value;
    if (user != null) {
      _nameCtrl.text = user['name'] ?? '';
      _phoneCtrl.text = user['phone'] ?? '';
      _emailCtrl.text = user['email'] ?? '';
      _quartierCtrl.text = user['quartier'] ?? '';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _quartierCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF1B3A8D);
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(bottom: bottomPadding),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Ma Souscription', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text('Formule : $_selectedFormule', style: GoogleFonts.poppins(fontSize: 13, color: primaryColor, fontWeight: FontWeight.w600)),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                  style: IconButton.styleFrom(backgroundColor: const Color(0xFFF5F5F5)),
                )
              ],
            ),
          ),
          const Divider(),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFieldLabel('Nom complet *'),
                    TextFormField(
                      controller: _nameCtrl,
                      style: MaasgaTokens.inputTextStyle,
                      decoration: InputDecoration(hintText: 'Votre nom', prefixIcon: Icon(Icons.person_outline, color: MaasgaTokens.blue700)),
                      validator: (v) => v!.isEmpty ? 'Requis' : null,
                    ),
                    const SizedBox(height: 16),
                    _buildFieldLabel('Téléphone (WhatsApp) *'),
                    TextFormField(
                      controller: _phoneCtrl,
                      style: MaasgaTokens.inputTextStyle,
                      decoration: InputDecoration(hintText: 'XX XX XX XX', prefixIcon: Icon(Icons.phone_outlined, color: MaasgaTokens.blue700)),
                      validator: (v) => v!.isEmpty ? 'Requis' : null,
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {
                          if (!_formKey.currentState!.validate()) return;
                          Navigator.pop(context);
                          widget.onSubmit({
                            'name': _nameCtrl.text.trim(),
                            'phone': _phoneCtrl.text.trim(),
                            'plan_type': _selectedFormule.toLowerCase(),
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Text('Confirmer ma souscription', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate().slideY(begin: 1.0, end: 0, duration: 300.ms);
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(label, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF1A1A1A))),
    );
  }
}

class _WhatsAppCTA extends StatelessWidget {
  const _WhatsAppCTA();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F5E9),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.chat_outlined, color: Color(0xFF43A047)),
          const SizedBox(width: 12),
          Expanded(
            child: Text('Besoin d\'aide ? Contactez-nous sur WhatsApp', style: GoogleFonts.poppins(fontSize: 12)),
          ),
          ElevatedButton(
            onPressed: () => launchUrl(Uri.parse('https://wa.me/22655996418')),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF43A047)),
            child: Text('Ouvrir', style: GoogleFonts.poppins(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
