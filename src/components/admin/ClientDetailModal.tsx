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
      style="background:rgba(0,0,0,0.7);"
      onclick="if(event.target===this) document.getElementById('client-detail-modal').style.display='none';"
    >
      <div class="relative w-full max-w-xl rounded-2xl overflow-hidden" style="background:#0b1120; border:1px solid rgba(56,189,248,0.15); max-height:90vh; overflow-y:auto;">

        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4" style="border-bottom:1px solid rgba(56,189,248,0.1);">
          <h2 class="text-lg font-bold text-white">
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
              <p class="text-xs text-gray-500 mb-1">ID</p>
              <p class="font-mono text-sm text-gray-300">#{String(client.id).padStart(4, '0')}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Inscrit le</p>
              <p class="text-sm text-gray-300">{createdAt}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Nom</p>
              <p class="font-semibold text-white">{client.name}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Téléphone</p>
              <p class="font-semibold text-white">{client.phone}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Email</p>
              <p class="text-sm text-gray-300">{client.email || '—'}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Quartier</p>
              <p class="text-sm text-gray-300">{client.quartier || '—'}</p>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div>
              <p class="text-xs text-gray-500 mb-1">Notes</p>
              <p class="text-sm text-gray-300 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          {/* Actions rapides */}
          <div style="border-top:1px solid rgba(56,189,248,0.08); padding-top:1rem;">
            <p class="text-xs text-gray-500 mb-3">Actions rapides</p>
            <div class="flex flex-wrap gap-3">
              <a
                href={`/admin/commandes/nouveau?client_id=${client.id}`}
                class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                style="background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.2);"
              >
                <i class="fas fa-file-invoice-dollar"></i> Nouvelle commande
              </a>
              <a
                href={`/rendez-vous?client_phone=${encodeURIComponent(client.phone)}`}
                class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                style="background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.2);"
              >
                <i class="fas fa-calendar-plus"></i> Nouveau RDV
              </a>
              <a
                href={`https://wa.me/${(client.phone || '').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                style="background:rgba(37,211,102,0.15); color:#25D366; border:1px solid rgba(37,211,102,0.2);"
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
