import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

/// Gestionnaire d'erreurs centralisé pour toute l'application MaasGa Admin.
class ErrorHandler {
  /// Affiche un SnackBar d'erreur avec un message convivial.
  static void showError(
    BuildContext context,
    Object error, {
    String? fallbackMessage,
    VoidCallback? onUndo,
    String? undoLabel,
  }) {
    final message = _friendlyMessage(error, fallbackMessage);
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 4),
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          ],
        ),
        action: onUndo != null
            ? SnackBarAction(
                label: undoLabel ?? 'Annuler',
                textColor: Colors.white,
                onPressed: onUndo,
              )
            : null,
      ),
    );
  }

  /// Affiche un SnackBar de succès.
  static void showSuccess(
    BuildContext context,
    String message, {
    VoidCallback? onUndo,
    String? undoLabel,
  }) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          ],
        ),
        action: onUndo != null
            ? SnackBarAction(
                label: undoLabel ?? 'Annuler',
                textColor: Colors.white,
                onPressed: onUndo,
              )
            : null,
      ),
    );
  }

  /// Convertit une erreur technique en message convivial.
  static String _friendlyMessage(Object error, String? fallback) {
    if (error is DioException) {
      final statusCode = error.response?.statusCode;
      if (statusCode == 401) return 'Session expirée — veuillez vous reconnecter.';
      if (statusCode == 403) return 'Accès refusé.';
      if (statusCode == 404) return 'Ressource introuvable.';
      if (statusCode == 422) return 'Données invalides — vérifiez les champs.';
      if (statusCode != null && statusCode >= 500) {
        return 'Erreur serveur — réessayez dans un moment.';
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout) {
        return 'Délai dépassé — vérifiez votre connexion.';
      }
      if (error.type == DioExceptionType.connectionError) {
        return 'Pas de connexion — vérifiez votre réseau.';
      }
    }
    return fallback ?? error.toString().replaceAll('Exception: ', '');
  }
}
