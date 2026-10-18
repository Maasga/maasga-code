// Admin Tab Component
import { products } from '../../../data/products'
import {
  reviews,
  appointments,
  orders,
  clients,
  maintenanceDueCount,
  pendingMaintenanceContractsCount,
  pendingMaintenanceRequestsCount,
  pendingMaintenanceContracts,
  notifications
} from '../../../data/store'
import { SITE_URL } from '../../../types'
import { LIBELLES_CHAMPS, COLONNES_MODELE, CATEGORIES, MAX_LIGNES_PAR_LOT } from '../../../utils/importProduits'
import { useAdminCommandesData } from '../../../hooks/useAdminCommandesData'
import { useAdminMaintenanceData } from '../../../hooks/useAdminMaintenanceData'
import { CommandesTable } from '../CommandesTable'
import { CommandesKPIs } from '../CommandesKPIs'
import { CommandesProcessDiagram } from '../CommandesProcessDiagram'
import { OrderDetailModal } from '../OrderDetailModal'
import { BulkActionsToolbar } from '../BulkActionsToolbar'
import { AdminLayout, jsonForScript, jsAttr, CLIENT_ESC_HELPER } from '../AdminLayout'

export const AdminCommandesPage = ({ payments = [] }: { payments?: any[] } = {}) => {
  const { onlineOrders, terrainOrders, pendingAppointments, paymentsByOrder } = useAdminCommandesData();
  const selectedOrderId: number | null = null;
  const isOrderDetailOpen = false;
  const selectedClientId: number | null = null;
  const isClientDetailOpen = false;
  const selectedOrderIds = new Set<number>();

  // Handler functions
  const handleUpdateStatus = (orderId: number, newStatus: string) => {
    // In a real app, this would call an API
    console.log(`Updating order ${orderId} status to ${newStatus}`);
    // For now, we'll just update optimistically - in reality, we'd refetch or update state
  };

  const handleOpenDevisModal = (orderId: number, clientName: string, clientPhone: string) => {
    // This would open the devis creation modal - simplified for now
    console.log(`Opening devis modal for order ${orderId}`);
  };

  const handleDeleteOrder = (orderId: number) => {
    if (window.confirm('Supprimer cette commande ?')) {
      // This would call the delete API
      console.log(`Deleting order ${orderId}`);
      // In a real app, we'd remove from state or refetch
    }
  };

  const handleExportOrders = () => {
    // This would trigger CSV export
    console.log('Exporting orders to CSV');
  };

  const handleOpenClientDetail = (_clientId: number) => { /* SSR — géré côté client */ };
  const handleCloseClientDetail = () => { /* SSR — géré côté client */ };

  const handleBulkStatusChange = (status: string) => {
    console.log(`Changing status to ${status} for ${selectedOrderIds.size} selected orders`);
    // This would call bulk update API
  };

  const handleBulkExport = () => {
    console.log(`Exporting ${selectedOrderIds.size} selected orders`);
    // This would trigger export of selected orders
  };

  const handleBulkDelete = () => {
    if (typeof window !== 'undefined' && window.confirm(`Supprimer les commandes sélectionnées ? Cette action est irréversible.`)) {
      console.log(`Deleting selected orders`);
    }
  };

  const handleClearSelection = () => { /* SSR */ };

  return (
    <AdminLayout activePage="commandes">
      <>
        {/* Order Detail Modal */}
        <OrderDetailModal
          order={onlineOrders.find(o => o.id === selectedOrderId) || null}
          payment={paymentsByOrder[selectedOrderId ?? -1]}
          isOpen={isOrderDetailOpen}
          onClose={() => {}}
          onUpdateOrder={handleUpdateStatus}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Gestion des commandes</h2>
            <p className="text-sm text-gray-400 mt-1">Commandes en ligne, commandes terrain et historique</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportOrders}
              className="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <i className="fas fa-file-csv"></i>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Bulk actions script */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.adminSelectedIds = window.adminSelectedIds || new Set();

          window.adminBulkAction = window.adminBulkAction || function(type) {
            var ids = Array.from(window.adminSelectedIds);
            if (!ids.length) {
              if (typeof window.showToast === 'function') window.showToast('Aucune commande sélectionnée.', 'warning');
              return;
            }
            if (type === 'status') {
              var newStatus = prompt('Nouveau statut : en_attente | contacte | confirme | en_livraison | livre | annule');
              if (!newStatus) return;
              fetch('/api/admin/commandes/bulk-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: ids, status: newStatus })
              }).then(function(r) { return r.json(); })
                .then(function(d) {
                  if (typeof window.showToast === 'function') window.showToast((d.updated || 0) + ' commande(s) mise(s) à jour.', 'success');
                  setTimeout(function() { location.reload(); }, 1200);
                })
                .catch(function() { if (typeof window.showToast === 'function') window.showToast('Erreur réseau.', 'error'); });
            } else if (type === 'export') {
              window.location.href = '/api/admin/commandes/export?ids=' + ids.join(',');
            } else if (type === 'delete') {
              if (!confirm('Supprimer ' + ids.length + ' commande(s) ? Cette action est irréversible.')) return;
              fetch('/api/admin/commandes/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: ids })
              }).then(function(r) { return r.json(); })
                .then(function(d) {
                  if (typeof window.showToast === 'function') window.showToast((d.deleted || 0) + ' commande(s) supprimée(s).', 'success');
                  setTimeout(function() { location.reload(); }, 1200);
                })
                .catch(function() { if (typeof window.showToast === 'function') window.showToast('Erreur réseau.', 'error'); });
            }
          };

          window.adminClearSelection = window.adminClearSelection || function() {
            window.adminSelectedIds = window.adminSelectedIds || new Set();
            window.adminSelectedIds.clear();
            document.querySelectorAll('.order-checkbox').forEach(function(cb) { cb.checked = false; });
            var toolbar = document.getElementById('bulk-toolbar');
            if (toolbar) toolbar.style.display = 'none';
          };
        `}} />

        {/* Selection Controls */}
        {selectedOrderIds.size > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedOrderIds.size}
            totalCount={onlineOrders.length + terrainOrders.length}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkExport={handleBulkExport}
            onBulkDelete={handleBulkDelete}
            onClearSelection={handleClearSelection}
          />
        )}

        {/* KPIs commandes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {[
            {
              label: "Total commandes",
              val: onlineOrders.length + terrainOrders.length,
              icon: "fa-shopping-bag",
              bg: "rgba(59,130,246,0.1)",
              border: "rgba(59,130,246,0.2)",
              color: "#60a5fa"
            },
            {
              label: "Payées",
              val: onlineOrders.filter(o => o.status === 'confirme' || o.status === 'en_livraison' || o.status === 'livre').length +
                   terrainOrders.filter(o => o.status === 'confirme' || o.status === 'en_livraison' || o.status === 'livre').length,
              icon: "fa-credit-card",
              bg: "rgba(16,185,129,0.1)",
              border: "rgba(16,185,129,0.2)",
              color: "#34d399"
            },
            {
              label: "Installées",
              val: onlineOrders.filter(o => o.status === 'livre').length +
                   terrainOrders.filter(o => o.status === 'livre').length,
              icon: "fa-tools",
              bg: "rgba(56,189,248,0.1)",
              border: "rgba(56,189,248,0.2)",
              color: "#38bdf8"
            },
            {
              label: "En attente",
              val: onlineOrders.filter(o => !o.appointment_id && (o.type === 'vente' || o.type === 'commande') && o.status === 'en_attente').length +
                   terrainOrders.filter(o => o.status === 'en_attente').length,
              icon: "fa-hourglass-half",
              bg: "rgba(251,191,36,0.1)",
              border: "rgba(251,191,36,0.2)",
              color: "#fbbf24"
            },
            {
              label: "CA total",
              val: (onlineOrders.reduce((sum, o) => sum + (o.total_price || 0), 0) +
                   terrainOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)).toLocaleString('fr-FR') + ' F',
              icon: "fa-coins",
              bg: "rgba(251,191,36,0.1)",
              border: "rgba(251,191,36,0.2)",
              color: "#fbbf24"
            }
          ].map((kpi, index) => (
            <div key={index} className="rounded-xl p-4 card-shadow" style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: kpi.bg }}>
                  <i className={`fas ${kpi.icon} text-lg`} style={{ color: kpi.color }}></i>
                </div>
                <div>
                  <div className="text-xl font-bold leading-none" style={{ color: 'var(--admin-text-primary)' }}>{kpi.val}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>{kpi.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deux processus possibles */}
        <div class="mb-6">
          <CommandesProcessDiagram
            selectedOrderId={selectedOrderId}
            onSelectOrder={() => {}}
          />
        </div>

        {/* ============================================ */}
        {/* SECTION 1: COMMANDES EN LIGNE (catalogue)   */}
        {/* ============================================ */}
        <div className="rounded-2xl card-shadow overflow-hidden mb-6" style={{ background: 'rgba(52,211,153,0.06)', border: '2px solid rgba(52,211,153,0.25)' }}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(52,211,153,0.15)' }}>
            <div>
              <h3 className="font-bold text-white flex items-center space-x-2">
                <i className="fas fa-shopping-cart text-green-400"></i>
                <span>Commandes en ligne</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Achats depuis le catalogue — paiement direct, pas de validation terrain</p>
            </div>
            <span className="text-lg font-bold text-green-400 px-3 py-1 rounded-lg" style={{ background: 'rgba(52,211,153,0.12)' }}>{onlineOrders.length}</span>
          </div>
          {onlineOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <CommandesTable
                orders={onlineOrders}
                payments={payments}
                onUpdateStatus={handleUpdateStatus}
                onOpenDevisModal={handleOpenDevisModal}
                onDeleteOrder={handleDeleteOrder}
                onExportOrders={handleExportOrders}
                onClientClick={handleOpenClientDetail}
              />
            </div>
          ) : (
            <div className="p-8 text-center" style={{ background: 'var(--admin-bg-elevated)' }}>
              <i className="fas fa-shopping-cart text-3xl mb-3" style={{ color: 'var(--admin-text-muted)' }}></i>
              <p style={{ color: 'var(--admin-text-muted)' }}>Aucune commande en ligne pour le moment</p>
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* SECTION 2: Commandes TERRAIN (depuis RDV)    */}
        {/* ============================================ */}
        <div className="rounded-2xl card-shadow overflow-hidden mb-6" style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)' }}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(148,180,220,0.08)' }}>
            <div>
              <h3 className="font-semibold text-gray-200 flex items-center space-x-2">
                <i className="fas fa-map-marked-alt text-blue-400"></i>
                <span>Commandes terrain</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Créées depuis la validation terrain d'un RDV</p>
            </div>
            <span className="text-sm font-bold px-3 py-1 rounded-lg" style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)' }}>{terrainOrders.length}</span>
          </div>
          {terrainOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <CommandesTable
                orders={terrainOrders}
                payments={payments}
                onUpdateStatus={handleUpdateStatus}
                onOpenDevisModal={handleOpenDevisModal}
                onDeleteOrder={handleDeleteOrder}
                onExportOrders={handleExportOrders}
                onClientClick={handleOpenClientDetail}
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <i className="fas fa-inbox text-3xl text-gray-600 mb-3"></i>
              <p className="text-gray-400">Aucune commande terrain</p>
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* SECTION 3: RDV en attente (pour terrain)     */}
        {/* ============================================ */}
        <div className="rounded-2xl card-shadow overflow-hidden mb-6" style={{ background: 'rgba(234,179,8,0.06)', border: '2px solid rgba(234,179,8,0.25)' }}>
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(234,179,8,0.15)' }}>
            <div>
              <h3 className="font-bold text-white flex items-center space-x-2">
                <i className="fas fa-calendar-check text-orange-400"></i>
                <span>RDV en attente</span>
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">RDV prêts à être validés pour créer des commandes terrain</p>
            </div>
            <span className="text-lg font-bold text-orange-400 px-3 py-1 rounded-lg" style={{ background: 'rgba(234,179,8,0.12)' }}>{pendingAppointments.length}</span>
          </div>
          {pendingAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f1f5f9' }}>
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>Client</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--admin-text-muted)' }}>Téléphone</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--admin-text-muted)' }}>Quartier</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--admin-text-muted)' }}>Date RDV</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--admin-text-muted)' }}>Type</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>Localisation</th>
                    <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--admin-text-muted)' }}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--admin-border)' }} data-paginate="10">
                  {pendingAppointments.map(appointment => (
                    <tr key={appointment.id} className="hover:bg-[rgba(3,105,161,0.04)] transition-colors" data-appointment-id={String(appointment.id)}>
                      <td className="px-5 py-3">
                        <div className="text-sm font-semibold" style={{ color: 'var(--admin-text-primary)' }}>{appointment.name}</div>
                        <div className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>{appointment.phone}</div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <div className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>{appointment.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-xs hidden md:table-cell" style={{ color: 'var(--admin-text-primary)' }}><i className="fas fa-map-marker-alt text-primary-500 mr-1"></i>{appointment.quartier}</td>
                      <td className="px-5 py-3 text-xs hidden sm:table-cell" style={{ color: 'var(--admin-text-muted)' }}>{new Date(appointment.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-3 text-xs text-blue-200 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium`} style={{
                          background: appointment.type === 'devis' ? 'rgba(59,130,246,0.12)' :
                                    appointment.type === 'installation' ? 'rgba(167,139,250,0.12)' :
                                    appointment.type === 'entretien' ? 'rgba(245,158,11,0.12)' :
                                    appointment.type === 'depannage' ? 'rgba(248,113,113,0.12)' :
                                    'rgba(148,163,184,0.12)',
                          color: appointment.type === 'devis' ? '#60a5fa' :
                                  appointment.type === 'installation' ? '#a78bfa' :
                                  appointment.type === 'entretien' ? '#f59e0b' :
                                  appointment.type === 'depannage' ? '#f87171' :
                                  '#94a3b8'
                        }}>
                          {appointment.type === 'devis' ? 'Devis' :
                           appointment.type === 'installation' ? 'Installation' :
                           appointment.type === 'entretien' ? 'Entretien' :
                           appointment.type === 'depannage' ? 'Dépannage' :
                           appointment.type}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {appointment.latitude && appointment.longitude ? (
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-map-marked-alt text-xs text-gray-400 mr-1"></i>
                            <span className="text-xs">{appointment.latitude.toFixed(4)}, {appointment.longitude.toFixed(4)}</span>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: '#64748b' }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              // This would open the client detail modal
                              console.log(`Showing details for appointment ${appointment.id}`);
                            }}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}
                          >
                            <i className="fas fa-eye mr-1"></i>Voir détails
                          </button>
                          <button
                            onClick={() => {
                              // This would create a terrain order from the appointment
                              console.log(`Creating terrain order from appointment ${appointment.id}`);
                            }}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                            style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}
                          >
                            <i className="fas fa-check mr-1"></i>Validation terrain terminée - Créer la commande
                          </button>
                          <button
                            onClick={() => {
                              // This would just validate the visit without creating an order
                              console.log(`Validating visit for appointment ${appointment.id}`);
                            }}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
                          >
                            <i className="fas fa-check-circle mr-1"></i>Valider la visite
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center" style={{ background: 'var(--admin-bg-elevated)' }}>
              <i className="fas fa-calendar text-3xl mb-3" style={{ color: 'var(--admin-text-muted)' }}></i>
              <p style={{ color: 'var(--admin-text-muted)' }}>Aucun RDV en attente</p>
            </div>
          )}
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            {
              label: "Commandes en ligne",
              val: onlineOrders.length,
              icon: "fa-shopping-cart",
              color: "#34d399",
              bg: "rgba(52,211,153,0.15)"
            },
            {
              label: "Commandes terrain",
              val: terrainOrders.length,
              icon: "fa-truck",
              color: "#60a5fa",
              bg: "rgba(59,130,246,0.15)"
            },
            {
              label: "RDV en attente",
              val: pendingAppointments.length,
              icon: "fa-calendar",
              color: "#fbbf24",
              bg: "rgba(251,191,36,0.15)"
            },
            {
              label: "Installations faites",
              val: onlineOrders.filter(o => o.status === 'livre').length +
                   terrainOrders.filter(o => o.status === 'livre').length,
              icon: "fa-tools",
              color: "#38bdf8",
              bg: "rgba(56,189,248,0.15)"
            }
          ].map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                  <i className={`fas ${stat.icon}`} style={{ color: stat.color }}></i>
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: '#64748b' }}>{stat.label}</div>
                  <div className="text-xl font-bold text-white">{stat.val}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    </AdminLayout>
  );
};
// ============================================================
// PAGE AVIS
// ============================================================
