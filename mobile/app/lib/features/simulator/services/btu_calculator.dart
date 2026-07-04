class BtuCalculator {
  static double calculate({
    required double surface,
    required double height,
    required String solarExposure,
    required int windows,
    required String roomType,
  }) {
    // 2. BTU de base : 600 BTU par m²
    double btu = surface * 600;

    // 3. Facteur hauteur plafond
    // Standard 2.5m → ×1.0
    // Moyen 2.7m → ×1.08
    // Haut 3.0m → ×1.15
    // Très haut 3.5m+ → ×1.25
    double hauteurFactor = 1.0;
    if (height >= 3.5) {
      hauteurFactor = 1.25;
    } else if (height >= 3.0) {
      hauteurFactor = 1.15;
    } else if (height >= 2.7) {
      hauteurFactor = 1.08;
    }
    btu *= hauteurFactor;

    // 4. Facteur exposition solaire
    // Faible → ×1.0
    // Modérée → ×1.1
    // Forte → ×1.2
    double expositionFactor = 1.1; // Modérée par défaut
    if (solarExposure.toLowerCase() == 'faible') {
      expositionFactor = 1.0;
    } else if (solarExposure.toLowerCase() == 'forte') {
      expositionFactor = 1.2;
    }
    btu *= expositionFactor;

    // 5. Facteur fenêtres
    // 0 → ×1.0
    // 1 → ×1.05
    // 2 → ×1.10
    // 3+ → ×1.15
    double fenetresFactor = 1.0;
    if (windows >= 3) {
      fenetresFactor = 1.15;
    } else if (windows == 2) {
      fenetresFactor = 1.10;
    } else if (windows == 1) {
      fenetresFactor = 1.05;
    }
    btu *= fenetresFactor;

    // 6. Facteur type de pièce
    // Chambre → ×1.0
    // Bureau → ×1.0
    // Salon → ×1.05
    // Cuisine → ×1.20 (chaleur dégagée)
    // Commerce → ×1.15
    double typePieceFactor = 1.0;
    switch (roomType.toLowerCase()) {
      case 'salon':
        typePieceFactor = 1.05;
        break;
      case 'cuisine':
        typePieceFactor = 1.20;
        break;
      case 'commerce/boutique':
      case 'commerce':
        typePieceFactor = 1.15;
        break;
      default:
        typePieceFactor = 1.0;
    }
    btu *= typePieceFactor;

    // 7. Majoration climat tropical Ouagadougou +12%
    btu *= 1.12;

    return btu;
  }

  static String getCvRecommendation(double btu) {
    if (btu <= 9000) return '1 CV';
    if (btu <= 12000) return '1.5 CV';
    if (btu <= 18000) return '2 CV';
    if (btu <= 24000) return '3 CV';
    return '5 CV';
  }

  static int getCommercialBtu(double btu) {
    if (btu <= 9000) return 9000;
    if (btu <= 12000) return 12000;
    if (btu <= 18000) return 18000;
    if (btu <= 24000) return 24000;
    return 36000;
  }

  static String getPowerKey(double btu) {
    if (btu <= 9000) return '1cv';
    if (btu <= 12000) return '1.5cv';
    if (btu <= 18000) return '2cv';
    if (btu <= 24000) return '3cv';
    return '5cv';
  }
}
