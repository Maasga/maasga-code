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

export const AdminMaintenancePage = ({ contracts = [], requests = [], visits = [], success = '', error = '' }: { contracts?: any[], requests?: any[], visits?: any[], success?: string, error?: string }) => {

  // Visites dues/en retard (date passée et toujours planifiée)
  const today = new Date().toISOString().split('T')[0]
  const dueVisits = visits.filter((v: any) => v.status === 'planifiee' && v.visit_date <= today)
  const upcomingVisits = visits.filter((v: any) => v.status === 'planifiee' && v.visit_date > today)

  // Variables SSR (pas de hooks React — Hono SSR)
  const selectedClientId: number | null = null;
  const isClientDetailOpen = false;
  const activeContracts = contracts.filter((c: any) => c.status === 'actif').length;
  const pendingRequests = requests.filter((r: any) => r.status === 'pending').length;
  const totalVisits = visits.length;
  const contractRequests = requests.filter((r: any) => r.request_type === 'contrat' && (r.status === 'pending' || r.status === 'contacted'))

  const fmtDate = (d: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return d }
  }

  // Flash message labels
  const successMessages: Record<string,string> = {
    request_updated: '✅ Demande mise à jour avec succès',
    request_cancelled: '✅ Demande annulée',
    request_deleted: '🗑️ Demande supprimée définitivement',
    contract_created: '🎉 Contrat créé & visites programmées automatiquement !',
    contracts_synced: '⚡ Tous les contrats de souscription ont été créés & planifiés !',
    visit_validated: '✅ Visite validée et enregistrée',
    visit_cancelled: '✅ Visite annulée',
    visit_deleted: '🗑️ Visite supprimée',
    visit_added: '📅 Visite programmée manuellement',
    contract_activated: '✅ Contrat activé',
    contract_cancelled: '✅ Contrat annulé',
    contract_deleted: '🗑️ Contrat supprimé'
  }
  const errorMessages: Record<string,string> = {
    no_db: '❌ Base de données non disponible',
    invalid_request: '❌ Requête invalide',
    not_found: '❌ Élément introuvable',
    server_error: '❌ Erreur serveur — réessayez',
  }

  // Handler functions for client detail modal (SSR — pas de hooks)
  const handleOpenClientDetail = (_clientId: number | null) => { /* SSR */ };
  const handleCloseClientDetail = () => { /* SSR */ };

  return (
  <AdminLayout activePage="maintenance">
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 fade-in-up">
        <div>
          <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">Maintenance</h2>
          <p class="text-sm text-blue-300/60 mt-1">Contrats, demandes et visites de maintenance</p>
        </div>
        {contractRequests.length > 0 && (
          <form method="post" action="/admin/maintenance/sync-pending-requests" onsubmit={`return confirm('Générer ${contractRequests.length} contrat(s) actif(s) et programmer toutes leurs visites automatiquement ?')`}>
            <button type="submit" class="btn-primary px-4 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2">
              <i class="fas fa-bolt"></i>
              <span>⚡ Générer {contractRequests.length} contrat{contractRequests.length > 1 ? 's' : ''} en attente</span>
            </button>
          </form>
        )}
      </div>

      {/* ===== FLASH BANNERS ===== */}
      {success && successMessages[success] && (
        <div class="rounded-2xl p-4 fade-in-up flex items-center gap-3" style="background:linear-gradient(135deg, rgba(52,211,153,0.15), rgba(14,165,233,0.1)); border:1px solid rgba(52,211,153,0.3);">
          <i class="fas fa-check-circle text-lg" style="color:#34d399;"></i>
          <span class="text-sm font-semibold" style="color:#34d399;">{successMessages[success]}</span>
        </div>
      )}
      {error && errorMessages[error] && (
        <div class="rounded-2xl p-4 fade-in-up flex items-center gap-3" style="background:linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.05)); border:1px solid rgba(239,68,68,0.3);">
          <i class="fas fa-exclamation-circle text-lg" style="color:#f87171;"></i>
          <span class="text-sm font-semibold" style="color:#f87171;">{errorMessages[error]}</span>
        </div>
      )}

      {/* ===== NOTIFICATION BANNER : Visites à effectuer ===== */}
      {dueVisits.length > 0 && (
        <div class="rounded-2xl p-5 fade-in-up" style="background:linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1)); border:1px solid rgba(245,158,11,0.3);">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(245,158,11,0.2);">
              <i class="fas fa-bell text-lg" style="color:#f59e0b;"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold flex items-center space-x-2" style="color:var(--admin-text-primary)">
                <span>🔔 {dueVisits.length} visite{dueVisits.length > 1 ? 's' : ''} à effectuer !</span>
              </h3>
              <p class="text-sm mt-1" style="color:#fbbf24;">Les visites suivantes ont atteint leur date prévue et doivent être validées après réalisation.</p>
              <div class="mt-3 space-y-2">
                {dueVisits.map(v => {
                  const contract = contracts.find((c: any) => c.id === v.contract_id)
                  const daysOverdue = Math.floor((new Date(today).getTime() - new Date(v.visit_date).getTime()) / 86400000)
                  return (
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 rounded-xl" style="background:rgba(0,0,0,0.2); border:1px solid rgba(245,158,11,0.15);">
                      <div class="flex items-center space-x-3 min-w-0">
                        <i class="fas fa-exclamation-triangle text-sm" style="color:#f59e0b;"></i>
                        <div class="min-w-0">
                          <div class="text-sm font-semibold truncate" style="color:var(--admin-text-primary)">
                            {v.client_name || (contract ? contract.client_name : `Client #${v.client_id}`)}
                            <span class="text-xs font-normal ml-2" style="color:#94a3b8;">{v.client_phone}</span>
                          </div>
                          <div class="text-xs" style="color:#fbbf24;">
                            Prévue le {fmtDate(v.visit_date)} {daysOverdue > 0 ? `(${daysOverdue}j de retard)` : "(aujourd'hui)"}
                            {contract && <span> · Contrat {contract.plan_type}</span>}
                          </div>
                        </div>
                      </div>
                      <button type="button" class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0" style="background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.3);" onclick={`openValidationModal(${Number(v.id)}, '${jsAttr(v.client_name)}', '${jsAttr(v.visit_date)}', ${Number(v.contract_id) || 0})`}>
                        <i class="fas fa-check mr-1"></i>Valider
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 fade-in-up delay-1">
        {[
          { icon: 'fa-file-contract', color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', label: 'Contrats actifs', val: String(activeContracts) },
          { icon: 'fa-bell', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'À effectuer', val: String(dueVisits.length) },
          { icon: 'fa-calendar-alt', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'À venir', val: String(upcomingVisits.length) },
          { icon: 'fa-exclamation-circle', color: '#f87171', bg: 'rgba(248,113,113,0.15)', label: 'Demandes en attente', val: String(pendingRequests) },
          { icon: 'fa-clipboard-check', color: '#34d399', bg: 'rgba(52,211,153,0.15)', label: 'Visites total', val: String(totalVisits) },
        ].map(c => (
          <div class="stat-card">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" style={`background:${c.bg};`}>
                <i class={`fas ${c.icon}`} style={`color:${c.color};`}></i>
              </div>
              <div>
                <div class="text-xs font-medium" style="color:#64748b;">{c.label}</div>
                <div class="text-xl font-bold" style="color:var(--admin-text-primary)">{c.val}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Demandes de maintenance ===== */}
      <div class="rounded-2xl overflow-hidden fade-in-up delay-1" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="px-5 py-4 flex flex-wrap items-center justify-between gap-3" style="border-bottom:1px solid var(--admin-border);">
          <h3 class="font-bold flex items-center space-x-2" style="color:var(--admin-text-primary)">
            <i class="fas fa-inbox text-sm" style="color:#fbbf24;"></i>
            <span>Demandes de maintenance</span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded-full" style="background:rgba(251,191,36,0.15); color:#fbbf24;">{requests.length}</span>
          </h3>
          {contractRequests.length > 0 && (
            <form method="post" action="/admin/maintenance/sync-pending-requests" onsubmit={`return confirm('Créer ${contractRequests.length} contrat(s) actif(s) et programmer toutes leurs visites ?')`}>
              <button type="submit" class="text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 transition-colors" style="background:rgba(139,92,246,0.2); color:#a78bfa; border:1px solid rgba(139,92,246,0.3);">
                <i class="fas fa-bolt"></i>
                <span>Générer {contractRequests.length} contrat{contractRequests.length > 1 ? 's' : ''} automatiquement</span>
              </button>
            </form>
          )}
        </div>
        {requests.length === 0 ? (
          <div class="text-center py-12">
            <i class="fas fa-inbox text-3xl mb-3" style="color:#1e3a5f;"></i>
            <p class="text-sm" style="color:#64748b;">Aucune demande de maintenance</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-sm">
              <thead>
                <tr style="background:#f1f5f9; border-bottom:1px solid var(--admin-border);">
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">ID</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Client</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Type</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell" style="color:var(--admin-text-muted)">Formule & Détails</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell" style="color:var(--admin-text-muted)">Prix estimé</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell" style="color:var(--admin-text-muted)">Description</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Statut</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell" style="color:var(--admin-text-muted)">Date</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Actions</th>
                </tr>
              </thead>
              <tbody data-paginate="15">
                {requests.map((r: any) => {
                  const typeLabels: Record<string,string> = { occasionnelle: 'Ponctuelle', urgence: '🚨 Urgence', contrat: '📋 Contrat' }
                  const planNames: Record<string,string> = {
                    residentiel: 'Résidentiel',
                    professionnel: 'Professionnel / PME',
                    professionnel_pme: 'Professionnel / PME',
                    industriel: 'Industriel',
                    sur_mesure: 'Sur Mesure',
                    trimestriel: 'Trimestriel',
                    semestriel: 'Semestriel',
                    annuel: 'Annuel'
                  }
                  const statusBadge: Record<string,{l:string;c:string}> = {
                    pending:{l:'En attente',c:'badge-pending'},
                    contacted:{l:'Contacté',c:'badge-done'},
                    scheduled:{l:'Planifié',c:'badge-confirmed'},
                    done:{l:'Terminé',c:'badge-confirmed'},
                    cancelled:{l:'Annulé',c:'badge-cancelled'}
                  }
                  const sb = statusBadge[r.status] || {l:r.status,c:'badge-pending'}
                  const isContractType = r.request_type === 'contrat' || r.plan_type
                  const rawPlan = (r.plan_type || '').toLowerCase()
                  const planLabel = planNames[rawPlan] || (r.plan_type ? r.plan_type : '')

                  // Fallback intelligent pour le nombre de clims et la fréquence si non stockés séparément
                  const parsedClims = r.nb_climatiseurs || (r.description?.match(/(\d+)\s*clim/i)?.[1])
                  const parsedFreq = r.frequence_visites || (r.description?.includes('Essentiel') ? 'Essentiel' : r.description?.includes('Pro') ? 'Pro' : r.description?.includes('Confort') ? 'Confort' : null)

                  // Calcul du prix estimé si r.plan_price est vide
                  let displayPrice = Number(r.plan_price) || 0
                  if (!displayPrice && rawPlan) {
                    if (rawPlan === 'industriel' || rawPlan === 'sur_mesure') {
                      displayPrice = 0
                    } else {
                      const cnt = parseInt(String(parsedClims || '1'), 10)
                      const v = parsedFreq === 'Essentiel' ? 1 : (parsedFreq === 'Pro' ? 3 : 2)
                      const rate = cnt <= 4 ? 8500 : cnt <= 8 ? 7500 : cnt <= 15 ? 6000 : 5000
                      if (rawPlan === 'residentiel' || rawPlan === 'professionnel' || rawPlan === 'professionnel_pme') {
                        displayPrice = rate * cnt * v
                      } else if (rawPlan === 'semestriel') displayPrice = 55000
                      else if (rawPlan === 'trimestriel') displayPrice = 30000
                      else if (rawPlan === 'annuel') displayPrice = 100000
                    }
                  }

                  // Price display logic
                  let priceDisplay
                  if (displayPrice > 0) {
                    priceDisplay = (
                      <div>
                        <span class="text-emerald-400 font-extrabold">{displayPrice.toLocaleString('fr-FR')} F CFA</span>
                        <div class="text-[10px] font-normal text-slate-400">estimation calculée</div>
                      </div>
                    )
                  } else if (rawPlan === 'industriel' || rawPlan === 'sur_mesure') {
                    priceDisplay = <span class="text-amber-400 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">Sur devis</span>
                  } else if (r.request_type === 'contrat' || r.plan_type) {
                    priceDisplay = <span class="text-amber-400 text-xs font-medium">Sur devis</span>
                  } else {
                    priceDisplay = <span class="text-slate-500 text-xs">—</span>
                  }

                  return (
                    <tr style="border-bottom:1px solid var(--admin-border);" class="hover:bg-[rgba(3,105,161,0.04)]">
                      <td class="px-5 py-3 font-mono text-xs" style="color:var(--admin-accent)">#{r.id}</td>
                      <td class="px-5 py-3">
                        <div class="text-sm font-semibold" style="color:var(--admin-text-primary)">{r.client_name || r.name || '—'}</div>
                        <div class="text-xs" style="color:var(--admin-text-muted);">{r.client_phone || r.phone || ''}</div>
                        {r.quartier && <div class="text-xs" style="color:#94a3b8;">📍 {r.quartier}</div>}
                      </td>
                      <td class="px-5 py-3 text-sm" style="color:var(--admin-text-primary);">{typeLabels[r.request_type] || r.request_type}</td>
                      <td class="px-5 py-3 text-xs hidden md:table-cell" style="color:var(--admin-text-muted);">
                        {planLabel ? (
                          <div>
                            <span class="inline-block px-2.5 py-1 rounded-lg font-bold text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              <i class="fas fa-shield-alt mr-1 text-[10px]"></i>{planLabel}
                            </span>
                            {parsedClims && <div class="font-semibold text-slate-200 mt-1"><i class="fas fa-wind mr-1 text-sky-400 text-[10px]"></i>{parsedClims} climatiseur(s)</div>}
                            {parsedFreq && <div class="text-[11px] text-sky-400 font-medium"><i class="fas fa-calendar-alt mr-1 text-[10px]"></i>Fréq: {parsedFreq}</div>}
                            {r.type_etablissement && <div class="text-[10px] text-slate-400 mt-0.5">Site: {r.type_etablissement}</div>}
                          </div>
                        ) : (
                          <div class="font-medium text-slate-300">{r.equipment_type || '—'}</div>
                        )}
                      </td>
                      <td class="px-5 py-3 text-sm font-bold hidden md:table-cell" style="color:var(--admin-text-primary);">
                        {priceDisplay}
                      </td>
                      <td class="px-5 py-3 text-xs hidden lg:table-cell" title={r.description} style="color:var(--admin-text-muted);word-break:break-word;">{r.description || '—'}</td>
                      <td class="px-5 py-3"><span class={`text-xs font-bold px-2.5 py-1 rounded-full ${sb.c}`}>{sb.l}</span></td>
                      <td class="px-5 py-3 text-xs hidden sm:table-cell" style="color:#94a3b8;">{r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td class="px-5 py-3">
                        <div class="flex items-center gap-1 flex-wrap">
                          {/* Créer contrat — seulement pour les demandes de type contrat en attente */}
                          {isContractType && (r.status === 'pending' || r.status === 'contacted') && (
                            <form method="post" action="/admin/maintenance/convert-to-contract" style="display:inline;" onsubmit={`return confirm('Créer un contrat actif pour ${jsAttr(r.client_name || r.name || 'ce client')} et programmer ses visites automatiquement ?')`}>
                              <input type="hidden" name="request_id" value={String(r.id)} />
                              <button type="submit" class="text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap" style="background:rgba(139,92,246,0.2); color:#a78bfa; border:1px solid rgba(139,92,246,0.3);" title="Créer contrat & programmer visites">
                                <i class="fas fa-file-contract mr-1"></i>Activer contrat
                              </button>
                            </form>
                          )}
                          {/* Marquer contacté */}
                          {r.status === 'pending' && (
                            <form method="post" action="/admin/maintenance/update-request" style="display:inline;">
                              <input type="hidden" name="request_id" value={String(r.id)} />
                              <input type="hidden" name="status" value="contacted" />
                              <button type="submit" class="p-2 rounded-lg hover:bg-blue-500/20 transition-colors" title="Marquer contacté">
                                <i class="fas fa-phone text-xs" style="color:#38bdf8;"></i>
                              </button>
                            </form>
                          )}
                          {/* Planifier */}
                          {(r.status === 'pending' || r.status === 'contacted') && !isContractType && (
                            <form method="post" action="/admin/maintenance/update-request" style="display:inline;">
                              <input type="hidden" name="request_id" value={String(r.id)} />
                              <input type="hidden" name="status" value="scheduled" />
                              <button type="submit" class="p-2 rounded-lg hover:bg-green-500/20 transition-colors" title="Planifier">
                                <i class="fas fa-calendar-check text-xs" style="color:#34d399;"></i>
                              </button>
                            </form>
                          )}
                          {/* Annuler */}
                          {r.status !== 'cancelled' && r.status !== 'done' && (
                            <form method="post" action="/admin/maintenance/update-request" style="display:inline;" onsubmit="return confirm('Annuler cette demande ?')">
                              <input type="hidden" name="request_id" value={String(r.id)} />
                              <input type="hidden" name="status" value="cancelled" />
                              <button type="submit" class="p-2 rounded-lg hover:bg-yellow-500/20 transition-colors" title="Annuler la demande">
                                <i class="fas fa-ban text-xs" style="color:#f59e0b;"></i>
                              </button>
                            </form>
                          )}
                          {/* Supprimer */}
                          <form method="post" action="/admin/maintenance/delete-request" style="display:inline;" onsubmit="return confirm('Supprimer définitivement cette demande ? Cette action est irréversible.')">
                            <input type="hidden" name="request_id" value={String(r.id)} />
                            <button type="submit" class="p-2 rounded-lg hover:bg-red-500/20 transition-colors" title="Supprimer définitivement">
                              <i class="fas fa-trash text-xs" style="color:#f87171;"></i>
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Contrats ===== */}
      <div class="rounded-2xl overflow-hidden fade-in-up delay-2" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="px-5 py-4" style="border-bottom:1px solid var(--admin-border);">
          <h3 class="font-bold flex items-center space-x-2" style="color:var(--admin-text-primary)">
            <i class="fas fa-file-contract text-sm" style="color:#0ea5e9;"></i>
            <span>Contrats de maintenance</span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded-full" style="background:rgba(14,165,233,0.15); color:#38bdf8;">{contracts.length}</span>
          </h3>
        </div>
        {contracts.length === 0 ? (
          <div class="text-center py-12">
            <i class="fas fa-file-contract text-3xl mb-3" style="color:#1e3a5f;"></i>
            <p class="text-sm" style="color:#64748b;">Aucun contrat enregistré</p>
            {contractRequests.length > 0 && (
              <p class="text-xs mt-2" style="color:#a78bfa;">⚡ {contractRequests.length} souscription(s) en attente — utilisez le bouton en haut pour générer les contrats</p>
            )}
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-sm">
              <thead>
                <tr style="background:#f1f5f9; border-bottom:1px solid var(--admin-border);">
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell" style="color:var(--admin-text-muted)">ID</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Client</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell" style="color:var(--admin-text-muted)">Formule</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell" style="color:var(--admin-text-muted)">Prix</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell" style="color:var(--admin-text-muted)">Période</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Visites</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Statut</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell" style="color:var(--admin-text-muted)">Actions</th>
                </tr>
              </thead>
              <tbody data-paginate="10">
                {contracts.map((c: any) => {
                  const planLabels: Record<string,string> = {
                    trimestriel: 'Trimestriel (3/an)',
                    semestriel: 'Semestriel (2/an)',
                    annuel: 'Annuel (1/an)',
                    residentiel: 'Résidentiel',
                    professionnel: 'Professionnel / PME',
                    professionnel_pme: 'Professionnel / PME',
                    industriel: 'Industriel',
                    sur_mesure: 'Sur Mesure'
                  }
                  const statusBadge: Record<string,{l:string;c:string}> = {
                    en_attente: {l:'En attente',c:'badge-pending'},
                    contacte: {l:'Client contacté',c:'badge-pending'},
                    actif: {l:'Actif',c:'badge-confirmed'},
                    expire: {l:'Expiré',c:'badge-done'},
                    annule: {l:'Annulé',c:'badge-cancelled'}
                  }
                  const sb = statusBadge[c.status] || {l:c.status,c:'badge-pending'}
                  const contractVisits = visits.filter((v: any) => v.contract_id === c.id)
                  const completedCount = contractVisits.filter((v: any) => v.status === 'effectuee').length
                  const upcomingCount = contractVisits.filter((v: any) => v.status === 'planifiee' || v.status === 'confirmee').length
                  const cvUpcoming = contractVisits.filter((v: any) => v.status === 'planifiee' || v.status === 'confirmee').sort((a: any, b: any) => a.visit_date.localeCompare(b.visit_date))
                  const cvDone = contractVisits.filter((v: any) => v.status === 'effectuee').sort((a: any, b: any) => b.visit_date.localeCompare(a.visit_date))
                  const progress = (c.total_visits || 0) > 0 ? Math.round((completedCount / c.total_visits) * 100) : 0
                  return (
                    <>
                    <tr style="border-bottom:1px solid var(--admin-border);" class="hover:bg-[rgba(3,105,161,0.04)] cursor-pointer" onclick={`var el=document.getElementById('cv-${c.id}');el.classList.toggle('hidden');this.querySelector('.expand-icon').classList.toggle('fa-chevron-right');this.querySelector('.expand-icon').classList.toggle('fa-chevron-down');`}>
                      <td class="px-5 py-3 font-mono text-xs hidden lg:table-cell" style="color:var(--admin-accent)">
                        <i class="fas fa-chevron-right expand-icon text-xs mr-1" style="color:var(--admin-text-muted);"></i>#{c.id}
                      </td>
                      <td class="px-5 py-3 cursor-pointer hover:text-blue-400">
                        <div class="text-sm font-semibold" style="color:var(--admin-text-primary)">{c.client_name || c.client_phone || `Client #${c.client_id}`}</div>
                        {c.client_phone && <div class="text-xs" style="color:var(--admin-text-muted)">{c.client_phone}</div>}
                        {c.notes && <div class="text-[11px] text-slate-400 mt-0.5" title={c.notes}>{c.notes}</div>}
                      </td>
                      <td class="px-5 py-3 text-sm hidden md:table-cell" style="color:var(--admin-text-primary)">{planLabels[c.plan_type] || c.plan_type}</td>
                      <td class="px-5 py-3 font-bold hidden md:table-cell" style="color:var(--admin-text-primary)">{(c.plan_price || 0) > 0 ? (c.plan_price || 0).toLocaleString() + ' F' : 'Sur devis'}</td>
                      <td class="px-5 py-3 text-xs hidden lg:table-cell" style="color:var(--admin-text-muted)">
                        {c.start_date ? new Date(c.start_date).toLocaleDateString('fr-FR') : '—'} → {c.end_date ? new Date(c.end_date).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td class="px-5 py-3">
                        <div class="flex items-center space-x-2">
                          <div class="w-16 h-2 rounded-full" style="background:rgba(3,105,161,0.1);">
                            <div class="h-2 rounded-full" style={`width:${progress}%; background:linear-gradient(90deg,var(--admin-accent),var(--admin-accent-hover));`}></div>
                          </div>
                          <span class="text-sm font-bold" style="color:var(--admin-text-primary)">{completedCount}/{c.total_visits || 0}</span>
                        </div>
                        {upcomingCount > 0 && <div class="text-xs mt-0.5" style="color:#f59e0b;"><i class="fas fa-clock mr-1"></i>{upcomingCount} à venir</div>}
                      </td>
                      <td class="px-5 py-3"><span class={`text-xs font-bold px-2.5 py-1 rounded-full ${sb.c}`}>{sb.l}</span></td>
                      <td class="px-5 py-3 hidden sm:table-cell" onclick="event.stopPropagation()">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          {c.status === 'en_attente' && (
                            <form method="post" action="/api/admin/maintenance/validate-contract" style="display:inline;">
                              <input type="hidden" name="contract_id" value={String(c.id)} />
                              <button type="submit" class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors text-green-400" style="background:rgba(52,211,153,0.15); border:1px solid rgba(52,211,153,0.3);">
                                <i class="fas fa-check mr-1"></i>Activer
                              </button>
                            </form>
                          )}
                          {/* + Visite manuelle */}
                          <button type="button" class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors" style="background:rgba(14,165,233,0.15); color:#38bdf8; border:1px solid rgba(14,165,233,0.3);" onclick={`event.stopPropagation(); openAddVisitModal(${Number(c.id)}, '${jsAttr(c.client_name || '')}', '${jsAttr(c.client_phone || '')}')`} title="Programmer une visite manuelle">
                            <i class="fas fa-plus mr-1"></i>Visite
                          </button>
                          {c.status !== 'annule' && (
                            <form method="post" action="/api/admin/maintenance/refuse-contract" style="display:inline;" onsubmit="return confirm('Annuler ce contrat ?')">
                              <input type="hidden" name="contract_id" value={String(c.id)} />
                              <button type="submit" class="text-xs px-2 py-1.5 rounded-lg font-medium transition-colors text-red-400" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3);">
                                <i class="fas fa-ban mr-1"></i>Annuler
                              </button>
                            </form>
                          )}
                          <form method="post" action="/api/admin/maintenance/delete-contract" style="display:inline;" onsubmit="return confirm('Supprimer définitivement ce contrat et toutes ses visites ?')">
                            <input type="hidden" name="contract_id" value={String(c.id)} />
                            <button type="submit" class="text-xs px-2 py-1.5 rounded-lg font-medium transition-colors" style="background:rgba(239,68,68,0.2); color:#f87171;">
                              <i class="fas fa-trash"></i>
                            </button>
                          </form>
                          <a href={`/admin/devis/new?contract_id=${c.id}`} class="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap" style="background:rgba(14,165,233,0.1);color:#0ea5e9;border:1px solid rgba(14,165,233,0.2);">
                            <i class="fas fa-file-invoice-dollar mr-1"></i>Devis
                          </a>
                        </div>
                      </td>
                    </tr>
                    {/* Expandable visits detail row */}
                    <tr id={`cv-${c.id}`} class="hidden">
                      <td colspan={8} class="px-5 py-4" style="background:rgba(14,165,233,0.03); border-bottom:2px solid rgba(14,165,233,0.1);">
                        <div class="mb-3 flex items-center justify-between">
                          <span class="text-xs font-bold uppercase tracking-wide" style="color:#38bdf8;">Visites du contrat #{c.id}</span>
                          <button type="button" class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors" style="background:rgba(14,165,233,0.15); color:#38bdf8; border:1px solid rgba(14,165,233,0.3);" onclick={`openAddVisitModal(${Number(c.id)}, '${jsAttr(c.client_name || '')}', '${jsAttr(c.client_phone || '')}')`}>
                            <i class="fas fa-plus mr-1"></i>Programmer une visite
                          </button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Upcoming visits */}
                          <div>
                            <div class="text-xs font-bold uppercase tracking-wide mb-2 flex items-center space-x-1" style="color:#f59e0b;">
                              <i class="fas fa-calendar-alt"></i>
                              <span>À venir ({cvUpcoming.length})</span>
                            </div>
                            {cvUpcoming.length === 0 ? (
                              <div class="text-xs py-2" style="color:#64748b;">Aucune visite planifiée</div>
                            ) : (
                              <div class="space-y-1.5">
                                {cvUpcoming.map((v: any, idx: number) => {
                                  const dLeft = Math.ceil((new Date(v.visit_date).getTime() - new Date(today).getTime()) / 86400000)
                                  const isDue = dLeft <= 0
                                  return (
                                    <div class="flex items-center justify-between py-2 px-3 rounded-lg" style={isDue ? 'background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2);' : 'background:rgba(14,165,233,0.05); border:1px solid rgba(14,165,233,0.1);'}>
                                      <div class="flex items-center space-x-2">
                                        <span class="text-xs font-black w-5 h-5 rounded flex items-center justify-center" style={isDue ? 'background:rgba(245,158,11,0.2); color:#f59e0b;' : 'background:rgba(14,165,233,0.1); color:#0ea5e9;'}>{idx + 1}</span>
                                        <span class="text-sm" style="color:var(--admin-text-primary)">{fmtDate(v.visit_date)}</span>
                                      </div>
                                      <div class="flex items-center space-x-1">
                                        <span class="text-xs px-2 py-0.5 rounded-full font-bold" style={isDue ? 'background:rgba(245,158,11,0.15); color:#f59e0b;' : 'background:rgba(14,165,233,0.1); color:#0ea5e9;'}>
                                          {isDue ? (dLeft === 0 ? "Aujourd'hui" : `${Math.abs(dLeft)}j retard`) : `J-${dLeft}`}
                                        </span>
                                        <button type="button" class="text-xs font-bold p-1.5 rounded-lg" style="background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.3);" onclick={`openValidationModal(${Number(v.id)}, '${jsAttr(v.client_name || c.client_name)}', '${jsAttr(v.visit_date)}', ${Number(c.id)})`} title="Valider l'entretien">
                                          <i class="fas fa-check"></i>
                                        </button>
                                        <form method="post" action="/admin/maintenance/update-visit" style="display:inline;">
                                          <input type="hidden" name="visit_id" value={String(v.id)} />
                                          <input type="hidden" name="status" value="annulee" />
                                          <button type="submit" class="text-xs font-bold p-1.5 rounded-lg" style="background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);" onclick="return confirm('Annuler cette visite ?')" title="Annuler">
                                            <i class="fas fa-ban"></i>
                                          </button>
                                        </form>
                                        <form method="post" action="/admin/maintenance/delete-visit" style="display:inline;">
                                          <input type="hidden" name="visit_id" value={String(v.id)} />
                                          <button type="submit" class="text-xs font-bold p-1.5 rounded-lg" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);" onclick="return confirm('Supprimer définitivement cette visite ?')" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                          </button>
                                        </form>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                          {/* Completed visits */}
                          <div>
                            <div class="text-xs font-bold uppercase tracking-wide mb-2 flex items-center space-x-1" style="color:#34d399;">
                              <i class="fas fa-check-double"></i>
                              <span>Effectuées ({cvDone.length})</span>
                            </div>
                            {cvDone.length === 0 ? (
                              <div class="text-xs py-2" style="color:#64748b;">Aucune visite effectuée</div>
                            ) : (
                              <div class="space-y-1.5">
                                {cvDone.map((v: any) => (
                                  <div class="flex items-center justify-between py-2 px-3 rounded-lg" style="background:rgba(52,211,153,0.05); border:1px solid rgba(52,211,153,0.1);">
                                    <div class="flex items-center space-x-2">
                                      <i class="fas fa-check-circle text-xs" style="color:#34d399;"></i>
                                      <span class="text-sm" style="color:var(--admin-text-primary)">{fmtDate(v.visit_date)}</span>
                                      {v.technician && <span class="text-xs" style="color:#64748b;">· {v.technician}</span>}
                                    </div>
                                    <div class="flex items-center gap-1">
                                      {v.actions_performed && <span class="text-xs" title={v.actions_performed} style="color:#94a3b8;">{v.actions_performed}</span>}
                                      <form method="post" action="/admin/maintenance/delete-visit" style="display:inline;">
                                        <input type="hidden" name="visit_id" value={String(v.id)} />
                                        <button type="submit" class="text-xs p-1 rounded" style="color:#64748b;" onclick="return confirm('Supprimer cette visite effectuée ?')" title="Supprimer">
                                          <i class="fas fa-times"></i>
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Visites techniques ===== */}
      <div class="rounded-2xl overflow-hidden fade-in-up delay-3" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="px-5 py-4 flex items-center justify-between gap-3" style="border-bottom:1px solid var(--admin-border);">
          <h3 class="font-bold flex items-center space-x-2" style="color:var(--admin-text-primary)">
            <i class="fas fa-clipboard-check text-sm" style="color:#34d399;"></i>
            <span>Visites techniques</span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded-full" style="background:rgba(52,211,153,0.15); color:#34d399;">{visits.length}</span>
          </h3>
          <div class="flex items-center gap-2">
            {dueVisits.length > 0 && (
              <span class="text-xs px-3 py-1 rounded-full font-bold animate-pulse" style="background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);">
                <i class="fas fa-bell mr-1"></i>{dueVisits.length} à valider
              </span>
            )}
            <button type="button" class="text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 transition-colors" style="background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.3);" onclick="openAddVisitModal(0, '', '')">
              <i class="fas fa-plus"></i>
              <span>Programmer une visite</span>
            </button>
          </div>
        </div>
        {visits.length === 0 ? (
          <div class="text-center py-12">
            <i class="fas fa-clipboard-check text-3xl mb-3" style="color:#1e3a5f;"></i>
            <p class="text-sm" style="color:#64748b;">Aucune visite enregistrée</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-sm">
              <thead>
                <tr style="background:#f1f5f9; border-bottom:1px solid var(--admin-border);">
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">ID</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Client</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Contrat</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Type</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Date prévue</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Technicien</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Statut</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Actions</th>
                </tr>
              </thead>
              <tbody data-paginate="10">
                {visits.map((v: any) => {
                  const visitTypeLabels: Record<string,string> = { preventive: 'Préventive', occasionnelle: 'Occasionnelle', urgence: 'Urgence' }
                  const statusBadge: Record<string,{l:string;c:string}> = {
                    planifiee: {l:'Planifiée',c:'badge-pending'},
                    confirmee: {l:'Confirmée',c:'badge-done'},
                    effectuee: {l:'Effectuée',c:'badge-confirmed'},
                    annulee: {l:'Annulée',c:'badge-cancelled'}
                  }
                  const sb = statusBadge[v.status] || {l:v.status,c:'badge-pending'}
                  const isDue = v.status === 'planifiee' && v.visit_date <= today
                  const contract = contracts.find((c: any) => c.id === v.contract_id)
                  return (
                    <tr style={`border-bottom:1px solid var(--admin-border);${isDue ? ' background:rgba(245,158,11,0.05);' : ''}`} class="hover:bg-[rgba(3,105,161,0.04)]">
                      <td class="px-5 py-3 font-mono text-xs" style="color:var(--admin-accent)">#{v.id}</td>
                      <td class="px-5 py-3">
                        <div class="text-sm font-semibold" style="color:var(--admin-text-primary)">{v.client_name || (contract ? contract.client_name : '—')}</div>
                        <div class="text-xs" style="color:var(--admin-text-muted);">{v.client_phone || (contract ? contract.client_phone : '')}</div>
                      </td>
                      <td class="px-5 py-3 text-xs" style="color:var(--admin-text-primary);">
                        {v.contract_id ? `#${v.contract_id}` : '—'}
                        {contract && <div class="text-xs" style="color:var(--admin-text-muted);">{contract.plan_type}</div>}
                      </td>
                      <td class="px-5 py-3 text-sm" style="color:var(--admin-text-primary);">{visitTypeLabels[v.visit_type] || v.visit_type || '—'}</td>
                      <td class="px-5 py-3">
                        <span class={`text-sm ${isDue ? 'font-bold' : ''}`} style={isDue ? 'color:#f59e0b;' : 'color:var(--admin-text-primary);'}>
                          {v.visit_date ? new Date(v.visit_date).toLocaleDateString('fr-FR') : '—'}
                        </span>
                        {isDue && <div class="text-xs font-bold" style="color:#ef4444;">⚠️ Échue</div>}
                      </td>
                      <td class="px-5 py-3 text-sm" style="color:#94a3b8;">
                        {v.technician || '—'}
                      </td>
                      <td class="px-5 py-3"><span class={`text-xs font-bold px-2.5 py-1 rounded-full ${sb.c}`}>{sb.l}</span></td>
                      <td class="px-5 py-3">
                        <div class="flex items-center gap-1">
                          {(v.status === 'planifiee' || v.status === 'confirmee') && (
                            <>
                              <button type="button" class="p-2 rounded-lg hover:bg-green-500/20 transition-colors" title="Valider l'entretien" onclick={`openValidationModal(${Number(v.id)}, '${jsAttr(v.client_name)}', '${jsAttr(v.visit_date)}', ${Number(v.contract_id) || 0})`}>
                                <i class="fas fa-check-circle text-sm" style="color:#34d399;"></i>
                              </button>
                              <form method="post" action="/admin/maintenance/update-visit" style="display:inline;">
                                <input type="hidden" name="visit_id" value={String(v.id)} />
                                <input type="hidden" name="status" value="annulee" />
                                <button type="submit" class="p-2 rounded-lg hover:bg-yellow-500/20 transition-colors" title="Annuler" onclick="return confirm('Annuler cette visite ?')">
                                  <i class="fas fa-ban text-sm" style="color:#f59e0b;"></i>
                                </button>
                              </form>
                            </>
                          )}
                          {v.status === 'effectuee' && (
                            <span class="text-xs" style="color:#34d399;"><i class="fas fa-check-double mr-1"></i>Validée</span>
                          )}
                          {/* Supprimer — toujours disponible */}
                          <form method="post" action="/admin/maintenance/delete-visit" style="display:inline;">
                            <input type="hidden" name="visit_id" value={String(v.id)} />
                            <button type="submit" class="p-2 rounded-lg hover:bg-red-500/20 transition-colors" title="Supprimer définitivement" onclick="return confirm('Supprimer définitivement cette visite ?')">
                              <i class="fas fa-trash text-xs" style="color:#f87171;"></i>
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* ===== MODAL VALIDATION VISITE ===== */}
    <div id="validation-modal" class="fixed inset-0 z-50 hidden" style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px);">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-lg rounded-2xl p-6" style="background:var(--admin-card-bg); border:1px solid var(--admin-border); box-shadow:0 25px 50px rgba(0,0,0,0.3);">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold flex items-center space-x-2" style="color:var(--admin-text-primary)">
              <i class="fas fa-check-circle" style="color:#34d399;"></i>
              <span>Valider l'entretien</span>
            </h3>
            <button type="button" onclick="closeValidationModal()" class="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <i class="fas fa-times text-gray-400"></i>
            </button>
          </div>
          <div id="modal-visit-info" class="mb-4 p-3 rounded-xl" style="background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.15);">
          </div>
          <form method="post" action="/admin/maintenance/validate-visit" class="space-y-4">
            <input type="hidden" name="visit_id" id="modal-visit-id" />
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Technicien</label>
              <input type="text" name="technician" placeholder="Nom du technicien" class="input-field" required />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Actions réalisées</label>
              <textarea name="actions_performed" rows={3} placeholder="Nettoyage filtres, recharge gaz, vérification..." class="input-field" style="resize:vertical;" required></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="gas_recharged" value="1" class="w-4 h-4 rounded" style="accent-color:#0ea5e9;" />
                <span class="text-sm text-gray-300">Gaz rechargé</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="filters_cleaned" value="1" class="w-4 h-4 rounded" style="accent-color:#0ea5e9;" />
                <span class="text-sm text-gray-300">Filtres nettoyés</span>
              </label>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Notes supplémentaires</label>
              <textarea name="notes" rows={2} placeholder="Remarques, état de l'équipement..." class="input-field" style="resize:vertical;"></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
              <button type="button" onclick="closeValidationModal()" class="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors" style="background:rgba(255,255,255,0.08); color:#94a3b8;">
                Annuler
              </button>
              <button type="submit" class="btn-primary px-5 py-2.5 text-sm font-bold rounded-xl flex items-center space-x-2">
                <i class="fas fa-check-circle"></i>
                <span>Confirmer l'entretien</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    {/* ===== MODAL PROGRAMMER UNE VISITE ===== */}
    <div id="add-visit-modal" class="fixed inset-0 z-50 hidden" style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px);">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-lg rounded-2xl p-6" style="background:var(--admin-card-bg); border:1px solid var(--admin-border); box-shadow:0 25px 50px rgba(0,0,0,0.3);">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold flex items-center space-x-2" style="color:var(--admin-text-primary)">
              <i class="fas fa-calendar-plus" style="color:#38bdf8;"></i>
              <span>Programmer une visite</span>
            </h3>
            <button type="button" onclick="document.getElementById('add-visit-modal').classList.add('hidden')" class="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <i class="fas fa-times text-gray-400"></i>
            </button>
          </div>
          <form method="post" action="/admin/maintenance/add-visit" class="space-y-4">
            <input type="hidden" name="contract_id" id="add-visit-contract-id" />
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Nom du client</label>
                <input type="text" name="client_name" id="add-visit-client-name" placeholder="Nom" class="input-field" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Téléphone</label>
                <input type="text" name="client_phone" id="add-visit-client-phone" placeholder="+225..." class="input-field" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Date de visite <span style="color:#f87171;">*</span></label>
              <input type="date" name="visit_date" class="input-field" required />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Type de visite</label>
              <select name="visit_type" class="input-field">
                <option value="preventive">Préventive (contrat)</option>
                <option value="occasionnelle">Occasionnelle</option>
                <option value="urgence">Urgence</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Technicien (optionnel)</label>
              <input type="text" name="technician" placeholder="Nom du technicien assigné" class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Notes</label>
              <textarea name="notes" rows={2} placeholder="Instructions ou remarques..." class="input-field" style="resize:vertical;"></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
              <button type="button" onclick="document.getElementById('add-visit-modal').classList.add('hidden')" class="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors" style="background:rgba(255,255,255,0.08); color:#94a3b8;">
                Annuler
              </button>
              <button type="submit" class="btn-primary px-5 py-2.5 text-sm font-bold rounded-xl flex items-center space-x-2">
                <i class="fas fa-calendar-check"></i>
                <span>Programmer la visite</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      ${CLIENT_ESC_HELPER}
      function openValidationModal(visitId, clientName, visitDate, contractId) {
        document.getElementById('modal-visit-id').value = visitId;
        var d = visitDate ? new Date(visitDate).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '—';
        document.getElementById('modal-visit-info').innerHTML =
          '<div class="text-sm text-white font-semibold">' + _esc(clientName || 'Client') + '</div>' +
          '<div class="text-xs" style="color:#94a3b8;">Visite #' + _esc(visitId) + ' · Prévue le ' + _esc(d) + (contractId ? ' · Contrat #' + _esc(contractId) : '') + '</div>';
        document.getElementById('validation-modal').classList.remove('hidden');
      }
      function closeValidationModal() {
        document.getElementById('validation-modal').classList.add('hidden');
      }
      function openAddVisitModal(contractId, clientName, clientPhone) {
        document.getElementById('add-visit-contract-id').value = contractId || '';
        document.getElementById('add-visit-client-name').value = clientName || '';
        document.getElementById('add-visit-client-phone').value = clientPhone || '';
        document.getElementById('add-visit-modal').classList.remove('hidden');
      }
      document.getElementById('validation-modal').addEventListener('click', function(e) {
        if (e.target === this) closeValidationModal();
      });
      document.getElementById('add-visit-modal').addEventListener('click', function(e) {
        if (e.target === this) document.getElementById('add-visit-modal').classList.add('hidden');
      });
    `}} />

  </AdminLayout>
  )
}


// ============================================================
// PAGE ADMIN MESSAGES
// ============================================================
