import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/design_tokens/maasga_tokens.dart';
import '../../../shared/widgets/maasga_primary_button.dart';
import 'auth_controller.dart';
import 'google_auth_btn.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _identifierCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String? _error;

  String _friendlyAuthError(Object? error) {
    final message = '$error'.toLowerCase();
    if (message.contains('status code of 401')) {
      return 'Email/telephone ou mot de passe incorrect.';
    }
    if (message.contains('status code of 429')) {
      return 'Trop de tentatives. Reessaie dans quelques minutes.';
    }
    if (message.contains('socketexception') ||
        message.contains('failed host lookup') ||
        message.contains('connection error')) {
      return 'Connexion internet indisponible. Verifie ton reseau.';
    }
    return 'Connexion impossible pour le moment. Reessaie plus tard.';
  }

  @override
  void dispose() {
    _identifierCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    ref.listen(authControllerProvider, (_, next) {
      if (next.hasError) {
        setState(() => _error = _friendlyAuthError(next.error));
      } else if (next.value == true) {
        context.go('/home');
      }
    });

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: MaasgaTokens.pageGradient),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 430),
                child: Card(
                  elevation: 0,
                  color: Colors.white.withValues(alpha: 0.92),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(MaasgaTokens.radiusLg),
                    side: const BorderSide(color: Color(0xFFE1F1FF)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      children: [
                        const CircleAvatar(
                          radius: 34,
                          backgroundColor: MaasgaTokens.bgMuted,
                          child: Icon(Icons.ac_unit, color: MaasgaTokens.blue700, size: 30),
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'Connexion',
                          style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 6),
                        const Text('Accédez à votre espace MAASGA'),
                        const SizedBox(height: 20),
                        TextField(
                          controller: _identifierCtrl,
                          style: MaasgaTokens.inputTextStyle,
                          decoration: const InputDecoration(
                            labelText: 'Email ou téléphone',
                            labelStyle: TextStyle(color: MaasgaTokens.textSecondary),
                            prefixIcon: Icon(Icons.person_outline, color: MaasgaTokens.blue700),
                            filled: true,
                            fillColor: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _passwordCtrl,
                          obscureText: true,
                          style: MaasgaTokens.inputTextStyle,
                          decoration: const InputDecoration(
                            labelText: 'Mot de passe',
                            labelStyle: TextStyle(color: MaasgaTokens.textSecondary),
                            prefixIcon: Icon(Icons.lock_outline, color: MaasgaTokens.blue700),
                            filled: true,
                            fillColor: Colors.white,
                          ),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Text(_error!, style: const TextStyle(color: Colors.red)),
                        ],
                        const SizedBox(height: 18),
                        SizedBox(
                          width: double.infinity,
                          child: MaasgaPrimaryButton(
                            label: auth.isLoading ? 'Connexion...' : 'Se connecter',
                            enabled: !auth.isLoading,
                            onPressed: () {
                              final id = _identifierCtrl.text.trim();
                              final pass = _passwordCtrl.text.trim();
                              if (id.isEmpty || pass.isEmpty) {
                                setState(() => _error = 'Veuillez saisir vos identifiants.');
                                return;
                              }
                              ref.read(authControllerProvider.notifier).login(
                                    identifier: id,
                                    password: pass,
                                  );
                            },
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextButton(
                          onPressed: () => context.push('/auth/register'),
                          child: const Text('Pas encore de compte ? Créer un compte'),
                        ),
                        const SizedBox(height: 8),
                        buildGoogleSignInButton(
                          onTokenReceived: (token) async {
                            await ref.read(authControllerProvider.notifier).loginWithGoogle(accessToken: token);
                          },
                          onError: (e) {
                            setState(() => _error = e);
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
