import { Layout } from '../components/Layout'

export const MentionsLegalesPage = () => {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Mentions légales - MAASGA Climatisation",
    "description": "Mentions légales du site MAASGA Climatisation - Expert en climatisation à Ouagadougou, Burkina Faso.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "MAASGA Climatisation",
      "url": "https://maasga-website.pages.dev"
    }
  })

  return (
    <Layout title="Mentions légales - MAASGA Climatisation" activePage="mentions-legales" canonicalPath="/mentions-legales" description="Consultez les mentions légales du site MAASGA Climatisation." jsonLd={jsonLd}>

      {/* Hero */}
      <section class="gradient-hero py-20 text-white relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="inline-flex items-center space-x-2 rounded-full px-4 py-2 text-sm mb-6" style="background-color:rgba(241,245,249,0.15); border-color:rgba(226,232,240,0.2);">
            <i class="fas fa-gavel text-ice-300"></i>
            <span>Mentions légales</span>
          </div>
          <h1 class="text-5xl font-bold mb-6">Mentions légales</h1>
          <p class="text-xl text-blue-100/90 leading-relaxed max-w-2xl">
            Informations légales concernant l'exploitation du site maasga-website.pages.dev
          </p>
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="space-y-8 reveal">

          {/* Éditeur du site */}
          <section class="glass-card rounded-2xl p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Éditeur du site</h2>
            <p class="text-white mb-4">
              Le site maasga-website.pages.dev est édité par :
            </p>
            <p class="text-white font-semibold mb-2">
              MAASGA Climatisation
            </p>
            <p class="text-white">
              Siège social : Ouagadougou, Burkina Faso<br />
              Téléphone : +226 55 99 64 18<br />
              Email : maasgabf@gmail.com
            </p>
          </section>

          {/* Hébergement */}
          <section class="glass-card rounded-2xl p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Hébergement</h2>
            <p class="text-white mb-4">
              Le site est hébergé par :
            </p>
            <p class="text-white font-semibold mb-2">
              Cloudflare Pages
            </p>
            <p class="text-white">
              Adresse : Cloudflare, Inc.<br />
              100 Townsend Street, San Francisco, CA 94107, États-Unis
            </p>
          </section>

          {/* Propriété intellectuelle */}
          <section class="glass-card rounded-2xl p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Propriété intellectuelle</h2>
            <p class="text-white mb-4">
              L'ensemble du site maasga-website.pages.dev relève de la législation burkinabé et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables, les représentations iconographiques et photographiques.
            </p>
            <p class="text-white">
              La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
            </p>
          </section>

          {/* Données personnelles */}
          <section class="glass-card rounded-2xl p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Données personnelles</h2>
            <p class="text-white mb-4">
              MAASGA Climatisation s'engage à respecter la confidentialité des données personnelles collectées sur le site. Aucune information personnelle n'est collectée à votre insu, ni cédée à des tiers, ni utilisée à des fins non prévues.
            </p>
            <p class="text-white">
              Conformément à la loi burkinabé sur la protection des données personnelles, vous disposez d'un droit d'accès, de modification, de rectification et de suppression des données vous concernant. Vous pouvez exercer ce droit en nous contactant par email à maasgabf@gmail.com.
            </p>
          </section>

          {/* Cookies */}
          <section class="glass-card rounded-2xl p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Cookies</h2>
            <p class="text-white mb-4">
              Le site maasga-website.pages.dev peut être amené à vous demander l'acceptation des cookies pour des besoins de statistiques et d'affichage. Un cookie est une information déposée sur votre disque dur par le serveur du site que vous visitez. Il contient plusieurs données qui sont stockées sur votre ordinateur dans un simple fichier texte auquel un serveur accède pour lire et enregistrer des informations.
            </p>
            <p class="text-white">
              Vous avez la possibilité de supprimer les cookies installés lors de votre visite sur le site. Pour cela, vous devez vous référer à l'aide de votre navigateur web pour connaître la procédure à suivre.
            </p>
          </section>

          {/* Responsabilité */}
          <section class="glass-card rounded-2xl p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Responsabilité</h2>
            <p class="text-white mb-4">
              MAASGA Climatisation ne pourra être tenue responsable des dommages directs et indirects causés au matériel de l'utilisateur lors de l'accès au site maasga-website.pages.dev, et résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications indiquées, soit de l'apparition d'un bogue ou d'une incompatibilité.
            </p>
            <p class="text-white">
              MAASGA Climatisation ne pourra également être tenue responsable des dommages indirects (tels par exemple qu'une perte de marché ou perte d'une chance) consécutifs à l'utilisation du site maasga-website.pages.dev.
            </p>
          </section>

          {/* Loi applicable */}
          <section class="glass-card rounded-2xl p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Loi applicable et juridiction compétente</h2>
            <p class="text-white mb-4">
              Tout litige en relation avec l'utilisation du site maasga-website.pages.dev est soumis au droit burkinabé. En dehors des cas où la loi ne le permet pas, il est fait attribution exclusive de juridiction aux tribunaux compétents de Ouagadougou.
            </p>
          </section>

        </div>
      </div>

    </Layout>
  )
}