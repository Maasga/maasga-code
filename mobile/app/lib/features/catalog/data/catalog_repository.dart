import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/product.dart';

class CatalogRepository {
  CatalogRepository(this._dio);
  final Dio _dio;

  Future<List<Product>> getProducts() async {
    final response = await _dio.get('/api/mobile/products', queryParameters: {'available': 'true'});
    final list = response.data as List<dynamic>? ?? const [];
    return list
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .map(_normalizeProductFromSite)
        .toList();
  }



  Product _normalizeProductFromSite(Product p) {
    final category = _inferCategory(p);
    final power = _inferPower(p.btu);
    final specs = _buildSpecs(p);
    
    // Combine main image and gallery images accurately
    final List<String> displayImages = [];
    if (p.imageUrl != null && p.imageUrl!.isNotEmpty && p.imageUrl != '??') {
      displayImages.add(p.imageUrl!);
    } else if (p.image.isNotEmpty && p.image != '??') {
      displayImages.add(p.image);
    }
    
    for (var img in p.images) {
      if (img.isNotEmpty && img != '??' && !displayImages.contains(img)) {
        displayImages.add(img);
      }
    }
    
    if (displayImages.isEmpty) {
      displayImages.add('assets/products/product_placeholder.png');
    }

    // Dummy technical specs for demo fallback
    final techSpecs = p.technicalSpecs.isNotEmpty ? p.technicalSpecs : {
      'Marque': p.brand,
      'Modèle': p.name,
      'Puissance BTU': '${p.btu ?? 12000}',
      'Puissance CV': power.toUpperCase(),
      'Gaz Frigorigène': 'R32',
      'WiFi': 'Intégré',
      'Classe Énergétique': 'A+++ / A++',
      'Niveau Sonore': '21 dB(A)',
      'Garantie': '2 ans',
    };

    return Product(
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      stock: p.stock,
      category: category,
      power: power,
      specs: specs,
      image: p.image,
      imageUrl: p.imageUrl,
      btu: p.btu,
      images: displayImages,
      oldPrice: p.oldPrice ?? (p.price * 1.2).toInt(),
      description: p.description.isNotEmpty 
          ? p.description 
          : 'Découvrez le confort ultime avec le ${p.name}. Ce climatiseur de haute performance allie puissance, silence et efficacité énergétique pour votre intérieur.',
      technicalSpecs: techSpecs,
    );
  }

  String _inferCategory(Product p) {
    if (p.category.trim().isNotEmpty) {
      return p.category.trim();
    }
    return 'Mural/Split';
  }

  String _inferPower(int? btu) {
    switch (btu ?? 0) {
      case <= 9000:
        return '1cv';
      case <= 12000:
        return '1.5cv';
      case <= 18000:
        return '2cv';
      case <= 24000:
        return '3cv';
      default:
        return '5cv';
    }
  }

  List<String> _buildSpecs(Product p) {
    final source = p.specs.where((e) => e.trim().isNotEmpty).toList();
    if (source.isNotEmpty) return source.take(3).toList();
    return <String>[
      'Classe énergétique A+++',
      'Silencieux 20dB',
      'Puissance ${(p.btu ?? 12000).toString()} BTU',
    ];
  }
}

final catalogRepositoryProvider = FutureProvider<CatalogRepository>((ref) async {
  final dio = await ref.watch(dioProvider.future);
  return CatalogRepository(dio);
});

final productsProvider = FutureProvider<List<Product>>((ref) async {
  final repo = await ref.watch(catalogRepositoryProvider.future);
  return repo.getProducts();
});

