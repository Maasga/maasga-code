import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provider pour l'instance Firebase Auth.
///
/// Ce provider donne accès à l'instance singleton FirebaseAuth pour
/// gérer l'authentification des utilisateurs.
final firebaseAuthProvider = Provider<FirebaseAuth>((ref) {
  return FirebaseAuth.instance;
});

/// StreamProvider qui émet l'état d'authentification actuel.
///
/// Émet:
/// - User : quand un utilisateur est connecté
/// - null : quand aucun utilisateur n'est connecté
///
/// Utilisé pour réagir aux changements d'état d'authentification
/// (connexion, déconnexion, expiration de session).
final authStateChangesProvider = StreamProvider<User?>((ref) {
  return ref.watch(firebaseAuthProvider).authStateChanges();
});

/// Provider pour l'utilisateur actuellement connecté.
///
/// Retourne l'objet User de l'utilisateur connecté, ou null si
/// aucun utilisateur n'est connecté.
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(firebaseAuthProvider).currentUser;
});
