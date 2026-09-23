import 'package:dio/dio.dart';
import '../models/product.dart';
import '../../../../core/network/api_endpoints.dart';

class ProductRepository {
  final Dio _dio;

  ProductRepository(this._dio);

  Future<List<Product>> getProducts() async {
    try {
      final response = await _dio.get(ApiEndpoints.products);
      final List<dynamic> data = response.data;
      final products = data.map((json) => Product.fromJson(json)).toList();
      return products;
    } catch (e) {
      if (e is DioException) {
        throw Exception('Erreur lors du chargement des produits: ${e.message}');
      }
      throw Exception('Erreur lors du chargement des produits: $e');
    }
  }

  Future<Product> getProduct(String id) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.productDetail, {'id': id}),
      );
      return Product.fromJson(response.data);
    } catch (e) {
      throw Exception('Erreur lors du chargement du produit: $e');
    }
  }

  Future<Product> createProduct(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post(ApiEndpoints.adminProducts, data: data);
      // Retourner le produit créé avec l'ID généré
      return Product.fromJson({...data, 'id': response.data['id'].toString()});
    } catch (e) {
      if (e is DioException) {
        throw Exception('Erreur lors de la création du produit: ${e.message}');
      }
      throw Exception('Erreur lors de la création du produit: $e');
    }
  }

  Future<Product> updateProduct(String id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.put(
        ApiEndpoints.replacePath(ApiEndpoints.adminProductDetail, {'id': id}),
        data: data,
      );
      return Product.fromJson({...data, 'id': id});
    } catch (e) {
      if (e is DioException) {
        throw Exception(
          'Erreur lors de la mise à jour du produit: ${e.message}',
        );
      }
      throw Exception('Erreur lors de la mise à jour du produit: $e');
    }
  }

  Future<void> deleteProduct(String id) async {
    try {
      final response = await _dio.delete(
        ApiEndpoints.replacePath(ApiEndpoints.adminProductDetail, {'id': id}),
      );
      if (response.statusCode != 200) {
        throw Exception('Erreur lors de la suppression: ${response.data}');
      }
    } catch (e) {
      if (e is DioException) {
        throw Exception(
          'Erreur lors de la suppression du produit: ${e.message}',
        );
      }
      throw Exception('Erreur lors de la suppression du produit: $e');
    }
  }
}
