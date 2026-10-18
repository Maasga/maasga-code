import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/sav/data/models/sav_ticket.dart';
import 'package:mobile_admin/features/sav/data/repositories/sav_repository.dart';

@GenerateMocks([Dio])
import 'sav_repository_test.mocks.dart';

void main() {
  late SavRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = SavRepository(mockDio);
  });

  group('SavRepository', () {
    final testTicket = SavTicket(
      id: 1,
      clientId: 1,
      clientName: 'Jean Dupont',
      clientPhone: '+221771234567',
      issueDescription: 'Mon appareil ne fonctionne plus correctement.',
      equipmentType: 'Climatiseur',
      priority: 'high',
      status: 'open',
      assignedTechnician: null,
      resolution: null,
      resolutionDate: null,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    test('should fetch SAV tickets successfully', () async {
      final responseData = [testTicket.toJson()];

      when(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).thenAnswer(
        (_) async => Response(
          data: responseData,
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getSavTickets(status: 'open');

      expect(result.isNotEmpty, true);
      expect(
        result.first.issueDescription,
        'Mon appareil ne fonctionne plus correctement.',
      );
      verify(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).called(1);
    });

    test('should create SAV ticket successfully', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 201,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.createSavTicket({
        'client_id': 1,
        'client_name': 'Jean Dupont',
        'client_phone': '+221771234567',
        'issue_description': 'Mon appareil ne fonctionne plus correctement.',
        'equipment_type': 'Climatiseur',
        'priority': 'high',
      });

      expect(result, true);
      verify(mockDio.post(any, data: anyNamed('data'))).called(1);
    });

    test('should assign technician successfully', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.assignTechnician(1, 'tech_001');

      expect(result, true);
      verify(mockDio.patch(any, data: anyNamed('data'))).called(1);
    });

    test('should resolve ticket successfully', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.resolveSavTicket(
        1,
        'Problème résolu après remplacement de la pièce défectueuse.',
      );

      expect(result, true);
      verify(mockDio.patch(any, data: anyNamed('data'))).called(1);
    });

    test('should update ticket status successfully', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.updateSavTicketStatus(1, 'in_progress');

      expect(result, true);
      verify(mockDio.patch(any, data: anyNamed('data'))).called(1);
    });

    test('should fetch SAV stats successfully', () async {
      when(mockDio.get(any)).thenAnswer(
        (_) async => Response(
          data: {
            'total': 50,
            'open': 15,
            'in_progress': 20,
            'resolved': 10,
            'closed': 5,
            'urgent': 5,
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getSavStats();

      expect(result['total'], 50);
      expect(result['urgent'], 5);
      verify(mockDio.get(any)).called(1);
    });

    test('should handle DioException', () async {
      when(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: ''),
          type: DioExceptionType.connectionTimeout,
        ),
      );

      final result = await repository.getSavTickets();
      expect(result.isEmpty, true);
    });
  });
}
