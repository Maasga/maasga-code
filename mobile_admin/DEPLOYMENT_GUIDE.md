# Guide de Déploiement - Application Admin Mobile MaasGa

## Prérequis

### Outils nécessaires
- **Flutter SDK** (version 3.41.7 ou supérieure)
- **Android Studio** avec SDK Android 33+
- **Git** pour le contrôle de version
- **Firebase Console** pour la configuration
- **Cloudflare Dashboard** pour le backend

### Environnement de développement
```bash
# Vérifier Flutter
flutter --version
flutter doctor

# Vérifier Android
flutter devices
```

## Configuration du Projet

### 1. Configuration Firebase

1. **Créer un projet Firebase**
   - Allez sur [Firebase Console](https://console.firebase.google.com/)
   - Créez un nouveau projet "MaasGa Admin"
   - Activez **Firebase Authentication**
   - Activez **Firebase Cloud Messaging (FCM)**

2. **Configuration Android**
   ```bash
   # Télécharger google-services.json depuis Firebase Console
   # Placer dans android/app/
   ```

3. **Configuration iOS** (si applicable)
   ```bash
   # Télécharger GoogleService-Info.plist depuis Firebase Console
   # Placer dans ios/Runner/
   ```

### 2. Configuration API Backend

L'API backend est hébergée sur Cloudflare Pages. Modifiez les endpoints dans:

**Fichier:** `lib/core/network/api_endpoints.dart`

```dart
class ApiEndpoints {
  // En production
  static const String baseUrl = 'https://maasga-website.pages.dev';

  // En développement (optionnel)
  // static const String baseUrl = 'http://localhost:3000';
}
```

### 3. Configuration des variables d'environnement

**Fichier:** `android/app/build.gradle`

```gradle
android {
    defaultConfig {
        // Votre clé Firebase
        resValue "string", "default_notification_channel_id", "maasga_admin_channel"
    }
}
```

## Build de Production

### 1. Nettoyage et préparation

```bash
cd mobile_admin

# Nettoyer le projet
flutter clean

# Obtenir les dépendances
flutter pub get

# Générer les fichiers Riverpod (si nécessaire)
flutter pub run build_runner build --delete-conflicting-outputs
```

### 2. Build APK

```bash
# Build APK release
flutter build apk --release

# Le fichier APK sera généré dans:
# build/app/outputs/flutter-apk/app-release.apk
```

### 3. Build App Bundle (pour Play Store)

```bash
# Build App Bundle
flutter build appbundle --release

# Le fichier AAB sera généré dans:
# build/app/outputs/bundle/release/app-release.aab
```

### 4. Signature de l'APK

**Fichier:** `android/app/build.gradle`

```gradle
android {
    signingConfigs {
        release {
            storeFile file("path/to/your/keystore.jks")
            storePassword "your_keystore_password"
            keyAlias "your_key_alias"
            keyPassword "your_key_password"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Déploiement sur Google Play Store

### 1. Créer un compte Google Play Console

- Créez un compte développeur Google Play (25$ frais uniques)
- Créez une nouvelle application "MaasGa Admin"

### 2. Préparer les assets

**Screenshot requis:**
- Au moins 2 captures d'écran
- Formats: téléphone (16:9 ou 9:16), tablette (16:10)
- Taille: min 320px, max 3840px

**Icône de l'application:**
- 512x512px PNG
- Format: icône circulaire ou adaptative

**Feature graphic:**
- 1024x500px PNG
- Pour la page de listing Play Store

### 3. Upload de l'App Bundle

```bash
# Upload via Google Play Console
# ou utiliser la CLI:
flutter pub global activate flutter_publish
flutter pub global run flutter_publish publish
```

### 4. Remplir les informations de l'application

- **Nom:** MaasGa Admin
- **Description:** Application d'administration pour la gestion des services MaasGa
- **Catégorie:** Business
- **Contenu:** Administration d'entreprise

### 5. Configurer le contenu sensible

- L'application n'a pas de contenu sensible
- Pas de permissions dangereuses requises

### 6. Soumission pour revue

- Soumettre pour revue
- Délai de revue: 1-3 jours ouvrables

## Déploiement Alternatif (Distribution Directe)

### 1. Distribution via Firebase App Distribution

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Upload de l'APK
firebase appdistribution:distribute build/app/outputs/flutter-apk/app-release.apk \
  --app <firebase-app-id> \
  --groups "testers"
```

### 2. Distribution via Email

Envoyer l'APK signé directement aux utilisateurs:

```bash
# L'APK se trouve dans:
# build/app/outputs/flutter-apk/app-release.apk

# Partager via:
# - Email (Gmail, Outlook)
# - Google Drive
# - Dropbox
# - OneDrive
```

## Test avant déploiement

### 1. Tests manuels

- [ ] Authentification Firebase fonctionne
- [ ] Tous les écrans sont accessibles
- [ ] Les appels API fonctionnent
- [ ] Les notifications push sont reçues
- [ ] L'application ne crash pas
- [ ] La navigation fonctionne correctement

### 2. Tests automatisés

```bash
# Exécuter les tests unitaires
flutter test

# Exécuter les tests d'intégration
flutter test integration_test/

# Vérifier la qualité du code
flutter analyze
```

## Monitoring et Maintenance

### 1. Firebase Crashlytics

```dart
// Ajouter dans lib/main.dart
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Configurer Crashlytics
  FlutterError.onError = (errorDetails) {
    FirebaseCrashlytics.instance.recordError(
      errorDetails.exception,
      errorDetails.stack,
    );
  };

  runApp(ProviderScope(child: MyApp()));
}
```

### 2. Firebase Analytics

```dart
// Suivre les événements
FirebaseAnalytics.instance.logEvent(
  name: 'screen_view',
  parameters: {
    'screen_name': 'dashboard',
  },
);
```

### 3. Performance Monitoring

```dart
// Suivre les performances
FirebasePerformance.instance.startTrace('api_call');
```

## Mises à jour

### 1. Processus de mise à jour

1. Incrémenter le numéro de version dans `pubspec.yaml`
2. Build le nouvel APK/App Bundle
3. Tester la nouvelle version
4. Soumettre à Google Play Store
5. Attendre l'approbation
6. Déployer

### 2. Versioning

**Format:** `major.minor.patch`

- **major:** Changements majeurs, breaking changes
- **minor:** Nouvelles fonctionnalités
- **patch:** Corrections de bugs

**Exemple:**
```yaml
version: 1.0.0  # Version initiale
version: 1.1.0  # Nouvelle fonctionnalité
version: 1.1.1  # Correction de bug
version: 2.0.0  # Mise à jour majeure
```

## Sécurité

### 1. Protection des données

- Utiliser HTTPS pour toutes les communications API
- Ne pas stocker de secrets dans le code
- Utiliser les keystore Android pour les clés sensibles
- Activer la sécurité Firebase (Règles d'authentification)

### 2. Obfuscation

Le code est déjà obfusqué en mode release. Pour une obfuscation plus avancée:

**Fichier:** `android/app/proguard-rules.pro`

```proguard
-keep class com.maasga.** { *; }
-dontwarn com.maasga.**
```

## Support

### En cas de problème

1. **Logs Android:**
   ```bash
   adb logcat
   ```

2. **Logs Flutter:**
   ```bash
   flutter logs
   ```

3. **Documentation:**
   - [Flutter Documentation](https://flutter.dev/docs)
   - [Firebase Documentation](https://firebase.google.com/docs)
   - [Google Play Console Help](https://support.google.com/googleplay/android-developer)

## Checklist de déploiement

- [ ] Firebase configuré
- [ ] API backend testé
- [ ] Tests unitaires passés
- [ ] Tests manuels effectués
- [ ] APK/App Bundle buildé
- [ ] APK signé
- [ ] Screenshots préparés
- [ ] Icône de l'application créée
- [ ] Description rédigée
- [ ] Politique de confidentialité créée
- [ ] Soumis à Google Play Store
- [ ] Crashlytics configuré
- [ ] Analytics configuré
- [ ] Monitoring en place

## Contact

Pour toute question ou problème de déploiement, contactez l'équipe de développement MaasGa.
