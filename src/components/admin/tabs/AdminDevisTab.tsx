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

export const AdminDevisListPage = ({ devisData = [], rdvsPending = [] }: { devisData: any[]; rdvsPending?: any[] }) => (
  <AdminLayout activePage="devis">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">Devis clients</h2>
        <p class="text-sm text-gray-500 mt-1">
          {devisData.length} devis · {devisData.filter((d:any) => d.status === 'sent').length} en attente · {devisData.filter((d:any) => d.status === 'accepted').length} acceptés
        </p>
      </div>
      <a href="/admin/devis/new" class="btn-primary font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 text-xs shadow-md">
        <i class="fas fa-plus"></i>
        <span>Nouveau devis</span>
      </a>
    </div>

    {/* Rendez-vous de type devis en attente */}
    {rdvsPending.length > 0 && (
      <div class="mb-8">
        <div class="flex items-center space-x-2 mb-3">
          <i class="fas fa-calendar-check text-yellow-400 text-sm"></i>
          <h3 class="text-sm font-bold text-yellow-300">RDV devis en attente de traitement ({rdvsPending.length})</h3>
        </div>
        <div class="space-y-2">
          {rdvsPending.map((r: any) => (
            <div class="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style="background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.2);">
              <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(251,191,36,0.12);">
                  <i class="fas fa-clipboard-check text-yellow-400 text-sm"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-sm" style="color:var(--admin-text-primary)">{r.name}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full" style="background:rgba(251,191,36,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.25);">RDV #{r.id}</span>
                  </div>
                  <div class="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-0.5">
                    <span><i class="fas fa-phone mr-1"></i>{r.phone}</span>
                    <span><i class="fas fa-map-marker-alt mr-1"></i>{r.quartier}</span>
                    <span><i class="fas fa-calendar mr-1"></i>{r.date}</span>
                    {r.notes && <span class="italic text-gray-600">{r.notes.substring(0, 40)}{r.notes.length > 40 ? '…' : ''}</span>}
                  </div>
                </div>
              </div>
              <a href={`/admin/devis/new?rdvId=${r.id}`}
                class="text-xs px-4 py-2 rounded-xl font-semibold whitespace-nowrap flex-shrink-0" style="background:rgba(251,191,36,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.25);">
                <i class="fas fa-file-invoice-dollar mr-1.5"></i>Créer le devis
              </a>
            </div>
          ))}
        </div>
      </div>
    )}

    {devisData.length === 0 ? (
      <div class="rounded-2xl p-16 text-center card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <i class="fas fa-file-invoice-dollar text-5xl text-gray-700 mb-4"></i>
        <p class="text-gray-400 mb-2 font-semibold">Aucun devis créé</p>
        <p class="text-gray-600 text-sm mb-6">Créez un devis depuis les RDV ci-dessus ou avec le bouton "Nouveau devis"</p>
        <a href="/admin/rdv" class="text-xs px-5 py-2.5 rounded-xl font-semibold" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
          <i class="fas fa-calendar-alt mr-2"></i>Voir les rendez-vous
        </a>
      </div>
    ) : (
      <div class="space-y-3">
        {devisData.map((d: any) => {
          const daysLeft = Math.max(0, Math.floor((new Date(d.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          const isExpired = d.status !== 'accepted' && d.status !== 'refused' && d.expires_at && new Date(d.expires_at) < new Date()
          const effectiveStatus = isExpired ? 'expired' : d.status
          const statusLabel: Record<string,string> = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté ✓', refused: 'Refusé', expired: 'Expiré' }
          const statusStyle: Record<string,string> = {
            draft: 'background:rgba(148,180,220,0.12); color:#94a3b8; border:1px solid rgba(148,180,220,0.2);',
            sent: 'background:rgba(251,191,36,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.25);',
            accepted: 'background:rgba(52,211,153,0.12); color:#34d399; border:1px solid rgba(52,211,153,0.25);',
            refused: 'background:rgba(248,113,113,0.12); color:#f87171; border:1px solid rgba(248,113,113,0.25);',
            expired: 'background:rgba(107,114,128,0.12); color:#6b7280; border:1px solid rgba(107,114,128,0.2);'
          }
          return (
            <div class="rounded-2xl p-5 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start space-x-4">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(239,68,68,0.1);">
                    <i class="fas fa-file-invoice-dollar text-red-400 text-lg"></i>
                  </div>
                  <div>
                    <div class="flex items-center flex-wrap gap-2 mb-1">
                      <span class="font-bold" style="color:var(--admin-text-primary)">{d.numero}</span>
                      <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={statusStyle[effectiveStatus] || statusStyle.draft}>{statusLabel[effectiveStatus] || effectiveStatus}</span>
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span><i class="fas fa-user mr-1.5 text-gray-400"></i>{d.client_name}</span>
                      <span><i class="fas fa-phone mr-1.5 text-gray-400"></i>{d.client_phone}</span>
                      {d.produit_nom && <span><i class="fas fa-box mr-1.5 text-gray-400"></i>{d.produit_nom}</span>}
                      {d.total_ht > 0 && <span style="color:#38bdf8;" class="font-semibold"><i class="fas fa-money-bill-wave mr-1.5"></i>{Number(d.total_ht).toLocaleString('fr-FR')} FCFA</span>}
                    </div>
                    <div class="mt-1 flex flex-wrap gap-x-3 text-xs">
                      {d.status === 'sent' && !isExpired && <span style="color:#fbbf24;"><i class="fas fa-hourglass-half mr-1"></i>{daysLeft} jour{daysLeft > 1 ? 's' : ''} avant expiration</span>}
                      {isExpired && <span style="color:#f87171;"><i class="fas fa-exclamation-triangle mr-1"></i>Devis expiré</span>}
                      {d.accepted_at && <span style="color:#34d399;"><i class="fas fa-check-circle mr-1"></i>Accepté le {new Date(d.accepted_at).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <a href={`/devis/${d.token}`} target="_blank" rel="noopener noreferrer"
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">
                    <i class="fas fa-eye mr-1"></i>Voir
                  </a>
                  <a href={`/devis/${d.token}/pdf`} target="_blank" rel="noopener noreferrer"
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(99,102,241,0.12); color:#818cf8; border:1px solid rgba(99,102,241,0.2);">
                    <i class="fas fa-file-pdf mr-1"></i>PDF
                  </a>
                  <a href={`https://wa.me/${(d.client_phone || '').replace(/\D/g,'')}?text=${encodeURIComponent('Bonjour ' + d.client_name + ', votre devis MAASGA ' + d.numero + ' est disponible : ' + SITE_URL + '/devis/' + d.token)}`} target="_blank" rel="noopener noreferrer"
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(37,211,102,0.12); color:#25D366; border:1px solid rgba(37,211,102,0.2);">
                    <i class="fab fa-whatsapp mr-1"></i>WA
                  </a>
                  {(d.status === 'draft' || d.status === 'sent') && (
                    <form method="post" action="/api/admin/devis/accept" style="display:inline">
                      <input type="hidden" name="id" value={String(d.id)} />
                      <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(52,211,153,0.12); color:#34d399; border:1px solid rgba(52,211,153,0.2);">
                        <i class="fas fa-check mr-1"></i>Accepté
                      </button>
                    </form>
                  )}
                  <form method="post" action="/api/admin/devis/delete" style="display:inline" onsubmit="return confirm('Supprimer ce devis définitivement ?')">
                    <input type="hidden" name="id" value={String(d.id)} />
                    <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2);">
                      <i class="fas fa-trash"></i>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </AdminLayout>
)

// ============================================================
// ADMIN DEVIS NEW/CREATE PAGE
// ============================================================
export const AdminDevisNewPage = ({ rdv, productsList = [], clientsList = [], surface = '', btu = '', error, orderId, ticket, contract, clientData }: { rdv?: any; productsList?: any[]; clientsList?: any[]; surface?: string; btu?: string; error?: string; orderId?: number; ticket?: any; contract?: any; clientData?: any }) => {
  const ctx = ticket ? 'sav' : contract ? 'maintenance' : orderId ? 'commande' : rdv ? 'rdv' : 'manuel'
  const pc = rdv || (ticket ? { name: ticket.client_name, phone: ticket.client_phone, email: ticket.client_email || '', quartier: '' } : contract ? { name: contract.client_name, phone: contract.client_phone, email: '', quartier: '' } : clientData ? { name: clientData.name, phone: clientData.phone, email: clientData.email || '', quartier: clientData.quartier || '' } : null)
  return (
  <AdminLayout activePage="devis">
    <div class="flex items-center space-x-3 mb-6">
      <a href="/admin/devis" class="transition-colors p-1" style="color:var(--admin-text-muted)">
        <i class="fas fa-arrow-left"></i>
      </a>
      <div>
        <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">{ctx === 'sav' ? 'Devis réparation SAV' : ctx === 'maintenance' ? 'Devis entretien planifié' : 'Créer un devis'}</h2>
        <p class="text-sm text-gray-500 mt-0.5">{ctx === 'sav' && ticket ? `Ticket ${ticket.ticket_ref||'#'+(ticket.id||'')} — ${ticket.subject||''}` : ctx === 'maintenance' && contract ? `Contrat ${contract.plan_type||''} — ${contract.client_name||''}` : orderId ? `Commande #CMD-${String(orderId).padStart(4,'0')} — ${rdv?.name||''}` : rdv ? `D'après le RDV de ${rdv.name} — ${rdv.quartier}` : 'Nouveau devis manuel'}</p>
      </div>
    </div>

    {error && (
      <div class="mb-6 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);">
        <i class="fas fa-exclamation-circle text-red-400"></i>
        <span class="text-red-300 text-sm">{error}</span>
      </div>
    )}

    {ctx === 'rdv' && rdv && (
      <div class="mb-4 rounded-xl p-4 flex items-start space-x-3" style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);">
        <i class="fas fa-calendar-check mt-0.5" style="color:#38bdf8;"></i>
        <div class="text-sm"><span class="font-semibold text-cyan-300">RDV associé :</span>
          <span class="text-gray-300 ml-2">{rdv.date} {rdv.heure_debut ? 'à ' + rdv.heure_debut : ''} · {rdv.type || 'Visite'} · {rdv.quartier}</span>
          {rdv.notes && <p class="text-xs text-gray-500 mt-1 line-clamp-2"><i class="fas fa-sticky-note mr-1"></i>{rdv.notes}</p>}
        </div>
      </div>
    )}
    {ctx === 'sav' && ticket && (
      <div class="mb-4 rounded-xl p-4" style="background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.25);">
        <div class="flex items-center space-x-2 mb-2">
          <i class="fas fa-tools" style="color:#fb923c;"></i>
          <span class="font-semibold text-orange-300 text-sm">Ticket SAV : {ticket.ticket_ref || '#'+(ticket.id||'')}</span>
          <span class="text-xs px-2 py-0.5 rounded-full font-bold ml-auto" style="background:rgba(251,146,60,0.15);color:#fb923c;">{ticket.priority}</span>
        </div>
        <p class="text-sm text-gray-300 font-medium">{ticket.subject}</p>
        {ticket.description && <p class="text-xs mt-1" style="color:var(--admin-text-muted)">{ticket.description}</p>}
      </div>
    )}
    {ctx === 'maintenance' && contract && (
      <div class="mb-4 rounded-xl p-4" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);">
        <div class="flex items-center space-x-2 mb-1">
          <i class="fas fa-shield-alt" style="color:#34d399;"></i>
          <span class="font-semibold text-emerald-300 text-sm">Contrat de maintenance — {contract.plan_type}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ml-auto" style="background:rgba(52,211,153,0.12);color:#34d399;">{contract.completed_visits}/{contract.total_visits} visites</span>
        </div>
        <p class="text-xs" style="color:var(--admin-text-muted)">{contract.start_date} → {contract.end_date}</p>
      </div>
    )}
    {ctx === 'commande' && (
      <div class="mb-4 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.2);">
        <i class="fas fa-shopping-cart" style="color:#a78bfa;"></i>
        <span class="font-semibold text-purple-300 text-sm">Commande en ligne #CMD-{String(orderId||0).padStart(4,'0')}</span>
      </div>
    )}
    <form method="post" action="/api/admin/devis/create" class="space-y-6 max-w-3xl">
      {rdv && rdv.id && <input type="hidden" name="rdv_id" value={String(rdv.id)} />}
      {orderId && <input type="hidden" name="order_id" value={String(orderId)} />}
      {ticket && <input type="hidden" name="ticket_id" value={String(ticket.id)} />}
      {contract && <input type="hidden" name="contract_id" value={String(contract.id)} />}

      {/* Section client */}
      <div class="rounded-2xl p-6 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <h3 class="font-bold mb-4 flex items-center space-x-2" style="color:var(--admin-text-primary)">
          <i class="fas fa-user text-cyan-400"></i><span>Informations client</span>
        </h3>

        {/* Sélecteur client existant */}
        {clientsList.length > 0 && !rdv && (
          <div class="mb-4 rounded-xl p-3" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
            <label class="block text-xs font-semibold text-cyan-300 mb-2">
              <i class="fas fa-search mr-1.5"></i>Choisir un client existant (pré-remplit les champs)
            </label>
            <select id="client-selector" onchange="fillClientFields(this)" class="input-field text-sm">
              <option value="">-- Sélectionner un client --</option>
              {clientsList.map((cl: any) => (
                <option value={String(cl.id)}
                  data-name={cl.name || ''}
                  data-phone={cl.phone || ''}
                  data-email={cl.email || ''}
                  data-quartier={cl.quartier || ''}>
                  {cl.name} · {cl.phone}{cl.quartier ? ` · ${cl.quartier}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Nom complet *</label>
            <input type="text" id="client_name_input" name="client_name" required placeholder="Nom et prénom" value={pc ? pc.name : ''} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Téléphone (Whatsapp) *</label>
            <input type="tel" id="client_phone_input" name="client_phone" required placeholder="+226 XX XX XX XX" value={pc ? pc.phone : ''} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Email</label>
            <input type="email" id="client_email_input" name="client_email" placeholder="client@email.com" value={pc?.email || ''} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Quartier / Zone</label>
            <input type="text" id="client_quartier_input" name="client_quartier" placeholder="Ex: Paspanga" value={pc ? pc.quartier : ''} class="input-field text-sm" />
          </div>
        </div>
      </div>

      {/* Section technique — only for installation/RDV/commande contexts */}
      {(ctx === 'rdv' || ctx === 'commande' || ctx === 'manuel') && (
        <div class="rounded-2xl p-6 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <h3 class="font-bold mb-4 flex items-center space-x-2" style="color:var(--admin-text-primary)">
            <i class="fas fa-ruler-combined text-cyan-400"></i><span>Données techniques</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Surface de la pièce (m²)</label>
              <input type="number" name="surface" min="1" max="500" step="0.5" placeholder="Ex: 20" value={surface} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Puissance recommandée</label>
              <select name="btu_recommande" class="input-field text-sm">
                <option value="">Non défini</option>
                {[9000, 12000, 18000, 24000, 36000].map((b: number) => (
                  <option value={String(b)} selected={btu === String(b)}>
                    {b.toLocaleString('fr-FR')} BTU / {b === 9000 ? '1 CV' : b === 12000 ? '1,5 CV' : b === 18000 ? '2 CV' : b === 24000 ? '3 CV' : '5 CV'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Section produit & prix */}
      <div class="rounded-2xl p-6 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <h3 class="font-bold mb-4 flex items-center space-x-2" style="color:var(--admin-text-primary)">
          <i class="fas fa-box text-cyan-400"></i><span>{ctx === 'sav' ? "Pièces & Main d'œuvre" : ctx === 'maintenance' ? "Interventions & Main d'œuvre" : 'Produit & Prestations'}</span>
        </h3>

        {productsList.length > 0 && (
          <div class="mb-5 rounded-xl p-4" style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.15);">
            <label class="block text-xs font-semibold text-cyan-300 mb-2">
              <i class="fas fa-magic mr-1.5"></i>Sélectionner depuis le catalogue (pré-remplit les champs)
            </label>
            <select id="product-selector" onchange="fillProductFromCatalog(this)" class="input-field text-sm">
              <option value="">-- Choisir un produit du catalogue --</option>
              {productsList.map((p: any) => (
                <option value={String(p.id)}
                  data-nom={`${p.brand} ${p.model} – ${p.btu.toLocaleString('fr-FR')} BTU`}
                  data-prix={String(p.price)}
                  data-btu={String(p.btu)}
                  data-install={String(p.price_install || 50000)}>
                  {p.brand} {p.model} · {p.btu.toLocaleString('fr-FR')} BTU · {p.price.toLocaleString('fr-FR')} FCFA
                </option>
              ))}
            </select>
          </div>
        )}

        <div class="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Désignation produit / climatiseur *</label>
            <input type="text" name="produit_nom" id="produit_nom_input" required
              placeholder="Ex: Samsung Wind-Free 12 000 BTU 1,5 CV Inverter" class="input-field text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Prix unitaire (FCFA) *</label>
            <input type="number" name="produit_prix" id="produit_prix_input" required min="0"
              placeholder="Ex: 375 000" oninput="recalcTotal()" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Quantité</label>
            <input type="number" name="produit_quantite" id="produit_quantite_input"
              value="1" min="1" max="20" oninput="recalcTotal()" class="input-field text-sm" />
          </div>
        </div>
        <div class="mb-5">
          <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">{ctx === 'sav' ? "Main d'œuvre réparation (FCFA)" : ctx === 'maintenance' ? 'Prestation entretien (FCFA)' : "Main d'œuvre / Installation (FCFA)"}</label>
          <input type="number" name="installation_prix" id="installation_prix_input"
            value={ctx === 'maintenance' ? '15000' : '50000'} min="0" oninput="recalcTotal()" class="input-field text-sm" />
        </div>

        <div class="mb-5">
          <label class="block text-xs font-semibold text-gray-400 mb-2">Fournitures supplémentaires <span class="text-gray-600 font-normal">(optionnel)</span></label>
          <div id="acc-container" class="space-y-2">
            <div class="grid grid-cols-12 gap-2 acc-row">
              <div class="col-span-7"><input type="text" name="acc_nom_1" placeholder="Désignation" class="input-field text-sm" /></div>
              <div class="col-span-4"><input type="number" name="acc_prix_1" placeholder="Prix FCFA" min="0" oninput="recalcTotal()" class="input-field text-sm" /></div>
              <div class="col-span-1 flex items-center justify-center"><button type="button" class="text-red-400 hover:text-red-300 text-sm" onclick="removeAcc(this)" title="Supprimer"><i class="fas fa-times"></i></button></div>
            </div>
          </div>
          <button type="button" onclick="addAcc()" class="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1" style="background:rgba(56,189,248,0.08); color:#38bdf8; border:1px solid rgba(56,189,248,0.15);">
            <i class="fas fa-plus"></i><span>Ajouter une ligne</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-4" style="border-top:1px solid rgba(148,180,220,0.1);">
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Remise (%)</label>
            <input type="number" name="remise" id="remise_input"
              value="0" min="0" max="50" oninput="recalcTotal()" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Total estimé</label>
            <div id="total-display" class="rounded-xl px-4 py-3 text-right font-bold text-xl"
              style="background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.2); color:#38bdf8;">
              0 FCFA
            </div>
          </div>
        </div>
      </div>

      {/* Section message & validité */}
      <div class="rounded-2xl p-6 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <h3 class="font-bold mb-4 flex items-center space-x-2" style="color:var(--admin-text-primary)">
          <i class="fas fa-comment-alt text-cyan-400"></i><span>Message & Validité</span>
        </h3>
        {ctx === 'manuel' && (
          <div class="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fas fa-map-signs mr-1.5" style="color:#fbbf24;"></i>Origine de la demande</label>
              <select name="origine" class="input-field text-sm">
                <option value="">Non précisé</option>
                <option value="appel">Appel entrant</option>
                <option value="visite">Visite physique</option>
                <option value="recommandation">Recommandation</option>
                <option value="reseaux">Réseaux sociaux</option>
                <option value="publicite">Publicité</option>
                <option value="bouche_a_oreille">Bouche-à-oreille</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fas fa-exclamation-triangle mr-1.5" style="color:#f87171;"></i>Niveau d'urgence</label>
              <select name="urgence" class="input-field text-sm">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="tres_urgent">Très urgent</option>
              </select>
            </div>
          </div>
        )}
        <div class="mb-4">
          <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Message personnalisé pour le client <span class="text-gray-600 font-normal">(apparaît sur le devis)</span></label>
          <textarea name="message_client" rows={3} class="input-field text-sm resize-none"
            placeholder="Ex: Suite à notre visite technique, voici notre proposition...">{ctx === 'sav' && ticket ? `Suite à l'analyse du ticket ${ticket.ticket_ref||''} — "${ticket.subject||''}", voici notre devis de réparation. Ce devis est valable 30 jours. Contactez-nous au +226 55 99 64 18 pour accord.` : ctx === 'maintenance' && contract ? `Dans le cadre de votre contrat de maintenance ${contract.plan_type}, voici le devis pour la prochaine intervention planifiée. Ce devis est valable 30 jours.` : rdv ? `Suite à notre visite technique à ${rdv.quartier}, voici notre proposition de devis personnalisée. Ce devis est valable 30 jours. N'hésitez pas à nous contacter pour toute question au +226 55 99 64 18.` : ''}</textarea>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Notes internes <span class="text-gray-600 font-normal">(non visibles par le client)</span></label>
          <textarea name="notes_internes" rows={2} placeholder={ctx === 'sav' ? "Diagnostic, pièces identifiées, technicien assigné..." : ctx === 'maintenance' ? "Points d'entretien, filtres à vérifier, niveaux fluide..." : "Observations techniques, contraintes, remarques d'installation..."} class="input-field text-sm resize-none">{ctx === 'sav' && ticket ? `Ref. ticket: ${ticket.ticket_ref||'#'+(ticket.id||'')}` : ctx === 'maintenance' && contract ? `Ref. contrat #${contract.id}` : ''}</textarea>
        </div>
        <div>
          <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Date d'expiration du devis</label>
          <input type="date" name="expires_at" id="expires_at_input" required class="input-field text-sm" />
          <p class="text-xs text-gray-600 mt-1"><i class="fas fa-info-circle mr-1"></i>Défaut : 30 jours à partir d'aujourd'hui</p>
        </div>
      </div>

      {/* Boutons submit */}
      <div class="flex flex-col sm:flex-row gap-3">
        <button type="button" onclick="previewDevisPDF()" 
          class="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all"
          style="background:rgba(139,92,246,0.1); color:#a78bfa; border:1.5px solid rgba(139,92,246,0.3);">
          <i class="fas fa-eye"></i>
          <span>Prévisualiser PDF</span>
        </button>
        <button type="submit" name="action" value="draft"
          class="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all"
          style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1.5px solid rgba(56,189,248,0.3);">
          <i class="fas fa-save"></i>
          <span>Brouillon</span>
        </button>
        <button type="submit" name="action" value="send"
          class="flex-1 btn-primary py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg">
          <i class="fab fa-whatsapp text-green-300"></i>
          <span>Créer et envoyer</span>
        </button>
      </div>
    </form>

    {/* Preview modal */}
    <div id="preview-modal" class="fixed inset-0 z-50 hidden" style="background:rgba(0,0,0,0.8); backdrop-filter:blur(4px);">
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between px-5 py-3" style="background:var(--admin-card-bg); border-bottom:1px solid var(--admin-border);">
          <h3 class="text-sm font-bold flex items-center space-x-2" style="color:var(--admin-text-primary)"><i class="fas fa-file-pdf" style="color:#a78bfa;"></i><span>Prévisualisation du devis</span></h3>
          <button type="button" onclick="closePreview()" class="p-2 rounded-lg hover:bg-white/10 transition-colors"><i class="fas fa-times text-gray-400"></i></button>
        </div>
        <div class="flex-1 overflow-auto p-4"><iframe id="preview-iframe" style="width:100%;height:100%;min-height:80vh;border:none;border-radius:12px;background:white;"></iframe></div>
      </div>
    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      var accCounter = 1;

      // Default expiry = today + 30 days
      (function() {
        var el = document.getElementById('expires_at_input');
        if (el && !el.value) {
          var d = new Date(); d.setDate(d.getDate() + 30);
          el.value = d.toISOString().split('T')[0];
        }
      })();

      function fillClientFields(sel) {
        var opt = sel.options[sel.selectedIndex];
        if (!opt || !opt.value) return;
        document.getElementById('client_name_input').value = opt.dataset.name || '';
        document.getElementById('client_phone_input').value = opt.dataset.phone || '';
        document.getElementById('client_email_input').value = opt.dataset.email || '';
        document.getElementById('client_quartier_input').value = opt.dataset.quartier || '';
      }

      function fillProductFromCatalog(sel) {
        var opt = sel.options[sel.selectedIndex];
        if (!opt || !opt.value) return;
        document.getElementById('produit_nom_input').value = opt.dataset.nom || '';
        document.getElementById('produit_prix_input').value = opt.dataset.prix || '';
        var installEl = document.getElementById('installation_prix_input');
        if (installEl && opt.dataset.install) installEl.value = opt.dataset.install;
        recalcTotal();
      }

      function addAcc() {
        accCounter++;
        var container = document.getElementById('acc-container');
        var row = document.createElement('div');
        row.className = 'grid grid-cols-12 gap-2 acc-row';
        row.innerHTML = '<div class="col-span-7"><input type="text" name="acc_nom_' + accCounter + '" placeholder="Désignation" class="input-field text-sm" /></div>' +
          '<div class="col-span-4"><input type="number" name="acc_prix_' + accCounter + '" placeholder="Prix FCFA" min="0" oninput="recalcTotal()" class="input-field text-sm" /></div>' +
          '<div class="col-span-1 flex items-center justify-center"><button type="button" class="text-red-400 hover:text-red-300 text-sm" onclick="removeAcc(this)" title="Supprimer"><i class="fas fa-times"></i></button></div>';
        container.appendChild(row);
      }

      function removeAcc(btn) {
        var rows = document.querySelectorAll('.acc-row');
        if (rows.length <= 1) return;  // keep at least one
        btn.closest('.acc-row').remove();
        recalcTotal();
      }

      function recalcTotal() {
        var prix = parseFloat((document.querySelector('[name=produit_prix]')||{}).value) || 0;
        var qty = parseFloat((document.querySelector('[name=produit_quantite]')||{}).value) || 1;
        var install = parseFloat((document.querySelector('[name=installation_prix]')||{}).value) || 0;
        var remise = parseFloat((document.querySelector('[name=remise]')||{}).value) || 0;
        var accTotal = 0;
        document.querySelectorAll('.acc-row input[type=number]').forEach(function(el) {
          accTotal += parseFloat(el.value) || 0;
        });
        var subtotal = (prix * qty) + install + accTotal;
        var discount = Math.round(subtotal * remise / 100);
        var total = subtotal - discount;
        document.getElementById('total-display').textContent = total.toLocaleString('fr-FR') + ' FCFA';
      }

      function previewDevisPDF() {
        // Collect form data
        var form = document.querySelector('form[action*=devis]');
        var fd = new FormData(form);
        fd.set('action', 'preview');
        // Post to preview endpoint
        fetch('/api/admin/devis/preview', { method: 'POST', body: fd })
          .then(function(r) { return r.text(); })
          .then(function(html) {
            var iframe = document.getElementById('preview-iframe');
            iframe.srcdoc = html;
            document.getElementById('preview-modal').classList.remove('hidden');
          })
          .catch(function(e) { alert('Erreur de prévisualisation: ' + e.message); });
      }

      function closePreview() {
        document.getElementById('preview-modal').classList.add('hidden');
      }
      document.getElementById('preview-modal').addEventListener('click', function(e) {
        if (e.target === this) closePreview();
      });

      recalcTotal();
    `}} />
  </AdminLayout>
  )
}


// ============================================================
// ADMIN DEVIS DETAIL PAGE
// ============================================================

export const AdminDevisDetailPage = ({ devis, publicUrl, notify, emailOk, emailErr }: { devis: any; publicUrl: string; notify?: string; emailOk?: boolean; emailErr?: string }) => {
  const statusColors: Record<string,string> = { draft: '#94a3b8', sent: '#fbbf24', accepted: '#34d399', refused: '#f87171', expired: '#f97316' }
  const statusLabels: Record<string,string> = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', refused: 'Refusé', expired: 'Expiré' }
  return (
    <AdminLayout activePage="devis">
      <div class="max-w-3xl mx-auto space-y-6">
        {notify && <div class="rounded-xl p-4 text-sm" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#34d399;">{notify}</div>}
        {emailOk && <div class="rounded-xl p-4 text-sm" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#34d399;">Email envoyé avec succès.</div>}
        {emailErr && <div class="rounded-xl p-4 text-sm" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;">Erreur email : {emailErr}</div>}
        <div class="rounded-2xl p-6" style="background:var(--admin-card-bg);border:1px solid var(--admin-border);">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold" style="color:var(--admin-text-primary)">Devis {devis?.numero}</h2>
            <span class="text-xs px-3 py-1 rounded-full font-semibold" style={`background:rgba(148,163,184,0.1);color:${statusColors[devis?.status]||'#94a3b8'}`}>{statusLabels[devis?.status]||devis?.status}</span>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><span class="text-gray-500">Client :</span> <span style="color:var(--admin-text-primary)">{devis?.client_name}</span></div>
            <div><span class="text-gray-500">Téléphone :</span> <span style="color:var(--admin-text-primary)">{devis?.client_phone}</span></div>
            <div><span class="text-gray-500">Total :</span> <span class="text-cyan-400 font-bold">{devis?.total?.toLocaleString()} FCFA</span></div>
            <div><span class="text-gray-500">Date :</span> <span style="color:var(--admin-text-primary)">{devis?.created_at ? new Date(devis.created_at).toLocaleDateString('fr-FR') : '-'}</span></div>
          </div>
          <div class="flex flex-wrap gap-3 mt-4">
            <a href={publicUrl} target="_blank" class="btn-secondary text-sm px-4 py-2 rounded-xl"><i class="fas fa-eye mr-2"></i>Voir le devis</a>
            <form method="post" action="/api/admin/devis/send-email" style="display:inline;">
              <input type="hidden" name="token" value={devis?.token} />
              <button type="submit" class="btn-primary text-sm px-4 py-2 rounded-xl"><i class="fas fa-envelope mr-2"></i>Envoyer par email</button>
            </form>
            <a href="/admin/devis" class="text-sm px-4 py-2 rounded-xl" style="background:rgba(148,163,184,0.1);color:#94a3b8;"><i class="fas fa-arrow-left mr-2"></i>Retour</a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

// ============================================================
// ADMIN PAIEMENTS PAGE
// ============================================================
