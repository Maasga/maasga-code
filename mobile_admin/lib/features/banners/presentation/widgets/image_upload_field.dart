import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../data/providers/brand_provider.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';

/// Widget réutilisable : sélectionne une image depuis la galerie,
/// la téléverse sur ImgBB via [/api/mobile/admin/upload/image] et
/// expose l'URL finale via [onUrlChanged].
class ImageUploadField extends ConsumerStatefulWidget {
  /// URL de l'image actuelle (null si aucune image)
  final String? currentUrl;

  /// Appelé avec la nouvelle URL ImgBB après upload réussi
  final ValueChanged<String> onUrlChanged;

  /// Hauteur de la zone de prévisualisation
  final double previewHeight;

  const ImageUploadField({
    super.key,
    this.currentUrl,
    required this.onUrlChanged,
    this.previewHeight = 160,
  });

  @override
  ConsumerState<ImageUploadField> createState() => _ImageUploadFieldState();
}

class _ImageUploadFieldState extends ConsumerState<ImageUploadField> {
  final ImagePicker _picker = ImagePicker();
  File? _localFile;
  String? _uploadedUrl;
  bool _isUploading = false;
  String? _uploadError;

  String? get _displayUrl => _uploadedUrl ?? widget.currentUrl;

  @override
  void initState() {
    super.initState();
    _uploadedUrl = widget.currentUrl;
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

      setState(() {
        _isUploading = true;
        _uploadError = null;
        _localFile = File(picked.path);
      });

      // Upload via provider
      final url = await ref.read(
        uploadBrandImageProvider(File(picked.path)).future,
      );

      setState(() {
        _uploadedUrl = url;
        _isUploading = false;
      });

      widget.onUrlChanged(url);
    } catch (e) {
      setState(() {
        _isUploading = false;
        _uploadError = 'Erreur upload: $e';
        _localFile = null;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur upload image: $e'),
            backgroundColor: AdminTheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasImage = _localFile != null || _displayUrl != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Zone de prévisualisation ──────────────────────────────
        GestureDetector(
          onTap: _isUploading ? null : _pickAndUpload,
          child: Container(
            height: widget.previewHeight,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AdminTheme.background,
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
              border: Border.all(
                color: _uploadError != null
                    ? AdminTheme.error
                    : AdminTheme.border,
              ),
            ),
            child: _isUploading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 8),
                        Text(
                          'Upload en cours…',
                          style: TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  )
                : hasImage
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                    child: _localFile != null && _uploadedUrl == null
                        // Prévisualisation locale avant upload
                        ? Image.file(
                            _localFile!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                          )
                        // Image uploadée ou existante
                        : Image.network(
                            _displayUrl!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            errorBuilder: (_, _, _) => _placeholder(),
                          ),
                  )
                : _placeholder(),
          ),
        ),
        if (_uploadError != null) ...[
          const SizedBox(height: 4),
          Text(
            _uploadError!,
            style: const TextStyle(color: AdminTheme.error, fontSize: 12),
          ),
        ],
        const SizedBox(height: MaasgaTokens.spacingSm),
        // ── Bouton ───────────────────────────────────────────────
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _isUploading ? null : _pickAndUpload,
            icon: _isUploading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.photo_library, size: 18),
            label: Text(
              _isUploading
                  ? 'Upload en cours…'
                  : hasImage
                  ? 'Changer l\'image'
                  : 'Choisir une image',
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AdminTheme.primary,
              side: BorderSide(
                color: _uploadError != null
                    ? AdminTheme.error
                    : AdminTheme.primary,
              ),
              padding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
      ],
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
          'Appuyer pour choisir',
          style: TextStyle(fontSize: 12, color: AdminTheme.textSecondary),
        ),
      ],
    );
  }
}
