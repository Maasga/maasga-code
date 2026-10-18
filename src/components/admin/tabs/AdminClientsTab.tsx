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

export const AdminClientsPage = () => {
  return (
    <AdminLayout activePage="clients">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">Gestion des clients</h2>
          <p class="text-sm mt-1" style="color:var(--admin-text-muted)">{clients.length} clients enregistrés</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="document.getElementById('add-client-modal').classList.remove('hidden')"
            class="btn-primary font-semibold px-5 py-2.5 rounded-xl flex items-center space-x-2 text-sm shadow-md">
            <i class="fas fa-plus"></i>
            <span class="hidden sm:inline">Ajouter client</span>
            <span class="sm:hidden">Ajouter</span>
          </button>
          <a href="/api/admin/export/clients" class="text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-file-csv"></i>
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Pending Reset Codes */}
      <div id="reset-codes-panel" class="mb-4 rounded-2xl card-shadow p-4" style="background:var(--admin-card-bg); border:1px solid rgba(251,191,36,0.2); display:none;">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-amber-400"><i class="fas fa-key mr-2"></i>Codes de réinitialisation en attente</h3>
          <button onclick="loadResetCodes()" class="text-xs hover:opacity-75 transition-opacity" style="color:var(--admin-text-muted)"><i class="fas fa-sync-alt mr-1"></i>Actualiser</button>
        </div>
        <div id="reset-codes-list" class="space-y-2 text-sm text-gray-300">
          <p class="text-xs" style="color:var(--admin-text-muted)">Chargement...</p>
        </div>
      </div>

      {/* Barre de recherche clients */}
      <div class="mb-4 relative">
        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"></i>
        <input type="text" id="client-search" placeholder="Rechercher par nom, téléphone, email, quartier..."
          oninput="filterClientsList(this.value)"
          class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm input-field" />
      </div>

      <div class="rounded-2xl card-shadow overflow-hidden" style="background: var(--admin-card-bg); border: 1px solid var(--admin-border); border-radius: var(--admin-radius)">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b" style="background:#f1f5f9;">
              <tr>
                <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider" style="color: var(--admin-text-muted)">Nom</th>
                <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style="color: var(--admin-text-muted)">Email</th>
                <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider" style="color: var(--admin-text-muted)">Téléphone</th>
                <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style="color: var(--admin-text-muted)">Quartier</th>
                <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style="color: var(--admin-text-muted)">Source</th>
                <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style="color: var(--admin-text-muted)">RDVs</th>
                <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style="color: var(--admin-text-muted)">Créé le</th>
                <th class="text-left py-4 px-4 text-xs font-semibold uppercase tracking-wider" style="color: var(--admin-text-muted)">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y" style="border-color: var(--admin-border)" data-paginate="20">
              {clients.map(client => {
                const srcMap: Record<string, { label: string; style: string }> = {
                  devis: { label: 'RDV Devis', style: 'background:rgba(56,189,248,0.12); color:#38bdf8;' },
                  installation: { label: 'RDV Install.', style: 'background:rgba(52,211,153,0.12); color:#34d399;' },
                  commande: { label: 'Commande', style: 'background:rgba(167,139,250,0.12); color:#a78bfa;' },
                  contact: { label: 'Contact', style: 'background:rgba(251,191,36,0.12); color:#fbbf24;' },
                  connexion: { label: 'Inscription', style: 'background:rgba(244,114,182,0.12); color:#f472b6;' }
                }
                const src = srcMap[client.type_demande] || { label: client.type_demande || 'Manuel', style: 'background:rgba(148,163,184,0.1); color:#94a3b8;' }
                return (
                <tr class="client-row hover:bg-[rgba(3,105,161,0.04)] transition-colors cursor-pointer" onclick={`showClientDetail(this)`} data-client={jsonForScript(client)} data-search={`${client.name} ${client.phone} ${client.email || ''} ${client.quartier || ''} ${client.type_demande || ''}`.toLowerCase()}>
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background:rgba(59,130,246,0.15);">
                        <span class="text-blue-400 font-bold text-xs">{client.name.charAt(0)}</span>
                      </div>
                      <span class="font-semibold" style="color: var(--admin-text-primary)">{client.name}</span>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-xs hidden md:table-cell" style="color: var(--admin-text-muted)">{client.email || '-'}</td>
                  <td class="py-4 px-4 text-xs" style="color: var(--admin-text-muted)">{client.phone}</td>
                  <td class="py-4 px-4 text-xs hidden lg:table-cell" style="color: var(--admin-text-muted)">{client.quartier || '-'}</td>
                  <td class="py-4 px-4 hidden sm:table-cell">
                    <span class="text-xs font-bold px-2 py-1 rounded-full" style={src.style}>{src.label}</span>
                  </td>
                  <td class="py-4 px-4 hidden lg:table-cell">
                    <span class="text-xs font-bold px-2 py-1 rounded-full" style={appointments.filter(a => a.phone === client.phone).length > 0 ? 'background:rgba(56,189,248,0.12); color:#38bdf8;' : 'background:rgba(148,163,184,0.1); color:#94a3b8;'}>{appointments.filter(a => a.phone === client.phone).length}</span>
                  </td>
                  <td class="py-4 px-4 text-xs hidden md:table-cell" style="color: var(--admin-text-muted)">{client.created_at}</td>
                  <td class="py-4 px-4">
                    <div class="flex items-center space-x-1">
                      <button
                        onclick={`event.stopPropagation();showClientDetail(this.closest('tr'))`}
                        class="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg transition-colors" title="Voir détails">
                        <i class="fas fa-eye text-xs"></i>
                      </button>
                      <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour ' + client.name + ', MAASGA vous contacte.')}`} target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"
                        class="text-green-400 hover:text-green-300 p-1.5 rounded-lg transition-colors" title="WhatsApp">
                        <i class="fab fa-whatsapp text-xs"></i>
                      </a>
                      <button 
                        onclick={`event.stopPropagation();editClient(${Number(client.id)}, '${jsAttr(client.name)}', '${jsAttr(client.email)}', '${jsAttr(client.phone)}', '${jsAttr(client.quartier)}')`}
                        class="text-orange-400 hover:text-orange-300 p-1.5 rounded-lg transition-colors" title="Modifier">
                        <i class="fas fa-edit text-xs"></i>
                      </button>
                      <button class="text-red-400 hover:text-red-300 p-1.5 rounded-lg transition-colors" title="Supprimer"
                        onclick={`event.stopPropagation();if(confirm('Supprimer ce client ?')) { document.getElementById('del-client-${client.id}').submit(); }`}>
                        <i class="fas fa-trash text-xs"></i>
                      </button>
                      <form id={`del-client-${client.id}`} method="post" action="/api/admin/client/delete" class="hidden">
                        <input type="hidden" name="id" value={String(client.id)} />
                      </form>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajout client */}
      <div id="add-client-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="rounded-3xl p-4 sm:p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg" style="color:var(--admin-text-primary)">Ajouter un client</h3>
            <button onclick="document.getElementById('add-client-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-300 p-1">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form method="post" action="/api/admin/client/add" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Nom complet *</label>
              <input type="text" name="name" required placeholder="Ex: Moussa Traoré" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Email</label>
              <input type="email" name="email" placeholder="Ex: client@example.com" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Téléphone (Whatsapp) *</label>
              <input type="tel" name="phone" required placeholder="Ex: +226 XX XX XX XX" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Quartier</label>
              <input type="text" name="quartier" placeholder="Ex: Paspanga" class="input-field text-sm" />
            </div>
            <button type="submit" class="btn-primary w-full py-3 rounded-xl font-semibold text-sm mt-6">
              <i class="fas fa-check mr-2"></i>Ajouter client
            </button>
          </form>
        </div>
      </div>

      {/* Modal modifier client */}
      <div id="edit-client-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="rounded-3xl p-4 sm:p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg" style="color:var(--admin-text-primary);">Modifier client</h3>
            <button onclick="document.getElementById('edit-client-modal').classList.add('hidden')" class="p-1" style="color:var(--admin-text-muted);">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form method="post" action="/api/admin/client/update" class="space-y-4">
            <input type="hidden" id="edit-client-id" name="id" />
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Nom complet *</label>
              <input type="text" id="edit-client-name" name="name" required class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Email</label>
              <input type="email" id="edit-client-email" name="email" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Téléphone (Whatsapp) *</label>
              <input type="tel" id="edit-client-phone" name="phone" required class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Quartier</label>
              <input type="text" id="edit-client-quartier" name="quartier" class="input-field text-sm" />
            </div>
            <button type="submit" class="btn-primary w-full py-3 rounded-xl font-semibold text-sm mt-6">
              <i class="fas fa-save mr-2"></i>Mettre à jour
            </button>
          </form>
        </div>
      </div>

      {/* Modal Détail Client */}
      <div id="order-client-detail-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col" style="background:var(--admin-card-bg); border:1px solid var(--admin-border); max-height:90vh;">
          {/* Header */}
          <div class="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0" style="background:var(--admin-accent-light); border-bottom:1px solid var(--admin-border);">
            <h3 class="font-bold text-lg flex items-center space-x-2" style="color:var(--admin-text-primary)">
              <i class="fas fa-user" style="color:var(--admin-accent);"></i>
              <span>Fiche client</span>
            </h3>
            <button onclick="document.getElementById('order-client-detail-modal').classList.add('hidden')" class="p-1 transition-colors" style="color:var(--admin-text-muted);">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          {/* Tabs */}
          <div class="flex flex-shrink-0" style="background:var(--admin-bg-elevated); border-bottom:1px solid var(--admin-border);">
            <button id="cd-tab-info" onclick="cdSwitchTab('info')" class="flex-1 py-3 text-xs font-semibold transition-colors cd-tab-active" style="color:#38bdf8; border-bottom:2px solid #38bdf8;">
              <i class="fas fa-id-card mr-1.5"></i>Informations
            </button>
            <button id="cd-tab-hist" onclick="cdSwitchTab('hist')" class="flex-1 py-3 text-xs font-semibold transition-colors" style="color:#64748b; border-bottom:2px solid transparent;">
              <i class="fas fa-history mr-1.5"></i>Historique
            </button>
          </div>
          {/* Body scrollable */}
          <div class="overflow-y-auto flex-1 p-4 sm:p-6">
            {/* Tab Informations */}
            <div id="cd-pane-info" class="space-y-4">
              <div class="flex items-center space-x-4">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0" style="background:rgba(59,130,246,0.2); color:#60a5fa;" id="client-detail-avatar"></div>
                <div>
                  <div class="text-lg font-bold" style="color:var(--admin-text-primary)" id="client-detail-name"></div>
                  <div class="text-sm" id="client-detail-source"></div>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                  <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-phone mr-1"></i>Téléphone (Whatsapp)</div>
                  <div class="text-sm font-semibold text-gray-200" id="client-detail-phone"></div>
                </div>
                <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                  <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-envelope mr-1"></i>Email</div>
                  <div class="text-sm font-semibold text-gray-200" id="client-detail-email"></div>
                </div>
                <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                  <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-map-marker-alt mr-1"></i>Quartier</div>
                  <div class="text-sm font-semibold text-gray-200" id="client-detail-quartier"></div>
                </div>
                <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                  <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-calendar-plus mr-1"></i>Inscrit le</div>
                  <div class="text-sm font-semibold text-gray-200" id="client-detail-created"></div>
                </div>
                <div class="col-span-2 rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                  <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-tag mr-1"></i>Type de demande initiale</div>
                  <div class="text-sm font-semibold text-gray-200" id="client-detail-type"></div>
                </div>
              </div>
              <div id="client-detail-notes-row" class="rounded-xl p-3 hidden" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-sticky-note mr-1"></i>Notes</div>
                <div class="text-sm text-gray-300 italic" id="client-detail-notes"></div>
              </div>
            </div>
            {/* Tab Historique */}
            <div id="cd-pane-hist" class="hidden space-y-5">
              <div id="cd-hist-loader" class="flex items-center justify-center py-10">
                <i class="fas fa-circle-notch fa-spin text-cyan-400 text-2xl mr-3"></i>
                <span class="text-gray-400 text-sm">Chargement...</span>
              </div>
              <div id="cd-hist-content" class="hidden space-y-5">
                {/* Maintenance */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-tools text-cyan-400"></i><span>Contrats de maintenance</span>
                    <span id="cd-contracts-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:var(--admin-accent-light); color:var(--admin-accent);"></span>
                  </div>
                  <div id="cd-contracts" class="space-y-2"></div>
                </div>
                {/* Visites */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-calendar-check text-green-400"></i><span>Visites techniques</span>
                    <span id="cd-visits-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:rgba(52,211,153,0.1); color:#34d399;"></span>
                  </div>
                  <div id="cd-visits" class="space-y-2"></div>
                </div>
                {/* RDVs */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-calendar text-yellow-400"></i><span>Rendez-vous</span>
                    <span id="cd-rdvs-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:rgba(251,191,36,0.1); color:#fbbf24;"></span>
                  </div>
                  <div id="cd-rdvs" class="space-y-2"></div>
                </div>
                {/* Devis */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-file-invoice text-purple-400"></i><span>Devis</span>
                    <span id="cd-devis-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:rgba(167,139,250,0.1); color:#a78bfa;"></span>
                  </div>
                  <div id="cd-devis" class="space-y-2"></div>
                </div>
                {/* SAV */}
                <div>
                  <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <i class="fas fa-headset text-orange-400"></i><span>Tickets SAV</span>
                    <span id="cd-sav-count" class="ml-1 px-2 py-0.5 rounded-full text-xs" style="background:rgba(251,146,60,0.1); color:#fb923c;"></span>
                  </div>
                  <div id="cd-sav" class="space-y-2"></div>
                </div>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div class="px-4 sm:px-6 pb-4 sm:pb-5 pt-3 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0" style="border-top:1px solid var(--admin-border);">
            <a id="client-detail-wa" href="#" target="_blank" rel="noopener noreferrer" class="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(37,211,102,0.12); color:#25D366; border:1px solid rgba(37,211,102,0.25);">
              <i class="fab fa-whatsapp mr-2"></i>WhatsApp
            </a>
            <a id="client-detail-devis-btn" href="#" class="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:var(--admin-accent-light); color:var(--admin-accent); border:1px solid var(--admin-border);">
              <i class="fas fa-file-invoice mr-2"></i>Nouveau devis
            </a>
            <button onclick="document.getElementById('order-client-detail-modal').classList.add('hidden')" class="px-5 text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:var(--admin-bg-elevated); color:var(--admin-text-muted);">
              Fermer
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        ${CLIENT_ESC_HELPER}
        function editClient(id, name, email, phone, quartier) {
          document.getElementById('edit-client-id').value = id;
          document.getElementById('edit-client-name').value = name;
          document.getElementById('edit-client-email').value = email;
          document.getElementById('edit-client-phone').value = phone;
          document.getElementById('edit-client-quartier').value = quartier;
          document.getElementById('edit-client-modal').classList.remove('hidden');
        }
        var _cdClientId = null;
        var _cdHistLoaded = false;
        function cdSwitchTab(tab) {
          var tabs = ['info', 'hist'];
          tabs.forEach(function(t) {
            var btn = document.getElementById('cd-tab-' + t);
            var pane = document.getElementById('cd-pane-' + t);
            if (t === tab) {
              btn.style.color = '#38bdf8'; btn.style.borderBottomColor = '#38bdf8';
              pane.classList.remove('hidden');
            } else {
              btn.style.color = '#64748b'; btn.style.borderBottomColor = 'transparent';
              pane.classList.add('hidden');
            }
          });
          if (tab === 'hist' && _cdClientId && !_cdHistLoaded) {
            loadClientHistory(_cdClientId);
          }
        }
        function loadClientHistory(id) {
          _cdHistLoaded = true;
          var loader = document.getElementById('cd-hist-loader');
          var content = document.getElementById('cd-hist-content');
          loader.classList.remove('hidden');
          content.classList.add('hidden');
          fetch('/api/admin/clients/' + id + '/detail').then(function(r) { return r.json(); }).then(function(d) {
            loader.classList.add('hidden');
            content.classList.remove('hidden');
            var planLabels = { trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel' };
            var statusColors = { en_attente: '#fbbf24', contacte: '#60a5fa', actif: '#34d399', expire: '#f87171', annule: '#94a3b8', planifiee: '#fbbf24', confirmee: '#60a5fa', effectuee: '#34d399', annulee: '#f87171' };
            // Contracts
            var c = document.getElementById('cd-contracts');
            document.getElementById('cd-contracts-count').textContent = d.contracts.length;
            c.innerHTML = d.contracts.length ? d.contracts.map(function(x) {
              return '<div class="rounded-xl p-3 text-xs flex items-center justify-between" style="background:var(--admin-bg);border:1px solid var(--admin-border);">'
                + '<div><span class="font-semibold" style="color:var(--admin-text-primary)">' + _esc(planLabels[x.plan_type] || x.plan_type) + '</span>'
                + '<span class="ml-2" style="color:var(--admin-text-muted)">' + _esc(x.start_date||'') + ' → ' + _esc(x.end_date||'') + '</span>'
                + '<span class="ml-2" style="color:var(--admin-text-muted)">' + _esc(x.completed_visits) + '/' + _esc(x.total_visits) + ' visites</span></div>'
                + '<span class="px-2 py-0.5 rounded-full font-bold" style="background:rgba(5,150,105,0.1);color:' + (statusColors[x.status]||'#94a3b8') + ';">'
                + ({ en_attente:'En attente', contacte:'Contacté', actif:'Actif', expire:'Expiré', annule:'Annulé' }[x.status] || x.status) + '</span></div>';
            }).join('') : '<p class="text-xs py-2" style="color:var(--admin-text-muted)">Aucun contrat</p>';
            // Visits
            var v = document.getElementById('cd-visits');
            document.getElementById('cd-visits-count').textContent = d.visits.length;
            v.innerHTML = d.visits.length ? d.visits.map(function(x) {
              return '<div class="rounded-xl p-3 text-xs flex items-center justify-between" style="background:var(--admin-bg);border:1px solid var(--admin-border);">'
                + '<div><span class="font-semibold" style="color:var(--admin-text-primary)">' + (x.visit_type==='preventive'?'Préventive':'Corrective') + '</span>'
                + '<span class="ml-2" style="color:var(--admin-text-muted)">' + _esc(x.visit_date||'') + '</span>'
                + (x.technician ? '<span class="ml-2" style="color:var(--admin-text-muted)">— ' + _esc(x.technician) + '</span>' : '') + '</div>'
                + (x.notes ? '<div style="margin-top:2px;color:#94a3b8;font-style:italic">' + _esc(x.notes) + '</div>' : '')
                + (x.actions_performed ? '<div style="margin-top:2px;color:#64748b">' + _esc(x.actions_performed) + '</div>' : '')
                + '<span class="px-2 py-0.5 rounded-full font-bold" style="background:rgba(217,119,6,0.1);color:' + (statusColors[x.status]||'#94a3b8') + ';">'
                + ((x.status==='planifiee')?'Planifiée':(x.status==='realisee')?'Réalisée':'Annulée') + '</span></div>';
            }).join('') : '<p class="text-xs py-2" style="color:var(--admin-text-muted)">Aucune visite</p>';
            // RDVs
            var r = document.getElementById('cd-rdvs');
            document.getElementById('cd-rdvs-count').textContent = d.rdvs.length;
            r.innerHTML = d.rdvs.length ? d.rdvs.map(function(x) {
              return '<div class="rounded-xl p-3 text-xs flex items-center justify-between" style="background:var(--admin-bg);border:1px solid var(--admin-border);">'
                + '<div><span class="font-semibold" style="color:var(--admin-text-primary)">' + _esc(x.type||'RDV') + '</span>'
                + '<span class="ml-2" style="color:var(--admin-text-muted)">' + _esc(x.date||'') + (x.heure_debut?' à '+_esc(x.heure_debut):'') + '</span>'
                + (x.notes ? '<div style="margin-top:2px;color:#94a3b8;font-style:italic">' + _esc(x.notes) + '</div>' : '') + '</div>'
                + '<span class="text-xs" style="color:var(--admin-status-pending)">' + _esc(x.status||'') + '</span></div>';
            }).join('') : '<p class="text-xs py-2" style="color:var(--admin-text-muted)">Aucun rendez-vous</p>';
            // Devis
            var dv = document.getElementById('cd-devis');
            document.getElementById('cd-devis-count').textContent = d.devis.length;
            dv.innerHTML = d.devis.length ? d.devis.map(function(x) {
              var sc = {draft:'#94a3b8',sent:'#0369a1',accepted:'#059669',rejected:'#dc2626',expired:'#d97706'};
              return '<div class="rounded-xl p-3 text-xs flex items-center justify-between" style="background:var(--admin-bg);border:1px solid var(--admin-border);">'
                + '<div><span class="font-semibold" style="color:var(--admin-text-primary)">' + _esc(x.numero||'#'+x.id) + '</span>'
                + '<span class="ml-2" style="color:var(--admin-text-muted)">' + _esc(x.produit_nom||'') + '</span>'
                + '<span class="ml-2" style="color:var(--admin-text-muted)">' + (x.total_ht?(parseInt(x.total_ht).toLocaleString('fr-FR')+' F'):'') + '</span></div>'
                + '<span class="px-2 py-0.5 rounded-full font-bold text-xs" style="background:rgba(3,105,161,0.1);color:' + (sc[x.status]||'#94a3b8') + ';">' + _esc(x.status||'') + '</span></div>';
            }).join('') : '<p class="text-xs py-2" style="color:var(--admin-text-muted)">Aucun devis</p>';
            // SAV
            var s = document.getElementById('cd-sav');
            document.getElementById('cd-sav-count').textContent = d.sav.length;
            s.innerHTML = d.sav.length ? d.sav.map(function(x) {
              var pc = {haute:'#dc2626',normale:'#d97706',basse:'#94a3b8'};
              return '<div class="rounded-xl p-3 text-xs" style="background:var(--admin-bg);border:1px solid var(--admin-border);">'
                + '<div class="flex items-center justify-between mb-1">'
                + '<span class="font-semibold" style="color:var(--admin-text-primary)">' + _esc(x.ticket_ref||'#'+x.id) + '</span>'
                + '<span class="px-2 py-0.5 rounded-full font-bold" style="background:rgba(220,38,38,0.1);color:' + (pc[x.priority]||'#94a3b8') + ';">' + _esc(x.priority||'') + '</span></div>'
                + '<p style="color:var(--admin-text-muted)">' + _esc(x.subject||'') + '</p>'
                + (x.resolved_at ? '<div style="color:#4ade80;font-size:10px">Résolu: ' + _esc(x.resolved_at.substring(0,10)) + '</div>' : '') + '</div>';
            }).join('') : '<p class="text-xs py-2" style="color:var(--admin-text-muted)">Aucun ticket SAV</p>';
          }).catch(function() {
            loader.classList.add('hidden');
            content.innerHTML = '<p class="text-center text-xs text-red-400 py-4"><i class="fas fa-exclamation-circle mr-1"></i>Erreur de chargement</p>';
            content.classList.remove('hidden');
          });
        }
        function showClientDetail(el) {
          var c;
          try { c = JSON.parse(el.getAttribute('data-client')); } catch(e) { console.error('showClientDetail parse error:', e); return; }
          _cdClientId = c.id || null;
          _cdHistLoaded = false;
          cdSwitchTab('info');
          var srcLabels = { devis:'RDV Devis', installation:'RDV Installation', commande:'Commande', contact:'Contact', connexion:'Inscription' };
          var srcColors = { devis:'color:#38bdf8;', installation:'color:#34d399;', commande:'color:#a78bfa;', contact:'color:#fbbf24;', connexion:'color:#f472b6;' };
          document.getElementById('client-detail-avatar').textContent = (c.name || '?').charAt(0).toUpperCase();
          document.getElementById('client-detail-name').textContent = c.name || '-';
          document.getElementById('client-detail-source').innerHTML = '<span class="text-xs font-semibold px-2 py-0.5 rounded-full" style="background:rgba(56,189,248,0.1);' + (srcColors[c.type_demande] || 'color:#94a3b8;') + '">' + _esc(srcLabels[c.type_demande] || c.type_demande || 'Manuel') + '</span>';
          document.getElementById('client-detail-phone').textContent = c.phone || '-';
          document.getElementById('client-detail-email').textContent = c.email || '-';
          document.getElementById('client-detail-quartier').textContent = c.quartier || '-';
          document.getElementById('client-detail-created').textContent = c.created_at || '-';
          document.getElementById('client-detail-type').textContent = srcLabels[c.type_demande] || c.type_demande || 'Manuel';
          var notesRow = document.getElementById('client-detail-notes-row');
          if (c.notes) { notesRow.classList.remove('hidden'); document.getElementById('client-detail-notes').textContent = c.notes; } else { notesRow.classList.add('hidden'); }
          var phone = (c.phone || '').replace(/\\D/g, '');
          document.getElementById('client-detail-wa').href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Bonjour ' + c.name + ', MAASGA vous contacte.');
          document.getElementById('client-detail-devis-btn').href = '/admin/devis/new' + (c.id ? '?client_id=' + c.id : '');
          document.getElementById('order-client-detail-modal').classList.remove('hidden');
        }
        function filterClientsList(q) {
          q = q.toLowerCase().trim();
          document.querySelectorAll('.client-row').forEach(function(row) {
            var ds = row.getAttribute('data-search') || '';
            row.style.display = (!q || ds.includes(q)) ? '' : 'none';
          });
        }
        function exportClientsCSV() {
          const headers = ['Nom', 'Email', 'Téléphone', 'Quartier', 'RDVs', 'Créé le'];
          const rows = [headers];
          document.querySelectorAll('.client-row').forEach(function(row) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
              rows.push([cells[0].textContent.trim(), cells[1].textContent.trim(), cells[2].textContent.trim(), cells[3].textContent.trim(), cells[4].textContent.trim(), cells[5].textContent.trim()]);
            }
          });
          const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\\n');
          const a = document.createElement('a');
          a.href = 'data:text/csv;charset=utf-8,\\uFEFF' + encodeURIComponent(csv);
          a.download = 'clients_maasga.csv';
          a.click();
        }
        function loadResetCodes() {
          fetch('/api/admin/reset-codes').then(r => r.json()).then(function(data) {
            var panel = document.getElementById('reset-codes-panel');
            var list = document.getElementById('reset-codes-list');
            if (!data.codes || data.codes.length === 0) {
              panel.style.display = 'none';
              return;
            }
            panel.style.display = 'block';
            list.innerHTML = data.codes.map(function(c) {
              var mins = Math.max(0, Math.round((15*60*1000 - (Date.now() - c.created_at)) / 60000));
              var contact = c.phone || c.email || '-';
              return '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg" style="background:rgba(251,191,36,0.05); border:1px solid rgba(251,191,36,0.1);">'
                + '<div class="flex-1"><span class="font-mono text-amber-300 font-bold text-lg mr-3">' + _esc(c.code) + '</span>'
                + '<span class="text-gray-400 text-xs">' + _esc(contact) + '</span>'
                + '<span class="text-gray-600 text-xs ml-2">(' + mins + ' min restantes)</span></div>'
                + '<button onclick="sendResetCodeWA(\\'' + _esc(encodeURIComponent(c.token)) + '\\')" class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background:#25d366; color:white;"><i class="fab fa-whatsapp mr-1"></i>Envoyer via WhatsApp</button>'
                + '</div>';
            }).join('');
          }).catch(function() {});
        }
        function sendResetCodeWA(token) {
          fetch('/api/admin/reset-codes/' + token + '/whatsapp').then(r => r.json()).then(function(data) {
            if (data.url) window.open(data.url, '_blank');
          }).catch(function() {});
        }
        loadResetCodes();
      ` }} />
    </AdminLayout>
  )
}

// ============================================================
// PAGE COMMANDES
// ============================================================
