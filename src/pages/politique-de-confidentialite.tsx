import { Layout } from '../components/Layout'

export const PolitiqueDeConfidentialitePage = () => {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Politique de confidentialitÃ© - MAASGA Climatisation",
    "description": "Politique de confidentialitÃ© du site MAASGA Climatisation - Expert en climatisation Ã  Ouagadougou, Burkina Faso.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "MAASGA Climatisation",
      "url": "https://maasga-website.pages.dev"
    }
  })

  return (
    <Layout title="Politique de confidentialitÃ© - MAASGA Climatisation" activePage="politique-de-confidentialite" canonicalPath="/politique-de-confidentialite" description="Consultez notre politique de confidentialitÃ©." jsonLd={jsonLd}>

      {/* Hero */}
      <section class="gradient-hero py-20 text-white relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="inline-flex items-center space-x-2 rounded-full px-4 py-2 text-sm mb-6" style="background-color:rgba(241,245,249,0.15); border-color:rgba(226,232,240,0.2);">
            <i class="fas fa-shield-alt text-ice-300"></i>
            <span>Politique de confidentialitÃ©</span>
          </div>
          <h1 class="text-5xl font-bold mb-6">Politique de confidentialitÃ©</h1>
          <p class="text-xl text-blue-100/90 leading-relaxed max-w-2xl">
            Engagement de MAASGA Climatisation concernant la protection de vos donnÃ©es personnelles
          </p>
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="space-y-8 reveal">

          {/* Introduction */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Introduction</h2>
            <p class="text-white mb-4">
              MAASGA Climatisation s'engage Ã  protÃ©ger la vie privÃ©e de ses utilisateurs. Cette politique de confidentialitÃ© explique comment nous collectons, utilisons, divulguons et protÃ©geons les informations personnelles lorsque vous utilisez notre site maasga-website.pages.dev.
            </p>
            <p class="text-white">
              En accÃ©dant ou en utilisant notre site, vous acceptez les pratiques dÃ©crites dans cette politique.
            </p>
          </section>

          {/* Informations collectÃ©es */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Informations que nous collectons</h2>
            <p class="text-white mb-2">
              Nous pouvons collecter les types d'informations suivants :
            </p>
            <ul class="list-disc list-inside text-white space-y-2">
              <li>Informations d'identification : nom, adresse email, numÃ©ro de tÃ©lÃ©phone, adresse postale.</li>
              <li>Informations de connexion : adresse IP, type de navigateur, pages visitÃ©es.</li>
              <li>Informations de formulaire : donnÃ©es saisies dans nos formulaires de contact, de demande de devis ou de prise de rendez-vous.</li>
            </ul>
          </section>

          {/* Utilisation des informations */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Utilisation de vos informations</h2>
            <p class="text-white mb-4">
              Nous utilisons les informations que nous collectons pour :
            </p>
            <ul class="list-disc list-inside text-white space-y-2">
              <li>RÃ©pondre Ã  vos demandes de contact, de devis ou de rendez-vous.</li>
              <li>AmÃ©liorer notre site et nos services.</li>
              <li>Vous envoyer des informations sur nos offres et promotions (si vous y avez consenti).</li>
              <li>Respecter nos obligations lÃ©gales et rÃ©glementaires.</li>
            </ul>
          </section>

          {/* Partage des informations */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Partage de vos informations</h2>
            <p class="text-white mb-4">
              Nous ne vendons, n'Ã©changeons ni ne louons vos informations personnelles Ã  des tiers. Nous pouvons toutefois partager vos informations avec :
            </p>
            <ul class="list-disc list-inside text-white space-y-2">
              <li>Nos prestataires de services (hÃ©bergement, maintenance technique) qui ont besoin d'accÃ©der Ã  vos informations pour nous fournir leurs services.</li>
              <li>Les autoritÃ©s lÃ©gales lorsque la loi l'exige.</li>
            </ul>
            <p class="text-white mt-4">
              Nous exigeons de ces tiers qu'ils protÃ¨gent vos informations conformÃ©ment Ã  cette politique de confidentialitÃ© et qu'ils ne les utilisent pas Ã  d'autres fins.
            </p>
          </section>

          {/* SÃ©curitÃ© */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">SÃ©curitÃ© de vos informations</h2>
            <p class="text-white mb-4">
              Nous mettons en Å“uvre des mesures de sÃ©curitÃ© appropriÃ©es pour protÃ©ger contre la perte, l'utilisation abusive, l'altÃ©ration et la destruction des informations sous notre contrÃ´le. Toutefois, aucune mÃ©thode de transmission sur Internet ou de stockage Ã©lectronique n'est totalement sÃ©curisÃ©e.
            </p>
            <p class="text-white">
              Nous ne pouvons donc garantir une sÃ©curitÃ© absolue. Si vous avez des raisons de croire que votre interaction avec nous n'est plus sÃ©curisÃ©e, veuillez nous en informer immÃ©diatement en nous contactant Ã  maasgabf@gmail.com.
            </p>
          </section>

          {/* Cookies et technologies similaires */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Cookies et technologies similaires</h2>
            <p class="text-white mb-4">
              Notre site utilise des cookies et des technologies similaires pour distinguer vous des autres utilisateurs de notre site. Cela nous aide Ã  vous offrir une bonne expÃ©rience lorsque vous naviguez sur notre site et nous permet Ã©galement d'amÃ©liorer notre site.
            </p>
            <p class="text-white">
              Vous pouvez configurer votre navigateur pour refuser tous les cookies ou pour Ãªtre averti lorsqu'un cookie est envoyÃ©. Toutefois, si vous n'acceptez pas les cookies, certaines parties de notre site peuvent ne pas fonctionner correctement.
            </p>
          </section>

          {/* Liens vers d'autres sites */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Liens vers d'autres sites</h2>
            <p class="text-white mb-4">
              Notre site peut contenir des liens vers d'autres sites qui ne sont pas exploitÃ©s par nous. Si vous cliquez sur un lien tiers, vous serez dirigÃ© vers le site de ce tiers. Nous vous conseillons fortement de consulter la politique de confidentialitÃ© de chaque site que vous visitez.
            </p>
            <p class="text-white">
              Nous n'avons aucun contrÃ´le sur le contenu, les politiques de confidentialitÃ© ou les pratiques des sites ou services tiers, et n'assumons aucune responsabilitÃ© Ã  cet Ã©gard.
            </p>
          </section>

          {/* AccÃ¨s, modification et suppression */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Vos droits</h2>
            <p class="text-white mb-4">
              ConformÃ©ment Ã  la loi burkinabÃ© sur la protection des donnÃ©es personnelles, vous disposez des droits suivants concernant vos informations personnelles :
            </p>
            <ul class="list-disc list-inside text-white space-y-2">
              <li>Droit d'accÃ¨s : vous pouvez demander une copie de vos informations personnelles.</li>
              <li>Droit de rectification : vous pouvez demander la correction de vos informations personnelles si elles sont inexactes.</li>
              <li>Droit Ã  l'effacement : vous pouvez demander la suppression de vos informations personnelles dans certaines circonstances.</li>
              <li>Droit de restriction : vous pouvez demander la limitation de l'utilisation de vos informations personnelles.</li>
              <li>Droit d'opposition : vous pouvez vous opposer au traitement de vos informations personnelles.</li>
              <li>Droit Ã  la portabilitÃ© : vous pouvez demander la transmission de vos informations personnelles Ã  un autre responsable de traitement.</li>
            </ul>
            <p class="text-white mt-4">
              Pour exercer ces droits, veuillez nous contacter Ã  maasgabf@gmail.com.
            </p>
          </section>

          {/* Modifications de la politique */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Modifications de cette politique de confidentialitÃ©</h2>
            <p class="text-white mb-4">
              Nous pouvons mettre Ã  jour cette politique de confidentialitÃ© pÃ©riodiquement. Nous vous informerons de toute modification en publiant la nouvelle politique sur cette page.
            </p>
            <p class="text-white">
              Nous vous conseillons de consulter rÃ©guliÃ¨rement cette page pour prendre connaissance des Ã©ventuelles modifications.
            </p>
          </section>

          {/* Contact */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Contactez-nous</h2>
            <p class="text-white mb-4">
              Si vous avez des questions concernant cette politique de confidentialitÃ©, veuillez nous contacter :
            </p>
            <p class="text-white font-semibold mb-2">
              MAASGA Climatisation
            </p>
            <p class="text-white">
              Email : maasgabf@gmail.com<br />
              TÃ©lÃ©phone : +226 55 99 64 18
            </p>
          </section>

        </div>
      </div>

    </Layout>
  )
}
