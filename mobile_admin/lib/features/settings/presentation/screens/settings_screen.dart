import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/settings_provider.dart';
import '../../data/models/app_setting.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final Map<String, AppSetting> _predefinedSettings = {
    'site_name': AppSetting(
      key: 'site_name',
      label: 'Nom du site',
      value: 'MaasGa',
      description: 'Nom affiché dans l\'en-tête du site',
      type: SettingType.text,
    ),
    'contact_email': AppSetting(
      key: 'contact_email',
      label: 'Email de contact',
      value: 'contact@maasga.bf',
      description: 'Email principal pour les contacts',
      type: SettingType.email,
    ),
    'contact_phone': AppSetting(
      key: 'contact_phone',
      label: 'Téléphone de contact',
      value: '+226 70 00 00 00',
      description: 'Numéro de téléphone principal',
      type: SettingType.text,
    ),
    'maintenance_mode': AppSetting(
      key: 'maintenance_mode',
      label: 'Mode maintenance',
      value: 'false',
      description:
          'Active le mode maintenance (affiche une page de maintenance)',
      type: SettingType.boolean,
    ),
    'enable_registration': AppSetting(
      key: 'enable_registration',
      label: 'Autoriser les inscriptions',
      value: 'true',
      description: 'Permet aux nouveaux utilisateurs de s\'inscrire',
      type: SettingType.boolean,
    ),
    'default_currency': AppSetting(
      key: 'default_currency',
      label: 'Devise par défaut',
      value: 'XOF',
      description: 'Devise utilisée pour les prix',
      type: SettingType.select,
      options: ['XOF', 'EUR', 'USD'],
    ),
    'min_order_amount': AppSetting(
      key: 'min_order_amount',
      label: 'Montant minimum de commande',
      value: '10000',
      description: 'Montant minimum pour valider une commande (en FCFA)',
      type: SettingType.number,
    ),
    'delivery_fee': AppSetting(
      key: 'delivery_fee',
      label: 'Frais de livraison',
      value: '2000',
      description: 'Frais de livraison par défaut (en FCFA)',
      type: SettingType.number,
    ),
    'social_facebook': AppSetting(
      key: 'social_facebook',
      label: 'Facebook',
      value: '',
      description: 'URL de la page Facebook',
      type: SettingType.url,
    ),
    'social_instagram': AppSetting(
      key: 'social_instagram',
      label: 'Instagram',
      value: '',
      description: 'URL du compte Instagram',
      type: SettingType.url,
    ),
    'social_whatsapp': AppSetting(
      key: 'social_whatsapp',
      label: 'WhatsApp',
      value: '',
      description: 'Numéro WhatsApp',
      type: SettingType.text,
    ),
  };

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(settingsProvider);

    return Scaffold(
      body: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            decoration: BoxDecoration(
              color: AdminTheme.surface,
              border: Border(bottom: BorderSide(color: AdminTheme.border)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Paramètres',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  onPressed: () => ref.invalidate(settingsProvider),
                  icon: const Icon(Icons.refresh),
                ),
              ],
            ),
          ),
          // Liste des paramètres
          Expanded(
            child: settingsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 48,
                      color: AdminTheme.error,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    Text('Erreur: $error'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    ElevatedButton(
                      onPressed: () => ref.invalidate(settingsProvider),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
              data: (settings) {
                // Merge predefined settings with actual values
                final mergedSettings = _predefinedSettings.map((
                  key,
                  predefined,
                ) {
                  final actualValue =
                      settings[key]?.toString() ?? predefined.value;
                  return MapEntry(
                    key,
                    AppSetting(
                      key: predefined.key,
                      label: predefined.label,
                      value: actualValue,
                      description: predefined.description,
                      type: predefined.type,
                      options: predefined.options,
                    ),
                  );
                });

                // Add any custom settings not in predefined
                for (final entry in settings.entries) {
                  if (!_predefinedSettings.containsKey(entry.key)) {
                    mergedSettings[entry.key] = AppSetting(
                      key: entry.key,
                      label: entry.key,
                      value: entry.value.toString(),
                      type: SettingType.text,
                    );
                  }
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                  itemCount: mergedSettings.length,
                  itemBuilder: (context, index) {
                    final entry = mergedSettings.entries.elementAt(index);
                    final setting = entry.value;
                    return Card(
                      margin: const EdgeInsets.only(
                        bottom: MaasgaTokens.spacingSm,
                      ),
                      child: ListTile(
                        title: Text(
                          setting.label,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (setting.description != null) ...[
                              Text(
                                setting.description!,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AdminTheme.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 4),
                            ],
                            Text(
                              setting.displayValue,
                              style: TextStyle(
                                fontSize: 14,
                                color: setting.type == SettingType.boolean
                                    ? AdminTheme.primary
                                    : AdminTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        trailing: IconButton(
                          onPressed: () => _editSetting(setting),
                          icon: const Icon(Icons.edit),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _editSetting(AppSetting setting) {
    switch (setting.type) {
      case SettingType.boolean:
        _editBooleanSetting(setting);
        break;
      case SettingType.select:
        _editSelectSetting(setting);
        break;
      case SettingType.number:
        _editNumberSetting(setting);
        break;
      case SettingType.email:
      case SettingType.url:
      case SettingType.text:
        _editTextSetting(setting);
    }
  }

  void _editBooleanSetting(AppSetting setting) {
    final currentValue = setting.value == 'true' || setting.value == '1';
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(setting.label),
        content: SwitchListTile(
          title: Text(currentValue ? 'Activé' : 'Désactivé'),
          value: currentValue,
          onChanged: (value) {
            Navigator.pop(context);
            _updateSetting(setting.key, value ? 'true' : 'false');
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
        ],
      ),
    );
  }

  void _editSelectSetting(AppSetting setting) {
    String? selectedValue = setting.value;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(setting.label),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: (setting.options ?? []).map((option) {
            return RadioListTile<String>(
              title: Text(option),
              value: option,
              groupValue: selectedValue,
              onChanged: (value) {
                selectedValue = value;
                Navigator.pop(context);
                _updateSetting(setting.key, value!);
              },
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
        ],
      ),
    );
  }

  void _editNumberSetting(AppSetting setting) {
    final controller = TextEditingController(text: setting.value);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(setting.label),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            hintText: setting.description,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _updateSetting(setting.key, controller.text);
            },
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }

  void _editTextSetting(AppSetting setting) {
    final controller = TextEditingController(text: setting.value);
    final keyboardType = setting.type == SettingType.email
        ? TextInputType.emailAddress
        : setting.type == SettingType.url
        ? TextInputType.url
        : TextInputType.text;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(setting.label),
        content: TextField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            hintText: setting.description,
          ),
          maxLines: setting.type == SettingType.text ? 3 : 1,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _updateSetting(setting.key, controller.text);
            },
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }

  Future<void> _updateSetting(String key, String value) async {
    try {
      await ref.read(updateSettingsProvider({key: value}).future);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Paramètre mis à jour')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur: $e')));
      }
    }
  }
}
