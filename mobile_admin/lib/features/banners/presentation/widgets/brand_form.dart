import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/brand.dart';
import '../../data/providers/brand_provider.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import 'image_upload_field.dart';

class BrandForm extends ConsumerStatefulWidget {
  final Brand? brand;
  final Function(Brand) onSave;

  const BrandForm({super.key, this.brand, required this.onSave});

  @override
  ConsumerState<BrandForm> createState() => _BrandFormState();
}

class _BrandFormState extends ConsumerState<BrandForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _assetKeyController = TextEditingController();
  final _displayOrderController = TextEditingController(text: '0');
  bool _isActive = true;
  String? _logoUrl;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.brand != null) {
      _nameController.text = widget.brand!.name;
      _assetKeyController.text = widget.brand!.assetKey ?? '';
      _displayOrderController.text = widget.brand!.displayOrder.toString();
      _isActive = widget.brand!.isActive;
      _logoUrl = widget.brand!.logoUrl;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _assetKeyController.dispose();
    _displayOrderController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final data = {
      'name': _nameController.text.trim(),
      'asset_key': _assetKeyController.text.trim().isEmpty
          ? null
          : _assetKeyController.text.trim().toLowerCase(),
      'logo_url': _logoUrl?.trim().isEmpty ?? true ? null : _logoUrl,
      'display_order': int.tryParse(_displayOrderController.text) ?? 0,
      'is_active': _isActive,
    };

    try {
      Brand savedBrand;
      if (widget.brand != null) {
        await ref.read(
          updateBrandProvider((id: widget.brand!.id, data: data)).future,
        );
        savedBrand = widget.brand!.copyWith(
          name: data['name'] as String,
          assetKey: data['asset_key'] as String?,
          logoUrl: data['logo_url'] as String?,
          displayOrder: data['display_order'] as int,
          isActive: data['is_active'] as bool,
        );
      } else {
        savedBrand = await ref.read(createBrandProvider(data).future);
      }

      if (mounted) {
        widget.onSave(savedBrand);
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.brand != null ? 'Marque mise à jour' : 'Marque créée',
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
          // ── Logo ──────────────────────────────────────────────────
          const Text(
            'Logo de la marque',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          ImageUploadField(
            currentUrl: _logoUrl,
            previewHeight: 140,
            onUrlChanged: (url) => setState(() => _logoUrl = url),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          // ── Nom ───────────────────────────────────────────────────
          TextFormField(
            controller: _nameController,
            decoration: AdminTheme.inputDecoration('Nom de la marque *'),
            textCapitalization: TextCapitalization.characters,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Le nom est requis';
              }
              return null;
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          // ── Asset key ─────────────────────────────────────────────
          TextFormField(
            controller: _assetKeyController,
            decoration: AdminTheme.inputDecoration(
              'Clé asset (ex: samsung)',
            ),
            keyboardType: TextInputType.text,
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          // ── Ordre d'affichage ─────────────────────────────────────
          TextFormField(
            controller: _displayOrderController,
            decoration: AdminTheme.inputDecoration("Ordre d'affichage"),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          // ── Statut ────────────────────────────────────────────────
          SwitchListTile(
            title: const Text('Active'),
            subtitle: const Text('Afficher la marque sur le site'),
            value: _isActive,
            onChanged: (value) => setState(() => _isActive = value),
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),
          // ── Bouton ────────────────────────────────────────────────
          ElevatedButton(
            onPressed: _isSaving ? null : _submit,
            style: AdminTheme.primaryButtonStyle,
            child: _isSaving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    widget.brand != null ? 'Mettre à jour' : 'Créer',
                  ),
          ),
        ],
      ),
    );
  }
}
