import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

class SimulatorResult {
  SimulatorResult({
    required this.surface,
    required this.recommendedBtu,
    required this.recommendedCv,
    required this.compatibleProductIds,
  });

  final double surface;
  final int recommendedBtu;
  final String recommendedCv;
  final List<int> compatibleProductIds;
}

class SimulatorRepository {
  SimulatorRepository(this._dio);
  final Dio _dio;

  Future<SimulatorResult> calculate({
    required double longueur,
    required double largeur,
    required double hauteur,
    required String exposition,
    required int fenetres,
    required String typePiece,
  }) async {
    // Keep legacy `occupation` for backend compatibility while prioritizing
    // the website-aligned `fenetres` input.
    final occupation = fenetres >= 3 ? '5+' : fenetres >= 2 ? '3-4' : '1-2';
    final response = await _dio.post(
      '/api/simulateur/btu',
      data: {
        'longueur': longueur,
        'largeur': largeur,
        'hauteur': hauteur,
        'exposition': exposition,
        'fenetres': fenetres,
        'occupation': occupation,
        'typePiece': typePiece,
      },
      options: Options(headers: {'Content-Type': 'application/json'}),
    );
    final data = response.data as Map<String, dynamic>? ?? const {};
    final ids = (data['compatibleProductIds'] as List<dynamic>? ?? const [])
        .map((e) => (e as num).toInt())
        .toList();
    return SimulatorResult(
      surface: (data['surface'] as num?)?.toDouble() ?? 0,
      recommendedBtu: (data['recommendedBtu'] as num?)?.toInt() ?? 0,
      recommendedCv: (data['recommendedCv'] as String?) ?? '',
      compatibleProductIds: ids,
    );
  }
}

final simulatorRepositoryProvider = FutureProvider<SimulatorRepository>((ref) async {
  final dio = await ref.watch(dioProvider.future);
  return SimulatorRepository(dio);
});
