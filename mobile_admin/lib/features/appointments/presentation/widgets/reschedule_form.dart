import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/appointment.dart';
import '../../data/providers/appointment_provider.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';

class RescheduleForm extends ConsumerStatefulWidget {
  final Appointment appointment;

  const RescheduleForm({super.key, required this.appointment});

  static Future<void> show(BuildContext context, Appointment appointment) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => RescheduleForm(appointment: appointment),
    );
  }

  @override
  ConsumerState<RescheduleForm> createState() => _RescheduleFormState();
}

class _RescheduleFormState extends ConsumerState<RescheduleForm> {
  late DateTime _selectedDate;
  late TimeOfDay _startTime;
  TimeOfDay? _endTime;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _selectedDate = widget.appointment.date;
    final parts = widget.appointment.time.split(':');
    final hour = parts.isNotEmpty ? int.tryParse(parts[0]) ?? 9 : 9;
    final minute = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    _startTime = TimeOfDay(hour: hour, minute: minute);
  }

  String _formatTime(TimeOfDay time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AdminTheme.primary,
              onPrimary: Colors.white,
              onSurface: AdminTheme.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _pickStartTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _startTime,
    );
    if (picked != null) {
      setState(() => _startTime = picked);
    }
  }

  Future<void> _pickEndTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _endTime ?? TimeOfDay(hour: (_startTime.hour + 2) % 24, minute: _startTime.minute),
    );
    if (picked != null) {
      setState(() => _endTime = picked);
    }
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(
        rescheduleAppointmentProvider((
          id: widget.appointment.id,
          date: _selectedDate,
          heureDebut: _formatTime(_startTime),
          heureFin: _endTime != null ? _formatTime(_endTime!) : null,
        )).future,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rendez-vous reprogrammé avec succès'),
            backgroundColor: AdminTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de la reprogrammation: $e'),
            backgroundColor: AdminTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final formattedDate =
        '${_selectedDate.day.toString().padLeft(2, '0')}/${_selectedDate.month.toString().padLeft(2, '0')}/${_selectedDate.year}';

    return Container(
      decoration: const BoxDecoration(
        color: AdminTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        left: MaasgaTokens.spacingLg,
        right: MaasgaTokens.spacingLg,
        top: MaasgaTokens.spacingMd,
        bottom: MediaQuery.of(context).viewInsets.bottom + MaasgaTokens.spacingXl,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AdminTheme.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          Row(
            children: [
              const Icon(Icons.edit_calendar_rounded, color: AdminTheme.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Reprogrammer le RDV #${widget.appointment.id}',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AdminTheme.textPrimary,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          const Text(
            'Sélectionnez la nouvelle date et les horaires souhaités :',
            style: TextStyle(fontSize: 13, color: AdminTheme.textSecondary),
          ),
          const SizedBox(height: MaasgaTokens.spacingLg),
          // Date Selector
          InkWell(
            onTap: _pickDate,
            borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                border: Border.all(color: AdminTheme.border),
                borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_month, color: AdminTheme.accent, size: 20),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Date', style: TextStyle(fontSize: 11, color: AdminTheme.textSecondary)),
                      Text(formattedDate, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const Spacer(),
                  const Icon(Icons.chevron_right, color: AdminTheme.textDisabled),
                ],
              ),
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          // Time Selectors
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: _pickStartTime,
                  borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      border: Border.all(color: AdminTheme.border),
                      borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.access_time, color: AdminTheme.primary, size: 18),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Heure début', style: TextStyle(fontSize: 11, color: AdminTheme.textSecondary)),
                            Text(_formatTime(_startTime), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: MaasgaTokens.spacingMd),
              Expanded(
                child: InkWell(
                  onTap: _pickEndTime,
                  borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      border: Border.all(color: AdminTheme.border),
                      borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.timer_outlined, color: AdminTheme.secondary, size: 18),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Heure fin (opt.)', style: TextStyle(fontSize: 11, color: AdminTheme.textSecondary)),
                            Text(
                              _endTime != null ? _formatTime(_endTime!) : '--:--',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
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
          const SizedBox(height: MaasgaTokens.spacingXl),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AdminTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                ),
              ),
              icon: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.check, size: 20),
              label: const Text(
                'Confirmer la reprogrammation',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
