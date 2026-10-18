import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'widgets/nav_drawer.dart';
import 'widgets/bottom_nav.dart';
import 'widgets/app_bar.dart';
import '../../core/services/session_service.dart';

// ── Connectivity provider ──────────────────────────────────────────────────

final connectivityProvider = StreamProvider<ConnectivityResult>((ref) {
  return Connectivity().onConnectivityChanged.map((results) {
    // connectivity_plus >= 5.x returns a List<ConnectivityResult>
    if (results.isEmpty) return ConnectivityResult.none;
    return results.first;
  });
});

// ── AdminShell ─────────────────────────────────────────────────────────────

class AdminShell extends ConsumerWidget {
  final Widget child;
  final String title;

  const AdminShell({super.key, required this.child, required this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentRoute = GoRouterState.of(context).matchedLocation;
    final connectivityAsync = ref.watch(connectivityProvider);
    final sessionService = ref.read(sessionServiceProvider);

    final bool isOffline = connectivityAsync.when(
      data: (result) => result == ConnectivityResult.none,
      loading: () => false,
      error: (_, _) => false,
    );

    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: (_) => sessionService.resetTimer(),
      onPointerMove: (_) => sessionService.resetTimer(),
      child: Scaffold(
        drawer: const NavDrawer(),
        appBar: AdminAppBar(title: title, notificationCount: 0),
        body: Column(
          children: [
            // ── Offline banner ──
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: isOffline
                  ? Container(
                      key: const ValueKey('offline-banner'),
                      width: double.infinity,
                      color: const Color(0xFFDC2626),
                      padding: const EdgeInsets.symmetric(
                        vertical: 6,
                        horizontal: 16,
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.wifi_off, color: Colors.white, size: 16),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Hors ligne — Vérifiez votre connexion',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  : const SizedBox.shrink(key: ValueKey('online')),
            ),
            Expanded(child: child),
          ],
        ),
        bottomNavigationBar: BottomNav(
          currentRoute: currentRoute,
          onNavigate: (route) {
            context.go(route);
          },
        ),
      ),
    );
  }
}
