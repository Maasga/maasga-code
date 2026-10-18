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

export const AdminRealisationsPage = ({ realisations = [], success, error }: { realisations: any[]; success?: string | null; error?: string | null }) => {
  const totalVisible = realisations.filter((r: any) => r.is_visible).length
  const totalFeatured = realisations.filter((r: any) => r.is_featured).length

  return (
  <AdminLayout activePage="realisations">
    <div class="mb-6">
      <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">Gestion des réalisations</h2>
      <p class="text-sm mt-1" style="color:var(--admin-text-muted)">Ajoutez et gérez vos projets terminés visibles sur le site</p>
    </div>

    {success && (
      <div class="mb-4 p-3 rounded-lg text-sm font-medium" style="background:rgba(22,163,74,0.15); color:#22c55e; border:1px solid rgba(22,163,74,0.3);">
        <i class="fas fa-check-circle mr-2"></i>
        {success === 'added' ? 'Réalisation ajoutée avec succès' : success === 'updated' ? 'Réalisation mise à jour' : success === 'deleted' ? 'Réalisation supprimée' : 'Opération réussie'}
      </div>
    )}
    {error && (
      <div class="mb-4 p-3 rounded-lg text-sm font-medium" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">
        <i class="fas fa-exclamation-circle mr-2"></i>Erreur : {error}
      </div>
    )}

    {/* KPIs */}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[
        { label: 'Total', val: realisations.length, icon: 'fa-images', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
        { label: 'Visibles', val: totalVisible, icon: 'fa-eye', color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
        { label: 'En vedette', val: totalFeatured, icon: 'fa-star', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' }
      ].map(s => (
        <div class="rounded-xl p-4 card-shadow" style={`background:${s.bg}; border:1px solid ${s.border};`}>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style={`background:${s.bg};`}>
              <i class={`fas ${s.icon} text-lg`} style={`color:${s.color};`}></i>
            </div>
            <div>
              <div class="text-xl font-bold" style="color:var(--admin-text-primary)">{s.val}</div>
              <div class="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Formulaire d'ajout */}
    <div class="rounded-2xl card-shadow overflow-hidden mb-6" style="background:var(--admin-card-bg); border:1px solid rgba(16,185,129,0.2);">
      <div class="p-5" style="border-bottom:1px solid rgba(16,185,129,0.15);">
        <h3 class="font-semibold flex items-center space-x-2" style="color:var(--admin-text-primary)">
          <i class="fas fa-plus-circle text-green-400"></i>
          <span>Ajouter une réalisation</span>
        </h3>
      </div>
      <form method="post" action="/api/admin/realisations/add" class="p-5 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs mb-1 font-semibold" style="color:var(--admin-text-muted)">Titre *</label>
            <input type="text" name="title" required placeholder="Ex: Installation Split 18000 BTU" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs mb-1 font-semibold" style="color:var(--admin-text-muted)">Catégorie</label>
            <select name="category" class="input-field text-sm">
              <option value="climatisation">Climatisation</option>
              <option value="ventilation">Ventilation</option>
              <option value="chambre_froide">Chambre froide</option>
              <option value="maintenance">Maintenance</option>
              <option value="commercial">Commercial</option>
              <option value="residentiel">Résidentiel</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs mb-1 font-semibold" style="color:var(--admin-text-muted)">Description</label>
          <textarea name="description" rows={3} placeholder="Décrivez le projet réalisé..." class="input-field text-sm" style="resize:vertical;"></textarea>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs mb-1 font-semibold" style="color:var(--admin-text-muted)">Client</label>
            <input type="text" name="client_name" placeholder="Nom du client" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs mb-1 font-semibold" style="color:var(--admin-text-muted)">Quartier</label>
            <input type="text" name="quartier" placeholder="Ex: Ouaga 2000" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs mb-1 font-semibold" style="color:var(--admin-text-muted)">Date réalisation</label>
            <input type="date" name="date_realisation" class="input-field text-sm" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs mb-1 font-semibold" style="color:var(--admin-text-muted)">URL de l'image</label>
            <input type="url" name="image_url" placeholder="https://..." class="input-field text-sm" />
          </div>
          <div class="flex items-end">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="is_featured" value="1" class="rounded" />
              <span class="text-sm" style="color:var(--admin-text-primary)"><i class="fas fa-star text-yellow-400 mr-1"></i>Mettre en vedette</span>
            </label>
          </div>
        </div>
        <button type="submit" class="px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105" style="background:linear-gradient(135deg,#10b981,#059669);">
          <i class="fas fa-plus mr-2"></i>Ajouter la réalisation
        </button>
      </form>
    </div>

    {/* Liste des réalisations */}
    <div class="rounded-2xl card-shadow overflow-hidden" style="background:var(--admin-card-bg); border:1px solid rgba(59,130,246,0.1);">
      <div class="p-5" style="border-bottom:1px solid rgba(148,163,184,0.08);">
        <h3 class="font-semibold flex items-center space-x-2" style="color:var(--admin-text-primary)">
          <i class="fas fa-list text-blue-400"></i>
          <span>Toutes les réalisations ({realisations.length})</span>
        </h3>
      </div>
      {realisations.length === 0 ? (
        <div class="p-8 text-center">
          <i class="fas fa-images text-3xl text-gray-600 mb-3"></i>
          <p class="text-gray-400">Aucune réalisation pour le moment</p>
        </div>
      ) : (
        <div class="divide-y" style="border-color:var(--admin-border)">
          {realisations.map((r: any) => (
            <div class="p-5 hover:bg-[rgba(3,105,161,0.04)] transition-colors">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h4 class="font-bold text-sm" style="color:var(--admin-text-primary)">{r.title}</h4>
                    {r.is_featured ? <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:rgba(251,191,36,0.15); color:#fbbf24;"><i class="fas fa-star mr-1"></i>Vedette</span> : null}
                    {!r.is_visible ? <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:rgba(239,68,68,0.15); color:#f87171;"><i class="fas fa-eye-slash mr-1"></i>Masqué</span> : null}
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:rgba(59,130,246,0.15); color:#60a5fa;">{categoryLabels[r.category] || r.category}</span>
                  </div>
                  {r.description && <p class="text-xs mb-2 line-clamp-2" style="color:var(--admin-text-muted)">{r.description}</p>}
                  <div class="flex flex-wrap gap-3 text-xs" style="color:var(--admin-text-muted)">
                    {r.client_name && <span><i class="fas fa-user mr-1"></i>{r.client_name}</span>}
                    {r.quartier && <span><i class="fas fa-map-marker-alt mr-1"></i>{r.quartier}</span>}
                    {r.date_realisation && <span><i class="fas fa-calendar mr-1"></i>{r.date_realisation}</span>}
                  </div>
                </div>
                {r.image_url && (
                  <img src={r.image_url} alt={r.title} class="w-20 h-20 rounded-lg object-cover flex-shrink-0" style="border:1px solid rgba(148,163,184,0.15);" />
                )}
              </div>
              <div class="flex items-center gap-2 mt-3">
                <button onclick={`document.getElementById('edit-form-${r.id}').classList.toggle('hidden')`} class="text-xs px-3 py-1.5 rounded-lg font-medium" style="background:rgba(59,130,246,0.1); color:#60a5fa; border:1px solid rgba(59,130,246,0.2);">
                  <i class="fas fa-edit mr-1"></i>Modifier
                </button>
                <form method="post" action="/api/admin/realisations/delete" style="display:inline" onsubmit="return confirm('Supprimer cette réalisation ?')">
                  <input type="hidden" name="id" value={String(r.id)} />
                  <button type="submit" class="text-xs px-3 py-1.5 rounded-lg font-medium" style="background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2);">
                    <i class="fas fa-trash mr-1"></i>Supprimer
                  </button>
                </form>
              </div>
              {/* Formulaire d'édition inline (caché) */}
              <form id={`edit-form-${r.id}`} method="post" action="/api/admin/realisations/update" class="hidden mt-4 p-4 rounded-xl space-y-3" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">
                <input type="hidden" name="id" value={String(r.id)} />
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" name="title" value={r.title} required class="input-field text-sm" />
                  <select name="category" class="input-field text-sm">
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option value={k} selected={r.category === k}>{v}</option>
                    ))}
                  </select>
                </div>
                <textarea name="description" rows={2} class="input-field text-sm" style="resize:vertical;">{r.description || ''}</textarea>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" name="client_name" value={r.client_name || ''} placeholder="Client" class="input-field text-sm" />
                  <input type="text" name="quartier" value={r.quartier || ''} placeholder="Quartier" class="input-field text-sm" />
                  <input type="date" name="date_realisation" value={r.date_realisation || ''} class="input-field text-sm" />
                </div>
                <input type="url" name="image_url" value={r.image_url || ''} placeholder="URL image" class="input-field text-sm" />
                <div class="flex items-center gap-4">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="is_featured" value="1" checked={!!r.is_featured} />
                    <span class="text-sm" style="color:var(--admin-text-primary)">En vedette</span>
                  </label>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="is_visible" value="1" checked={!!r.is_visible} />
                    <span class="text-sm" style="color:var(--admin-text-primary)">Visible</span>
                  </label>
                </div>
                <button type="submit" class="px-4 py-2 rounded-lg text-sm font-bold text-white" style="background:linear-gradient(135deg,#3b82f6,#2563eb);">
                  <i class="fas fa-save mr-1"></i>Enregistrer
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  </AdminLayout>
  )
}

// ============================================================
// SAV / Tickets Support
// ============================================================

const ticketCategoryLabels: Record<string, { label: string; icon: string; color: string }> = {
  panne: { label: 'Panne', icon: 'fa-exclamation-triangle', color: '#f87171' },
  garantie: { label: 'Garantie', icon: 'fa-shield-alt', color: '#60a5fa' },
  installation: { label: 'Installation', icon: 'fa-tools', color: '#a78bfa' },
  maintenance: { label: 'Maintenance', icon: 'fa-wrench', color: '#fbbf24' },
  reclamation: { label: 'Réclamation', icon: 'fa-flag', color: '#fb923c' },
  autre: { label: 'Autre', icon: 'fa-question-circle', color: '#94a3b8' }
}

const ticketStatusLabels: Record<string, { label: string; color: string; bg: string }> = {
  ouvert: { label: 'Ouvert', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  en_cours: { label: 'En cours', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  attente_client: { label: 'Attente client', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  resolu: { label: 'Résolu', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  ferme: { label: 'Fermé', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
}

const ticketPriorityLabels: Record<string, { label: string; color: string }> = {
  basse: { label: 'Basse', color: '#94a3b8' },
  normal: { label: 'Normal', color: '#60a5fa' },
  haute: { label: 'Haute', color: '#fb923c' },
  urgente: { label: 'Urgente', color: '#f87171' }
}
