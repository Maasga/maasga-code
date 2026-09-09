class ApiEndpoints {
  // Auth
  static const String login = '/api/admin/firebase-login';
  static const String verifyAdmin = '/api/admin/verify-admin';
  static const String logout = '/api/admin/logout';

  // Produits
  static const String products = '/api/admin/products';
  static const String product = '/api/admin/products';
  static const String mediaBrand = '/api/admin/media/brand';
  static const String assignMedia = '/api/admin/media/assign';

  // Commandes
  static const String orders = '/api/admin/commandes';
  static const String order = '/api/admin/commandes';
  static const String bulkStatus = '/api/admin/commandes/bulk-status';
  static const String bulkDelete = '/api/admin/commandes/bulk-delete';
  static const String exportOrders = '/api/admin/commandes/export';

  // RDV
  static const String appointments = '/api/admin/appointments';
  static const String appointment = '/api/admin/appointments';

  // Clients
  static const String clients = '/api/admin/clients';
  static const String client = '/api/admin/clients';

  // Dashboard
  static const String dashboard = '/api/admin/dashboard';

  // Autres sections (compléter selon besoin)
  static const String maintenance = '/api/admin/maintenance';
  static const String devis = '/api/admin/devis';
  static const String paiements = '/api/admin/paiements';
  static const String sav = '/api/admin/sav';
  static const String messages = '/api/admin/messages';
  static const String avis = '/api/admin/avis';
  static const String realisations = '/api/admin/realisations';
  static const String audit = '/api/admin/audit';
  static const String notifications = '/api/admin/notifications';
  static const String banners = '/api/admin/banners';
  static const String parametres = '/api/admin/parametres';
}
