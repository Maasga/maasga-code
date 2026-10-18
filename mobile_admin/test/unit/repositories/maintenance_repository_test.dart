import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:mobile_admin/features/maintenance/data/repositories/maintenance_admin_repository.dart';

@GenerateMocks([Dio])
import 'maintenance_repository_test.mocks.dart';

void main() {
  late MaintenanceAdminRepository repository;
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
    repository = MaintenanceAdminRepository(mockDio);
  });

  group('MaintenanceAdminRepository - getSummary', () {
    test('retourne le résumé avec succès', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: {
              'active_contracts': 5,
              'pending_contracts': 2,
              'pending_requests': 3,
              'due_visits': 1,
              'total_visits': 20,
            },
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final summary = await repository.getSummary();
      expect(summary['active_contracts'], 5);
      expect(summary['pending_requests'], 3);
    });

    test('retourne des valeurs par défaut sur erreur', () async {
      when(mockDio.get(any)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionError,
      ));

      final summary = await repository.getSummary();
      expect(summary['active_contracts'], 0);
    });
  });

  group('MaintenanceAdminRepository - getContracts', () {
    test('retourne la liste des contrats', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: [
              {
                'id': 1,
                'client_name': 'Ibrahima Fall',
                'plan_type': 'Premium',
                'status': 'active',
                'completed_visits': 2,
                'total_visits': 4,
              }
            ],
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final contracts = await repository.getContracts();
      expect(contracts.length, 1);
      expect(contracts.first['client_name'], 'Ibrahima Fall');
      expect(contracts.first['plan_type'], 'Premium');
    });

    test('retourne liste vide sur erreur', () async {
      when(mockDio.get(any)).thenThrow(DioException(
        requestOptions: RequestOptions(path: ''),
        type: DioExceptionType.connectionError,
      ));

      final result = await repository.getContracts();
      expect(result, isEmpty);
    });
  });

  group('MaintenanceAdminRepository - getRequests', () {
    test('retourne les demandes de maintenance', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: [
              {'id': 10, 'status': 'pending', 'client_name': 'Marie Diop'}
            ],
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final requests = await repository.getRequests();
      expect(requests.length, 1);
      expect(requests.first['status'], 'pending');
    });
  });

  group('MaintenanceAdminRepository - getVisits', () {
    test('retourne les visites planifiées', () async {
      when(mockDio.get(any)).thenAnswer((_) async => Response(
            data: [
              {
                'id': 50,
                'contract_id': 1,
                'visit_date': '2026-11-01',
                'status': 'planned',
              }
            ],
            statusCode: 200,
            requestOptions: RequestOptions(path: ''),
          ));

      final visits = await repository.getVisits();
      expect(visits.length, 1);
      expect(visits.first['status'], 'planned');
    });
  });
}
