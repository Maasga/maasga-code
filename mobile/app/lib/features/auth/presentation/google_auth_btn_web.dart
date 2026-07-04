import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:google_sign_in_web/web_only.dart' as web_only;
import '../../../core/config/env.dart';

class GoogleSignInBtn extends StatefulWidget {
  final Future<void> Function(String token) onTokenReceived;
  final Function(String error) onError;
  const GoogleSignInBtn({super.key, required this.onTokenReceived, required this.onError});

  @override
  State<GoogleSignInBtn> createState() => _GoogleSignInBtnState();
}

class _GoogleSignInBtnState extends State<GoogleSignInBtn> {
  StreamSubscription? _sub;
  static bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _initGoogleSignIn();
    _sub = GoogleSignIn.instance.authenticationEvents.listen((event) async {
       if (event is GoogleSignInAuthenticationEventSignIn) {
          final account = event.user;
          try {
             final auth = account.authentication;
             GoogleSignInClientAuthorization? authz;
             try {
                 authz = await account.authorizationClient.authorizationForScopes([]);
             } catch (_) {}

             if (authz != null && authz.accessToken.isNotEmpty) {
                await widget.onTokenReceived(authz.accessToken);
             } else if (auth.idToken != null) {
                // Parfois le web renvoie idToken au lieu de accessToken selon le flow
                await widget.onTokenReceived(auth.idToken!);
             } else {
                widget.onError("Access token manquant.");
             }
          } catch (e) {
             widget.onError(e.toString());
          }
       }
    });
  }

  Future<void> _initGoogleSignIn() async {
    if (_initialized) return;
    try {
      await GoogleSignIn.instance.initialize(clientId: Env.googleWebClientId);
      _initialized = true;
    } catch (e) {
      widget.onError('Initialisation Google impossible: $e');
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 48,
      alignment: Alignment.center,
      child: web_only.renderButton(),
    );
  }
}

Widget buildGoogleSignInButton({
  required Future<void> Function(String token) onTokenReceived,
  required Function(String error) onError,
}) {
  return GoogleSignInBtn(onTokenReceived: onTokenReceived, onError: onError);
}
