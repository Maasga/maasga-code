import 'package:flutter/material.dart';
import '../../data/models/order.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class OrderCard extends StatelessWidget {
  final Order order;
  final Function(String) onStatusChange;
  final VoidCallback onCancel;

  const OrderCard({
    super.key,
    required this.order,
    required this.onStatusChange,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
      ),
      child: InkWell(
        onTap: () {
          // TODO: Naviguer vers les détails de la commande
        },
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        child: Padding(
          padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header commande
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Commande #${order.id}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          order.customerName,
                          style: TextStyle(
                            fontSize: 14,
                            color: AdminTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildStatusBadge(),
                ],
              ),
              const SizedBox(height: MaasgaTokens.spacingSm),
              // Date et total
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: AdminTheme.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    '${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}',
                    style: TextStyle(
                      fontSize: 12,
                      color: AdminTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(width: MaasgaTokens.spacingMd),
                  Icon(Icons.location_on, size: 16, color: AdminTheme.textSecondary),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      order.address,
                      style: TextStyle(
                        fontSize: 12,
                        color: AdminTheme.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: MaasgaTokens.spacingSm),
              // Total
              Text(
                order.formattedTotal,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AdminTheme.primary,
                ),
              ),
              const SizedBox(height: MaasgaTokens.spacingSm),
              // Actions
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: order.status,
                      decoration: InputDecoration(
                        labelText: 'Statut',
                        border: OutlineInputBorder(),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'pending', child: Text('En attente')),
                        DropdownMenuItem(value: 'confirmed', child: Text('Confirmée')),
                        DropdownMenuItem(value: 'in_progress', child: Text('En cours')),
                        DropdownMenuItem(value: 'delivered', child: Text('Livrée')),
                        DropdownMenuItem(value: 'cancelled', child: Text('Annulée')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          onStatusChange(value);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: MaasgaTokens.spacingSm),
                  if (order.status != 'cancelled')
                    IconButton(
                      onPressed: onCancel,
                      icon: const Icon(Icons.cancel),
                      color: AdminTheme.error,
                      tooltip: 'Annuler',
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color badgeColor;
    switch (order.status.toLowerCase()) {
      case 'pending':
        badgeColor = Colors.orange;
        break;
      case 'confirmed':
        badgeColor = Colors.blue;
        break;
      case 'in_progress':
        badgeColor = Colors.purple;
        break;
      case 'delivered':
        badgeColor = Colors.green;
        break;
      case 'cancelled':
        badgeColor = Colors.red;
        break;
      default:
        badgeColor = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: badgeColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusSm),
        border: Border.all(color: badgeColor),
      ),
      child: Text(
        order.formattedStatus,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: badgeColor,
        ),
      ),
    );
  }
}
