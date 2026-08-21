import { useState } from 'react';
import { Order } from '../data/store';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrder: (orderId: number, updates: Partial<Order>) => void;
}

export const OrderDetailModal = ({
  order,
  isOpen,
  onClose,
  onUpdateOrder
}: OrderDetailModalProps) => {
  const [editing, setEditing] = useState(false);
  const [localOrder, setLocalOrder] = useState<Order | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Initialize local order when prop changes
  // Note: We're using useEffect here, which is allowed in components
  // react/exhaustive-deps would warn about missing deps, but we want to update when order changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (order) {
      setLocalOrder({ ...order });
    }
  }, [order]);

  const handleSave = async () => {
    if (!localOrder) return;

    setSaveStatus({ message: 'Sauvegarde en cours...', type: 'success' });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // In a real app, this would be an API call
      // await updateOrderAPI(localOrder.id, localOrder);
      onUpdateOrder(localOrder.id, { ...localOrder });

      setSaveStatus({ message: 'Modifications sauvegardées avec succès !', type: 'success' });
      setEditing(false);

      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus({ message: 'Erreur lors de la sauvegarde', type: 'error' });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <i className="fas fa-times text-gray-400"></i>
        </button>

        <div className="flex h-full">
          {/* Sidebar - Order Info */}
          <div className="w-64 border-r border-gray-700/30 bg-gray-900/50 flex flex-col">
            <div className="p-4">
              <h3 className="font-bold text-white mb-4">Détails de la commande</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <i className="fas fa-hashtag mr-2 text-gray-500"></i>
                  <span className="font-mono text-gray-300">#{String(order.id).padStart(4, '0')}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-user mr-2 text-gray-500"></i>
                  <span className="text-gray-300">{order.client_name}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-phone mr-2 text-gray-500"></i>
                  <span className="text-gray-300">{order.client_phone}</span>
                </div>
                {order.client_email && (
                  <div className="flex items-center">
                    <i className="fas fa-envelope mr-2 text-gray-500"></i>
                    <span className="text-gray-300">{order.client_email}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <i className="fas fa-map-marker-alt mr-2 text-gray-500"></i>
                  <span className="text-gray-300">{order.quartier || '—'}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-calendar mr-2 text-gray-500"></i>
                  <span className="text-gray-300">{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700/20">
                  <h4 className="font-semibold text-gray-300 mb-2">Type</h4>
                  <span className="px-3 py-1 rounded text-xs font-medium"
                    style={{
                      background: order.type === 'vente' ? 'rgba(16,185,129,0.2)' :
                                order.type === 'commande' ? 'rgba(59,130,246,0.2)' :
                                'rgba(148,163,184,0.2)',
                      color: order.type === 'vente' ? '#34d399' :
                              order.type === 'commande' ? '#60a5fa' :
                              '#94a3b8'
                    }}
                  >
                    {order.type === 'vente' ? 'Achat en ligne' :
                     order.type === 'commande' ? 'Commande' :
                     order.type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-white mb-2">Résumé de la commande</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Montant total</p>
                    <p className="text-2xl font-bold text-white">
                      {order.total_price ? order.total_price.toLocaleString('fr-FR') + ' F' : '—'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">Quantité</p>
                    <p className="text-2xl font-bold text-white">{order.quantity || 1}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold text-gray-300 mb-2">Status actuel</h3>
                  <span className="px-4 py-2 rounded-lg font-medium text-white"
                    style={{
                      background: order.status === 'en_attente' ? 'rgba(251,191,36,0.3)' :
                                order.status === 'contacte' ? 'rgba(59,130,246,0.3)' :
                                order.status === 'confirme' ? 'rgba(52,211,153,0.3)' :
                                order.status === 'en_livraison' ? 'rgba(167,139,250,0.3)' :
                                order.status === 'livre' ? 'rgba(16,185,129,0.3)' :
                                'rgba(248,113,113,0.3)',
                    }}
                  >
                    {order.status === 'en_attente' ? '⏳ En attente' :
                     order.status === 'contacte' ? '💬 Client contacté' :
                     order.status === 'confirme' ? '✅ Confirmée' :
                     order.status === 'en_livraison' ? '🚚 En livraison' :
                     order.status === 'livre' ? '🏠 Livrée & Installée' :
                     order.status === 'annule' ? '❌ Annulée' :
                     order.status}
                  </span>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h3 className="font-semibold text-gray-300 mb-2">Notes et observations</h3>
                {editing ? (
                  <textarea
                    value={localOrder?.notes || ''}
                    onChange={(e) => setLocalOrder(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    rows={4}
                    className="w-full p-3 rounded border fokus:ring-2 fokus:ring-blue-400 bg-gray-800/50 text-white placeholder-gray-400"
                    placeholder="Entrez les notes ici..."
                  />
                ) : (
                  <p className="text-gray-300">{order.notes || 'Aucune note'}</p>
                )}
                <div className="mt-2 flex items-center space-x-2">
                  {!editing && order.notes && (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-xs px-3 py-1 rounded bg-gray-800/50 hover:bg-gray-800/70 text-gray-300"
                    >
                      Modifier
                    </button>
                  )}
                  {editing && (
                    <>
                      <button
                        onClick={handleSave}
                        className="px-3 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => {
                          setLocalOrder({ ...order }); // Reset to original
                          setEditing(false);
                        }}
                        className="px-3 py-1 rounded bg-gray-800/50 hover:bg-gray-800/70 text-gray-300 ml-2"
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
                {saveStatus && (
                  <div className="mt-2 p-3 rounded-lg" style={{
                    background: saveStatus.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)',
                    border: `1px solid ${saveStatus.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}`,
                    color: saveStatus.type === 'success' ? '#34d399' : '#f87171'
                  }}>
                    {saveStatus.message}
                  </div>
                )}
              </div>

              {/* Products Section */}
              <div>
                <h3 className="font-semibold text-gray-300 mb-2">Produits commandés</h3>
                {/* In a real app, we would have a products relationship */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <i className="fas fa-box mr-2 text-gray-500"></i>
                    <span className="text-gray-300">Produit principal: {order.notes?.split('\n')[0] || 'Non spécifié'}</span>
                  </div>
                  {/* More product details would go here */}
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-300 mb-2">Informations de paiement</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <i className="fas fa-credit-card mr-2 text-gray-500"></i>
                    <span className="text-gray-300">Statut: {order.status === 'confirme' || order.status === 'en_livraison' || order.status === 'livre' ? 'Payé' : 'En attente'}</span>
                  </div>
                  {/* More payment details would go here with actual payment data */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};