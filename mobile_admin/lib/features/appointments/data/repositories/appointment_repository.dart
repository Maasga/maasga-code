import 'package:dio/dio.dart';
import '../models/appointment.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/utils/app_logger.dart';

class AppointmentRepository {
  final Dio _dio;

  AppointmentRepository(this._dio);

  Future<List<Appointment>> getAppointments() async {
    try {
      AppLogger.info('Chargement des rendez-vous');
      final response = await _dio.get(ApiEndpoints.appointments);
      final List<dynamic> data = response.data;
      final appointments = data
          .map((json) => Appointment.fromJson(json))
          .toList();
      AppLogger.response(
        ApiEndpoints.appointments,
        response.statusCode,
        appointments.length,
      );
      return appointments;
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.getAppointments');
      if (e is DioException) {
        return [];
      }
      throw Exception('Erreur lors du chargement des RDV: $e');
    }
  }

  Future<Appointment> getAppointment(String id) async {
    try {
      AppLogger.info('Chargement du rendez-vous $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.rdvDetail, {'id': id}),
      );
      AppLogger.response(ApiEndpoints.rdvDetail, response.statusCode);
      return Appointment.fromJson(response.data);
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.getAppointment');
      throw Exception('Erreur lors du chargement du RDV: $e');
    }
  }

  Future<Appointment> confirmAppointment(String id) async {
    try {
      AppLogger.info('Confirmation du rendez-vous $id');
      final response = await _dio.post(
        ApiEndpoints.replacePath(ApiEndpoints.rdvConfirm, {'id': id}),
      );
      AppLogger.response(ApiEndpoints.rdvConfirm, response.statusCode);
      return Appointment.fromJson({...response.data, 'id': id});
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.confirmAppointment');
      if (e is DioException) {
        throw Exception('Erreur lors de la confirmation du RDV: ${e.message}');
      }
      throw Exception('Erreur lors de la confirmation du RDV: $e');
    }
  }

  Future<Appointment> cancelAppointment(String id, {String? reason}) async {
    try {
      AppLogger.info('Annulation du rendez-vous $id');
      final response = await _dio.post(
        ApiEndpoints.replacePath(ApiEndpoints.rdvCancel, {'id': id}),
        data: reason != null ? {'reason': reason} : null,
      );
      AppLogger.response(ApiEndpoints.rdvCancel, response.statusCode);
      return Appointment.fromJson({...response.data, 'id': id});
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.cancelAppointment');
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
      AppLogger.info('Chargement calendrier des RDV ($year-$month)');
      final response = await _dio.get(
        ApiEndpoints.rdvCalendar,
        queryParameters: {'year': ?year, 'month': ?month},
      );
      final List<dynamic> data = response.data;
      final appointments = data
          .map((json) => Appointment.fromJson(json))
          .toList();
      AppLogger.response(
        ApiEndpoints.rdvCalendar,
        response.statusCode,
        appointments.length,
      );
      return appointments;
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.getCalendarAppointments');
      if (e is DioException) {
        return [];
      }
      throw Exception('Erreur lors du chargement du calendrier: $e');
    }
  }

  Future<Appointment> createAppointment(Map<String, dynamic> data) async {
    try {
      AppLogger.info('Création d\'un rendez-vous');
      final response = await _dio.post(ApiEndpoints.rdvCreate, data: data);
      AppLogger.response(ApiEndpoints.rdvCreate, response.statusCode);
      return Appointment.fromJson(response.data);
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.createAppointment');
      if (e is DioException) {
        throw Exception('Erreur lors de la création du RDV: ${e.message}');
      }
      throw Exception('Erreur lors de la création du RDV: $e');
    }
  }

  Future<void> updateAppointmentStatus(String id, String status) async {
    try {
      AppLogger.info('Mise à jour statut RDV $id -> $status');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.rdvDetail, {'id': id}),
        data: {'status': status},
      );
      AppLogger.response(ApiEndpoints.rdvDetail, response.statusCode);
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.updateAppointmentStatus');
      if (e is DioException) {
        throw Exception(
          'Erreur lors de la mise à jour du statut: ${e.message}',
        );
      }
      throw Exception('Erreur lors de la mise à jour du statut: $e');
    }
  }

  /// T5: Assignation d'un technicien à un rendez-vous
  Future<void> assignTechnician(String id, String technician) async {
    try {
      AppLogger.info('Assignation technicien au RDV $id -> $technician');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.rdvDetail, {'id': id}),
        data: {'technician': technician},
      );
      AppLogger.response(ApiEndpoints.rdvDetail, response.statusCode);
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.assignTechnician');
      if (e is DioException) {
        throw Exception(
          'Erreur lors de l\'assignation du technicien: ${e.message}',
        );
      }
      throw Exception('Erreur lors de l\'assignation du technicien: $e');
    }
  }

  /// T5: Mise à jour des notes terrain d'un rendez-vous
  Future<void> updateNotes(String id, String notes) async {
    try {
      AppLogger.info('Mise à jour des notes du RDV $id');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.rdvDetail, {'id': id}),
        data: {'notes': notes},
      );
      AppLogger.response(ApiEndpoints.rdvDetail, response.statusCode);
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.updateNotes');
      if (e is DioException) {
        throw Exception(
          'Erreur lors de la mise à jour des notes: ${e.message}',
        );
      }
      throw Exception('Erreur lors de la mise à jour des notes: $e');
    }
  }

  /// T7: Reprogrammation d'un rendez-vous (reschedule)
  Future<void> reschedule(
    String id,
    DateTime date,
    String heureDebut, [
    String? heureFin,
  ]) async {
    try {
      final formattedDate = date.toIso8601String().split('T')[0];
      AppLogger.info(
        'Reprogrammation du RDV $id au $formattedDate à $heureDebut',
      );
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.rdvDetail, {'id': id}),
        data: {
          'date': formattedDate,
          'heure_debut': heureDebut,
          'heure_fin': ?heureFin,
        },
      );
      AppLogger.response(ApiEndpoints.rdvDetail, response.statusCode);
    } catch (e) {
      AppLogger.error(e, null, 'AppointmentRepository.reschedule');
      if (e is DioException) {
        throw Exception('Erreur lors de la reprogrammation: ${e.message}');
      }
      throw Exception('Erreur lors de la reprogrammation: $e');
    }
  }
}
