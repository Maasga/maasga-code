import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/banner.dart' as banner_model;
import '../../data/providers/banner_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

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
              widget.banner != null ? 'Bannière mise à jour' : 'Bannière créée',
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
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
        children: [
          TextFormField(
            controller: _titleController,
            decoration: AdminTheme.inputDecoration('Titre *'),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Le titre est requis';
              }
              return null;
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _subtitleController,
            decoration: AdminTheme.inputDecoration('Sous-titre'),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _imageUrlController,
            decoration: AdminTheme.inputDecoration('URL de l\'image *'),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'L\'URL de l\'image est requise';
              }
              return null;
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _targetPageController,
            decoration: AdminTheme.inputDecoration(
              'Page cible (ex: /catalogue)',
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _displayOrderController,
            decoration: AdminTheme.inputDecoration('Ordre d\'affichage'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          SwitchListTile(
            title: const Text('Actif'),
            subtitle: const Text('Afficher la bannière sur le site'),
            value: _isActive,
            onChanged: (value) {
              setState(() {
                _isActive = value;
              });
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),
          ElevatedButton(
            onPressed: _submit,
            style: AdminTheme.primaryButtonStyle,
            child: Text(widget.banner != null ? 'Mettre à jour' : 'Créer'),
          ),
        ],
      ),
    );
  }
}
