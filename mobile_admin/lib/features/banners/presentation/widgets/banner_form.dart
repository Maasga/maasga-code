import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/banner.dart' as banner_model;
import '../../data/providers/banner_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import 'image_upload_field.dart';

class BannerForm extends ConsumerStatefulWidget {
  final banner_model.Banner? banner;
  final Function(banner_model.Banner) onSave;

  const BannerForm({super.key, this.banner, required this.onSave});

  @override
  ConsumerState<BannerForm> createState() => _BannerFormState();
}

class _BannerFormState extends ConsumerState<BannerForm> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _subtitleController = TextEditingController();
  final _imageUrlController = TextEditingController();
  final _targetPageController = TextEditingController();
  final _displayOrderController = TextEditingController(text: '0');
  bool _isActive = true;
  bool _isSaving = false;

  final List<Map<String, String>> _suggestedPages = [
    {'path': '/catalog', 'label': 'Catalogue produits'},
    {'path': '/maintenance', 'label': 'Contrats entretien'},
    {'path': '/rdv', 'label': 'Prendre rendez-vous'},
    {'path': '/simulator', 'label': 'Simulateur BTU'},
    {'path': '/support', 'label': 'Service après-vente'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.banner != null) {
      _titleController.text = widget.banner!.title;
      _subtitleController.text = widget.banner!.subtitle ?? '';
      _imageUrlController.text = widget.banner!.imageUrl;
      _targetPageController.text = widget.banner!.targetPage ?? '';
      _displayOrderController.text = widget.banner!.displayOrder.toString();
      _isActive = widget.banner!.isActive;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _subtitleController.dispose();
    _imageUrlController.dispose();
    _targetPageController.dispose();
    _displayOrderController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_imageUrlController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez uploader ou renseigner l\'image de la bannière'),
          backgroundColor: AdminTheme.error,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    final data = {
      'title': _titleController.text.trim(),
      'subtitle': _subtitleController.text.trim().isEmpty
          ? null
          : _subtitleController.text.trim(),
      'image_url': _imageUrlController.text.trim(),
      'target_page': _targetPageController.text.trim().isEmpty
          ? null
          : _targetPageController.text.trim(),
      'display_order': int.tryParse(_displayOrderController.text) ?? 0,
      'is_active': _isActive,
    };

    try {
      banner_model.Banner savedBanner;
      if (widget.banner != null) {
        await ref.read(
          updateBannerProvider((id: widget.banner!.id, data: data)).future,
        );
        savedBanner = banner_model.Banner.fromJson({
          ...data,
          'id': widget.banner!.id,
        });
      } else {
        savedBanner = await ref.read(createBannerProvider(data).future);
      }

      if (mounted) {
        widget.onSave(savedBanner);
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.banner != null ? 'Bannière mise à jour avec succès' : 'Bannière créée avec succès',
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
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
        children: [
          // ── 1. Upload d'image de la bannière ──────────────────────
          const Text(
            'Image de la bannière carrousel *',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 4),
          const Text(
            'Choisissez une photo depuis votre galerie mobile ou saisissez son URL',
            style: TextStyle(color: AdminTheme.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          ImageUploadField(
            currentUrl: _imageUrlController.text.isNotEmpty ? _imageUrlController.text : null,
            previewHeight: 180,
            onUrlChanged: (url) {
              setState(() {
                _imageUrlController.text = url;
              });
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          TextFormField(
            controller: _imageUrlController,
            decoration: AdminTheme.inputDecoration('Ou coller l\'URL de l\'image https://...').copyWith(
              suffixIcon: _imageUrlController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () => setState(() => _imageUrlController.clear()),
                    )
                  : null,
            ),
            onChanged: (_) => setState(() {}),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'L\'image de la bannière est requise';
              }
              return null;
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),

          // ── 2. Informations textuelles ────────────────────────────
          TextFormField(
            controller: _titleController,
            decoration: AdminTheme.inputDecoration('Titre principal de la bannière *').copyWith(
              hintText: 'Ex: Soldes d\'été ou Climatiseurs Inverter',
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Le titre est requis';
              }
              return null;
            },
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _subtitleController,
            decoration: AdminTheme.inputDecoration('Sous-titre / Message promotionnel').copyWith(
              hintText: 'Ex: Jusqu\'à 30% de réduction immédiate',
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),

          // ── 3. Page cible (redirection au clic) ───────────────────
          const Text(
            'Page cible (Redirection au clic)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _suggestedPages.map((p) {
              final isSelected = _targetPageController.text.trim() == p['path'];
              return ChoiceChip(
                label: Text(p['label']!),
                selected: isSelected,
                selectedColor: AdminTheme.primary.withValues(alpha: 0.15),
                labelStyle: TextStyle(
                  color: isSelected ? AdminTheme.primary : AdminTheme.textSecondary,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  fontSize: 12,
                ),
                onSelected: (selected) {
                  setState(() {
                    _targetPageController.text = selected ? p['path']! : '';
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          TextFormField(
            controller: _targetPageController,
            decoration: AdminTheme.inputDecoration('Lien personnalisé (ex: /catalog ou /maintenance)'),
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),

          // ── 4. Ordre et Statut ────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _displayOrderController,
                  decoration: AdminTheme.inputDecoration('Ordre d\'affichage'),
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AdminTheme.background,
                    borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                    border: Border.all(color: AdminTheme.border),
                  ),
                  child: SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Active', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    subtitle: Text(
                      _isActive ? 'Visible' : 'Masquée',
                      style: TextStyle(
                        fontSize: 11,
                        color: _isActive ? AdminTheme.success : AdminTheme.textSecondary,
                      ),
                    ),
                    value: _isActive,
                    activeColor: AdminTheme.primary,
                    onChanged: (val) => setState(() => _isActive = val),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingXl),

          // ── 5. Bouton Enregistrer ─────────────────────────────────
          ElevatedButton(
            onPressed: _isSaving ? null : _submit,
            style: AdminTheme.primaryButtonStyle.copyWith(
              padding: WidgetStateProperty.all(const EdgeInsets.symmetric(vertical: 14)),
            ),
            child: _isSaving
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.cloud_upload_outlined, color: Colors.white, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        widget.banner != null ? 'Mettre à jour la bannière' : 'Publier la bannière',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ],
                  ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
