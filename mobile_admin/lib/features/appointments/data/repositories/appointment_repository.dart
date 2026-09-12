import 'package:dio/dio.dart';
import '../models/appointment.dart';
import '../../../../core/network/api_endpoints.dart';

class AppointmentRepository {
  final Dio _dio;

  AppointmentRepository(this._dio);

  Future<List<Appointment>> getAppointments() async {
    try {
      print('📅 Chargement des RDV depuis: ${ApiEndpoints.appointments}');
      final response = await _dio.get(ApiEndpoints.appointments);
      print('✅ Réponse reçue - Status: ${response.statusCode}');
      print('📊 Données: ${response.data}');
      final List<dynamic> data = response.data;
      final appointments = data
          .map((json) => Appointment.fromJson(json))
          .toList();
      print('📅 ${appointments.length} RDV chargés');
      return appointments;
    } catch (e) {
      print('❌ Erreur lors du chargement des RDV: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      // Fallback avec liste vide si l'API échoue
      print('⚠️ Utilisation d\'une liste vide pour les RDV');
      return [];
    }
  }

  Future<Appointment> getAppointment(String id) async {
    try {
      print('📅 Chargement du RDV $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.appointments, {'id': id}),
      );
      print('✅ RDV $id chargé');
      return Appointment.fromJson(response.data);
    } catch (e) {
      print('❌ Erreur lors du chargement du RDV $id: $e');
      throw Exception('Erreur lors du chargement du RDV: $e');
    }
  }

  Future<Appointment> updateAppointmentStatus(String id, String status) async {
    try {
      print('📅 Mise à jour du statut du RDV $id: $status');
      final response = await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.appointments, {'id': id}),
        data: {'status': status},
      );
      print('✅ Statut du RDV $id mis à jour');
      return Appointment.fromJson(response.data);
    } catch (e) {
      print('❌ Erreur lors de la mise à jour du statut: $e');
      throw Exception('Erreur lors de la mise à jour du statut: $e');
    }
  }

  Future<void> cancelAppointment(String id) async {
    try {
      print('📅 Annulation du RDV $id');
      await _dio.patch(
        ApiEndpoints.replacePath(ApiEndpoints.appointments, {'id': id}),
        data: {'status': 'cancelled'},
      );
      print('✅ RDV $id annulé');
    } catch (e) {
      print('❌ Erreur lors de l\'annulation du RDV: $e');
      throw Exception('Erreur lors de l\'annulation du RDV: $e');
    }
  }
}
