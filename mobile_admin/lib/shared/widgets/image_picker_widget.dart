import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/admin_theme.dart';
import '../design_tokens/maasga_tokens.dart';

/// Widget réutilisable pour choisir et prévisualiser une image.
/// Encode la sélection en base64 et appelle [onImageSelected] avec
/// la chaîne `data:image/jpeg;base64,...` ou l'URL réseau existante.
class ImagePickerWidget extends StatefulWidget {
  /// URL réseau actuelle (peut être null si pas d'image)
  final String? currentImageUrl;

  /// Appelé quand l'utilisateur choisit une image depuis la galerie.
  /// Reçoit la chaîne base64 `data:image/jpeg;base64,...`.
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
  State<ImagePickerWidget> createState() => _ImagePickerWidgetState();
}

class _ImagePickerWidgetState extends State<ImagePickerWidget> {
  final ImagePicker _picker = ImagePicker();
  File? _localFile;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final hasImage = _localFile != null || widget.currentImageUrl != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Prévisualisation ──
        GestureDetector(
          onTap: _pick,
          child: Container(
            height: widget.previewHeight,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AdminTheme.background,
              borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
              border: Border.all(
                color: AdminTheme.border,
                style: hasImage ? BorderStyle.solid : BorderStyle.solid,
              ),
            ),
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : hasImage
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                    child: _localFile != null
                        ? Image.file(
                            _localFile!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                          )
                        : Image.network(
                            widget.currentImageUrl!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            errorBuilder: (_, _, _) => _placeholder(),
                          ),
                  )
                : _placeholder(),
          ),
        ),
        const SizedBox(height: MaasgaTokens.spacingSm),
        // ── Bouton ──
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _isLoading ? null : _pick,
            icon: const Icon(Icons.photo_library, size: 18),
            label: Text(hasImage ? 'Changer l\'image' : widget.label),
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

  Future<void> _pick() async {
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
      final bytes = await file.readAsBytes();
      final ext = picked.path.split('.').last.toLowerCase();
      final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
      final base64Str = base64Encode(bytes);
      final dataUrl = 'data:$mime;base64,$base64Str';

      setState(() {
        _localFile = file;
        _isLoading = false;
      });

      widget.onImageSelected(dataUrl);
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de la sélection: $e'),
            backgroundColor: AdminTheme.error,
          ),
        );
      }
    }
  }
}
