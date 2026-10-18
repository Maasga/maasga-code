/// Configuration globale de l'application MaasGa Admin
class AppConfig {
  AppConfig._();

  /// Durée d'inactivité avant déconnexion automatique (en minutes)
  static const int sessionTimeoutMinutes = 30;

  /// Nombre d'éléments par page par défaut pour la pagination
  static const int defaultPageSize = 20;

  /// Délai avant expiration des requêtes réseau (en secondes)
  static const int networkTimeoutSeconds = 30;
}
