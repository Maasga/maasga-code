# MaasGa Admin Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer l'interface admin web actuelle en application mobile native Flutter avec toutes les fonctionnalités (16 sections) et authentification Firebase unifiée web/mobile.

**Architecture:** Flutter 3.41.7+ avec Riverpod 3.x, architecture feature-first, partage de code core avec l'app client existante, Firebase Auth avec custom claims, Firebase Cloud Messaging pour notifications.

**Tech Stack:** Flutter, Riverpod, Dio, Firebase Auth, Firebase Cloud Messaging, Hive (cache), Chart.js Flutter wrapper, SharedPreferences.

## Global Constraints

- **Flutter version**: 3.41.7+ minimum
- **State management**: Riverpod 3.x obligatoire
- **Architecture**: Feature-first avec partage code core (identique à app client)
- **Authentification**: Firebase Auth avec custom claims obligatoire
- **Notifications**: Firebase Cloud Messaging obligatoire
- **Thème**: Adaptatif (clair/sombre/système)
- **Langue**: Tout le code, commentaires, et UI en français
- **Plateforme**: Android uniquement (pas de iOS, web, windows)
- **Build**: `flutter build apk --release --split-per-abi` pour distribution
- **Tests**: `flutter analyze` doit passer sans issues
- **Formatage**: `dart format lib test` (80 colonnes)

---

## Phase 1: Setup et Architecture (1 semaine)

### Task 1: Initialisation Projet Flutter

**Files:**
- Create: `mobile_admin/pubspec.yaml`
- Create: `mobile_admin/analysis_options.yaml`
- Create: `mobile_admin/lib/main.dart`
- Create: `mobile_admin/android/app/build.gradle.kts`

**Interfaces:**
- Produces: Structure de base du projet Flutter avec dépendances configurées

- [ ] **Step 1: Créer pubspec.yaml avec dépendances**

```yaml
name: mobile_admin
description: "MaasGa Admin - Panel d'administration mobile"
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: ^3.11.5

dependencies:
  flutter:
    sdk: flutter
  
  # State management
  flutter_riverpod: ^3.0.0
  
  # Firebase
  firebase_core: ^3.0.0
  firebase_auth: ^5.0.0
  firebase_messaging: ^15.0.0
  
  # Réseau
  dio: ^5.0.0
  cookie_jar: ^4.0.0
  
  # Stockage local
  shared_preferences: ^2.3.0
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  path_provider: ^2.1.0
  
  # UI
  cupertino_icons: ^1.0.8
  flutter_local_notifications: ^18.0.0
  
  # Utils
  connectivity_plus: ^6.0.0
  url_launcher: ^6.3.0
  permission_handler: ^11.0.0
  
  # Charts
  fl_chart: ^0.68.0
  
  # Image handling
  cached_network_image: ^3.3.0
  image_picker: ^1.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0
  build_runner: ^2.4.0
  hive_generator: ^2.0.0
  riverpod_generator: ^3.0.0
  riverpod_lint: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
```

- [ ] **Step 2: Créer analysis_options.yaml**

```yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - prefer_const_constructors
    - prefer_const_literals_to_create_immutables
    - avoid_print
    - prefer_single_quotes
    - sort_constructors_first
    - always_declare_return_types
    - avoid_dynamic_calls

analyzer:
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
```

- [ ] **Step 3: Créer main.dart minimal**

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaasGaAdminApp());
}

class MaasGaAdminApp extends StatelessWidget {
  const MaasGaAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MaasGa Admin',
      debugShowCheckedModeBanner: false,
      home: const Scaffold(
        body: Center(
          child: Text('MaasGa Admin - Setup en cours'),
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: Configurer Android build.gradle.kts**

```kotlin
android {
    namespace = "com.maasga.admin"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.maasga.admin"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}
```

- [ ] **Step 5: Installer dépendances**

```bash
cd mobile_admin
flutter pub get
```

- [ ] **Step 6: Vérifier compilation**

```bash
flutter analyze
```

Expected: No issues found

- [ ] **Step 7: Commit**

```bash
git add mobile_admin/
git commit -m "feat: initialiser projet Flutter admin avec dépendances"
```

---

### Task 2: Structure de Dossiers et Partage Code Core

**Files:**
- Create: `mobile_admin/lib/core/config/env.dart`
- Create: `mobile_admin/lib/core/network/api_client.dart`
- Create: `mobile_admin/lib/core/network/api_endpoints.dart`
- Create: `mobile_admin/lib/core/theme/app_theme.dart`
- Create: `mobile_admin/lib/core/theme/admin_theme.dart`
- Create: `mobile_admin/lib/shared/utils/helpers.dart`
- Create: `mobile_admin/lib/shared/design_tokens/maasga_tokens.dart`

**Interfaces:**
- Produces: Structure core partagée avec app client, configuration environnement, client réseau, thème

- [ ] **Step 1: Créer env.dart**

```dart
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://maasga-website.pages.dev',
  );
  
  static const String googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '',
  );
  
  static const String appVersion = String.fromEnvironment(
    'APP_VERSION',
    defaultValue: '1.0.0',
  );
}
```

- [ ] **Step 2: Créer api_endpoints.dart**

```dart
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
```

- [ ] **Step 3: Créer api_client.dart avec Dio et intercepteurs**

```dart
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../config/env.dart';
import 'api_endpoints.dart';

class ApiClient {
  late final Dio _dio;
  
  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    _setupInterceptors();
  }
  
  Dio get dio => _dio;
  
  void _setupInterceptors() {
    // Interceptor pour token Firebase
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final user = FirebaseAuth.instance.currentUser;
        if (user != null) {
          final token = await user.getIdToken();
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expiré, essayer de refresh
          final user = FirebaseAuth.instance.currentUser;
          if (user != null) {
            await user.getIdToken(true);
            // Retry la requête
            final opts = error.requestOptions;
            final token = await user.getIdToken();
            opts.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.fetch(opts);
            return handler.resolve(response);
          }
        }
        return handler.next(error);
      },
    ));
    
    // Logging interceptor (dev only)
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));
  }
}
```

- [ ] **Step 4: Créer app_theme.dart**

```dart
import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFFD4AF37),
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: Colors.white,
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF1A1A2E),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
    );
  }
  
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFFD4AF37),
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: const Color(0xFF0F0F1A),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF1A1A2E),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
    );
  }
}
```

- [ ] **Step 5: Créer admin_theme.dart avec tokens spécifiques**

```dart
import 'package:flutter/material.dart';

class AdminTheme {
  // Couleurs
  static const Color primary = Color(0xFF1A1A2E);
  static const Color primaryLight = Color(0xFF16213E);
  static const Color accent = Color(0xFFD4AF37);
  static const Color success = Color(0xFF34D399);
  static const Color warning = Color(0xFFFBBF24);
  static const Color error = Color(0xFFF87171);
  static const Color info = Color(0xFF38BDF8);
  
  // Backgrounds
  static const Color bgDark = Color(0xFF0F0F1A);
  static const Color cardBg = Color(0xFF1A1A2E);
  static const Color cardBgLight = Color(0xFFF8FAFC);
  
  // Text
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textMutedLight = Color(0xFF64748B);
  
  // Border
  static const Color border = Color(0xFF334155);
  static const Color borderLight = Color(0xFFE2E8F0);
  
  // Shadows
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.1),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];
  
  static List<BoxShadow> get elevatedShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.15),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];
}
```

- [ ] **Step 6: Créer helpers.dart**

```dart
import 'package:flutter/material.dart';

class Helpers {
  static String formatCurrency(double amount) {
    return '${amount.toStringAsFixed(0)} FCFA';
  }
  
  static String formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
  
  static String formatDateTime(DateTime dateTime) {
    return '${formatDate(dateTime)} à ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
  
  static String getInitials(String name) {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  }
  
  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }
  
  static bool isValidPhone(String phone) {
    return RegExp(r'^\+?[0-9]{8,15}$').hasMatch(phone);
  }
}
```

- [ ] **Step 7: Créer maasga_tokens.dart**

```dart
import 'package:flutter/material.dart';

class MaasgaTokens {
  // Espacement
  static const double spacingBase = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 24.0;
  static const double spacingXl = 32.0;
  
  // Border radius
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 20.0;
  
  // Typography
  static const double fontSizeDisplay = 24.0;
  static const double fontSizeTitle = 18.0;
  static const double fontSizeBody = 14.0;
  static const double fontSizeCaption = 12.0;
  static const double fontSizeSmall = 10.0;
}
```

- [ ] **Step 8: Vérifier compilation**

```bash
cd mobile_admin
flutter analyze
```

Expected: No issues found

- [ ] **Step 9: Commit**

```bash
git add mobile_admin/lib/
git commit -m "feat: créer structure core partagée (config, réseau, thème)"
```

---

### Task 3: Configuration Firebase et Providers Core

**Files:**
- Create: `mobile_admin/lib/core/config/firebase_options.dart`
- Create: `mobile_admin/lib/features/auth/data/providers/firebase_provider.dart`
- Create: `mobile_admin/lib/features/auth/data/providers/dio_provider.dart`
- Create: `mobile_admin/android/app/google-services.json`
- Create: `mobile_admin/android/app/src/main/AndroidManifest.xml`

**Interfaces:**
- Produces: Firebase configuré, providers Riverpod pour auth et Dio

- [ ] **Step 1: Créer firebase_options.dart (à compléter avec vraies options)**

```dart
import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    // TODO: Remplacer avec les vraies options Firebase
    return const FirebaseOptions(
      apiKey: 'YOUR_API_KEY',
      appId: 'YOUR_APP_ID',
      messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
      projectId: 'YOUR_PROJECT_ID',
    );
  }
}
```

- [ ] **Step 2: Créer firebase_provider.dart**

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/firebase_options.dart';

final firebaseProvider = Provider<FirebaseApp>((ref) {
  throw UnimplementedError('Firebase must be initialized in main()');
});

final firebaseAuthProvider = Provider<FirebaseAuth>((ref) {
  return FirebaseAuth.instance;
});

final authStateChangesProvider = StreamProvider<User?>((ref) {
  return ref.watch(firebaseAuthProvider).authStateChanges();
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(firebaseAuthProvider).currentUser;
});
```

- [ ] **Step 3: Créer dio_provider.dart**

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';

final dioProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});
```

- [ ] **Step 4: Mettre à jour main.dart avec Firebase init**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/config/firebase_options.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const ProviderScope(child: MaasGaAdminApp()));
}

class MaasGaAdminApp extends ConsumerWidget {
  const MaasGaAdminApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'MaasGa Admin',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const Scaffold(
        body: Center(
          child: Text('MaasGa Admin - Firebase configuré'),
        ),
      ),
    );
  }
}
```

- [ ] **Step 5: Ajouter google-services.json (copier depuis app client)**

```bash
# Copier le fichier depuis l'app client existante
cp ../maasga-mobile/android/app/google-services.json mobile_admin/android/app/
```

- [ ] **Step 6: Mettre à jour AndroidManifest.xml avec permissions Firebase**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    
    <application
        android:label="MaasGa Admin"
        android:name="${applicationName}">
        
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_launcher" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color" />
            
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
```

- [ ] **Step 7: Vérifier compilation**

```bash
cd mobile_admin
flutter analyze
```

Expected: No issues found

- [ ] **Step 8: Commit**

```bash
git add mobile_admin/
git commit -m "feat: configurer Firebase et providers core Riverpod"
```

---

## Phase 2: Authentification et Shell (1 semaine)

### Task 4: Écran Login Firebase

**Files:**
- Create: `mobile_admin/lib/features/auth/data/repositories/auth_repository.dart`
- Create: `mobile_admin/lib/features/auth/data/models/admin_user.dart`
- Create: `mobile_admin/lib/features/auth/presentation/screens/login_screen.dart`
- Create: `mobile_admin/lib/features/auth/presentation/widgets/login_form.dart`

**Interfaces:**
- Consumes: firebaseAuthProvider, dioProvider
- Produces: Login fonctionnel avec Firebase Auth, vérification rôle admin

- [ ] **Step 1: Créer admin_user.dart**

```dart
class AdminUser {
  final String uid;
  final String email;
  final String? displayName;
  final bool isAdmin;
  final DateTime? lastLogin;
  
  AdminUser({
    required this.uid,
    required this.email,
    this.displayName,
    required this.isAdmin,
    this.lastLogin,
  });
  
  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      uid: json['uid'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String?,
      isAdmin: json['isAdmin'] as bool? ?? false,
      lastLogin: json['lastLogin'] != null 
          ? DateTime.parse(json['lastLogin'] as String)
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'isAdmin': isAdmin,
      'lastLogin': lastLogin?.toIso8601String(),
    };
  }
}
```

- [ ] **Step 2: Créer auth_repository.dart**

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/admin_user.dart';
import '../../../core/network/api_endpoints.dart';

class AuthRepository {
  final FirebaseAuth _firebaseAuth;
  final Dio _dio;
  
  AuthRepository(this._firebaseAuth, this._dio);
  
  Future<AdminUser> signInWithEmailAndPassword(String email, String password) async {
    try {
      final credential = await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Vérifier rôle admin côté serveur
      final response = await _dio.post(
        ApiEndpoints.verifyAdmin,
        data: {'uid': credential.user?.uid},
      );
      
      if (response.statusCode == 200 && response.data['isAdmin'] == true) {
        return AdminUser(
          uid: credential.user!.uid,
          email: credential.user!.email!,
          displayName: credential.user!.displayName,
          isAdmin: true,
          lastLogin: DateTime.now(),
        );
      } else {
        await _firebaseAuth.signOut();
        throw Exception('Accès non autorisé - pas un compte admin');
      }
    } on FirebaseAuthException catch (e) {
      throw Exception('Erreur d\'authentification: ${e.message}');
    } catch (e) {
      await _firebaseAuth.signOut();
      throw Exception('Erreur de connexion: $e');
    }
  }
  
  Future<void> signOut() async {
    await _firebaseAuth.signOut();
  }
  
  Future<void> resetPassword(String email) async {
    await _firebaseAuth.sendPasswordResetEmail(email: email);
  }
  
  Stream<User?> authStateChanges() => _firebaseAuth.authStateChanges();
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final firebaseAuth = ref.watch(firebaseAuthProvider);
  final dio = ref.watch(dioProvider).dio;
  return AuthRepository(firebaseAuth, dio);
});
```

- [ ] **Step 3: Créer login_form.dart**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/auth_repository.dart';

class LoginForm extends ConsumerStatefulWidget {
  const LoginForm({super.key});
  
  @override
  ConsumerState<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends ConsumerState<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
  
  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      final authRepository = ref.read(authRepositoryProvider);
      await authRepository.signInWithEmailAndPassword(
        _emailController.text.trim(),
        _passwordController.text,
      );
      // Navigation sera gérée par le router
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (_errorMessage != null)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email_outlined),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Veuillez entrer votre email';
              }
              if (!value.contains('@')) {
                return 'Email invalide';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          
          TextFormField(
            controller: _passwordController,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Mot de passe',
              prefixIcon: Icon(Icons.lock_outlined),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Veuillez entrer votre mot de passe';
              }
              if (value.length < 6) {
                return 'Le mot de passe doit contenir au moins 6 caractères';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),
          
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD4AF37),
                foregroundColor: Colors.black,
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
                      ),
                    )
                  : const Text('Connexion', style: TextStyle(fontSize: 16)),
            ),
          ),
          
          const SizedBox(height: 16),
          
          TextButton(
            onPressed: _isLoading ? null : () {
              // TODO: Implémenter reset password
            },
            child: const Text('Mot de passe oublié ?'),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: Créer login_screen.dart**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/login_form.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const Spacer(),
              
              // Logo
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFF1A1A2E),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFD4AF37).withOpacity(0.3),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Center(
                  child: Text(
                    'M',
                    style: TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFFD4AF37),
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              const Text(
                'MaasGa Admin',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'Connectez-vous pour accéder au back-office',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              
              const Spacer(),
              
              const LoginForm(),
              
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 5: Vérifier compilation**

```bash
cd mobile_admin
flutter analyze
```

Expected: No issues found

- [ ] **Step 6: Commit**

```bash
git add mobile_admin/lib/features/auth/
git commit -m "feat: créer écran login Firebase avec vérification rôle admin"
```

---

### Task 5: Navigation Drawer et Shell Principal

**Files:**
- Create: `mobile_admin/lib/app/shell/admin_shell.dart`
- Create: `mobile_admin/lib/app/shell/widgets/nav_drawer.dart`
- Create: `mobile_admin/lib/app/shell/widgets/bottom_nav.dart`
- Create: `mobile_admin/lib/app/shell/widgets/app_bar.dart`

**Interfaces:**
- Produces: Shell principal avec navigation drawer, bottom nav, app bar

- [ ] **Step 1: Créer nav_drawer.dart**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class NavDrawer extends ConsumerWidget {
  const NavDrawer({super.key});
  
  final List<NavItem> _navItems = const [
    NavItem(
      icon: Icons.dashboard_outlined,
      label: 'Dashboard',
      route: '/dashboard',
      category: 'Principal',
    ),
    NavItem(
      icon: Icons.inventory_2_outlined,
      label: 'Produits',
      route: '/produits',
      category: 'Principal',
    ),
    NavItem(
      icon: Icons.shopping_cart_outlined,
      label: 'Commandes',
      route: '/commandes',
      category: 'Principal',
    ),
    NavItem(
      icon: Icons.calendar_today_outlined,
      label: 'Rendez-vous',
      route: '/rdv',
      category: 'Principal',
    ),
    NavItem(
      icon: Icons.description_outlined,
      label: 'Devis',
      route: '/devis',
      category: 'Commercial',
    ),
    NavItem(
      icon: Icons.payment_outlined,
      label: 'Paiements',
      route: '/paiements',
      category: 'Commercial',
    ),
    NavItem(
      icon: Icons.people_outline,
      label: 'Clients',
      route: '/clients',
      category: 'Commercial',
    ),
    NavItem(
      icon: Icons.build_outlined,
      label: 'Maintenance',
      route: '/maintenance',
      category: 'Service',
    ),
    NavItem(
      icon: Icons.support_agent_outlined,
      label: 'SAV',
      route: '/sav',
      category: 'Service',
    ),
    NavItem(
      icon: Icons.message_outlined,
      label: 'Messages',
      route: '/messages',
      category: 'Service',
    ),
    NavItem(
      icon: Icons.star_outline,
      label: 'Avis',
      route: '/avis',
      category: 'Marketing',
    ),
    NavItem(
      icon: Icons.photo_library_outlined,
      label: 'Réalisations',
      route: '/realisations',
      category: 'Marketing',
    ),
    NavItem(
      icon: Icons.campaign_outlined,
      label: 'Bannières',
      route: '/banners',
      category: 'Marketing',
    ),
    NavItem(
      icon: Icons.receipt_long_outlined,
      label: 'Audit',
      route: '/audit',
      category: 'Système',
    ),
    NavItem(
      icon: Icons.notifications_outlined,
      label: 'Notifications',
      route: '/notifications',
      category: 'Système',
    ),
    NavItem(
      icon: Icons.settings_outlined,
      label: 'Paramètres',
      route: '/parametres',
      category: 'Système',
    ),
  ];
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentRoute = ModalRoute.of(context)?.settings.name ?? '/';
    
    return Drawer(
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0F1A2E), Color(0xFF1A3478)],
          ),
        ),
        child: Column(
          children: [
            // Header
            UserAccountsDrawerHeader(
              decoration: BoxDecoration(
                color: Colors.transparent,
              ),
              accountName: const Text(
                'Administrateur',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              accountEmail: const Text(
                'admin@maasga.bf',
                style: TextStyle(color: Color(0xFF93C5FD)),
              ),
              currentAccountPicture: CircleAvatar(
                backgroundColor: const Color(0xFFD4AF37),
                child: Icon(Icons.person, color: Colors.black[87]),
              ),
            ),
            
            // Navigation items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: _buildNavItems(currentRoute),
              ),
            ),
            
            // Footer
            _buildFooter(context, ref),
          ],
        ),
      ),
    );
  }
  
  List<Widget> _buildNavItems(String currentRoute) {
    String? currentCategory;
    List<Widget> items = [];
    
    for (final item in _navItems) {
      // Category header
      if (item.category != currentCategory) {
        currentCategory = item.category;
        items.add(
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              currentCategory!,
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
          ),
        );
      }
      
      // Nav item
      final isActive = currentRoute == item.route;
      items.add(
        ListTile(
          leading: Icon(
            item.icon,
            color: isActive ? Colors.white : const Color(0xFF93C5FD),
          ),
          title: Text(
            item.label,
            style: TextStyle(
              color: isActive ? Colors.white : const Color(0xFF93C5FD),
              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          onTap: () {
            Navigator.pushReplacementNamed(context, item.route);
          },
          selected: isActive,
          selectedTileColor: Colors.white.withOpacity(0.2),
        ),
      );
    }
    
    return items;
  }
  
  Widget _buildFooter(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        const Divider(color: Colors.white24),
        ListTile(
          leading: const Icon(Icons.public, color: Color(0xFF93C5FD)),
          title: const Text(
            'Voir le site public',
            style: TextStyle(color: Color(0xFF93C5FD)),
          ),
          onTap: () {
            // TODO: Ouvrir site public
          },
        ),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.redAccent),
          title: const Text(
            'Déconnexion',
            style: TextStyle(color: Colors.redAccent),
          ),
          onTap: () async {
            final authRepository = ref.read(authRepositoryProvider);
            await authRepository.signOut();
            Navigator.pushReplacementNamed(context, '/login');
          },
        ),
      ],
    );
  }
}

class NavItem {
  final IconData icon;
  final String label;
  final String route;
  final String category;
  
  const NavItem({
    required this.icon,
    required this.label,
    required this.route,
    required this.category,
  });
}
```

- [ ] **Step 2: Créer bottom_nav.dart**

```dart
import 'package:flutter/material.dart';

class BottomNav extends StatelessWidget {
  final String currentRoute;
  final Function(String) onNavigate;
  
  const BottomNav({
    super.key,
    required this.currentRoute,
    required this.onNavigate,
  });
  
  final List<_BottomNavItem> _items = const [
    _BottomNavItem(
      icon: Icons.dashboard_outlined,
      activeIcon: Icons.dashboard,
      label: 'Dashboard',
      route: '/dashboard',
    ),
    _BottomNavItem(
      icon: Icons.shopping_cart_outlined,
      activeIcon: Icons.shopping_cart,
      label: 'Commandes',
      route: '/commandes',
    ),
    _BottomNavItem(
      icon: Icons.calendar_today_outlined,
      activeIcon: Icons.calendar_today,
      label: 'RDV',
      route: '/rdv',
    ),
    _BottomNavItem(
      icon: Icons.inventory_2_outlined,
      activeIcon: Icons.inventory_2,
      label: 'Produits',
      route: '/produits',
    ),
  ];
  
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: _items.indexWhere((item) => item.route == currentRoute),
        onTap: (index) => onNavigate(_items[index].route),
        type: BottomNavigationBarType.fixed,
        items: _items.map((item) {
          final isActive = currentRoute == item.route;
          return BottomNavigationBarItem(
            icon: Icon(isActive ? item.activeIcon : item.icon),
            label: item.label,
          );
        }).toList(),
      ),
    );
  }
}

class _BottomNavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String route;
  
  const _BottomNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.route,
  });
}
```

- [ ] **Step 3: Créer app_bar.dart**

```dart
import 'package:flutter/material.dart';

class AdminAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final VoidCallback? onMenuTap;
  final int notificationCount;
  final VoidCallback? onNotificationTap;
  
  const AdminAppBar({
    super.key,
    required this.title,
    this.onMenuTap,
    this.notificationCount = 0,
    this.onNotificationTap,
  });
  
  @override
  Size get preferredSize => const Size.fromHeight(56);
  
  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(
        title,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
      ),
      leading: IconButton(
        icon: const Icon(Icons.menu),
        onPressed: onMenuTap ?? () => Scaffold.of(context).openDrawer(),
      ),
      actions: [
        // Search button (placeholder)
        IconButton(
          icon: const Icon(Icons.search),
          onPressed: () {
            // TODO: Implement search
          },
        ),
        
        // Notifications
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: onNotificationTap,
            ),
            if (notificationCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    notificationCount > 9 ? '9+' : notificationCount.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
        
        const SizedBox(width: 8),
      ],
    );
  }
}
```

- [ ] **Step 4: Créer admin_shell.dart**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'widgets/nav_drawer.dart';
import 'widgets/bottom_nav.dart';
import 'widgets/app_bar.dart';

class AdminShell extends ConsumerStatefulWidget {
  final Widget child;
  final String title;
  
  const AdminShell({
    super.key,
    required this.child,
    required this.title,
  });
  
  @override
  ConsumerState<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends ConsumerState<AdminShell> {
  int _notificationCount = 0;
  
  @override
  Widget build(BuildContext context) {
    final currentRoute = ModalRoute.of(context)?.settings.name ?? '/';
    
    return Scaffold(
      drawer: const NavDrawer(),
      appBar: AdminAppBar(
        title: widget.title,
        notificationCount: _notificationCount,
        onNotificationTap: () {
          Navigator.pushNamed(context, '/notifications');
        },
      ),
      body: widget.child,
      bottomNavigationBar: BottomNav(
        currentRoute: currentRoute,
        onNavigate: (route) {
          Navigator.pushReplacementNamed(context, route);
        },
      ),
    );
  }
}
```

- [ ] **Step 5: Vérifier compilation**

```bash
cd mobile_admin
flutter analyze
```

Expected: No issues found

- [ ] **Step 6: Commit**

```bash
git add mobile_admin/lib/app/shell/
git commit -m "feat: créer shell admin avec navigation drawer et bottom nav"
```

---

### Task 6: Router avec Guards d'Authentification

**Files:**
- Create: `mobile_admin/lib/app/router/app_router.dart`
- Modify: `mobile_admin/lib/main.dart`

**Interfaces:**
- Consumes: authStateChangesProvider
- Produces: Router fonctionnel avec guards auth

- [ ] **Step 1: Créer app_router.dart**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../shell/admin_shell.dart';
import '../../features/auth/data/providers/firebase_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateChangesProvider);
  
  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isAuthenticated = authState.value != null;
      final isLoggingIn = state.matchedLocation == '/login';
      
      if (!isAuthenticated && !isLoggingIn) {
        return '/login';
      }
      
      if (isAuthenticated && isLoggingIn) {
        return '/dashboard';
      }
      
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: const LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/dashboard',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Tableau de bord',
            child: const DashboardScreen(),
          ),
        ),
      ),
      // TODO: Ajouter les autres routes
    ],
  );
});
```

- [ ] **Step 2: Mettre à jour main.dart avec GoRouter**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:go_router/go_router.dart';
import 'core/config/firebase_options.dart';
import 'core/theme/app_theme.dart';
import 'app/router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const ProviderScope(child: MaasGaAdminApp()));
}

class MaasGaAdminApp extends ConsumerWidget {
  const MaasGaAdminApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      title: 'MaasGa Admin',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
```

- [ ] **Step 3: Ajouter go_router dans pubspec.yaml**

```yaml
dependencies:
  go_router: ^14.0.0
```

- [ ] **Step 4: Installer dépendance**

```bash
cd mobile_admin
flutter pub get
```

- [ ] **Step 5: Créer dashboard_screen.dart (placeholder)**

```dart
import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});
  
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Dashboard - À implémenter'),
    );
  }
}
```

- [ ] **Step 6: Créer dossier dashboard**

```bash
mkdir -p mobile_admin/lib/features/dashboard/presentation/screens
```

- [ ] **Step 7: Vérifier compilation**

```bash
cd mobile_admin
flutter analyze
```

Expected: No issues found

- [ ] **Step 8: Commit**

```bash
git add mobile_admin/
git commit -m "feat: créer router GoRouter avec guards d'authentification"
```

---

## Phase 3: Sections Principales (4 semaines)

### Task 7: Dashboard avec KPIs et Graphiques

**Files:**
- Create: `mobile_admin/lib/features/dashboard/data/repositories/dashboard_repository.dart`
- Create: `mobile_admin/lib/features/dashboard/data/models/dashboard_data.dart`
- Create: `mobile_admin/lib/features/dashboard/presentation/screens/dashboard_screen.dart`
- Create: `mobile_admin/lib/features/dashboard/presentation/widgets/kpi_card.dart`
- Create: `mobile_admin/lib/features/dashboard/presentation/widgets/chart_widget.dart`

**Interfaces:**
- Consumes: dioProvider
- Produces: Dashboard fonctionnel avec KPIs et graphiques

- [ ] **Step 1: Créer dashboard_data.dart**

```dart
class DashboardData {
  final int pendingRdv;
  final int confirmedRdv;
  final int doneRdv;
  final int lowStock;
  final int outOfStock;
  final int pendingReviews;
  final int approvedReviews;
  final double avgNote;
  final double estimatedCA;
  final int rdvThisWeek;
  final int ordersThisWeek;
  final List<DailyCount> rdvChartData;
  final List<Alert> alerts;
  
  DashboardData({
    required this.pendingRdv,
    required this.confirmedRdv,
    required this.doneRdv,
    required this.lowStock,
    required this.outOfStock,
    required this.pendingReviews,
    required this.approvedReviews,
    required this.avgNote,
    required this.estimatedCA,
    required this.rdvThisWeek,
    required this.ordersThisWeek,
    required this.rdvChartData,
    required this.alerts,
  });
  
  factory DashboardData.fromJson(Map<String, dynamic> json) {
    return DashboardData(
      pendingRdv: json['pendingRdv'] as int? ?? 0,
      confirmedRdv: json['confirmedRdv'] as int? ?? 0,
      doneRdv: json['doneRdv'] as int? ?? 0,
      lowStock: json['lowStock'] as int? ?? 0,
      outOfStock: json['outOfStock'] as int? ?? 0,
      pendingReviews: json['pendingReviews'] as int? ?? 0,
      approvedReviews: json['approvedReviews'] as int? ?? 0,
      avgNote: (json['avgNote'] as num?)?.toDouble() ?? 0.0,
      estimatedCA: (json['estimatedCA'] as num?)?.toDouble() ?? 0.0,
      rdvThisWeek: json['rdvThisWeek'] as int? ?? 0,
      ordersThisWeek: json['ordersThisWeek'] as int? ?? 0,
      rdvChartData: (json['rdvChartData'] as List?)
              ?.map((e) => DailyCount.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      alerts: (json['alerts'] as List?)
              ?.map((e) => Alert.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class DailyCount {
  final String day;
  final int count;
  
  DailyCount({required this.day, required this.count});
  
  factory DailyCount.fromJson(Map<String, dynamic> json) {
    return DailyCount(
      day: json['day'] as String,
      count: json['count'] as int,
    );
  }
}

class Alert {
  final String type;
  final String message;
  final int count;
  final String? route;
  
  Alert({
    required this.type,
    required this.message,
    required this.count,
    this.route,
  });
  
  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      type: json['type'] as String,
      message: json['message'] as String,
      count: json['count'] as int,
      route: json['route'] as String?,
    );
  }
}
```

- [ ] **Step 2: Créer dashboard_repository.dart**

```dart
import 'package:dio/dio.dart';
import '../models/dashboard_data.dart';
import '../../../core/network/api_endpoints.dart';

class DashboardRepository {
  final Dio _dio;
  
  DashboardRepository(this._dio);
  
  Future<DashboardData> getDashboardData() async {
    try {
      final response = await _dio.get(ApiEndpoints.dashboard);
      return DashboardData.fromJson(response.data);
    } catch (e) {
      throw Exception('Erreur lors du chargement du dashboard: $e');
    }
  }
}
```

- [ ] **Step 3: Créer kpi_card.dart**

```dart
import 'package:flutter/material.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final String subLabel;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  
  const KpiCard({
    super.key,
    required this.label,
    required this.value,
    required this.subLabel,
    required this.icon,
    required this.color,
    this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
        decoration: BoxDecoration(
          color: AdminTheme.cardBg,
          borderRadius: BorderRadius.circular(MaasgaTokens.radiusLg),
          border: Border.all(color: AdminTheme.border),
          boxShadow: AdminTheme.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: MaasgaTokens.spacingSm),
            Text(
              value,
              style: const TextStyle(
                fontSize: MaasgaTokens.fontSizeDisplay,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: MaasgaTokens.fontSizeBody,
                color: AdminTheme.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subLabel,
              style: TextStyle(
                fontSize: MaasgaTokens.fontSizeCaption,
                color: AdminTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: Créer chart_widget.dart**

```dart
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import '../data/models/dashboard_data.dart';

class ChartWidget extends StatelessWidget {
  final List<DailyCount> data;
  final String title;
  
  const ChartWidget({
    super.key,
    required this.data,
    required this.title,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      decoration: BoxDecoration(
        color: AdminTheme.cardBg,
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusLg),
        border: Border.all(color: AdminTheme.border),
        boxShadow: AdminTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: MaasgaTokens.fontSizeTitle,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: MaasgaTokens.spacingMd),
          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() >= 0 && value.toInt() < data.length) {
                          return Text(
                            data[value.toInt()].day,
                            style: TextStyle(
                              fontSize: MaasgaTokens.fontSizeCaption,
                              color: AdminTheme.textMuted,
                            ),
                          );
                        }
                        return const Text('');
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: data.asMap().entries.map((entry) {
                      return FlSpot(entry.key.toDouble(), entry.value.count.toDouble());
                    }).toList(),
                    isCurved: true,
                    color: AdminTheme.accent,
                    barWidth: 3,
                    dotData: FlDotData(show: false),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 5: Mettre à jour dashboard_screen.dart**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/dashboard_repository.dart';
import '../data/models/dashboard_data.dart';
import '../widgets/kpi_card.dart';
import '../widgets/chart_widget.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});
  
  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  DashboardData? _data;
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    try {
      final repository = DashboardRepository(ref.read(dioProvider).dio);
      final data = await repository.getDashboardData();
      if (mounted) {
        setState(() {
          _data = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (_data == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AdminTheme.error),
            const SizedBox(height: MaasgaTokens.spacingMd),
            const Text('Erreur de chargement'),
            const SizedBox(height: MaasgaTokens.spacingSm),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Alertes RDV
          if (_data!.pendingRdv > 0)
            _buildAlertCard(_data!),
          
          const SizedBox(height: MaasgaTokens.spacingMd),
          
          // KPIs
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: MaasgaTokens.spacingSm,
            crossAxisSpacing: MaasgaTokens.spacingSm,
            childAspectRatio: 1.2,
            children: [
              KpiCard(
                label: 'RDV en attente',
                value: _data!.pendingRdv.toString(),
                subLabel: '${_data!.confirmedRdv + _data!.doneRdv} total',
                icon: Icons.calendar_today,
                color: AdminTheme.info,
                onTap: () => Navigator.pushNamed(context, '/rdv'),
              ),
              KpiCard(
                label: 'Alertes stock',
                value: (_data!.lowStock + _data!.outOfStock).toString(),
                subLabel: '${_data!.outOfStock} rupture · ${_data!.lowStock} limité',
                icon: Icons.inventory_2,
                color: AdminTheme.warning,
                onTap: () => Navigator.pushNamed(context, '/produits'),
              ),
              KpiCard(
                label: 'Avis en attente',
                value: _data!.pendingReviews.toString(),
                subLabel: '${_data!.approvedReviews} publiés · ${_data!.avgNote}/5',
                icon: Icons.star,
                color: AdminTheme.accent,
                onTap: () => Navigator.pushNamed(context, '/avis'),
              ),
              KpiCard(
                label: 'Chiffre d\'affaires',
                value: '${(_data!.estimatedCA / 1000).toStringAsFixed(0)}K',
                subLabel: 'FCFA · commandes validées',
                icon: Icons.trending_up,
                color: AdminTheme.success,
                onTap: () => Navigator.pushNamed(context, '/commandes'),
              ),
            ],
          ),
          
          const SizedBox(height: MaasgaTokens.spacingLg),
          
          // Graphique RDV
          ChartWidget(
            data: _data!.rdvChartData,
            title: 'RDV des 7 derniers jours',
          ),
        ],
      ),
    );
  }
  
  Widget _buildAlertCard(DashboardData data) {
    return Container(
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      decoration: BoxDecoration(
        color: AdminTheme.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusLg),
        border: Border.all(color: AdminTheme.error.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: AdminTheme.error,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.notifications_active, color: Colors.white),
              ),
              const SizedBox(width: MaasgaTokens.spacingSm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Nouveaux rendez-vous en attente',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AdminTheme.error,
                      ),
                    ),
                    Text(
                      '${data.pendingRdv} rendez-vous à confirmer',
                      style: TextStyle(
                        fontSize: MaasgaTokens.fontSizeCaption,
                        color: AdminTheme.error.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: MaasgaTokens.spacingSm),
          ElevatedButton(
            onPressed: () => Navigator.pushNamed(context, '/rdv'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AdminTheme.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('Voir les RDV'),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 6: Créer dashboard_provider.dart**

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/dashboard_repository.dart';
import '../data/models/dashboard_data.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(ref.watch(dioProvider).dio);
});

final dashboardDataProvider = FutureProvider<DashboardData>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return repository.getDashboardData();
});
```

- [ ] **Step 7: Ajouter dio_provider import dans dashboard**

```dart
import '../../../core/network/api_client.dart';
```

- [ ] **Step 8: Vérifier compilation**

```bash
cd mobile_admin
flutter analyze
```

Expected: No issues found

- [ ] **Step 9: Commit**

```bash
git add mobile_admin/lib/features/dashboard/
git commit -m "feat: implémenter dashboard avec KPIs et graphiques"
```

---

### Task 8: Produits & Stock - Liste et Filtres

**Files:**
- Create: `mobile_admin/lib/features/produits/data/repositories/produits_repository.dart`
- Create: `mobile_admin/lib/features/produits/data/models/produit.dart`
- Create: `mobile_admin/lib/features/produits/presentation/screens/produits_screen.dart`
- Create: `mobile_admin/lib/features/produits/presentation/widgets/produit_card.dart`
- Create: `mobile_admin/lib/features/produits/presentation/widgets/filters_bottom_sheet.dart`

**Interfaces:**
- Consumes: dioProvider
- Produits: Liste produits fonctionnelle avec filtres et recherche

- [ ] **Step 1: Créer produit.dart**

```dart
class Produit {
  final int id;
  final String name;
  final String brand;
  final String category;
  final double price;
  final int stock;
  final bool available;
  final String? imageUrl;
  final String? description;
  final String? btu;
  final String? power;
  final List<String>? gallery;
  
  Produit({
    required this.id,
    required this.name,
    required this.brand,
    required this.category,
    required this.price,
    required this.stock,
    required this.available,
    this.imageUrl,
    this.description,
    this.btu,
    this.power,
    this.gallery,
  });
  
  factory Produit.fromJson(Map<String, dynamic> json) {
    return Produit(
      id: json['id'] as int,
      name: json['name'] as String,
      brand: json['brand'] as String,
      category: json['category'] as String,
      price: (json['price'] as num).toDouble(),
      stock: json['stock'] as int,
      available: json['available'] as bool? ?? true,
      imageUrl: json['image_url'] as String?,
      description: json['description'] as String?,
      btu: json['btu'] as String?,
      power: json['power'] as String?,
      gallery: (json['gallery'] as List?)?.cast<String>(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'brand': brand,
      'category': category,
      'price': price,
      'stock': stock,
      'available': available,
      'image_url': imageUrl,
      'description': description,
      'btu': btu,
      'power': power,
      'gallery': gallery,
    };
  }
}
```

- [ ] **Step 2: Créer produits_repository.dart**

```dart
import 'package:dio/dio.dart';
import '../models/produit.dart';
import '../../../core/network/api_endpoints.dart';

class ProduitsRepository {
  final Dio _dio;
  
  ProduitsRepository(this._dio);
  
  Future<List<Produit>> getProduits({
    String? category,
    String? brand,
    bool? available,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (category != null) queryParams['category'] = category;
      if (brand != null) queryParams['brand'] = brand;
      if (available != null) queryParams['available'] = available;
      if (search != null) queryParams['search'] = search;
      
      final response = await _dio.get(
        ApiEndpoints.products,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      
      final data = response.data as List;
      return data.map((e) => Produit.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception('Erreur lors du chargement des produits: $e');
    }
  }
  
  Future<Produit> getProduit(int id) async {
    try {
      final response = await _dio.get('${ApiEndpoints.product}/$id');
      return Produit.fromJson(response.data);
    } catch (e) {
      throw Exception('Erreur lors du chargement du produit: $e');
    }
  }
  
  Future<Produit> createProduit(Produit produit) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.products,
        data: produit.toJson(),
      );
      return Produit.fromJson(response.data);
    } catch (e) {
      throw Exception('Erreur lors de la création du produit: $e');
    }
  }
  
  Future<Produit> updateProduit(Produit produit) async {
    try {
      final response = await _dio.put(
        '${ApiEndpoints.product}/${produit.id}',
        data: produit.toJson(),
      );
      return Produit.fromJson(response.data);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du produit: $e');
    }
  }
  
  Future<void> deleteProduit(int id) async {
    try {
      await _dio.delete('${ApiEndpoints.product}/$id');
    } catch (e) {
      throw Exception('Erreur lors de la suppression du produit: $e');
    }
  }
}
```

- [ ] **Step 3: Créer produit_card.dart**

```dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/models/produit.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../shared/utils/helpers.dart';

class ProduitCard extends StatelessWidget {
  final Produit produit;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  
  const ProduitCard({
    super.key,
    required this.produit,
    this.onTap,
    this.onEdit,
    this.onDelete,
  });
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: MaasgaTokens.spacingSm),
      child: InkWell(
        onTap: onTap,
        onLongPress: () => _showActions(context),
        child: Padding(
          padding: const EdgeInsets.all(MaasgaTokens.spacingSm),
          child: Row(
            children: [
              // Image
              ClipRRect(
                borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
                child: produit.imageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: produit.imageUrl!,
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          width: 60,
                          height: 60,
                          color: Colors.grey[300],
                          child: const Icon(Icons.image, color: Colors.grey),
                        ),
                        errorWidget: (context, url, error) => Container(
                          width: 60,
                          height: 60,
                          color: Colors.grey[300],
                          child: const Icon(Icons.broken_image, color: Colors.grey),
                        ),
                      )
                    : Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[300],
                        child: const Icon(Icons.image, color: Colors.grey),
                      ),
              ),
              const SizedBox(width: MaasgaTokens.spacingSm),
              
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      produit.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: MaasgaTokens.fontSizeBody,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      produit.brand,
                      style: TextStyle(
                        fontSize: MaasgaTokens.fontSizeCaption,
                        color: AdminTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          Helpers.formatCurrency(produit.price),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AdminTheme.accent,
                          ),
                        ),
                        const SizedBox(width: MaasgaTokens.spacingSm),
                        _buildStockBadge(),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Actions
              IconButton(
                icon: const Icon(Icons.more_vert),
                onPressed: () => _showActions(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildStockBadge() {
    if (!produit.available) {
      return Container(
        padding: const EdgeInsets.symmetric(
          horizontal: MaasgaTokens.spacingSm,
          vertical: 2,
        ),
        decoration: BoxDecoration(
          color: AdminTheme.error.withOpacity(0.2),
          borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
          border: Border.all(color: AdminTheme.error.withOpacity(0.3)),
        ),
        child: Text(
          'Indisponible',
          style: TextStyle(
            fontSize: MaasgaTokens.fontSizeSmall,
            color: AdminTheme.error,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    } else if (produit.stock == 0) {
      return Container(
        padding: const EdgeInsets.symmetric(
          horizontal: MaasgaTokens.spacingSm,
          vertical: 2,
        ),
        decoration: BoxDecoration(
          color: AdminTheme.error.withOpacity(0.2),
          borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
          border: Border.all(color: AdminTheme.error.withOpacity(0.3)),
        ),
        child: Text(
          'Rupture',
          style: TextStyle(
            fontSize: MaasgaTokens.fontSizeSmall,
            color: AdminTheme.error,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    } else if (produit.stock <= 3) {
      return Container(
        padding: const EdgeInsets.symmetric(
          horizontal: MaasgaTokens.spacingSm,
          vertical: 2,
        ),
        decoration: BoxDecoration(
          color: AdminTheme.warning.withOpacity(0.2),
          borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
          border: Border.all(color: AdminTheme.warning.withOpacity(0.3)),
        ),
        child: Text(
          'Stock: ${produit.stock}',
          style: TextStyle(
            fontSize: MaasgaTokens.fontSizeSmall,
            color: AdminTheme.warning,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(
          horizontal: MaasgaTokens.spacingSm,
          vertical: 2,
        ),
        decoration: BoxDecoration(
          color: AdminTheme.success.withOpacity(0.2),
          borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
          border: Border.all(color: AdminTheme.success.withOpacity(0.3)),
        ),
        child: Text(
          'Stock: ${produit.stock}',
          style: TextStyle(
            fontSize: MaasgaTokens.fontSizeSmall,
            color: AdminTheme.success,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }
  }
  
  void _showActions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Modifier'),
              onTap: () {
                Navigator.pop(context);
                onEdit?.call();
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: AdminTheme.error),
              title: const Text('Supprimer', style: TextStyle(color: AdminTheme.error)),
              onTap: () {
                Navigator.pop(context);
                _showDeleteConfirm(context);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _showDeleteConfirm(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer le produit'),
        content: Text('Voulez-vous vraiment supprimer "${produit.name}" ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              onDelete?.call();
            },
            style: TextButton.styleFrom(foregroundColor: AdminTheme.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 4: Créer filters_bottom_sheet.dart**

```dart
import 'package:flutter/material.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class FiltersBottomSheet extends StatefulWidget {
  final String? selectedCategory;
  final String? selectedBrand;
  final bool? selectedAvailability;
  final Function(String? category, String? brand, bool? availability) onApply;
  
  const FiltersBottomSheet({
    super.key,
    this.selectedCategory,
    this.selectedBrand,
    this.selectedAvailability,
    required this.onApply,
  });
  
  @override
  State<FiltersBottomSheet> createState() => _FiltersBottomSheetState();
}

class _FiltersBottomSheetState extends State<FiltersBottomSheet> {
  String? _category;
  String? _brand;
  bool? _availability;
  
  final List<String> _categories = [
    'Climatiseur Split',
    'Climatiseur Mobile',
    'Climatiseur Cassette',
    'Climatiseur Gainable',
  ];
  
  final List<String> _brands = [
    'LG',
    'Samsung',
    'Daikin',
    'Midea',
    'Panasonic',
    'Gree',
    'Hisense',
    'TCL',
  ];
  
  @override
  void initState() {
    super.initState();
    _category = widget.selectedCategory;
    _brand = widget.selectedBrand;
    _availability = widget.selectedAvailability;
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: AdminTheme.border.withOpacity(0.3)),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () {
                    setState(() {
                      _category = null;
                      _brand = null;
                      _availability = null;
                    });
                  },
                  child: const Text('Réinitialiser'),
                ),
                const Text(
                  'Filtres',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: MaasgaTokens.fontSizeTitle,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    widget.onApply(_category, _brand, _availability);
                    Navigator.pop(context);
                  },
                  child: const Text('Appliquer'),
                ),
              ],
            ),
          ),
          
          // Content
          SingleChildScrollView(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category
                const Text(
                  'Catégorie',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: MaasgaTokens.fontSizeBody,
                  ),
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                Wrap(
                  spacing: MaasgaTokens.spacingSm,
                  runSpacing: MaasgaTokens.spacingSm,
                  children: _categories.map((cat) {
                    final isSelected = _category == cat;
                    return FilterChip(
                      label: Text(cat),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          _category = selected ? cat : null;
                        });
                      },
                      selectedColor: AdminTheme.accent.withOpacity(0.3),
                      checkmarkColor: AdminTheme.accent,
                    );
                  }).toList(),
                ),
                
                const SizedBox(height: MaasgaTokens.spacingLg),
                
                // Brand
                const Text(
                  'Marque',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: MaasgaTokens.fontSizeBody,
                  ),
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                Wrap(
                  spacing: MaasgaTokens.spacingSm,
                  runSpacing: MaasgaTokens.spacingSm,
                  children: _brands.map((brand) {
                    final isSelected = _brand == brand;
                    return FilterChip(
                      label: Text(brand),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          _brand = selected ? brand : null;
                        });
                      },
                      selectedColor: AdminTheme.accent.withOpacity(0.3),
                      checkmarkColor: AdminTheme.accent,
                    );
                  }).toList(),
                ),
                
                const SizedBox(height: MaasgaTokens.spacingLg),
                
                // Availability
                const Text(
                  'Disponibilité',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: MaasgaTokens.fontSizeBody,
                  ),
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                Row(
                  children: [
                    Expanded(
                      child: FilterChip(
                        label: const Text('Disponible'),
                        selected: _availability == true,
                        onSelected: (selected) {
                          setState(() {
                            _availability = selected ? true : null;
                          });
                        },
                        selectedColor: AdminTheme.success.withOpacity(0.3),
                        checkmarkColor: AdminTheme.success,
                      ),
                    ),
                    const SizedBox(width: MaasgaTokens.spacingSm),
                    Expanded(
                      child: FilterChip(
                        label: const Text('Indisponible'),
                        selected: _availability == false,
                        onSelected: (selected) {
                          setState(() {
                            _availability = selected ? false : null;
                          });
                        },
                        selectedColor: AdminTheme.error.withOpacity(0.3),
                        checkmarkColor: AdminTheme.error,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

- [ ] **Step 5: Créer produits_screen.dart**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/produits_repository.dart';
import '../data/models/produit.dart';
import '../widgets/produit_card.dart';
import '../widgets/filters_bottom_sheet.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class ProduitsScreen extends ConsumerStatefulWidget {
  const ProduitsScreen({super.key});
  
  @override
  ConsumerState<ProduitsScreen> createState() => _ProduitsScreenState();
}

class _ProduitsScreenState extends ConsumerState<ProduitsScreen> {
  List<Produit> _produits = [];
  bool _isLoading = true;
  String? _selectedCategory;
  String? _selectedBrand;
  bool? _selectedAvailability;
  String _searchQuery = '';
  
  @override
  void initState() {
    super.initState();
    _loadProduits();
  }
  
  Future<void> _loadProduits() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final repository = ProduitsRepository(ref.read(dioProvider).dio);
      final produits = await repository.getProduits(
        category: _selectedCategory,
        brand: _selectedBrand,
        available: _selectedAvailability,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
      );
      
      if (mounted) {
        setState(() {
          _produits = produits;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }
  
  void _showFilters() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => FiltersBottomSheet(
        selectedCategory: _selectedCategory,
        selectedBrand: _selectedBrand,
        selectedAvailability: _selectedAvailability,
        onApply: (category, brand, availability) {
          setState(() {
            _selectedCategory = category;
            _selectedBrand = brand;
            _selectedAvailability = availability;
          });
          _loadProduits();
        },
      ),
    );
  }
  
  void _showAddProduitDialog() {
    // TODO: Implémenter dialog ajout produit
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Ajout produit à implémenter')),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _produits.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.inventory_2_outlined,
                        size: 64,
                        color: AdminTheme.textMuted,
                      ),
                      const SizedBox(height: MaasgaTokens.spacingMd),
                      Text(
                        'Aucun produit trouvé',
                        style: TextStyle(
                          color: AdminTheme.textMuted,
                          fontSize: MaasgaTokens.fontSizeBody,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                  itemCount: _produits.length,
                  itemBuilder: (context, index) {
                    return ProduitCard(
                      produit: _produits[index],
                      onTap: () {
                        // TODO: Naviguer vers détail produit
                      },
                      onEdit: () {
                        // TODO: Implémenter édition
                      },
                      onDelete: () async {
                        try {
                          final repository = ProduitsRepository(ref.read(dioProvider).dio);
                          await repository.deleteProduit(_produits[index].id);
                          _loadProduits();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Produit supprimé')),
                          );
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Erreur: $e')),
                          );
                        }
                      },
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddProduitDialog,
        backgroundColor: AdminTheme.accent,
        child: const Icon(Icons.add),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    // Override pour ajouter app bar personnalisé
    return Scaffold(
      appBar: AppBar(
        title: const Text('Produits & Stock'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilters,
            tooltip: 'Filtres',
          ),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              showSearch(
                context: context,
                delegate: _ProduitSearchDelegate(
                  onSearch: (query) {
                    setState(() {
                      _searchQuery = query;
                    });
                    _loadProduits();
                  },
                ),
              );
            },
            tooltip: 'Rechercher',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }
  
  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (_produits.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.inventory_2_outlined,
              size: 64,
              color: AdminTheme.textMuted,
            ),
            const SizedBox(height: MaasgaTokens.spacingMd),
            Text(
              'Aucun produit trouvé',
              style: TextStyle(
                color: AdminTheme.textMuted,
                fontSize: MaasgaTokens.fontSizeBody,
              ),
            ),
          ],
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      itemCount: _produits.length,
      itemBuilder: (context, index) {
        return ProduitCard(
          produit: _produits[index],
          onTap: () {
            // TODO: Naviguer vers détail produit
          },
          onEdit: () {
            // TODO: Implémenter édition
          },
          onDelete: () async {
            try {
              final repository = ProduitsRepository(ref.read(dioProvider).dio);
              await repository.deleteProduit(_produits[index].id);
              _loadProduits();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Produit supprimé')),
              );
            } catch (e) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Erreur: $e')),
              );
            }
          },
        );
      },
    );
  }
}

class _ProduitSearchDelegate extends SearchDelegate<String> {
  final Function(String) onSearch;
  
  _ProduitSearchDelegate({required this.onSearch});
  
  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      IconButton(
        icon: const Icon(Icons.clear),
        onPressed: () {
          query = '';
          onSearch('');
        },
      ),
    ];
  }
  
  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () {
        close(context, '');
      },
    );
  }
  
  @override
  Widget buildResults(BuildContext context) {
    onSearch(query);
    close(context, '');
    return const SizedBox.shrink();
  }
  
  @override
  Widget buildSuggestions(BuildContext context) {
    return const SizedBox.shrink();
  }
}
```

- [ ] **Step 6: Créer produits_provider.dart**

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/produits_repository.dart';

final produitsRepositoryProvider = Provider<ProduitsRepository>((ref) {
  return ProduitsRepository(ref.watch(dioProvider).dio);
});
```

- [ ] **Step 7: Ajouter route produits dans router**

```dart
GoRoute(
  path: '/produits',
  pageBuilder: (context, state) => MaterialPage(
    key: state.pageKey,
    child: AdminShell(
      title: 'Produits & Stock',
      child: const ProduitsScreen(),
    ),
  ),
),
```

- [ ] **Step 8: Vérifier compilation**

```bash
cd mobile_admin
flutter analyze
```

Expected: No issues found

- [ ] **Step 9: Commit**

```bash
git add mobile_admin/lib/features/produits/
git commit -m "feat: implémenter liste produits avec filtres et recherche"
```

---

**Note:** Le plan continue ainsi pour toutes les 16 sections. Pour des raisons de longueur, j'ai détaillé les 8 premières tâches (Phase 1 et 2 complètes, début de Phase 3). Le reste suit le même pattern avec des tâches similaires pour les autres sections.

Le plan complet couvrirait environ 80-100 tâches au total pour les 15 semaines estimées. Chaque section suit le pattern :
1. Repository avec API calls
2. Models typés
3. Screen principal
4. Widgets réutilisables
5. Providers Riverpod
6. Route dans router
7. Tests

Voulez-vous que je continue avec le reste du plan ou préférez-vous commencer l'implémentation avec ces premières tâches ?
