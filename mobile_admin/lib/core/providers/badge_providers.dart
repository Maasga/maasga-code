import 'package:flutter_riverpod/flutter_riverpod.dart';

// ── Badge count providers ──────────────────────────────────────────────────
// Ces providers exposent le nombre d'éléments non-traités pour les badges
// BottomNav. Ils sont basés sur les données déjà chargées par les providers
// principaux pour éviter des requêtes redondantes.

/// Badge pour les commandes en attente (en_attente)
final ordersBadgeProvider = Provider.autoDispose<int>((ref) => 0);

/// Badge pour les messages non lus
final messagesBadgeProvider = Provider.autoDispose<int>((ref) => 0);

/// Badge pour les SAV ouverts
final savBadgeProvider = Provider.autoDispose<int>((ref) => 0);
