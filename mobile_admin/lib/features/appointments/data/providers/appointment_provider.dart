import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/appointment_repository.dart';
import '../models/appointment.dart';
import '../../../../core/network/dio_provider.dart';

// Repository provider
final appointmentRepositoryProvider = Provider<AppointmentRepository>((ref) {
  return AppointmentRepository(ref.watch(dioProvider));
});

// Appointments provider using FutureProvider
final appointmentsProvider = FutureProvider<List<Appointment>>((ref) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  return repository.getAppointments();
});

// Confirm appointment provider
final confirmAppointmentProvider = FutureProvider.family<Appointment, String>((
  ref,
  id,
) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  final res = await repository.confirmAppointment(id);
  ref.invalidate(appointmentsProvider);
  ref.invalidate(appointmentDetailProvider(id));
  return res;
});

// Cancel appointment provider
final cancelAppointmentProvider =
    FutureProvider.family<Appointment, ({String id, String? reason})>((
      ref,
      params,
    ) async {
      final repository = ref.watch(appointmentRepositoryProvider);
      final res = await repository.cancelAppointment(params.id, reason: params.reason);
      ref.invalidate(appointmentsProvider);
      ref.invalidate(appointmentDetailProvider(params.id));
      return res;
    });

// Calendar appointments provider
final calendarAppointmentsProvider =
    FutureProvider.family<List<Appointment>, ({int? year, int? month})>((
      ref,
      params,
    ) async {
      final repository = ref.watch(appointmentRepositoryProvider);
      return repository.getCalendarAppointments(
        year: params.year,
        month: params.month,
      );
    });

// Appointment detail provider
final appointmentDetailProvider =
    FutureProvider.family<Appointment, String>((ref, id) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  return repository.getAppointment(id);
});

// Create appointment provider
final createAppointmentProvider =
    FutureProvider.family<Appointment, Map<String, dynamic>>((ref, data) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  final result = await repository.createAppointment(data);
  ref.invalidate(appointmentsProvider);
  return result;
});

// Update appointment status provider
final updateAppointmentStatusProvider =
    FutureProvider.family<void, ({String id, String status})>((ref, params) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  await repository.updateAppointmentStatus(params.id, params.status);
  ref.invalidate(appointmentsProvider);
  ref.invalidate(appointmentDetailProvider(params.id));
});

// T5: Assign technician provider
final assignTechnicianProvider =
    FutureProvider.family<void, ({String id, String technician})>((ref, params) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  await repository.assignTechnician(params.id, params.technician);
  ref.invalidate(appointmentsProvider);
  ref.invalidate(appointmentDetailProvider(params.id));
});

// T5: Update notes provider
final updateAppointmentNotesProvider =
    FutureProvider.family<void, ({String id, String notes})>((ref, params) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  await repository.updateNotes(params.id, params.notes);
  ref.invalidate(appointmentsProvider);
  ref.invalidate(appointmentDetailProvider(params.id));
});

// T7: Reschedule appointment provider
final rescheduleAppointmentProvider =
    FutureProvider.family<void, ({String id, DateTime date, String heureDebut, String? heureFin})>((
      ref,
      params,
    ) async {
  final repository = ref.watch(appointmentRepositoryProvider);
  await repository.reschedule(
    params.id,
    params.date,
    params.heureDebut,
    params.heureFin,
  );
  ref.invalidate(appointmentsProvider);
  ref.invalidate(appointmentDetailProvider(params.id));
});
