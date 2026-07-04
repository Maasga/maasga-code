class Promo {
  final int id;
  final String title;
  final String? subtitle;
  final String imageUrl;
  final String? targetPage;
  final int displayOrder;
  final bool isActive;

  Promo({
    required this.id,
    required this.title,
    this.subtitle,
    required this.imageUrl,
    this.targetPage,
    required this.displayOrder,
    required this.isActive,
  });

  factory Promo.fromJson(Map<String, dynamic> json) {
    return Promo(
      id: json['id'] as int,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String?,
      imageUrl: json['image_url'] as String,
      targetPage: json['target_page'] as String?,
      displayOrder: json['display_order'] as int? ?? 0,
      isActive: (json['is_active'] == 1 || json['is_active'] == true),
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
    };
  }
}
