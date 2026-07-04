class Product {
  Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.price,
    required this.stock,
    this.category = 'Mural/Split',
    this.power = '1cv',
    this.specs = const <String>[],
    this.image = '',
    this.imageUrl,
    this.btu,
    this.images = const [],
    this.oldPrice,
    this.description = '',
    this.technicalSpecs = const {},
  });

  final int id;
  final String name;
  final String brand;
  final int price;
  final int stock;
  final String category;
  final String power;
  final List<String> specs;
  final String image;
  final String? imageUrl;
  final int? btu;

  // New fields for premium detail page
  final List<String> images;
  final int? oldPrice;
  final String description;
  final Map<String, String> technicalSpecs;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: json['name'] as String? ?? '',
      brand: json['brand'] as String? ?? '',
      price: (json['price'] as num?)?.toInt() ?? 0,
      stock: (json['stock'] as num?)?.toInt() ?? 0,
      category: json['category'] as String? ?? 'Mural/Split',
      power: json['power'] as String? ?? '1cv',
      specs: (json['features'] as List<dynamic>? ?? json['specs'] as List<dynamic>?)
              ?.map((e) => '$e')
              .where((e) => e.trim().isNotEmpty)
              .toList() ??
          const <String>[
            'Classe A+++',
            'Silencieux 20dB',
            'Puissance 12000 BTU',
          ],
      image: json['image'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? json['image_url'] as String?,
      btu: (json['btu'] as num?)?.toInt(),
      images: (json['media'] as List<dynamic>? ?? json['images'] as List<dynamic>?)?.map((e) {
        if (e is Map) return e['url']?.toString() ?? '';
        return '$e';
      }).where((s) => s.isNotEmpty).toList() ?? [],
      oldPrice: (json['old_price'] as num?)?.toInt(),
      description: json['description'] as String? ?? '',
      technicalSpecs: (json['techSpecs'] as Map<String, dynamic>? ?? json['technical_specs'] as Map<String, dynamic>?)
              ?.map((k, v) => MapEntry(k, '$v')) ??
          {},
    );
  }
}
