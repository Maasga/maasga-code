import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/products/presentation/screens/products_screen.dart';
import '../../features/orders/presentation/screens/orders_screen.dart';
import '../../features/appointments/presentation/screens/appointments_screen.dart';
import '../../features/clients/presentation/screens/clients_screen.dart';
import '../../features/reviews/presentation/screens/reviews_screen.dart';
import '../../features/banners/presentation/screens/banners_screen.dart';
import '../../features/maintenance/presentation/screens/maintenance_screen.dart';
import '../../features/sav/presentation/screens/sav_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/devis/presentation/screens/devis_screen.dart';
import '../../features/paiements/presentation/screens/paiements_screen.dart';
import '../../features/messages/presentation/screens/messages_screen.dart';
import '../../features/realisations/presentation/screens/realisations_screen.dart';
import '../../features/audit/presentation/screens/audit_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../shell/admin_shell.dart';
import '../../features/auth/data/providers/firebase_provider.dart';

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
            child: const NotificationsScreen(),
          ),
        ),
      ),
      GoRoute(
        path: '/devis',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Devis', child: const DevisScreen()),
        ),
      ),
      GoRoute(
        path: '/paiements',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Paiements', child: const PaiementsScreen()),
        ),
      ),
      GoRoute(
        path: '/clients',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Clients', child: const ClientsScreen()),
        ),
      ),
      GoRoute(
        path: '/maintenance',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Maintenance',
            child: const MaintenanceScreen(),
          ),
        ),
      ),
      GoRoute(
        path: '/sav',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'SAV', child: const SAVScreen()),
        ),
      ),
      GoRoute(
        path: '/messages',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Messages', child: const MessagesScreen()),
        ),
      ),
      GoRoute(
        path: '/avis',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Avis', child: const ReviewsScreen()),
        ),
      ),
      GoRoute(
        path: '/realisations',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(
            title: 'Réalisations',
            child: const RealisationsScreen(),
          ),
        ),
      ),
      GoRoute(
        path: '/banners',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Bannières', child: const BannersScreen()),
        ),
      ),
      GoRoute(
        path: '/audit',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Audit', child: const AuditScreen()),
        ),
      ),
      GoRoute(
        path: '/parametres',
        pageBuilder: (context, state) => MaterialPage(
          key: state.pageKey,
          child: AdminShell(title: 'Paramètres', child: const SettingsScreen()),
        ),
      ),
    ],
  );
});
