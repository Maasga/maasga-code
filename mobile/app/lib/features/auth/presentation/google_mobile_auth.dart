import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../core/config/env.dart';

class GoogleMobileAuth {
  GoogleMobileAuth._();

  static bool _initialized = false;
  static const _scopes = <String>['email', 'profile', 'openid'];

  static Future<String> requestAccessToken() async {
    if (kIsWeb) {
      throw Exception("La connexion Google n'est pas encore disponible sur la version Web.");
    }
    final google = GoogleSignIn.instance;
    if (!_initialized) {
      await google.initialize(
        // On mobile, backend verification usually relies on server client id.
        // The server client must be the Web OAuth client.
        serverClientId: Env.googleWebClientId,
      );
      _initialized = true;
    }

    final account = await google.authenticate(scopeHint: _scopes);
    final authz =
        await account.authorizationClient.authorizationForScopes(_scopes) ??
            await account.authorizationClient.authorizeScopes(_scopes);
    return authz.accessToken;
  }
}
