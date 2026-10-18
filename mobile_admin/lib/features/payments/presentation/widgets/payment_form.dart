import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/payment_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class PaymentForm extends ConsumerStatefulWidget {
  final VoidCallback onSave;

  const PaymentForm({super.key, required this.onSave});

  @override
  ConsumerState<PaymentForm> createState() => _PaymentFormState();
}

class _PaymentFormState extends ConsumerState<PaymentForm> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _orderIdController = TextEditingController();
  final _clientIdController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedCurrency = 'XOF';
  String _selectedPaymentMethod = 'cash';

  final List<String> _currencies = ['XOF', 'EUR', 'USD'];
  final List<String> _paymentMethods = [
    'cash',
    'mobile_money',
    'bank_transfer',
    'card',
    'ligdicash',
  ];

  @override
  void dispose() {
    _amountController.dispose();
    _orderIdController.dispose();
    _clientIdController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final paymentData = {
        'amount': double.parse(_amountController.text),
        'currency': _selectedCurrency,
        'payment_method': _selectedPaymentMethod,
        'order_id': _orderIdController.text.isNotEmpty
            ? int.parse(_orderIdController.text)
            : null,
        'client_id': _clientIdController.text.isNotEmpty
            ? int.parse(_clientIdController.text)
            : null,
        'notes': _notesController.text.isNotEmpty
            ? _notesController.text
            : null,
      };

      ref
          .read(createPaymentProvider(paymentData).future)
          .then((success) {
            if (success && mounted) {
              Navigator.pop(context);
              widget.onSave();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Paiement créé avec succès'),
                  backgroundColor: AdminTheme.success,
                ),
              );
            } else if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Erreur lors de la création du paiement'),
                  backgroundColor: AdminTheme.error,
                ),
              );
            }
          })
          .catchError((error) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Erreur: $error'),
                  backgroundColor: AdminTheme.error,
                ),
              );
            }
          });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
        children: [
          // Amount field
          TextFormField(
            controller: _amountController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Montant',
              prefixIcon: const Icon(Icons.attach_money),
              border: const OutlineInputBorder(),
              filled: true,
              fillColor: AdminTheme.background,
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Le montant est requis';
              }
              if (double.tryParse(value) == null) {
                return 'Montant invalide';
              }
              return null;
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),

          // Currency dropdown
          DropdownButtonFormField<String>(
            initialValue: _selectedCurrency,
            decoration: InputDecoration(
              labelText: 'Devise',
              prefixIcon: const Icon(Icons.currency_exchange),
              border: const OutlineInputBorder(),
              filled: true,
              fillColor: AdminTheme.background,
            ),
            items: _currencies.map((currency) {
              return DropdownMenuItem(value: currency, child: Text(currency));
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedCurrency = value!;
              });
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),

          // Payment method dropdown
          DropdownButtonFormField<String>(
            initialValue: _selectedPaymentMethod,
            decoration: InputDecoration(
              labelText: 'Méthode de paiement',
              prefixIcon: const Icon(Icons.payment),
              border: const OutlineInputBorder(),
              filled: true,
              fillColor: AdminTheme.background,
            ),
            items: _paymentMethods.map((method) {
              return DropdownMenuItem(
                value: method,
                child: Text(method.toUpperCase()),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedPaymentMethod = value!;
              });
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),

          // Order ID (optional)
          TextFormField(
            controller: _orderIdController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'ID Commande (optionnel)',
              prefixIcon: const Icon(Icons.shopping_cart),
              border: const OutlineInputBorder(),
              filled: true,
              fillColor: AdminTheme.background,
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),

          // Client ID (optional)
          TextFormField(
            controller: _clientIdController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'ID Client (optionnel)',
              prefixIcon: const Icon(Icons.person),
              border: const OutlineInputBorder(),
              filled: true,
              fillColor: AdminTheme.background,
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),

          // Notes (optional)
          TextFormField(
            controller: _notesController,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Notes (optionnel)',
              prefixIcon: const Icon(Icons.note),
              border: const OutlineInputBorder(),
              filled: true,
              fillColor: AdminTheme.background,
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),

          // Submit button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submitForm,
              style: ElevatedButton.styleFrom(
                backgroundColor: AdminTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                ),
              ),
              child: const Text(
                'Créer le Paiement',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
