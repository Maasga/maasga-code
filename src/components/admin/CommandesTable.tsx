import { useState, useMemo, useCallback } from 'react';
import { Order } from '../data/store';

interface CommandesTableProps {
  orders: Order[];
  payments: any[];
  onUpdateStatus: (orderId: number, newStatus: string) => void;
  onOpenDevisModal: (orderId: number, clientName: string, clientPhone: string) => void;
  onDeleteOrder: (orderId: number) => void;
  onExportOrders: () => void;
}

export const CommandesTable = ({
  orders,
  payments,
  onUpdateStatus,
  onOpenDevisModal,
  onDeleteOrder,
  onExportOrders
}: CommandesTableProps) => {
  // State for table UI controls
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'id', 'client', 'productNotes', 'amount', 'payment', 'status', 'date', 'actions'
  ]));
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());

  // Helper to check if a column should be visible
  const isColumnVisible = (column: string) => visibleColumns.has(column);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return orders;

    const query = searchQuery.toLowerCase().trim();
    return orders.filter(order =>
      order.client_name.toLowerCase().includes(query) ||
      order.client_phone.includes(query) ||
      (order.notes?.toLowerCase().includes(query) ?? false) ||
      order.total_price?.toString().includes(query) ||
      order.client_email?.toLowerCase().includes(query)?.includes(query) ?? false
    );
  }, [orders, searchQuery]);

  // Sorting functionality
  const sortedOrders = useMemo(() => {
    if (!sortConfig.key) return searchResults;

    return [...searchResults].sort((a, b) => {
      if (sortConfig.key === 'id') {
        return sortConfig.direction === 'asc'
          ? a.id - b.id
          : b.id - a.id;
      }

      if (sortConfig.key === 'amount') {
        const valA = a.total_price ?? 0;
        const valB = b.total_price ?? 0;
        return sortConfig.direction === 'asc'
          ? valA - valB
          : valB - valA;
      }

      if (sortConfig.key === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortConfig.direction === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }

      // For string fields
      const valueA = a[sortConfig.key as keyof Order] ?? '';
      const valueB = b[sortConfig.key as keyof Order] ?? '';

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortConfig.direction === 'asc'
          ? valueA.localeCompare(valueB, 'fr')
          : valueB.localeCompare(valueA, 'fr');
      }

      return 0;
    });
  }, [searchResults, sortConfig]);

  // Payment mapping
  const paymentsByOrder = useMemo(() => {
    const map: Record<number, any> = {};
    payments.forEach((p: any) => { if (p.order_id) paymentsByOrder[p.order_id] = p });
    return map;
  }, [payments]);

  // Status helper (moved from component for reuse)
  const statusInfo = (status: string, hasPayment: boolean) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      'en_attente': { label: '⏳ En attente', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
      'contacte': { label: '💬 Client contacté', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
      'confirme': { label: '✅ Confirmée', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
      'en_livraison': { label: '🚚 En livraison', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
      'livre': { label: '🏠 Livrée & Installée', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      'annule': { label: '❌ Annulée', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
    };
    return map[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  };

  // Handle sort change
  const handleSortChange = useCallback((key: keyof Order | null) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Handle search change with debounce
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Handle column visibility toggle
  const toggleColumnVisibility = useCallback((column: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  }, []);

  // Handle row selection
  const toggleOrderSelection = useCallback((orderId: number) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  // Check if all visible orders are selected
  const isAllVisibleOrdersSelected = useMemo(() => {
    if (sortedOrders.length === 0) return false;
    return sortedOrders.every(order => selectedOrderIds.has(order.id));
  }, [sortedOrders, selectedOrderIds]);

  // Select/deselect all visible orders
  const toggleAllVisibleOrders = useCallback(() => {
    if (isAllVisibleOrdersSelected) {
      setSelectedOrderIds(new Set());
    } else {
      const newSet = new Set(selectedOrderIds);
      sortedOrders.forEach(order => newSet.add(order.id));
      setSelectedOrderIds(newSet);
    }
  }, [isAllVisibleOrdersSelected, selectedOrderIds, sortedOrders]);

  // Export selected orders
  const handleExportSelected = useCallback(() => {
    // In a real implementation, this would export selected orders
    alert(`Exporting ${selectedOrderIds.size} selected orders`);
  }, [selectedOrderIds]);

  // Get status options based on current status
  const getStatusOptions = useCallback((currentStatus: string) => {
    const options: Array<{ value: string; label: string }> = [];

    const statusMap: Record<string, string> = {
      en_attente: '⏳ En attente',
      contacte: '💬 Client contacté',
      confirme: '✅ Confirmée',
      en_livraison: '🚚 En livraison',
      livre: '🏠 Livrée & Installée',
      annule: '❌ Annulée'
    };

    // Add current status as first option (disabled/selected)
    options.push({ value: currentStatus, label: statusMap[currentStatus] || currentStatus });

    // Add transition options based on current status
    switch (currentStatus) {
      case 'en_attente':
        options.push({ value: 'contacte', label: '→ Marquer contacté' });
        break;
      case 'contacte':
        options.push({ value: 'confirme', label: '→ Marquer confirmée' });
        break;
      case 'confirme':
        options.push({ value: 'en_livraison', label: '→ Envoyer en livraison' });
        break;
      case 'en_livraison':
        options.push({ value: 'livre', label: '→ Marquer livrée & installée' });
        break;
      default:
        if (currentStatus !== 'livre' && currentStatus !== 'annule') {
          options.push({ value: 'annule', label: '⛔ Annuler' });
        }
        break;
    }

    return options;
  }, []);

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher commandes..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-64 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
          </div>

          {/* Export Button */}
          <button
            onClick={onExportOrders}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20"
          >
            <i className="fas fa-file-csv"></i>
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Afficher :</span>
          <button
            onClick={() => toggleColumnVisibility('client')}
            className={`px-3 py-1 rounded ${visibleColumns.has('client') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/20 text-gray-400'}`}
          >
            Client
          </button>
          <button
            onClick={() => toggleColumnVisibility('productNotes')}
            className={`px-3 py-1 rounded ${visibleColumns.has('productNotes') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/20 text-gray-400'}`}
          >
            Produit/Notes
          </button>
          <button
            onClick={() => toggleColumnVisibility('amount')}
            className={`px-3 py-1 rounded ${visibleColumns.has('amount') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/20 text-gray-400'}`}
          >
            Montant
          </button>
          <button
            onClick={() => toggleColumnVisibility('payment')}
            className={`px-3 py-1 rounded ${visibleColumns.has('payment') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/20 text-gray-400'}`}
          >
            Paiement
          </button>
          <button
            onClick={() => toggleColumnVisibility('status')}
            className={`px-3 py-1 rounded ${visibleColumns.has('status') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/20 text-gray-400'}`}
          >
            Statut
          </button>
          <button
            onClick={() => toggleColumnVisibility('date')}
            className={`px-3 py-1 rounded ${visibleColumns.has('date') ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/20 text-gray-400'}`}
          >
            Date
          </button>
        </div>
      </div>

      {/* Selection Controls (if any orders selected) */}
      {selectedOrderIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-800/50 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{selectedOrderIds.size} commande{sélectionnée}s</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAllVisibleOrders}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium ${isAllVisibleOrdersSelected ? 'bg-red-500/20 text-red-400' : 'bg-gray-800/20 text-gray-400'}`}
            >
              {isAllVisibleOrdersSelected ? 'Désélectionner tout' : 'Sélectionner tout visible'}
            </button>
            <button
              onClick={handleExportSelected}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20"
              disabled={selectedOrderIds.size === 0}
            >
              <i className="fas fa-file-export"></i>
              Exporter sélection
            </button>
            <button
              onClick={() => {
                // Bulk status change would go here
                alert(`Changing status for ${selectedOrderIds.size} selected orders`);
              }}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/20"
              disabled={selectedOrderIds.size === 0}
            >
              <i className="fas fa-exchange-alt"></i>
              Statut en lot
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {sortedOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900/30">
              <tr>
                {isColumnVisible('id') && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell cursor-pointer" onClick={() => handleSortChange('id')}>
                    #ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                )}
                {isColumnVisible('client') && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('client_name')}>
                    Client {sortConfig.key === 'client_name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                )}
                {isColumnVisible('productNotes') && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell cursor-pointer" onClick={() => handleSortChange('notes')}>
                    Produit / Notes {sortConfig.key === 'notes' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                )}
                {isColumnVisible('amount') && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('total_price')}>
                    Montant {sortConfig.key === 'total_price' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                )}
                {isColumnVisible('payment') && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell cursor-pointer" onClick={() => handleSortChange('id')}> {/* Sort by payment status would need custom logic */}
                    Paiement {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                )}
                {isColumnVisible('status') && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSortChange('status')}>
                    Statut {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                )}
                {isColumnVisible('date') && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell cursor-pointer" onClick={() => handleSortChange('created_at')}>
                    Date {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                  </th>
                )}
                {isColumnVisible('actions') && (
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30" data-paginate="15">
              {sortedOrders.map(order => {
                const payment = paymentsByOrder[order.id];
                const si = statusInfo(order.status, !!payment);
                const paymentStatus = payment ?
                  (payment.status === 'completed' ? '✅ Payé' :
                   payment.status === 'pending' ? '⏳ En attente' :
                   payment.status === 'failed' ? '❌ Échoué' :
                   payment.status) : '—';
                const paymentColor = payment ?
                  (payment.status === 'completed' ? '#34d399' :
                   payment.status === 'pending' ? '#fbbf24' :
                   '#f87171') : '#94a3b8';

                const isSelected = selectedOrderIds.has(order.id);

                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-800/20 transition-colors ${isSelected ? 'bg-blue-500/20' : ''}`}
                    data-order-id={String(order.id)}
                  >
                    {isColumnVisible('id') && (
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono font-bold hidden lg:table-cell">
                        #CMD-{String(order.id).padStart(4, '0')}
                      </td>
                    )}
                    {isColumnVisible('client') && (
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-200 text-sm">{order.client_name}</div>
                        <div className="text-xs text-gray-500">{order.client_phone}</div>
                      </td>
                    )}
                    {isColumnVisible('productNotes') && (
                      <td className="py-3 px-4 text-xs text-gray-400 max-w-[200px] truncate hidden md:table-cell">
                        {order.notes || '—'}
                      </td>
                    )}
                    {isColumnVisible('amount') && (
                      <td className="py-3 px-4 text-sm font-bold text-white">
                        {order.total_price ? order.total_price.toLocaleString('fr-FR') + ' F' : '—'}
                      </td>
                    )}
                    {isColumnVisible('payment') && (
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className={`text-xs font-semibold`} style={{ color: paymentColor }}>
                          {paymentStatus}
                        </span>
                        {payment?.method && (
                          <div className="text-[10px] text-gray-500 mt-0.5">{payment.method}</div>
                        )}
                      </td>
                    )}
                    {isColumnVisible('status') && (
                      <td className="py-3 px-4">
                        {/* Status badge that opens a modal for status change */}
                        <div className="relative">
                          <span
                            onClick={() => {
                              // In a real implementation, this would open a status change modal
                              alert(`Change status for order ${order.id}`);
                            }}
                            className="status-badge text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer"
                            style={{ background: si.bg, color: si.color }}
                          >
                            {si.label}
                          </span>
                          {/* Tooltip with more details */}
                          <div className="absolute left-0 top-full mt-2 w-48 p-2 bg-gray-800 text-xs rounded hidden">
                            {si.label}
                          </div>
                        </div>
                      </td>
                    )}
                    {isColumnVisible('date') && (
                      <td className="py-3 px-4 text-xs text-gray-500 hidden sm:table-cell">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    )}
                    {isColumnVisible('actions') && (
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Action Menu (Kebob) */}
                          <div className="relative">
                            <button
                              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                              aria-label="Actions pour cette commande"
                            >
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 p-2 bg-gray-800 text-xs rounded z-10 hidden">
                              {/* Menu items would go here */}
                              <div className="py-1">Créer devis</div>
                              <div className="py-1 border-t border-gray-700">Facture</div>
                              <div className="py-1 border-t border-gray-700">Supprimer</div>
                            </div>
                          </div>

                          {/* Individual Action Buttons (fallback for now) */}
                          {[confirme, 'en_livraison', 'livre'].includes(order.status) && (
                            <button
                              onClick={() => onOpenDevisModal(order.id, order.client_name, order.client_phone)}
                              className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                              style="background:rgba(245,158,11,0.12); color:#f59e0b; border:1px solid rgba(245,158,11,0.2);"
                            >
                              <i className="fas fa-file-invoice-dollar mr-1"></i>Créer devis
                            </button>
                          )}
                          <a
                            href={`/api/order/invoice/${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                            style="background:rgba(16,185,129,0.12); color:#34d399;"
                          >
                            <i className="fas fa-file-invoice mr-1"></i>Facture
                          </a>
                          <a
                            href={`/admin/devis/new?order_id=${order.id}`}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                            style="background:rgba(239,68,68,0.12); color:#f87171;"
                          >
                            <i className="fas fa-file-pdf mr-1"></i>Devis
                          </a>
                          <form
                            method="post"
                            action="/api/admin/commande/delete"
                            style="display:inline"
                            onsubmit="return confirm('Supprimer cette commande ?')"
                          >
                            <input type="hidden" name="id" value={String(order.id)} />
                            <button type="submit" className="text-xs px-2 py-1.5 rounded-lg font-medium" style="background:rgba(239,68,68,0.15); color:#f87171;">
                              <i className="fas fa-trash"></i>
                            </button>
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center" style="background:rgba(15,23,42,0.4);">
          <i className="fas fa-shopping-cart text-3xl text-gray-600 mb-3"></i>
          <p className="text-gray-400">{searchQuery ? `Aucune commande trouvée pour "${searchQuery}"` : 'Aucune commande en ligne pour le moment'}</p>
          {!searchQuery && (
            <button
              onClick={onExportOrders}
              className="mt-4 flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20"
            >
              <i className="fas fa-file-csv"></i>
              Exporter les commandes
            </button>
          )}
        </div>
      )}
    </div>
  );
};