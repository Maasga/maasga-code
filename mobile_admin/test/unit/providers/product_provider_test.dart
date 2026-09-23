import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_admin/features/products/data/repositories/product_repository.dart';
import 'package:mobile_admin/features/products/data/providers/product_provider.dart';
import '../../helpers/mock_dio_helper.dart';

void main() {
  group('ProductProvider', () {
    late ProviderContainer container;

    setUp(() {
      // Créer un container pour les tests avec override
      container = ProviderContainer(overrides: []);
    });

    tearDown(() {
      // Nettoyer le container après chaque test
      container.dispose();
    });

    group('productsProvider', () {
      test('retourne la liste des produits depuis le repository', () async {
        // Arrange
        final mockResponse = [
          {
            'id': '1',
            'name': 'Climatiseur Split Inverter 12000 BTU',
            'description': 'Climatiseur haute performance',
            'price': 350000,
            'stock': 10,
            'image_url': 'https://example.com/image.jpg',
            'category': 'split',
            'brand': 'Daikin',
            'model': 'FTXM35RVMA',
            'btu': 12000,
            'surface_min': 40,
            'surface_max': 60,
            'energy_class': 'A+++',
            'inverter': 1,
            'warranty': '5 ans',
            'is_active': 1,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z',
          },
        ];
        final mockDio = MockDioHelper.createMockDioWithResponse(mockResponse);
        final mockRepository = ProductRepository(mockDio);

        // Override le provider avec le repository mocké
        final testContainer = ProviderContainer(
          overrides: [
            productRepositoryProvider.overrideWithValue(mockRepository),
          ],
        );

        // Act
        final products = await testContainer.read(productsProvider.future);

        // Assert
        expect(products, isNotNull);
        expect(products.length, 1);
        expect(products[0].name, 'Climatiseur Split Inverter 12000 BTU');

        testContainer.dispose();
      });

      test('gère les erreurs du repository', () async {
        // Arrange
        final mockDio = MockDioHelper.createMockDioWithError(
          500,
          'Erreur serveur',
        );
        final mockRepository = ProductRepository(mockDio);

        final testContainer = ProviderContainer(
          overrides: [
            productRepositoryProvider.overrideWithValue(mockRepository),
          ],
        );

        // Act & Assert
        expect(
          () => testContainer.read(productsProvider.future),
          throwsA(isA<Exception>()),
        );

        testContainer.dispose();
      });
    });

    group('createProductProvider', () {
      test('crée un nouveau produit', () async {
        // Arrange
        final mockResponse = {
          'id': '3',
          'name': 'Nouveau Climatiseur',
          'description': 'Description du produit',
          'price': 500000,
          'stock': 15,
          'image_url': 'https://example.com/new.jpg',
          'category': 'split',
          'brand': 'Mitsubishi',
          'model': 'SRK50ZMX',
          'btu': 18000,
          'surface_min': 60,
          'surface_max': 90,
          'energy_class': 'A++',
          'inverter': 1,
          'warranty': '3 ans',
          'is_active': 1,
          'created_at': '2024-01-01T00:00:00Z',
          'updated_at': '2024-01-01T00:00:00Z',
        };
        final mockDio = MockDioHelper.createMockDioWithResponse(mockResponse);
        final mockRepository = ProductRepository(mockDio);

        final testContainer = ProviderContainer(
          overrides: [
            productRepositoryProvider.overrideWithValue(mockRepository),
          ],
        );

        final productData = {
          'name': 'Nouveau Climatiseur',
          'description': 'Description du produit',
          'price': 500000,
          'stock': 15,
          'image_url': 'https://example.com/new.jpg',
          'category': 'split',
          'brand': 'Mitsubishi',
          'model': 'SRK50ZMX',
          'btu': 18000,
          'surface_min': 60,
          'surface_max': 90,
          'energy_class': 'A++',
          'inverter': true,
          'warranty': '3 ans',
          'is_active': true,
        };

        // Act
        final product = await testContainer.read(
          createProductProvider(productData).future,
        );

        // Assert
        expect(product.id, '3');
        expect(product.name, 'Nouveau Climatiseur');
        expect(product.price, 500000);

        testContainer.dispose();
      });
    });

    group('updateProductProvider', () {
      test('met à jour un produit existant', () async {
        // Arrange
        final mockResponse = {
          'id': '1',
          'name': 'Climatiseur Modifié',
          'description': 'Description modifiée',
          'price': 400000,
          'stock': 8,
          'image_url': 'https://example.com/image.jpg',
          'category': 'split',
          'brand': 'Daikin',
          'model': 'FTXM35RVMA',
          'btu': 12000,
          'surface_min': 40,
          'surface_max': 60,
          'energy_class': 'A+++',
          'inverter': 1,
          'warranty': '5 ans',
          'is_active': 1,
          'created_at': '2024-01-01T00:00:00Z',
          'updated_at': '2024-01-02T00:00:00Z',
        };
        final mockDio = MockDioHelper.createMockDioWithResponse(mockResponse);
        final mockRepository = ProductRepository(mockDio);

        final testContainer = ProviderContainer(
          overrides: [
            productRepositoryProvider.overrideWithValue(mockRepository),
          ],
        );

        final updateData = {
          'name': 'Climatiseur Modifié',
          'description': 'Description modifiée',
          'price': 400000,
          'stock': 8,
        };

        // Act
        await testContainer.read(
          updateProductProvider((id: '1', data: updateData)).future,
        );

        // Assert - ne lance pas d'exception
        expect(true, isTrue);

        testContainer.dispose();
      });
    });

    group('deleteProductProvider', () {
      test('supprime un produit', () async {
        // Arrange
        final mockResponse = {'success': true};
        final mockDio = MockDioHelper.createMockDioWithResponse(mockResponse);
        final mockRepository = ProductRepository(mockDio);

        final testContainer = ProviderContainer(
          overrides: [
            productRepositoryProvider.overrideWithValue(mockRepository),
          ],
        );

        // Act
        await testContainer.read(deleteProductProvider('1').future);

        // Assert - ne lance pas d'exception
        expect(true, isTrue);

        testContainer.dispose();
      });
    });
  });
}
