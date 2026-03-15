import { Layout } from '../components/Layout'
import { products } from '../data/products'
import { quartiersByArrondissement } from '../data/quartiers'

export const RendezVousPage = ({ success, error, productId, type, clientName, clientPhone, surface, btu }: { success?: boolean; error?: string; productId?: string; type?: string; clientName?: string; clientPhone?: string; surface?: string; btu?: string }) => {
  const selectedProduct = productId ? products.find(p => p.id === parseInt(productId)) : null

  return (
    <Layout title="Prendre Rendez-vous - MAASGA Climatisation Ouagadougou" activePage="rdv" canonicalPath="/rendez-vous" description="Prenez rendez-vous avec MAASGA — Visite technique gratuite pour installation climatiseur à Ouagadougou. Créneaux disponibles en ligne.">

      {/* Hero */}
      <section class="gradient-hero py-16 text-white text-center relative overflow-hidden">
        <div class="max-w-4xl mx-auto px-4 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-sm mb-4">
            <i class="fas fa-calendar-check text-ice-300"></i>
            <span>Visite technique gratuite · Devis sous 24h</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-4">Prendre Rendez-vous</h1>
          <p class="text-blue-100/90 text-lg max-w-xl mx-auto">
            Nos techniciens se déplacent gratuitement pour évaluer votre projet. Devis PDF remis à l'issue de la visite.
          </p>
        </div>
      </section>

      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Succès */}
        {success && (
          <div class="mb-8 rounded-2xl p-6 flex items-start space-x-4" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25);">
            <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style="background:rgba(16,185,129,0.15);">
              <i class="fas fa-check-circle text-green-400 text-2xl"></i>
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-green-300 text-lg mb-1">Rendez-vous enregistré !</h3>
              <p class="text-green-400 text-sm">Nous avons bien reçu votre demande. Notre équipe vous contactera sous 2h pour confirmer le créneau. À très bientôt !</p>
              <a href="/" class="inline-flex items-center space-x-2 text-green-600 font-medium text-sm mt-3 hover:text-green-400">
                <i class="fas fa-home"></i><span>Retour à l'accueil</span>
              </a>

              {/* Section création compte */}
              <div id="rdv-create-account" data-client-name={clientName?.replace(/[<>"'&]/g, '') || ''} data-client-phone={clientPhone?.replace(/[^0-9+\s]/g, '') || ''} style="margin-top:20px;">
                <div style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.15); border-radius:14px; padding:16px;">
                  <div style="font-size:0.85rem; font-weight:700; color:#03045e; margin-bottom:8px;">
                    <i class="fas fa-user-circle" style="color:#38bdf8; margin-right:6px;"></i>Créer votre compte MAASGA
                  </div>
                  <p style="font-size:0.95rem; color:#03045e; font-weight:700; margin-bottom:14px; line-height:1.5;">Suivez vos commandes et RDV. Nous vous contacterons bientôt</p>
                  <a href="/espace-client" style="display:block; width:100%; padding:11px; border-radius:10px; background:rgba(56,189,248,0.15); color:#38bdf8; font-weight:700; font-size:0.85rem; border:1px solid rgba(56,189,248,0.25); text-align:center; text-decoration:none;">
                    <i class="fas fa-user-plus" style="margin-right:6px;"></i>Créer mon compte
                  </a>
                </div>
              </div>

              <script dangerouslySetInnerHTML={{ __html: `
                function toggleRdvPwd() {
                  const input = document.getElementById('rdv-register-password');
                  const icon = document.getElementById('rdv-eye-icon');
                  if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                  } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                  }
                }
                async function createAccountAfterRdv() {
                  const password = document.getElementById('rdv-register-password').value.trim();
                  if (!password || password.length < 8) {
                    showToast('Mot de passe trop court (minimum 8 caractères).', 'warning');
                    return;
                  }
                  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
                    showToast('Le mot de passe doit contenir des lettres et des chiffres.', 'warning');
                    return;
                  }
                  const btn = event.target.closest('button');
                  btn.disabled = true;
                  btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Création...';
                  try {
                    var rdvBox = document.getElementById('rdv-create-account');
                    var safeName = rdvBox ? rdvBox.getAttribute('data-client-name') || '' : '';
                    var safePhone = rdvBox ? rdvBox.getAttribute('data-client-phone') || '' : '';
                    const res = await fetch('/api/register', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: safeName,
                        phone: safePhone,
                        email: null,
                        password
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      document.getElementById('rdv-create-account').innerHTML =
                        '<div style="text-align:center; color:#34d399; font-size:0.85rem; padding:14px; background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.2); border-radius:12px;">'
                        + '<i class="fas fa-check-circle" style="margin-right:6px;"></i>'
                        + 'Compte créé ! <a href="/espace-client" style="color:#38bdf8; font-weight:700; margin-left:6px;">Se connecter →</a>'
                        + '</div>';
                    } else {
                      btn.disabled = false;
                      btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:6px;"></i>Créer mon compte';
                      showToast(data.error || 'Erreur. Veuillez réessayer.', 'error');
                    }
                  } catch(e) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-user-plus" style="margin-right:6px;"></i>Créer mon compte';
                    showToast('Erreur réseau.', 'error');
                  }
                }
              `}} />
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div class="mb-8 rounded-2xl p-4 flex items-center space-x-3" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25);">
            <i class="fas fa-exclamation-circle text-red-400 text-xl"></i>
            <span class="text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* ===== COMPTEUR CRÉNEAU ===== */}
        {!success && (
          <div id="slot-banner" >
          </div>
        )}

        {/* ===== CONTACT RAPIDE ===== */}
        {!success && (
          <div class="mb-8 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 reveal" style="background:linear-gradient(135deg,rgba(37,211,102,0.08),rgba(56,189,248,0.08)); border:1px solid rgba(37,211,102,0.2);">

            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background:rgba(37,211,102,0.15);">
                <i class="fab fa-whatsapp text-xl" style="color:#25D366;"></i>
              </div>
              <div>
                <div class="font-bold text-sm" style="color:#03045e;">Besoin d'une réponse rapide ?</div>
                <div class="text-xs" style="color:#8ba3c0;">Contactez-nous directement, on répond en moins de 30 min</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA%2C%20je%20souhaite%20prendre%20rendez-vous%20pour%20une%20visite%20technique." target="_blank" rel="noopener noreferrer" class="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105" style="background:#25D366;">
                <i class="fab fa-whatsapp"></i>
                <span>WhatsApp</span>
              </a>
              <a href="tel:+22655996418" class="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105" style="background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.25);">
                <i class="fas fa-phone"></i>
                <span>Appeler</span>
              </a>
            </div>
          </div>
        )}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ===== FORMULAIRE ===== */}
          <div class="lg:col-span-2">
            <div class="glass-card rounded-3xl p-8 reveal">
              <h2 class="text-xl font-bold text-white mb-6 flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2);">
                  <i class="fas fa-clipboard-list text-cyan-400"></i>
                </div>
                <span>Votre demande de rendez-vous</span>
              </h2>

              {/* Produit pré-sélectionné */}
              {selectedProduct && (
                <div class="mb-6 rounded-xl p-4 flex items-center space-x-4" style="background:rgba(56,189,248,0.07); border:1px solid rgba(56,189,248,0.2);">
                  <div class="text-3xl">{selectedProduct.image}</div>
                  <div>
                    <div class="text-xs text-blue-500 font-semibold uppercase">{selectedProduct.brand}</div>
                    <div class="font-bold text-white">{selectedProduct.name}</div>
                    <div class="text-sm text-gray-300">{selectedProduct.price.toLocaleString()} FCFA + installation</div>
                  </div>
                  <input type="hidden" name="product_id" value={String(selectedProduct.id)} />
                </div>
              )}

              <form method="post" action="/api/rdv" class="space-y-5">
                <div class="hidden" aria-hidden="true"><input type="text" name="website" tabindex={-1} autocomplete="off" /></div>
                {selectedProduct && <input type="hidden" name="product_id" value={String(selectedProduct.id)} />}
                {surface && <input type="hidden" name="surface_hint" value={surface} />}
                {btu && <input type="hidden" name="btu_hint" value={btu} />}

                {/* Bandeau simulateur BTU si présent */}
                {btu && (
                  <div class="rounded-xl p-4 flex items-center space-x-3" style="background:linear-gradient(135deg,rgba(52,211,153,0.08),rgba(16,185,129,0.05)); border:1px solid rgba(52,211,153,0.2);">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(52,211,153,0.12);">
                      <i class="fas fa-calculator text-green-400"></i>
                    </div>
                    <div>
                      <p class="text-xs font-semibold" style="color:#34d399;">Données du simulateur</p>
                      <p class="text-sm text-white font-bold">{parseInt(btu).toLocaleString()} BTU{surface ? ` — ${surface} m²` : ''}</p>
                      <p class="text-xs" style="color:#6b7280;">Ces informations seront transmises à notre équipe technique</p>
                    </div>
                  </div>
                )}

                {/* Type de RDV - Toujours visible */}
                <div>
                  <label class="block text-sm font-semibold text-cyan-300 mb-3">
                    Type de rendez-vous <span class="text-red-500">*</span>
                  </label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { val: "devis", label: "Devis", desc: "Visite + devis PDF", icon: "fa-clipboard-check", color: "text-blue-400", bg: "bg-cyan-900/20" },
                      { val: "installation", label: "Installation", desc: "Pose seule", icon: "fa-tools", color: "text-green-400", bg: "bg-green-900/20" },
                      { val: "entretien", label: "Entretien", desc: "Maintenance", icon: "fa-wrench", color: "text-purple-400", bg: "bg-purple-900/20" },
                      { val: "depannage", label: "Dépannage", desc: "Réparation urgente", icon: "fa-bolt", color: "text-red-400", bg: "bg-red-900/20" }
                    ].map(t => (
                      <label class="cursor-pointer block">
                        <input type="radio" name="type" value={t.val} class="sr-only peer" checked={type === t.val || (t.val === 'devis' && !type)} />
                        <div class={`peer-checked:border-cyan-500/60 peer-checked:bg-cyan-900/20 border-2 border-gray-700/50 rounded-xl p-3 hover:border-cyan-500/30 transition-all`}>
                          <div class={`w-8 h-8 ${t.bg} rounded-lg flex items-center justify-center mb-2`}>
                            <i class={`fas ${t.icon} ${t.color}`}></i>
                          </div>
                          <div class="font-semibold text-white text-xs leading-tight">{t.label}</div>
                          <div class="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Informations personnelles */}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="rdv-name" class="block text-sm font-semibold text-gray-200 mb-2">
                      Nom complet <span class="text-red-400">*</span>
                    </label>
                    <input type="text" id="rdv-name" name="name" required placeholder="Votre nom et prénom"
                      autocomplete="name" class="input-field w-full rounded-xl px-4 py-3 text-white" />
                  </div>
                  <div>
                    <label for="rdv-phone" class="block text-sm font-semibold text-gray-200 mb-2">
                      Téléphone (Whatsapp)<span class="text-red-400">*</span>
                    </label>
                    <div class="relative">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 text-sm font-medium">🇧🇫 +226</span>
                      <input type="tel" id="rdv-phone" name="phone" required placeholder="55 99 64 18"
                        autocomplete="tel" class="input-field w-full rounded-xl pl-20 pr-4 py-3 text-white" />
                    </div>
                  </div>
                </div>

                <div>
                  <label for="rdv-email" class="block text-sm font-semibold text-gray-200 mb-2">
                    Email <span class="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <input type="email" id="rdv-email" name="email" placeholder="votre@email.com"
                    autocomplete="email" class="input-field w-full rounded-xl px-4 py-3 text-white" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="rdv-quartier" class="block text-sm font-semibold text-gray-200 mb-2">
                      Quartier / Secteur <span class="text-red-400">*</span>
                    </label>
                    <select id="rdv-quartier" name="quartier" required class="input-field w-full rounded-xl px-4 py-3 text-white" onchange="updateLocationPreview(this.value)">
                      <option value="">Sélectionner votre quartier</option>
                      {(() => {
                        const grouped = quartiersByArrondissement()
                        return Object.entries(grouped).map(([arr, qList]) => (
                          <optgroup label={`Arrondissement ${arr}`}>
                            {qList.map(q => <option value={q.name}>{q.name}</option>)}
                          </optgroup>
                        ))
                      })()}
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-gray-200 mb-2">
                      Localisation précise <span class="text-gray-400 font-normal"></span>
                    </label>
                    <button type="button" onclick="openLocationModal()" class="w-full flex items-center justify-center space-x-2 border-2 border-primary-300 hover:border-primary-500 hover:bg-primary-50 text-primary-700 font-semibold py-2.5 rounded-xl transition-all">
                      <i class="fas fa-map-marker-alt"></i>
                      <span>Choisir sur la carte</span>
                    </button>
                  </div>
                </div>

                {/* Inputs cachés pour lat/lng */}
                <input type="hidden" name="latitude" id="latitude" value="" />
                <input type="hidden" name="longitude" id="longitude" value="" />
                <input type="hidden" name="adresse_precise" id="adresse_precise" value="" />

                <div>
                  <label for="rdv-date" class="block text-sm font-semibold text-gray-200 mb-2">
                    Date souhaitée <span class="text-red-400">*</span>
                  </label>
                  <input type="date" id="rdv-date" name="date" required
                    min={new Date().toISOString().split('T')[0]}
                    class="input-field w-full rounded-xl px-4 py-3 text-white" />
                </div>

                {/* Créneau horaire personnalisé */}
                <div>
                  <label class="block text-sm font-semibold text-cyan-300 mb-3">Horaire souhaité</label>
                  <div class="rounded-xl p-4 mb-4" style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.15);">
                    <p class="text-xs mb-3" style="color:#38bdf8;">
                      <i class="fas fa-info-circle mr-2"></i>Choisissez l'intervalle de temps pendant lequel vous êtes disponible
                    </p>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label for="rdv-heure-debut" class="block text-xs font-semibold text-gray-300 mb-2">Heure de début</label>
                        <input type="time" id="rdv-heure-debut" name="heure_debut" required value="08:00" 
                          class="input-field w-full rounded-lg px-3 py-2.5 text-white" />
                      </div>
                      <div>
                        <label for="rdv-heure-fin" class="block text-xs font-semibold text-gray-300 mb-2">Heure de fin</label>
                        <input type="time" id="rdv-heure-fin" name="heure_fin" required value="18:00"
                          class="input-field w-full rounded-lg px-3 py-2.5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label for="rdv-notes" class="block text-sm font-semibold text-gray-200 mb-2">
                    Informations complémentaires
                    <span class="text-gray-400 font-normal ml-1">(optionnel)</span>
                  </label>
                  <textarea id="rdv-notes" name="notes" rows={3} placeholder="Ex: Surface à climatiser, nombre de pièces, contraintes particulières..."
                    class="input-field w-full rounded-xl px-4 py-3 text-white resize-none"></textarea>
                </div>

                {/* Consentement */}
                <div class="rounded-xl p-4" style="background:rgba(56,189,248,0.04); border:1px solid rgba(56,189,248,0.12);">
                  <label class="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" name="consent" required class="mt-0.5 accent-primary-600 w-4 h-4 flex-shrink-0" />
                    <span class="text-xs text-gray-300 leading-relaxed">
                      J'accepte d'être contacté(e) par MAASGA concernant ma demande de rendez-vous. Mes données sont utilisées uniquement pour le suivi de ma demande.
                    </span>
                  </label>
                </div>

                <button type="submit" class="w-full btn-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 shadow-lg text-base"
                  onclick="this.disabled=true;this.querySelector('span').textContent='Envoi en cours...';this.closest('form').submit();">
                  <i class="fas fa-calendar-check"></i>
                  <span>Confirmer ma demande de RDV</span>
                </button>

                <p class="text-xs text-center" style="color:#64748b;">
                  <i class="fas fa-lock mr-1"></i>
                  Vos données sont sécurisées et ne sont pas partagées avec des tiers.
                </p>
              </form>
            </div>
          </div>

          {/* ===== SIDEBAR INFO ===== */}
          <div class="space-y-5">
            {/* Processus */}
            <div class="glass-card rounded-2xl p-6 reveal">
              <h3 class="font-bold text-white mb-5 flex items-center space-x-2">
                <i class="fas fa-route text-cyan-400"></i>
                <span>Notre processus</span>
              </h3>
              <div class="space-y-4">
                {[
                  { num: "1", title: "Demande en ligne", desc: "Vous remplissez ce formulaire en 2 min", color: "bg-primary-600" },
                  { num: "2", title: "Confirmation", desc: "Nous vous rappelons sous 2h pour valider le créneau", color: "bg-ice-600" },
                  { num: "3", title: "Visite technique", desc: "Déplacement gratuit chez vous par nos experts", color: "bg-green-600" },
                  { num: "4", title: "Devis PDF", desc: "Document détaillé remis à l'issue de la visite", color: "bg-orange-500" },
                  { num: "5", title: "Installation", desc: "Pose professionnelle et vérification finale", color: "bg-purple-600" }
                ].map((s, i) => (
                  <div class="flex items-start space-x-3">
                    <div class={`w-7 h-7 ${s.color} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>{s.num}</div>
                    <div>
                      <div class="text-sm font-semibold text-white">{s.title}</div>
                      <div class="text-xs text-gray-400 leading-relaxed">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact direct */}
            <div class="bg-gradient-to-br from-primary-700 to-ice-600 text-white rounded-2xl p-6 reveal">
              <h4 class="font-bold mb-4 flex items-center space-x-2">
                <i class="fas fa-headset"></i>
                <span>Contact direct</span>
              </h4>
              <div class="space-y-3">
                <a href="tel:+22655996418" class="flex items-center space-x-3 bg-white/15 rounded-xl px-4 py-3 hover:bg-white/20 transition-all">
                  <i class="fas fa-phone text-ice-300"></i>
                  <div>
                    <div class="text-xs opacity-70">Téléphone</div>
                    <div class="font-semibold text-sm">+226 55 99 64 18</div>
                  </div>
                </a>
                <a href="https://wa.me/22655996418" target="_blank" rel="noopener noreferrer" class="flex items-center space-x-3 bg-white/15 rounded-xl px-4 py-3 hover:bg-white/20 transition-all">
                  <i class="fab fa-whatsapp text-green-300 text-lg"></i>
                  <div>
                    <div class="text-xs opacity-70">WhatsApp</div>
                    <div class="font-semibold text-sm">Message rapide</div>
                  </div>
                </a>
              </div>
              <div class="mt-4 text-xs opacity-70 text-center">
                Lundi–Dimanche · 8h00–18h00
              </div>
            </div>

            {/* Garanties */}
            <div class="glass-card rounded-2xl p-6 reveal">
              <h4 class="font-bold text-white mb-4">Nos engagements</h4>
              <div class="space-y-2">
                {[
                  { icon: "fa-check-circle", color: "text-green-500", text: "Visite technique gratuite" },
                  { icon: "fa-check-circle", color: "text-green-500", text: "Devis sans engagement" },
                  { icon: "fa-check-circle", color: "text-green-500", text: "Paiement après validation" },
                  { icon: "fa-check-circle", color: "text-green-500", text: "Installation soignée" },
                  { icon: "fa-check-circle", color: "text-green-500", text: "SAV rapide et réactif" }
                ].map(e => (
                  <div class="flex items-center space-x-2">
                    <i class={`fas ${e.icon} ${e.color} text-sm`}></i>
                    <span class="text-sm text-gray-300">{e.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modale Sélection de Localisation */}
        <div id="location-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-screen overflow-y-auto" style="background:#141c2e; border:1px solid rgba(148,180,220,0.12);">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-white text-lg flex items-center space-x-2">
                <i class="fas fa-map-marker-alt text-cyan-400"></i>
                <span>Sélectionner votre localisation</span>
              </h3>
              <button onclick="closeLocationModal()" class="hover:text-white p-1" style="color:#64748b;">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {/* Recherche adresse */}
            <div class="mb-4">
              <div class="flex gap-2 mb-2">
                <input 
                  type="text" 
                  id="address-input" 
                  placeholder="Ex: Rue du 13 janvier, Ouagadougou" 
                  class="flex-1 input-field rounded-xl px-4 py-3 text-white"
                />
                <button 
                  type="button" 
                  onclick="geolocateUser()" 
                  class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-colors"
                  title="Utiliser votre localisation actuelle">
                  <i class="fas fa-crosshairs text-sm"></i>
                  <span class="hidden sm:inline text-sm">Me localiser</span>
                </button>
              </div>
              <div id="address-suggestions" class="rounded-lg max-h-40 overflow-y-auto" style="background:#ffffff; border:1px solid rgba(59,130,246,0.15);"></div>
              <div id="location-status" class="text-xs mt-2 hidden"></div>
            </div>

            {/* Carte */}
            <div id="map-container" class="w-full h-80 rounded-xl overflow-hidden mb-4 flex items-center justify-center" style="background:#e8f2ff; border:1px solid rgba(59,130,246,0.2);">
              <iframe 
                id="map-iframe"
                width="100%" 
                height="100%" 
                frameborder="0" 
                style="border:0"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.7450623900347!2d-1.520926!3d12.365069!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1sOuagadougou!2sBurkina+Faso!5e0!3m2!1sfr!2sfr!4v1234567890"
                allowfullscreen
                loading="lazy">
              </iframe>
            </div>

            {/* Affichage coordonnées */}
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="rounded-lg p-3" style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.12);">
                <label class="block text-xs font-semibold text-cyan-400 mb-1">Latitude</label>
                <input type="text" id="map-lat" readonly class="w-full rounded px-2 py-1 text-xs text-gray-600" style="background:#f0f7ff; border:1px solid rgba(59,130,246,0.15);" placeholder="--" />
              </div>
              <div class="rounded-lg p-3" style="background:rgba(56,189,248,0.06); border:1px solid rgba(56,189,248,0.12);">
                <label class="block text-xs font-semibold text-cyan-400 mb-1">Longitude</label>
                <input type="text" id="map-lng" readonly class="w-full rounded px-2 py-1 text-xs text-gray-600" style="background:#f0f7ff; border:1px solid rgba(59,130,246,0.15);" placeholder="--" />
              </div>
            </div>

            <div class="flex space-x-3">
              <button type="button" onclick="closeLocationModal()" class="flex-1 border-2 border-gray-700/50 font-semibold py-3 rounded-xl text-sm" style="color:#8ba3c0;" onmouseover="this.style.background='#0b1120'" onmouseout="this.style.background='transparent'">
                Annuler
              </button>
              <button type="button" onclick="confirmLocation()" class="flex-1 btn-primary text-white font-semibold py-3 rounded-xl text-sm">
                Confirmer
              </button>
            </div>
          </div>
        </div>

        {/* Script gestion localisation */}
        <script dangerouslySetInnerHTML={{ __html: `
          let mapLat = 12.365069;
          let mapLng = -1.520926;

          function openLocationModal() {
            document.getElementById('location-modal').classList.remove('hidden');
          }

          function closeLocationModal() {
            document.getElementById('location-modal').classList.add('hidden');
          }

          function confirmLocation() {
            document.getElementById('latitude').value = mapLat.toFixed(6);
            document.getElementById('longitude').value = mapLng.toFixed(6);
            document.getElementById('adresse_precise').value = document.getElementById('address-input').value;
            closeLocationModal();
          }

          function updateLocationPreview(quartierName) {
            document.getElementById('address-input').value = quartierName + ', Ouagadougou';
          }

          function geolocateUser() {
            const statusDiv = document.getElementById('location-status');
            
            if (!navigator.geolocation) {
              statusDiv.textContent = '❌ Géolocalisation non supportée par votre navigateur';
              statusDiv.className = 'text-xs mt-2 text-red-600 font-medium';
              statusDiv.classList.remove('hidden');
              return;
            }

            statusDiv.textContent = '📍 Localisation en cours...';
            statusDiv.className = 'text-xs mt-2 text-blue-600 font-medium';
            statusDiv.classList.remove('hidden');

            navigator.geolocation.getCurrentPosition(
              function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = Math.round(position.coords.accuracy);

                mapLat = lat;
                mapLng = lng;

                document.getElementById('map-lat').value = lat.toFixed(6);
                document.getElementById('map-lng').value = lng.toFixed(6);

                // Reverse geocoding (simulation simple - en prod utiliser Google Maps API)
                document.getElementById('address-input').value = \`Coordonnées: \${lat.toFixed(4)}, \${lng.toFixed(4)} (précision: ±\${accuracy}m)\`;

                statusDiv.textContent = \`✅ Vous êtes localisé (précision: ±\${accuracy}m)\`;
                statusDiv.className = 'text-xs mt-2 text-green-600 font-medium';

                // Mettre à jour la carte
                const newMapSrc = \`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2000!2d\${lng}!3d\${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1sVotre+localisation!2sBurkina+Faso!5e0!3m2!1sfr!2sfr!4v1234567890\`;
                document.getElementById('map-iframe').src = newMapSrc;
              },
              function(error) {
                let errorMsg = 'Erreur de localisation';
                switch(error.code) {
                  case error.PERMISSION_DENIED:
                    errorMsg = '❌ Localisation refusée. Activez-la dans vos paramètres.';
                    break;
                  case error.POSITION_UNAVAILABLE:
                    errorMsg = '❌ Position indisponible. GPS non accessible.';
                    break;
                  case error.TIMEOUT:
                    errorMsg = '❌ Délai dépassé. Essayez à nouveau.';
                    break;
                }
                statusDiv.textContent = errorMsg;
                statusDiv.className = 'text-xs mt-2 text-red-600 font-medium';
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            );
          }

          document.getElementById('address-input')?.addEventListener('input', function(e) {
            const value = e.target.value;
            if (value.length > 2) {
              // Simulation suggestions - en production, utiliser Google Places API
              const suggestions = [
                { name: value + ', Ouagadougou', lat: 12.365069, lng: -1.520926 },
                { name: value + ' (Arrondissement 1)', lat: 12.365069, lng: -1.520926 },
                { name: value + ' (Secteur 15)', lat: 12.375000, lng: -1.510000 }
              ];
              
              const suggestionsDiv = document.getElementById('address-suggestions');
              suggestionsDiv.innerHTML = suggestions.map(s => 
                \`<div class="px-4 py-2 hover:bg-white/5 cursor-pointer text-gray-300" onclick="selectSuggestion('\${s.name}', \${s.lat}, \${s.lng})">
                  <i class="fas fa-map-marker-alt text-primary-500 mr-2"></i>\${s.name}
                </div>\`
              ).join('');
            }
          });

          function selectSuggestion(name, lat, lng) {
            document.getElementById('address-input').value = name;
            document.getElementById('map-lat').value = lat.toFixed(6);
            document.getElementById('map-lng').value = lng.toFixed(6);
            mapLat = lat;
            mapLng = lng;
            document.getElementById('address-suggestions').innerHTML = '';
            document.getElementById('location-status').classList.add('hidden');

            // Mettre à jour la carte
            const newMapSrc = \`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2000!2d\${lng}!3d\${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1sAdresse+sélectionnée!2sBurkina+Faso!5e0!3m2!1sfr!2sfr!4v1234567890\`;
            document.getElementById('map-iframe').src = newMapSrc;
          }
        `}} />

        {/* Script compteur prochain créneau */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const el = document.getElementById('slot-value');
            if (!el) return;
            // Calcul simple: basé sur le jour de la semaine, on affiche un créneau réaliste
            const now = new Date();
            const hour = now.getHours();
            const day = now.getDay(); // 0=dim, 6=sam
            let label;
            // Si on est en heure ouvrée (8h-17h) et un jour ouvrable (lun-ven)
            if (day >= 1 && day <= 5 && hour >= 8 && hour < 17) {
              label = "Aujourd'hui \u2014 créneau disponible";
              el.style.color = '#34d399';
              document.querySelector('#slot-banner .fa-clock').style.color = '#34d399';
              document.querySelector('#slot-banner [style*="rgba(56,189,248,0.12)"]').style.background = 'rgba(52,211,153,0.12)';
            } else if (day === 5 && hour >= 17) {
              // Vendredi soir → lundi
              label = 'Lundi prochain';
            } else if (day === 6) {
              // Samedi → lundi
              label = 'Lundi prochain';
            } else if (day === 0) {
              // Dimanche → demain
              label = 'Demain matin 8h';
            } else {
              // Soir en semaine → demain
              label = 'Demain matin dès 8h';
            }
            el.textContent = label;
          })();
        `}} />

        {/* Auto-fill form from session data */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            fetch('/api/session-check', { credentials: 'same-origin' })
              .then(function(r) { return r.json(); })
              .then(function(data) {
                if (data && data.loggedIn) {
                  if (data.name) {
                    var el = document.querySelector('form[action="/api/rdv"] input[name="name"]');
                    if (el && !el.value) el.value = data.name;
                  }
                  if (data.phone) {
                    var el = document.querySelector('form[action="/api/rdv"] input[name="phone"]');
                    if (el && !el.value) el.value = data.phone.replace(/^\\+?226\\s*/, '');
                  }
                  if (data.email) {
                    var el = document.querySelector('form[action="/api/rdv"] input[name="email"]');
                    if (el && !el.value) el.value = data.email;
                  }
                  if (data.quartier) {
                    var el = document.querySelector('form[action="/api/rdv"] select[name="quartier"]');
                    if (el && !el.value) {
                      // Try exact match first
                      for (var i = 0; i < el.options.length; i++) {
                        if (el.options[i].value.toLowerCase() === data.quartier.toLowerCase()) {
                          el.value = el.options[i].value;
                          break;
                        }
                      }
                    }
                  }
                }
              })
              .catch(function() {});
          })();
        `}} />
      </div>
    </Layout>
  )
}
