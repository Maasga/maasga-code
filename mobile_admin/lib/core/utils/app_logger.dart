import 'package:flutter/foundation.dart';

/// Logger sécurisé pour l'application MaasGa Admin.
/// Ne loggue AUCUNE donnée en mode Release.
/// Masque systématiquement les données sensibles (téléphones, emails).
class AppLogger {
  AppLogger._();

  /// Masque une adresse email (ex: "j***e@domain.com")
  static String maskEmail(String? email) {
    if (email == null || email.isEmpty) return '';
    final parts = email.split('@');
    if (parts.length != 2) return '***';
    final name = parts[0];
    final domain = parts[1];
    if (name.length <= 2) {
      return '${name[0]}***@$domain';
    }
    return '${name[0]}***${name[name.length - 1]}@$domain';
  }

  /// Masque un numéro de téléphone (garde l'indicatif/3 premiers caractères)
  static String maskPhone(String? phone) {
    if (phone == null || phone.isEmpty) return '';
    final clean = phone.trim();
    if (clean.length <= 4) return '***';
    return '${clean.substring(0, 4)}******';
  }

  /// Log d'information générale
  static void info(String message) {
    if (!kDebugMode) return;
    debugPrint('ℹ️ [INFO] $message');
  }

  /// Log de debug
  static void debug(String message) {
    if (!kDebugMode) return;
    debugPrint('🔍 [DEBUG] $message');
  }

  /// Log d'avertissement
  static void warning(String message) {
    if (!kDebugMode) return;
    debugPrint('⚠️ [WARN] $message');
  }

  /// Log d'erreur sécurisé
  static void error(Object error, [StackTrace? stackTrace, String? context]) {
    if (!kDebugMode) return;
    final ctx = context != null ? '[$context] ' : '';
    debugPrint('❌ [ERROR] $ctx$error');
    if (stackTrace != null) {
      debugPrint('$stackTrace');
    }
  }

  /// Log sécurisé pour les réponses HTTP (endpoint, code HTTP, et nombre d'éléments optionnel)
  static void response(String endpoint, int? statusCode, [int? itemCount]) {
    if (!kDebugMode) return;
    final countInfo = itemCount != null ? ' ($itemCount éléments)' : '';
    debugPrint('🌐 [HTTP] $endpoint -> $statusCode$countInfo');
  }
}
