import 'package:flutter/material.dart';
import '../../data/models/appointment.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class AppointmentCard extends StatelessWidget {
  final Appointment appointment;
  final Function(String) onStatusChange;
  final VoidCallback onCancel;

  const AppointmentCard({
    super.key,
    required this.appointment,
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
          // TODO: Naviguer vers les détails du RDV
        },
        borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
        child: Padding(
          padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header RDV
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'RDV #${appointment.id}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          appointment.customerName,
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
              // Date et heure
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: AdminTheme.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    appointment.formattedDate,
                    style: TextStyle(
                      fontSize: 12,
                      color: AdminTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(width: MaasgaTokens.spacingMd),
                  Icon(Icons.access_time, size: 16, color: AdminTheme.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    appointment.time,
                    style: TextStyle(
                      fontSize: 12,
                      color: AdminTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: MaasgaTokens.spacingSm),
              // Contact
              Row(
                children: [
                  Icon(Icons.phone, size: 16, color: AdminTheme.textSecondary),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      appointment.customerPhone,
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
              if (appointment.address != null) ...[
                const SizedBox(height: MaasgaTokens.spacingSm),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: AdminTheme.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        appointment.address!,
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
              ],
              const SizedBox(height: MaasgaTokens.spacingSm),
              // Actions
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: appointment.status,
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
                        DropdownMenuItem(value: 'confirmed', child: Text('Confirmé')),
                        DropdownMenuItem(value: 'completed', child: Text('Terminé')),
                        DropdownMenuItem(value: 'cancelled', child: Text('Annulé')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          onStatusChange(value);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: MaasgaTokens.spacingSm),
                  if (appointment.status != 'cancelled')
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
    switch (appointment.status.toLowerCase()) {
      case 'pending':
        badgeColor = Colors.orange;
        break;
      case 'confirmed':
        badgeColor = Colors.blue;
        break;
      case 'completed':
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
        appointment.formattedStatus,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: badgeColor,
        ),
      ),
    );
  }
}
