class BrandMediaImage {
  final int id;
  final String brand;
  final String url;
  final String? deleteUrl;
  final String? label;
  final String? createdAt;

  BrandMediaImage({
    required this.id,
    required this.brand,
    required this.url,
    this.deleteUrl,
    this.label,
    this.createdAt,
  });

  factory BrandMediaImage.fromJson(Map<String, dynamic> json) {
    return BrandMediaImage(
      id: int.tryParse(json['id'].toString()) ?? 0,
      brand: (json['brand'] ?? '').toString(),
      url: (json['url'] ?? '').toString(),
      deleteUrl: json['delete_url']?.toString(),
      label: json['label']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'brand': brand,
      'url': url,
      if (deleteUrl != null) 'delete_url': deleteUrl,
      if (label != null) 'label': label,
      if (createdAt != null) 'created_at': createdAt,
    };
  }
}
