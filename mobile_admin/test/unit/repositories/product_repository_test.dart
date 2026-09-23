import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_admin/features/products/data/repositories/product_repository.dart';
import '../../helpers/mock_dio_helper.dart';

void main() {
  group('ProductRepository', () {
    group('getProducts', () {
      test('retourne la liste des produits', () async {
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
          {
            'id': '2',
            'name': 'Climatiseur Split Inverter 18000 BTU',
            'description': 'Climatiseur très haute performance',
            'price': 450000,
            'stock': 5,
            'image_url': 'https://example.com/image2.jpg',
            'category': 'split',
            'brand': 'Daikin',
            'model': 'FTXM50RVMA',
            'btu': 18000,
            'surface_min': 60,
            'surface_max': 90,
            'energy_class': 'A+++',
            'inverter': 1,
            'warranty': '5 ans',
            'is_active': 1,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z',
          },
        ];
        final mockDio = MockDioHelper.createMockDioWithResponse(mockResponse);
        final repository = ProductRepository(mockDio);

        // Act
        final products = await repository.getProducts();

        // Assert
        expect(products.length, 2);
        expect(products[0].id, '1');
        expect(products[0].name, 'Climatiseur Split Inverter 12000 BTU');
        expect(products[0].price, 350000);
        expect(products[0].stock, 10);
        expect(products[0].brand, 'Daikin');
        expect(products[0].btu, 12000);
      });

      test('retourne une liste vide si aucune donnée', () async {
        // Arrange
        final mockDio = MockDioHelper.createMockDioWithResponse(<dynamic>[]);
        final repository = ProductRepository(mockDio);

        // Act
        final products = await repository.getProducts();

        // Assert
        expect(products, isEmpty);
      });

      test('lance une erreur si le backend retourne une erreur', () async {
        // Arrange
        final mockDio = MockDioHelper.createMockDioWithError(
          500,
          'Erreur serveur',
        );
        final repository = ProductRepository(mockDio);

        // Act & Assert
        expect(() => repository.getProducts(), throwsA(isA<Exception>()));
      });
    });

    group('getProduct', () {
      test('retourne un produit par ID', () async {
        // Arrange
        final mockResponse = {
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
        };
        final mockDio = MockDioHelper.createMockDioWithResponse(mockResponse);
        final repository = ProductRepository(mockDio);

        // Act
        final product = await repository.getProduct('1');

        // Assert
        expect(product.id, '1');
        expect(product.name, 'Climatiseur Split Inverter 12000 BTU');
        expect(product.price, 350000);
      });

      test('lance une erreur si le produit n\'existe pas', () async {
        // Arrange
        final mockDio = MockDioHelper.createMockDioWithError(
          404,
          'Produit non trouvé',
        );
        final repository = ProductRepository(mockDio);

        // Act & Assert
        expect(() => repository.getProduct('999'), throwsA(isA<Exception>()));
      });
    });

    group('createProduct', () {
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
        final repository = ProductRepository(mockDio);

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
        final product = await repository.createProduct(productData);

        // Assert
        expect(product.id, '3');
        expect(product.name, 'Nouveau Climatiseur');
        expect(product.price, 500000);
      });
    });

    group('updateProduct', () {
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
        final repository = ProductRepository(mockDio);

        final updateData = {
          'name': 'Climatiseur Modifié',
          'description': 'Description modifiée',
          'price': 400000,
          'stock': 8,
        };

        // Act
        final product = await repository.updateProduct('1', updateData);

        // Assert
        expect(product.name, 'Climatiseur Modifié');
        expect(product.price, 400000);
        expect(product.stock, 8);
      });
    });

    group('deleteProduct', () {
      test('supprime un produit', () async {
        // Arrange
        final mockResponse = {'success': true};
        final mockDio = MockDioHelper.createMockDioWithResponse(mockResponse);
        final repository = ProductRepository(mockDio);

        // Act
        await repository.deleteProduct('1');

        // Assert - ne lance pas d'exception
        expect(true, isTrue);
      });

      test('lance une erreur si la suppression échoue', () async {
        // Arrange
        final mockDio = MockDioHelper.createMockDioWithError(
          500,
          'Erreur suppression',
        );
        final repository = ProductRepository(mockDio);

        // Act & Assert
        expect(() => repository.deleteProduct('1'), throwsA(isA<Exception>()));
      });
    });
  });
}
