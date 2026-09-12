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

// Current user provider
final currentUserProvider = Provider<User?>((ref) {
  final auth = ref.watch(firebaseAuthProvider);
  return auth.currentUser;
});

// Auth token provider - provides the current Firebase ID token
final authTokenProvider = FutureProvider<String?>((ref) async {
  final auth = ref.watch(firebaseAuthProvider);
  final user = auth.currentUser;
  if (user != null) {
    try {
      return await user.getIdToken();
    } catch (e) {
      return null;
    }
  }
  return null;
});
