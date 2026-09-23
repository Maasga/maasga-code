import 'package:dio/dio.dart';
import '../models/appointment.dart';
import '../../../../core/network/api_endpoints.dart';

class AppointmentRepository {
  final Dio _dio;

  AppointmentRepository(this._dio);

  Future<List<Appointment>> getAppointments() async {
    try {
      final response = await _dio.get(ApiEndpoints.appointments);
      final List<dynamic> data = response.data;
      final appointments = data
          .map((json) => Appointment.fromJson(json))
          .toList();
      return appointments;
    } catch (e) {
      if (e is DioException) {
        // Fallback avec liste vide si l'API échoue
        return [];
      }
      throw Exception('Erreur lors du chargement des RDV: $e');
    }
  }

  Future<Appointment> getAppointment(String id) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.rdvDetail, {'id': id}),
      );
      return Appointment.fromJson(response.data);
    } catch (e) {
      throw Exception('Erreur lors du chargement du RDV: $e');
    }
  }

  Future<Appointment> confirmAppointment(String id) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.replacePath(ApiEndpoints.rdvConfirm, {'id': id}),
      );
      return Appointment.fromJson({...response.data, 'id': id});
    } catch (e) {
      if (e is DioException) {
        throw Exception('Erreur lors de la confirmation du RDV: ${e.message}');
      }
      throw Exception('Erreur lors de la confirmation du RDV: $e');
    }
  }

  Future<Appointment> cancelAppointment(String id, {String? reason}) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.replacePath(ApiEndpoints.rdvCancel, {'id': id}),
        data: reason != null ? {'reason': reason} : null,
      );
      return Appointment.fromJson({...response.data, 'id': id});
    } catch (e) {
      if (e is DioException) {
        throw Exception('Erreur lors de l\'annulation du RDV: ${e.message}');
      }
      throw Exception('Erreur lors de l\'annulation du RDV: $e');
    }
  }

  Future<List<Appointment>> getCalendarAppointments({
    int? year,
    int? month,
  }) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.rdvCalendar,
        queryParameters: {'year': ?year, 'month': ?month},
      );
      final List<dynamic> data = response.data;
      return data.map((json) => Appointment.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Erreur lors du chargement du calendrier: $e');
    }
  }
}
