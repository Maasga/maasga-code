import { Layout } from '../components/Layout'

export const MentionsLegalesPage = () => {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Mentions lÃ©gales - MAASGA Climatisation",
    "description": "Mentions lÃ©gales du site MAASGA Climatisation - Expert en climatisation Ã  Ouagadougou, Burkina Faso.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "MAASGA Climatisation",
      "url": "https://maasga-website.pages.dev"
    }
  })

  return (
    <Layout title="Mentions lÃ©gales - MAASGA Climatisation" activePage="mentions-legales" canonicalPath="/mentions-legales" description="Consultez les mentions lÃ©gales du site MAASGA Climatisation." jsonLd={jsonLd}>

      {/* Hero */}
      <section class="gradient-hero py-20 text-white relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="inline-flex items-center space-x-2 rounded-full px-4 py-2 text-sm mb-6" style="background-color:rgba(241,245,249,0.15); border-color:rgba(226,232,240,0.2);">
            <i class="fas fa-gavel text-ice-300"></i>
            <span>Mentions lÃ©gales</span>
          </div>
          <h1 class="text-5xl font-bold mb-6">Mentions lÃ©gales</h1>
          <p class="text-xl text-blue-100/90 leading-relaxed max-w-2xl">
            Informations lÃ©gales concernant l'exploitation du site maasga-website.pages.dev
          </p>
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="space-y-8 reveal">

          {/* Ã‰diteur du site */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Ã‰diteur du site</h2>
            <p class="text-white mb-4">
              Le site maasga-website.pages.dev est Ã©ditÃ© par :
            </p>
            <p class="text-white font-semibold mb-2">
              MAASGA Climatisation
            </p>
            <p class="text-white">
              SiÃ¨ge social : Ouagadougou, Burkina Faso<br />
              TÃ©lÃ©phone : +226 55 99 64 18<br />
              Email : maasgabf@gmail.com
            </p>
          </section>

          {/* HÃ©bergement */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">HÃ©bergement</h2>
            <p class="text-white mb-4">
              Le site est hÃ©bergÃ© par :
            </p>
            <p class="text-white font-semibold mb-2">
              Cloudflare Pages
            </p>
            <p class="text-white">
              Adresse : Cloudflare, Inc.<br />
              100 Townsend Street, San Francisco, CA 94107, Ã‰tats-Unis
            </p>
          </section>

          {/* PropriÃ©tÃ© intellectuelle */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">PropriÃ©tÃ© intellectuelle</h2>
            <p class="text-white mb-4">
              L'ensemble du site maasga-website.pages.dev relÃ¨ve de la lÃ©gislation burkinabÃ© et internationale sur le droit d'auteur et la propriÃ©tÃ© intellectuelle. Tous les droits de reproduction sont rÃ©servÃ©s, y compris pour les documents tÃ©lÃ©chargeables, les reprÃ©sentations iconographiques et photographiques.
            </p>
            <p class="text-white">
              La reproduction de tout ou partie de ce site sur un support Ã©lectronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
            </p>
          </section>

          {/* DonnÃ©es personnelles */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">DonnÃ©es personnelles</h2>
            <p class="text-white mb-4">
              MAASGA Climatisation s'engage Ã  respecter la confidentialitÃ© des donnÃ©es personnelles collectÃ©es sur le site. Aucune information personnelle n'est collectÃ©e Ã  votre insu, ni cÃ©dÃ©e Ã  des tiers, ni utilisÃ©e Ã  des fins non prÃ©vues.
            </p>
            <p class="text-white">
              ConformÃ©ment Ã  la loi burkinabÃ© sur la protection des donnÃ©es personnelles, vous disposez d'un droit d'accÃ¨s, de modification, de rectification et de suppression des donnÃ©es vous concernant. Vous pouvez exercer ce droit en nous contactant par email Ã  maasgabf@gmail.com.
            </p>
          </section>

          {/* Cookies */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Cookies</h2>
            <p class="text-white mb-4">
              Le site maasga-website.pages.dev peut Ãªtre amenÃ© Ã  vous demander l'acceptation des cookies pour des besoins de statistiques et d'affichage. Un cookie est une information dÃ©posÃ©e sur votre disque dur par le serveur du site que vous visitez. Il contient plusieurs donnÃ©es qui sont stockÃ©es sur votre ordinateur dans un simple fichier texte auquel un serveur accÃ¨de pour lire et enregistrer des informations.
            </p>
            <p class="text-white">
              Vous avez la possibilitÃ© de supprimer les cookies installÃ©s lors de votre visite sur le site. Pour cela, vous devez vous rÃ©fÃ©rer Ã  l'aide de votre navigateur web pour connaÃ®tre la procÃ©dure Ã  suivre.
            </p>
          </section>

          {/* ResponsabilitÃ© */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">ResponsabilitÃ©</h2>
            <p class="text-white mb-4">
              MAASGA Climatisation ne pourra Ãªtre tenue responsable des dommages directs et indirects causÃ©s au matÃ©riel de l'utilisateur lors de l'accÃ¨s au site maasga-website.pages.dev, et rÃ©sultant soit de l'utilisation d'un matÃ©riel ne rÃ©pondant pas aux spÃ©cifications indiquÃ©es, soit de l'apparition d'un bogue ou d'une incompatibilitÃ©.
            </p>
            <p class="text-white">
              MAASGA Climatisation ne pourra Ã©galement Ãªtre tenue responsable des dommages indirects (tels par exemple qu'une perte de marchÃ© ou perte d'une chance) consÃ©cutifs Ã  l'utilisation du site maasga-website.pages.dev.
            </p>
          </section>

          {/* Loi applicable */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Loi applicable et juridiction compÃ©tente</h2>
            <p class="text-white mb-4">
              Tout litige en relation avec l'utilisation du site maasga-website.pages.dev est soumis au droit burkinabÃ©. En dehors des cas oÃ¹ la loi ne le permet pas, il est fait attribution exclusive de juridiction aux tribunaux compÃ©tents de Ouagadougou.
            </p>
          </section>

        </div>
      </div>

    </Layout>
  )
}
