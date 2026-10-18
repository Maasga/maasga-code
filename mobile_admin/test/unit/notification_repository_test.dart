import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/notifications/data/models/notification.dart';
import 'package:mobile_admin/features/notifications/data/repositories/notification_repository.dart';

@GenerateMocks([Dio])
import 'notification_repository_test.mocks.dart';

void main() {
  late NotificationRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = NotificationRepository(mockDio);
  });

  group('NotificationRepository', () {
    final testNotification = NotificationCampaign(
      id: 1,
      title: 'Nouvelle promotion',
      body: 'Profitez de -20% sur tous nos services ce mois-ci!',
      targetSegment: 'all',
      scheduledFor: DateTime.now()
          .add(const Duration(hours: 24))
          .toIso8601String(),
      status: 'draft',
      recipientCount: 0,
      openedCount: 0,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    test('should fetch notifications successfully', () async {
      final responseData = [testNotification.toJson()];

      when(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).thenAnswer(
        (_) async => Response(
          data: responseData,
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getNotifications(status: 'draft');

      expect(result.isNotEmpty, true);
      expect(result.first.title, 'Nouvelle promotion');
      verify(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).called(1);
    });

    test('should create notification successfully', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 201,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.createNotification({
        'title': 'Nouvelle promotion',
        'body': 'Profitez de -20% sur tous nos services ce mois-ci!',
        'target_segment': 'all',
        'scheduled_for': DateTime.now()
            .add(const Duration(hours: 24))
            .toIso8601String(),
      });

      expect(result, true);
      verify(mockDio.post(any, data: anyNamed('data'))).called(1);
    });

    test('should send notification successfully', () async {
      when(mockDio.post(any)).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.sendNotification(1);

      expect(result, true);
      verify(mockDio.post(any)).called(1);
    });

    test('should update notification status successfully', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.updateNotificationStatus(1, 'cancelled');

      expect(result, true);
      verify(mockDio.patch(any, data: anyNamed('data'))).called(1);
    });

    test('should fetch notification stats successfully', () async {
      when(mockDio.get(any)).thenAnswer(
        (_) async => Response(
          data: {
            'total': 100,
            'sent': {'count': 70, 'recipients': 5000},
            'draft': 20,
            'opened': 5000,
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getNotificationsStats();

      expect(result['total'], 100);
      expect(result['sent']['count'], 70);
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

      final result = await repository.getNotifications();
      expect(result.isEmpty, true);
    });
  });
}
