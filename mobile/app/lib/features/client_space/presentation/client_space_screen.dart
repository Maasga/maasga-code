import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/network/api_client.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../../shared/widgets/main_bottom_nav.dart';
import '../../../shared/widgets/maasga_app_bar.dart';
import '../../../shared/services/pdf_service.dart';
import '../data/client_dashboard_repository.dart';
import '../domain/commande.dart';
import '../domain/rendez_vous.dart';
import 'widgets/commande_card.dart';
import 'widgets/contrat_card.dart';
import 'widgets/maintenance_item.dart';
import 'widgets/rdv_card.dart';
import 'widgets/section_card.dart';
import 'widgets/stat_item.dart';

class ClientSpaceScreen extends ConsumerWidget {
  const ClientSpaceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: const MaasgaAppBar(),
      body: auth.when(
        data: (loggedIn) {
          if (!loggedIn) {
            return _buildLoggedOutView(context);
          }
          final dashboard = ref.watch(clientDashboardProvider);
          return dashboard.when(
            data: (data) => _LoggedInView(data: data),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, __) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFE53935), size: 48),
                      const SizedBox(height: 16),
                      Text(
                        err.toString().contains('401')
                            ? 'Votre session a expiré ou vos identifiants sont invalides.'
                            : 'Impossible de charger votre espace.\nVérifiez votre connexion internet.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF757575)),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.refresh, color: Colors.white, size: 20),
                        label: const Text('Se reconnecter', style: TextStyle(color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1B3A8D),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          await ref.read(authControllerProvider.notifier).logout();
                          if (context.mounted) context.go('/auth/login');
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, __) => Center(child: Text('Erreur session: $err')),
      ),
      bottomNavigationBar: const MainBottomNav(currentPath: '/client-space'),
    );
  }

  Widget _buildLoggedOutView(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock_outline, size: 64, color: Color(0xFF1B3A8D)),
          const SizedBox(height: 16),
          Text(
            'Connectez-vous pour accéder à votre espace',
            style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF757575)),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => context.go('/auth/login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1B3A8D),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Se connecter', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _LoggedInView extends ConsumerWidget {
  const _LoggedInView({required this.data});
  final ClientDashboardData data;

  Future<void> _launchWhatsApp() async {
    const url = 'https://wa.me/22655996418';
    if (!await launchUrl(Uri.parse(url))) {
      debugPrint('Could not launch $url');
    }
  }


  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Déconnexion',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        content: Text(
          'Voulez-vous vraiment vous déconnecter ?',
          style: GoogleFonts.poppins(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Annuler',
              style: GoogleFonts.poppins(color: const Color(0xFF757575)),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) context.go('/auth/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE53935),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              'Se déconnecter',
              style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleAcceptDevis(WidgetRef ref, BuildContext context, String orderId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Accepter le devis'),
        content: const Text('Souhaitez-vous confirmer l\'acceptation de ce devis ? Notre équipe vous contactera sous 24h pour planifier l\'intervention.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF03045E)),
            child: const Text('Confirmer', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final repo = await ref.read(clientDashboardRepositoryProvider.future);
        await repo.handleDevisAction(orderId, 'accept');
        ref.invalidate(clientDashboardProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Devis accepté avec succès !')));
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e')));
        }
      }
    }
  }

  Future<void> _handleRejectDevis(WidgetRef ref, BuildContext context, String orderId) async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Refuser le devis'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Veuillez indiquer la raison du refus (optionnel) :'),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                hintText: 'Ex: Prix trop élevé, changement d\'avis...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Refuser le devis', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final repo = await ref.read(clientDashboardRepositoryProvider.future);
        await repo.handleDevisAction(orderId, 'refuse', reason: reasonController.text);
        ref.invalidate(clientDashboardProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Devis refusé. Nous en prenons note.')));
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = data.profile;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
                  // Carte profil utilisateur
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Text(
                      'Mon Compte MAASGA',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1A1A1A),
                      ),
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 32,
                          backgroundColor: const Color(0xFF1B3A8D),
                          backgroundImage: profile.photoUrl != null ? NetworkImage(profile.photoUrl!) : null,
                          child: profile.photoUrl == null
                              ? Text(
                                  profile.fullName.substring(0, 1).toUpperCase(),
                                  style: GoogleFonts.poppins(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                profile.fullName,
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF1A1A1A),
                                ),
                              ),
                              const SizedBox(height: 4),
                              _ProfileInfoRow(icon: Icons.phone, text: profile.phone),
                              const SizedBox(height: 4),
                              _ProfileInfoRow(icon: Icons.email_outlined, text: profile.email),
                              const SizedBox(height: 4),
                              _ProfileInfoRow(icon: Icons.location_on, text: profile.quartier, iconColor: const Color(0xFFFF6F00)),
                              const SizedBox(height: 4),
                              _ProfileInfoRow(icon: Icons.calendar_today, text: 'Membre depuis ${profile.memberSince}', fontSize: 12),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // 3. COMPTEURS STATS
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          const SizedBox(width: 16),
                          StatItem(icon: Icons.shopping_bag_outlined, count: '${data.orders.length}', label: 'Commandes'),
                          _VerticalDivider(),
                          StatItem(icon: Icons.construction_outlined, count: '${data.orders.where((o) => o.status == CommandeStatus.installed).length}', label: 'Installations'),
                          _VerticalDivider(),
                          StatItem(icon: Icons.calendar_month_outlined, count: '${data.rdvs.length}', label: 'Rendez-vous'),
                          _VerticalDivider(),
                          StatItem(icon: Icons.access_time_outlined, count: '${data.rdvs.where((r) => r.status == RdvStatus.enAttente || r.status == RdvStatus.confirme).length}', label: 'RDV en cours'),
                          _VerticalDivider(),
                          StatItem(icon: Icons.shield_outlined, count: '${data.maintenanceContracts.length}', label: 'Maintenance'),
                          const SizedBox(width: 16),
                        ],
                      ),
                    ),
                  ),

                  // 4. MES COMMANDES
                  SectionCard(
                    title: 'Mes commandes',
                    count: data.orders.length,
                    child: data.orders.isEmpty
                        ? _buildEmptyState(
                            icon: Icons.shopping_cart_outlined,
                            text: 'Aucune commande pour le moment',
                            btnLabel: 'Voir le catalogue',
                            onBtnPressed: () => context.go('/catalog'),
                          )
                        : Column(
                            children: data.orders.map((o) => CommandeCard(
                              commande: o,
                              onViewInvoice: () => PdfService.generateOrderInvoice(
                                profile: data.profile,
                                commande: o,
                              ),
                              onDownloadDevis: () => PdfService.generateOrderDevis(
                                profile: data.profile,
                                commande: o,
                              ),
                              onViewDevis: () => PdfService.generateOrderDevis(
                                profile: data.profile,
                                commande: o,
                              ),
                              onAcceptDevis: () => _handleAcceptDevis(ref, context, o.id),
                              onRejectDevis: () => _handleRejectDevis(ref, context, o.id),
                              onCancel: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Action "Annuler et rembourser" bientôt disponible'))),
                            )).toList(),
                          ),
                  ),

                  // 5. MAINTENANCES GRATUITES
                  SectionCard(
                    title: 'Maintenances gratuites incluses',
                    count: data.freeMaintenances.length,
                    child: data.freeMaintenances.isEmpty
                        ? Column(
                            children: [
                              const Icon(Icons.build_circle_outlined, size: 40, color: Color(0xFFD0D0D0)),
                              const SizedBox(height: 8),
                              Text(
                                'Aucune maintenance programmée',
                                style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF9E9E9E)),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Après installation de votre climatiseur, 3 visites de maintenance gratuites seront automatiquement programmées (durée 12 mois)',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFFBDBDBD)),
                              ),
                            ],
                          )
                        : Column(
                            children: data.freeMaintenances.map((m) {
                              return MaintenanceItem(
                                date: m['date'],
                                technicianName: m['tech'],
                                isCompleted: m['done'],
                              );
                            }).toList(),
                          ),
                  ),

                  // 6. MES RENDEZ-VOUS
                  SectionCard(
                    title: 'Mes rendez-vous',
                    count: data.rdvs.length,
                    child: data.rdvs.isEmpty
                        ? _buildEmptyState(
                            icon: Icons.event_outlined,
                            text: 'Aucun rendez-vous enregistré',
                            btnLabel: 'Prendre un rendez-vous',
                            onBtnPressed: () => context.go('/rdv'),
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ...data.rdvs.map((r) => RdvCard(rdv: r)),
                              const SizedBox(height: 12),
                              SingleChildScrollView(
                                scrollDirection: Axis.horizontal,
                                child: Row(
                                  children: [
                                    _ActionBtn(icon: Icons.add, label: 'Nouveau RDV', onPressed: () => context.go('/rdv'), isFilled: true),
                                    const SizedBox(width: 8),
                                    _ActionBtn(label: 'Maintenance', onPressed: () => context.go('/maintenance')),
                                    const SizedBox(width: 8),
                                    _ActionBtn(label: 'Catalogue', onPressed: () => context.go('/catalog')),
                                    const SizedBox(width: 8),
                                    _ActionBtn(
                                      icon: Icons.chat,
                                      label: 'WhatsApp',
                                      color: const Color(0xFF43A047),
                                      onPressed: _launchWhatsApp,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                  ),

                  // 7. MES CONTRATS
                  SectionCard(
                    title: 'Mes contrats de maintenance',
                    count: data.maintenanceContracts.where((c) => c.planType != 'sav_gratuit').length,
                    child: data.maintenanceContracts.where((c) => c.planType != 'sav_gratuit').isEmpty
                        ? _buildEmptyState(
                            icon: Icons.shield_outlined,
                            text: 'Aucun contrat de maintenance actif',
                            btnLabel: 'Souscrire un contrat',
                            onBtnPressed: () => context.go('/maintenance'),
                          )
                        : Column(
                            children: data.maintenanceContracts
                                .where((c) => c.planType != 'sav_gratuit')
                                .map((c) => ContratCard(
                                      contrat: c,
                                      onViewInvoice: () async {
                                        try {
                                          final dio = await ref.read(dioProvider.future);
                                          await PdfService.displayRemoteInvoice(dio: dio, contractId: c.id);
                                        } catch (e) {
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('Erreur lors du téléchargement de la facture: $e')),
                                            );
                                          }
                                        }
                                      },
                                    ))
                                .toList(),
                          ),
                  ),

                  // 8. DÉCONNEXION
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                    child: SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: OutlinedButton.icon(
                        onPressed: () => _showLogoutDialog(context, ref),
                        icon: const Icon(Icons.logout, color: Color(0xFFE53935)),
                        label: Text(
                          'Se déconnecter',
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFFE53935),
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFE53935)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ),
        ],
      ),
    );
  }

  Widget _buildEmptyState({required IconData icon, required String text, required String btnLabel, required VoidCallback onBtnPressed}) {
    return Column(
      children: [
        Icon(icon, size: 40, color: const Color(0xFFD0D0D0)),
        const SizedBox(height: 8),
        Text(text, style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF9E9E9E))),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: onBtnPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1B3A8D),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          ),
          child: Text(btnLabel, style: const TextStyle(color: Colors.white, fontSize: 13)),
        ),
      ],
    );
  }
}

class _ProfileInfoRow extends StatelessWidget {
  const _ProfileInfoRow({required this.icon, required this.text, this.iconColor = const Color(0xFF757575), this.fontSize = 13});
  final IconData icon;
  final String text;
  final Color iconColor;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: iconColor),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.poppins(fontSize: fontSize, color: const Color(0xFF757575)),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 40, color: const Color(0xFFF0F0F0));
  }
}

class _ActionBtn extends StatelessWidget {
  const _ActionBtn({required this.label, required this.onPressed, this.icon, this.isFilled = false, this.color = const Color(0xFF1B3A8D)});
  final String label;
  final VoidCallback onPressed;
  final IconData? icon;
  final bool isFilled;
  final Color color;

  @override
  Widget build(BuildContext context) {
    if (isFilled) {
      return ElevatedButton.icon(
        onPressed: onPressed,
        icon: icon != null ? Icon(icon, size: 16) : const SizedBox.shrink(),
        label: Text(label, style: GoogleFonts.poppins(fontSize: 12, color: Colors.white)),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(horizontal: 12),
        ),
      );
    }
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: icon != null ? Icon(icon, size: 16, color: color) : const SizedBox.shrink(),
      label: Text(label, style: GoogleFonts.poppins(fontSize: 12, color: color)),
      style: OutlinedButton.styleFrom(
        side: BorderSide(color: color),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 12),
      ),
    );
  }
}
