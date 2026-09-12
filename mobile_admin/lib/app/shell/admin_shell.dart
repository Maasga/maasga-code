import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'widgets/nav_drawer.dart';
import 'widgets/bottom_nav.dart';
import 'widgets/app_bar.dart';

class AdminShell extends ConsumerWidget {
  final Widget child;
  final String title;

  const AdminShell({super.key, required this.child, required this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentRoute = GoRouterState.of(context).matchedLocation;

    return Scaffold(
      drawer: const NavDrawer(),
      appBar: AdminAppBar(title: title, notificationCount: 0),
      body: child,
      bottomNavigationBar: BottomNav(
        currentRoute: currentRoute,
        onNavigate: (route) {
          context.go(route);
        },
      ),
    );
  }
}
