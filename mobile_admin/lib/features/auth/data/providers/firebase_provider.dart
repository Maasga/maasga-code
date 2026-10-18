import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Firebase Auth instance provider
final firebaseAuthProvider = Provider<FirebaseAuth>((ref) {
  return FirebaseAuth.instance;
});

// Auth state changes provider
final authStateChangesProvider = StreamProvider<User?>((ref) {
  final auth = ref.watch(firebaseAuthProvider);
  return auth.authStateChanges();
});

// Current user provider - reactif aux changements d'auth
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authStateChangesProvider).value ?? ref.watch(firebaseAuthProvider).currentUser;
});

// Auth token provider - provides the current Firebase ID token
final authTokenProvider = FutureProvider<String?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user != null) {
    try {
      return await user.getIdToken();
    } catch (e) {
      return null;
    }
  }
  return null;
});
