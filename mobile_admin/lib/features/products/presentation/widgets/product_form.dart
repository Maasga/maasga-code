import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/product.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';

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
  String? _imageUrl;

  final List<String> _categories = ['Mural/Split', 'Climatiseurs'];

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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        widget.product == null ? 'Ajouter un produit' : 'Modifier le produit',
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Nom du produit',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) =>
                      value?.isEmpty ?? true ? 'Ce champ est requis' : null,
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                TextFormField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                  validator: (value) =>
                      value?.isEmpty ?? true ? 'Ce champ est requis' : null,
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                TextFormField(
                  controller: _priceController,
                  decoration: const InputDecoration(
                    labelText: 'Prix (FCFA)',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value?.isEmpty ?? true) return 'Ce champ est requis';
                    if (double.tryParse(value!) == null) return 'Prix invalide';
                    return null;
                  },
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                TextFormField(
                  controller: _stockController,
                  decoration: const InputDecoration(
                    labelText: 'Stock',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value?.isEmpty ?? true) return 'Ce champ est requis';
                    if (int.tryParse(value!) == null) return 'Stock invalide';
                    return null;
                  },
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                DropdownButtonFormField<String>(
                  initialValue: _categoryController.text.isEmpty
                      ? null
                      : (_categories.contains(_categoryController.text)
                            ? _categoryController.text
                            : null),
                  decoration: const InputDecoration(
                    labelText: 'Catégorie',
                    border: OutlineInputBorder(),
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
                const SizedBox(height: MaasgaTokens.spacingSm),
                TextFormField(
                  controller: _brandController,
                  decoration: const InputDecoration(
                    labelText: 'Marque',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) =>
                      value?.isEmpty ?? true ? 'Ce champ est requis' : null,
                ),
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
                    borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                    child: Image.network(
                      _imageUrl!,
                      height: 100,
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
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Annuler'),
        ),
        ElevatedButton(
          onPressed: _submitForm,
          child: const Text('Enregistrer'),
        ),
      ],
    );
  }

  void _pickImage() {
    // TODO: Implémenter la sélection d'image depuis la galerie
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sélection d\'image à implémenter')),
    );
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final data = {
        'name': _nameController.text,
        'description': _descriptionController.text,
        'price': double.parse(_priceController.text),
        'stock': int.parse(_stockController.text),
        'category': _categoryController.text,
        'brand': _brandController.text,
        'image_url': _imageUrl,
        'is_active': true,
      };

      widget.onSubmit(data);
      Navigator.pop(context);
    }
  }
}
