class ApiEndpoints {
  // Base URL - Points to the main Cloudflare Pages deployment
  static const String baseUrl = 'https://maasga-website.pages.dev';

  // Auth endpoints (Firebase-based)
  static const String mobileLogin = '/api/mobile/login';
  static const String mobileRegister = '/api/mobile/register';
  static const String mobileProfile = '/api/mobile/profile';

  // Dashboard endpoints
  static const String dashboard = '/api/mobile/admin-dashboard';

  // RDV endpoints
  static const String rdvCreate = '/api/mobile/rdv';
  static const String rdvList = '/api/mobile/my-rdvs';
  static const String appointments = '/api/mobile/rdv';

  // Products endpoints
  static const String products = '/api/mobile/products';
  static const String productDetail = '/api/mobile/products/{id}';

  // Orders endpoints
  static const String orders = '/api/mobile/orders';
  static const String ordersCreate = '/api/mobile/commandes';

  // Reviews endpoints
  static const String reviews = '/api/mobile/reviews';

  // Other endpoints
  static const String quartiers = '/api/mobile/quartiers';
  static const String activity = '/api/mobile/activity';
  static const String banners = '/api/mobile/banners';
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
