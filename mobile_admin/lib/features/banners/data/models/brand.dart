class Brand {
  final String id;
  final String name;
  final String? assetKey;
  final String? logoUrl;
  final int displayOrder;
  final bool isActive;
  final DateTime? updatedAt;

  Brand({
    required this.id,
    required this.name,
    this.assetKey,
    this.logoUrl,
    required this.displayOrder,
    required this.isActive,
    this.updatedAt,
  });

  factory Brand.fromJson(Map<String, dynamic> json) {
    return Brand(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      assetKey: json['asset_key']?.toString(),
      logoUrl: json['logo_url']?.toString(),
      displayOrder: json['display_order'] as int? ?? 0,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'asset_key': assetKey,
      'logo_url': logoUrl,
      'display_order': displayOrder,
      'is_active': isActive ? 1 : 0,
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Brand copyWith({
    String? id,
    String? name,
    String? assetKey,
    String? logoUrl,
    int? displayOrder,
    bool? isActive,
    DateTime? updatedAt,
  }) {
    return Brand(
      id: id ?? this.id,
      name: name ?? this.name,
      assetKey: assetKey ?? this.assetKey,
      logoUrl: logoUrl ?? this.logoUrl,
      displayOrder: displayOrder ?? this.displayOrder,
      isActive: isActive ?? this.isActive,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
