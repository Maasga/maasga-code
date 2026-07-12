import { Layout } from '../components/Layout'

export const AvisPage = ({ success, error, approvedReviews = [] }: { success?: boolean; error?: string; approvedReviews?: any[] }) => {
  const avgNote = approvedReviews.length > 0
    ? (approvedReviews.reduce((s, r) => s + r.note, 0) / approvedReviews.length).toFixed(1)
    : '0'
  const hasReviews = approvedReviews.length > 0

  const noteCount = [5, 4, 3, 2, 1].map(n => ({
    note: n,
    count: approvedReviews.filter(r => r.note === n).length,
    pct: approvedReviews.length > 0 ? Math.round(approvedReviews.filter(r => r.note === n).length / approvedReviews.length * 100) : 0
  }))

  const jsonLdAvis = approvedReviews.length > 0 ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "MAASGA Climatisation",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgNote,
      "reviewCount": String(approvedReviews.length),
      "bestRating": "5",
      "worstRating": "1"
    }
  }) : undefined

  return (
    <Layout title="Avis Clients MAASGA - Climatisation Ouagadougou" activePage="avis" canonicalPath="/avis" description={approvedReviews.length > 0 ? `Avis clients MAASGA — Témoignages vérifiés sur nos installations climatisation à Ouagadougou. Note moyenne ${avgNote}/5.` : 'Avis clients MAASGA — Découvrez les témoignages de nos clients en climatisation à Ouagadougou.'} jsonLd={jsonLdAvis}>

      {/* Hero */}
      <section class="gradient-hero py-16 text-white text-center relative overflow-hidden">
        <div class="max-w-4xl mx-auto px-4 relative z-10">
          <div class="inline-flex items-center space-x-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-sm mb-4">
            <i class="fas fa-star text-yellow-400"></i>
            <span>Avis vérifiés · Clients réels</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-4">Avis de nos clients</h1>
          <p class="text-blue-100/90 text-lg max-w-xl mx-auto">
            La satisfaction de nos clients est notre priorité. Découvrez leurs témoignages sur nos services.
          </p>
          {/* Note globale */}
          {hasReviews ? (
          <div class="mt-8 inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-4">
            <div class="text-5xl font-bold text-yellow-400">{avgNote}</div>
            <div>
              <div class="flex space-x-0.5 mb-1">
                {[1,2,3,4,5].map(s => (
                  <i class={`fas fa-star text-xl ${s <= parseFloat(avgNote as string) ? 'text-yellow-400' : 'text-white/30'}`}></i>
                ))}
              </div>
              <div class="text-sm text-blue-200">{approvedReviews.length} avis vérifiés</div>
            </div>
          </div>
          ) : (
          <div class="mt-8 inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-4">
            <i class="fas fa-comments text-2xl text-blue-200/60"></i>
            <span class="text-blue-200 text-sm">Aucun avis pour le moment — soyez le premier !</span>
          </div>
          )}
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Erreur soumission */}
        {error && (
          <div class="mb-8 rounded-2xl p-5 flex items-center space-x-4" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3);">
            <i class="fas fa-exclamation-circle text-red-400 text-2xl flex-shrink-0"></i>
            <p class="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Succès soumission */}
        {success && (
          <div class="mb-8 rounded-2xl rounded-2xl p-5 flex items-center space-x-4">
            <i class="fas fa-check-circle text-green-600 text-2xl flex-shrink-0"></i>
            <div>
              <p class="font-bold text-green-300">Merci pour votre avis !</p>
              <p class="text-green-400 text-sm">Il sera publié après validation par notre équipe sous 24h.</p>
            </div>
          </div>
        )}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ===== LISTE AVIS ===== */}
          <div class="lg:col-span-2">
            <h2 class="text-xl font-bold text-white mb-6">Tous les avis ({approvedReviews.length})</h2>
            <div class="space-y-5 reveal">
              {approvedReviews.map(r => (
                <div data-tilt class="glass-card rounded-2xl p-6 transition-all">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-ice-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div class="font-semibold text-white">{r.name}</div>
                        <div class="text-xs" style="color:#94a3b8;">{r.service}</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="flex space-x-0.5 justify-end mb-1">
                        {[1,2,3,4,5].map(s => (
                          <i class={`fas fa-star text-sm ${s <= r.note ? 'star-filled' : 'opacity-30'}`}></i>
                        ))}
                      </div>
                      <div class="text-xs" style="color:#94a3b8;">{r.date}</div>
                    </div>
                  </div>
                  <p class="text-sm text-gray-300 leading-relaxed italic">"{r.comment}"</p>
                  <div class="mt-3 flex items-center space-x-2">
                    <i class="fas fa-check-circle text-blue-500 text-xs"></i>
                    <span class="text-xs text-blue-500 font-medium">Avis vérifié</span>
                  </div>
                  <div class="tilt-shine" aria-hidden="true"></div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== SIDEBAR ===== */}
          <div class="space-y-6">
            {/* Distribution notes */}
            <div data-tilt class="glass-card rounded-2xl p-6 reveal">
              <h3 class="font-bold text-white mb-5">Distribution des notes</h3>
              <div class="space-y-3">
                {noteCount.map(n => (
                  <div class="flex items-center space-x-3">
                    <div class="flex space-x-0.5 w-20">
                      {[1,2,3,4,5].map(s => (
                        <i class={`fas fa-star text-xs ${s <= n.note ? 'star-filled' : 'opacity-30'}`}></i>
                      ))}
                    </div>
                    <div class="flex-1 rounded-full h-2" style="background:rgba(255,255,255,0.07);">
                      <div class="bg-yellow-400 h-2 rounded-full transition-all" style={`width: ${n.pct}%`}></div>
                    </div>
                    <span class="text-xs w-8 text-right" style="color:#94a3b8;">{n.count}</span>
                  </div>
                ))}
              </div>
              <div class="tilt-shine" aria-hidden="true"></div>
            </div>

            {/* Formulaire avis */}
            <div class="glass-card rounded-2xl p-6 reveal">
              <h3 class="font-bold text-white mb-4 flex items-center space-x-2">
                <i class="fas fa-pen text-cyan-400"></i>
                <span>Laisser un avis</span>
              </h3>
              <p class="text-xs mb-5" style="color:#94a3b8;">Partagez votre expérience avec MAASGA. Votre avis sera publié après modération.</p>

              <form method="post" action="/api/avis" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold mb-2" style="color:#8ba3c0;">Votre note</label>
                  <div class="flex space-x-2" id="star-rating">
                    {[1,2,3,4,5].map(n => (
                      <button type="button" onclick={`rateUs(${n})`} class="text-2xl star-btn hover:scale-110 transition-transform" data-rating={n}>
                        <i class="far fa-star text-gray-300" id={`star-${n}`}></i>
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="note" id="note-input" value="5" />
                </div>

                <div>
                  <label class="block text-xs font-semibold mb-2" style="color:#8ba3c0;">Votre nom</label>
                  <input type="text" name="name" required placeholder="Prénom ou nom"
                    autocomplete="name" class="input-field w-full rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>

                <div>
                  <label class="block text-xs font-semibold mb-2" style="color:#8ba3c0;">Service utilisé</label>
                  <select name="service" class="input-field w-full rounded-xl px-3 py-2.5 text-sm text-white">
                    <option value="Installation climatiseur">Installation climatiseur</option>
                    <option value="Maintenance trimestrielle">Maintenance trimestrielle</option>
                    <option value="Devis technique">Devis technique</option>
                    <option value="SAV / Dépannage">SAV / Dépannage</option>
                    <option value="Achat climatiseur">Achat climatiseur</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold mb-2" style="color:#8ba3c0;">Votre commentaire</label>
                  <textarea name="comment" required rows={4} placeholder="Décrivez votre expérience avec MAASGA..."
                    class="input-field w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none"></textarea>
                </div>

                <button type="submit" class="w-full btn-primary text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-sm">
                  <i class="fas fa-paper-plane"></i>
                  <span>Soumettre mon avis</span>
                </button>
              </form>
            </div>

            {/* CTA */}
            <div class="bg-gradient-to-br from-primary-700 to-ice-600 text-white rounded-2xl p-6 text-center">
              <i class="fas fa-snowflake text-3xl mb-3 opacity-80"></i>
              <h4 class="font-bold text-lg mb-2">Devenez un client satisfait</h4>
              <p class="text-blue-100/90 text-sm mb-4">Rejoignez nos 100+ clients à Ouagadougou</p>
              <a href="/rendez-vous" class="bg-white text-primary-700 font-bold px-5 py-2.5 rounded-xl inline-flex items-center space-x-2 text-sm hover:bg-blue-50 transition-colors">
                <i class="fas fa-calendar"></i>
                <span>Prendre RDV</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
        let currentRating = 5;
        function rateUs(rating) {
          currentRating = rating;
          document.getElementById('note-input').value = rating;
          for(let i = 1; i <= 5; i++) {
            const star = document.getElementById('star-' + i);
            if(i <= rating) {
              star.className = 'fas fa-star text-yellow-400';
            } else {
              star.className = 'far fa-star text-gray-300';
            }
          }
        }
        rateUs(5);
        window.rateUs = rateUs;
        })();
      `}} />
    </Layout>
  )
}
