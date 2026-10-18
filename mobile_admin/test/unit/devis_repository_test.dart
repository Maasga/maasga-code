import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/devis/data/models/devis.dart';
import 'package:mobile_admin/features/devis/data/repositories/devis_repository.dart';

@GenerateMocks([Dio])
import 'devis_repository_test.mocks.dart';

void main() {
  late DevisRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = DevisRepository(mockDio);
  });

  group('DevisRepository', () {
    final testDevis = Devis(
      id: 1,
      clientId: 1,
      clientName: 'Jean Dupont',
      clientEmail: 'jean@example.com',
      clientPhone: '+221771234567',
      status: 'draft',
      subtotal: 1000.0,
      total: 1000.0,
      items: [
        DevisItem(
          description: 'Service de maintenance',
          quantity: 1,
          unitPrice: 1000.0,
        ),
      ],
      notes: 'Notes du devis',
      validUntil: DateTime.now()
          .add(const Duration(days: 30))
          .toIso8601String(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    test('should fetch devis successfully', () async {
      final responseData = [testDevis.toJson()];

      when(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).thenAnswer(
        (_) async => Response(
          data: responseData,
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getDevis(status: 'draft');

      expect(result.isNotEmpty, true);
      expect(result.first.total, 1000.0);
      verify(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).called(1);
    });

    test('should create devis successfully', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 201,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.createDevis({
        'client_id': 1,
        'client_name': 'Jean Dupont',
        'client_email': 'jean@example.com',
        'client_phone': '+221771234567',
        'subtotal': 1000.0,
        'total': 1000.0,
        'items': [
          {
            'description': 'Service de maintenance',
            'quantity': 1,
            'unit_price': 1000.0,
          },
        ],
      });

      expect(result, true);
      verify(mockDio.post(any, data: anyNamed('data'))).called(1);
    });

    test('should update devis status successfully', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.updateDevisStatus(1, 'sent');

      expect(result, true);
      verify(mockDio.patch(any, data: anyNamed('data'))).called(1);
    });

    test('should convert devis to order successfully', () async {
      when(mockDio.post(any)).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.convertDevisToOrder(1);

      expect(result, true);
      verify(mockDio.post(any)).called(1);
    });

    test('should fetch devis stats successfully', () async {
      when(mockDio.get(any)).thenAnswer(
        (_) async => Response(
          data: {
            'total': {'count': 50, 'amount': 50000.0},
            'draft': {'count': 10, 'amount': 10000.0},
            'sent': {'count': 20, 'amount': 20000.0},
            'accepted': {'count': 15, 'amount': 15000.0},
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getDevisStats();

      expect(result['total']['count'], 50);
      expect(result['accepted']['count'], 15);
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

      final result = await repository.getDevis();
      expect(result.isEmpty, true);
    });
  });
}
