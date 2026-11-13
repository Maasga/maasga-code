// CommandesTable — Hono JSX SSR (pas React).
// Rendu statique côté serveur. Recherche, tri, sélection gérés en JS natif côté client.
import type { Order } from '../../data/store';

interface CommandesTableProps {
  orders: Order[];
  payments: any[];
  onUpdateStatus?: (orderId: number, newStatus: string) => void;
  onOpenDevisModal?: (orderId: number, clientName: string, clientPhone: string) => void;
  onDeleteOrder?: (orderId: number) => void;
  onExportOrders?: () => void;
  onClientClick?: (clientId: number | null) => void;
  tableId?: string; // Pour différencier online vs terrain
  emptyMessage?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  en_attente:   { label: 'En attente',         color: '#d97706', bg: 'rgba(217,119,6,0.12)'   },
  contacte:     { label: 'Client contacté',    color: '#2563eb', bg: 'rgba(37,99,235,0.12)'   },
  confirme:     { label: 'Confirmée',           color: '#059669', bg: 'rgba(5,150,105,0.12)'   },
  en_livraison: { label: 'En livraison',        color: '#2563eb', bg: 'rgba(37,99,235,0.12)'   },
  livre:        { label: 'Livrée & Installée', color: '#0369a1', bg: 'rgba(3,105,161,0.12)'   },
  annule:       { label: 'Annulée',            color: '#dc2626', bg: 'rgba(220,38,38,0.12)'   },
};

export const CommandesTable = ({
  orders,
  payments,
  tableId = 'commandes-table',
  emptyMessage = 'Aucune commande pour le moment',
}: CommandesTableProps) => {
  const paymentsByOrder: Record<number, any> = {};
  payments.forEach((p: any) => { if (p.order_id) paymentsByOrder[p.order_id] = p; });

  if (orders.length === 0) {
    return (
      <div class="p-8 text-center rounded-2xl" style="background:rgba(15,23,42,0.4); border:1px solid rgba(var(--rgb-sky),0.06);">
        <i class="fas fa-shopping-cart text-3xl mb-3 text-fg-body"></i>
        <p class="text-fg-subtle">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div class="space-y-3">
      {/* Barre de recherche côté client */}
      <div class="flex items-center gap-3">
        <div class="relative flex-1 max-w-xs">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-fg-subtle"></i>
          <input
            type="text"
            placeholder="Rechercher..."
            oninput={`filterTable('${tableId}', this.value)`}
            class="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-admin-elevated border border-admin-line"
            style="color: var(--admin-text-primary);"
          />
        </div>
        <a
          href={`/api/admin/commandes/export?type=${tableId}`}
          class="text-xs px-3 py-2 rounded-xl font-semibold flex items-center gap-2 text-fg-success-alt"
          style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2);"
        >
          <i class="fas fa-file-csv"></i> Export CSV
        </a>
      </div>

      {/* Tableau */}
      <div class="bg-admin-card border border-admin-line" style="border-radius: var(--admin-radius);">
        <div class="overflow-x-auto">
        <table id={tableId} class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted">
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell text-admin-muted">#ID</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-admin-muted">Client</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell text-admin-muted">Produit / Notes</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-admin-muted">Montant</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-admin-muted">Statut</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell text-admin-muted">Date</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-admin-muted">Actions</th>
            </tr>
          </thead>
          <tbody data-paginate="20">
            {orders.map(order => {
              const si = STATUS_MAP[order.status] ?? { label: order.status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
              const payment = paymentsByOrder[order.id];
              const paymentLabel = payment
                ? (payment.status === 'completed' ? 'Payé' : payment.status === 'pending' ? 'Attente' : 'Échoué')
                : '—';

              return (
                <tr
                  key={order.id}
                  data-search={`${order.client_name} ${order.client_phone} ${order.client_email || ''} ${order.notes || ''} ${order.quartier || ''} ${order.type || ''} ${order.status} CMD-${String(order.id).padStart(4,'0')}`}
                  class="border-t hover:bg-[rgba(3,105,161,0.04)] transition-colors"
                  style="border-color: var(--admin-border);"
                >
                  <td class="py-3 px-4 text-xs font-mono font-bold hidden lg:table-cell text-fg-muted">
                    #CMD-{String(order.id).padStart(4, '0')}
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-semibold text-sm" style="color: var(--admin-text-primary);">{order.client_name}</div>
                    <div class="text-xs text-admin-muted">{order.client_phone}</div>
                    {payment && <div class="text-xs mt-0.5 text-admin-muted">{paymentLabel}</div>}
                  </td>
                  <td class="py-3 px-4 text-xs hidden md:table-cell text-admin-muted" title={order.notes || ''}>
                    <span class="overflow-hidden" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">{order.notes || '—'}</span>
                  </td>
                  <td class="py-3 px-4 text-sm font-bold" style="color: var(--admin-text-primary);">
                    {order.total_price ? order.total_price.toLocaleString('fr-FR') + ' F' : '—'}
                  </td>
                  <td class="py-3 px-4">
                    <form method="post" action="/api/admin/commande/status" class="inline">
                      <input type="hidden" name="id" value={String(order.id)} />
                      <select
                        name="status"
                        onchange="this.form.submit()"
                        class="text-xs px-2 py-1 rounded-lg font-semibold cursor-pointer"
                        style={`background:${si.bg}; color:${si.color}; border:1px solid rgba(${si.color === '#d97706' ? '217,119,6' : si.color === '#059669' ? '5,150,105' : si.color === '#2563eb' ? '37,99,235' : si.color === '#0369a1' ? '3,105,161' : '220,38,38'},0.25); border-radius:9999px; padding:0.2rem 0.65rem; font-size:0.7rem; font-weight:600;`}
                      >
                        {Object.entries(STATUS_MAP).map(([val, info]) => (
                          <option value={val} selected={val === order.status} class="text-fg-on-dark-soft" style="background:#0b1120;">
                            {info.label}
                          </option>
                        ))}
                      </select>
                    </form>
                  </td>
                  <td class="py-3 px-4 text-xs hidden md:table-cell text-admin-muted">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      {(order.status === 'confirme' || order.status === 'en_livraison' || order.status === 'livre') && (
                        <a
                          href={`/admin/devis/new?order_id=${order.id}`}
                          class="text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap text-fg-amber"
                          style="background:rgba(var(--rgb-amber-deep),0.12); border:1px solid rgba(var(--rgb-amber-deep),0.2);"
                        >
                          <i class="fas fa-file-invoice-dollar mr-1"></i>Devis
                        </a>
                      )}
                      <a
                        href={`/api/order/invoice/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap text-fg-on-dark-success"
                        style="background:rgba(var(--rgb-green),0.12); border:1px solid rgba(var(--rgb-green),0.2);"
                      >
                        <i class="fas fa-file-invoice mr-1"></i>Facture
                      </a>
                      <form
                        method="post"
                        action="/api/admin/commande/delete"
                        class="inline"
                        onsubmit="return confirm('Supprimer cette commande ?')"
                      >
                        <input type="hidden" name="id" value={String(order.id)} />
                        <button
                          type="submit"
                          class="text-xs px-2 py-1 rounded-lg font-semibold text-fg-on-dark-danger"
                          style="background:rgba(var(--rgb-red),0.12); border:1px solid rgba(var(--rgb-red),0.2);"
                        >
                          <i class="fas fa-trash"></i>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>

      {/* Script de filtrage côté client */}
      <script dangerouslySetInnerHTML={{ __html: `
        if (typeof window.filterTable !== 'function') {
          window.filterTable = function(tableId, query) {
            var q = query.toLowerCase().trim();
            var rows = document.querySelectorAll('#' + tableId + ' tbody tr');
            rows.forEach(function(row) {
              var text = (row.getAttribute('data-search') || '').toLowerCase();
              row.style.display = (!q || text.includes(q)) ? '' : 'none';
            });
          };
        }
      `}} />
    </div>
  );
};
