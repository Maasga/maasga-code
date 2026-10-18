import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/payments/data/models/payment.dart';
import 'package:mobile_admin/features/payments/data/repositories/payment_repository.dart';

@GenerateMocks([Dio])
import 'payments_repository_test.mocks.dart';

void main() {
  late PaymentRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = PaymentRepository(mockDio);
  });

  group('PaymentRepository', () {
    final testPayment = Payment(
      id: 1,
      amount: 100.0,
      currency: 'XOF',
      status: 'completed',
      paymentMethod: 'mobile_money',
      transactionId: 'TXN123456',
      orderId: 1,
      clientId: 1,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    test('should fetch payments successfully', () async {
      final responseData = [testPayment.toJson()];

      when(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).thenAnswer(
        (_) async => Response(
          data: responseData,
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getPayments(status: 'completed');

      expect(result.isNotEmpty, true);
      expect(result.first.amount, 100.0);
      verify(
        mockDio.get(any, queryParameters: anyNamed('queryParameters')),
      ).called(1);
    });

    test('should create payment successfully', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 201,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.createPayment({
        'amount': 100.0,
        'order_id': 1,
        'client_id': 1,
      });

      expect(result, true);
      verify(mockDio.post(any, data: anyNamed('data'))).called(1);
    });

    test('should update payment status successfully', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
        (_) async => Response(
          data: {'success': true},
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.updatePaymentStatus(1, 'refunded');

      expect(result, true);
      verify(mockDio.patch(any, data: anyNamed('data'))).called(1);
    });

    test('should fetch payment stats successfully', () async {
      when(mockDio.get(any)).thenAnswer(
        (_) async => Response(
          data: {
            'total': {'count': 10, 'amount': 1000.0},
            'pending': {'count': 2, 'amount': 200.0},
            'completed': {'count': 8, 'amount': 800.0},
            'failed': {'count': 0, 'amount': 0.0},
            'today': {'count': 1, 'amount': 150.0},
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: ''),
        ),
      );

      final result = await repository.getPaymentStats();

      expect(result['total']['amount'], 1000.0);
      expect(result['completed']['amount'], 800.0);
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

      final result = await repository.getPayments();
      expect(result.isEmpty, true);
    });
  });
}
