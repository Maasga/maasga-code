import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../notifications/data/push_service.dart';
import '../data/auth_repository.dart';

class AuthController extends AsyncNotifier<bool> {
  @override
  Future<bool> build() async {
    final repo = await ref.watch(authRepositoryProvider.future);
    try {
      final loggedIn = await repo.hasActiveSession();
      if (loggedIn) {
        try {
          final dio = await ref.read(dioProvider.future);
          await ref.read(pushServiceProvider).initialize(dio: dio);
        } catch (_) {}
      }
      return loggedIn;
    } catch (_) {
      return false;
    }
  }

  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = await ref.read(authRepositoryProvider.future);
      await repo.login(identifier: identifier, password: password);
      try {
        final dio = await ref.read(dioProvider.future);
        await ref.read(pushServiceProvider).initialize(dio: dio);
      } catch (_) {}
      return true;
    });
  }

  Future<void> register({
    required String name,
    required String phone,
    required String email,
    required String quartier,
    required String password,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = await ref.read(authRepositoryProvider.future);
      await repo.register(
        name: name,
        phone: phone,
        email: email,
        quartier: quartier,
        password: password,
      );
      try {
        final dio = await ref.read(dioProvider.future);
        await ref.read(pushServiceProvider).initialize(dio: dio);
      } catch (_) {}
      return true;
    });
  }

  Future<void> logout() async {
    final repo = await ref.read(authRepositoryProvider.future);
    await repo.logout();
    state = const AsyncData(false);
  }

  Future<void> loginWithGoogle({
    required String accessToken,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = await ref.read(authRepositoryProvider.future);
      await repo.loginWithGoogle(accessToken: accessToken);
      try {
        final dio = await ref.read(dioProvider.future);
        await ref.read(pushServiceProvider).initialize(dio: dio);
      } catch (_) {}
      return true;
    });
  }
}

final authControllerProvider = AsyncNotifierProvider<AuthController, bool>(
  AuthController.new,
);
