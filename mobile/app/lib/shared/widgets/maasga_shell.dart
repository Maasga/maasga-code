import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../design_tokens/maasga_tokens.dart';
import 'main_bottom_nav.dart';
import 'maasga_app_bar.dart';

class MaasgaShell extends StatelessWidget {
  const MaasgaShell({
    super.key,
    required this.title,
    required this.child,
    this.actions,
    this.bottomNavigationBar,
    this.showDrawer = false,
  });

  final String title;
  final Widget child;
  final List<Widget>? actions;
  final Widget? bottomNavigationBar;
  final bool showDrawer;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: null,
      appBar: const MaasgaAppBar(),
      body: Container(
        decoration: const BoxDecoration(gradient: MaasgaTokens.pageGradient),
        child: SafeArea(child: child),
      ),
      bottomNavigationBar: bottomNavigationBar ?? MainBottomNav(currentPath: GoRouterState.of(context).uri.toString()),
    );
  }
}
