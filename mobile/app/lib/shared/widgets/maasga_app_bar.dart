import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../design_tokens/maasga_tokens.dart';
import '../../app/theme/theme_controller.dart';

class MaasgaAppBar extends ConsumerWidget implements PreferredSizeWidget {
  const MaasgaAppBar({
    super.key,
    this.notificationsCount = 3,
    this.trailingAction,
    this.showBackButton = false,
  });

  /// Numéro à afficher sur la cloche.
  final int notificationsCount;

  /// Permet d'ajouter une icône spécifique à côté de la cloche de notifications (ex: filtre).
  final Widget? trailingAction;

  /// Remplace le menu hamburger par une flèche retour si context.canPop() est vrai,
  final bool showBackButton;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeControllerProvider);
    final isDark = themeMode == ThemeMode.dark || 
                  (themeMode == ThemeMode.system && MediaQuery.of(context).platformBrightness == Brightness.dark);
    
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      // We apply standard safe area padding for the app bar
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        bottom: 8,
        left: 16,
        right: 16,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left Action (Back Only)
          SizedBox(
            width: 40,
            height: 40,
            child: (showBackButton && context.canPop())
                ? Container(
                    decoration: BoxDecoration(
                      color: isDark ? colorScheme.surfaceContainerHighest : const Color(0xFFF5F5F5),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      padding: EdgeInsets.zero,
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back, size: 20),
                      color: colorScheme.onSurface,
                    ),
                  )
                : const SizedBox.shrink(),
          ),
          
          // Center Title (Image Asset)
          Expanded(
            child: Center(
              child: Image.asset(
                'assets/logo_maasga.png',
                height: 44, // Adjusted for the high res logo
                fit: BoxFit.contain,
                color: isDark ? Colors.white : null,
              ),
            ),
          ),

          // Right Actions (Theme Switcher + Trailing + Notifications)
          SizedBox(
            width: trailingAction != null ? 144 : 96,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                // Theme Switcher Button
                IconButton(
                  onPressed: () => ref.read(themeControllerProvider.notifier).toggleTheme(),
                  icon: Icon(
                    themeMode == ThemeMode.system 
                      ? Icons.brightness_auto_outlined 
                      : (themeMode == ThemeMode.dark ? Icons.dark_mode : Icons.light_mode),
                    size: 20,
                  ),
                  color: isDark ? MaasgaTokens.cyan500 : MaasgaTokens.blue700,
                  tooltip: 'Changer le thème',
                ),

                if (trailingAction != null) trailingAction!,
                
                Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    IconButton(
                      padding: EdgeInsets.zero,
                      alignment: Alignment.centerRight,
                      onPressed: () {
                        context.go('/notifications');
                      },
                      icon: const Icon(Icons.notifications_outlined),
                      color: colorScheme.onSurface,
                    ),
                    Positioned(
                      right: 4,
                      top: 4,
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFE53935),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          notificationsCount > 9 ? '9' : '$notificationsCount',
                          style: GoogleFonts.poppins(
                            fontSize: 8,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Size get preferredSize {
    // Custom height taking account of standard 56 + shadow space
    return const Size.fromHeight(60.0);
  }
}
