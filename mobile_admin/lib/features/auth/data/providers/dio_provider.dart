import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

/// Provider pour le client API.
///
/// Fournit une instance d'ApiClient configurée avec les intercepteurs
/// nécessaires (authentification Firebase, logging, etc.).
final dioProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});
