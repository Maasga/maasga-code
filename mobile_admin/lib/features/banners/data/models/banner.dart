class Banner {
  final String id;
  final String title;
  final String? subtitle;
  final String imageUrl;
  final String? targetPage;
  final int displayOrder;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Banner({
    required this.id,
    required this.title,
    this.subtitle,
    required this.imageUrl,
    this.targetPage,
    required this.displayOrder,
    required this.isActive,
    required this.createdAt,
    this.updatedAt,
  });

  factory Banner.fromJson(Map<String, dynamic> json) {
    return Banner(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      subtitle: json['subtitle']?.toString(),
      imageUrl: json['image_url'] ?? json['imageUrl'] ?? '',
      targetPage: json['target_page']?.toString(),
      displayOrder: json['display_order'] as int? ?? 0,
      isActive: json['is_active'] == 1 || json['is_active'] == true,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'image_url': imageUrl,
      'target_page': targetPage,
      'display_order': displayOrder,
      'is_active': isActive ? 1 : 0,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}