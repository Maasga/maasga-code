// ClientDetailModal — Hono JSX SSR (pas React).
// Rendue côté serveur sous forme de div cachée ; le JS inline de AdminCommandesPage
// la rend visible et peuple son contenu via data-* lorsque l'admin clique sur un client.
// Pas de useState/useEffect : le projet utilise Hono, pas React.

export const ClientDetailModal = ({
  client,
  isOpen,
  onClose,
}: {
  client: any | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !client) return null;

  const createdAt = client.created_at
    ? new Date(client.created_at).toLocaleDateString('fr-FR')
    : '—';

  return (
    <div
      id="client-detail-modal"
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background:rgba(var(--rgb-black),0.5);"
      onclick="if(event.target===this) document.getElementById('client-detail-modal').style.display='none';"
    >
      <div class="relative w-full max-w-xl rounded-2xl overflow-hidden bg-admin-card border border-admin-line" style="max-height:90vh; overflow-y:auto;">

        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-admin-line">
          <h2 class="text-lg font-bold text-admin-fg">
            Fiche client — <span class="text-blue-300">{client.name}</span>
          </h2>
          <button
            onclick="document.getElementById('client-detail-modal').style.display='none';"
            class="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div class="p-6 space-y-6">

          {/* Identité */}
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs mb-1 text-admin-muted">ID</p>
              <p class="font-mono text-sm" style="color: var(--admin-text-muted);">#{String(client.id).padStart(4, '0')}</p>
            </div>
            <div>
              <p class="text-xs mb-1 text-admin-muted">Inscrit le</p>
              <p class="text-sm" style="color: var(--admin-text-muted);">{createdAt}</p>
            </div>
            <div>
              <p class="text-xs mb-1 text-admin-muted">Nom</p>
              <p class="font-semibold text-admin-fg">{client.name}</p>
            </div>
            <div>
              <p class="text-xs mb-1 text-admin-muted">Téléphone</p>
              <p class="font-semibold text-admin-fg">{client.phone}</p>
            </div>
            <div>
              <p class="text-xs mb-1 text-admin-muted">Email</p>
              <p class="text-sm" style="color: var(--admin-text-muted);">{client.email || '—'}</p>
            </div>
            <div>
              <p class="text-xs mb-1 text-admin-muted">Quartier</p>
              <p class="text-sm" style="color: var(--admin-text-muted);">{client.quartier || '—'}</p>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div>
              <p class="text-xs mb-1 text-admin-muted">Notes</p>
              <p class="text-sm whitespace-pre-wrap" style="color: var(--admin-text-muted);">{client.notes}</p>
            </div>
          )}

          {/* Actions rapides */}
          <div class="border-t border-admin-line pt-[1rem]">
            <p class="text-xs mb-3 text-admin-muted">Actions rapides</p>
            <div class="flex flex-wrap gap-3">
              <a
                href={`/admin/commandes?client_id=${client.id}`}
                class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                style="background:rgba(var(--rgb-blue),0.15); color:var(--fg-on-dark-info); border:1px solid rgba(var(--rgb-blue),0.2);"
              >
                <i class="fas fa-file-invoice-dollar"></i> Nouvelle commande
              </a>
              <a
                href={`/admin/rdv${client.phone ? '?client_phone=' + encodeURIComponent(client.phone) : ''}`}
                class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                style="background:rgba(var(--rgb-emerald),0.15); color:var(--fg-on-dark-success); border:1px solid rgba(var(--rgb-emerald),0.2);"
              >
                <i class="fas fa-calendar-plus"></i> Nouveau RDV
              </a>
              <a
                href={`https://wa.me/${(client.phone || '').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                style="background:rgba(var(--rgb-whatsapp),0.15); color:var(--fg-whatsapp); border:1px solid rgba(var(--rgb-whatsapp),0.2);"
              >
                <i class="fab fa-whatsapp"></i> WhatsApp
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
