import 'package:flutter/material.dart';
import '../../data/models/payment.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class PaymentCard extends StatelessWidget {
  final Payment payment;
  final Function(String)? onStatusUpdate;

  const PaymentCard({
    super.key,
    required this.payment,
    this.onStatusUpdate,
  });

  Color _getStatusColor(String status) {
    switch (status) {
      case 'completed':
        return AdminTheme.success;
      case 'pending':
        return AdminTheme.warning;
      case 'failed':
        return AdminTheme.error;
      case 'refunded':
        return Colors.purple;
      default:
        return AdminTheme.secondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(payment.status);

    return Container(
      decoration: AdminTheme.cardDecoration,
      padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      payment.transactionId ?? 'N/A',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AdminTheme.primary,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      payment.formattedDate,
                      style: TextStyle(
                        fontSize: 12,
                        color: AdminTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  payment.statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.attach_money, size: 16, color: AdminTheme.textSecondary),
              const SizedBox(width: 6),
              Text(
                payment.formattedAmount,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AdminTheme.primary,
                ),
              ),
              if (payment.paymentMethod != null) ...[
                const SizedBox(width: 12),
                Icon(Icons.payment, size: 16, color: AdminTheme.textSecondary),
                const SizedBox(width: 6),
                Text(
                  payment.paymentMethod!,
                  style: TextStyle(
                    fontSize: 12,
                    color: AdminTheme.textSecondary,
                  ),
                ),
              ],
            ],
          ),
          if (payment.ligdiStatus != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.phone_android, size: 14, color: AdminTheme.textSecondary),
                const SizedBox(width: 6),
                Text(
                  'LigdiCash: ${payment.ligdiStatus}',
                  style: TextStyle(
                    fontSize: 11,
                    color: AdminTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ],
          if (payment.notes != null && payment.notes!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AdminTheme.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                payment.notes!,
                style: TextStyle(
                  fontSize: 12,
                  color: AdminTheme.textSecondary,
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (payment.status == 'pending' && onStatusUpdate != null)
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, size: 20),
                  onSelected: (value) => onStatusUpdate!(value),
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'completed',
                      child: Row(
                        children: [
                          Icon(Icons.check_circle, color: AdminTheme.success, size: 18),
                          SizedBox(width: 8),
                          Text('Marquer payé'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'failed',
                      child: Row(
                        children: [
                          Icon(Icons.cancel, color: AdminTheme.error, size: 18),
                          SizedBox(width: 8),
                          Text('Marquer échoué'),
                        ],
                      ),
                    ),
                  ],
                ),
              if (payment.status == 'completed' && onStatusUpdate != null)
                IconButton(
                  icon: const Icon(Icons.refresh, size: 18),
                  onPressed: () => onStatusUpdate!('refunded'),
                  tooltip: 'Rembourser',
                ),
              Text(
                payment.formattedTime,
                style: TextStyle(
                  fontSize: 11,
                  color: AdminTheme.textDisabled,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}