import 'package:dio/dio.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

@GenerateMocks([Dio])
import 'mock_dio_helper.mocks.dart';

/// Helper pour créer des Dio mockés pour les tests
/// Adapté de l'app mobile principale pour l'app admin
class MockDioHelper {
  /// Crée un Dio mocké qui retourne une réponse JSON donnée
  static Dio createMockDioWithResponse(dynamic responseData) {
    final mockDio = MockDio();

    final response = Response<dynamic>(
      data: responseData,
      statusCode: 200,
      requestOptions: RequestOptions(path: ''),
    );

    when(
      mockDio.get(any, queryParameters: anyNamed('queryParameters')),
    ).thenAnswer((_) async => response);

    when(
      mockDio.post(any, data: anyNamed('data')),
    ).thenAnswer((_) async => response);

    when(
      mockDio.put(any, data: anyNamed('data')),
    ).thenAnswer((_) async => response);

    when(
      mockDio.patch(any, data: anyNamed('data')),
    ).thenAnswer((_) async => response);

    when(mockDio.delete(any)).thenAnswer((_) async => response);

    return mockDio as Dio;
  }

  /// Crée un Dio mocké qui lance une erreur
  static Dio createMockDioWithError(int statusCode, String message) {
    final mockDio = MockDio();

    final error = DioException(
      requestOptions: RequestOptions(path: ''),
      response: Response<dynamic>(
        data: {'error': message},
        statusCode: statusCode,
        requestOptions: RequestOptions(path: ''),
      ),
      type: DioExceptionType.badResponse,
    );

    when(
      mockDio.get(any, queryParameters: anyNamed('queryParameters')),
    ).thenThrow(error);

    when(mockDio.post(any, data: anyNamed('data'))).thenThrow(error);

    when(mockDio.put(any, data: anyNamed('data'))).thenThrow(error);

    when(mockDio.patch(any, data: anyNamed('data'))).thenThrow(error);

    when(mockDio.delete(any)).thenThrow(error);

    return mockDio as Dio;
  }

  /// Crée un Dio mocké avec réponses personnalisées par endpoint
  /// Note: Cette méthode est simplifiée pour éviter les problèmes de matcher complexe
  static Dio createMockDioWithEndpoints(Map<String, dynamic> responses) {
    // Pour l'instant, utilise la méthode simple avec réponse unique
    // Cette méthode sera améliorée si nécessaire
    if (responses.isNotEmpty) {
      final firstResponse = responses.values.first;
      return createMockDioWithResponse(firstResponse);
    }
    return createEmptyMockDio();
  }

  /// Crée un Dio mocké vide (pour les tests qui n'ont pas besoin de réponse réseau)
  static Dio createEmptyMockDio() {
    final mockDio = MockDio();

    when(
      mockDio.get(any, queryParameters: anyNamed('queryParameters')),
    ).thenAnswer(
      (_) async => Response(
        data: [],
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ),
    );

    when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
      (_) async => Response(
        data: {},
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ),
    );

    when(mockDio.put(any, data: anyNamed('data'))).thenAnswer(
      (_) async => Response(
        data: {},
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ),
    );

    when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
      (_) async => Response(
        data: {},
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ),
    );

    when(mockDio.delete(any)).thenAnswer(
      (_) async => Response(
        data: {},
        statusCode: 200,
        requestOptions: RequestOptions(path: ''),
      ),
    );

    return mockDio as Dio;
  }
}
