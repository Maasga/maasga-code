import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'firebase_provider.dart';

/// Provider vérifiant si l'utilisateur connecté détient les droits 'admin'
final adminRoleProvider = FutureProvider<bool>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return false;

  try {
    // Obtenir le token avec ses custom claims à jour (forceRefresh: true)
    final tokenResult = await user.getIdTokenResult(true);
    final claims = tokenResult.claims;

    final role = claims?['role'];
    final isAdminClaim = claims?['admin'];

    if (role == 'admin' || role == 'superadmin' || isAdminClaim == true || isAdminClaim == 1) {
      return true;
    }

    // Support des adresses email administrateurs
    final email = user.email?.toLowerCase().trim();
    if (email != null && (
      email == 'maasgabf@gmail.com' ||
      email == 'sawadogosherifhamed@gmail.com' ||
      email.endsWith('@maasga.bf') ||
      email.endsWith('@maasga.com')
    )) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
});
