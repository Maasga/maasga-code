import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/sav_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class SAVForm extends ConsumerStatefulWidget {
  const SAVForm({super.key});

  @override
  ConsumerState<SAVForm> createState() => _SAVFormState();
}

class _SAVFormState extends ConsumerState<SAVForm> {
  final _formKey = GlobalKey<FormState>();
  final _clientNameController = TextEditingController();
  final _clientPhoneController = TextEditingController();
  final _clientEmailController = TextEditingController();
  final _equipmentTypeController = TextEditingController();
  final _serialNumberController = TextEditingController();
  final _issueController = TextEditingController();

  String _priority = 'normal';
  bool _isLoading = false;

  final List<Map<String, String>> _priorities = [
    {'value': 'low', 'label': 'Faible', 'icon': '🟢'},
    {'value': 'normal', 'label': 'Normal', 'icon': '🔵'},
    {'value': 'high', 'label': 'Élevé', 'icon': '🟠'},
    {'value': 'urgent', 'label': 'Urgent', 'icon': '🔴'},
  ];

  @override
  void dispose() {
    _clientNameController.dispose();
    _clientPhoneController.dispose();
    _clientEmailController.dispose();
    _equipmentTypeController.dispose();
    _serialNumberController.dispose();
    _issueController.dispose();
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
          Container(
            margin: const EdgeInsets.only(top: MaasgaTokens.spacingMd),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AdminTheme.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: MaasgaTokens.spacingLg,
              vertical: MaasgaTokens.spacingMd,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Nouveau ticket SAV',
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
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(MaasgaTokens.spacingLg),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionTitle('Client'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    TextFormField(
                      controller: _clientNameController,
                      decoration: _inputDecoration('Nom du client *', Icons.person),
                      textCapitalization: TextCapitalization.words,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Requis' : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    TextFormField(
                      controller: _clientPhoneController,
                      decoration: _inputDecoration('Téléphone *', Icons.phone),
                      keyboardType: TextInputType.phone,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Requis' : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    TextFormField(
                      controller: _clientEmailController,
                      decoration: _inputDecoration('Email (optionnel)', Icons.email),
                      keyboardType: TextInputType.emailAddress,
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),
                    _sectionTitle('Équipement'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    TextFormField(
                      controller: _equipmentTypeController,
                      decoration: _inputDecoration(
                        'Type d\'équipement (ex: Climatiseur 18000 BTU)',
                        Icons.ac_unit,
                      ),
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    TextFormField(
                      controller: _serialNumberController,
                      decoration: _inputDecoration(
                        'Numéro de série (optionnel)',
                        Icons.qr_code,
                      ),
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),
                    _sectionTitle('Problème'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    TextFormField(
                      controller: _issueController,
                      decoration: _inputDecoration(
                        'Description du problème *',
                        Icons.report_problem,
                      ),
                      maxLines: 4,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Requis' : null,
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),
                    _sectionTitle('Priorité'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    Row(
                      children: _priorities.map((p) {
                        final isSelected = _priority == p['value'];
                        Color color;
                        switch (p['value']) {
                          case 'low':
                            color = AdminTheme.success;
                            break;
                          case 'high':
                            color = AdminTheme.warning;
                            break;
                          case 'urgent':
                            color = AdminTheme.error;
                            break;
                          default:
                            color = AdminTheme.info;
                        }
                        return Expanded(
                          child: GestureDetector(
                            onTap: () =>
                                setState(() => _priority = p['value']!),
                            child: Container(
                              margin: EdgeInsets.only(
                                right: _priorities.last == p ? 0 : 6,
                              ),
                              padding: const EdgeInsets.symmetric(
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? color.withValues(alpha: 0.15)
                                    : AdminTheme.background,
                                borderRadius: BorderRadius.circular(
                                  MaasgaTokens.radiusMd,
                                ),
                                border: Border.all(
                                  color: isSelected
                                      ? color
                                      : AdminTheme.border,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Column(
                                children: [
                                  Text(p['icon']!, style: const TextStyle(fontSize: 16)),
                                  const SizedBox(height: 2),
                                  Text(
                                    p['label']!,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: isSelected
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                      color: isSelected
                                          ? color
                                          : AdminTheme.textSecondary,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AdminTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(MaasgaTokens.radiusMd),
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
                                'Créer le ticket',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 15),
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      await ref.read(
        createSavTicketProvider({
          'client_name': _clientNameController.text.trim(),
          'client_phone': _clientPhoneController.text.trim(),
          'client_email': _clientEmailController.text.trim().isEmpty
              ? null
              : _clientEmailController.text.trim(),
          'equipment_type': _equipmentTypeController.text.trim().isEmpty
              ? null
              : _equipmentTypeController.text.trim(),
          'serial_number': _serialNumberController.text.trim().isEmpty
              ? null
              : _serialNumberController.text.trim(),
          'issue_description': _issueController.text.trim(),
          'priority': _priority,
          'status': 'open',
        }).future,
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ticket SAV créé avec succès'),
            backgroundColor: AdminTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Erreur: $e'), backgroundColor: AdminTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _sectionTitle(String title) => Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: AdminTheme.primary,
        ),
      );

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
}
