import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/appointments/data/repositories/appointment_repository.dart';

@GenerateMocks([Dio])
import 'appointment_repository_test.mocks.dart';

void main() {
  late AppointmentRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = AppointmentRepository(mockDio);
  });

  final rdvJson = {
    'id': '10',
    'name': 'Fatou Sow',
    'phone': '76 000 11 22',
    'date': '2026-10-20',
    'heure_debut': '09:00',
    'status': 'pending',
    'quartier': 'Almadies',
    'created_at': '2026-10-10T08:00:00.000Z',
  };

  group('AppointmentRepository - fetchAppointments', () {
    test('retourne la liste vide sur DioException (fallback)', () async {
      when(mockDio.get(any)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionTimeout,
      ));

      final result = await repository.getAppointments();
      expect(result, isEmpty);
    });

    test('retourne les RDV parsés avec succès', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: [rdvJson],
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final result = await repository.getAppointments();
      expect(result.length, 1);
      expect(result.first.customerName, 'Fatou Sow');
    });
  });

  group('AppointmentRepository - getAppointment (detail)', () {
    test('retourne le détail d\'un RDV', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: rdvJson,
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final rdv = await repository.getAppointment('10');
      expect(rdv.id, '10');
      expect(rdv.time, '09:00');
    });

    test('lève une exception si RDV inexistant', () async {
      when(mockDio.get(any)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.badResponse,
      ));

      expect(() => repository.getAppointment('999'), throwsException);
    });
  });

  group('AppointmentRepository - confirmAppointment', () {
    test('confirme un RDV avec succès', () async {
      when(mockDio.post(any)).thenAnswer((_) async => Response(
            data: {...rdvJson, 'status': 'confirmed'},
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final confirmed = await repository.confirmAppointment('10');
      expect(confirmed.id, '10');
    });

    test('lève une exception sur erreur serveur', () async {
      when(mockDio.post(any)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.badResponse,
        response: Response(
            statusCode: 500, requestOptions: RequestOptions(path: '')),
      ));

      expect(() => repository.confirmAppointment('10'), throwsException);
    });
  });

  group('AppointmentRepository - cancelAppointment', () {
    test('annule un RDV avec succès', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
          (_) async => Response(
                data: {...rdvJson, 'status': 'cancelled'},
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final cancelled =
          await repository.cancelAppointment('10', reason: 'Client absent');
      expect(cancelled.id, '10');
    });
  });

  group('AppointmentRepository - createAppointment', () {
    test('crée un RDV avec succès', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
          (_) async => Response(
                data: rdvJson,
                statusCode: 201,
                requestOptions: RequestOptions(path: ''),
              ));

      final created = await repository.createAppointment({
        'name': 'Fatou Sow',
        'phone': '76 000 11 22',
        'date': '2026-10-20',
        'heure_debut': '09:00',
        'quartier': 'Almadies',
        'type': 'devis',
      });

      expect(created.customerName, 'Fatou Sow');
    });

    test('lève une exception sur erreur réseau', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionError,
      ));

      expect(
          () => repository.createAppointment({'name': 'Test'}),
          throwsException);
    });
  });
}
