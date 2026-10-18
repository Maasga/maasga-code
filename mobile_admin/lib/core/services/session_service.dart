import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/data/providers/firebase_provider.dart';
import '../config/app_config.dart';
import '../utils/app_logger.dart';

class SessionService {
  final Ref _ref;
  DateTime _lastActivity = DateTime.now();
  Timer? _periodicTimer;

  SessionService(this._ref) {
    _startMonitoring();
  }

  /// Initialise la surveillance périodique de l'inactivité
  void _startMonitoring() {
    _periodicTimer?.cancel();
    _lastActivity = DateTime.now();
    _periodicTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      checkTimeout();
    });
  }

  /// Réinitialise l'horodatage de la dernière activité utilisateur
  void resetTimer() {
    _lastActivity = DateTime.now();
  }

  /// Vérifie si la session a expiré par inactivité
  Future<void> checkTimeout() async {
    final auth = _ref.read(firebaseAuthProvider);
    if (auth.currentUser == null) return;

    final inactiveMinutes = DateTime.now().difference(_lastActivity).inMinutes;
    if (inactiveMinutes >= AppConfig.sessionTimeoutMinutes) {
      AppLogger.warning(
        'Session expirée après $inactiveMinutes minutes d\'inactivité. Déconnexion automatique.',
      );
      try {
        await auth.signOut();
      } catch (e) {
        AppLogger.error(e, null, 'SessionService.signOut');
      }
    }
  }

  /// Libère les ressources du timer
  void dispose() {
    _periodicTimer?.cancel();
  }
}

final sessionServiceProvider = Provider<SessionService>((ref) {
  final service = SessionService(ref);
  ref.onDispose(() => service.dispose());
  return service;
});
