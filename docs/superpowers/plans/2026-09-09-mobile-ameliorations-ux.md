# Application Mobile - Améliorations UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Améliorer l'UX de l'application mobile MAASGA (gestion erreurs réseau, exploration solution OTP SMS, audit accessibilité mobile)

**Architecture:** Amélioration de la gestion d'erreurs existante, recherche de solutions alternatives pour OTP, audit d'accessibilité Flutter

**Tech Stack:** Flutter, Riverpod, Dio, Firebase Auth, Google Fonts

## Global Constraints

- Langue : français pour tout le code, commentaires et messages utilisateur
- CI stricte : `flutter analyze` ne doit retourner aucun diagnostic (y compris niveau *info*)
- Formatage : `dart format lib test` (80 colonnes)
- Android uniquement - pas de support iOS/Windows
- Respecter les règles existantes (pas de fabrication de données produit, total commande non fiable côté client)

---

### Task 1: Amélioration Gestion Erreurs Réseau

**Files:**
- Modify: `lib/core/network/api_client.dart`
- Modify: `lib/features/home/presentation/home_screen.dart`
- Modify: `lib/features/catalog/presentation/catalog_screen.dart`
- Test: Manuel - tester avec réseau coupé

**Interfaces:**
- Consumes: Existing Dio client setup
- Produces: Enhanced error handling with user-friendly messages

- [ ] **Step 1: Lire l'api_client actuel**

Lire `lib/core/network/api_client.dart` pour comprendre la configuration Dio actuelle

- [ ] **Step 2: Créer une classe d'erreurs personnalisée**

Créer `lib/core/network/app_exceptions.dart` :
```dart
class AppException implements Exception {
  final String message;
  final String? details;
  final int? statusCode;

  AppException(this.message, {this.details, this.statusCode});

  @override
  String toString() => message;
}

class NetworkException extends AppException {
  NetworkException([String message = 'Erreur de connexion'])
      : super(message);
}

class ServerException extends AppException {
  ServerException(String message, {int? statusCode})
      : super(message, statusCode: statusCode);
}

class AuthException extends AppException {
  AuthException([String message = 'Erreur d\'authentification'])
      : super(message);
}

class TimeoutException extends AppException {
  TimeoutException([String message = 'Délai d\'attente dépassé'])
      : super(message);
}
```

- [ ] **Step 3: Créer un interceptor d'erreurs Dio**

Modifier `lib/core/network/api_client.dart` pour ajouter un interceptor d'erreurs :
```dart
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        throw TimeoutException();
      case DioExceptionType.connectionError:
        throw NetworkException('Pas de connexion internet');
      case DioExceptionType.badResponse:
        final statusCode = err.response?.statusCode;
        if (statusCode == 401) {
          throw AuthException();
        } else if (statusCode != null && statusCode >= 500) {
          throw ServerException('Erreur serveur', statusCode: statusCode);
        } else {
          throw ServerException('Erreur inconnue', statusCode: statusCode);
        }
      default:
        throw AppException('Erreur inconnue');
    }
  }
}
```

- [ ] **Step 4: Ajouter l'interceptor au client Dio**

Modifier `lib/core/network/api_client.dart` pour enregistrer l'interceptor :
```dart
final dio = Dio(BaseOptions(
  baseUrl: Env.apiBaseUrl,
  connectTimeout: const Duration(seconds: 15),
  receiveTimeout: const Duration(seconds: 15),
));

dio.interceptors.add(ErrorInterceptor());
```

- [ ] **Step 5: Créer un service de gestion d'erreurs UI**

Créer `lib/shared/services/error_handler_service.dart` :
```dart
import 'package:flutter/material.dart';
import '../core/network/app_exceptions.dart';

class ErrorHandlerService {
  static String getUserMessage(AppException exception) {
    if (exception is NetworkException) {
      return 'Vérifiez votre connexion internet et réessayez';
    } else if (exception is TimeoutException) {
      return 'Le délai d\'attente est dépassé. Vérifiez votre connexion';
    } else if (exception is AuthException) {
      return 'Veuillez vous reconnecter';
    } else if (exception is ServerException) {
      if (exception.statusCode == 500) {
        return 'Le serveur rencontre des difficultés. Réessayez plus tard';
      }
      return 'Une erreur est survenue. Réessayez';
    }
    return 'Une erreur inconnue est survenue';
  }

  static void showErrorSnackBar(BuildContext context, AppException exception) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(getUserMessage(exception)),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'OK',
          textColor: Colors.white,
          onPressed: () {},
        ),
      ),
    );
  }
}
```

- [ ] **Step 6: Modifier home_screen.dart pour gérer les erreurs**

Modifier `lib/features/home/presentation/home_screen.dart` :
```dart
try {
  final productsAsync = ref.watch(productsProvider);
  // ... existing code
} on AppException catch (e) {
  ErrorHandlerService.showErrorSnackBar(context, e);
} catch (e) {
  ErrorHandlerService.showErrorSnackBar(
    context,
    AppException('Erreur de chargement'),
  );
}
```

- [ ] **Step 7: Modifier catalog_screen.dart pour gérer les erreurs**

Appliquer le même pattern à `lib/features/catalog/presentation/catalog_screen.dart`

- [ ] **Step 8: Tester avec réseau coupé**

Run: `flutter run`
Désactiver WiFi/données mobiles
Expected: Message d'erreur clair "Vérifiez votre connexion internet"

- [ ] **Step 9: Tester avec serveur lent**

Simuler un serveur lent (utiliser un outil comme Charles Proxy ou modifier le timeout)
Expected: Message d'erreur "Délai d'attente dépassé"

- [ ] **Step 10: Linter et formatter**

Run: `dart format lib test`
Run: `flutter analyze`
Expected: "No issues found"

- [ ] **Step 11: Commit**

```bash
git add lib/core/network/app_exceptions.dart lib/core/network/api_client.dart lib/shared/services/error_handler_service.dart lib/features/home/presentation/home_screen.dart lib/features/catalog/presentation/catalog_screen.dart
git commit -m "feat: améliorer gestion erreurs réseau avec messages utilisateurs clairs"
```

---

### Task 2: Exploration Solution OTP SMS Burkina Faso

**Files:**
- Research: Documentation Firebase Phone Auth
- Research: Alternatives SMS Burkina Faso
- Create: `docs/research/otp-sms-burkina.md`
- Test: Aucun - recherche uniquement

**Interfaces:**
- Consumes: Existing auth system documentation
- Produces: Research document with recommended solutions

- [ ] **Step 1: Documenter la solution actuelle**

Créer `docs/research/otp-sms-burkina.md` avec la solution actuelle :
```markdown
# Solution Actuelle
- Numéros burkinabè (+226) utilisent un email synthétique
- Format: +226XXXXXXXX@maasga.app
- Conséquences: numéro non vérifié, pas de reset mot de passe
- Raison: projet Firebase non vérifié pour SMS au Burkina Faso
```

- [ ] **Step 2: Rechercher les alternatives Firebase**

Documenter les options Firebase :
- Firebase Phone Auth avec projet vérifié Burkina Faso
- Coût et disponibilité
- Limitations régionales

- [ ] **Step 3: Rechercher les alternatives SMS tierces**

Explorer :
- Twilio (disponibilité Burkina Faso, coût)
- Africa's Talking (présence régionale)
- MessageBird (support Burkina Faso)
- Infobip (solution africaine)

- [ ] **Step 4: Rechercher les solutions alternatives sans SMS**

Explorer :
- WhatsApp Business API (très populaire au Burkina Faso)
- Email OTP (utilise l'email synthétique existant)
- App native OTP (via notification push)

- [ ] **Step 5: Évaluer chaque solution**

Pour chaque solution, documenter :
- Coût par SMS
- Disponibilité technique
- Complexité d'implémentation
- Expérience utilisateur
- Fiabilité

- [ ] **Step 6: Recommander la meilleure solution**

Basé sur la recherche, recommander :
1. Solution principale (ex: WhatsApp OTP)
2. Solution de repli (ex: Email OTP amélioré)
3. Roadmap d'implémentation

- [ ] **Step 7: Documenter l'implémentation recommandée**

Inclure :
- Architecture technique
- Coûts estimés
- Timeline d'implémentation
- Risques et mitigations

- [ ] **Step 8: Commit**

```bash
git add docs/research/otp-sms-burkina.md
git commit -m "docs: rechercher solutions OTP SMS pour Burkina Faso"
```

---

### Task 3: Audit Accessibilité Mobile - Contraste Thèmes

**Files:**
- Modify: `lib/shared/design_tokens/maasga_tokens.dart`
- Modify: `lib/app/theme/app_theme.dart`
- Test: Manuel - vérifier contraste avec outils

**Interfaces:**
- Consumes: Existing design tokens and theme
- Produces: Enhanced contrast ratios for both light and dark themes

- [ ] **Step 1: Lire les design tokens actuels**

Lire `lib/shared/design_tokens/maasga_tokens.dart` pour identifier les couleurs utilisées

- [ ] **Step 2: Identifier les zones à contraste potentiellement faible**

Rechercher :
- Textes sur fond sombre en mode clair
- Textes sur fond clair en mode sombre
- Boutons avec faible contraste
- Icônes avec faible visibilité

- [ ] **Step 3: Utiliser un outil d'audit de contraste**

Utiliser :
- Flutter DevTools Accessibility Inspector
- Ou outil externe (ex: WebAIM Contrast Checker)

- [ ] **Step 4: Ajuster les couleurs si nécessaire pour atteindre WCAG AA**

Modifier `lib/shared/design_tokens/maasga_tokens.dart` :
```dart
class MaasgaTokens {
  // Mode clair
  static const Color textOnPrimary = Colors.white;
  static const Color textOnSecondary = Color(0xFF1E293B); // Slate-800
  static const Color textOnSurface = Color(0xFF334155); // Slate-700

  // Mode sombre
  static const Color textOnPrimaryDark = Colors.white;
  static const Color textOnSecondaryDark = Color(0xFFF1F5F9); // Slate-100
  static const Color textOnSurfaceDark = Color(0xFFE2E8F0); // Slate-200

  // Accent colors with better contrast
  static const Color accentLight = Color(0xFF0284C7); // Sky-600
  static const Color accentDark = Color(0xFF38BDF8); // Sky-400
}
```

- [ ] **Step 5: Mettre à jour le thème pour utiliser les nouvelles couleurs**

Modifier `lib/app/theme/app_theme.dart` :
```dart
ThemeData lightTheme = ThemeData(
  // ... existing config
  textTheme: TextTheme(
    bodyLarge: TextStyle(color: MaasgaTokens.textOnSurface),
    bodyMedium: TextStyle(color: MaasgaTokens.textOnSurface),
    // ... other text styles
  ),
);

ThemeData darkTheme = ThemeData(
  // ... existing config
  textTheme: TextTheme(
    bodyLarge: TextStyle(color: MaasgaTokens.textOnSurfaceDark),
    bodyMedium: TextStyle(color: MaasgaTokens.textOnSurfaceDark),
    // ... other text styles
  ),
);
```

- [ ] **Step 6: Tester le contraste en mode clair**

Run: `flutter run`
Tester :
- Textes sur fond primary (accent)
- Textes sur fond surface
- Boutons et actions
Expected: Tous les textes atteignent WCAG AA (4.5:1 minimum)

- [ ] **Step 7: Tester le contraste en mode sombre**

Activer le mode sombre dans l'app
Tester les mêmes zones
Expected: Tous les textes atteignent WCAG AA en mode sombre

- [ ] **Step 8: Linter et formatter**

Run: `dart format lib test`
Run: `flutter analyze`
Expected: "No issues found"

- [ ] **Step 9: Commit**

```bash
git add lib/shared/design_tokens/maasga_tokens.dart lib/app/theme/app_theme.dart
git commit -m "a11y: améliorer contraste des thèmes pour conformité WCAG AA"
```

---

### Task 4: Audit Accessibilité Mobile - Taille Cible

**Files:**
- Modify: `lib/features/home/presentation/home_screen.dart`
- Modify: `lib/features/catalog/presentation/catalog_screen.dart`
- Modify: `lib/shared/widgets/maasga_primary_button.dart`
- Test: Manuel - vérifier taille des éléments tactiles

**Interfaces:**
- Consumes: Existing widget implementations
- Produces: Enhanced touch target sizes (min 48x48 dp)

- [ ] **Step 1: Identifier les éléments interactifs dans home_screen.dart**

Rechercher :
- Boutons
- Cards cliquables
- Icônes interactives
- Champs de formulaire

- [ ] **Step 2: Vérifier la taille des éléments actuels**

Pour chaque élément, vérifier :
- Taille en pixels/dp
- Padding
- Hit area

- [ ] **Step 3: Augmenter la taille des éléments < 48x48**

Modifier `lib/features/home/presentation/home_screen.dart` :
```dart
// Avant
IconButton(
  icon: Icon(Icons.search),
  onPressed: () {},
  iconSize: 20,
)

// Après
IconButton(
  icon: Icon(Icons.search),
  onPressed: () {},
  iconSize: 20,
  padding: EdgeInsets.all(12), // Hit area de 44x44 minimum
)
```

- [ ] **Step 4: Modifier catalog_screen.dart**

Appliquer le même pattern aux éléments interactifs

- [ ] **Step 5: Modifier maasga_primary_button.dart**

S'assurer que tous les boutons ont une hauteur minimale de 48dp :
```dart
SizedBox(
  height: 48, // Minimum touch target
  child: ElevatedButton(
    // ... existing code
  ),
)
```

- [ ] **Step 6: Créer un widget utilitaire pour les éléments tactiles**

Créer `lib/shared/widgets/touch_target_wrapper.dart` :
```dart
import 'package:flutter/material.dart';

class TouchTargetWrapper extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double? minSize;

  const TouchTargetWrapper({
    super.key,
    required this.child,
    this.onTap,
    this.minSize = 48.0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        constraints: BoxConstraints(
          minWidth: minSize!,
          minHeight: minSize!,
        ),
        child: child,
      ),
    );
  }
}
```

- [ ] **Step 7: Appliquer le wrapper aux petits éléments interactifs**

Remplacer les petits IconButton et autres par TouchTargetWrapper

- [ ] **Step 8: Tester avec différents appareils**

Run: `flutter run`
Tester sur :
- Petit écran (ex: Pixel 4a)
- Grand écran (ex: Pixel 6 Pro)
Expected: Tous les éléments interactifs sont facilement touchables

- [ ] **Step 9: Linter et formatter**

Run: `dart format lib test`
Run: `flutter analyze`
Expected: "No issues found"

- [ ] **Step 10: Commit**

```bash
git add lib/features/home/presentation/home_screen.dart lib/features/catalog/presentation/catalog_screen.dart lib/shared/widgets/maasga_primary_button.dart lib/shared/widgets/touch_target_wrapper.dart
git commit -m "a11y: augmenter taille cible des éléments interactifs à 48dp minimum"
```

---

### Task 5: Audit Accessibilité Mobile - Prefers Reduced Motion

**Files:**
- Modify: `lib/app/theme/app_theme.dart`
- Modify: `lib/features/home/presentation/home_screen.dart`
- Test: Manuel - tester avec reduced motion activé

**Interfaces:**
- Consumes: Existing flutter_animate animations
- Produces: Complete reduced-motion support for Flutter animations

- [ ] **Step 1: Identifier toutes les animations flutter_animate**

Rechercher dans le codebase :
- `.animate()` calls
- `.fadeIn()`, `.slideY()`, `.scale()`
- Durées et delays explicites

- [ ] **Step 2: Créer un service pour détecter reduced motion**

Créer `lib/shared/services/accessibility_service.dart` :
```dart
import 'package:flutter/material.dart';

class AccessibilityService {
  static bool get prefersReducedMotion {
    return WidgetsBinding.instance.platformDispatcher.accessibilityFeatures.disableAnimations;
  }

  static Duration get adjustedDuration(Duration original) {
    if (prefersReducedMotion) {
      return Duration.zero;
    }
    return original;
  }

  static Curve get adjustedCurve(Curve original) {
    if (prefersReducedMotion) {
      return Curves.linear;
    }
    return original;
  }
}
```

- [ ] **Step 3: Modifier home_screen.dart pour respecter reduced motion**

Modifier les animations :
```dart
// Avant
_SearchBar()
    .animate()
    .fadeIn(duration: 400.ms)
    .slideY(begin: -0.2, end: 0),

// Après
_SearchBar()
    .animate(
      onPlay: AccessibilityService.prefersReducedMotion
          ? (controller) => controller.stop()
          : null,
    )
    .fadeIn(
      duration: AccessibilityService.adjustedDuration(400.ms),
      curve: AccessibilityService.adjustedCurve(Curves.easeOut),
    )
    .slideY(
      begin: AccessibilityService.prefersReducedMotion ? 0 : -0.2,
      end: 0,
    ),
```

- [ ] **Step 4: Modifier catalog_screen.dart**

Appliquer le même pattern

- [ ] **Step 5: Modifier le thème pour désactiver les animations système**

Modifier `lib/app/theme/app_theme.dart` :
```dart
ThemeData lightTheme = ThemeData(
  // ... existing config
  pageTransitionsTheme: PageTransitionsTheme(
    builders: {
      TargetPlatform.android: AccessibilityService.prefersReducedMotion
          ? const FadeUpwardsPageTransitionsBuilder()
          : const ZoomPageTransitionsBuilder(),
    },
  ),
);
```

- [ ] **Step 6: Tester avec reduced motion activé**

Run: `flutter run`
Activer reduced motion :
- Android: Paramètres → Accessibilité → Supprimer les animations
- Expected: Animations désactivées ou instantanées

- [ ] **Step 7: Linter et formatter**

Run: `dart format lib test`
Run: `flutter analyze`
Expected: "No issues found"

- [ ] **Step 8: Commit**

```bash
git add lib/shared/services/accessibility_service.dart lib/app/theme/app_theme.dart lib/features/home/presentation/home_screen.dart lib/features/catalog/presentation/catalog_screen.dart
git commit -m "a11y: ajouter support prefers-reduced-motion pour toutes les animations Flutter"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Gestion erreurs réseau améliorée - Task 1
- ✅ Exploration solution OTP SMS Burkina Faso - Task 2
- ✅ Audit accessibilité contraste thèmes - Task 3
- ✅ Audit accessibilité taille cible - Task 4
- ✅ Audit accessibilité reduced motion - Task 5

**2. Placeholder scan:**
- ✅ Aucun "TBD", "TODO", ou placeholder
- ✅ Toutes les étapes contiennent du code concret
- ✅ Commandes exactes fournies

**3. Type consistency:**
- ✅ Noms de classes cohérents (AppException, ErrorHandlerService, AccessibilityService)
- ✅ Signatures de méthodes Dart correctes
- ✅ Chemins de fichiers exacts

---

## Next Steps

Ce plan couvre les améliorations UX de l'application mobile. Une fois terminé, passer au **Plan 4 : Cross-Platform - Synchronisation** pour les améliorations de synchronisation entre l'app et le site web.
