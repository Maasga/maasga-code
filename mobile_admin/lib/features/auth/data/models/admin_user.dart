/// Modèle représentant un utilisateur administrateur.
///
/// Contient les informations de base d'un utilisateur ainsi que
/// son statut d'administrateur vérifié côté serveur.
class AdminUser {
  AdminUser({
    required this.uid,
    required this.email,
    this.displayName,
    required this.isAdmin,
    this.lastLogin,
  });

  /// Crée un AdminUser à partir d'un JSON.
  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      uid: json['uid'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String?,
      isAdmin: json['isAdmin'] as bool? ?? false,
      lastLogin: json['lastLogin'] != null
          ? DateTime.parse(json['lastLogin'] as String)
          : null,
    );
  }

  final String uid;
  final String email;
  final String? displayName;
  final bool isAdmin;
  final DateTime? lastLogin;

  /// Convertit l'AdminUser en JSON.
  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'isAdmin': isAdmin,
      'lastLogin': lastLogin?.toIso8601String(),
    };
  }
}
