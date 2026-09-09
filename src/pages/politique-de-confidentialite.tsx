import { Layout } from '../components/Layout'

export const PolitiqueDeConfidentialitePage = () => {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Politique de confidentialité - MAASGA Climatisation",
    "description": "Politique de confidentialité du site MAASGA Climatisation - Expert en climatisation Ã  Ouagadougou, Burkina Faso.",
    "isPartOf": {
      "@type": "WebSite",
      "name": "MAASGA Climatisation",
      "url": "https://maasga-website.pages.dev"
    }
  })

  return (
    <Layout title="Politique de confidentialité - MAASGA Climatisation" activePage="politique-de-confidentialite" canonicalPath="/politique-de-confidentialite" description="Consultez notre politique de confidentialité." jsonLd={jsonLd}>

      {/* Hero */}
      <section class="gradient-hero py-20 text-white relative overflow-hidden">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="inline-flex items-center space-x-2 rounded-full px-4 py-2 text-sm mb-6" style="background-color:rgba(241,245,249,0.15); border-color:rgba(226,232,240,0.2);">
            <i class="fas fa-shield-alt text-ice-300"></i>
            <span>Politique de confidentialité</span>
          </div>
          <h1 class="text-5xl font-bold mb-6">Politique de confidentialité</h1>
          <p class="text-xl text-blue-100/90 leading-relaxed max-w-2xl">
            Engagement de MAASGA Climatisation concernant la protection de vos données personnelles
          </p>
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="space-y-8 reveal">

          {/* Introduction */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Introduction</h2>
            <p class="text-white mb-4">
              MAASGA Climatisation s'engage Ã  protéger la vie privée de ses utilisateurs. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons les informations personnelles lorsque vous utilisez notre site maasga-website.pages.dev.
            </p>
            <p class="text-white">
              En accédant ou en utilisant notre site, vous acceptez les pratiques décrites dans cette politique.
            </p>
          </section>

          {/* Informations collectées */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Informations que nous collectons</h2>
            <p class="text-white mb-2">
              Nous pouvons collecter les types d'informations suivants :
            </p>
            <ul class="list-disc list-inside text-white space-y-2">
              <li>Informations d'identification : nom, adresse email, numéro de téléphone, adresse postale.</li>
              <li>Informations de connexion : adresse IP, type de navigateur, pages visitées.</li>
              <li>Informations de formulaire : données saisies dans nos formulaires de contact, de demande de devis ou de prise de rendez-vous.</li>
            </ul>
          </section>

          {/* Utilisation des informations */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Utilisation de vos informations</h2>
            <p class="text-white mb-4">
              Nous utilisons les informations que nous collectons pour :
            </p>
            <ul class="list-disc list-inside text-white space-y-2">
              <li>Répondre Ã  vos demandes de contact, de devis ou de rendez-vous.</li>
              <li>Améliorer notre site et nos services.</li>
              <li>Vous envoyer des informations sur nos offres et promotions (si vous y avez consenti).</li>
              <li>Respecter nos obligations légales et réglementaires.</li>
            </ul>
          </section>

          {/* Partage des informations */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Partage de vos informations</h2>
            <p class="text-white mb-4">
              Nous ne vendons, n'échangeons ni ne louons vos informations personnelles Ã  des tiers. Nous pouvons toutefois partager vos informations avec :
            </p>
            <ul class="list-disc list-inside text-white space-y-2">
              <li>Nos prestataires de services (hébergement, maintenance technique) qui ont besoin d'accéder Ã  vos informations pour nous fournir leurs services.</li>
              <li>Les autorités légales lorsque la loi l'exige.</li>
            </ul>
            <p class="text-white mt-4">
              Nous exigeons de ces tiers qu'ils protègent vos informations conformément Ã  cette politique de confidentialité et qu'ils ne les utilisent pas Ã  d'autres fins.
            </p>
          </section>

          {/* Sécurité */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Sécurité de vos informations</h2>
            <p class="text-white mb-4">
              Nous mettons en Å“uvre des mesures de sécurité appropriées pour protéger contre la perte, l'utilisation abusive, l'altération et la destruction des informations sous notre contrôle. Toutefois, aucune méthode de transmission sur Internet ou de stockage électronique n'est totalement sécurisée.
            </p>
            <p class="text-white">
              Nous ne pouvons donc garantir une sécurité absolue. Si vous avez des raisons de croire que votre interaction avec nous n'est plus sécurisée, veuillez nous en informer immédiatement en nous contactant Ã  maasgabf@gmail.com.
            </p>
          </section>

          {/* Cookies et technologies similaires */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Cookies et technologies similaires</h2>
            <p class="text-white mb-4">
              Notre site utilise des cookies et des technologies similaires pour distinguer vous des autres utilisateurs de notre site. Cela nous aide Ã  vous offrir une bonne expérience lorsque vous naviguez sur notre site et nous permet également d'améliorer notre site.
            </p>
            <p class="text-white">
              Vous pouvez configurer votre navigateur pour refuser tous les cookies ou pour être averti lorsqu'un cookie est envoyé. Toutefois, si vous n'acceptez pas les cookies, certaines parties de notre site peuvent ne pas fonctionner correctement.
            </p>
          </section>

          {/* Liens vers d'autres sites */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Liens vers d'autres sites</h2>
            <p class="text-white mb-4">
              Notre site peut contenir des liens vers d'autres sites qui ne sont pas exploités par nous. Si vous cliquez sur un lien tiers, vous serez dirigé vers le site de ce tiers. Nous vous conseillons fortement de consulter la politique de confidentialité de chaque site que vous visitez.
            </p>
            <p class="text-white">
              Nous n'avons aucun contrôle sur le contenu, les politiques de confidentialité ou les pratiques des sites ou services tiers, et n'assumons aucune responsabilité Ã  cet égard.
            </p>
          </section>

          {/* Accès, modification et suppression */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Vos droits</h2>
            <p class="text-white mb-4">
              Conformément Ã  la loi burkinabé sur la protection des données personnelles, vous disposez des droits suivants concernant vos informations personnelles :
            </p>
            <ul class="list-disc list-inside text-white space-y-2">
              <li>Droit d'accès : vous pouvez demander une copie de vos informations personnelles.</li>
              <li>Droit de rectification : vous pouvez demander la correction de vos informations personnelles si elles sont inexactes.</li>
              <li>Droit Ã  l'effacement : vous pouvez demander la suppression de vos informations personnelles dans certaines circonstances.</li>
              <li>Droit de restriction : vous pouvez demander la limitation de l'utilisation de vos informations personnelles.</li>
              <li>Droit d'opposition : vous pouvez vous opposer au traitement de vos informations personnelles.</li>
              <li>Droit Ã  la portabilité : vous pouvez demander la transmission de vos informations personnelles Ã  un autre responsable de traitement.</li>
            </ul>
            <p class="text-white mt-4">
              Pour exercer ces droits, veuillez nous contacter Ã  maasgabf@gmail.com.
            </p>
          </section>

          {/* Modifications de la politique */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Modifications de cette politique de confidentialité</h2>
            <p class="text-white mb-4">
              Nous pouvons mettre Ã  jour cette politique de confidentialité périodiquement. Nous vous informerons de toute modification en publiant la nouvelle politique sur cette page.
            </p>
            <p class="text-white">
              Nous vous conseillons de consulter régulièrement cette page pour prendre connaissance des éventuelles modifications.
            </p>
          </section>

          {/* Contact */}
          <section class="glass-card rounded-2xl p-4 sm:p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Contactez-nous</h2>
            <p class="text-white mb-4">
              Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter :
            </p>
            <p class="text-white font-semibold mb-2">
              MAASGA Climatisation
            </p>
            <p class="text-white">
              Email : maasgabf@gmail.com<br />
              Téléphone : +226 55 99 64 18
            </p>
          </section>

        </div>
      </div>

    </Layout>
  )
}
