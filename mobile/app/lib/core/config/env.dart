class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://maasga-website.pages.dev',
  );

  static const String googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue:
        '968767908554-j8utdc2d4erv5ll4c13vi27htujdhg3.apps.googleusercontent.com',
  );

  static const String googleAndroidClientId = String.fromEnvironment(
    'GOOGLE_ANDROID_CLIENT_ID',
    defaultValue:
        '968767908554-2p36proffrvcr3hveud8jfisq5jrf1cj.apps.googleusercontent.com',
  );
}
