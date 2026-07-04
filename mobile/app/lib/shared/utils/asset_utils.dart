import 'package:flutter/foundation.dart';

class AssetUtils {
  static String getAssetPath(String path) {
    if (path.isEmpty || path == 'MAASGA') return 'assets/logo_maasga.png';
    
    // Catch-all for anything that isn't a clear asset path (doesn't contain a dot or contains emoji/encodings)
    final isInvalid = path.contains('❄') || 
                     path.contains('\u2744') || 
                     path.contains('%') || // Any URL encoding
                     !path.contains('.'); // No file extension
                      
    if (isInvalid) return 'assets/logo_maasga.png';

    // Remove extra 'assets/' if on Web to avoid double prefixing (assets/assets/...)
    if (kIsWeb && path.startsWith('assets/')) {
      return path.substring(7);
    }
    return path;
  }
}
