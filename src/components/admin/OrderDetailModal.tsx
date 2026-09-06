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
  en_attente:   { label: '⏳ En attente',         color: '#fbbf24', bg: 'rgba(251,191,36,0.2)'  },
  contacte:     { label: '💬 Client contacté',    color: '#60a5fa', bg: 'rgba(59,130,246,0.2)'  },
  confirme:     { label: '✅ Confirmée',           color: '#34d399', bg: 'rgba(52,211,153,0.2)'  },
  en_livraison: { label: '🚚 En livraison',        color: '#a78bfa', bg: 'rgba(167,139,250,0.2)' },
  livre:        { label: '🏠 Livrée & Installée', color: '#10b981', bg: 'rgba(16,185,129,0.2)'  },
  annule:       { label: '❌ Annulée',            color: '#f87171', bg: 'rgba(248,113,113,0.2)' },
};

export const OrderDetailModal = ({ order, isOpen }: OrderDetailModalProps) => {
  if (!isOpen || !order) return null;

  const si = STATUS_MAP[order.status] ?? { label: order.status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  const createdAt = new Date(order.created_at).toLocaleDateString('fr-FR');

  return (
    <div
      id="order-detail-modal"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background:rgba(0,0,0,0.7);"
      onclick="if(event.target===this) document.getElementById('order-detail-modal').style.display='none';"
    >
      <div class="relative w-full max-w-2xl rounded-2xl overflow-hidden" style="background:#0b1120; border:1px solid rgba(56,189,248,0.15); max-height:90vh; overflow-y:auto;">

        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4" style="border-bottom:1px solid rgba(56,189,248,0.1);">
          <h2 class="text-lg font-bold text-white">
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
              <p class="text-xs mb-1" style="color:#64748b;">Client</p>
              <p class="font-semibold text-white">{order.client_name}</p>
              <p class="text-sm" style="color:#94a3b8;">{order.client_phone}</p>
              {order.client_email && <p class="text-xs" style="color:#94a3b8;">{order.client_email}</p>}
            </div>
            <div>
              <p class="text-xs mb-1" style="color:#64748b;">Date</p>
              <p class="text-sm text-white">{createdAt}</p>
              <p class="text-xs mt-1" style="color:#94a3b8;">{order.quartier || '—'}</p>
            </div>
            <div>
              <p class="text-xs mb-1" style="color:#64748b;">Montant</p>
              <p class="text-2xl font-bold text-white">
                {order.total_price ? order.total_price.toLocaleString('fr-FR') + ' F' : '—'}
              </p>
            </div>
            <div>
              <p class="text-xs mb-1" style="color:#64748b;">Statut</p>
              <span class="px-3 py-1 rounded-lg text-sm font-semibold" style={`background:${si.bg}; color:${si.color};`}>
                {si.label}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <p class="text-xs mb-2" style="color:#64748b;">Notes / Produit</p>
              <p class="text-sm whitespace-pre-wrap" style="color:#cbd5e1;">{order.notes}</p>
            </div>
          )}

          {/* Changer statut */}
          <div style="border-top:1px solid rgba(56,189,248,0.08); padding-top:1rem;">
            <p class="text-xs mb-3" style="color:#64748b;">Changer le statut</p>
            <form method="post" action="/api/admin/commande/status" class="flex items-center gap-3">
              <input type="hidden" name="id" value={String(order.id)} />
              <select name="status" class="text-sm px-3 py-2 rounded-lg" style="background:#1e293b; color:#e2e8f0; border:1px solid rgba(56,189,248,0.15);">
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
