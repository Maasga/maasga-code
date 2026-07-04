import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../shared/widgets/main_bottom_nav.dart';
import '../../../shared/widgets/maasga_app_bar.dart';
import '../../auth/data/auth_repository.dart';
import '../../client_space/data/client_dashboard_repository.dart';
import '../../notifications/data/activity_repository.dart';
import '../data/rdv_repository.dart';
import '../domain/rdv_request.dart';
import 'widgets/rdv_confirmation_step.dart';
import 'widgets/rdv_form_step.dart';
import 'widgets/service_type_card.dart';
import 'widgets/step_indicator.dart';

class RdvScreen extends ConsumerStatefulWidget {
  const RdvScreen({super.key});

  @override
  ConsumerState<RdvScreen> createState() => _RdvScreenState();
}

class _RdvScreenState extends ConsumerState<RdvScreen> {
  static const _primaryBlue = Color(0xFF1B3A8D);
  static const _bgColor = Color(0xFFF5F5F5);

  final PageController _pageController = PageController();
  int _currentStep = 0;

  // Step 1 Data
  String? _selectedServiceType;

  // Step 2 Data
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  String? _selectedQuartier;
  LatLng? _selectedLocation;
  String? _selectedAddress;
  DateTime? _selectedDate;
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;
  bool _isConsented = false;

  // Global State
  bool _isLoading = false;
  RdvRequest? _completedRequest;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    try {
      final repo = await ref.read(authRepositoryProvider.future);
      final profile = await repo.getProfile();
      if (profile != null && mounted) {
        setState(() {
          if (_nameCtrl.text.isEmpty) _nameCtrl.text = profile['name']?.toString() ?? '';
          if (_emailCtrl.text.isEmpty) _emailCtrl.text = profile['email']?.toString() ?? '';
          if (_phoneCtrl.text.isEmpty) _phoneCtrl.text = profile['phone']?.toString() ?? '';
          _selectedQuartier ??= profile['quartier']?.toString();
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _pageController.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentStep < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _submitDemande() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner une date')),
      );
      return;
    }
    if (!_isConsented) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez accepter les conditions')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final request = RdvRequest(
      serviceType: _selectedServiceType!,
      fullName: _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      email: _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
      quartier: _selectedQuartier!,
      lat: _selectedLocation?.latitude,
      lng: _selectedLocation?.longitude,
      address: _selectedAddress,
      date: _selectedDate!,
      startTime: _startTime,
      endTime: _endTime,
      notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      consented: _isConsented,
    );

    try {
      final repo = await ref.read(rdvRepositoryProvider.future);
      await repo.submitRdv(request);
      
      // Invalider les fournisseurs pour rafraîchir les données dans l'espace client
      ref.invalidate(clientDashboardProvider);
      ref.invalidate(userActivityProvider);

      setState(() {
        _completedRequest = request;
        _isLoading = false;
      });
      _nextPage();
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      resizeToAvoidBottomInset: false,
      appBar: const MaasgaAppBar(),
      body: Column(
        children: [
          StepIndicator(currentStep: _currentStep),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (idx) => setState(() => _currentStep = idx),
              children: [
                _buildStep1(),
                _buildStep2(),
                _buildStep3(),
              ],
            ),
          ),
          if (_currentStep < 2) _buildFooter(),
        ],
      ),
      bottomNavigationBar: const MainBottomNav(currentPath: '/rdv'),
    );
  }

  Widget _buildStep1() {
    final types = [
      (
        icon: Icons.design_services_outlined,
        title: 'Devis / Dimensionnement',
        desc: 'Un technicien visite votre espace et vous fait un devis précis'
      ),
      (
        icon: Icons.construction_outlined,
        title: 'Installation',
        desc: 'Pose professionnelle de votre climatiseur par nos experts'
      ),
      (
        icon: Icons.build_circle_outlined,
        title: 'Maintenance / Entretien',
        desc: 'Nettoyage et vérification de votre climatiseur existant'
      ),
      (
        icon: Icons.warning_amber_outlined,
        title: 'Dépannage / Réparation urgente',
        desc: 'Intervention rapide pour panne ou dysfonctionnement'
      ),
    ];

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 20),
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            'Choisissez votre service',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1A1A1A),
            ),
          ),
        ),
        const SizedBox(height: 8),
        ...types.map((type) => ServiceTypeCard(
              icon: type.icon,
              title: type.title,
              description: type.desc,
              isSelected: _selectedServiceType == type.title,
              onTap: () => setState(() => _selectedServiceType = type.title),
            )),
      ],
    );
  }

  Widget _buildStep2() {
    return RdvFormStep(
      selectedServiceType: _selectedServiceType ?? 'Service non sélectionné',
      onBack: _previousPage,
      formKey: _formKey,
      nameCtrl: _nameCtrl,
      phoneCtrl: _phoneCtrl,
      emailCtrl: _emailCtrl,
      notesCtrl: _notesCtrl,
      selectedQuartier: _selectedQuartier,
      onQuartierChanged: (val) => setState(() => _selectedQuartier = val),
      selectedLocation: _selectedLocation,
      onLocationChanged: (pos, addr) => setState(() {
        _selectedLocation = pos;
        _selectedAddress = addr;
      }),
      selectedDate: _selectedDate,
      onDateChanged: (val) => setState(() => _selectedDate = val),
      startTime: _startTime,
      endTime: _endTime,
      onTimeChanged: (val, isStart) => setState(() {
        if (isStart) {
          _startTime = val;
        } else {
          _endTime = val;
        }
      }),
      isConsented: _isConsented,
      address: _selectedAddress,
      onConsentChanged: (val) => setState(() => _isConsented = val ?? false),
    );
  }

  Widget _buildStep3() {
    if (_completedRequest == null) {
      return const Center(child: CircularProgressIndicator());
    }
    return RdvConfirmationStep(
      request: _completedRequest!,
      onGoToMyRdv: () => context.go('/client-space'),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: _currentStep == 0
            ? ElevatedButton(
                onPressed: _selectedServiceType != null ? _nextPage : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primaryBlue,
                  disabledBackgroundColor: const Color(0xFFE0E0E0),
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  'Continuer',
                  style: GoogleFonts.poppins(
                    color: _selectedServiceType != null ? Colors.white : const Color(0xFF9E9E9E),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
            : Row(
                children: [
                  Expanded(
                    flex: 35,
                    child: OutlinedButton(
                      onPressed: _previousPage,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        side: const BorderSide(color: _primaryBlue),
                      ),
                      child: Text(
                        'Retour',
                        style: GoogleFonts.poppins(
                          color: _primaryBlue,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 65,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _submitDemande,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryBlue,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : Text(
                              'Confirmer ma demande',
                              style: GoogleFonts.poppins(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
