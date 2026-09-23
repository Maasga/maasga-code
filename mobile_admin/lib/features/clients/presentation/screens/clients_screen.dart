import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/providers/client_provider.dart';
import '../../data/models/client.dart';
import '../widgets/client_form.dart';
import '../../../../shared/design_tokens/maasga_tokens.dart';
import '../../../../core/theme/admin_theme.dart';

class ClientsScreen extends ConsumerStatefulWidget {
  const ClientsScreen({super.key});

  @override
  ConsumerState<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends ConsumerState<ClientsScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final clientsAsync = ref.watch(clientsProvider);

    return Scaffold(
      body: Column(
        children: [
          // Header avec recherche
          Container(
            padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
            decoration: BoxDecoration(
              color: AdminTheme.surface,
              border: Border(bottom: BorderSide(color: AdminTheme.border)),
            ),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Rechercher un client...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: AdminTheme.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(MaasgaTokens.radiusMd),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),
          ),

          // Liste des clients
          Expanded(
            child: clientsAsync.when(
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
                      onPressed: () => ref.invalidate(clientsProvider),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              ),
              data: (clients) {
                // Filtrer les clients
                List<Client> filteredClients = clients;
                if (_searchQuery.isNotEmpty) {
                  filteredClients = filteredClients
                      .where(
                        (c) =>
                            c.name.toLowerCase().contains(
                              _searchQuery.toLowerCase(),
                            ) ||
                            c.phone.contains(_searchQuery) ||
                            (c.email?.toLowerCase().contains(
                                  _searchQuery.toLowerCase(),
                                ) ??
                                false),
                      )
                      .toList();
                }

                if (filteredClients.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64,
                          color: AdminTheme.textSecondary,
                        ),
                        const SizedBox(height: MaasgaTokens.spacingMd),
                        const Text('Aucun client trouvé'),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(MaasgaTokens.spacingMd),
                  itemCount: filteredClients.length,
                  itemBuilder: (context, index) {
                    return Card(
                      margin: const EdgeInsets.only(
                        bottom: MaasgaTokens.spacingSm,
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AdminTheme.primary,
                          child: Text(
                            filteredClients[index].name[0].toUpperCase(),
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        title: Text(filteredClients[index].name),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(filteredClients[index].formattedPhone),
                            if (filteredClients[index].quartier != null)
                              Text(filteredClients[index].quartier!),
                          ],
                        ),
                        trailing: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (filteredClients[index].orderCount > 0)
                              Badge(
                                label: Text(
                                  '${filteredClients[index].orderCount}',
                                ),
                                backgroundColor: AdminTheme.primary,
                              ),
                            if (filteredClients[index].rdvCount > 0)
                              Badge(
                                label: Text(
                                  '${filteredClients[index].rdvCount} RDV',
                                ),
                                backgroundColor: AdminTheme.accent,
                              ),
                          ],
                        ),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => Scaffold(
                                appBar: AppBar(
                                  title: Text(filteredClients[index].name),
                                ),
                                body: ClientForm(
                                  client: filteredClients[index],
                                  onSave: (client) {
                                    ref.invalidate(clientsProvider);
                                  },
                                ),
                              ),
                            ),
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
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => Scaffold(
                appBar: AppBar(title: const Text('Nouveau client')),
                body: ClientForm(
                  onSave: (client) {
                    ref.invalidate(clientsProvider);
                  },
                ),
              ),
            ),
          );
        },
        backgroundColor: AdminTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
