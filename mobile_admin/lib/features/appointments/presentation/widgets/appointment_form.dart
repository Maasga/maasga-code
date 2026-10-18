import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/appointment_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class AppointmentForm extends ConsumerStatefulWidget {
  const AppointmentForm({super.key});

  @override
  ConsumerState<AppointmentForm> createState() => _AppointmentFormState();
}

class _AppointmentFormState extends ConsumerState<AppointmentForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _quartierController = TextEditingController();
  final _notesController = TextEditingController();

  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _selectedTime = const TimeOfDay(hour: 9, minute: 0);
  String _selectedType = 'devis';
  bool _isLoading = false;

  final List<Map<String, String>> _types = [
    {'value': 'devis', 'label': 'Devis'},
    {'value': 'installation', 'label': 'Installation'},
    {'value': 'entretien', 'label': 'Entretien'},
    {'value': 'reparation', 'label': 'Réparation'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _quartierController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AdminTheme.surface,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(MaasgaTokens.radiusXxl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: MaasgaTokens.spacingMd),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AdminTheme.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: MaasgaTokens.spacingLg,
              vertical: MaasgaTokens.spacingMd,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Nouveau rendez-vous',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AdminTheme.textPrimary,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Form content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(MaasgaTokens.spacingLg),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Nom
                    TextFormField(
                      controller: _nameController,
                      decoration: _inputDecoration(
                        'Nom complet *',
                        Icons.person,
                      ),
                      textCapitalization: TextCapitalization.words,
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Le nom est requis'
                          : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),

                    // Téléphone
                    TextFormField(
                      controller: _phoneController,
                      decoration: _inputDecoration('Téléphone *', Icons.phone),
                      keyboardType: TextInputType.phone,
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Le téléphone est requis'
                          : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),

                    // Email (optionnel)
                    TextFormField(
                      controller: _emailController,
                      decoration: _inputDecoration(
                        'Email (optionnel)',
                        Icons.email,
                      ),
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),

                    // Quartier
                    TextFormField(
                      controller: _quartierController,
                      decoration: _inputDecoration(
                        'Quartier / Adresse *',
                        Icons.location_on,
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Le quartier est requis'
                          : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),

                    // Type de RDV
                    DropdownButtonFormField<String>(
                      initialValue: _selectedType,
                      decoration: _inputDecoration(
                        'Type de rendez-vous',
                        Icons.category,
                      ),
                      items: _types.map((t) {
                        return DropdownMenuItem(
                          value: t['value'],
                          child: Text(t['label']!),
                        );
                      }).toList(),
                      onChanged: (v) =>
                          setState(() => _selectedType = v ?? 'devis'),
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),

                    // Date
                    InkWell(
                      onTap: _pickDate,
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusMd,
                      ),
                      child: InputDecorator(
                        decoration: _inputDecoration(
                          'Date du rendez-vous *',
                          Icons.calendar_today,
                        ),
                        child: Text(
                          '${_selectedDate.day.toString().padLeft(2, '0')}/'
                          '${_selectedDate.month.toString().padLeft(2, '0')}/'
                          '${_selectedDate.year}',
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),

                    // Heure
                    InkWell(
                      onTap: _pickTime,
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusMd,
                      ),
                      child: InputDecorator(
                        decoration: _inputDecoration(
                          'Heure *',
                          Icons.access_time,
                        ),
                        child: Text(
                          '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),

                    // Notes
                    TextFormField(
                      controller: _notesController,
                      decoration: _inputDecoration(
                        'Notes (optionnel)',
                        Icons.sticky_note_2,
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingLg),

                    // Submit
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AdminTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                              MaasgaTokens.radiusMd,
                            ),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'Créer le rendez-vous',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, size: 20, color: AdminTheme.textSecondary),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        borderSide: const BorderSide(color: AdminTheme.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        borderSide: const BorderSide(color: AdminTheme.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        borderSide: const BorderSide(color: AdminTheme.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        borderSide: const BorderSide(color: AdminTheme.error),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: MaasgaTokens.spacingMd,
        vertical: MaasgaTokens.spacingMd,
      ),
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      locale: const Locale('fr'),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(alwaysUse24HourFormat: true),
          child: child!,
        );
      },
    );
    if (picked != null) setState(() => _selectedTime = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final dateStr =
          '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
      final timeStr =
          '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}';

      await ref.read(
        createAppointmentProvider({
          'name': _nameController.text.trim(),
          'phone': _phoneController.text.trim(),
          'email': _emailController.text.trim().isEmpty
              ? null
              : _emailController.text.trim(),
          'quartier': _quartierController.text.trim(),
          'type': _selectedType,
          'date': dateStr,
          'heure_debut': timeStr,
          'notes': _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
        }).future,
      );
      ref.invalidate(appointmentsProvider);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rendez-vous créé avec succès'),
            backgroundColor: AdminTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: AdminTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
