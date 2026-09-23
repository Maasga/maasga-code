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
  return repository.confirmAppointment(id);
});

// Cancel appointment provider
final cancelAppointmentProvider =
    FutureProvider.family<Appointment, ({String id, String? reason})>((
      ref,
      params,
    ) async {
      final repository = ref.watch(appointmentRepositoryProvider);
      return repository.cancelAppointment(params.id, reason: params.reason);
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
