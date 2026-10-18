import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/clients/data/repositories/client_repository.dart';

@GenerateMocks([Dio])
import 'client_repository_test.mocks.dart';

void main() {
  late ClientRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = ClientRepository(mockDio);
  });

  final clientJson = {
    'id': '5',
    'name': 'Oumar Ndiaye',
    'phone': '77 555 66 77',
    'email': 'oumar@test.sn',
    'quartier': 'Mermoz',
    'order_count': 3,
    'rdv_count': 2,
    'created_at': '2026-01-01T00:00:00.000Z',
  };

  group('ClientRepository - fetchClients', () {
    test('retourne la liste des clients', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: [clientJson],
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final clients = await repository.getClients();
      expect(clients.length, 1);
      expect(clients.first.name, 'Oumar Ndiaye');
      expect(clients.first.orderCount, 3);
    });

    test('lève une exception sur erreur réseau', () async {
      when(mockDio.get(any)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionError,
      ));

      expect(() => repository.getClients(), throwsException);
    });
  });

  group('ClientRepository - fetchClientDetail', () {
    test('retourne le détail d\'un client', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: clientJson,
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final client = await repository.getClient('5');
      expect(client.id, '5');
      expect(client.phone, '77 555 66 77');
    });
  });

  group('ClientRepository - createClient', () {
    test('crée un client avec succès', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenAnswer(
          (_) async => Response(
                data: {'id': 6, 'success': true},
                statusCode: 201,
                requestOptions: RequestOptions(path: ''),
              ));

      final created = await repository.createClient({
        'name': 'Moussa Ba',
        'phone': '70 111 22 33',
        'quartier': 'Parcelles',
      });

      expect(created.name, 'Moussa Ba');
    });

    test('lève une exception si données invalides (422)', () async {
      when(mockDio.post(any, data: anyNamed('data'))).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.badResponse,
        response: Response(
            statusCode: 422, requestOptions: RequestOptions(path: '')),
      ));

      expect(
          () => repository.createClient({'name': ''}), throwsException);
    });
  });

  group('ClientRepository - updateClient', () {
    test('met à jour un client', () async {
      when(mockDio.put(any, data: anyNamed('data'))).thenAnswer(
          (_) async => Response(
                data: {'success': true},
                statusCode: 200,
                requestOptions: RequestOptions(path: ''),
              ));

      final updated = await repository.updateClient('5', {
        'name': 'Oumar Ndiaye Modifié',
        'phone': '77 555 66 77',
      });

      expect(updated.id, '5');
    });
  });

  group('ClientRepository - fetchClientOrders', () {
    test('retourne les commandes du client', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: [
              {'id': 101, 'total_price': 250000, 'status': 'livre'},
            ],
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final orders = await repository.getClientOrders('5');
      expect(orders.length, 1);
      expect((orders.first as Map)['id'], 101);
    });

    test('lève une exception sur erreur réseau', () async {
      when(mockDio.get(any)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionError,
      ));

      expect(() => repository.getClientOrders('5'), throwsException);
    });
  });

  group('ClientRepository - fetchClientRdv', () {
    test('retourne les RDV du client', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: [
              {'id': 20, 'date': '2026-10-20', 'status': 'confirmed'},
            ],
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final rdvList = await repository.getClientRdv('5');
      expect(rdvList.length, 1);
    });
  });
}
