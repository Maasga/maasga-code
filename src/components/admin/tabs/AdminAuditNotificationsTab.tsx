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

export const AdminAuditLogPage = ({ logs = [] }: { logs: any[] }) => {
  const categories = [...new Set(logs.map((l: any) => l.category).filter(Boolean))]

  return (
  <AdminLayout activePage="audit-log">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)"><i class="fas fa-clipboard-list mr-2 text-cyan-400"></i>Journal d'activité</h2>
        <p class="text-sm mt-1" style="color:var(--admin-text-muted)">{logs.length} entrées enregistrées</p>
      </div>
    </div>

    {/* Category summary */}
    <div class="flex flex-wrap gap-2 mb-6">
      {categories.map(cat => {
        const info = logCategoryColors[cat as string] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: 'fa-circle' }
        const count = logs.filter((l: any) => l.category === cat).length
        return (
        <span class="text-xs px-3 py-1.5 rounded-xl font-medium" style={`background:${info.bg}; color:${info.color};`}>
          <i class={`fas ${info.icon} mr-1`}></i>{String(cat)} ({count})
        </span>
        )
      })}
    </div>

    {/* Log entries */}
    {logs.length === 0 ? (
      <div class="text-center py-16 rounded-xl" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
        <i class="fas fa-clipboard-list text-3xl text-gray-600 mb-3"></i>
        <p class="text-gray-500">Aucune activité enregistrée</p>
      </div>
    ) : (
      <div class="rounded-2xl overflow-hidden card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="border-b" style="background:#f1f5f9; border-color:var(--admin-border);">
              <tr>
                <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style="color:var(--admin-text-muted)">Date</th>
                <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style="color:var(--admin-text-muted)">Client</th>
                <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color:var(--admin-text-muted)">Catégorie</th>
                <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style="color:var(--admin-text-muted)">Action</th>
                <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style="color:var(--admin-text-muted)">Détails</th>
                <th class="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style="color:var(--admin-text-muted)">IP</th>
              </tr>
            </thead>
            <tbody class="divide-y" style="border-color:var(--admin-border)" data-paginate="30">
              {logs.map((l: any) => {
                const info = logCategoryColors[l.category] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: 'fa-circle' }
                return (
                <tr class="hover:bg-[rgba(3,105,161,0.04)] transition-colors">
                  <td class="py-3 px-4 whitespace-nowrap" style="color:var(--admin-text-muted)">{(l.created_at || '').substring(0, 16)}</td>
                  <td class="py-3 px-4" style="color:var(--admin-text-primary)">{l.client_phone || `#${l.client_id}`}</td>
                  <td class="py-3 px-4 hidden sm:table-cell">
                    <span class="px-2 py-0.5 rounded-lg text-xs font-medium" style={`background:${info.bg}; color:${info.color};`}>
                      <i class={`fas ${info.icon} mr-1`}></i>{l.category || '-'}
                    </span>
                  </td>
                  <td class="py-3 px-4 font-medium" style="color:var(--admin-text-primary)">{l.action}</td>
                  <td class="py-3 px-4 hidden md:table-cell" title={l.details} style="color:var(--admin-text-muted)"><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:300px;">{l.details || '-'}</span></td>
                  <td class="py-3 px-4 font-mono text-xs hidden lg:table-cell" style="color:var(--admin-text-muted)">{l.ip_address || '-'}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </AdminLayout>
  )
}

/* ============= ADMIN NOTIFICATIONS PAGE ============= */
export const AdminNotificationsPage = ({ notifications = [] }: { notifications: any[] }) => {
  const unread = notifications.filter((n: any) => !n.read).length
  const typeIcons: Record<string, string> = { order: 'fa-shopping-cart', rdv: 'fa-calendar', review: 'fa-star', contact: 'fa-envelope', sav: 'fa-headset', client: 'fa-user', payment: 'fa-credit-card' }
  const typeColors: Record<string, string> = { order: '#a78bfa', rdv: '#fbbf24', review: '#f472b6', contact: '#60a5fa', sav: '#fb923c', client: '#34d399', payment: '#10b981' }

  return (
  <AdminLayout activePage="notifications">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)"><i class="fas fa-bell mr-2 text-cyan-400"></i>Centre de notifications</h2>
        <p class="text-sm mt-1" style="color:var(--admin-text-muted)">{notifications.length} notifications · {unread} non lues</p>
      </div>
      <button onclick="fetch('/api/admin/notifications/mark-read',{method:'POST'}).then(()=>location.reload())" class="px-4 py-2 rounded-xl text-xs font-bold text-white" style="background:linear-gradient(135deg,#0891b2,#06b6d4);">
        <i class="fas fa-check-double mr-2"></i>Tout marquer comme lu
      </button>
    </div>

    {/* Stats */}
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total', val: notifications.length, color: '#38bdf8', icon: 'fa-bell' },
        { label: 'Non lues', val: unread, color: '#ef4444', icon: 'fa-envelope' },
        { label: 'Aujourd\'hui', val: notifications.filter((n: any) => n.created_at && n.created_at.startsWith(new Date().toISOString().slice(0,10))).length, color: '#10b981', icon: 'fa-clock' },
        { label: 'Types', val: [...new Set(notifications.map((n: any) => n.type))].length, color: '#a78bfa', icon: 'fa-layer-group' },
      ].map(s => (
        <div class="rounded-xl p-4" style={`background: var(--admin-card-bg); border: 1px solid var(--admin-border);`}>
          <div class="flex items-center gap-2 mb-2">
            <i class={`fas ${s.icon} text-sm`} style={`color:${s.color};`}></i>
            <span class="text-xs" style="color: var(--admin-text-muted);">{s.label}</span>
          </div>
          <div class="text-lg font-bold" style="color: var(--admin-text-primary);">{s.val}</div>
        </div>
      ))}
    </div>

    {notifications.length === 0 ? (
      <div class="text-center py-16 rounded-xl" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
        <i class="fas fa-bell-slash text-3xl text-gray-600 mb-3"></i>
        <p class="text-gray-500">Aucune notification</p>
      </div>
    ) : (
      <div class="space-y-2">
        {notifications.map((n: any) => {
          const icon = typeIcons[n.type] || 'fa-bell'
          const color = typeColors[n.type] || '#94a3b8'
          return (
          <div class={`flex items-start gap-4 p-4 rounded-xl transition-colors ${n.read ? 'opacity-60' : ''}`} style={`background:${n.read ? 'var(--admin-bg)' : 'rgba(3,105,161,0.04)'}; border:1px solid ${n.read ? 'var(--admin-border)' : 'rgba(3,105,161,0.15)'};`}>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={`background:${color}18;`}>
              <i class={`fas ${icon} text-sm`} style={`color:${color};`}></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class={`text-sm ${n.read ? '' : 'font-semibold'}`}>{n.summary}</p>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-xs" style="color:var(--admin-text-muted)">{(n.created_at || '').replace('T', ' ').substring(0, 16)}</span>
                <span class="text-xs px-2 py-0.5 rounded-lg font-medium" style={`background:${color}18; color:${color};`}>{n.type}</span>
              </div>
            </div>
            {!n.read && <div class="w-2.5 h-2.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>}
          </div>
          )
        })}
      </div>
    )}
  </AdminLayout>
  )
}



