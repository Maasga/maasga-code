import 'package:another_flutter_splash_screen/another_flutter_splash_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/data/auth_repository.dart';

class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FlutterSplashScreen.fadeIn(
      duration: const Duration(milliseconds: 3000),
      backgroundColor: Colors.white,
      onAnimationEnd: () async {
        // Handle redidirection logic based on auth
        final authRepoAsync = await ref.read(authRepositoryProvider.future);
        final isLoggedIn = await authRepoAsync.hasActiveSession();
        
        if (context.mounted) {
          if (isLoggedIn) {
            context.go('/home');
          } else {
            context.go('/onboarding');
          }
        }
      },
      childWidget: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: 180,
              child: Image.asset('assets/logo_maasga.png'),
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1B3A8D)),
              strokeWidth: 2,
            ),
          ],
        ),
      ),
    );
  }
}
