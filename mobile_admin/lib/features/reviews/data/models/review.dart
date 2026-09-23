class Review {
  final String id;
  final String name;
  final int rating;
  final String comment;
  final String? service;
  final bool approved;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.name,
    required this.rating,
    required this.comment,
    this.service,
    required this.approved,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      rating: json['note'] as int? ?? json['rating'] as int? ?? 0,
      comment: json['comment'] ?? '',
      service: json['service']?.toString(),
      approved: json['approved'] == 1 || json['approved'] == true,
      createdAt: DateTime.tryParse(json['date'] ?? json['created_at'] ?? '') ?? DateTime.now(),
    );
  }

  String get formattedDate {
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }

  String get formattedRating => '$rating/5';
}