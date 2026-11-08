import 'dart:convert';
import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/admin_theme.dart';
import '../../features/banners/data/providers/brand_provider.dart';
import '../design_tokens/maasga_tokens.dart';

/// Widget réutilisable pour choisir, téléverser vers le serveur R2 et prévisualiser une image.
/// Dès la sélection, l'image est uploadée via [uploadBrandImageProvider] et
/// [onImageSelected] est appelé avec l'URL publique finale (ex: https://maasga-website.pages.dev/media/...).
class ImagePickerWidget extends ConsumerStatefulWidget {
  /// URL réseau actuelle (ou data: URL legacy)
  final String? currentImageUrl;

  /// Appelé avec l'URL publique de l'image après upload réussi.
  final ValueChanged<String> onImageSelected;

  /// Libellé du bouton, ex. "Choisir une image"
  final String label;

  /// Hauteur de la zone de prévisualisation
  final double previewHeight;

  const ImagePickerWidget({
    super.key,
    this.currentImageUrl,
    required this.onImageSelected,
    this.label = 'Choisir une image',
    this.previewHeight = 160,
  });

  @override
  ConsumerState<ImagePickerWidget> createState() => _ImagePickerWidgetState();
}

class _ImagePickerWidgetState extends ConsumerState<ImagePickerWidget> {
  final ImagePicker _picker = ImagePicker();
  File? _localFile;
  String? _uploadedUrl;
  bool _isLoading = false;

  String? get _displayUrl => _uploadedUrl ?? widget.currentImageUrl;

  @override
  void initState() {
    super.initState();
    _uploadedUrl = widget.currentImageUrl;
  }

  @override
  Widget build(BuildContext context) {
    final hasImage =
        _localFile != null ||
        (_displayUrl != null && _displayUrl!.trim().isNotEmpty);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Prévisualisation ──
        GestureDetector(
          onTap: _isLoading ? null : _pickAndUpload,
          child: Container(
            height: widget.previewHeight,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AdminTheme.background,
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
              border: Border.all(
                color: AdminTheme.border,
                style: BorderStyle.solid,
              ),
            ),
            child: _isLoading
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const CircularProgressIndicator(
                        color: AdminTheme.primary,
                      ),
                      const SizedBox(height: MaasgaTokens.spacingSm),
                      Text(
                        'Téléversement de l\'image...',
                        style: TextStyle(
                          fontSize: 12,
                          color: AdminTheme.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  )
                : hasImage
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                    child: _buildPreview(),
                  )
                : _placeholder(),
          ),
        ),
        const SizedBox(height: MaasgaTokens.spacingSm),
        // ── Bouton ──
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _isLoading ? null : _pickAndUpload,
            icon: _isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.photo_library, size: 18),
            label: Text(
              _isLoading
                  ? 'Téléversement...'
                  : (hasImage ? 'Changer l\'image' : widget.label),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AdminTheme.primary,
              side: const BorderSide(color: AdminTheme.primary),
              padding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPreview() {
    if (_localFile != null) {
      return Image.file(_localFile!, fit: BoxFit.cover, width: double.infinity);
    }

    final url = _displayUrl ?? '';
    if (url.startsWith('data:image')) {
      try {
        final base64Str = url.split(',').last;
        return Image.memory(
          base64Decode(base64Str),
          fit: BoxFit.cover,
          width: double.infinity,
          errorBuilder: (_, _, _) => _placeholder(),
        );
      } catch (_) {
        return _placeholder();
      }
    }

    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      width: double.infinity,
      placeholder: (_, _) =>
          const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      errorWidget: (_, _, _) => _placeholder(),
    );
  }

  Widget _placeholder() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.add_photo_alternate_outlined,
          size: 40,
          color: AdminTheme.textSecondary,
        ),
        const SizedBox(height: MaasgaTokens.spacingSm),
        Text(
          'Appuyer pour choisir et envoyer',
          style: TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
        ),
      ],
    );
  }

  Future<void> _pickAndUpload() async {
    try {
      final XFile? picked = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (picked == null) return;

      setState(() => _isLoading = true);

      final file = File(picked.path);

      // Téléversement vers R2 via le backend mobile admin
      final uploadedUrl = await ref.read(uploadBrandImageProvider(file).future);

      if (!mounted) return;

      setState(() {
        _localFile = file;
        _uploadedUrl = uploadedUrl;
        _isLoading = false;
      });

      widget.onImageSelected(uploadedUrl);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Image téléversée avec succès !'),
          backgroundColor: AdminTheme.success,
          duration: Duration(seconds: 2),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Échec de l\'envoi de l\'image: $e'),
          backgroundColor: AdminTheme.error,
        ),
      );
    }
  }
}
