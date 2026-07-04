import 'package:flutter/material.dart';
import 'google_mobile_auth.dart';

Widget buildGoogleSignInButton({
  required Future<void> Function(String token) onTokenReceived,
  required Function(String error) onError,
}) {
  return OutlinedButton.icon(
    onPressed: () async {
      try {
        final token = await GoogleMobileAuth.requestAccessToken();
        if (token.isEmpty) {
           onError('Google Sign-In annulé ou token indisponible.');
           return;
        }
        await onTokenReceived(token);
      } catch (e) {
        onError('Connexion Google impossible: $e');
      }
    },
    icon: const Icon(Icons.g_mobiledata_rounded),
    label: const Text('Continuer avec Google'),
  );
}
