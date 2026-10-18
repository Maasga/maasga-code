import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/realisations/data/models/realisation.dart';
import 'package:mobile_admin/features/realisations/data/repositories/realisation_repository.dart';

@GenerateMocks([Dio])
import 'realisation_repository_test.mocks.dart';

void main() {
  late RealisationRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = RealisationRepository(mockDio);
  });

  group('RealisationRepository', () {
    final testRealisation = Realisation(
      id: 1,
      title: 'Rénovation bureau central',
      description:
          'Rénovation complète du bureau central avec installation de système de climatisation moderne.',
      category: 'commercial',
      location: 'Dakar, Sénégal',
      clientName: 'ABC Corporation',
      status: 'published',
      featured: true,
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ],
      completionDate: DateTime.now()
          .subtract(const Duration(days: 30))
          .toIso8601String(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    test('should fetch realisations successfully', () async {
      final responseData = [testRealisation.toJson()];

      when(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).thenAnswer(
        (_) async => Response(
          data: responseData,
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getRealisations(category: 'commercial');

      expect(result.isNotEmpty, true);
      expect(result.first.title, 'Rénovation bureau central');
      verify(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).called(1);
    });

    test('should create realisation successfully', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 201,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.createRealisation({
        'title': 'Rénovation bureau central',
        'description': 'Rénovation complète du bureau central.',
        'category': 'commercial',
        'location': 'Dakar, Sénégal',
        'client_name': 'ABC Corporation',
        'images': ['https://example.com/image1.jpg'],
      });

      expect(result, true);
      verify(mockDio.post(any, data: anyNamed('data'))).called(1);
    });

    test('should update realisation successfully', () async {
      when(mockDio.put(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.updateRealisation(1, {
        'title': 'Rénovation bureau central - Mis à jour',
      });

      expect(result, true);
      verify(mockDio.put(any, data: anyNamed('data'))).called(1);
    });

    test('should toggle featured status successfully', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.toggleFeatured(1, true);

      expect(result, true);
      verify(mockDio.patch(any, data: anyNamed('data'))).called(1);
    });

    test('should delete realisation successfully', () async {
      when(mockDio.delete(any)).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.deleteRealisation(1);

      expect(result, true);
      verify(mockDio.delete(any)).called(1);
    });

    test('should fetch realisation stats successfully', () async {
      when(mockDio.get(any)).thenAnswer(
        (_) async => Response(
          data: {
            'total': 50,
            'published': 35,
            'draft': 10,
            'archived': 5,
            'featured': 8,
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getRealisationsStats();

      expect(result['total'], 50);
      expect(result['featured'], 8);
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

      final result = await repository.getRealisations();
      expect(result.isEmpty, true);
    });
  });
}
