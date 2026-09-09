// OrderDetailModal — Hono JSX SSR (pas React).
// Modale statique rendue côté serveur ; affichée/masquée par JS natif.
import type { Order } from '../../data/store';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose?: () => void;
  onUpdateOrder?: (orderId: number, updates: Partial<Order>) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  en_attente:   { label: 'En attente',         color: '#d97706', bg: 'rgba(217,119,6,0.12)'   },
  contacte:     { label: 'Client contacté',    color: '#2563eb', bg: 'rgba(37,99,235,0.12)'   },
  confirme:     { label: 'Confirmée',           color: '#059669', bg: 'rgba(5,150,105,0.12)'   },
  en_livraison: { label: 'En livraison',        color: '#2563eb', bg: 'rgba(37,99,235,0.12)'   },
  livre:        { label: 'Livrée & Installée', color: '#0369a1', bg: 'rgba(3,105,161,0.12)'   },
  annule:       { label: 'Annulée',            color: '#dc2626', bg: 'rgba(220,38,38,0.12)'   },
};

export const OrderDetailModal = ({ order, isOpen }: OrderDetailModalProps) => {
  if (!isOpen || !order) return null;

  const si = STATUS_MAP[order.status] ?? { label: order.status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  const createdAt = new Date(order.created_at).toLocaleDateString('fr-FR');

  return (
    <div
      id="order-detail-modal"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background:rgba(0,0,0,0.5);"
      onclick="if(event.target===this) document.getElementById('order-detail-modal').style.display='none';"
    >
      <div class="relative w-full max-w-2xl rounded-2xl overflow-hidden" style="background: var(--admin-card-bg); border: 1px solid var(--admin-border); max-height:90vh; overflow-y:auto;">

        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4" style="border-bottom:1px solid var(--admin-border);">
          <h2 class="text-lg font-bold" style="color: var(--admin-text-primary);">
            Commande <span class="font-mono text-blue-300">#CMD-{String(order.id).padStart(4, '0')}</span>
          </h2>
          <button
            onclick="document.getElementById('order-detail-modal').style.display='none';"
            class="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div class="p-6 space-y-6">

          {/* Client + résumé */}
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Client</p>
              <p class="font-semibold" style="color: var(--admin-text-primary);">{order.client_name}</p>
              <p class="text-sm" style="color: var(--admin-text-muted);">{order.client_phone}</p>
              {order.client_email && <p class="text-xs" style="color: var(--admin-text-muted);">{order.client_email}</p>}
            </div>
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Date</p>
              <p class="text-sm" style="color: var(--admin-text-primary);">{createdAt}</p>
              <p class="text-xs mt-1" style="color: var(--admin-text-muted);">{order.quartier || '—'}</p>
            </div>
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Montant</p>
              <p class="text-2xl font-bold" style="color: var(--admin-accent);">
                {order.total_price ? order.total_price.toLocaleString('fr-FR') + ' F' : '—'}
              </p>
            </div>
            <div>
              <p class="text-xs mb-1" style="color: var(--admin-text-muted);">Statut</p>
              <span style={`background:${si.bg}; color:${si.color}; border-radius:9999px; padding:0.2rem 0.65rem; font-size:0.7rem; font-weight:600;`}>
                {si.label}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <p class="text-xs mb-2" style="color: var(--admin-text-muted);">Notes / Produit</p>
              <p class="text-sm whitespace-pre-wrap" style="color: var(--admin-text-primary);">{order.notes}</p>
            </div>
          )}

          {/* Changer statut */}
          <div style="border-top:1px solid var(--admin-border); padding-top:1rem;">
            <p class="text-xs mb-3" style="color: var(--admin-text-muted);">Changer le statut</p>
            <form method="post" action="/api/admin/commande/status" class="flex items-center gap-3">
              <input type="hidden" name="id" value={String(order.id)} />
              <select name="status" class="text-sm px-3 py-2 rounded-lg" style="background: var(--admin-bg-elevated); color: var(--admin-text-primary); border:1px solid var(--admin-border);">
                {Object.entries(STATUS_MAP).map(([val, info]) => (
                  <option value={val} selected={val === order.status}>{info.label}</option>
                ))}
              </select>
              <button type="submit" class="text-sm px-4 py-2 rounded-lg font-semibold" style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                Appliquer
              </button>
            </form>
          </div>

          {/* Actions rapides */}
          <div class="flex flex-wrap gap-3">
            <a
              href={`/api/order/invoice/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs px-3 py-2 rounded-lg font-semibold"
              style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);"
            >
              <i class="fas fa-file-invoice mr-1"></i>Facture
            </a>
            <a
              href={`/admin/devis/new?order_id=${order.id}`}
              class="text-xs px-3 py-2 rounded-lg font-semibold"
              style="background:rgba(245,158,11,0.12); color:#f59e0b; border:1px solid rgba(245,158,11,0.2);"
            >
              <i class="fas fa-file-invoice-dollar mr-1"></i>Créer devis
            </a>
            <a
              href={`https://wa.me/${(order.client_phone || '').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs px-3 py-2 rounded-lg font-semibold"
              style="background:rgba(37,211,102,0.12); color:#25D366; border:1px solid rgba(37,211,102,0.2);"
            >
              <i class="fab fa-whatsapp mr-1"></i>WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
