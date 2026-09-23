import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/client.dart';
import '../../data/providers/client_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class ClientForm extends ConsumerStatefulWidget {
  final Client? client;
  final Function(Client) onSave;

  const ClientForm({
    super.key,
    this.client,
    required this.onSave,
  });

  @override
  ConsumerState<ClientForm> createState() => _ClientFormState();
}

class _ClientFormState extends ConsumerState<ClientForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _quartierController = TextEditingController();
  final _adresseController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.client != null) {
      _nameController.text = widget.client!.name;
      _emailController.text = widget.client!.email ?? '';
      _phoneController.text = widget.client!.phone;
      _quartierController.text = widget.client!.quartier ?? '';
      _adresseController.text = widget.client!.adressePrecise ?? '';
      _notesController.text = widget.client!.notes ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _quartierController.dispose();
    _adresseController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final data = {
      'name': _nameController.text.trim(),
      'email': _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
      'phone': _phoneController.text.trim(),
      'quartier': _quartierController.text.trim().isEmpty ? null : _quartierController.text.trim(),
      'adresse_precise': _adresseController.text.trim().isEmpty ? null : _adresseController.text.trim(),
      'notes': _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
    };

    try {
      Client savedClient;
      if (widget.client != null) {
        savedClient = await ref.read(updateClientProvider((
          id: widget.client!.id,
          data: data,
        )).future);
      } else {
        savedClient = await ref.read(createClientProvider(data).future);
      }

      if (mounted) {
        widget.onSave(savedClient);
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.client != null ? 'Client mis à jour' : 'Client créé'),
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
            controller: _nameController,
            decoration: AdminTheme.inputDecoration('Nom complet *'),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Le nom est requis';
              }
              return null;
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _phoneController,
            decoration: AdminTheme.inputDecoration('Téléphone *'),
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Le téléphone est requis';
              }
              return null;
            },
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _emailController,
            decoration: AdminTheme.inputDecoration('Email'),
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _quartierController,
            decoration: AdminTheme.inputDecoration('Quartier'),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _adresseController,
            decoration: AdminTheme.inputDecoration('Adresse précise'),
            maxLines: 2,
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          TextFormField(
            controller: _notesController,
            decoration: AdminTheme.inputDecoration('Notes'),
            maxLines: 3,
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),
          ElevatedButton(
            onPressed: _submit,
            style: AdminTheme.primaryButtonStyle,
            child: Text(widget.client != null ? 'Mettre à jour' : 'Créer'),
          ),
        ],
      ),
    );
  }
}