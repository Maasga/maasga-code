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

export const AdminSAVPage = ({ tickets = [], filterStatus = '' }: { tickets: any[]; filterStatus?: string }) => {
  const filtered = filterStatus ? tickets.filter((t: any) => t.status === filterStatus) : tickets
  const open = tickets.filter((t: any) => t.status === 'ouvert').length
  const inProgress = tickets.filter((t: any) => t.status === 'en_cours').length
  const waiting = tickets.filter((t: any) => t.status === 'attente_client').length
  const resolved = tickets.filter((t: any) => t.status === 'resolu' || t.status === 'ferme').length

  return (
  <AdminLayout activePage="sav">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)"><i class="fas fa-headset mr-2 text-cyan-400"></i>SAV / Tickets Support</h2>
        <p class="text-sm mt-1" style="color:var(--admin-text-muted)">{tickets.length} tickets · {open} ouverts · {inProgress} en cours</p>
      </div>
      <div class="flex gap-2">
        <a href="/api/admin/export/tickets" class="text-xs px-3 py-2 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
          <i class="fas fa-file-csv"></i>
          <span>Export CSV</span>
        </a>
        <button onclick="document.getElementById('create-ticket-modal').classList.remove('hidden')"
          class="btn-primary font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 text-xs shadow-md">
          <i class="fas fa-plus"></i>
          <span>Nouveau ticket</span>
        </button>
      </div>
    </div>

    {/* KPIs */}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {[
        { label: 'Ouverts', val: open, icon: 'fa-folder-open', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
        { label: 'En cours', val: inProgress, icon: 'fa-spinner', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
        { label: 'Attente client', val: waiting, icon: 'fa-clock', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
        { label: 'Résolus/Fermés', val: resolved, icon: 'fa-check-circle', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' }
      ].map(s => (
        <div class="rounded-xl p-4 card-shadow" style={`background:${s.bg}; border:1px solid ${s.border};`}>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={`background:${s.bg};`}>
              <i class={`fas ${s.icon} text-lg`} style={`color:${s.color};`}></i>
            </div>
            <div>
              <div class="text-xl font-bold leading-none" style="color:var(--admin-text-primary)">{s.val}</div>
              <div class="text-xs mt-0.5" style="color:var(--admin-text-muted)">{s.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Status filters */}
    <div class="flex flex-wrap gap-2 mb-6">
      {[
        { s: '', label: 'Tous', count: tickets.length },
        { s: 'ouvert', label: 'Ouverts', count: open },
        { s: 'en_cours', label: 'En cours', count: inProgress },
        { s: 'attente_client', label: 'Attente', count: waiting },
        { s: 'resolu', label: 'Résolus', count: tickets.filter((t: any) => t.status === 'resolu').length },
        { s: 'ferme', label: 'Fermés', count: tickets.filter((t: any) => t.status === 'ferme').length }
      ].map(f => (
        <a href={`/admin/sav${f.s ? '?status=' + f.s : ''}`}
          class={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors ${filterStatus === f.s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-700 text-gray-400 hover:bg-cyan-900/10'}`}
          style={filterStatus !== f.s ? 'background:var(--admin-bg-elevated);' : ''}>
          {f.label} ({f.count})
        </a>
      ))}
    </div>

    {/* Tickets list */}
    {filtered.length === 0 ? (
      <div class="text-center py-16 rounded-xl" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
        <i class="fas fa-headset text-3xl text-gray-600 mb-3"></i>
        <p class="text-gray-500">Aucun ticket{filterStatus ? ` avec ce statut` : ''}</p>
      </div>
    ) : (
      <div class="space-y-3">
        {filtered.map((t: any) => {
          const cat = ticketCategoryLabels[t.category] || ticketCategoryLabels.autre
          const st = ticketStatusLabels[t.status] || ticketStatusLabels.ouvert
          const pr = ticketPriorityLabels[t.priority] || ticketPriorityLabels.normal
          return (
          <a href={`/admin/sav/${t.id}`} class="block rounded-xl p-4 hover:scale-[1.005] transition-all cursor-pointer" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="text-xs font-mono px-2 py-0.5 rounded-lg" style="background:rgba(59,130,246,0.15); color:#60a5fa;">{t.ticket_ref}</span>
                  <span class="text-xs px-2 py-0.5 rounded-lg font-medium" style={`background:${st.bg}; color:${st.color};`}>{st.label}</span>
                  <span class="text-xs px-2 py-0.5 rounded-lg" style={`color:${pr.color};`}>
                    <i class="fas fa-flag mr-1"></i>{pr.label}
                  </span>
                </div>
                <h3 class="font-semibold text-sm" style="color:var(--admin-text-primary);word-break:break-word;">{t.subject}</h3>
                <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span><i class={`fas ${cat.icon} mr-1`} style={`color:${cat.color};`}></i>{cat.label}</span>
                  <span><i class="fas fa-user mr-1"></i>{t.client_name || t.client_phone}</span>
                  {t.product_info && <span><i class="fas fa-solar-panel mr-1"></i>{t.product_info}</span>}
                  <span><i class="fas fa-clock mr-1"></i>{t.created_at?.substring(0, 10)}</span>
                </div>
              </div>
              <i class="fas fa-chevron-right text-gray-600 mt-2"></i>
            </div>
          </a>
          )
        })}
      </div>
    )}

    {/* Modal création ticket */}
    <div id="create-ticket-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.7);">
      <div class="rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style="background:linear-gradient(135deg,#0f172a,#1e293b); border:1px solid rgba(148,163,184,0.15);">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold" style="color:var(--admin-text-primary)"><i class="fas fa-plus-circle mr-2 text-cyan-400"></i>Nouveau ticket SAV</h3>
          <button onclick="document.getElementById('create-ticket-modal').classList.add('hidden')" class="text-xl" style="color:var(--admin-text-muted);">&times;</button>
        </div>
        <form method="post" action="/api/admin/sav/create" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Nom client</label>
              <input name="client_name" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Téléphone (Whatsapp) *</label>
              <input name="client_phone" required class="input-field text-sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Catégorie</label>
              <select name="category" class="input-field text-sm">
                <option value="panne">Panne</option>
                <option value="garantie">Garantie</option>
                <option value="installation">Installation</option>
                <option value="maintenance">Maintenance</option>
                <option value="reclamation">Réclamation</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Priorité</label>
              <select name="priority" class="input-field text-sm">
                <option value="basse">Basse</option>
                <option value="normal" selected>Normal</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Produit concerné</label>
            <input name="product_info" class="input-field text-sm" placeholder="Ex: Kit solaire 200W" />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Sujet *</label>
            <input name="subject" required class="input-field text-sm" placeholder="Résumé du problème" />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Description *</label>
            <textarea name="description" required rows={4} class="input-field text-sm" placeholder="Décrivez le problème en détail..."></textarea>
          </div>
          <button type="submit" class="btn-primary w-full py-2.5 rounded-xl font-semibold text-sm">
            <i class="fas fa-paper-plane mr-2"></i>Créer le ticket
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
  )
}

export const AdminSAVDetailPage = ({ ticket, messages = [] }: { ticket: any; messages: any[] }) => {
  const cat = ticketCategoryLabels[ticket.category] || ticketCategoryLabels.autre
  const st = ticketStatusLabels[ticket.status] || ticketStatusLabels.ouvert
  const pr = ticketPriorityLabels[ticket.priority] || ticketPriorityLabels.normal

  return (
  <AdminLayout activePage="sav">
    <div class="mb-6">
      <a href="/admin/sav" class="text-cyan-400 text-sm hover:underline mb-2 inline-block">
        <i class="fas fa-arrow-left mr-1"></i>Retour aux tickets
      </a>
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-mono px-2 py-0.5 rounded-lg" style="background:rgba(59,130,246,0.15); color:#60a5fa;">{ticket.ticket_ref}</span>
            <span class="text-xs px-2 py-0.5 rounded-lg font-medium" style={`background:${st.bg}; color:${st.color};`}>{st.label}</span>
            <span class="text-xs px-2 py-0.5 rounded-lg" style={`color:${pr.color};`}>
              <i class="fas fa-flag mr-1"></i>{pr.label}
            </span>
          </div>
          <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">{ticket.subject}</h2>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main conversation area */}
      <div class="lg:col-span-2 space-y-4">
        {/* Original description */}
        <div class="rounded-xl p-5" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background:rgba(59,130,246,0.2); color:#60a5fa;">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <span class="text-sm font-semibold" style="color:var(--admin-text-primary)">{ticket.client_name || ticket.client_phone}</span>
              <span class="text-xs ml-2" style="color:var(--admin-text-muted)">{ticket.created_at}</span>
            </div>
          </div>
          <p class="text-sm whitespace-pre-wrap" style="color:var(--admin-text-primary)">{ticket.description}</p>
        </div>

        {/* Messages thread */}
        {messages.map((m: any) => (
          <div class="rounded-xl p-4" style={`background:${m.sender_type === 'admin' ? 'rgba(3,105,161,0.06)' : 'var(--admin-bg)'}; border:1px solid ${m.sender_type === 'admin' ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.1)'};`}>
            <div class="flex items-center gap-2 mb-2">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={`background:${m.sender_type === 'admin' ? 'rgba(59,130,246,0.2)' : 'rgba(52,211,153,0.2)'}; color:${m.sender_type === 'admin' ? '#60a5fa' : '#34d399'};`}>
                <i class={`fas ${m.sender_type === 'admin' ? 'fa-user-shield' : 'fa-user'}`}></i>
              </div>
              <span class="text-sm font-medium" style="color:var(--admin-text-primary)">{m.sender_name || (m.sender_type === 'admin' ? 'Admin' : 'Client')}</span>
              <span class="text-xs" style="color:var(--admin-text-muted)">{m.created_at}</span>
            </div>
            <p class="text-sm whitespace-pre-wrap" style="color:var(--admin-text-primary)">{m.message}</p>
          </div>
        ))}

        {/* Reply form */}
        {(ticket.status !== 'ferme') && (
        <form method="post" action="/api/admin/sav/message" class="rounded-xl p-4" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <label class="block text-xs mb-2" style="color:var(--admin-text-muted);"><i class="fas fa-reply mr-1"></i>Répondre</label>
          <textarea name="message" required rows={3} class="input-field text-sm mb-3" placeholder="Votre réponse..."></textarea>
          <button type="submit" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
            <i class="fas fa-paper-plane mr-1"></i>Envoyer
          </button>
        </form>
        )}
      </div>

      {/* Sidebar: ticket info + actions */}
      <div class="space-y-4">
        {/* Ticket info card */}
        <div class="rounded-xl p-5" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
          <h3 class="text-sm font-bold mb-3" style="color:var(--admin-text-primary)"><i class="fas fa-info-circle mr-1 text-cyan-400"></i>Informations</h3>
          <div class="space-y-2.5 text-xs">
            <div class="flex justify-between"><span style="color:var(--admin-text-muted)">Client:</span><span style="color:var(--admin-text-primary)">{ticket.client_name || '-'}</span></div>
            <div class="flex justify-between"><span style="color:var(--admin-text-muted)">Téléphone:</span><span style="color:var(--admin-text-primary)">{ticket.client_phone}</span></div>
            <div class="flex justify-between"><span style="color:var(--admin-text-muted)">Catégorie:</span><span style={`color:${cat.color};`}><i class={`fas ${cat.icon} mr-1`}></i>{cat.label}</span></div>
            {ticket.product_info && <div class="flex justify-between"><span style="color:var(--admin-text-muted)">Produit:</span><span style="color:var(--admin-text-primary)">{ticket.product_info}</span></div>}
            <div class="flex justify-between"><span style="color:var(--admin-text-muted)">Créé le:</span><span style="color:var(--admin-text-primary)">{ticket.created_at?.substring(0, 10)}</span></div>
            {ticket.resolved_at && <div class="flex justify-between"><span style="color:var(--admin-text-muted)">Résolu le:</span><span class="text-green-400">{ticket.resolved_at?.substring(0, 10)}</span></div>}
          </div>
        </div>

        {/* Status update form */}
        <a href={`/admin/devis/new?ticket_id=${ticket.id}`} class="rounded-xl p-4 flex items-center justify-center space-x-2 text-sm font-semibold transition-all w-full" style="background:rgba(251,146,60,0.1);border:1px solid rgba(251,146,60,0.3);color:#fb923c;">
          <i class="fas fa-file-invoice-dollar"></i>
          <span>Créer un devis réparation</span>
        </a>
        <form method="post" action="/api/admin/sav/update-status" class="rounded-xl p-5" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
          <h3 class="text-sm font-bold mb-3" style="color:var(--admin-text-primary)"><i class="fas fa-edit mr-1 text-cyan-400"></i>Modifier le statut</h3>
          <input type="hidden" name="id" value={ticket.id} />
          <select name="status" class="input-field text-sm mb-3">
            {['ouvert', 'en_cours', 'attente_client', 'resolu', 'ferme'].map(s => (
              <option value={s} selected={ticket.status === s}>{(ticketStatusLabels[s] || { label: s }).label}</option>
            ))}
          </select>
          <label class="block text-xs mb-1" style="color:var(--admin-text-muted);">Notes de résolution</label>
          <textarea name="resolution_notes" rows={3} class="input-field text-sm mb-3">{ticket.resolution_notes || ''}</textarea>
          <button type="submit" class="bg-cyan-600 hover:bg-cyan-700 text-white w-full py-2 rounded-xl text-sm font-semibold transition-colors">
            <i class="fas fa-save mr-1"></i>Mettre à jour
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
  )
}

// ============================================================
// AUDIT LOG PAGE
// ============================================================
const logCategoryColors: Record<string, { color: string; bg: string; icon: string }> = {
  auth: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', icon: 'fa-sign-in-alt' },
  order: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: 'fa-shopping-cart' },
  appointment: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: 'fa-calendar' },
  review: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: 'fa-star' },
  maintenance: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: 'fa-tools' },
  payment: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: 'fa-credit-card' },
  contact: { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', icon: 'fa-envelope' },
  profile: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: 'fa-user' },
}
