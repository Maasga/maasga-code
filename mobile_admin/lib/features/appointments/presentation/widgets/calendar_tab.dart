import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../data/models/appointment.dart';
import '../../data/providers/appointment_provider.dart';
import '../screens/appointment_detail_screen.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';

class CalendarTab extends ConsumerStatefulWidget {
  const CalendarTab({super.key});

  @override
  ConsumerState<CalendarTab> createState() => _CalendarTabState();
}

class _CalendarTabState extends ConsumerState<CalendarTab> {
  final CalendarFormat _calendarFormat = CalendarFormat.month;
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
  }

  Color _getMarkerColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return AdminTheme.info;
      case 'done':
      case 'completed':
        return AdminTheme.success;
      case 'cancelled':
        return AdminTheme.error;
      case 'pending':
      default:
        return AdminTheme.warning;
    }
  }

  void _showDayAppointmentsModal(
    BuildContext context,
    List<Appointment> appointments,
    DateTime day,
  ) {
    final formattedDay =
        '${day.day.toString().padLeft(2, '0')}/${day.month.toString().padLeft(2, '0')}/${day.year}';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: AdminTheme.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: MaasgaTokens.spacingLg,
          vertical: MaasgaTokens.spacingMd,
        ),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.7,
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
                const Icon(
                  Icons.calendar_today,
                  color: AdminTheme.primary,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Rendez-vous du $formattedDay',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AdminTheme.textPrimary,
                  ),
                ),
                const Spacer(),
                Text(
                  '${appointments.length}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AdminTheme.primary,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            if (appointments.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(
                  child: Column(
                    children: [
                      Icon(
                        Icons.event_busy,
                        size: 40,
                        color: AdminTheme.textDisabled,
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Aucun rendez-vous prévu pour ce jour',
                        style: TextStyle(color: AdminTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
              )
            else
              Expanded(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: appointments.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final app = appointments[index];
                    final markerColor = _getMarkerColor(app.status);

                    return InkWell(
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) =>
                                AppointmentDetailScreen(appointmentId: app.id),
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusMd,
                      ),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AdminTheme.background,
                          borderRadius: BorderRadius.circular(
                            MaasgaTokens.radiusMd,
                          ),
                          border: Border.all(color: AdminTheme.border),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 48,
                              decoration: BoxDecoration(
                                color: markerColor,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        app.customerName,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                      const Spacer(),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: markerColor.withValues(
                                            alpha: 0.1,
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: Text(
                                          app.formattedStatus,
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: markerColor,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.access_time,
                                        size: 14,
                                        color: AdminTheme.textSecondary,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        app.time,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AdminTheme.textSecondary,
                                        ),
                                      ),
                                      if (app.quartier != null) ...[
                                        const SizedBox(width: 8),
                                        const Icon(
                                          Icons.location_on,
                                          size: 14,
                                          color: AdminTheme.textSecondary,
                                        ),
                                        const SizedBox(width: 2),
                                        Text(
                                          app.quartier!,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AdminTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                      if (app.technician != null) ...[
                                        const SizedBox(width: 8),
                                        const Icon(
                                          Icons.badge,
                                          size: 14,
                                          color: AdminTheme.primary,
                                        ),
                                        const SizedBox(width: 2),
                                        Text(
                                          app.technician!,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AdminTheme.primary,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right,
                              color: AdminTheme.textDisabled,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appointmentsAsync = ref.watch(
      calendarAppointmentsProvider((
        year: _focusedDay.year,
        month: _focusedDay.month,
      )),
    );

    return appointmentsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 40, color: AdminTheme.error),
            const SizedBox(height: 8),
            Text('Erreur: $e'),
            ElevatedButton(
              onPressed: () => ref.invalidate(calendarAppointmentsProvider),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
      data: (appointments) {
        List<Appointment> getEventsForDay(DateTime day) {
          return appointments.where((a) => isSameDay(a.date, day)).toList();
        }

        return Column(
          children: [
            Container(
              margin: const EdgeInsets.all(MaasgaTokens.spacingMd),
              decoration: AdminTheme.cardDecoration,
              child: TableCalendar<Appointment>(
                firstDay: DateTime.utc(2024, 1, 1),
                lastDay: DateTime.utc(2030, 12, 31),
                focusedDay: _focusedDay,
                calendarFormat: _calendarFormat,
                selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                eventLoader: getEventsForDay,
                startingDayOfWeek: StartingDayOfWeek.monday,
                calendarStyle: CalendarStyle(
                  outsideDaysVisible: false,
                  todayDecoration: BoxDecoration(
                    color: AdminTheme.accent.withValues(alpha: 0.3),
                    shape: BoxShape.circle,
                  ),
                  selectedDecoration: const BoxDecoration(
                    color: AdminTheme.primary,
                    shape: BoxShape.circle,
                  ),
                  todayTextStyle: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AdminTheme.primary,
                  ),
                ),
                headerStyle: const HeaderStyle(
                  formatButtonVisible: false,
                  titleCentered: true,
                  titleTextStyle: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                calendarBuilders: CalendarBuilders(
                  markerBuilder: (context, date, events) {
                    if (events.isEmpty) return null;
                    return Positioned(
                      bottom: 2,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: events.take(4).map((event) {
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 1),
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _getMarkerColor(event.status),
                            ),
                          );
                        }).toList(),
                      ),
                    );
                  },
                ),
                onDaySelected: (selectedDay, focusedDay) {
                  setState(() {
                    _selectedDay = selectedDay;
                    _focusedDay = focusedDay;
                  });
                  final dayAppointments = getEventsForDay(selectedDay);
                  _showDayAppointmentsModal(
                    context,
                    dayAppointments,
                    selectedDay,
                  );
                },
                onPageChanged: (focusedDay) {
                  setState(() {
                    _focusedDay = focusedDay;
                  });
                },
              ),
            ),
            // Legend
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: MaasgaTokens.spacingLg,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _legendItem('En attente', AdminTheme.warning),
                  _legendItem('Confirmé', AdminTheme.info),
                  _legendItem('Terminé', AdminTheme.success),
                  _legendItem('Annulé', AdminTheme.error),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],
        );
      },
    );
  }

  Widget _legendItem(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AdminTheme.textSecondary),
        ),
      ],
    );
  }
}
