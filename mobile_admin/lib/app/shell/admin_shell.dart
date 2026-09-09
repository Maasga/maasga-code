import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'widgets/nav_drawer.dart';
import 'widgets/bottom_nav.dart';
import 'widgets/app_bar.dart';

class AdminShell extends ConsumerStatefulWidget {
  final Widget child;
  final String title;

  const AdminShell({super.key, required this.child, required this.title});

  @override
  ConsumerState<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends ConsumerState<AdminShell> {
  int _notificationCount = 0;

  @override
  Widget build(BuildContext context) {
    final currentRoute = ModalRoute.of(context)?.settings.name ?? '/';

    return Scaffold(
      drawer: const NavDrawer(),
      appBar: AdminAppBar(
        title: widget.title,
        notificationCount: _notificationCount,
        onNotificationTap: () {
          Navigator.pushNamed(context, '/notifications');
        },
      ),
      body: widget.child,
      bottomNavigationBar: BottomNav(
        currentRoute: currentRoute,
        onNavigate: (route) {
          Navigator.pushReplacementNamed(context, route);
        },
      ),
    );
  }
}
