import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/products/presentation/screens/products_screen.dart';
import '../../features/orders/presentation/screens/orders_screen.dart';
import '../../features/appointments/presentation/screens/appointments_screen.dart';
import '../shell/admin_shell.dart';
import '../../features/auth/data/providers/firebase_provider.dart';

// Placeholder screens for routes not yet implemented
class PlaceholderScreen extends StatelessWidget {
  final String title;
  const PlaceholderScreen({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.construction, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            'Fonctionnalité en développement',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateChangesProvider);

  return GoRouter(
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final isAuthenticated = authState.value != null;
      final isLoggingIn = state.matchedLocation == '/login';

      if (!isAuthenticated && !isLoggingIn) {
        return '/login';
      }

      if (isAuthenticated && isLoggingIn) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) =>
            MaterialPage(key: state.pageKey, child: const LoginScreen()),
      ),
      GoRoute(
        path: '/dashboard',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Tableau de bord',
            child: const DashboardScreen(),
          ),
        ),
      ),
      GoRoute(
        path: '/commandes',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Commandes', child: const OrdersScreen()),
        ),
      ),
      GoRoute(
        path: '/rdv',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Rendez-vous',
            child: const AppointmentsScreen(),
          ),
        ),
      ),
      GoRoute(
        path: '/produits',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Produits', child: const ProductsScreen()),
        ),
      ),
      GoRoute(
        path: '/notifications',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Notifications',
            child: const PlaceholderScreen(title: 'Notifications'),
          ),
        ),
      ),
      GoRoute(
        path: '/devis',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Devis',
            child: const PlaceholderScreen(title: 'Devis'),
          ),
        ),
      ),
      GoRoute(
        path: '/paiements',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Paiements',
            child: const PlaceholderScreen(title: 'Paiements'),
          ),
        ),
      ),
      GoRoute(
        path: '/clients',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Clients',
            child: const PlaceholderScreen(title: 'Clients'),
          ),
        ),
      ),
      GoRoute(
        path: '/maintenance',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Maintenance',
            child: const PlaceholderScreen(title: 'Maintenance'),
          ),
        ),
      ),
      GoRoute(
        path: '/sav',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'SAV',
            child: const PlaceholderScreen(title: 'SAV'),
          ),
        ),
      ),
      GoRoute(
        path: '/messages',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Messages',
            child: const PlaceholderScreen(title: 'Messages'),
          ),
        ),
      ),
      GoRoute(
        path: '/avis',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Avis',
            child: const PlaceholderScreen(title: 'Avis'),
          ),
        ),
      ),
      GoRoute(
        path: '/realisations',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Réalisations',
            child: const PlaceholderScreen(title: 'Réalisations'),
          ),
        ),
      ),
      GoRoute(
        path: '/banners',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Bannières',
            child: const PlaceholderScreen(title: 'Bannières'),
          ),
        ),
      ),
      GoRoute(
        path: '/audit',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Audit',
            child: const PlaceholderScreen(title: 'Audit'),
          ),
        ),
      ),
      GoRoute(
        path: '/parametres',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Paramètres',
            child: const PlaceholderScreen(title: 'Paramètres'),
          ),
        ),
      ),
    ],
  );
});
