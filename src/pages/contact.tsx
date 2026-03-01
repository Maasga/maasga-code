import { Layout } from '../components/Layout'

export const ContactPage = ({ success, error }: { success?: boolean; error?: string }) => {
  return (
    <Layout title="Contact MAASGA - Climatisation Ouagadougou" activePage="contact" canonicalPath="/contact" description="Contactez MAASGA Climatisation — Téléphone, WhatsApp, email ou formulaire. Réponse rapide garantie. Devis gratuit à Ouagadougou.">

      {/* Hero */}
      <section class="gradient-hero py-16 text-white text-center relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none">
          <i class="fas fa-phone-alt absolute top-8 right-10 text-white/10 text-5xl"></i>
          <i class="fas fa-envelope absolute bottom-10 left-10 text-white/8 text-4xl"></i>
        </div>
        <div class="max-w-4xl mx-auto px-4 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-sm mb-4">
            <i class="fas fa-headset text-ice-300"></i>
            <span>Disponible 7j/7 · Réponse rapide</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-4">Contactez-nous</h1>
          <p class="text-blue-100/90 text-lg max-w-xl mx-auto">
            Une question ? Un projet ? Notre équipe est à votre disposition pour vous accompagner.
          </p>
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Infos de contact */}
          <div class="space-y-6 reveal">

            <div class="glass-card rounded-2xl p-6 hover-lift">
              <h3 class="font-bold text-white text-lg mb-5 flex items-center space-x-2">
                <i class="fas fa-info-circle" style="color:#38bdf8;"></i>
                <span>Nos coordonnées</span>
              </h3>
              <div class="space-y-4">
                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.2);">
                    <i class="fas fa-phone" style="color:#34d399;"></i>
                  </div>
                  <div>
                    <div class="text-xs font-medium mb-1" style="color:#64748b;">Téléphone</div>
                    <a href="tel:+22655996418" class="font-semibold text-white hover:text-cyan-400 transition-colors">+226 55 99 64 18</a>
                    <div class="text-xs mt-0.5" style="color:#64748b;">WhatsApp disponible</div>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2);">
                    <i class="fas fa-envelope" style="color:#38bdf8;"></i>
                  </div>
                  <div>
                    <div class="text-xs font-medium mb-1" style="color:#64748b;">Email</div>
                    <a href="mailto:contact@maasga.bf" class="font-semibold text-white hover:text-cyan-400 transition-colors text-sm">contact@maasga.bf</a>
                    <div class="text-xs mt-0.5" style="color:#64748b;">Réponse sous 2h</div>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.2);">
                    <i class="fas fa-map-marker-alt" style="color:#f87171;"></i>
                  </div>
                  <div>
                    <div class="text-xs font-medium mb-1" style="color:#64748b;">Adresse</div>
                    <div class="font-semibold text-white text-sm">Ouagadougou</div>
                    <div class="text-xs mt-0.5" style="color:#64748b;">Burkina Faso</div>
                  </div>
                </div>

                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(167,139,250,0.1); border:1px solid rgba(167,139,250,0.2);">
                    <i class="fas fa-clock" style="color:#a78bfa;"></i>
                  </div>
                  <div>
                    <div class="text-xs font-medium mb-1" style="color:#64748b;">Horaires</div>
                    <div class="text-sm" style="color:#7a9cc4;">
                      <div>Lun – Sam : 7h30 – 18h30</div>
                      <div class="text-xs mt-0.5" style="color:#64748b;">Urgences 7j/7</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action rapide WhatsApp */}
            <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA%2C%20je%20souhaite%20avoir%20un%20renseignement%20sur%20la%20climatisation." target="_blank"
              class="block glass-card rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 hover-lift">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <i class="fab fa-whatsapp text-white text-2xl"></i>
                </div>
                <div>
                  <div class="font-bold text-white">Écrire sur WhatsApp</div>
                  <div class="text-sm" style="color:#8ba3c0;">Réponse rapide garantie</div>
                </div>
                <i class="fas fa-arrow-right ml-auto" style="color:#64748b;"></i>
              </div>
            </a>

            {/* Prendre RDV */}
            <a href="/rendez-vous"
              class="block btn-primary rounded-2xl p-5 text-white hover:-translate-y-1 transition-all duration-300">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-calendar-check text-white text-xl"></i>
                </div>
                <div>
                  <div class="font-bold">Prendre rendez-vous</div>
                  <div class="text-sm text-blue-100">Visite technique gratuite</div>
                </div>
                <i class="fas fa-arrow-right text-white/70 ml-auto"></i>
              </div>
            </a>

            {/* Zones d'intervention */}
            <div class="glass-card rounded-2xl p-6 hover-lift">
              <h4 class="font-bold text-white mb-3 flex items-center space-x-2">
                <i class="fas fa-map" style="color:#38bdf8;"></i>
                <span>Zones d'intervention</span>
              </h4>
              <div class="flex flex-wrap gap-2">
                {['Pissy', 'Gounghin', 'Dassasgho', 'Wemtenga', 'Karpala', 'Samandin', 'Koulouba', 'Tanghin', 'Boulmiougou', 'Sig-Noghin'].map(z => (
                  <span class="text-xs px-2.5 py-1 rounded-full font-medium" style="background:rgba(56,189,248,0.1); color:#38bdf8; border:1px solid rgba(56,189,248,0.2);">{z}</span>
                ))}
                <span class="text-xs px-2 py-1" style="color:#64748b;">+ environs</span>
              </div>
            </div>
          </div>

          {/* Formulaire de contact */}
          <div class="lg:col-span-2">
            {success ? (
              <div class="glass-card rounded-3xl p-10 text-center">
                <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style="background:rgba(52,211,153,0.15); border:1px solid rgba(52,211,153,0.3);">
                  <i class="fas fa-check text-3xl" style="color:#34d399;"></i>
                </div>
                <h3 class="text-2xl font-bold text-white mb-3">Message envoyé !</h3>
                <p class="mb-6" style="color:#8ba3c0;">Merci pour votre message. Notre équipe vous répondra dans les 2 heures suivantes.</p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="/" class="btn-primary text-white font-semibold px-6 py-3 rounded-xl inline-flex items-center space-x-2">
                    <i class="fas fa-home"></i><span>Retour à l'accueil</span>
                  </a>
                  <a href="/rendez-vous" class="btn-secondary font-semibold px-6 py-3 rounded-xl inline-flex items-center space-x-2">
                    <i class="fas fa-calendar"></i><span>Prendre RDV</span>
                  </a>
                </div>
              </div>
            ) : (
              <div class="glass-card rounded-3xl p-8 reveal">
                <h2 class="text-xl font-bold text-white mb-6 flex items-center space-x-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2);">
                    <i class="fas fa-paper-plane" style="color:#38bdf8;"></i>
                  </div>
                  <span>Envoyez-nous un message</span>
                </h2>

                {error && (
                  <div class="mb-5 rounded-xl p-3 flex items-center space-x-2 text-sm" style="background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.25); color:#f87171;">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>{error}</span>
                  </div>
                )}

                <form method="post" action="/api/contact" class="space-y-5">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label class="block text-sm font-semibold mb-2" style="color:#7a9cc4;">
                        Nom complet <span style="color:#f87171;">*</span>
                      </label>
                      <input type="text" name="name" required placeholder="Ex: Moussa Ouédraogo"
                        class="input-field w-full rounded-xl px-4 py-3" />
                    </div>
                    <div>
                      <label class="block text-sm font-semibold mb-2" style="color:#7a9cc4;">
                        Téléphone
                      </label>
                      <input type="tel" name="phone" placeholder="+226 55 99 64 18"
                        class="input-field w-full rounded-xl px-4 py-3" />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold mb-2" style="color:#7a9cc4;">Email</label>
                    <input type="email" name="email" placeholder="votre@email.com"
                      class="input-field w-full rounded-xl px-4 py-3" />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold mb-2" style="color:#7a9cc4;">Objet de votre demande</label>
                    <select name="subject" class="input-field w-full rounded-xl px-4 py-3" style="color:#f0f6ff;">
                      <option value="devis">Demande de devis</option>
                      <option value="installation">Installation climatiseur</option>
                      <option value="maintenance">Maintenance / Entretien</option>
                      <option value="depannage">Dépannage urgent</option>
                      <option value="information">Renseignement produit</option>
                      <option value="autre">Autre demande</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold mb-2" style="color:#7a9cc4;">
                      Votre message <span style="color:#f87171;">*</span>
                    </label>
                    <textarea name="message" required rows={5}
                      placeholder="Décrivez votre besoin en détail : surface de la pièce, type de climatisation souhaité, délai, etc."
                      class="input-field w-full rounded-xl px-4 py-3 resize-none"></textarea>
                  </div>

                  {/* Option urgence */}
                  <div class="rounded-xl p-4" style="background:rgba(251,191,36,0.07); border:1px solid rgba(251,191,36,0.2);">
                    <label class="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" name="urgent" value="1" class="accent-yellow-400 w-4 h-4" />
                      <div>
                        <div class="text-sm font-semibold" style="color:#fbbf24;">
                          <i class="fas fa-bolt mr-1"></i>Demande urgente
                        </div>
                        <div class="text-xs" style="color:#92794a;">Nous vous recontactons dans l'heure</div>
                      </div>
                    </label>
                  </div>

                  <button type="submit"
                    class="w-full btn-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 shadow-lg text-base">
                    <i class="fas fa-paper-plane"></i>
                    <span>Envoyer le message</span>
                    <i class="fas fa-arrow-right text-sm"></i>
                  </button>

                  <p class="text-xs text-center" style="color:#64748b;">
                    <i class="fas fa-shield-alt mr-1" style="color:#38bdf8;"></i>
                    Vos données sont confidentielles et ne seront jamais partagées.
                  </p>
                </form>
              </div>
            )}

            {/* FAQ rapide */}
            <div class="mt-8 glass-card rounded-2xl p-6 reveal">
              <h3 class="font-bold text-white mb-5 flex items-center space-x-2">
                <i class="fas fa-question-circle" style="color:#38bdf8;"></i>
                <span>Questions fréquentes</span>
              </h3>
              <div class="space-y-4" id="faq-list">
                {[
                  {
                    q: "Combien coûte la visite technique ?",
                    a: "La visite technique préalable est entièrement gratuite et sans engagement. Elle permet de dimensionner correctement votre installation."
                  },
                  {
                    q: "Quel délai pour une installation ?",
                    a: "En général 2 à 5 jours ouvrés après validation du devis. Pour les urgences, nous pouvons intervenir sous 24h."
                  },
                  {
                    q: "Proposez-vous la maintenance après installation ?",
                    a: "Oui, nous proposons un plan de maintenance trimestrielle pour garantir les performances et prolonger la durée de vie de votre climatiseur."
                  },
                  {
                    q: "Intervenez-vous dans toute la ville ?",
                    a: "Nous couvrons tous les secteurs d'Ouagadougou et les villes environnantes. Contactez-nous pour confirmer votre zone."
                  }
                ].map((item, i) => (
                  <div class="rounded-xl overflow-hidden" style="border:1px solid rgba(56,189,248,0.1);">
                    <button onclick={`toggleFaq(${i})`}
                      class="w-full flex items-center justify-between px-4 py-3 text-left transition-colors" style="hover:background:rgba(56,189,248,0.05);"
                      aria-expanded="false" aria-controls={`faq-ans-${i}`} id={`faq-btn-${i}`}>
                      <span class="text-sm font-semibold text-white">{item.q}</span>
                      <i class={`fas fa-chevron-down text-xs transition-transform`} style="color:#64748b;" id={`faq-icon-${i}`}></i>
                    </button>
                    <div class="hidden px-4 pb-4 text-sm leading-relaxed" style="color:#8ba3c0;" id={`faq-ans-${i}`} role="region" aria-labelledby={`faq-btn-${i}`}>
                      {item.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function toggleFaq(i) {
          const ans = document.getElementById('faq-ans-' + i);
          const icon = document.getElementById('faq-icon-' + i);
          const btn = document.getElementById('faq-btn-' + i);
          if (ans.classList.contains('hidden')) {
            ans.classList.remove('hidden');
            icon.style.transform = 'rotate(180deg)';
            if (btn) btn.setAttribute('aria-expanded', 'true');
          } else {
            ans.classList.add('hidden');
            icon.style.transform = '';
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        }
      `}} />
    </Layout>
  )
}
