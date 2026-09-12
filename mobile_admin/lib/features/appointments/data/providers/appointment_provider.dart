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
