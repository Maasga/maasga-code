import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/admin_theme.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../data/providers/firebase_provider.dart';
import '../../data/providers/admin_role_provider.dart';

class UnauthorizedScreen extends ConsumerWidget {
  const UnauthorizedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: AdminTheme.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(MaasgaTokens.spacingXl),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 420),
              decoration: AdminTheme.elevatedCardDecoration,
              padding: const EdgeInsets.all(MaasgaTokens.spacingXl),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AdminTheme.error.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.gpp_bad_rounded,
                      size: 44,
                      color: AdminTheme.error,
                    ),
                  ),
                  const SizedBox(height: MaasgaTokens.spacingLg),
                  const Text(
                    'Accès refusé',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AdminTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  const Text(
                    'Votre compte n\'a pas les droits administrateur requis pour accéder au panneau MaasGa Admin.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: AdminTheme.textSecondary,
                      height: 1.5,
                    ),
                  ),
                  if (user != null) ...[
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    Container(
                      padding: const EdgeInsets.all(MaasgaTokens.spacingSm),
                      decoration: BoxDecoration(
                        color: AdminTheme.background,
                        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                        border: Border.all(color: AdminTheme.border),
                      ),
                      child: Column(
                        children: [
                          if (user.email != null)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.email_outlined, size: 16, color: AdminTheme.textSecondary),
                                const SizedBox(width: 8),
                                Flexible(
                                  child: Text(
                                    user.email!,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AdminTheme.textPrimary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          const SizedBox(height: 6),
                          InkWell(
                            onTap: () {
                              Clipboard.setData(ClipboardData(text: user.uid));
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('UID copié dans le presse-papier !')),
                              );
                            },
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.fingerprint, size: 16, color: AdminTheme.primary),
                                const SizedBox(width: 6),
                                Flexible(
                                  child: Text(
                                    'UID: ${user.uid}',
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontFamily: 'monospace',
                                      color: AdminTheme.textSecondary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.copy, size: 12, color: AdminTheme.textSecondary),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: MaasgaTokens.spacingLg),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AdminTheme.primary,
                        side: const BorderSide(color: AdminTheme.primary),
                        padding: const EdgeInsets.symmetric(
                          vertical: MaasgaTokens.spacingMd,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                        ),
                      ),
                      onPressed: () {
                        ref.invalidate(adminRoleProvider);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Vérification des droits en cours...')),
                        );
                      },
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text(
                        'Vérifier à nouveau les droits',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  const SizedBox(height: MaasgaTokens.spacingSm),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AdminTheme.error,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          vertical: MaasgaTokens.spacingMd,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                        ),
                      ),
                      onPressed: () async {
                        await ref.read(firebaseAuthProvider).signOut();
                      },
                      icon: const Icon(Icons.logout_rounded, size: 18),
                      label: const Text(
                        'Se déconnecter',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
