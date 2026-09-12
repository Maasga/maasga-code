import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/order_provider.dart';
import '../../data/models/order.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';
import '../widgets/order_card.dart';
import '../widgets/order_filter.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  String _selectedStatus = 'Tous';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(ordersProvider);

    return Scaffold(
      body: Column(
        children: [
          // Header avec filtres
          Container(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            decoration: BoxDecoration(
              color: AdminTheme.surface,
              border: Border(bottom: BorderSide(color: AdminTheme.border)),
            ),
            child: Column(
              children: [
                // Barre de recherche
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher une commande...',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: AdminTheme.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(
                        MaasgaTokens.radiusMd,
                      ),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
                const SizedBox(height: MaasgaTokens.spacingSm),
                // Filtre statut
                OrderFilter(
                  selectedStatus: _selectedStatus,
                  onStatusChanged: (status) {
                    setState(() {
                      _selectedStatus = status;
                    });
                  },
                ),
              ],
            ),
          ),

          // Liste des commandes
          Expanded(
            child: ordersAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 48,
                      color: AdminTheme.error,
                    ),
                    const SizedBox(height: MaasgaTokens.spacingMd),
                    Text('Erreur: $error'),
                    const SizedBox(height: MaasgaTokens.spacingSm),
                    ElevatedButton(
                      onPressed: () => ref.invalidate(ordersProvider),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
              data: (orders) {
                // Mapper les statuts français vers les valeurs du backend
                final statusMap = {
                  'Tous': '',
                  'En attente': 'en_attente',
                  'Confirmée': 'confirme',
                  'En cours': 'en_livraison',
                  'Livrée': 'livre',
                  'Annulée': 'annule',
                };

                // Filtrer les commandes
                List<Order> filteredOrders = orders;
                if (_selectedStatus != 'Tous') {
                  final backendStatus = statusMap[_selectedStatus] ?? '';
                  filteredOrders = filteredOrders
                      .where(
                        (o) =>
                            o.status.toLowerCase() ==
                            backendStatus.toLowerCase(),
                      )
                      .toList();
                }
                if (_searchQuery.isNotEmpty) {
                  filteredOrders = filteredOrders
                      .where(
                        (o) =>
                            o.clientName.toLowerCase().contains(
                              _searchQuery.toLowerCase(),
                            ) ||
                            o.id.toLowerCase().contains(
                              _searchQuery.toLowerCase(),
                            ),
                      )
                      .toList();
                }

                if (filteredOrders.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.shopping_cart_outlined,
                          size: 64,
                          color: AdminTheme.textSecondary,
                        ),
                        const SizedBox(height: MaasgaTokens.spacingMd),
                        const Text('Aucune commande trouvée'),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                  itemCount: filteredOrders.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.only(
                        bottom: MaasgaTokens.spacingSm,
                      ),
                      child: OrderCard(
                        order: filteredOrders[index],
                        onStatusChange: (newStatus) {
                          ref.read(
                            orderStatusUpdateProvider((
                              id: filteredOrders[index].id,
                              status: newStatus,
                            )),
                          );
                        },
                        onCancel: () {
                          ref.read(
                            orderCancelProvider(filteredOrders[index].id),
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
