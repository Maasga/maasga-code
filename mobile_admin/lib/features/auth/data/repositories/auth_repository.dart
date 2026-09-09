import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/admin_user.dart';
import '../providers/dio_provider.dart';
import '../providers/firebase_provider.dart';
import '../../../../core/network/api_endpoints.dart';

/// Repository pour la gestion de l'authentification.
///
/// Gère la connexion, déconnexion et réinitialisation de mot de passe
/// via Firebase Auth avec vérification du rôle admin côté serveur.
class AuthRepository {
  AuthRepository(this._firebaseAuth, this._dio);

  final FirebaseAuth _firebaseAuth;
  final Dio _dio;

  /// Connecte un utilisateur avec email et mot de passe.
  ///
  /// Après la connexion Firebase, vérifie auprès du serveur que
  /// l'utilisateur a bien le rôle admin. Si ce n'est pas le cas,
  /// déconnecte l'utilisateur et lance une exception.
  Future<AdminUser> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    try {
      final credential = await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Vérifier rôle admin côté serveur
      final response = await _dio.post(
        ApiEndpoints.verifyAdmin,
        data: {'uid': credential.user?.uid},
      );

      final responseData = response.data as Map<String, dynamic>;
      if (response.statusCode == 200 && responseData['isAdmin'] == true) {
        return AdminUser(
          uid: credential.user!.uid,
          email: credential.user!.email!,
          displayName: credential.user!.displayName,
          isAdmin: true,
          lastLogin: DateTime.now(),
        );
      } else {
        await _firebaseAuth.signOut();
        throw Exception('Accès non autorisé - pas un compte admin');
      }
    } on FirebaseAuthException catch (e) {
      throw Exception('Erreur d\'authentification: ${e.message}');
    } catch (e) {
      await _firebaseAuth.signOut();
      throw Exception('Erreur de connexion: $e');
    }
  }

  /// Déconnecte l'utilisateur actuel.
  Future<void> signOut() async {
    await _firebaseAuth.signOut();
  }

  /// Envoie un email de réinitialisation de mot de passe.
  Future<void> resetPassword(String email) async {
    await _firebaseAuth.sendPasswordResetEmail(email: email);
  }

  /// Stream des changements d'état d'authentification.
  ///
  /// Émet l'utilisateur connecté ou null si déconnecté.
  Stream<User?> authStateChanges() => _firebaseAuth.authStateChanges();
}

/// Provider pour l'AuthRepository.
///
/// Injecte FirebaseAuth et le client Dio (via ApiClient).
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final firebaseAuth = ref.watch(firebaseAuthProvider);
  final apiClient = ref.watch(dioProvider);
  return AuthRepository(firebaseAuth, apiClient.dio);
});
