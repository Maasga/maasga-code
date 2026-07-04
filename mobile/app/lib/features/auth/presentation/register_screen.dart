import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/design_tokens/maasga_tokens.dart';
import '../../../shared/widgets/maasga_primary_button.dart';
import 'auth_controller.dart';
import 'google_auth_btn.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _quartierCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String? _error;

  String _friendlyAuthError(Object? error) {
    final message = '$error'.toLowerCase();
    if (message.contains('status code of 400')) {
      return 'Informations manquantes ou mot de passe trop court.';
    }
    if (message.contains('status code of 401')) {
      return 'Autorisation refusée. Vérifie ton compte.';
    }
    if (message.contains('status code of 409')) {
      return 'Ce compte existe déjà. Essaie plutôt de te connecter.';
    }
    if (message.contains('status code of 422')) {
      return 'Informations invalides. Vérifie les champs.';
    }
    if (message.contains('status code of 429')) {
      return 'Trop de tentatives. Réessaie plus tard.';
    }
    if (message.contains('socketexception') ||
        message.contains('failed host lookup') ||
        message.contains('connection error')) {
      return 'Connexion internet indisponible.';
    }
    return 'Inscription impossible pour le moment.';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _quartierCtrl.dispose();
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
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        const Text('Créer un compte', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 6),
                        const Text('Renseignez vos informations pour démarrer'),
                        const SizedBox(height: 16),
                        TextField(controller: _nameCtrl, style: MaasgaTokens.inputTextStyle, decoration: const InputDecoration(labelText: 'Nom complet', labelStyle: TextStyle(color: MaasgaTokens.textSecondary), prefixIcon: Icon(Icons.person_outline, color: MaasgaTokens.blue700), filled: true, fillColor: Colors.white)),
                        const SizedBox(height: 10),
                        TextField(controller: _phoneCtrl, style: MaasgaTokens.inputTextStyle, decoration: const InputDecoration(labelText: 'Téléphone WhatsApp', labelStyle: TextStyle(color: MaasgaTokens.textSecondary), prefixIcon: Icon(Icons.phone_outlined, color: MaasgaTokens.blue700), filled: true, fillColor: Colors.white)),
                        const SizedBox(height: 10),
                        TextField(controller: _emailCtrl, style: MaasgaTokens.inputTextStyle, decoration: const InputDecoration(labelText: 'Email', labelStyle: TextStyle(color: MaasgaTokens.textSecondary), prefixIcon: Icon(Icons.email_outlined, color: MaasgaTokens.blue700), filled: true, fillColor: Colors.white)),
                        const SizedBox(height: 10),
                        TextField(controller: _quartierCtrl, style: MaasgaTokens.inputTextStyle, decoration: const InputDecoration(labelText: 'Quartier', labelStyle: TextStyle(color: MaasgaTokens.textSecondary), prefixIcon: Icon(Icons.location_on_outlined, color: MaasgaTokens.blue700), filled: true, fillColor: Colors.white)),
                        const SizedBox(height: 10),
                        TextField(controller: _passwordCtrl, obscureText: true, style: MaasgaTokens.inputTextStyle, decoration: const InputDecoration(labelText: 'Mot de passe', labelStyle: TextStyle(color: MaasgaTokens.textSecondary), prefixIcon: Icon(Icons.lock_outline, color: MaasgaTokens.blue700), filled: true, fillColor: Colors.white)),
                        if (_error != null) ...[
                          const SizedBox(height: 10),
                          Text(_error!, style: const TextStyle(color: Colors.red)),
                        ],
                        const SizedBox(height: 16),
                        MaasgaPrimaryButton(
                          label: auth.isLoading ? 'Création...' : 'Créer le compte',
                          enabled: !auth.isLoading,
                          onPressed: () {
                            final name = _nameCtrl.text.trim();
                            final phone = _phoneCtrl.text.trim();
                            final password = _passwordCtrl.text.trim();

                            if (name.isEmpty || phone.isEmpty) {
                              setState(() => _error = 'Nom et téléphone obligatoires.');
                              return;
                            }
                            if (password.length < 6) {
                              setState(() => _error = 'Le mot de passe doit faire au moins 6 caractères.');
                              return;
                            }

                            ref.read(authControllerProvider.notifier).register(
                                  name: name,
                                  phone: phone,
                                  email: _emailCtrl.text.trim(),
                                  quartier: _quartierCtrl.text.trim(),
                                  password: password,
                                );
                          },
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => context.pop(),
                          child: const Text('Retour connexion'),
                        ),
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
