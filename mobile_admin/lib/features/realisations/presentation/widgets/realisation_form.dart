import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/realisation_provider.dart';
import '../../data/models/realisation.dart';
import '../../../../shared/widgets/image_picker_widget.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class RealisationForm extends ConsumerStatefulWidget {
  /// Null = mode création, non-null = mode édition
  final Realisation? realisation;

  const RealisationForm({super.key, this.realisation});

  @override
  ConsumerState<RealisationForm> createState() => _RealisationFormState();
}

class _RealisationFormState extends ConsumerState<RealisationForm> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _clientNameController = TextEditingController();

  String _category = 'residential';
  String? _mainImageData; // base64 ou URL
  DateTime? _completionDate;
  bool _isFeatured = false;
  bool _isLoading = false;

  final List<Map<String, String>> _categories = [
    {'value': 'residential', 'label': 'Résidentiel', 'icon': '🏠'},
    {'value': 'commercial', 'label': 'Commercial', 'icon': '🏢'},
    {'value': 'industrial', 'label': 'Industriel', 'icon': '🏭'},
    {'value': 'maintenance', 'label': 'Maintenance', 'icon': '🔧'},
  ];

  bool get _isEditing => widget.realisation != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final r = widget.realisation!;
      _titleController.text = r.title;
      _descriptionController.text = r.description ?? '';
      _locationController.text = r.location ?? '';
      _clientNameController.text = r.clientName ?? '';
      _category = r.category ?? 'residential';
      _isFeatured = r.featured;
      _mainImageData = r.images.isNotEmpty ? r.images.first : null;
      if (r.completionDate != null) {
        _completionDate = DateTime.tryParse(r.completionDate!);
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _clientNameController.dispose();
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
                Text(
                  _isEditing
                      ? 'Modifier la réalisation'
                      : 'Nouvelle réalisation',
                  style: const TextStyle(
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
                    // ── Image principale ──
                    _sectionTitle('Photo principale'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    ImagePickerWidget(
                      currentImageUrl:
                          _mainImageData != null &&
                              !_mainImageData!.startsWith('data:')
                          ? _mainImageData
                          : null,
                      onImageSelected: (data) =>
                          setState(() => _mainImageData = data),
                      label: 'Choisir la photo principale',
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),

                    // ── Titre et description ──
                    _sectionTitle('Informations'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    TextFormField(
                      controller: _titleController,
                      decoration: _inputDecoration('Titre *', Icons.title),
                      textCapitalization: TextCapitalization.sentences,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Requis' : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    TextFormField(
                      controller: _descriptionController,
                      decoration: _inputDecoration(
                        'Description (optionnel)',
                        Icons.description,
                      ),
                      maxLines: 3,
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),

                    // ── Catégorie ──
                    _sectionTitle('Catégorie'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    Wrap(
                      spacing: MaasgaTokens.spacingSm,
                      children: _categories.map((c) {
                        final isSelected = _category == c['value'];
                        return ChoiceChip(
                          label: Text('${c['icon']} ${c['label']}'),
                          selected: isSelected,
                          onSelected: (_) =>
                              setState(() => _category = c['value']!),
                          selectedColor: AdminTheme.primary.withValues(
                            alpha: 0.2,
                          ),
                          labelStyle: TextStyle(
                            color: isSelected
                                ? AdminTheme.primary
                                : AdminTheme.textSecondary,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),

                    // ── Localisation et client ──
                    _sectionTitle('Détails du projet'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    TextFormField(
                      controller: _locationController,
                      decoration: _inputDecoration(
                        'Ville / Quartier',
                        Icons.location_on,
                      ),
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    TextFormField(
                      controller: _clientNameController,
                      decoration: _inputDecoration(
                        'Nom du client (optionnel)',
                        Icons.person,
                      ),
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),

                    // Date de réalisation
                    InkWell(
                      onTap: _pickDate,
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusMd,
                      ),
                      child: InputDecorator(
                        decoration: _inputDecoration(
                          'Date de réalisation',
                          Icons.calendar_today,
                        ),
                        child: Text(
                          _completionDate != null
                              ? '${_completionDate!.day.toString().padLeft(2, '0')}/${_completionDate!.month.toString().padLeft(2, '0')}/${_completionDate!.year}'
                              : 'Sélectionner une date',
                          style: TextStyle(
                            fontSize: 14,
                            color: _completionDate != null
                                ? AdminTheme.textPrimary
                                : AdminTheme.textSecondary,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: MaasgaTokens.spacingMd),

                    // Mise en avant
                    SwitchListTile(
                      value: _isFeatured,
                      onChanged: (v) => setState(() => _isFeatured = v),
                      title: const Text('Mettre en avant'),
                      subtitle: const Text('Afficher en priorité sur le site'),
                      activeThumbColor: AdminTheme.warning,
                      contentPadding: EdgeInsets.zero,
                      secondary: Icon(
                        Icons.star,
                        color: _isFeatured
                            ? AdminTheme.warning
                            : AdminTheme.textSecondary,
                      ),
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
                            : Text(
                                _isEditing
                                    ? 'Enregistrer'
                                    : 'Créer la réalisation',
                                style: const TextStyle(
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

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _completionDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked != null) setState(() => _completionDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final data = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        'category': _category,
        'location': _locationController.text.trim().isEmpty
            ? null
            : _locationController.text.trim(),
        'client_name': _clientNameController.text.trim().isEmpty
            ? null
            : _clientNameController.text.trim(),
        'completion_date': _completionDate != null
            ? '${_completionDate!.year}-${_completionDate!.month.toString().padLeft(2, '0')}-${_completionDate!.day.toString().padLeft(2, '0')}'
            : null,
        'featured': _isFeatured ? 1 : 0,
        'status': 'published',
        if (_mainImageData != null) 'image': _mainImageData,
      };

      if (_isEditing) {
        await ref.read(
          updateRealisationProvider({
            'id': widget.realisation!.id,
            ...data,
          }).future,
        );
      } else {
        await ref.read(createRealisationProvider(data).future);
      }

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isEditing
                  ? 'Réalisation modifiée avec succès'
                  : 'Réalisation créée avec succès',
            ),
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
      contentPadding: const EdgeInsets.symmetric(
        horizontal: MaasgaTokens.spacingMd,
        vertical: MaasgaTokens.spacingMd,
      ),
    );
  }
}
