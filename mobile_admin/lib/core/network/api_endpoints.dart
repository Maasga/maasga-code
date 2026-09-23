class ApiEndpoints {
  // Base URL - Points to the main Cloudflare Pages deployment
  static const String baseUrl = 'https://maasga-website.pages.dev';

  // Auth endpoints (Firebase-based)
  static const String mobileLogin = '/api/mobile/login';
  static const String mobileRegister = '/api/mobile/register';
  static const String mobileProfile = '/api/mobile/profile';
  static const String setAdminRole = '/api/admin/set-admin-role';

  // Dashboard endpoints
  static const String dashboard = '/api/mobile/admin-dashboard';

  // RDV endpoints
  static const String rdvCreate = '/api/mobile/rdv';
  static const String rdvList = '/api/mobile/my-rdvs';
  static const String appointments = '/api/mobile/rdv';
  static const String rdvDetail = '/api/mobile/admin/rdv/{id}';
  static const String rdvConfirm = '/api/mobile/admin/rdv/{id}/confirm';
  static const String rdvCancel = '/api/mobile/admin/rdv/{id}/cancel';
  static const String rdvCalendar = '/api/mobile/admin/rdv/calendar';

  // Products endpoints
  static const String products = '/api/mobile/products';
  static const String adminProducts = '/api/mobile/admin/products';
  static const String productDetail = '/api/mobile/products/{id}';
  static const String adminProductDetail = '/api/mobile/admin/products/{id}';

  // Orders endpoints
  static const String orders = '/api/mobile/orders';
  static const String ordersCreate = '/api/mobile/commandes';
  static const String orderDetail = '/api/mobile/orders/{id}';
  static const String adminOrderDetail = '/api/mobile/admin/orders/{id}';
  static const String orderNotes = '/api/mobile/admin/orders/{id}/notes';
  static const String ordersStats = '/api/mobile/admin/orders/stats';

  // Clients endpoints
  static const String clients = '/api/mobile/admin/clients';
  static const String clientDetail = '/api/mobile/admin/clients/{id}';
  static const String clientOrders = '/api/mobile/admin/clients/{id}/orders';
  static const String clientRdv = '/api/mobile/admin/clients/{id}/rdv';

  // Reviews endpoints
  static const String reviews = '/api/mobile/reviews';
  static const String adminReviews = '/api/mobile/admin/reviews';
  static const String adminReviewDetail = '/api/mobile/admin/reviews/{id}';

  // Banners endpoints
  static const String banners = '/api/mobile/banners';
  static const String adminBanners = '/api/mobile/admin/banners';
  static const String adminBannerDetail = '/api/mobile/admin/banners/{id}';
  static const String adminBannerToggle =
      '/api/mobile/admin/banners/{id}/toggle';

  // Maintenance endpoints
  static const String maintenanceSummary =
      '/api/mobile/admin/maintenance/summary';
  static const String maintenanceContracts =
      '/api/mobile/admin/maintenance/contracts';
  static const String maintenanceRequests =
      '/api/mobile/admin/maintenance/requests';
  static const String maintenanceVisits =
      '/api/mobile/admin/maintenance/visits';
  static const String maintenanceActivateContract =
      '/api/mobile/admin/maintenance/contracts/{id}/activate';
  static const String maintenanceRequestStatus =
      '/api/mobile/admin/maintenance/requests/{id}/status';
  static const String maintenanceValidateVisit =
      '/api/mobile/admin/maintenance/visits/{id}/validate';

  // Audit endpoints
  static const String audit = '/api/mobile/admin/audit';

  // Settings endpoints
  static const String settings = '/api/mobile/admin/settings';

  // Other endpoints
  static const String quartiers = '/api/mobile/quartiers';
  static const String activity = '/api/mobile/activity';
  static const String brands = '/api/mobile/brands';

  // Helper method to replace path parameters
  static String replacePath(String endpoint, Map<String, String> params) {
    String result = endpoint;
    params.forEach((key, value) {
      result = result.replaceAll('{$key}', value);
    });
    return result;
  }
}
