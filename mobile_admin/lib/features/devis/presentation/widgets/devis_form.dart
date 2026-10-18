import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/devis_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class DevisForm extends ConsumerStatefulWidget {
  const DevisForm({super.key});

  @override
  ConsumerState<DevisForm> createState() => _DevisFormState();
}

class _DevisFormState extends ConsumerState<DevisForm> {
  final _formKey = GlobalKey<FormState>();
  final _clientNameController = TextEditingController();
  final _clientPhoneController = TextEditingController();
  final _clientEmailController = TextEditingController();
  final _notesController = TextEditingController();

  double _taxRate = 18.0; // TVA 18% par défaut
  bool _isLoading = false;

  final List<_DevisItemRow> _items = [];

  @override
  void initState() {
    super.initState();
    _addItem(); // Commencer avec un item vide
  }

  @override
  void dispose() {
    _clientNameController.dispose();
    _clientPhoneController.dispose();
    _clientEmailController.dispose();
    _notesController.dispose();
    for (final item in _items) {
      item.dispose();
    }
    super.dispose();
  }

  double get _subtotal => _items.fold(0, (sum, item) => sum + item.lineTotal);
  double get _taxAmount => _subtotal * (_taxRate / 100);
  double get _total => _subtotal + _taxAmount;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AdminTheme.surface,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(MaasgaTokens.radiusXxl),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: MaasgaTokens.spacingMd),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AdminTheme.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: MaasgaTokens.spacingLg,
              vertical: MaasgaTokens.spacingMd,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Nouveau devis',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AdminTheme.textPrimary,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Form
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(MaasgaTokens.spacingLg),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Section Client ──
                    _sectionTitle('Informations client'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    TextFormField(
                      controller: _clientNameController,
                      decoration: _inputDecoration('Nom du client *', Icons.person),
                      textCapitalization: TextCapitalization.words,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Le nom est requis' : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    TextFormField(
                      controller: _clientPhoneController,
                      decoration: _inputDecoration('Téléphone *', Icons.phone),
                      keyboardType: TextInputType.phone,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Le téléphone est requis' : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    TextFormField(
                      controller: _clientEmailController,
                      decoration: _inputDecoration('Email (optionnel)', Icons.email),
                      keyboardType: TextInputType.emailAddress,
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),

                    // ── Section Articles ──
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _sectionTitle('Articles'),
                        TextButton.icon(
                          onPressed: () {
                            setState(() => _addItem());
                          },
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text('Ajouter'),
                          style: TextButton.styleFrom(
                            foregroundColor: AdminTheme.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    ...List.generate(_items.length, (index) {
                      final item = _items[index];
                      return _buildItemRow(item, index);
                    }),

                    const SizedBox(height: MaasgaTokens.spacingLg),

                    // ── TVA ──
                    _sectionTitle('TVA'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    Row(
                      children: [
                        Expanded(
                          child: Slider(
                            value: _taxRate,
                            min: 0,
                            max: 30,
                            divisions: 30,
                            label: '${_taxRate.toStringAsFixed(0)}%',
                            activeColor: AdminTheme.primary,
                            onChanged: (v) => setState(() => _taxRate = v),
                          ),
                        ),
                        Container(
                          width: 60,
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AdminTheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
                            border: Border.all(
                              color: AdminTheme.primary.withValues(alpha: 0.3),
                            ),
                          ),
                          child: Text(
                            '${_taxRate.toStringAsFixed(0)}%',
                            style: const TextStyle(
                              color: AdminTheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),

                    // ── Récapitulatif ──
                    _buildTotalSummary(),

                    const SizedBox(height: MaasgaTokens.spacingLg),

                    // ── Notes ──
                    _sectionTitle('Notes (optionnel)'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    TextFormField(
                      controller: _notesController,
                      decoration: _inputDecoration(
                        'Remarques, conditions particulières...',
                        Icons.sticky_note_2,
                      ),
                      maxLines: 3,
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),

                    // ── Actions ──
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _isLoading
                                ? null
                                : () => _submit('draft'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AdminTheme.secondary,
                              side: const BorderSide(color: AdminTheme.secondary),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: const Text('Brouillon'),
                          ),
                        ),
                        const SizedBox(width: MaasgaTokens.spacingMd),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            onPressed: _isLoading
                                ? null
                                : () => _submit('sent'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AdminTheme.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.send, size: 16),
                                      SizedBox(width: 6),
                                      Text('Envoyer au client',
                                          style: TextStyle(fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemRow(_DevisItemRow item, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: MaasgaTokens.spacingMd),
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      decoration: BoxDecoration(
        color: AdminTheme.background,
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        border: Border.all(color: AdminTheme.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Article ${index + 1}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: AdminTheme.textPrimary,
                  ),
                ),
              ),
              if (_items.length > 1)
                IconButton(
                  onPressed: () => setState(() => _items.removeAt(index)),
                  icon: const Icon(Icons.delete_outline,
                      color: AdminTheme.error, size: 18),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          TextField(
            controller: item.descriptionController,
            decoration: const InputDecoration(
              labelText: 'Description *',
              border: OutlineInputBorder(),
              isDense: true,
            ),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  controller: item.priceController,
                  decoration: const InputDecoration(
                    labelText: 'Prix unitaire (FCFA)',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: MaasgaTokens.spacingSm),
              Expanded(
                child: TextField(
                  controller: item.quantityController,
                  decoration: const InputDecoration(
                    labelText: 'Qté',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: MaasgaTokens.spacingSm),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('Total', style: TextStyle(fontSize: 11, color: AdminTheme.textSecondary)),
                  Text(
                    '${item.lineTotal.toStringAsFixed(0)} F',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: AdminTheme.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTotalSummary() {
    return Container(
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      decoration: BoxDecoration(
        color: AdminTheme.primary.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        border: Border.all(color: AdminTheme.primary.withValues(alpha: 0.15)),
      ),
      child: Column(
        children: [
          _totalRow('Sous-total HT', _subtotal),
          _totalRow('TVA (${_taxRate.toStringAsFixed(0)}%)', _taxAmount),
          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total TTC',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AdminTheme.textPrimary,
                ),
              ),
              Text(
                '${_total.toStringAsFixed(0)} FCFA',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: AdminTheme.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _totalRow(String label, double value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 13, color: AdminTheme.textSecondary)),
          Text(
            '${value.toStringAsFixed(0)} FCFA',
            style: const TextStyle(fontSize: 13, color: AdminTheme.textPrimary),
          ),
        ],
      ),
    );
  }

  void _addItem() {
    _items.add(_DevisItemRow());
  }

  Future<void> _submit(String status) async {
    if (!_formKey.currentState!.validate()) return;

    // Vérifier qu'il y a au moins un item valide
    final validItems = _items
        .where((i) =>
            i.descriptionController.text.isNotEmpty &&
            i.lineTotal > 0)
        .toList();

    if (validItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ajoutez au moins un article avec un prix'),
          backgroundColor: AdminTheme.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final itemsData = validItems.map((i) => i.toJson()).toList();

      await ref.read(
        createDevisProvider({
          'client_name': _clientNameController.text.trim(),
          'client_phone': _clientPhoneController.text.trim(),
          'client_email': _clientEmailController.text.trim().isEmpty
              ? null
              : _clientEmailController.text.trim(),
          'items': itemsData,
          'subtotal': _subtotal,
          'tax': _taxAmount,
          'total': _total,
          'status': status,
          'notes': _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
        }).future,
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              status == 'draft'
                  ? 'Devis sauvegardé en brouillon'
                  : 'Devis créé et envoyé au client',
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
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _sectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: AdminTheme.primary,
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, size: 20, color: AdminTheme.textSecondary),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        borderSide: const BorderSide(color: AdminTheme.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        borderSide: const BorderSide(color: AdminTheme.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        borderSide: const BorderSide(color: AdminTheme.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        borderSide: const BorderSide(color: AdminTheme.error),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: MaasgaTokens.spacingMd,
        vertical: MaasgaTokens.spacingMd,
      ),
    );
  }
}

class _DevisItemRow {
  final TextEditingController descriptionController = TextEditingController();
  final TextEditingController priceController = TextEditingController();
  final TextEditingController quantityController =
      TextEditingController(text: '1');

  double get unitPrice => double.tryParse(priceController.text) ?? 0;
  int get quantity => int.tryParse(quantityController.text) ?? 1;
  double get lineTotal => unitPrice * quantity;

  Map<String, dynamic> toJson() => {
        'description': descriptionController.text.trim(),
        'quantity': quantity,
        'unit_price': unitPrice,
        'total': lineTotal,
      };

  void dispose() {
    descriptionController.dispose();
    priceController.dispose();
    quantityController.dispose();
  }
}
