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
  en_attente:   { label: '⏳ En attente',         color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  contacte:     { label: '💬 Client contacté',    color: '#60a5fa', bg: 'rgba(59,130,246,0.12)'  },
  confirme:     { label: '✅ Confirmée',           color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  en_livraison: { label: '🚚 En livraison',        color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  livre:        { label: '🏠 Livrée & Installée', color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  annule:       { label: '❌ Annulée',            color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
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
      <div class="p-8 text-center rounded-2xl" style="background:rgba(15,23,42,0.4); border:1px solid rgba(56,189,248,0.06);">
        <i class="fas fa-shopping-cart text-3xl mb-3" style="color:#334155;"></i>
        <p style="color:#64748b;">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div class="space-y-3">
      {/* Barre de recherche côté client */}
      <div class="flex items-center gap-3">
        <div class="relative flex-1 max-w-xs">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs" style="color:#64748b;"></i>
          <input
            type="text"
            placeholder="Rechercher..."
            oninput={`filterTable('${tableId}', this.value)`}
            class="w-full pl-9 pr-4 py-2 text-sm rounded-xl"
            style="background:rgba(15,23,42,0.6); border:1px solid rgba(56,189,248,0.12); color:#e2e8f0;"
          />
        </div>
        <a
          href={`/api/admin/commandes/export?type=${tableId}`}
          class="text-xs px-3 py-2 rounded-xl font-semibold flex items-center gap-2"
          style="background:rgba(52,211,153,0.1); color:#34d399; border:1px solid rgba(52,211,153,0.2);"
        >
          <i class="fas fa-file-csv"></i> Export CSV
        </a>
      </div>

      {/* Tableau */}
      <div class="overflow-x-auto">
        <table id={tableId} class="w-full text-sm">
          <thead>
            <tr style="background:rgba(15,23,42,0.4);">
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style="color:#64748b;">#ID</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style="color:#64748b;">Client</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style="color:#64748b;">Produit / Notes</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style="color:#64748b;">Montant</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style="color:#64748b;">Statut</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color:#64748b;">Date</th>
              <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color:#64748b;">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const si = STATUS_MAP[order.status] ?? { label: order.status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
              const payment = paymentsByOrder[order.id];
              const paymentLabel = payment
                ? (payment.status === 'completed' ? '✅ Payé' : payment.status === 'pending' ? '⏳ Attente' : '❌ Échoué')
                : '—';

              return (
                <tr
                  key={order.id}
                  data-search={`${order.client_name} ${order.client_phone} ${order.notes || ''} ${order.total_price || ''}`}
                  class="border-t hover:bg-white/[0.02] transition-colors"
                  style="border-color:rgba(56,189,248,0.06);"
                >
                  <td class="py-3 px-4 text-xs font-mono font-bold hidden lg:table-cell" style="color:#475569;">
                    #CMD-{String(order.id).padStart(4, '0')}
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-semibold text-sm" style="color:#e2e8f0;">{order.client_name}</div>
                    <div class="text-xs" style="color:#64748b;">{order.client_phone}</div>
                    {payment && <div class="text-xs mt-0.5" style="color:#94a3b8;">{paymentLabel}</div>}
                  </td>
                  <td class="py-3 px-4 text-xs max-w-[200px] truncate hidden md:table-cell" style="color:#64748b;">
                    {order.notes || '—'}
                  </td>
                  <td class="py-3 px-4 text-sm font-bold" style="color:#f1f5f9;">
                    {order.total_price ? order.total_price.toLocaleString('fr-FR') + ' F' : '—'}
                  </td>
                  <td class="py-3 px-4">
                    <form method="post" action="/api/admin/commande/status" style="display:inline;">
                      <input type="hidden" name="id" value={String(order.id)} />
                      <select
                        name="status"
                        onchange="this.form.submit()"
                        class="text-xs px-2 py-1 rounded-lg font-semibold cursor-pointer"
                        style={`background:${si.bg}; color:${si.color}; border:1px solid ${si.color}33;`}
                      >
                        {Object.entries(STATUS_MAP).map(([val, info]) => (
                          <option value={val} selected={val === order.status} style="background:#0b1120; color:#e2e8f0;">
                            {info.label}
                          </option>
                        ))}
                      </select>
                    </form>
                  </td>
                  <td class="py-3 px-4 text-xs hidden sm:table-cell" style="color:#64748b;">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td class="py-3 px-4 hidden sm:table-cell">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      {(order.status === 'confirme' || order.status === 'en_livraison' || order.status === 'livre') && (
                        <a
                          href={`/admin/devis/new?order_id=${order.id}`}
                          class="text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap"
                          style="background:rgba(245,158,11,0.12); color:#f59e0b; border:1px solid rgba(245,158,11,0.2);"
                        >
                          <i class="fas fa-file-invoice-dollar mr-1"></i>Devis
                        </a>
                      )}
                      <a
                        href={`/api/order/invoice/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap"
                        style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);"
                      >
                        <i class="fas fa-file-invoice mr-1"></i>Facture
                      </a>
                      <form
                        method="post"
                        action="/api/admin/commande/delete"
                        style="display:inline;"
                        onsubmit="return confirm('Supprimer cette commande ?')"
                      >
                        <input type="hidden" name="id" value={String(order.id)} />
                        <button
                          type="submit"
                          class="text-xs px-2 py-1 rounded-lg font-semibold"
                          style="background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2);"
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

      {/* Script de filtrage côté client */}
      <script dangerouslySetInnerHTML={{ __html: `
        function filterTable(tableId, query) {
          var q = query.toLowerCase().trim();
          var rows = document.querySelectorAll('#' + tableId + ' tbody tr');
          rows.forEach(function(row) {
            var text = (row.getAttribute('data-search') || '').toLowerCase();
            row.style.display = (!q || text.includes(q)) ? '' : 'none';
          });
        }
      `}} />
    </div>
  );
};
