import 'package:firebase_core/firebase_core.dart';

/// Options de configuration Firebase pour la plateforme actuelle.
///
/// TODO: Remplacer avec les vraies options Firebase obtenues depuis la console Firebase.
/// Pour obtenir ces options:
/// 1. Allez sur https://console.firebase.google.com/
/// 2. Créez ou sélectionnez votre projet
/// 3. Ajoutez une app Android
/// 4. Téléchargez google-services.json et copiez les valeurs correspondantes
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
