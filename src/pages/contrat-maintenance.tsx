import { Layout } from '../components/Layout'

const renderCell = (val: string) => {
  if (val.includes('✅')) {
    const rest = val.replace('✅', '').trim();
    return <span><i class="fas fa-check-circle" style="color:#16a34a;"></i>{rest ? ` ${rest}` : ''}</span>;
  }
  return val;
};

export const ContratMaintenancePage = ({ success, error, clientName, clientPhone }: {
  success?: boolean
  error?: string
  clientName?: string
  clientPhone?: string
}) => (
  <Layout 
    title="Contrats de Maintenance Climatisation — MAASGA" 
    activePage="maintenance" 
    canonicalPath="/contrat-maintenance"
    description="Contrats de maintenance préventive pour votre climatisation. 3 formules : Trimestrielle, Semestrielle ou Annuelle. Techniciens certifiés à Ouagadougou."
  >
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
    `}} />
    {/* Hero */}
    <section class="gradient-hero py-16 text-white text-center relative overflow-hidden reveal">
      <div class="relative z-10 max-w-4xl mx-auto px-4">
        <div class="inline-flex items-center space-x-2 bg-white bg-opacity-10 rounded-full px-4 py-2 text-sm mb-4 font-medium">
          <i class="fas fa-shield-alt"></i><span>Maintenance préventive · MAASGA</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold mb-4">Contrats de Maintenance</h1>
        <p class="text-blue-100 text-lg max-w-2xl mx-auto">
          Protégez votre investissement. Un entretien régulier prolonge la durée de vie de vos climatiseurs et réduit votre consommation d'énergie.
        </p>
      </div>
    </section>

    {/* Avantages maintenance */}
    <section class="py-12 px-4 reveal">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-10">
          <h2 class="text-2xl font-extrabold mb-3" style="color:#03045e;">Pourquoi un contrat de maintenance ?</h2>
          <p class="text-sm max-w-xl mx-auto" style="color:#64748b;">Un climatiseur bien entretenu consomme jusqu'à 30% d'énergie en moins et dure 2× plus longtemps.</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'fa-bolt', color: '#eab308', label: '-30% énergie', desc: 'Économies sur votre facture d\'électricité' },
            { icon: 'fa-heart', color: '#ef4444', label: '2× durée de vie', desc: 'Votre climatiseur dure plus longtemps' },
            { icon: 'fa-wind', color: '#0ea5e9', label: 'Air pur', desc: 'Filtres propres, air sain garanti' },
            { icon: 'fa-tools', color: '#16a34a', label: 'Zéro panne', desc: 'Diagnostic précoce des problèmes' }
          ].map(a => (
            <div class="glass-card rounded-2xl p-5 text-center card-hover">
              <div class="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3" style={`background:${a.color}15;`}>
                <i class={`fas ${a.icon}`} style={`color:${a.color}; font-size:1.2rem;`}></i>
              </div>
              <div class="text-sm font-bold mb-1" style="color:#03045e;">{a.label}</div>
              <div class="text-xs" style="color:#64748b;">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing Cards */}
    <section class="py-12 px-4 reveal" style="background:linear-gradient(180deg,#f0f9ff 0%,#e0f2fe 100%);">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-10">
          <h2 class="text-2xl font-extrabold mb-3" style="color:#03045e;">Choisissez votre formule</h2>
          <p class="text-sm" style="color:#64748b;">Toutes nos formules incluent le déplacement et la main d'œuvre</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {/* Offre Trimestrielle */}
          <div class="glass-card rounded-3xl p-7 relative card-hover" style="border:2px solid rgba(0,119,182,0.1);">
            <div class="text-center mb-6">
              <div class="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full mb-3" style="background:rgba(0,119,182,0.08); color:#0077b6;">
                <i class="fas fa-calendar-check"></i><span>TRIMESTRIEL</span>
              </div>
              <div class="text-3xl font-extrabold mb-1" style="color:#03045e;">30 000 <span class="text-base font-bold" style="color:#64748b;">F CFA</span></div>
              <div class="text-xs" style="color:#94a3b8;">/ trimestre · soit 10 000 F par maintenance</div>
            </div>
            <div class="space-y-3 mb-6">
              {[
                '3 maintenances préventives',
                'Vérification complète du système',
                'Nettoyage des filtres',
                'Contrôle des performances de refroidissement',
                'Vérification du gaz réfrigérant',
                'Diagnostic technique'
              ].map(f => (
                <div class="flex items-start space-x-2 text-sm">
                  <i class="fas fa-check mt-0.5 flex-shrink-0" style="color:#16a34a; font-size:0.7rem;"></i>
                  <span style="color:#334155;">{f}</span>
                </div>
              ))}
            </div>
            <div class="text-xs text-center mb-5 p-2 rounded-lg" style="background:rgba(0,119,182,0.04); color:#64748b;">
              <i class="fas fa-home mr-1"></i>Idéal pour : logements et petits bureaux
            </div>
            <button onclick="openMaintenanceModal('trimestriel')" class="w-full text-center font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer" style="background:rgba(0,119,182,0.08); color:#0077b6; border:1px solid rgba(0,119,182,0.15);">
              Choisir cette offre
            </button>
          </div>

          {/* Offre Semestrielle — RECOMMANDÉE */}
          <div class="glass-card rounded-3xl p-7 relative card-hover scale-105" style="border:2px solid #0077b6; box-shadow:0 20px 50px rgba(0,119,182,0.2);">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold" style="background:linear-gradient(135deg,#0077b6,#00b4d8); color:#ffffff;">
              <i class="fas fa-star mr-1"></i>RECOMMANDÉ
            </div>
            <div class="text-center mb-6 mt-2">
              <div class="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full mb-3" style="background:rgba(0,119,182,0.12); color:#0077b6;">
                <i class="fas fa-calendar-alt"></i><span>SEMESTRIEL</span>
              </div>
              <div class="text-3xl font-extrabold mb-1" style="color:#03045e;">55 000 <span class="text-base font-bold" style="color:#64748b;">F CFA</span></div>
              <div class="text-xs" style="color:#94a3b8;">/ 6 mois · soit ~9 166 F par maintenance</div>
              <div class="inline-flex items-center space-x-1 text-xs font-bold mt-2 px-2 py-0.5 rounded-full" style="background:rgba(22,163,74,0.1); color:#16a34a;">
                <i class="fas fa-tag"></i><span>Économie : 5 000 F</span>
              </div>
            </div>
            <div class="space-y-3 mb-4">
              {[
                '6 maintenances préventives',
                'Nettoyage complet unité intérieure + extérieure',
                'Vérification du gaz réfrigérant',
                'Diagnostic complet du système',
                'Priorité sur les interventions',
                'Conseils d\'optimisation énergétique'
              ].map(f => (
                <div class="flex items-start space-x-2 text-sm">
                  <i class="fas fa-check mt-0.5 flex-shrink-0" style="color:#16a34a; font-size:0.7rem;"></i>
                  <span style="color:#334155;">{f}</span>
                </div>
              ))}
            </div>
            <div class="p-3 rounded-xl mb-5" style="background:linear-gradient(135deg,rgba(0,119,182,0.06),rgba(0,180,216,0.06)); border:1px solid rgba(0,119,182,0.1);">
              <div class="text-xs font-bold mb-1" style="color:#0077b6;"><i class="fas fa-gift mr-1"></i>Bonus client :</div>
              <div class="text-xs" style="color:#334155;">1 diagnostic panne offert dans l'année</div>
            </div>
            <button onclick="openMaintenanceModal('semestriel')" class="w-full text-center font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer" style="background:linear-gradient(135deg,#0077b6,#00b4d8); box-shadow:0 8px 24px rgba(0,119,182,0.3); color:#ffffff;">
              Choisir cette offre
            </button>
          </div>

          {/* Offre Annuelle — PREMIUM */}
          <div class="glass-card rounded-3xl p-7 relative card-hover" style="border:2px solid rgba(3,4,94,0.2);">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold" style="background:linear-gradient(135deg,#03045e,#0077b6); color:#ffffff;">
              <i class="fas fa-fire mr-1"></i>MEILLEUR CHOIX
            </div>
            <div class="text-center mb-6 mt-2">
              <div class="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full mb-3" style="background:rgba(3,4,94,0.08); color:#03045e;">
                <i class="fas fa-crown"></i><span>ANNUEL PREMIUM</span>
              </div>
              <div class="text-3xl font-extrabold mb-1" style="color:#03045e;">100 000 <span class="text-base font-bold" style="color:#64748b;">F CFA</span></div>
              <div class="text-xs" style="color:#94a3b8;">/ an · soit ~8 333 F par maintenance</div>
              <div class="inline-flex items-center space-x-1 text-xs font-bold mt-2 px-2 py-0.5 rounded-full" style="background:rgba(22,163,74,0.1); color:#16a34a;">
                <i class="fas fa-tag"></i><span>Économie : 20 000 F</span>
              </div>
            </div>
            <div class="space-y-3 mb-4">
              {[
                '12 maintenances préventives',
                'Nettoyage complet professionnel',
                'Vérification gaz et pression',
                'Diagnostic complet du système',
                'Intervention prioritaire',
                'Conseils d\'optimisation énergétique',
                'Suivi technique personnalisé'
              ].map(f => (
                <div class="flex items-start space-x-2 text-sm">
                  <i class="fas fa-check mt-0.5 flex-shrink-0" style="color:#16a34a; font-size:0.7rem;"></i>
                  <span style="color:#334155;">{f}</span>
                </div>
              ))}
            </div>
            <div class="p-3 rounded-xl mb-5" style="background:linear-gradient(135deg,rgba(3,4,94,0.04),rgba(0,119,182,0.04)); border:1px solid rgba(3,4,94,0.08);">
              <div class="text-xs font-bold mb-1.5" style="color:#03045e;"><i class="fas fa-star mr-1"></i>Avantages exclusifs :</div>
              <div class="space-y-1">
                {[
                  '1 recharge de gaz gratuite (si nécessaire)',
                  '10% de réduction sur les réparations',
                  'Support prioritaire'
                ].map(b => (
                  <div class="flex items-center space-x-1.5 text-xs" style="color:#334155;">
                    <i class="fas fa-check-circle" style="color:#0077b6; font-size:0.6rem;"></i>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onclick="openMaintenanceModal('annuel')" class="w-full text-center font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 cursor-pointer" style="background:rgba(3,4,94,0.06); color:#03045e; border:1px solid rgba(3,4,94,0.15);">
              Choisir cette offre
            </button>
          </div>
        </div>

        {/* Comparatif */}
        <div class="mt-10 max-w-3xl mx-auto glass-card rounded-2xl p-6 reveal">
          <h3 class="font-bold text-center mb-4" style="color:#03045e;"><i class="fas fa-chart-bar mr-2" style="color:#0077b6;"></i>Comparatif rapide</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr style="border-bottom:2px solid rgba(0,119,182,0.1);">
                  <th class="text-left py-2 px-3 font-bold" style="color:#03045e;"></th>
                  <th class="text-center py-2 px-3 font-bold" style="color:#0077b6;">Trimestriel</th>
                  <th class="text-center py-2 px-3 font-bold" style="color:#0077b6;">Semestriel <i class="fas fa-star" style="font-size:0.7rem;"></i></th>
                  <th class="text-center py-2 px-3 font-bold" style="color:#03045e;">Annuel <i class="fas fa-fire" style="font-size:0.7rem;"></i></th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Prix', '30 000 F', '55 000 F', '100 000 F'],
                  ['Visites', '3', '6', '12'],
                  ['Coût/visite', '10 000 F', '~9 166 F', '~8 333 F'],
                  ['Diagnostic panne offert', '—', '✅ 1', '✅ 1'],
                  ['Recharge gaz gratuite', '—', '—', '✅'],
                  ['Réduction réparations', '—', '—', '10%'],
                  ['Support prioritaire', '—', '✅', '✅'],
                ].map(row => (
                  <tr style="border-bottom:1px solid rgba(0,119,182,0.06);">
                    <td class="py-2 px-3 font-medium" style="color:#334155;">{row[0]}</td>
                    <td class="py-2 px-3 text-center" style="color:#64748b;">{row[1]}</td>
                    <td class="py-2 px-3 text-center font-semibold" style="color:#0077b6;">{renderCell(row[2])}</td>
                    <td class="py-2 px-3 text-center font-semibold" style="color:#03045e;">{renderCell(row[3])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    {/* Formulaire de demande — MODAL */}
    <div id="maintenance-modal" data-lenis-prevent class="hidden fixed inset-0 z-50 flex items-start justify-center p-4 pt-6" style="background:rgba(0,0,0,0.6); backdrop-filter:blur(6px);">
      <div class="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden" style="background:#ffffff; max-height:92vh; overflow-y:auto;">
        {/* Modal Header */}
        <div class="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
          <div>
            <h3 class="font-extrabold text-lg" style="color:#03045e;">
              <i class="fas fa-file-contract mr-2" style="color:#0077b6;"></i>Souscrire à la maintenance
            </h3>
            <p class="text-xs mt-0.5" style="color:#64748b;">Prise en charge rapide · Confirmation sous 2h</p>
          </div>
          <button onclick="closeMaintenanceModal()" class="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors" style="color:#64748b;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="px-6 py-6">
          {/* Selected plan banner */}
          <div id="selected-plan-banner" class="hidden mb-5 p-4 rounded-xl flex items-center space-x-3" style="background:linear-gradient(135deg,rgba(0,119,182,0.06),rgba(0,180,216,0.06)); border:1.5px solid rgba(0,119,182,0.15);">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#0077b6,#00b4d8);">
              <i class="fas fa-file-contract text-white"></i>
            </div>
            <div>
              <div class="text-xs font-bold uppercase tracking-wider" style="color:#0077b6;">Formule sélectionnée</div>
              <div id="selected-plan-text" class="text-sm font-bold" style="color:#03045e;">—</div>
            </div>
          </div>

        {success && (
          <div class="mb-6 p-4 rounded-xl flex items-center space-x-3" style="background:rgba(22,163,74,0.08); border:1px solid rgba(22,163,74,0.15);">
            <i class="fas fa-check-circle text-xl" style="color:#16a34a;"></i>
            <div>
              <div class="font-bold text-sm" style="color:#16a34a;">Souscription confirmée !</div>
              <div class="text-xs" style="color:#64748b;">Votre contrat est enregistré. Nous vous contactons sous 2h pour planifier la prochaine intervention.</div>
            </div>
          </div>
        )}
        {error && (
          <div class="mb-6 p-4 rounded-xl flex items-center space-x-3" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.15);">
            <i class="fas fa-exclamation-circle text-xl" style="color:#ef4444;"></i>
            <span class="text-sm" style="color:#ef4444;">{error}</span>
          </div>
        )}

        <form method="post" action="/api/maintenance/request" class="space-y-5">
            <div class="hidden" aria-hidden="true"><input type="text" name="website" tabindex={-1} autocomplete="off" /></div>
            {/* Type de demande */}
            <div>
              <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Type de demande</label>
              <div class="grid grid-cols-3 gap-2" id="request-type-grid">
                {[
                  { val: 'occasionnelle', icon: 'fa-wrench', label: 'Occasionnelle', desc: 'Maintenance ponctuelle' },
                  { val: 'urgence', icon: 'fa-exclamation-triangle', label: 'Urgence', desc: 'Panne / problème' },
                  { val: 'contrat', icon: 'fa-file-contract', label: 'Contrat', desc: 'Souscrire une offre' },
                ].map(t => (
                  <label class="cursor-pointer">
                    <input type="radio" name="request_type" value={t.val} class="hidden peer" required />
                    <div class="peer-checked:border-blue-500 peer-checked:bg-blue-50 border-2 rounded-xl p-3 text-center transition-all hover:border-blue-300" style="border-color:rgba(0,119,182,0.12);">
                      <i class={`fas ${t.icon} text-lg mb-1`} style="color:#0077b6;"></i>
                      <div class="text-xs font-bold" style="color:#03045e;">{t.label}</div>
                      <div class="text-xs mt-0.5" style="color:#94a3b8;">{t.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Plan choisi (visible seulement si contrat) */}
            <div id="plan-field" style="display:none;">
              <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Formule choisie</label>
              <select name="plan_type" class="w-full rounded-xl px-4 py-3 text-sm" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;">
                <option value="">— Sélectionnez —</option>
                <option value="trimestriel">Trimestriel — 30 000 F CFA</option>
                <option value="semestriel">Semestriel — 55 000 F CFA (recommandé)</option>
                <option value="annuel">Annuel Premium — 100 000 F CFA</option>
              </select>
            </div>

            {/* Notice contact WhatsApp & Email */}
            <div id="payment-info" class="rounded-2xl p-4" style="background:linear-gradient(135deg,rgba(0,119,182,0.06),rgba(37,211,102,0.04)); border:1.5px solid rgba(0,119,182,0.15);">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5" style="background:linear-gradient(135deg,#0077b6,#00b4d8);">
                  <i class="fas fa-headset" style="color:#fff; font-size:1rem;"></i>
                </div>
                <div>
                  <div class="text-sm font-bold mb-1" style="color:#03045e;">Comment ça fonctionne ?</div>
                  <p class="text-xs leading-relaxed mb-3" style="color:#475569;">
                    Après validation de votre souscription, <strong style="color:#0077b6;">un conseiller MAASGA vous contactera directement</strong> par <span style="color:#25d366; font-weight:700;"><i class="fab fa-whatsapp"></i> WhatsApp</span> et par <span style="color:#0077b6; font-weight:700;"><i class="fas fa-envelope"></i> e-mail</span> afin de finaliser les modalités de votre contrat de maintenance.
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold" style="background:rgba(37,211,102,0.1); color:#16a34a;">
                      <i class="fab fa-whatsapp"></i> Contact WhatsApp
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold" style="background:rgba(0,119,182,0.08); color:#0077b6;">
                      <i class="fas fa-envelope"></i> Confirmation par e-mail
                    </span>
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold" style="background:rgba(234,179,8,0.1); color:#d97706;">
                      <i class="fas fa-clock"></i> Réponse sous 2h
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Identité */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Nom complet <span style="color:#e11d48;">*</span></label>
                <input type="text" name="name" required value={clientName || ''} placeholder="Votre nom" class="w-full rounded-xl px-4 py-3 text-sm" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Téléphone (Whatsapp) <span style="color:#e11d48;">*</span></label>
                <div class="flex rounded-xl overflow-hidden" style="border:1.5px solid rgba(0,119,182,0.2);">
                  <div class="flex items-center px-3 text-sm font-bold" style="background:rgba(0,119,182,0.06); color:#0077b6; border-right:1px solid rgba(0,119,182,0.15); white-space:nowrap;">🇧🇫 +226</div>
                  <input type="tel" name="phone" required value={clientPhone || ''} placeholder="55 99 64 18" class="flex-1 px-4 py-3 text-sm outline-none" style="background:#f8fbff; color:#03045e;" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Email <span style="color:#94a3b8; font-weight:400;">(optionnel)</span></label>
                <input type="email" name="email" placeholder="votre@email.com" class="w-full rounded-xl px-4 py-3 text-sm" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
              </div>
              <div>
                <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Quartier <span style="color:#94a3b8; font-weight:400;">(optionnel)</span></label>
                <input type="text" name="quartier" placeholder="Ouaga 2000, Pissy..." class="w-full rounded-xl px-4 py-3 text-sm" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
              </div>
            </div>

            {/* Détails */}
            <div>
              <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Type d'équipement</label>
              <select name="equipment_type" class="w-full rounded-xl px-4 py-3 text-sm" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;">
                <option value="">— Sélectionnez —</option>
                <option value="split">Split mural</option>
                <option value="cassette">Cassette plafonnier</option>
                <option value="gainable">Gainable</option>
                <option value="mobile">Climatiseur mobile</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Date de début <span style="color:#94a3b8; font-weight:400;">(optionnel)</span></label>
              <input type="date" name="preferred_date" class="w-full rounded-xl px-4 py-3 text-sm" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Description du besoin</label>
              <textarea name="description" rows={3} placeholder="Décrivez votre besoin ou problème..." class="w-full rounded-xl px-4 py-3 text-sm resize-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;"></textarea>
            </div>

            <button type="submit" id="submit-maintenance" class="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all hover:-translate-y-0.5" style="background:linear-gradient(135deg,#03045e,#0077b6); box-shadow:0 8px 24px rgba(0,119,182,0.35);"
              onclick="this.disabled=true;this.querySelector('span').textContent='Envoi en cours...';this.closest('form').submit();">
              <i class="fas fa-check-circle"></i>
              <span>Confirmer ma souscription</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    {/* CTA WhatsApp */}
    <section class="py-10 px-4 reveal">
      <div class="max-w-3xl mx-auto text-center glass-card rounded-3xl p-8" style="background:linear-gradient(135deg,rgba(37,211,102,0.04),rgba(22,163,74,0.04)); border:1px solid rgba(37,211,102,0.12);">
        <i class="fab fa-whatsapp text-4xl mb-3" style="color:#25d366;"></i>
        <h3 class="text-xl font-bold mb-2" style="color:#03045e;">Besoin d'une réponse rapide ?</h3>
        <p class="text-sm mb-5" style="color:#64748b;">Contactez-nous directement sur WhatsApp pour toute question sur nos contrats de maintenance.</p>
        <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA%2C%20je%20souhaite%20des%20informations%20sur%20vos%20contrats%20de%20maintenance." target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5" style="background:#25d366; box-shadow:0 8px 24px rgba(37,211,102,0.3);">
          <i class="fab fa-whatsapp text-lg"></i>
          <span>Écrire sur WhatsApp</span>
        </a>
      </div>
    </section>

    {/* Script interactions */}
    <script dangerouslySetInnerHTML={{ __html: `
      var planLabels = {
        trimestriel: 'Trimestriel — 30 000 F CFA',
        semestriel: 'Semestriel — 55 000 F CFA (recommandé)',
        annuel: 'Annuel Premium — 100 000 F CFA'
      };

      // Open modal with plan pre-selected
      function openMaintenanceModal(plan) {
        fetch('/api/session-check', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.loggedIn) {
              _doOpenMaintenanceModal(plan);
            } else {
              window.location.href = '/espace-client?redirect=contrat-maintenance&error=' + encodeURIComponent('Veuillez vous connecter pour choisir une offre de contrat de maintenance.');
            }
          })
          .catch(function() {
            window.location.href = '/espace-client?redirect=contrat-maintenance';
          });
      }

      function _doOpenMaintenanceModal(plan) {
        var modal = document.getElementById('maintenance-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        
        // Disable body scroll and Lenis
        document.body.classList.add('modal-open');
        if (window.__lenis) window.__lenis.stop();

        // Auto-select "contrat" type
        var contratRadio = document.querySelector('input[name="request_type"][value="contrat"]');
        if (contratRadio) { contratRadio.checked = true; contratRadio.dispatchEvent(new Event('change')); }

        // Set plan
        var planSelect = document.querySelector('select[name="plan_type"]');
        if (planSelect) planSelect.value = plan;

        // Show plan banner
        var banner = document.getElementById('selected-plan-banner');
        var bannerText = document.getElementById('selected-plan-text');
        if (banner && bannerText && planLabels[plan]) {
          bannerText.textContent = planLabels[plan];
          banner.classList.remove('hidden');
        }
      }

      function closeMaintenanceModal() {
        var modal = document.getElementById('maintenance-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        
        // Re-enable body scroll and Lenis
        document.body.classList.remove('modal-open');
        if (window.__lenis) window.__lenis.start();
      }

      // Close on backdrop click
      document.getElementById('maintenance-modal')?.addEventListener('click', function(e) {
        if (e.target === this) closeMaintenanceModal();
      });

      // Close on Escape
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeMaintenanceModal();
      });

      // Show/hide plan + payment fields based on request type
      document.querySelectorAll('input[name="request_type"]').forEach(function(r) {
        r.addEventListener('change', function() {
          var isContrat = this.value === 'contrat';
          document.getElementById('plan-field').style.display = isContrat ? 'block' : 'none';
          document.getElementById('payment-info').style.display = isContrat ? 'block' : 'none';
          // Update banner visibility
          var banner = document.getElementById('selected-plan-banner');
          if (!isContrat && banner) banner.classList.add('hidden');
        });
      });

      // ═══ Payment method dynamic panels ═══



      
      // Pre-select plan (legacy, kept for compatibility)
      function selectPlan(plan) {
        openMaintenanceModal(plan);
      }
      window.openMaintenanceModal = openMaintenanceModal;
      window.closeMaintenanceModal = closeMaintenanceModal;
      window.selectPlan = selectPlan;
      
      // Simple submit — payment handled via WhatsApp/email follow-up
      document.querySelector('#submit-maintenance')?.closest('form')?.addEventListener('submit', function(e) {
        var btn = document.getElementById('submit-maintenance');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i><span>Envoi en cours...</span>';
        }
      });

      // Auto-open modal if success/error query params present
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') || urlParams.get('error')) {
        document.getElementById('maintenance-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
    `}} />

    {/* Auto-fill form from session data */}
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        fetch('/api/session-check', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data && data.loggedIn) {
              var form = document.getElementById('maintenance-modal');
              if (!form) return;
              if (data.name) {
                var el = form.querySelector('input[name="name"]');
                if (el && !el.value) el.value = data.name;
              }
              if (data.phone) {
                var el = form.querySelector('input[name="phone"]');
                if (el && !el.value) el.value = data.phone.replace(/^\\+?226\\s*/, '');
              }
              if (data.email) {
                var el = form.querySelector('input[name="email"]');
                if (el && !el.value) el.value = data.email;
              }
              if (data.quartier) {
                var el = form.querySelector('input[name="quartier"]');
                if (el && !el.value) el.value = data.quartier;
              }
            }
          })
          .catch(function() {});
      })();
    `}} />
  </Layout>
)
