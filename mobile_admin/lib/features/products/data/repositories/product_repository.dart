import 'package:dio/dio.dart';
import '../models/product.dart';
import '../../../../core/network/api_endpoints.dart';

class ProductRepository {
  final Dio _dio;

  ProductRepository(this._dio);

  Future<List<Product>> getProducts() async {
    try {
      print('📦 Chargement des produits depuis: ${ApiEndpoints.products}');
      final response = await _dio.get(ApiEndpoints.products);
      print('✅ Réponse reçue - Status: ${response.statusCode}');
      print('📊 Données: ${response.data}');
      final List<dynamic> data = response.data;
      final products = data.map((json) => Product.fromJson(json)).toList();
      print('📦 ${products.length} produits chargés');
      return products;
    } catch (e) {
      print('❌ Erreur lors du chargement des produits: $e');
      if (e is DioException) {
        print('🔍 DioException: ${e.type} - ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      throw Exception('Erreur lors du chargement des produits: $e');
    }
  }

  Future<Product> getProduct(String id) async {
    try {
      print('📦 Chargement du produit $id');
      final response = await _dio.get(
        ApiEndpoints.replacePath(ApiEndpoints.productDetail, {'id': id}),
      );
      print('✅ Produit $id chargé');
      return Product.fromJson(response.data);
    } catch (e) {
      print('❌ Erreur lors du chargement du produit $id: $e');
      throw Exception('Erreur lors du chargement du produit: $e');
    }
  }

  Future<Product> createProduct(Map<String, dynamic> data) async {
    try {
      print('📦 Création du produit: ${data["name"]}');
      final response = await _dio.post(ApiEndpoints.products, data: data);
      print('✅ Produit créé');
      return Product.fromJson(response.data);
    } catch (e) {
      print('❌ Erreur lors de la création du produit: $e');
      throw Exception('Erreur lors de la création du produit: $e');
    }
  }

  Future<Product> updateProduct(String id, Map<String, dynamic> data) async {
    try {
      print('📦 Mise à jour du produit $id: ${data["name"]}');
      final response = await _dio.put(
        ApiEndpoints.replacePath(ApiEndpoints.productDetail, {'id': id}),
        data: data,
      );
      print('✅ Produit $id mis à jour');
      return Product.fromJson(response.data);
    } catch (e) {
      print('❌ Erreur lors de la mise à jour du produit: $e');
      throw Exception('Erreur lors de la mise à jour du produit: $e');
    }
  }

  Future<void> deleteProduct(String id) async {
    try {
      print('📦 Suppression du produit $id');
      await _dio.delete(
        ApiEndpoints.replacePath(ApiEndpoints.productDetail, {'id': id}),
      );
      print('✅ Produit $id supprimé');
    } catch (e) {
      print('❌ Erreur lors de la suppression du produit: $e');
      throw Exception('Erreur lors de la suppression du produit: $e');
    }
  }
}
