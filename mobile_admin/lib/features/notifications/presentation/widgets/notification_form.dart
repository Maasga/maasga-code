import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/notification_provider.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class NotificationForm extends ConsumerStatefulWidget {
  const NotificationForm({super.key});

  @override
  ConsumerState<NotificationForm> createState() => _NotificationFormState();
}

class _NotificationFormState extends ConsumerState<NotificationForm> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  final _imageUrlController = TextEditingController();

  String _targetSegment = 'all';
  bool _sendNow = true;
  DateTime _scheduledDate = DateTime.now().add(const Duration(hours: 1));
  TimeOfDay _scheduledTime = TimeOfDay.fromDateTime(
    DateTime.now().add(const Duration(hours: 1)),
  );
  bool _isLoading = false;

  final List<Map<String, String>> _targets = [
    {'value': 'all', 'label': 'Tous les utilisateurs', 'icon': '👥'},
    {'value': 'clients', 'label': 'Clients actifs', 'icon': '🛒'},
    {'value': 'subscribers', 'label': 'Abonnés newsletter', 'icon': '📧'},
    {'value': 'active', 'label': 'Utilisateurs récents', 'icon': '⚡'},
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

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
          Container(
            margin: const EdgeInsets.only(top: MaasgaTokens.spacingMd),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AdminTheme.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: MaasgaTokens.spacingLg,
              vertical: MaasgaTokens.spacingMd,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Nouvelle notification push',
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
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(MaasgaTokens.spacingLg),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionTitle('Contenu'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    TextFormField(
                      controller: _titleController,
                      decoration: _inputDecoration('Titre *', Icons.title),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Le titre est requis'
                          : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    TextFormField(
                      controller: _bodyController,
                      decoration: _inputDecoration('Message *', Icons.message),
                      maxLines: 4,
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Le message est requis'
                          : null,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    TextFormField(
                      controller: _imageUrlController,
                      decoration: _inputDecoration(
                        'Image URL (optionnel)',
                        Icons.image,
                      ),
                      keyboardType: TextInputType.url,
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),
                    _sectionTitle('Cible'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    RadioGroup<String>(
                      groupValue: _targetSegment,
                      onChanged: (v) => setState(() => _targetSegment = v ?? _targetSegment),
                      child: Column(
                        children: _targets.map((t) {
                          final isSelected = _targetSegment == t['value'];
                          return RadioListTile<String>(
                            value: t['value']!,
                            title: Text('${t['icon']} ${t['label']}'),
                            activeColor: AdminTheme.primary,
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                            selected: isSelected,
                          );
                        }).toList(),
                      ),
                    ),

                    const SizedBox(height: MaasgaTokens.spacingLg),
                    _sectionTitle('Envoi'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    SwitchListTile(
                      value: _sendNow,
                      onChanged: (v) => setState(() => _sendNow = v),
                      title: const Text('Envoyer immédiatement'),
                      subtitle: const Text('Désactiver pour planifier'),
                      activeThumbColor: AdminTheme.primary,
                      contentPadding: EdgeInsets.zero,
                    ),
                    if (!_sendNow) ...[
                      const SizedBox(height: MaasgaTokens.spacingSm),
                      Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: _pickDate,
                              child: InputDecorator(
                                decoration: _inputDecoration(
                                  'Date',
                                  Icons.calendar_today,
                                ),
                                child: Text(
                                  '${_scheduledDate.day.toString().padLeft(2, '0')}/'
                                  '${_scheduledDate.month.toString().padLeft(2, '0')}/'
                                  '${_scheduledDate.year}',
                                  style: const TextStyle(fontSize: 14),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: MaasgaTokens.spacingMd),
                          Expanded(
                            child: InkWell(
                              onTap: _pickTime,
                              child: InputDecorator(
                                decoration: _inputDecoration(
                                  'Heure',
                                  Icons.access_time,
                                ),
                                child: Text(
                                  '${_scheduledTime.hour.toString().padLeft(2, '0')}:${_scheduledTime.minute.toString().padLeft(2, '0')}',
                                  style: const TextStyle(fontSize: 14),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],

                    // Aperçu
                    if (_titleController.text.isNotEmpty ||
                        _bodyController.text.isNotEmpty) ...[
                      const SizedBox(height: MaasgaTokens.spacingLg),
                      _sectionTitle('Aperçu'),
                      const SizedBox(height: MaasgaTokens.spacingSm),
                      _buildPreview(),
                    ],

                    const SizedBox(height: MaasgaTokens.spacingLg),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _submit,
                        icon: Icon(
                          _sendNow ? Icons.send : Icons.schedule,
                          size: 18,
                        ),
                        label: Text(
                          _sendNow ? 'Envoyer maintenant' : 'Planifier',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AdminTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
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

  Widget _buildPreview() {
    return Container(
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AdminTheme.primary,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.notifications,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _titleController.text.isEmpty
                      ? 'Titre de la notification'
                      : _titleController.text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                if (_bodyController.text.isNotEmpty)
                  Text(
                    _bodyController.text,
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _scheduledDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _scheduledDate = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _scheduledTime,
    );
    if (picked != null) setState(() => _scheduledTime = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      String? scheduledFor;
      if (!_sendNow) {
        final scheduled = DateTime(
          _scheduledDate.year,
          _scheduledDate.month,
          _scheduledDate.day,
          _scheduledTime.hour,
          _scheduledTime.minute,
        );
        scheduledFor = scheduled.toIso8601String();
      }

      await ref.read(
        createNotificationProvider({
          'title': _titleController.text.trim(),
          'body': _bodyController.text.trim(),
          'target_segment': _targetSegment,
          'scheduled_for': scheduledFor,
          'image_url': _imageUrlController.text.trim().isEmpty
              ? null
              : _imageUrlController.text.trim(),
          'status': _sendNow ? 'draft' : 'scheduled',
        }).future,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _sendNow
                  ? 'Notification créée — envoyez-la depuis la liste'
                  : 'Notification planifiée avec succès',
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

  Widget _sectionTitle(String title) => Text(
    title,
    style: const TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      color: AdminTheme.primary,
    ),
  );

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
