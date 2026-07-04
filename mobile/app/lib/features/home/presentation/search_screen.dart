import 'package:flutter/material.dart';

import '../../../shared/widgets/main_bottom_nav.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Center(
          child: Text(
            'Search (placeholder)',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
      ),
      bottomNavigationBar: const MainBottomNav(currentPath: '/search'),
    );
  }
}

