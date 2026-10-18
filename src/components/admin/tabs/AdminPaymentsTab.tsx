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

export const AdminPaiementsPage = ({ payments = [], stats }: { payments: any[]; stats?: { total: number; pending: number; completed: number; failed: number; revenue: number } }) => {
  const s = stats || { total: payments.length, pending: 0, completed: 0, failed: 0, revenue: 0 }
  return (
  <AdminLayout activePage="paiements">
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 fade-in-up">
        <div>
          <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">Paiements</h2>
          <p class="text-sm text-blue-300/60 mt-1">Suivi et gestion de tous les paiements</p>
        </div>
        <a href="/api/admin/export/payments" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
          <i class="fas fa-file-csv"></i>
          <span>Export CSV</span>
        </a>
      </div>

      {/* Stats cards */}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 fade-in-up delay-1">
        {[
          { icon: 'fa-receipt', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Total', val: String(s.total) },
          { icon: 'fa-clock', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', label: 'En attente', val: String(s.pending) },
          { icon: 'fa-check-circle', color: '#34d399', bg: 'rgba(52,211,153,0.15)', label: 'Complétés', val: String(s.completed) },
          { icon: 'fa-times-circle', color: '#f87171', bg: 'rgba(248,113,113,0.15)', label: 'Échoués', val: String(s.failed) },
          { icon: 'fa-money-bill-wave', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: 'Revenu', val: s.revenue.toLocaleString() + ' F' },
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

      {/* Filter tabs */}
      <div class="flex gap-2 flex-wrap fade-in-up delay-2">
        {[
          { href: '/admin/paiements', label: 'Tous', active: true },
          { href: '/admin/paiements?status=pending', label: 'En attente' },
          { href: '/admin/paiements?status=completed', label: 'Payés' },
          { href: '/admin/paiements?status=failed', label: 'Échoués' },
        ].map(f => (
          <a href={f.href} class="px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={f.active ? 'background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);' : 'background:rgba(255,255,255,0.05); color:#94a3b8; border:1px solid rgba(255,255,255,0.08);'}>{f.label}</a>
        ))}
      </div>

      {/* Table */}
      <div class="rounded-2xl overflow-hidden fade-in-up delay-3" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        {payments.length === 0 ? (
          <div class="text-center py-16">
            <i class="fas fa-receipt text-4xl mb-3" style="color:#1e3a5f;"></i>
            <p class="text-sm" style="color:#64748b;">Aucun paiement enregistré</p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="admin-table w-full text-sm">
              <thead>
                <tr style="background:#f1f5f9; border-bottom:1px solid var(--admin-border);">
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell" style="color:var(--admin-text-muted)">ID</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Client</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell" style="color:var(--admin-text-muted)">Type</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Montant</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell" style="color:var(--admin-text-muted)">Méthode</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider" style="color:var(--admin-text-muted)">Statut</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell" style="color:var(--admin-text-muted)">Réf.</th>
                  <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell" style="color:var(--admin-text-muted)">Date</th>
                  <th class="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody data-paginate="15">
                {payments.map((p: any) => {
                  const statusMap: Record<string,{label:string;cls:string}> = {
                    pending: { label: 'En attente', cls: 'badge-pending' },
                    processing: { label: 'En cours', cls: 'badge-pending' },
                    completed: { label: 'Payé', cls: 'badge-confirmed' },
                    failed: { label: 'Échoué', cls: 'badge-cancelled' },
                    refunded: { label: 'Remboursé', cls: 'badge-done' },
                    cancelled: { label: 'Annulé', cls: 'badge-cancelled' },
                  }
                  const st = statusMap[p.status] || { label: p.status, cls: 'badge-pending' }
                  const methodMap: Record<string,string> = { orange_money: 'Orange Money', moov_money: 'Moov Money', wave: 'Wave', carte_bancaire: 'Carte', ligdicash: 'LigdiCash', cash: 'Espèces' }
                  const typeMap: Record<string,string> = { order: 'Commande', maintenance: 'Maintenance' }
                  return (
                    <tr style="border-bottom:1px solid var(--admin-border);" class="hover:bg-[rgba(3,105,161,0.04)]">
                      <td class="px-5 py-3 font-mono text-xs hidden lg:table-cell" style="color:var(--admin-accent)">#{p.id}</td>
                      <td class="px-5 py-3">
                        <div class="font-semibold text-sm" style="color:var(--admin-text-primary)">{p.client_name || '—'}</div>
                        <div class="text-xs" style="color:var(--admin-text-muted)">{p.client_phone || ''}</div>
                      </td>
                      <td class="px-5 py-3 text-sm hidden sm:table-cell" style="color:var(--admin-text-primary)">{typeMap[p.payment_type] || p.payment_type}</td>
                      <td class="px-5 py-3 font-bold" style="color:var(--admin-text-primary)">{(p.amount || 0).toLocaleString()} F</td>
                      <td class="px-5 py-3 text-sm hidden md:table-cell" style="color:var(--admin-text-muted)">{methodMap[p.method] || p.method}</td>
                      <td class="px-5 py-3"><span class={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span></td>
                      <td class="px-5 py-3 text-xs font-mono hidden lg:table-cell" style="color:#64748b;">{p.provider_ref || '—'}</td>
                      <td class="px-5 py-3 text-xs hidden md:table-cell" style="color:#94a3b8;">{p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td class="px-5 py-3">
                        <span class="text-xs" style="color:#475569;">—</span>
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
  </AdminLayout>
  )
}


// ============================================================
// ADMIN MAINTENANCE PAGE
// ============================================================