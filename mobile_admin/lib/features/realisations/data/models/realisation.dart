import 'dart:convert';

class Realisation {
  final int id;
  final String title;
  final String? description;
  final String? category;
  final List<String> images;
  final String? clientName;
  final String? location;
  final String? completionDate;
  final String status;
  final bool featured;
  final DateTime createdAt;
  final DateTime updatedAt;

  Realisation({
    required this.id,
    required this.title,
    this.description,
    this.category,
    required this.images,
    this.clientName,
    this.location,
    this.completionDate,
    this.status = 'published',
    this.featured = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Realisation.fromJson(Map<String, dynamic> json) {
    List<String> parseImages(dynamic imagesJson) {
      if (imagesJson is String) {
        try {
          final List<dynamic> parsed = jsonDecode(imagesJson);
          return parsed.map((url) => url.toString()).toList();
        } catch (_) {
          return [];
        }
      } else if (imagesJson is List) {
        return imagesJson.map((url) => url.toString()).toList();
      }
      return [];
    }

    return Realisation(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: json['category'] as String?,
      images: parseImages(json['images']),
      clientName: json['client_name'] as String?,
      location: json['location'] as String?,
      completionDate: json['completion_date'] as String?,
      status: json['status'] as String? ?? 'published',
      featured: (json['featured'] as int?) == 1,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'images': jsonEncode(images),
      'client_name': clientName,
      'location': location,
      'completion_date': completionDate,
      'status': status,
      'featured': featured ? 1 : 0,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get formattedDate => '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  String get statusLabel {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'published':
        return 'Publié';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  }

  bool get isDraft => status == 'draft';
  bool get isPublished => status == 'published';
  bool get isFeatured => featured;
}