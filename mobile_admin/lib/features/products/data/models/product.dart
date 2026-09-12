import 'dart:convert';

class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final int stock;
  final String? imageUrl;
  final String category;
  final String brand;
  final String? model;
  final int? btu;
  final int? surfaceMin;
  final int? surfaceMax;
  final String? energyClass;
  final bool? inverter;
  final List<String>? features;
  final String? refrigerant;
  final String? compressor;
  final int? warranty;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.stock,
    this.imageUrl,
    required this.category,
    required this.brand,
    this.model,
    this.btu,
    this.surfaceMin,
    this.surfaceMax,
    this.energyClass,
    this.inverter,
    this.features,
    this.refrigerant,
    this.compressor,
    this.warranty,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      stock: json['stock'] as int? ?? 0,
      imageUrl: json['image_url']?.toString() ?? json['imageUrl']?.toString(),
      category: json['category'] ?? '',
      brand: json['brand'] ?? '',
      model: json['model']?.toString(),
      btu: json['btu'] as int?,
      surfaceMin: json['surface_min'] as int?,
      surfaceMax: json['surface_max'] as int?,
      energyClass: json['energy_class']?.toString(),
      inverter: json['inverter'] == 1 || json['inverter'] == true,
      features: json['features'] != null
          ? (json['features'] is String
                ? (json['features'] as String).startsWith('[')
                      ? List<String>.from(
                          (jsonDecode(json['features'] as String) as List).map(
                            (e) => e.toString(),
                          ),
                        )
                      : [json['features'].toString()]
                : List<String>.from(json['features']))
          : null,
      refrigerant: json['refrigerant']?.toString(),
      compressor: json['compressor']?.toString(),
      warranty: json['warranty'] is int
          ? json['warranty'] as int
          : (json['warranty'] is String
                ? int.tryParse(
                    json['warranty'].toString().replaceAll(RegExp(r'\D'), ''),
                  )
                : null),
      isActive:
          json['is_active'] == 1 ||
          json['is_active'] == true ||
          json['available'] == 1,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'stock': stock,
      'image_url': imageUrl,
      'category': category,
      'brand': brand,
      'model': model,
      'btu': btu,
      'surface_min': surfaceMin,
      'surface_max': surfaceMax,
      'energy_class': energyClass,
      'inverter': (inverter ?? false) ? 1 : 0,
      'features': features,
      'refrigerant': refrigerant,
      'compressor': compressor,
      'warranty': warranty,
      'is_active': isActive ? 1 : 0,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get stockStatus {
    if (stock == 0) return 'Rupture';
    if (stock <= 5) return 'Faible';
    return 'Normal';
  }

  String get formattedPrice => '${price.toStringAsFixed(0)} FCFA';
}
