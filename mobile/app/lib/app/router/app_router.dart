import 'package:animations/animations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/cart/presentation/cart_screen.dart';
import '../../features/cart/presentation/checkout_screen.dart';
import '../../features/cart/presentation/payment_redirect_screen.dart';
import '../../features/cart/presentation/payment_webview_screen.dart';
import '../../features/catalog/presentation/catalog_screen.dart';
import '../../features/catalog/presentation/product_detail_screen.dart';
import '../../features/catalog/domain/product.dart';
import '../../features/client_space/presentation/client_space_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/home/presentation/onboarding_screen.dart';
import '../../features/home/presentation/splash_screen.dart';
import '../../features/home/presentation/search_screen.dart';
import '../../features/home/presentation/address_selection_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/rdv/presentation/rdv_screen.dart';
import '../../features/simulator/presentation/simulator_screen.dart';
import '../../features/support/presentation/support_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/maintenance/presentation/screens/maintenance_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        pageBuilder: (context, state) => _buildPage(state, const SplashScreen()),
      ),
      GoRoute(
        path: '/onboarding',
        pageBuilder: (context, state) => _buildPage(state, const OnboardingScreen()),
      ),
      GoRoute(
        path: '/auth/login',
        pageBuilder: (context, state) => _buildPage(state, const LoginScreen()),
      ),
      GoRoute(
        path: '/auth/register',
        pageBuilder: (context, state) => _buildPage(state, const RegisterScreen()),
      ),
      GoRoute(
        path: '/home',
        pageBuilder: (context, state) => _buildPage(state, const HomeScreen()),
      ),
      GoRoute(
        path: '/catalogue',
        pageBuilder: (context, state) => _buildPage(state, const CatalogScreen()),
      ),
      GoRoute(
        path: '/rendez-vous',
        pageBuilder: (context, state) => _buildPage(state, const RdvScreen()),
      ),
      GoRoute(
        path: '/espace-client',
        pageBuilder: (context, state) => _buildPage(state, const ClientSpaceScreen()),
      ),
      GoRoute(
        path: '/catalog',
        pageBuilder: (context, state) => _buildPage(state, const CatalogScreen()),
      ),
      GoRoute(
        path: '/catalog/product',
        pageBuilder: (context, state) => _buildPage(
          state,
          ProductDetailScreen(product: state.extra as Product),
        ),
      ),
      GoRoute(
        path: '/simulator',
        pageBuilder: (context, state) => _buildPage(state, const SimulatorScreen()),
      ),
      GoRoute(
        path: '/cart',
        pageBuilder: (context, state) => _buildPage(state, const CartScreen()),
      ),
      GoRoute(
        path: '/checkout',
        pageBuilder: (context, state) => _buildPage(state, const CheckoutScreen()),
      ),
      GoRoute(
        path: '/payment',
        pageBuilder: (context, state) => _buildPage(
          state,
          PaymentRedirectScreen(url: state.extra as String? ?? ''),
        ),
      ),
      GoRoute(
        path: '/payment-webview',
        pageBuilder: (context, state) {
          final args = (state.extra as Map<String, dynamic>?) ?? const {};
          return _buildPage(
            state,
            PaymentWebViewScreen(
              paymentUrl: args['url'] as String? ?? '',
              orderId: (args['orderId'] as num?)?.toInt() ?? 0,
            ),
          );
        },
      ),
      GoRoute(
        path: '/rdv',
        pageBuilder: (context, state) => _buildPage(state, const RdvScreen()),
      ),
      GoRoute(
        path: '/client-space',
        pageBuilder: (context, state) => _buildPage(state, const ClientSpaceScreen()),
      ),
      GoRoute(
        path: '/notifications',
        pageBuilder: (context, state) => _buildPage(state, const NotificationsScreen()),
      ),
      GoRoute(
        path: '/support',
        pageBuilder: (context, state) => _buildPage(state, const SupportScreen()),
      ),
      GoRoute(
        path: '/settings',
        pageBuilder: (context, state) => _buildPage(state, const SettingsScreen()),
      ),
      GoRoute(
        path: '/search',
        pageBuilder: (context, state) => _buildPage(state, const SearchScreen()),
      ),
      GoRoute(
        path: '/maintenance',
        pageBuilder: (context, state) => _buildPage(state, const MaintenanceScreen()),
      ),
      GoRoute(
        path: '/address',
        pageBuilder: (context, state) => _buildPage(state, const AddressSelectionScreen()),
      ),
    ],
  );
});

CustomTransitionPage _buildPage(GoRouterState state, Widget child) {
  return CustomTransitionPage(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return SharedAxisTransition(
        animation: animation,
        secondaryAnimation: secondaryAnimation,
        transitionType: SharedAxisTransitionType.horizontal,
        child: child,
      );
    },
  );
}
