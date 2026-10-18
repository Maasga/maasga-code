import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/orders/data/repositories/order_repository.dart';

@GenerateMocks([Dio])
import 'order_repository_test.mocks.dart';

void main() {
  late OrderRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = OrderRepository(mockDio);
  });

  final orderJson = {
    'id': '1',
    'client_name': 'Amadou Diallo',
    'client_phone': '77 123 45 67',
    'quartier': 'Plateau',
    'status': 'en_attente',
    'type': 'vente',
    'total_price': 350000.0,
    'product_name': 'Climatiseur 18000 BTU',
    'brand': 'Daikin',
    'btu': 18000,
    'quantity': 1,
    'product_price': 320000.0,
    'installation_price': 30000.0,
    'created_at': '2026-01-15T10:00:00.000Z',
  };

  group('OrderRepository - fetchOrders', () {
    test('retourne la liste des commandes avec succès', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: [orderJson],
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final orders = await repository.getOrders();
      expect(orders.length, 1);
      expect(orders.first.clientName, 'Amadou Diallo');
      expect(orders.first.status, 'en_attente');
    });

    test('lève une exception sur erreur réseau', () async {
      when(mockDio.get(any)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionTimeout,
      ));

      expect(() => repository.getOrders(), throwsException);
    });
  });

  group('OrderRepository - fetchOrderDetail', () {
    test('retourne le détail d\'une commande', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: orderJson,
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final order = await repository.getOrder('1');
      expect(order.id, '1');
      expect(order.totalPrice, 350000.0);
    });

    test('lève une exception si commande non trouvée (404)', () async {
      when(mockDio.get(any)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        response: Response(
          statusCode: 404,
          requestOptions: RequestOptions(path: ''),
        ),
        type: DioExceptionType.badResponse,
      ));

      expect(() => repository.getOrder('99'), throwsException);
    });
  });

  group('OrderRepository - updateOrderStatus', () {
    test('met à jour le statut avec succès', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
          (_) async => Response(
                data: {...orderJson, 'status': 'confirme'},
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final updated = await repository.updateOrderStatus('1', 'confirme');
      expect(updated.status, 'confirme');
    });

    test('lève une exception sur erreur serveur (500)', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        response: Response(
          statusCode: 500,
          requestOptions: RequestOptions(path: ''),
        ),
        type: DioExceptionType.badResponse,
      ));

      expect(
        () => repository.updateOrderStatus('1', 'confirme'),
        throwsException,
      );
    });
  });

  group('OrderRepository - cancelOrder', () {
    test('annule une commande avec succès', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenAnswer(
          (_) async => Response(
                data: {'success': true},
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      // Ne doit pas lever d'exception
      await expectLater(repository.cancelOrder('1'), completes);
    });

    test('lève une exception si commande inexistante', () async {
      when(mockDio.patch(any, data: anyNamed('data'))).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        response: Response(
          statusCode: 404,
          requestOptions: RequestOptions(path: ''),
        ),
        type: DioExceptionType.badResponse,
      ));

      expect(() => repository.cancelOrder('99'), throwsException);
    });
  });

  group('OrderRepository - addOrderNotes', () {
    test('ajoute une note avec succès', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
          (_) async => Response(
                data: {'success': true},
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      await expectLater(
          repository.addOrderNotes('1', 'Note de test'), completes);
    });

    test('lève une exception sur erreur réseau', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionError,
      ));

      expect(
          () => repository.addOrderNotes('1', 'Note'), throwsException);
    });
  });
}
