class UserProfile {
  UserProfile({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.email,
    required this.quartier,
    required this.memberSince,
    this.photoUrl,
  });

  final String id;
  final String fullName;
  final String phone;
  final String email;
  final String quartier;
  final String memberSince;
  final String? photoUrl;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    // Handle memberSince from created_at
    String year = '2024';
    final createdAt = json['created_at']?.toString() ?? '';
    if (createdAt.length >= 4) {
      year = createdAt.substring(0, 4);
    }

    return UserProfile(
      id: json['id']?.toString() ?? '',
      fullName: json['name'] ?? json['full_name'] ?? 'Client MAASGA',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      quartier: json['quartier'] ?? 'Ouagadougou',
      memberSince: json['member_since'] ?? year,
      photoUrl: json['photo_url'],
    );
  }
}
