import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../data/models/brand_media_image.dart';
import '../../data/models/product.dart';
import '../../data/providers/brand_media_provider.dart';
import '../../data/providers/product_provider.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';

class MediathequeScreen extends ConsumerStatefulWidget {
  const MediathequeScreen({super.key});

  @override
  ConsumerState<MediathequeScreen> createState() => _MediathequeScreenState();
}

class _MediathequeScreenState extends ConsumerState<MediathequeScreen> {
  final ImagePicker _picker = ImagePicker();
  final TextEditingController _brandController = TextEditingController(text: 'LG');
  final TextEditingController _labelController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  final List<String> _popularBrands = [
    'LG',
    'Samsung',
    'Daikin',
    'Midea',
    'Panasonic',
    'Gree',
    'Hisense',
    'TCL',
    'Airwell',
    'Carrier',
    'Nasco',
    'General',
    'Mitsubishi',
    'Toshiba',
  ];

  String _selectedBrandFilter = '';
  List<File> _selectedFiles = [];
  bool _isUploading = false;
  int _uploadProgress = 0;
  int _totalToUpload = 0;
  bool _showUploadPanel = true;

  @override
  void dispose() {
    _brandController.dispose();
    _labelController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    try {
      final List<XFile> pickedList = await _picker.pickMultiImage(
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (pickedList.isNotEmpty) {
        setState(() {
          _selectedFiles = pickedList.map((x) => File(x.path)).toList();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur sélection photos: $e'),
            backgroundColor: AdminTheme.error,
          ),
        );
      }
    }
  }

  Future<void> _startBulkUpload() async {
    final brand = _brandController.text.trim().toUpperCase();
    if (brand.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez spécifier la marque des climatiseurs.'),
          backgroundColor: AdminTheme.warning,
        ),
      );
      return;
    }

    if (_selectedFiles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner au moins une photo.'),
          backgroundColor: AdminTheme.warning,
        ),
      );
      return;
    }

    setState(() {
      _isUploading = true;
      _uploadProgress = 0;
      _totalToUpload = _selectedFiles.length;
    });

    final repo = ref.read(brandMediaRepositoryProvider);
    final label = _labelController.text.trim();
    int successCount = 0;
    int errorCount = 0;

    for (int i = 0; i < _selectedFiles.length; i++) {
      try {
        await repo.uploadMediaImage(
          brand: brand,
          file: _selectedFiles[i],
          label: label.isEmpty ? null : label,
        );
        successCount++;
      } catch (_) {
        errorCount++;
      }
      if (mounted) {
        setState(() {
          _uploadProgress = i + 1;
        });
      }
    }

    if (mounted) {
      setState(() {
        _isUploading = false;
        _selectedFiles = [];
        _labelController.clear();
      });
      ref.invalidate(brandMediaImagesProvider);

      if (errorCount == 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$successCount image(s) ajoutée(s) à la médiathèque pour $brand !'),
            backgroundColor: AdminTheme.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$successCount uploadées, $errorCount échec(s)'),
            backgroundColor: AdminTheme.warning,
          ),
        );
      }
    }
  }

  void _showAssignSheet(BrandMediaImage media, List<Product> products) {
    String scope = 'brand'; // 'brand' or 'single'
    String target = 'main'; // 'main' or 'gallery'
    int? selectedProductId = products.isNotEmpty ? int.tryParse(products.first.id) : null;

    final matchingProducts = products
        .where((p) => p.brand.trim().toUpperCase() == media.brand.trim().toUpperCase())
        .toList();

    if (matchingProducts.isNotEmpty) {
      selectedProductId = int.tryParse(matchingProducts.first.id);
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            top: 16,
            left: 20,
            right: 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.link, color: AdminTheme.primary),
                    const SizedBox(width: 8),
                    const Text(
                      'Affecter l\'image',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.purple.shade50,
                        border: Border.all(color: Colors.purple.shade200),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        media.brand,
                        style: TextStyle(
                          color: Colors.purple.shade700,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Aperçu image
                Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      height: 120,
                      width: 160,
                      color: Colors.grey[100],
                      child: CachedNetworkImage(
                        imageUrl: media.url,
                        fit: BoxFit.cover,
                        placeholder: (_, _) => const Center(child: CircularProgressIndicator()),
                        errorWidget: (_, _, _) => const Icon(Icons.broken_image, size: 40),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Portée de l\'affectation :',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 8),
                // Radio Option 1: Tous les climatiseurs de la marque
                InkWell(
                  onTap: () => setModalState(() => scope = 'brand'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: scope == 'brand' ? Colors.purple.shade50 : Colors.white,
                      border: Border.all(
                        color: scope == 'brand' ? Colors.purple : Colors.grey.shade300,
                        width: scope == 'brand' ? 1.5 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Radio<String>(
                          value: 'brand',
                          groupValue: scope,
                          onChanged: (v) => setModalState(() => scope = v!),
                          activeColor: Colors.purple,
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Tous les climatiseurs ${media.brand} (Groupé)',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              Text(
                                '${matchingProducts.length} climatiseur(s) ${media.brand} détecté(s)',
                                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                // Radio Option 2: Un seul produit
                InkWell(
                  onTap: () => setModalState(() => scope = 'single'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: scope == 'single' ? Colors.purple.shade50 : Colors.white,
                      border: Border.all(
                        color: scope == 'single' ? Colors.purple : Colors.grey.shade300,
                        width: scope == 'single' ? 1.5 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Radio<String>(
                          value: 'single',
                          groupValue: scope,
                          onChanged: (v) => setModalState(() => scope = v!),
                          activeColor: Colors.purple,
                        ),
                        const Expanded(
                          child: Text(
                            'Un seul climatiseur spécifique',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (scope == 'single') ...[
                  const SizedBox(height: 12),
                  DropdownButtonFormField<int>(
                    value: selectedProductId,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Sélectionner le climatiseur',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    items: (matchingProducts.isNotEmpty ? matchingProducts : products).map((p) {
                      final pIdInt = int.tryParse(p.id) ?? 0;
                      return DropdownMenuItem<int>(
                        value: pIdInt,
                        child: Text(
                          '${p.name} (${p.brand})',
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12),
                        ),
                      );
                    }).toList(),
                    onChanged: (v) => setModalState(() => selectedProductId = v),
                  ),
                ],
                const SizedBox(height: 20),
                const Text(
                  'Utiliser comme :',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => setModalState(() => target = 'main'),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                          decoration: BoxDecoration(
                            color: target == 'main' ? Colors.blue.shade50 : Colors.grey.shade50,
                            border: Border.all(
                              color: target == 'main' ? AdminTheme.primary : Colors.grey.shade300,
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.image,
                                size: 18,
                                color: target == 'main' ? AdminTheme.primary : Colors.grey,
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Image principale',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: InkWell(
                        onTap: () => setModalState(() => target = 'gallery'),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                          decoration: BoxDecoration(
                            color: target == 'gallery' ? Colors.blue.shade50 : Colors.grey.shade50,
                            border: Border.all(
                              color: target == 'gallery' ? AdminTheme.primary : Colors.grey.shade300,
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.photo_library,
                                size: 18,
                                color: target == 'gallery' ? AdminTheme.primary : Colors.grey,
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Galerie photos',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Bouton validation
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple.shade700,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.check_circle_outline, size: 20),
                    label: Text(
                      scope == 'brand'
                          ? 'Appliquer à TOUS les ${media.brand}'
                          : 'Affecter à ce climatiseur',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    onPressed: () async {
                      Navigator.pop(ctx);
                      try {
                        final msg = await ref.read(
                          assignBrandMediaProvider((
                            mediaId: media.id,
                            scope: scope,
                            productId: scope == 'single' ? selectedProductId : null,
                            target: target,
                          )).future,
                        );
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(msg),
                              backgroundColor: AdminTheme.success,
                            ),
                          );
                          ref.invalidate(productsProvider);
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
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmDelete(BrandMediaImage media) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer de la médiathèque ?'),
        content: Text('Voulez-vous supprimer cette photo associée à la marque "${media.brand}" ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AdminTheme.error),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(deleteBrandMediaProvider(media.id).future);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Image supprimée de la médiathèque'),
                      backgroundColor: AdminTheme.success,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erreur suppression: $e'),
                      backgroundColor: AdminTheme.error,
                    ),
                  );
                }
              }
            },
            child: const Text('Supprimer', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaAsync = ref.watch(brandMediaImagesProvider(_selectedBrandFilter.isEmpty ? null : _selectedBrandFilter));
    final productsAsync = ref.watch(productsProvider);
    final products = productsAsync.asData?.value ?? [];

    return Scaffold(
      backgroundColor: AdminTheme.background,
      appBar: AppBar(
        title: const Text(
          'Médiathèque de groupe',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AdminTheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AdminTheme.primary),
            tooltip: 'Actualiser',
            onPressed: () => ref.invalidate(brandMediaImagesProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(brandMediaImagesProvider),
        child: CustomScrollView(
          slivers: [
            // Section 1: Panneau d'upload groupé
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.all(MaasgaTokens.spacingMd),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.purple.shade200),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.purple.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header pliable
                    InkWell(
                      onTap: () => setState(() => _showUploadPanel = !_showUploadPanel),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.purple.shade50,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.cloud_upload_outlined, color: Colors.purple.shade700, size: 22),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Mise en ligne groupée par marque',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  Text(
                                    'Ajoutez plusieurs photos pour LG, Samsung, etc.',
                                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                  ),
                                ],
                              ),
                            ),
                            Icon(
                              _showUploadPanel ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                              color: Colors.grey[600],
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (_showUploadPanel) ...[
                      const Divider(height: 1),
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Choix marque
                            const Text(
                              'Marque des climatiseurs cible :',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                            const SizedBox(height: 8),
                            // Quick chips de marques
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: _popularBrands.map((b) {
                                final isSelected = _brandController.text.trim().toUpperCase() == b.toUpperCase();
                                return ChoiceChip(
                                  label: Text(b, style: TextStyle(fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                                  selected: isSelected,
                                  selectedColor: Colors.purple.shade100,
                                  onSelected: (val) {
                                    if (val) {
                                      setState(() {
                                        _brandController.text = b;
                                      });
                                    }
                                  },
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  flex: 2,
                                  child: TextField(
                                    controller: _brandController,
                                    decoration: InputDecoration(
                                      labelText: 'Nom de la marque',
                                      prefixIcon: const Icon(Icons.branding_watermark, size: 18),
                                      isDense: true,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                    textCapitalization: TextCapitalization.characters,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  flex: 3,
                                  child: TextField(
                                    controller: _labelController,
                                    decoration: InputDecoration(
                                      labelText: 'Libellé (optionnel)',
                                      hintText: 'Ex: Dual Inverter 2024',
                                      prefixIcon: const Icon(Icons.label_outline, size: 18),
                                      isDense: true,
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            // Bouton choix images
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.purple.shade700,
                                      side: BorderSide(color: Colors.purple.shade300),
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                    icon: const Icon(Icons.add_photo_alternate_outlined),
                                    label: Text(
                                      _selectedFiles.isEmpty
                                          ? 'Choisir des photos (Galérie)'
                                          : '${_selectedFiles.length} photo(s) sélectionnée(s)',
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                    onPressed: _isUploading ? null : _pickImages,
                                  ),
                                ),
                                if (_selectedFiles.isNotEmpty) ...[
                                  const SizedBox(width: 8),
                                  IconButton(
                                    icon: const Icon(Icons.close, color: Colors.red),
                                    tooltip: 'Effacer sélection',
                                    onPressed: () => setState(() => _selectedFiles = []),
                                  ),
                                ],
                              ],
                            ),
                            // Aperçu des fichiers choisis
                            if (_selectedFiles.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              SizedBox(
                                height: 70,
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: _selectedFiles.length,
                                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                                  itemBuilder: (context, idx) {
                                    return ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.file(
                                        _selectedFiles[idx],
                                        width: 70,
                                        height: 70,
                                        fit: BoxFit.cover,
                                      ),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(height: 14),
                              // Bouton d'envoi groupé
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.purple.shade700,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 13),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  icon: _isUploading
                                      ? const SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                        )
                                      : const Icon(Icons.cloud_upload),
                                  label: Text(
                                    _isUploading
                                        ? 'Upload en cours ($_uploadProgress/$_totalToUpload)...'
                                        : 'Téléverser ${_selectedFiles.length} photo(s) pour ${_brandController.text.trim().toUpperCase()}',
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  onPressed: _isUploading ? null : _startBulkUpload,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Section 2: Filtres par marque
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: MaasgaTokens.spacingMd),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.filter_list, size: 18, color: AdminTheme.textSecondary),
                        const SizedBox(width: 6),
                        const Text(
                          'Filtrer la médiathèque :',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const Spacer(),
                        if (_selectedBrandFilter.isNotEmpty)
                          TextButton(
                            onPressed: () => setState(() => _selectedBrandFilter = ''),
                            child: const Text('Tout voir', style: TextStyle(fontSize: 12)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ChoiceChip(
                            label: const Text('Toutes'),
                            selected: _selectedBrandFilter.isEmpty,
                            selectedColor: Colors.purple.shade100,
                            onSelected: (_) => setState(() => _selectedBrandFilter = ''),
                          ),
                          const SizedBox(width: 6),
                          ..._popularBrands.map((b) {
                            final isSel = _selectedBrandFilter.toUpperCase() == b.toUpperCase();
                            return Padding(
                              padding: const EdgeInsets.only(right: 6),
                              child: ChoiceChip(
                                label: Text(b),
                                selected: isSel,
                                selectedColor: Colors.purple.shade100,
                                onSelected: (val) {
                                  setState(() => _selectedBrandFilter = val ? b : '');
                                },
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),

            // Section 3: Grille d'images de la médiathèque
            mediaAsync.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (err, _) => SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AdminTheme.error),
                        const SizedBox(height: 12),
                        Text(
                          err.toString().replaceAll('Exception: ', ''),
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AdminTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => ref.invalidate(brandMediaImagesProvider),
                          icon: const Icon(Icons.refresh, size: 18),
                          label: const Text('Réessayer'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AdminTheme.primary,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              data: (images) {
                if (images.isEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.photo_library_outlined, size: 64, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            Text(
                              _selectedBrandFilter.isEmpty
                                  ? 'Aucune image dans la médiathèque.'
                                  : 'Aucune image pour la marque $_selectedBrandFilter.',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Uploadez des photos groupées ci-dessus pour les affecter facilement à vos climatiseurs.',
                              style: TextStyle(color: Colors.grey[600], fontSize: 13),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.76,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final img = images[index];
                        return _buildMediaCard(img, products);
                      },
                      childCount: images.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaCard(BrandMediaImage img, List<Product> products) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Image avec badge marque
          Expanded(
            child: Stack(
              children: [
                Positioned.fill(
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                    child: CachedNetworkImage(
                      imageUrl: img.url,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => Container(
                        color: Colors.grey[100],
                        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      ),
                      errorWidget: (_, _, _) => Container(
                        color: Colors.grey[100],
                        child: const Icon(Icons.broken_image, size: 32, color: Colors.grey),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.purple.shade700.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      img.brand,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: CircleAvatar(
                    radius: 15,
                    backgroundColor: Colors.black.withValues(alpha: 0.4),
                    child: IconButton(
                      padding: EdgeInsets.zero,
                      iconSize: 16,
                      icon: const Icon(Icons.delete_outline, color: Colors.white),
                      onPressed: () => _confirmDelete(img),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Info & action
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (img.label != null && img.label!.isNotEmpty)
                  Text(
                    img.label!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
                  )
                else
                  Text(
                    'Photo ${img.brand}',
                    maxLines: 1,
                    style: TextStyle(color: Colors.grey[500], fontSize: 11),
                  ),
                const SizedBox(height: 6),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple.shade600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      visualDensity: VisualDensity.compact,
                    ),
                    icon: const Icon(Icons.link, size: 14),
                    label: const Text('Affecter', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    onPressed: () => _showAssignSheet(img, products),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
