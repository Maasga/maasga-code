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

export const AdminAvisPage = ({ success, deleted, allReviews = [] }: { success?: string; deleted?: string; allReviews?: any[] } = {}) => {
  const pending = allReviews.filter((r: any) => !r.approved)
  const approved = allReviews.filter((r: any) => r.approved)
  return (
  <AdminLayout activePage="avis">
    {(success || deleted) && (
      <div class={`mb-6 rounded-xl p-4 flex items-center space-x-2 border`} style={success ? 'background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3);' : 'background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3);'}>
        <i class={`fas ${success ? 'fa-check-circle text-green-400' : 'fa-trash text-red-400'}`}></i>
        <span class={`font-medium text-sm ${success ? 'text-green-300' : 'text-red-300'}`}>
          {success ? 'Avis approuvé et publié.' : 'Avis supprimé.'}
        </span>
      </div>
    )}

    <div class="mb-6">
      <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">Modération des avis</h2>
      <p class="text-sm mt-1" style="color:var(--admin-text-muted)">
        {pending.length} en attente · {approved.length} publiés
      </p>
    </div>

    {/* En attente de modération */}
    {pending.length > 0 && (
      <div class="mb-8">
        <h3 class="font-semibold text-gray-200 mb-4 flex items-center space-x-2">
          <span class="w-2 h-2 bg-orange-400 rounded-full"></span>
          <span>En attente de modération ({pending.length})</span>
        </h3>
        <div class="space-y-4">
          {pending.map((r: any) => (
            <div class="rounded-2xl p-5 card-shadow border-l-4 border-orange-400" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background:rgba(249,115,22,0.15);">
                      <span class="text-orange-400 font-bold text-sm">{(r.name || '?').charAt(0)}</span>
                    </div>
                    <div>
                      <div class="font-semibold text-gray-200 text-sm">{r.name}</div>
                      <div class="text-xs text-gray-400">{r.date} · {r.service}</div>
                    </div>
                    <div class="flex space-x-0.5 ml-2">
                      {[1,2,3,4,5].map(s => (
                        <i class={`fas fa-star text-sm ${s <= r.note ? 'text-yellow-400' : 'text-gray-600'}`}></i>
                      ))}
                    </div>
                  </div>
                  <p class="text-sm text-gray-400 leading-relaxed italic">"{r.comment}"</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <form method="post" action="/api/admin/avis/approve">
                    <input type="hidden" name="id" value={String(r.id)} />
                    <button type="submit" class="text-xs px-4 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(16,185,129,0.15); color:#34d399;">
                      <i class="fas fa-check mr-1"></i>Approuver
                    </button>
                  </form>
                  <form method="post" action="/api/admin/avis/reject">
                    <input type="hidden" name="id" value={String(r.id)} />
                    <button type="submit" class="text-xs px-4 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.15); color:#f87171;"
                      onclick="return confirm('Supprimer définitivement cet avis ?')">
                      <i class="fas fa-trash mr-1"></i>Rejeter
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {pending.length === 0 && (
      <div class="mb-8 rounded-xl p-5 text-center" style="background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.15);">
        <i class="fas fa-check-circle text-green-400 text-2xl mb-2"></i>
        <p class="text-green-300 text-sm font-medium">Aucun avis en attente de modération</p>
      </div>
    )}

    {/* Avis approuvés */}
    <div>
      <h3 class="font-semibold text-gray-200 mb-4 flex items-center space-x-2">
        <span class="w-2 h-2 bg-green-400 rounded-full"></span>
        <span>Avis publiés ({approved.length})</span>
      </h3>
      {approved.length === 0 ? (
        <div class="rounded-2xl p-10 text-center card-shadow text-gray-400" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <i class="fas fa-star text-3xl mb-3"></i>
          <p>Aucun avis publié pour le moment</p>
        </div>
      ) : (
        <div class="rounded-2xl card-shadow overflow-hidden" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b border-gray-700/50" style="background:#f1f5f9;">
                <tr>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Commentaire</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Service</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y" style="border-color:var(--admin-border)" data-paginate="15">
                {approved.map((r: any) => (
                  <tr class="hover:bg-[rgba(3,105,161,0.04)] transition-colors">
                    <td class="py-3 px-4 font-semibold text-sm" style="color:var(--admin-text-primary)">{r.name}</td>
                    <td class="py-3 px-4">
                      <div class="flex space-x-0.5">
                        {[1,2,3,4,5].map(s => (
                          <i class={`fas fa-star text-xs ${s <= r.note ? 'text-yellow-400' : 'text-gray-300'}`}></i>
                        ))}
                      </div>
                    </td>
                    <td class="py-3 px-4 text-xs italic hidden md:table-cell" title={r.comment} style="color:var(--admin-text-muted)"><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">"{r.comment}"</span></td>
                    <td class="py-3 px-4 text-xs hidden sm:table-cell" style="color:var(--admin-text-muted)">{r.service}</td>
                    <td class="py-3 px-4 text-xs hidden sm:table-cell" style="color:var(--admin-text-muted)">{r.date}</td>
                    <td class="py-3 px-4">
                      <form method="post" action="/api/admin/avis/reject">
                        <input type="hidden" name="id" value={String(r.id)} />
                        <button type="submit" class="text-xs text-red-500 hover:text-red-700 font-medium"
                          onclick="return confirm('Retirer cet avis ?')">
                          <i class="fas fa-trash"></i>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
  )
}
// ============================================================
// PAGE PARAMÈTRES
// ============================================================
