import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/product.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class ProductForm extends ConsumerStatefulWidget {
  final Product? product;
  final Function(Map<String, dynamic>) onSubmit;

  const ProductForm({super.key, this.product, required this.onSubmit});

  @override
  ConsumerState<ProductForm> createState() => _ProductFormState();
}

class _ProductFormState extends ConsumerState<ProductForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _stockController = TextEditingController();
  final _categoryController = TextEditingController();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _btuController = TextEditingController();
  final _surfaceMinController = TextEditingController();
  final _surfaceMaxController = TextEditingController();
  final _energyClassController = TextEditingController();
  final _warrantyController = TextEditingController();
  final _refrigerantController = TextEditingController();
  final _compressorController = TextEditingController();
  final _featuresController = TextEditingController();
  String? _imageUrl;
  bool _inverter = false;
  bool _available = true;

  final List<String> _categories = [
    'Mural/Split',
    'Climatiseurs',
    'Cassette',
    'Console',
    'Gainable',
  ];
  final List<String> _energyClasses = ['A++', 'A+', 'A', 'B', 'C', 'D', 'E'];
  final List<String> _refrigerants = ['R410A', 'R32', 'R290', 'R22'];

  @override
  void initState() {
    super.initState();
    if (widget.product != null) {
      _nameController.text = widget.product!.name;
      _descriptionController.text = widget.product!.description;
      _priceController.text = widget.product!.price.toString();
      _stockController.text = widget.product!.stock.toString();
      _categoryController.text = widget.product!.category;
      _brandController.text = widget.product!.brand;
      _modelController.text = widget.product!.model ?? '';
      _btuController.text = widget.product!.btu?.toString() ?? '';
      _surfaceMinController.text = widget.product!.surfaceMin?.toString() ?? '';
      _surfaceMaxController.text = widget.product!.surfaceMax?.toString() ?? '';
      _energyClassController.text = widget.product!.energyClass ?? '';
      _warrantyController.text = widget.product!.warranty?.toString() ?? '';
      _refrigerantController.text = widget.product!.refrigerant ?? '';
      _compressorController.text = widget.product!.compressor ?? '';
      _featuresController.text = widget.product!.features?.join(', ') ?? '';
      _inverter = widget.product!.inverter ?? false;
      _available = widget.product!.isActive;
      _imageUrl = widget.product!.imageUrl;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _stockController.dispose();
    _categoryController.dispose();
    _brandController.dispose();
    _modelController.dispose();
    _btuController.dispose();
    _surfaceMinController.dispose();
    _surfaceMaxController.dispose();
    _energyClassController.dispose();
    _warrantyController.dispose();
    _refrigerantController.dispose();
    _compressorController.dispose();
    _featuresController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: SizedBox(
        width: double.maxFinite,
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(MaasgaTokens.spacingLg),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    widget.product == null
                        ? 'Ajouter un produit'
                        : 'Modifier le produit',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingLg),

                  // Informations de base
                  _buildSectionTitle('Informations de base'),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Nom du produit *',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) =>
                        value?.isEmpty ?? true ? 'Ce champ est requis' : null,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(
                      labelText: 'Description *',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                    validator: (value) =>
                        value?.isEmpty ?? true ? 'Ce champ est requis' : null,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _priceController,
                          decoration: const InputDecoration(
                            labelText: 'Prix (FCFA) *',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          validator: (value) {
                            if (value?.isEmpty ?? true) {
                              return 'Ce champ est requis';
                            }
                            if (double.tryParse(value!) == null) {
                              return 'Prix invalide';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: MaasgaTokens.spacingSm),
                      Expanded(
                        child: TextFormField(
                          controller: _stockController,
                          decoration: const InputDecoration(
                            labelText: 'Stock *',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          validator: (value) {
                            if (value?.isEmpty ?? true) {
                              return 'Ce champ est requis';
                            }
                            if (int.tryParse(value!) == null) {
                              return 'Stock invalide';
                            }
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _categoryController.text.isEmpty
                              ? null
                              : (_categories.contains(_categoryController.text)
                                    ? _categoryController.text
                                    : null),
                          decoration: const InputDecoration(
                            labelText: 'Catégorie',
                            border: OutlineInputBorder(),
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                          ),
                          items: _categories.map((category) {
                            return DropdownMenuItem(
                              value: category,
                              child: Text(category),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _categoryController.text = value ?? '';
                            });
                          },
                          validator: (value) =>
                              value == null ? 'Ce champ est requis' : null,
                        ),
                      ),
                      const SizedBox(width: MaasgaTokens.spacingSm),
                      Expanded(
                        child: TextFormField(
                          controller: _brandController,
                          decoration: const InputDecoration(
                            labelText: 'Marque *',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) => value?.isEmpty ?? true
                              ? 'Ce champ est requis'
                              : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  TextFormField(
                    controller: _modelController,
                    decoration: const InputDecoration(
                      labelText: 'Modèle',
                      border: OutlineInputBorder(),
                    ),
                  ),

                  const SizedBox(height: MaasgaTokens.spacingLg),

                  // Spécifications techniques
                  _buildSectionTitle('Spécifications techniques'),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _btuController,
                          decoration: const InputDecoration(
                            labelText: 'BTU',
                            border: OutlineInputBorder(),
                            hintText: 'ex: 12000, 18000, 24000',
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: MaasgaTokens.spacingSm),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _energyClassController.text.isEmpty
                              ? null
                              : (_energyClasses.contains(
                                      _energyClassController.text,
                                    )
                                    ? _energyClassController.text
                                    : null),
                          decoration: const InputDecoration(
                            labelText: 'Classe énergétique',
                            border: OutlineInputBorder(),
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                          ),
                          items: _energyClasses.map((energyClass) {
                            return DropdownMenuItem(
                              value: energyClass,
                              child: Text(energyClass),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _energyClassController.text = value ?? '';
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _surfaceMinController,
                          decoration: const InputDecoration(
                            labelText: 'Surface min (m²)',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      const SizedBox(width: MaasgaTokens.spacingSm),
                      Expanded(
                        child: TextFormField(
                          controller: _surfaceMaxController,
                          decoration: const InputDecoration(
                            labelText: 'Surface max (m²)',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _refrigerantController.text.isEmpty
                              ? null
                              : (_refrigerants.contains(
                                      _refrigerantController.text,
                                    )
                                    ? _refrigerantController.text
                                    : null),
                          decoration: const InputDecoration(
                            labelText: 'Réfrigérant',
                            border: OutlineInputBorder(),
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                          ),
                          items: _refrigerants.map((refrigerant) {
                            return DropdownMenuItem(
                              value: refrigerant,
                              child: Text(refrigerant),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _refrigerantController.text = value ?? '';
                            });
                          },
                        ),
                      ),
                      const SizedBox(width: MaasgaTokens.spacingSm),
                      Expanded(
                        child: TextFormField(
                          controller: _compressorController,
                          decoration: const InputDecoration(
                            labelText: 'Compresseur',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  TextFormField(
                    controller: _warrantyController,
                    decoration: const InputDecoration(
                      labelText: 'Garantie (années)',
                      border: OutlineInputBorder(),
                      hintText: 'ex: 1, 2, 3',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  TextFormField(
                    controller: _featuresController,
                    decoration: const InputDecoration(
                      labelText: 'Caractéristiques',
                      border: OutlineInputBorder(),
                      hintText: 'Séparées par des virgules',
                    ),
                    maxLines: 2,
                  ),

                  const SizedBox(height: MaasgaTokens.spacingLg),

                  // Options
                  _buildSectionTitle('Options'),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  SwitchListTile(
                    title: const Text('Technologie Inverter'),
                    subtitle: const Text('Plus économe en énergie'),
                    value: _inverter,
                    onChanged: (value) {
                      setState(() {
                        _inverter = value;
                      });
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Disponible'),
                    subtitle: const Text('Produit visible sur le site'),
                    value: _available,
                    onChanged: (value) {
                      setState(() {
                        _available = value;
                      });
                    },
                  ),

                  const SizedBox(height: MaasgaTokens.spacingLg),

                  // Image
                  _buildSectionTitle('Image'),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  ElevatedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.image),
                    label: Text(
                      _imageUrl == null
                          ? 'Ajouter une image'
                          : 'Changer l\'image',
                    ),
                  ),
                  if (_imageUrl != null) ...[
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusMd,
                      ),
                      child: Image.network(
                        _imageUrl!,
                        height: 150,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return const Center(
                            child: Text('Erreur de chargement'),
                          );
                        },
                      ),
                    ),
                  ],

                  const SizedBox(height: MaasgaTokens.spacingLg),

                  // Actions
                  Row(
                    children: [
                      Expanded(
                        child: TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Annuler'),
                        ),
                      ),
                      const SizedBox(width: MaasgaTokens.spacingSm),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _submitForm,
                          child: const Text('Enregistrer'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: MaasgaTokens.spacingXs),
      child: Text(
        title,
        style: TextStyle(
          fontSize: MaasgaTokens.fontSizeBody,
          fontWeight: MaasgaTokens.fontWeightBold,
          color: AdminTheme.primary,
        ),
      ),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Ensure AdminTheme is available
    if (!mounted) return;
  }

  void _pickImage() {
    // TODO: Implémenter la sélection d'image depuis la galerie avec image_picker
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Sélection d\'image à implémenter avec image_picker'),
      ),
    );
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      // Parser les caractéristiques
      List<String>? features;
      if (_featuresController.text.isNotEmpty) {
        features = _featuresController.text
            .split(',')
            .map((f) => f.trim())
            .where((f) => f.isNotEmpty)
            .toList();
      }

      final data = {
        'name': _nameController.text,
        'description': _descriptionController.text,
        'price': double.parse(_priceController.text),
        'stock': int.parse(_stockController.text),
        'category': _categoryController.text,
        'brand': _brandController.text,
        'model': _modelController.text.isEmpty ? null : _modelController.text,
        'btu': _btuController.text.isEmpty
            ? null
            : int.tryParse(_btuController.text),
        'surface_min': _surfaceMinController.text.isEmpty
            ? null
            : int.tryParse(_surfaceMinController.text),
        'surface_max': _surfaceMaxController.text.isEmpty
            ? null
            : int.tryParse(_surfaceMaxController.text),
        'energy_class': _energyClassController.text.isEmpty
            ? null
            : _energyClassController.text,
        'inverter': _inverter,
        'available': _available,
        'warranty': _warrantyController.text.isEmpty
            ? null
            : int.tryParse(_warrantyController.text),
        'refrigerant': _refrigerantController.text.isEmpty
            ? null
            : _refrigerantController.text,
        'compressor': _compressorController.text.isEmpty
            ? null
            : _compressorController.text,
        'features': features,
        'image_url': _imageUrl,
      };

      widget.onSubmit(data);
      // Navigator.pop(context); // Removed - let parent handle navigation
    }
  }
}
