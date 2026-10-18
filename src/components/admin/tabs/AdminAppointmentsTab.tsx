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

export const AdminRDVPage = ({ filterStatus }: { filterStatus?: string }) => {
  const filtered = filterStatus && filterStatus !== 'all'
    ? appointments.filter(a => a.status === filterStatus)
    : appointments

  return (
    <AdminLayout activePage="rdv">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-bold" style="color:var(--admin-text-primary)">Gestion des rendez-vous</h2>
          <p class="text-sm text-gray-500 mt-1">{filtered.length} rendez-vous · {appointments.filter(a => a.status === 'pending').length} en attente</p>
        </div>
        <div class="flex flex-wrap gap-2 items-center">
          <a href="/api/admin/export/rdv" class="text-xs px-3 py-2 rounded-xl font-semibold flex items-center space-x-2" style="background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.2);">
            <i class="fas fa-file-csv"></i>
            <span>Export CSV</span>
          </a>
          <button onclick="document.getElementById('add-rdv-modal').classList.remove('hidden')"
            class="btn-primary font-semibold px-4 py-2 rounded-xl flex items-center space-x-2 text-xs shadow-md">
            <i class="fas fa-plus"></i>
            <span>Ajouter RDV</span>
          </button>
          {[
            { s: '', label: 'Tous', count: appointments.length },
            { s: 'pending', label: 'En attente', count: appointments.filter(a => a.status === 'pending').length },
            { s: 'confirmed', label: 'Confirmés', count: appointments.filter(a => a.status === 'confirmed').length },
            { s: 'done', label: 'Effectués', count: appointments.filter(a => a.status === 'done').length }
          ].map(f => (
            <a href={`/admin/rdv${f.s ? '?status=' + f.s : ''}`}
              class={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors flex items-center space-x-1.5 ${(filterStatus || '') === f.s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-[rgba(3,105,161,0.04)]'}`} style={(filterStatus || '') !== f.s ? 'background:var(--admin-bg);' : ''}>
              <span>{f.label}</span>
              {f.count > 0 && <span class={`text-xs rounded-full w-4 h-4 flex items-center justify-center ${(filterStatus || '') === f.s ? 'bg-white text-primary-600' : ''}`} style={(filterStatus || '') !== f.s ? 'background:rgba(148,180,220,0.1);' : ''}>{f.count}</span>}
            </a>
          ))}
        </div>
      </div>

      {/* Barre de recherche RDV + toggle vue */}
      <div class="mb-4 flex gap-3 items-center">
        <div class="relative flex-1">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none"></i>
          <input type="text" id="rdv-search" placeholder="Rechercher par nom, téléphone, quartier..."
            oninput="filterRDVList(this.value)"
            class="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm input-field" />
        </div>
        <div class="flex rounded-xl overflow-hidden" style="border:1px solid rgba(148,163,184,0.2);">
          <button onclick="toggleRDVView('list')" id="btn-view-list" class="px-3 py-2 text-xs font-semibold" style="background:rgba(59,130,246,0.2); color:#60a5fa;">
            <i class="fas fa-list"></i>
          </button>
          <button onclick="toggleRDVView('calendar')" id="btn-view-calendar" class="px-3 py-2 text-xs font-semibold" style="background:transparent; color:#94a3b8;">
            <i class="fas fa-calendar-alt"></i>
          </button>
        </div>
      </div>

      {/* VUE CALENDRIER */}
      <div id="rdv-calendar-view" class="hidden mb-6">
        <div class="rounded-2xl card-shadow overflow-hidden" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <div class="p-4 flex items-center justify-between" style="border-bottom:1px solid rgba(148,163,184,0.08);">
            <button onclick="changeCalendarMonth(-1)" class="px-3 py-1.5 rounded-lg text-sm font-medium" style="background:rgba(59,130,246,0.1); color:#60a5fa;">
              <i class="fas fa-chevron-left"></i>
            </button>
            <h3 id="calendar-month-label" class="text-lg font-bold" style="color:var(--admin-text-primary);"></h3>
            <button onclick="changeCalendarMonth(1)" class="px-3 py-1.5 rounded-lg text-sm font-medium" style="background:rgba(59,130,246,0.1); color:#60a5fa;">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-7 gap-1 mb-2">
              {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
                <div class="text-center text-xs font-bold py-2" style="color:var(--admin-text-muted)">{d}</div>
              ))}
            </div>
            <div id="calendar-grid" class="grid grid-cols-7 gap-1"></div>
          </div>
        </div>
        {/* Détail du jour sélectionné */}
        <div id="calendar-day-detail" class="hidden mt-4 rounded-2xl card-shadow p-5" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <h4 id="calendar-day-label" class="font-bold mb-3" style="color:var(--admin-text-primary);"></h4>
          <div id="calendar-day-rdvs" class="space-y-2"></div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div id="rdv-list-view" class="rounded-2xl  p-12 text-center card-shadow" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <i class="fas fa-calendar-times text-3xl text-gray-300 mb-3"></i>
          <p class="text-gray-400">Aucun rendez-vous dans cette catégorie</p>
        </div>
      ) : (
        <div id="rdv-list-view" class="space-y-4">
          {filtered.map(a => (
            <div class="rdv-card rounded-2xl p-5 card-shadow" data-search={`${a.name} ${a.phone} ${a.quartier}`.toLowerCase()} style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start space-x-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                    devis: 'background:rgba(59,130,246,0.15)',
                    installation: 'background:rgba(16,185,129,0.15)',
                    entretien: 'background:rgba(139,92,246,0.15)',
                    depannage: 'background:rgba(239,68,68,0.15)'
                  }[a.type] || 'background:rgba(59,130,246,0.15)'}>
                    <i class={`fas ${{ devis: 'fa-clipboard-check text-blue-400', installation: 'fa-tools text-green-400', entretien: 'fa-wrench text-purple-400', depannage: 'fa-bolt text-red-400' }[a.type] || 'fa-calendar text-gray-400'} text-lg`}></i>
                  </div>
                  <div>
                    <div class="flex items-center space-x-2 mb-1">
                      <h4 class="font-bold cursor-pointer transition-colors" onclick={`showRdvDetailById(${a.id})`} title="Voir détails client">{a.name} <i class="fas fa-eye text-xs text-blue-400 ml-1"></i></h4>
                      <span class={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === 'pending' ? 'badge-pending' : a.status === 'confirmed' ? 'badge-confirmed' : 'badge-done'}`}>
                        {a.status === 'pending' ? 'En attente' : a.status === 'confirmed' ? 'Confirmé' : 'Effectué'}
                      </span>
                    </div>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span><i class="fas fa-phone mr-1 text-gray-400"></i>{a.phone}</span>
                      <span><i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>{a.quartier}</span>
                      {a.adresse_precise && <span class="text-xs text-blue-400 mt-0.5 block"><i class="fas fa-location-arrow mr-1"></i>{a.adresse_precise}</span>}
                      <span><i class="fas fa-calendar mr-1 text-gray-400"></i>{a.date}</span>
                      {(a.heure_debut || a.heure_fin) && <span><i class="fas fa-clock mr-1 text-gray-400"></i>{a.heure_debut}–{a.heure_fin}</span>}
                      <span><i class="fas fa-tag mr-1 text-gray-400"></i>{{ devis: 'Devis/Dimensionnement', installation: 'Installation', entretien: 'Entretien', depannage: 'Dépannage' }[a.type] || a.type}</span>
                    </div>
                    {a.notes && <div class="mt-1 text-xs text-gray-400 italic">{a.notes}</div>}
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0">
                  {/* Actions statut */}
                  {a.status !== 'confirmed' && (
                    <form method="post" action="/api/admin/rdv/update">
                      <input type="hidden" name="id" value={String(a.id)} />
                      <input type="hidden" name="status" value="confirmed" />
                      <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(16,185,129,0.15); color:#34d399;">
                        <i class="fas fa-check mr-1"></i>Confirmer
                      </button>
                    </form>
                  )}
                  {a.status !== 'done' && (
                    <form method="post" action="/api/admin/rdv/update">
                      <input type="hidden" name="id" value={String(a.id)} />
                      <input type="hidden" name="status" value="done" />
                      <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(59,130,246,0.15); color:#60a5fa;">
                        <i class="fas fa-flag-checkered mr-1"></i>Effectué
                      </button>
                    </form>
                  )}
                  <a href={`https://wa.me/${a.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Bonjour ' + a.name + ', votre RDV MAASGA du ' + a.date + ' à ' + a.quartier + ' est confirmé. Besoin de renseignements ?')}`} target="_blank" rel="noopener noreferrer"
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(37,211,102,0.15); color:#25D366;" title="Contacter via WhatsApp">
                    <i class="fab fa-whatsapp mr-1"></i>WA
                  </a>
                  <a href={`/admin/devis/new?rdvId=${a.id}`}
                    class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.12); color:#f87171;">
                    <i class="fas fa-file-invoice-dollar mr-1"></i>Devis
                  </a>
                  <form method="post" action="/api/admin/rdv/delete" style="display:inline" onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer ce RDV ?')">
                    <input type="hidden" name="id" value={String(a.id)} />
                    <button type="submit" class="text-xs px-3 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap" style="background:rgba(239,68,68,0.15); color:#f87171;">
                      <i class="fas fa-trash mr-1"></i>Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout RDV */}
      <div id="add-rdv-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div class="rounded-3xl p-4 sm:p-8 w-full max-w-xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg" style="color:var(--admin-text-primary);">Ajouter un rendez-vous</h3>
            <button onclick="document.getElementById('add-rdv-modal').classList.add('hidden')" class="p-1" style="color:var(--admin-text-muted);">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form method="post" action="/api/admin/rdv/add" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Nom client *</label>
                <input type="text" name="name" required placeholder="Ex: Moussa Traoré" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Téléphone (Whatsapp) *</label>
                <input type="tel" name="phone" required placeholder="+226 XX XX XX XX" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Quartier *</label>
                <input type="text" name="quartier" required placeholder="Ex: Paspanga" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Date *</label>
                <input type="date" name="date" required class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Heure début</label>
                <input type="time" name="heure_debut" value="08:00" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Heure fin</label>
                <input type="time" name="heure_fin" value="18:00" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Type *</label>
                <select name="type" required class="input-field text-sm">
                  <option value="devis">Devis / Dimensionnement</option>
                  <option value="installation">Installation</option>
                  <option value="entretien">Entretien / Maintenance</option>
                  <option value="depannage">Dépannage</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Latitude</label>
                <input type="number" name="latitude" step="0.0001" placeholder="12.3656" class="input-field text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Longitude</label>
                <input type="number" name="longitude" step="0.0001" placeholder="-1.5197" class="input-field text-sm" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold mb-1.5" style="color:var(--admin-text-muted);">Notes</label>
                <textarea name="notes" placeholder="Remarques complémentaires..." class="input-field text-sm" rows={3}></textarea>
              </div>
            </div>
            <button type="submit" class="btn-primary w-full py-3 rounded-xl font-semibold text-sm mt-6">
              <i class="fas fa-check mr-2"></i>Ajouter RDV
            </button>
          </form>
        </div>
      </div>
      {/* Modal Détail RDV */}
      <div id="rdv-detail-modal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style="background:var(--admin-card-bg); border:1px solid var(--admin-border);">
          <div class="flex items-center justify-between px-4 sm:px-6 py-4" style="border-bottom:1px solid var(--admin-border);">
            <h3 class="font-bold text-base sm:text-lg flex items-center space-x-2" style="color:var(--admin-text-primary);">
              <i class="fas fa-calendar-alt text-blue-400"></i>
              <span>Détails du rendez-vous</span>
            </h3>
            <button onclick="document.getElementById('rdv-detail-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-200 p-1 transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="p-4 sm:p-6 space-y-4">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0" style="background:rgba(59,130,246,0.2); color:#60a5fa;" id="rdv-detail-avatar"></div>
              <div>
                <div class="text-lg font-bold" style="color:var(--admin-text-primary);" id="rdv-detail-name"></div>
                <div class="text-sm" style="color:var(--admin-accent);" id="rdv-detail-type"></div>
              </div>
              <div class="ml-auto" id="rdv-detail-badge"></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-phone mr-1"></i>Téléphone (Whatsapp)</div>
                <div class="text-sm font-semibold" style="color:var(--admin-text-primary);" id="rdv-detail-phone"></div>
              </div>
              <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-map-marker-alt mr-1"></i>Quartier</div>
                <div class="text-sm font-semibold" style="color:var(--admin-text-primary);" id="rdv-detail-quartier"></div>
              </div>
              <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-calendar mr-1"></i>Date</div>
                <div class="text-sm font-semibold" style="color:var(--admin-text-primary);" id="rdv-detail-date"></div>
              </div>
              <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-clock mr-1"></i>Horaire</div>
                <div class="text-sm font-semibold text-gray-200" style="color:var(--admin-text-primary);" id="rdv-detail-heure"></div>
              </div>
              <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-globe mr-1"></i>Localisation GPS</div>
                <div class="text-sm font-semibold text-gray-200" style="color:var(--admin-text-primary);" id="rdv-detail-gps"></div>
              </div>
              <div class="rounded-xl p-3" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
                <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-calendar-plus mr-1"></i>Créé le</div>
                <div class="text-sm font-semibold" style="color:var(--admin-text-primary);" id="rdv-detail-created"></div>
              </div>
            </div>
            <div id="rdv-detail-adresse-row" class="rounded-xl p-3 hidden" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
              <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-home mr-1"></i>Adresse précise</div>
              <div class="text-sm font-semibold" style="color:var(--admin-text-primary);" id="rdv-detail-adresse"></div>
            </div>
            <div id="rdv-detail-notes-row" class="rounded-xl p-3 hidden" style="background:var(--admin-bg); border:1px solid var(--admin-border);">
              <div class="text-xs mb-1" style="color:var(--admin-text-muted)"><i class="fas fa-sticky-note mr-1"></i>Notes</div>
              <div class="text-sm text-gray-300 italic" id="rdv-detail-notes"></div>
            </div>

            {/* Fiche client section */}
            <div id="rdv-client-section" class="rounded-2xl overflow-hidden" style="border:1px solid var(--admin-border);">
              <div class="flex items-center justify-between px-4 py-2.5" style="background:var(--admin-accent-light); border-bottom:1px solid var(--admin-border);">
                <span class="text-xs font-bold" style="color:var(--admin-accent);"><i class="fas fa-user-circle mr-2"></i>Fiche client</span>
                <span id="rdv-client-status" class="text-xs" style="color:var(--admin-text-muted)">Chargement...</span>
              </div>
              <div id="rdv-client-body" class="p-4 space-y-3">
                <div class="flex justify-center py-2"><i class="fas fa-spinner fa-spin text-gray-500 text-lg"></i></div>
              </div>
            </div>
          </div>
          <div class="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-wrap gap-3">
            <a id="rdv-detail-wa" href="#" target="_blank" rel="noopener noreferrer" class="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(37,211,102,0.15); color:#25D366; border:1px solid rgba(37,211,102,0.25);">
              <i class="fab fa-whatsapp mr-2"></i>WhatsApp
            </a>
            <button onclick="document.getElementById('rdv-detail-modal').classList.add('hidden')" class="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-colors" style="background:rgba(148,163,184,0.1); color:#94a3b8;">
              Fermer
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        ${CLIENT_ESC_HELPER}
        // Calendar state
        var calRDVs = ${jsonForScript(filtered.map(a => ({ id: a.id, name: a.name, phone: a.phone, quartier: a.quartier, date: a.date, heure_debut: a.heure_debut, heure_fin: a.heure_fin, status: a.status, type: a.type, notes: a.notes })))};
        // Full RDV data map (id -> rdv) for detail popup
        var _rdvMap = ${jsonForScript(Object.fromEntries(filtered.map(a => [a.id, a])))};
        function showRdvDetailById(id) { var a = _rdvMap[id]; if (a) showRdvDetail(a); }
        var calMonth = new Date().getMonth();
        var calYear = new Date().getFullYear();

        function toggleRDVView(view) {
          var listEl = document.getElementById('rdv-list-view');
          var calEl = document.getElementById('rdv-calendar-view');
          var btnList = document.getElementById('btn-view-list');
          var btnCal = document.getElementById('btn-view-calendar');
          if (view === 'calendar') {
            if (listEl) listEl.classList.add('hidden');
            calEl.classList.remove('hidden');
            btnList.style.background = 'transparent'; btnList.style.color = '#94a3b8';
            btnCal.style.background = 'rgba(59,130,246,0.2)'; btnCal.style.color = '#60a5fa';
            renderCalendar();
          } else {
            if (listEl) listEl.classList.remove('hidden');
            calEl.classList.add('hidden');
            btnList.style.background = 'rgba(59,130,246,0.2)'; btnList.style.color = '#60a5fa';
            btnCal.style.background = 'transparent'; btnCal.style.color = '#94a3b8';
          }
        }

        function changeCalendarMonth(delta) {
          calMonth += delta;
          if (calMonth > 11) { calMonth = 0; calYear++; }
          if (calMonth < 0) { calMonth = 11; calYear--; }
          renderCalendar();
        }

        function renderCalendar() {
          var months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
          document.getElementById('calendar-month-label').textContent = months[calMonth] + ' ' + calYear;

          var firstDay = new Date(calYear, calMonth, 1).getDay();
          var startOffset = (firstDay === 0 ? 6 : firstDay - 1); // Monday-based
          var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
          var today = new Date();

          // Count RDVs per day
          var rdvByDay = {};
          calRDVs.forEach(function(r) {
            if (!r.date) return;
            var parts = r.date.split('-');
            if (parts.length < 3) return;
            var rYear = parseInt(parts[0]), rMonth = parseInt(parts[1]) - 1, rDay = parseInt(parts[2]);
            if (rYear === calYear && rMonth === calMonth) {
              if (!rdvByDay[rDay]) rdvByDay[rDay] = [];
              rdvByDay[rDay].push(r);
            }
          });

          var grid = document.getElementById('calendar-grid');
          var html = '';
          // Empty cells before 1st
          for (var i = 0; i < startOffset; i++) {
            html += '<div class="p-2 rounded-lg min-h-[60px]" style="background:var(--admin-bg-elevated);"></div>';
          }
          for (var d = 1; d <= daysInMonth; d++) {
            var isToday = (d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear());
            var count = rdvByDay[d] ? rdvByDay[d].length : 0;
            var pending = rdvByDay[d] ? rdvByDay[d].filter(function(r){return r.status==='pending'}).length : 0;
            var bgStyle = isToday ? 'background:rgba(3,105,161,0.08); border:2px solid rgba(3,105,161,0.3);' : count > 0 ? 'background:rgba(5,150,105,0.06); border:1px solid rgba(5,150,105,0.2);' : 'background:var(--admin-bg); border:1px solid var(--admin-border);';
            html += '<div class="p-2 rounded-lg min-h-[60px] cursor-pointer hover:scale-105 transition-transform" style="' + bgStyle + '" onclick="showCalendarDay(' + d + ')">';
            html += '<div class="text-xs font-bold ' + (isToday ? 'text-blue-500' : '') + '" style="' + (isToday ? '' : 'color:var(--admin-text-muted)') + '">' + d + '</div>';
            if (count > 0) {
              html += '<div class="mt-1">';
              if (pending > 0) html += '<div class="text-[10px] px-1.5 py-0.5 rounded-full font-bold mb-0.5" style="background:rgba(251,191,36,0.15); color:#fbbf24;">' + pending + ' attente</div>';
              if (count - pending > 0) html += '<div class="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style="background:rgba(16,185,129,0.15); color:#34d399;">' + (count - pending) + ' confirm.</div>';
              html += '</div>';
            }
            html += '</div>';
          }
          grid.innerHTML = html;
        }

        function showCalendarDay(day) {
          var rdvs = [];
          calRDVs.forEach(function(r) {
            if (!r.date) return;
            var parts = r.date.split('-');
            if (parts.length < 3) return;
            if (parseInt(parts[0]) === calYear && parseInt(parts[1]) - 1 === calMonth && parseInt(parts[2]) === day) rdvs.push(r);
          });
          var months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
          document.getElementById('calendar-day-label').textContent = day + ' ' + months[calMonth] + ' ' + calYear + ' — ' + rdvs.length + ' RDV';
          var detail = document.getElementById('calendar-day-detail');
          var container = document.getElementById('calendar-day-rdvs');
          if (rdvs.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500">Aucun RDV ce jour</p>';
          } else {
            container.innerHTML = rdvs.map(function(r) {
              var statusColor = r.status === 'pending' ? 'color:#fbbf24' : r.status === 'confirmed' ? 'color:#34d399' : 'color:#60a5fa';
              var statusLabel = r.status === 'pending' ? 'En attente' : r.status === 'confirmed' ? 'Confirmé' : 'Effectué';
              return '<div class="flex items-center justify-between p-3 rounded-xl" style="background:var(--admin-bg-elevated); border:1px solid var(--admin-border);">' +
                '<div><span class="font-semibold text-sm" style="color:var(--admin-text-primary)">' + _esc(r.name) + '</span>' +
                '<span class="text-xs ml-2" style="color:var(--admin-text-muted)">' + _esc(r.heure_debut || '') + (r.heure_fin ? '–' + _esc(r.heure_fin) : '') + '</span>' +
                '<div class="text-xs mt-0.5" style="color:var(--admin-text-muted)"><i class="fas fa-map-marker-alt mr-1"></i>' + _esc(r.quartier || '') + ' · ' + _esc({devis:'Devis',installation:'Installation',entretien:'Entretien',depannage:'Dépannage'}[r.type] || r.type) + '</div></div>' +
                '<span class="text-xs font-bold" style="' + statusColor + '">' + statusLabel + '</span></div>';
            }).join('');
          }
          detail.classList.remove('hidden');
        }

        function filterRDVList(q) {
          q = q.toLowerCase().trim();
          document.querySelectorAll('.rdv-card').forEach(function(card) {
            var ds = card.getAttribute('data-search') || '';
            card.style.display = (!q || ds.includes(q)) ? '' : 'none';
          });
        }
        function showRdvDetail(a) {
          var badgeClass = a.status === 'pending' ? 'badge-pending' : a.status === 'confirmed' ? 'badge-confirmed' : 'badge-done';
          var badgeLabel = a.status === 'pending' ? 'En attente' : a.status === 'confirmed' ? 'Confirmé' : 'Effectué';
          document.getElementById('rdv-detail-avatar').textContent = (a.name || '?').charAt(0).toUpperCase();
          document.getElementById('rdv-detail-name').textContent = a.name || '-';
          document.getElementById('rdv-detail-type').textContent = {devis:'Devis / Dimensionnement',installation:'Installation',entretien:'Entretien / Maintenance',depannage:'Dépannage / Réparation urgente'}[a.type] || a.type;
          document.getElementById('rdv-detail-badge').innerHTML = '<span class="text-xs px-3 py-1 rounded-full font-semibold ' + badgeClass + '">' + badgeLabel + '</span>';
          document.getElementById('rdv-detail-phone').textContent = a.phone || '-';
          document.getElementById('rdv-detail-quartier').textContent = a.quartier || '-';
          document.getElementById('rdv-detail-date').textContent = a.date || '-';
          var heure = (a.heure_debut && a.heure_fin) ? (a.heure_debut + ' – ' + a.heure_fin) : (a.heure_debut || a.heure_fin || '-');
          document.getElementById('rdv-detail-heure').textContent = heure;
          document.getElementById('rdv-detail-gps').textContent = (a.latitude && a.longitude) ? (a.latitude + ', ' + a.longitude) : 'Non renseigné';
          document.getElementById('rdv-detail-created').textContent = a.created_at || '-';
          var adresseRow = document.getElementById('rdv-detail-adresse-row');
          if (a.adresse_precise) { adresseRow.classList.remove('hidden'); document.getElementById('rdv-detail-adresse').textContent = a.adresse_precise; } else { adresseRow.classList.add('hidden'); }
          var notesRow = document.getElementById('rdv-detail-notes-row');
          if (a.notes) { notesRow.classList.remove('hidden'); document.getElementById('rdv-detail-notes').textContent = a.notes; } else { notesRow.classList.add('hidden'); }
          var phone = (a.phone || '').replace(/\\D/g, '');
          document.getElementById('rdv-detail-wa').href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Bonjour ' + a.name + ', votre RDV MAASGA du ' + a.date + ' est confirmé.');
          // Reset client section
          document.getElementById('rdv-client-status').textContent = 'Chargement...';
          document.getElementById('rdv-client-body').innerHTML = '<div class="flex justify-center py-2"><i class="fas fa-spinner fa-spin text-gray-500 text-lg"></i></div>';
          document.getElementById('rdv-detail-modal').classList.remove('hidden');
          // Fetch client info by phone
          fetch('/api/admin/clients/by-phone?phone=' + encodeURIComponent(a.phone || ''))
            .then(function(r){ return r.json(); })
            .then(function(d) {
              if (!d.found) {
                document.getElementById('rdv-client-status').innerHTML = '<span style="color:#f97316;"><i class="fas fa-exclamation-circle mr-1"></i>Pas de compte</span>';
                document.getElementById('rdv-client-body').innerHTML =
                  '<p class="text-xs text-gray-500 text-center py-2">Ce numéro n\'a pas de compte client enregistré.</p>' +
                  '<div class="flex justify-center"><a href="/admin/clients" class="text-xs px-3 py-1.5 rounded-xl font-semibold" style="background:rgba(59,130,246,0.15);color:#60a5fa;"><i class="fas fa-user-plus mr-1"></i>Créer un client</a></div>';
                return;
              }
              var cl = d.client;
              document.getElementById('rdv-client-status').innerHTML = '<span style="color:#34d399;"><i class="fas fa-check-circle mr-1"></i>Client enregistré</span>';
              var srcLabel = { website: 'Site web', referral: 'Parrainage', direct: 'Direct', social: 'Réseaux sociaux' };
              document.getElementById('rdv-client-body').innerHTML =
                '<div class="grid grid-cols-2 gap-2 text-xs">' +
                  '<div class="rounded-lg p-2" style="background:var(--admin-bg);border:1px solid var(--admin-border);">' +
                    '<div style="color:var(--admin-text-muted)" class="mb-0.5"><i class="fas fa-user mr-1"></i>Nom</div>' +
                    '<div class="font-semibold" style="color:var(--admin-text-primary)">' + _esc(cl.name || '-') + '</div>' +
                  '</div>' +
                  '<div class="rounded-lg p-2" style="background:var(--admin-bg);border:1px solid var(--admin-border);">' +
                    '<div style="color:var(--admin-text-muted)" class="mb-0.5"><i class="fas fa-envelope mr-1"></i>Email</div>' +
                    '<div class="font-semibold truncate" style="color:var(--admin-text-primary)">' + _esc(cl.email || 'Non renseigné') + '</div>' +
                  '</div>' +
                  '<div class="rounded-lg p-2" style="background:var(--admin-bg);border:1px solid var(--admin-border);">' +
                    '<div style="color:var(--admin-text-muted)" class="mb-0.5"><i class="fas fa-home mr-1"></i>Adresse</div>' +
                    '<div class="font-semibold" style="color:var(--admin-text-primary)">' + _esc(cl.address || cl.quartier || '-') + '</div>' +
                  '</div>' +
                  '<div class="rounded-lg p-2" style="background:var(--admin-bg);border:1px solid var(--admin-border);">' +
                    '<div style="color:var(--admin-text-muted)" class="mb-0.5"><i class="fas fa-calendar-alt mr-1"></i>Client depuis</div>' +
                    '<div class="font-semibold" style="color:var(--admin-text-primary)">' + (cl.created_at ? new Date(cl.created_at).toLocaleDateString('fr-FR') : '-') + '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="flex gap-2 mt-2 text-xs">' +
                  '<div class="flex-1 rounded-lg p-2 text-center" style="background:rgba(3,105,161,0.06);border:1px solid rgba(3,105,161,0.15);">' +
                    '<div class="font-bold text-blue-500 text-base">' + (d.rdvCount || 0) + '</div>' +
                    '<div style="color:var(--admin-text-muted)">RDV</div>' +
                  '</div>' +
                  '<div class="flex-1 rounded-lg p-2 text-center" style="background:rgba(16,185,129,0.1);">' +
                    '<div class="font-bold text-green-300 text-base">' + (d.orderCount || 0) + '</div>' +
                    '<div class="text-gray-500">Commandes</div>' +
                  '</div>' +
                  '<div class="flex-1 rounded-lg p-2 text-center" style="background:rgba(245,158,11,0.1);">' +
                    '<div class="font-bold text-amber-300 text-base">' + (d.contractCount || 0) + '</div>' +
                    '<div class="text-gray-500">Contrats</div>' +
                  '</div>' +
                '</div>' +
                '<div class="flex justify-end mt-1">' +
                  '<a href="/admin/clients" class="text-xs text-cyan-400 hover:underline"><i class="fas fa-external-link-alt mr-1"></i>Voir fiche complète</a>' +
                '</div>';
            })
            .catch(function() {
              document.getElementById('rdv-client-status').textContent = 'Erreur';
              document.getElementById('rdv-client-body').innerHTML = '<p class="text-xs text-red-400 text-center py-2">Impossible de charger la fiche client.</p>';
            });
        }
      ` }} />
    </AdminLayout>
  )
}

// ============================================================
// PAGE CLIENTS
// ============================================================
