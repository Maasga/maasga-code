import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/messages/data/models/message.dart';
import 'package:mobile_admin/features/messages/data/repositories/message_repository.dart';

@GenerateMocks([Dio])
import 'message_repository_test.mocks.dart';

void main() {
  late MessageRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = MessageRepository(mockDio);
  });

  group('MessageRepository', () {
    final testMessage = ClientMessage(
      id: 1,
      clientId: 1,
      clientName: 'Jean Dupont',
      clientEmail: 'jean@example.com',
      clientPhone: '+221771234567',
      subject: 'Demande de renseignement',
      message: 'Bonjour, je voudrais plus d\'informations sur vos services.',
      status: 'unread',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    test('should fetch messages successfully', () async {
      final responseData = [testMessage.toJson()];

      when(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).thenAnswer(
        (_) async => Response(
          data: responseData,
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getMessages(status: 'unread');

      expect(result.isNotEmpty, true);
      expect(result.first.subject, 'Demande de renseignement');
      verify(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).called(1);
    });

    test('should respond to message successfully', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.respondToMessage(
        1,
        'Merci pour votre message. Nous vous recontacterons bientôt.',
      );

      expect(result, true);
      verify(mockDio.post(any, data: anyNamed('data'))).called(1);
    });

    test('should update message status successfully', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.updateMessageStatus(1, 'read');

      expect(result, true);
      verify(mockDio.patch(any, data: anyNamed('data'))).called(1);
    });

    test('should delete message successfully', () async {
      when(mockDio.delete(any)).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.deleteMessage(1);

      expect(result, true);
      verify(mockDio.delete(any)).called(1);
    });

    test('should fetch message stats successfully', () async {
      when(mockDio.get(any)).thenAnswer(
        (_) async => Response(
          data: {
            'total': 100,
            'unread': 25,
            'read': 50,
            'responded': 20,
            'archived': 5,
            'today': 10,
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getMessagesStats();

      expect(result['total'], 100);
      expect(result['unread'], 25);
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

      final result = await repository.getMessages();
      expect(result.isEmpty, true);
    });
  });
}
