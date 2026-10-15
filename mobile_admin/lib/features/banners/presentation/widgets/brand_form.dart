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
  final _logoUrlController = TextEditingController();
  bool _isActive = true;
  String? _logoUrl;
  bool _isSaving = false;

  final List<String> _commonBrands = [
    'LG',
    'SAMSUNG',
    'DAIKIN',
    'MIDEA',
    'GREE',
    'CARRIER',
    'TCL',
    'HISENSE',
    'PANASONIC',
    'AIRWELL',
    'NASCO',
    'GENERAL',
    'MITSUBISHI',
    'TOSHIBA',
    'BOREAL',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.brand != null) {
      _nameController.text = widget.brand!.name;
      _assetKeyController.text = widget.brand!.assetKey ?? '';
      _displayOrderController.text = widget.brand!.displayOrder.toString();
      _isActive = widget.brand!.isActive;
      _logoUrl = widget.brand!.logoUrl;
      _logoUrlController.text = widget.brand!.logoUrl ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _assetKeyController.dispose();
    _displayOrderController.dispose();
    _logoUrlController.dispose();
    super.dispose();
  }

  void _selectBrandPreset(String brandName) {
    setState(() {
      _nameController.text = brandName;
      _assetKeyController.text = brandName.toLowerCase();
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final finalLogoUrl = _logoUrlController.text.trim().isNotEmpty
        ? _logoUrlController.text.trim()
        : _logoUrl?.trim();

    final data = {
      'name': _nameController.text.trim().toUpperCase(),
      'asset_key': _assetKeyController.text.trim().isEmpty
          ? null
          : _assetKeyController.text.trim().toLowerCase(),
      'logo_url': (finalLogoUrl == null || finalLogoUrl.isEmpty) ? null : finalLogoUrl,
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
              widget.brand != null ? 'Marque mise à jour avec succès' : 'Marque créée avec succès',
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
          // ── Suggestions rapides de marques ───────────────────────
          const Text(
            'Suggestions rapides de climatiseurs :',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          ),
          const SizedBox(height: 6),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _commonBrands.map((b) {
                final isSelected = _nameController.text.trim().toUpperCase() == b;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ActionChip(
                    label: Text(b),
                    backgroundColor: isSelected
                        ? AdminTheme.primary
                        : AdminTheme.primary.withValues(alpha: 0.08),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AdminTheme.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    onPressed: () => _selectBrandPreset(b),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),

          // ── 1. Logo ──────────────────────────────────────────────
          const Text(
            'Logo de la marque (Mise en ligne)',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 4),
          const Text(
            'Mettez en ligne le logo officiel de la marque (PNG transparent conseillé)',
            style: TextStyle(color: AdminTheme.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          ImageUploadField(
            currentUrl: _logoUrlController.text.isNotEmpty ? _logoUrlController.text : _logoUrl,
            previewHeight: 140,
            onUrlChanged: (url) {
              setState(() {
                _logoUrl = url;
                _logoUrlController.text = url;
              });
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          TextFormField(
            controller: _logoUrlController,
            decoration: AdminTheme.inputDecoration('Ou URL du logo https://...').copyWith(
              suffixIcon: _logoUrlController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () => setState(() {
                        _logoUrlController.clear();
                        _logoUrl = null;
                      }),
                    )
                  : null,
            ),
            onChanged: (val) => setState(() => _logoUrl = val),
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),

          // ── 2. Nom de la marque ──────────────────────────────────
          TextFormField(
            controller: _nameController,
            decoration: AdminTheme.inputDecoration('Nom de la marque *').copyWith(
              hintText: 'Ex: DAIKIN, LG, SAMSUNG...',
            ),
            textCapitalization: TextCapitalization.characters,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Le nom est requis';
              }
              return null;
            },
            onChanged: (val) {
              if (_assetKeyController.text.isEmpty ||
                  _assetKeyController.text == val.substring(0, val.length - 1).toLowerCase()) {
                _assetKeyController.text = val.trim().toLowerCase();
              }
              setState(() {});
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),

          // ── 3. Clé asset Flutter ─────────────────────────────────
          TextFormField(
            controller: _assetKeyController,
            decoration: AdminTheme.inputDecoration('Clé asset Flutter (optionnel)').copyWith(
              hintText: 'Ex: daikin, lg, samsung (pour assets/brands/<cle>.png)',
            ),
            keyboardType: TextInputType.text,
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),

          // ── 4. Ordre et Statut ───────────────────────────────────
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _displayOrderController,
                  decoration: AdminTheme.inputDecoration("Ordre d'affichage"),
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
                    title: const Text('Visible', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    subtitle: Text(
                      _isActive ? 'Affichée' : 'Masquée',
                      style: TextStyle(
                        fontSize: 11,
                        color: _isActive ? AdminTheme.success : AdminTheme.textSecondary,
                      ),
                    ),
                    value: _isActive,
                    activeColor: AdminTheme.primary,
                    onChanged: (value) => setState(() => _isActive = value),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingXl),

          // ── 5. Bouton Enregistrer ────────────────────────────────
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
                      const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        widget.brand != null ? 'Mettre à jour la marque' : 'Enregistrer la marque',
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
