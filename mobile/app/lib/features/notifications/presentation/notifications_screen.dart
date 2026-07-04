import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../../shared/widgets/maasga_shell.dart';
import '../../../shared/widgets/main_bottom_nav.dart';
import '../data/activity_repository.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM, HH:mm', 'fr_FR').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activityAsync = ref.watch(userActivityProvider);

    return MaasgaShell(
      title: 'Mon Activité',
      bottomNavigationBar: const MainBottomNav(currentPath: '/home'),
      child: activityAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF1B3A8D))),
        error: (err, _) => Center(child: Text('Erreur: $err', style: GoogleFonts.poppins())),
        data: (activities) {
          if (activities.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.notifications_off_outlined, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    'Aucune activité pour le moment',
                    style: GoogleFonts.poppins(color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(userActivityProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: activities.length,
              itemBuilder: (context, index) {
                final activity = activities[index];
                final isOrder = activity.type == 'order';

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: isOrder 
                          ? const Color(0xFF1B3A8D).withValues(alpha: 0.1)
                          : const Color(0xFFFF6F00).withValues(alpha: 0.1),
                      child: Icon(
                        isOrder ? Icons.shopping_bag_outlined : Icons.calendar_today_outlined,
                        color: isOrder ? const Color(0xFF1B3A8D) : const Color(0xFFFF6F00),
                        size: 20,
                      ),
                    ),
                    title: Text(
                      isOrder ? 'Commande #${activity.id}' : 'Rendez-vous',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          activity.notes ?? (isOrder ? 'Achat de climatiseur' : 'Visite technique'),
                          style: GoogleFonts.poppins(fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _formatDate(activity.createdAt),
                          style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey),
                        ),
                      ],
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(activity.status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        activity.status.toUpperCase(),
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: _getStatusColor(activity.status),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'confirmed':
      case 'success':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
