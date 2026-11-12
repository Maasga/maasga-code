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

export const AdminMessagesPage = ({ messages = [], unreadCount = 0, success, deleted }: { messages: any[]; unreadCount?: number; success?: string; deleted?: string }) => {
  return (
  <AdminLayout activePage="messages">
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-3 text-admin-fg">
            <i class="fas fa-envelope text-blue-400"></i>
            Messages de contact
            {unreadCount > 0 && (
              <span class="bg-red-500 text-white text-sm font-bold rounded-full px-2.5 py-0.5">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>
            )}
          </h1>
          <p class="text-sm mt-1" style="color:var(--admin-text-muted)">{messages.length} message{messages.length !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div class="p-4 rounded-xl text-sm" style="background:rgba(var(--rgb-green),0.1); border:1px solid rgba(var(--rgb-green),0.3); color:var(--fg-on-dark-success);">
          <i class="fas fa-check-circle mr-2"></i>Action effectuée avec succès.
        </div>
      )}
      {deleted && (
        <div class="p-4 rounded-xl text-sm" style="background:rgba(var(--rgb-amber),0.1); border:1px solid rgba(var(--rgb-amber),0.3); color:var(--fg-on-dark-warning);">
          <i class="fas fa-trash mr-2"></i>Message supprimé.
        </div>
      )}

      {/* Messages list */}
      {messages.length === 0 ? (
        <div class="text-center py-20 rounded-2xl bg-admin-card border border-admin-line">
          <i class="fas fa-inbox text-5xl text-gray-600 mb-4"></i>
          <p class="text-gray-400 text-lg">Aucun message reçu</p>
          <p class="text-gray-500 text-sm mt-2">Les messages envoyés via le formulaire de contact apparaîtront ici.</p>
        </div>
      ) : (
        <div class="space-y-3">
          {messages.map((m: any) => (
            <div
              class="rounded-xl p-5 transition-all hover:shadow-lg"
              style={`background:${m.is_read ? 'var(--admin-card-bg)' : 'rgba(59,130,246,0.04)'}; border:1px solid ${m.is_read ? 'var(--admin-border)' : 'rgba(59,130,246,0.25)'};`}
            >
              <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                  {!m.is_read && (
                    <span class="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" title="Non lu"></span>
                  )}
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={`background:${m.is_read ? 'rgba(100,116,139,0.15)' : 'rgba(59,130,246,0.15)'};`}>
                    <i class={`fas fa-user text-sm ${m.is_read ? 'text-gray-500' : 'text-blue-400'}`}></i>
                  </div>
                  <div>
                    <h3 class={`font-semibold`} style={m.is_read ? "color:var(--admin-text-muted)" : "color:var(--admin-text-primary)"} data-unused={`${m.is_read ? 'text-gray-300' : 'text-white'}`}>{m.name}</h3>
                    <div class="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                      {m.phone && (
                        <span><i class="fas fa-phone mr-1"></i>{m.phone}</span>
                      )}
                      {m.email && (
                        <span><i class="fas fa-envelope mr-1"></i>{m.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="text-xs text-admin-muted">
                    <i class="fas fa-clock mr-1"></i>
                    {m.created_at ? new Date(m.created_at + 'Z').toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                  {m.is_read ? (
                    <span class="text-xs px-2 py-0.5 rounded-full" style="background:rgba(100,116,139,0.15); color:#94a3b8;">Lu</span>
                  ) : (
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium text-fg-on-dark-info" style="background:rgba(var(--rgb-blue),0.15);">Nouveau</span>
                  )}
                </div>
              </div>

              {/* Message body */}
              <div class="rounded-lg p-4 mb-3 bg-admin-elevated border border-admin-line">
                <p style="color:var(--admin-text-primary);" class="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
              </div>

              {/* Actions */}
              <div class="flex flex-wrap items-center gap-2">
                {!m.is_read ? (
                  <form method="post" action={`/api/admin/messages/${m.id}/read`} class="inline">
                    <button type="submit" class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-fg-on-dark-success" style="background:rgba(var(--rgb-green),0.1); border:1px solid rgba(var(--rgb-green),0.2);">
                      <i class="fas fa-check mr-1"></i>Marquer comme lu
                    </button>
                  </form>
                ) : (
                  <form method="post" action={`/api/admin/messages/${m.id}/unread`} class="inline">
                    <button type="submit" class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-fg-on-dark-info" style="background:rgba(var(--rgb-blue),0.1); border:1px solid rgba(var(--rgb-blue),0.2);">
                      <i class="fas fa-envelope mr-1"></i>Marquer non lu
                    </button>
                  </form>
                )}
                {m.phone && (
                  <a href={`tel:${m.phone}`} class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-fg-on-dark-success" style="background:rgba(var(--rgb-green),0.1); border:1px solid rgba(var(--rgb-green),0.2);">
                    <i class="fas fa-phone mr-1"></i>Appeler
                  </a>
                )}
                {m.email && (
                  <a href={`mailto:${m.email}`} class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-admin-accent border border-admin-line" style="background:var(--admin-accent-light);">
                    <i class="fas fa-envelope mr-1"></i>Email
                  </a>
                )}
                {m.phone && (
                  <a href={`https://wa.me/${m.phone.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noopener noreferrer" class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-fg-whatsapp" style="background:rgba(var(--rgb-whatsapp),0.1); border:1px solid rgba(var(--rgb-whatsapp),0.2);">
                    <i class="fab fa-whatsapp mr-1"></i>WhatsApp
                  </a>
                )}
                <form method="post" action={`/api/admin/messages/${m.id}/delete`} class="inline" onsubmit="return confirm('Supprimer ce message ?')">
                  <button type="submit" class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-fg-on-dark-danger" style="background:rgba(var(--rgb-red),0.1); border:1px solid rgba(var(--rgb-red),0.2);">
                    <i class="fas fa-trash mr-1"></i>Supprimer
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

// ============================================================
// ADMIN RÉALISATIONS PAGE
// ============================================================

