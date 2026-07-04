import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PushService {
  Future<void> initialize({required Dio dio}) async {
    try {
      await Firebase.initializeApp();
    } catch (_) {
      // Firebase may already be initialized or missing config in local dev.
    }
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);
    final token = await messaging.getToken();
    if (token != null && token.isNotEmpty) {
      await _registerToken(dio, token);
    }
    messaging.onTokenRefresh.listen((newToken) async {
      await _registerToken(dio, newToken);
    });
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Push reçu: ${message.notification?.title}');
    });
  }

  Future<void> _registerToken(Dio dio, String token) async {
    try {
      await dio.post(
        '/api/client/push-token',
        data: {'token': token, 'platform': 'android', 'appVersion': '1.0.0'},
        options: Options(headers: {'Content-Type': 'application/json'}),
      );
    } catch (_) {
      // Non-blocking in V1.
    }
  }
}

final pushServiceProvider = Provider<PushService>((ref) => PushService());
