import { useState } from 'react';
import { Client } from '../data/store';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientDetailModal = ({
  client,
  isOpen,
  onClose
}: ClientDetailModalProps) => {
  const [editing, setEditing] = useState(false);
  const [localClient, setLocalClient] = useState<Client | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Initialize local client when prop changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Using useEffect to update local client when the prop client changes
  // This is safe because we only run when client prop actually changes
  // and we cleanup properly by setting localClient to null when client is null
  // and we don't have infinite loops because we only set when client exists
  // and we don't depend on editing or saveStatus which could cause loops

  // Actually, let's not use useEffect here to avoid complexity
  // Instead, we'll initialize in the component logic

  const handleSave = async () => {
    if (!localClient) return;

    setSaveStatus({ message: 'Sauvegarde en cours...', type: 'success' });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // In a real app, this would be an API call
      // await updateClientAPI(localClient.id, localClient);
      // For now, we'll just update the local state and simulate success
      // In a real implementation, you would call onUpdateClient if provided

      setSaveStatus({ message: 'Modifications sauvegardées avec succès !', type: 'success' });
      setEditing(false);

      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus({ message: 'Erreur lors de la sauvegarde', type: 'error' });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (!isOpen || !client) return null;

  // Initialize localClient with client data when modal opens
  // We do this outside of useEffect to avoid potential issues
  const initializedLocalClient = localClient || { ...client };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <i className="fas fa-times text-gray-400"></i>
        </button>

        <div className="flex h-full">
          {/* Sidebar - Client Info */}
          <div className="w-64 border-r border-gray-700/30 bg-gray-900/50 flex flex-col">
            <div className="p-4">
              <h3 className="font-bold text-white mb-4">Détails du client</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <i className="fas fa-hashtag mr-2 text-gray-500"></i>
                  <span className="font-mono text-gray-300">#{String(client.id).padStart(4, '0')}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-user mr-2 text-gray-500"></i>
                  <span className="text-gray-300">{client.name}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-envelope mr-2 text-gray-500"></i>
                  <span className="text-gray-300">{client.email || '—'}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-phone mr-2 text-gray-500"></i>
                  <span className="text-gray-300">{client.phone}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-map-marker-alt mr-2 text-gray-500"></i>
                  <span className="text-gray-300">{client.quartier || '—'}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-calendar mr-2 text-gray-500"></i>
                  <span className="text-gray-300">{new Date(client.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Client Information */}
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-white mb-2">Informations du client</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Nom complet</p>
                    <p className="text-lg font-bold text-white">{client.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-lg font-bold text-white">{client.email || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="text-lg font-bold text-white">{client.phone}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Quartier</p>
                      <p className="text-lg font-bold text-white">{client.quartier || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>

                {client.notes && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-300 mb-2">Notes</h3>
                    <p className="text-gray-300">{client.notes}</p>
                  </div>
                )}
              </div>

              {/* Statistics Section */}
              <div>
                <h3 className="font-semibold text-gray-300 mb-2">Statistiques et activité</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Commandes totales</h4>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">À calculer</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Visites maintenance</h4>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">À calculer</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Demandes en cours</h4>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-xs text-gray-400">À calculer</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Dernière activité</h4>
                    <p className="text-xl font-bold text-white">—</p>
                    <p className="text-xs text-gray-400">Aucune</p>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-300 mb-2">Actions rapides</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="flex-1 md:flex-none px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 rounded-lg flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-file-invoice-dollar"></i>
                    <span>Nouvelle commande</span>
                  </button>
                  <button
                    className="flex-1 md:flex-none px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20 rounded-lg flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-calendar-plus"></i>
                    <span>Nouveau RDV</span>
                  </button>
                  <button
                    className="flex-1 md:flex-none px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/20 rounded-lg flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-tools"></i>
                    <span>Demande maintenance</span>
                  </button>
                </div>

                {/* Edit section */}
                <div className="mt-4">
                  {editing ? (
                    <>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
                          <input
                            type="text"
                            value={localClient?.name || ''}
                            onChange={(e) => setLocalClient(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full p-3 rounded border fokus:ring-2 fokus:ring-blue-400 bg-gray-800/50 text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                          <input
                            type="email"
                            value={localClient?.email || ''}
                            onChange={(e) => setLocalClient(prev => prev ? { ...prev, email: e.target.value || null } : null)}
                            className="w-full p-3 rounded border fokus:ring-2 fokus:ring-blue-400 bg-gray-800/50 text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Téléphone</label>
                          <input
                            type="tel"
                            value={localClient?.phone || ''}
                            onChange={(e) => setLocalClient(prev => prev ? { ...prev, phone: e.target.value } : null)}
                            className="w-full p-3 rounded border fokus:ring-2 fokus:ring-blue-400 bg-gray-800/50 text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Quartier</label>
                          <input
                            type="text"
                            value={localClient?.quartier || ''}
                            onChange={(e) => setLocalClient(prev => prev ? { ...prev, quartier: e.target.value || null } : null)}
                            className="w-full p-3 rounded border fokus:ring-2 fokus:ring-blue-400 bg-gray-800/50 text-white placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                          <textarea
                            value={localClient?.notes || ''}
                            onChange={(e) => setLocalClient(prev => prev ? { ...prev, notes: e.target.value } : null)}
                            rows={3}
                            className="w-full p-3 rounded border fokus:ring-2 fokus:ring-blue-400 bg-gray-800/50 text-white placeholder-gray-400"
                          />
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20"
                          >
                            Sauvegarder
                          </button>
                          <button
                            onClick={() => {
                              setLocalClient({ ...client }); // Reset to original
                              setEditing(false);
                            }}
                            className="px-4 py-2 rounded bg-gray-800/50 hover:bg-gray-800/70 text-gray-300 ml-2"
                          >
                            Annuler
                          </button>
                        </div>
                      </>
                    )}
                  )}
                  <div>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 rounded bg-gray-800/50 hover:bg-gray-800/70 text-gray-300"
                      >
                        Modifier les informations
                      </button>
                    )}
                  </div>
                  {saveStatus && (
                    <div className="mt-3 p-3 rounded-lg" style={{
                      background: saveStatus.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)',
                      border: `1px solid ${saveStatus.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}`,
                      color: saveStatus.type === 'success' ? '#34d399' : '#f87171'
                    }}>
                      {saveStatus.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};