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

export const AdminParametresPage = ({ success, error, siteSettings = {} }: { success?: string; error?: string; siteSettings?: Record<string, string> } = {}) => {
  const s = (key: string, fallback: string = '') => siteSettings[key] || fallback
  return (
  <AdminLayout activePage="parametres">
    <div class="mb-6">
      <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">Paramètres du site</h2>
      <p class="text-sm mt-1" style="color:var(--admin-text-muted)">Configuration, sécurité et gestion du back-office</p>
    </div>

    {success && (
      <div class="mb-6 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3);">
        <i class="fas fa-check-circle text-green-400 text-lg"></i>
        <span class="text-green-300 font-medium text-sm">
          {success === 'pwd' ? 'Mot de passe mis à jour avec succès.' : success === 'settings' ? 'Paramètres du site enregistrés.' : 'Opération réussie.'}
        </span>
      </div>
    )}
    {error && (
      <div class="mb-6 rounded-xl p-4 flex items-center space-x-3" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);">
        <i class="fas fa-exclamation-circle text-red-400 text-lg"></i>
        <span class="text-red-300 font-medium text-sm">
          {error === 'wrong_current' ? 'Mot de passe actuel incorrect.' :
           error === 'mismatch' ? 'Les mots de passe ne correspondent pas.' :
           error === 'too_short' ? 'Le mot de passe doit faire au moins 12 caractères.' :
           error === 'rate_limited' ? 'Trop de tentatives. Réessayez dans 15 minutes.' :
           error === 'username_short' ? "Le nom d'utilisateur doit faire au moins 3 caractères." :
           'Une erreur est survenue.'}
        </span>
      </div>
    )}

    <div class="max-w-2xl space-y-6">

      {/* Changer mot de passe */}
      <div class="rounded-2xl p-6 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(59,130,246,0.15);">
            <i class="fas fa-lock text-blue-400"></i>
          </div>
          <div>
            <h3 class="font-bold" style="color:var(--admin-text-primary)">Sécurité — Mot de passe admin</h3>
            <p class="text-xs text-gray-400">Modifiez le mot de passe de connexion au back-office</p>
          </div>
        </div>
        <form method="post" action="/api/admin/change-password" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Mot de passe actuel *</label>
            <input type="password" name="current_password" required placeholder="Votre mot de passe actuel" class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Nouvel identifiant <span class="text-gray-500">(optionnel, laisser vide pour garder l'actuel)</span></label>
            <input type="text" name="new_username" placeholder="admin" minlength={3} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Nouveau mot de passe *</label>
            <input type="password" name="new_password" required placeholder="Minimum 12 caractères" minlength={12} class="input-field text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Confirmer le nouveau mot de passe *</label>
            <input type="password" name="confirm_password" required placeholder="Répéter le nouveau mot de passe" class="input-field text-sm" />
          </div>
          <button type="submit" class="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2">
            <i class="fas fa-save"></i>
            <span>Mettre à jour le mot de passe</span>
          </button>
        </form>
      </div>

      {/* Informations site — Éditables */}
      <div class="rounded-2xl p-6 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(16,185,129,0.15);">
            <i class="fas fa-store text-green-400"></i>
          </div>
          <div>
            <h3 class="font-bold" style="color:var(--admin-text-primary)">Informations MAASGA</h3>
            <p class="text-xs text-gray-400">Modifiez les données de contact et horaires affichés sur le site</p>
          </div>
        </div>
        <form method="post" action="/api/admin/site-settings" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fas fa-building mr-1 text-cyan-400"></i>Nom entreprise</label>
              <input name="company_name" value={s('company_name', 'MAASGA')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fas fa-phone mr-1 text-cyan-400"></i>Téléphone (Whatsapp)</label>
              <input name="phone" value={s('phone', '+226 55 99 64 18')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fas fa-envelope mr-1 text-blue-400"></i>Email</label>
              <input name="email" type="email" value={s('email', 'maasgabf@gmail.com')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fab fa-whatsapp mr-1 text-green-400"></i>WhatsApp</label>
              <input name="whatsapp" value={s('whatsapp', '+226 55 99 64 18')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fas fa-map-marker-alt mr-1 text-red-400"></i>Adresse</label>
              <input name="address" value={s('address', 'Ouagadougou, Burkina Faso')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fas fa-clock mr-1 text-yellow-400"></i>Horaires</label>
              <input name="hours" value={s('hours', 'Lundi–Dimanche · 8h00–18h00')} class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fab fa-facebook mr-1 text-blue-500"></i>Facebook (URL)</label>
              <input name="facebook" value={s('facebook', '')} placeholder="https://facebook.com/..." class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fab fa-instagram mr-1 text-pink-400"></i>Instagram (URL)</label>
              <input name="instagram" value={s('instagram', '')} placeholder="https://instagram.com/..." class="input-field text-sm" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);"><i class="fas fa-quote-left mr-1 text-purple-400"></i>Slogan</label>
            <input name="slogan" value={s('slogan', 'Solutions énergétiques solaires professionnelles')} class="input-field text-sm" />
          </div>
          <button type="submit" class="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2">
            <i class="fas fa-save"></i>
            <span>Enregistrer les paramètres</span>
          </button>
        </form>
      </div>

      {/* Statistiques globales */}
      <div class="rounded-2xl p-6 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(168,85,247,0.15);">
            <i class="fas fa-database text-purple-400"></i>
          </div>
          <div>
            <h3 class="font-bold" style="color:var(--admin-text-primary)">État de la base de données</h3>
            <p class="text-xs text-gray-400">Récapitulatif des données enregistrées</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          {[
            { label: "Produits", val: products.length, icon: "fa-boxes", color: "#38bdf8" },
            { label: "Clients", val: clients.length, icon: "fa-users", color: "#34d399" },
            { label: "Rendez-vous", val: appointments.length, icon: "fa-calendar-alt", color: "#fbbf24" },
            { label: "Avis", val: reviews.length, icon: "fa-star", color: "#f87171" },
          ].map(s => (
            <div class="flex items-center space-x-3 p-3 rounded-xl" style="background:rgba(255,255,255,0.03); border:1px solid rgba(148,180,220,0.08);">
              <i class={`fas ${s.icon} text-base`} style={`color:${s.color};`}></i>
              <div>
                <div class="text-lg font-bold leading-none" style="color:var(--admin-text-primary)">{s.val}</div>
                <div class="text-xs text-gray-400">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sauvegarde / Backup */}
      <div class="rounded-2xl p-6 card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
        <div class="flex items-center space-x-3 mb-5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(168,85,247,0.15);">
            <i class="fas fa-download text-purple-400"></i>
          </div>
          <div>
            <h3 class="font-bold" style="color:var(--admin-text-primary)">Sauvegarde des données</h3>
            <p class="text-xs text-gray-400">Téléchargez une copie complète de toutes les données</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <a href="/api/admin/backup" class="text-xs px-5 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(168,85,247,0.12); color:#a78bfa; border:1px solid rgba(168,85,247,0.2);">
            <i class="fas fa-database"></i>
            <span>Export JSON complet</span>
          </a>
          <a href="/api/admin/export/clients" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-users"></i>
            <span>Clients CSV</span>
          </a>
          <a href="/api/admin/export/orders" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-shopping-cart"></i>
            <span>Commandes CSV</span>
          </a>
          <a href="/api/admin/export/tickets" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-headset"></i>
            <span>Tickets CSV</span>
          </a>
        </div>
      </div>

      {/* Zone dangereuse */}
      <div class="rounded-2xl p-6 card-shadow" style="background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.2);">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(239,68,68,0.15);">
            <i class="fas fa-exclamation-triangle text-red-400"></i>
          </div>
          <div>
            <h3 class="font-bold text-red-400">Zone dangereuse</h3>
            <p class="text-xs text-gray-400">Actions irréversibles — À utiliser avec précaution</p>
          </div>
        </div>
        <div class="space-y-3">
          <div class="p-4 rounded-xl" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15);">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="font-semibold text-red-300 text-sm">Réinitialiser les données de démo</div>
                <div class="text-xs mt-0.5" style="color:var(--admin-text-muted)">Supprime tous les RDV, clients et avis de test</div>
              </div>
              <button onclick="confirmReset()" class="text-xs px-4 py-2 rounded-xl font-semibold whitespace-nowrap flex-shrink-0" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">
                <i class="fas fa-trash mr-1"></i>Réinitialiser
              </button>
            </div>
          </div>
          <div class="p-4 rounded-xl" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15);">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="font-semibold text-red-300 text-sm">Déconnexion forcée</div>
                <div class="text-xs mt-0.5" style="color:var(--admin-text-muted)">Invalider la session admin en cours</div>
              </div>
              <form method="post" action="/api/admin/logout" class="flex-shrink-0">
                <button type="submit" class="text-xs px-4 py-2 rounded-xl font-semibold whitespace-nowrap text-center" style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3);">
                  <i class="fas fa-sign-out-alt mr-1"></i>Déconnecter
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>

    <script dangerouslySetInnerHTML={{ __html: `
      function confirmReset() {
        if (!confirm('ATTENTION : Cette action va supprimer toutes les données (RDV, commandes, clients, avis, produits).\\nVoulez-vous continuer ?')) return;
        if (!confirm('Dernière confirmation : Supprimer définitivement toutes les données ?')) return;
        // Le serveur exige le mot de passe admin : le cookie de session seul ne
        // doit pas suffire à vider la base (action irréversible).
        var pwd = prompt('Saisissez le mot de passe admin pour confirmer la réinitialisation :');
        if (!pwd) return;
        fetch('/api/admin/reset-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: 'REINITIALISER', password: pwd })
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            showToast(data.message || 'Base de données réinitialisée.', 'success');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            showToast(data.error || 'Erreur lors de la réinitialisation.', 'error');
          }
        })
        .catch(() => showToast('Erreur réseau.', 'error'));
      }
    ` }} />
  </AdminLayout>
  )
}

// ============================================================
// ADMIN DEVIS LIST PAGE
// ============================================================