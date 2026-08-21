// Moteur d'import de produits depuis un tableur quelconque.
//
// Objectif : un fichier fournisseur suffit, sans reformatage. Le module ne
// suppose ni modele impose, ni en-tete en premiere ligne, ni intitules exacts.
// Il deduit la structure, puis enrichit chaque ligne (BTU, categorie, surfaces...)
// a partir de ce que le libelle contient deja.
//
// Il tourne UNIQUEMENT cote serveur : le navigateur envoie les cellules brutes et
// affiche ce que ce module renvoie. C'est volontaire — la validation etait
// auparavant dupliquee client + serveur, avec deux copies des referentiels
// vouees a diverger. Ici l'apercu montre litteralement ce qui sera ecrit.
//
// Le source est volontairement sans caractere non-ASCII dans le CODE (regex,
// litteraux) : ce depot a deja eu des .tsx reencodes en cp1252, ce qui detruit
// silencieusement une classe de caracteres Unicode. Les accents ne subsistent
// que dans les messages destines a l'admin.

import { sanitizeText } from './helpers'

// ============================================================
// TYPES
// ============================================================

export type ChampCible =
  | 'nom' | 'marque' | 'modele' | 'categorie'
  | 'puissanceBtu' | 'puissanceCv' | 'puissanceKw'
  | 'prixFcfa' | 'prixGrossisteFcfa' | 'stockInitial'
  | 'classeEnergie' | 'surfaceMin' | 'surfaceMax'
  | 'inverter' | 'disponible' | 'description' | 'mentions'
  | 'refrigerant' | 'compresseur' | 'garantie' | 'photo'

// Provenance d'une valeur, restituee a l'admin sous forme de pastille dans
// l'apercu. « deduit » = infere du libelle, « defaut » = constante de repli.
export type Origine = 'fichier' | 'deduit' | 'defaut'

export interface ChampsProduit {
  nom: string
  marque: string
  modele: string
  categorie: string
  puissanceBtu: number | null
  prixFcfa: number | null
  prixGrossisteFcfa: number | null
  stockInitial: number
  classeEnergie: string
  surfaceMin: number
  surfaceMax: number
  inverter: boolean
  disponible: boolean
  description: string
  mentions: string[]
  refrigerant: string
  compresseur: string
  garantie: string
}

export interface ProduitDerive {
  ligne: number
  champs: ChampsProduit
  origines: Partial<Record<keyof ChampsProduit, Origine>>
  alertes: string[]
  erreurs: string[]
}

export interface ColonneDetectee {
  index: number
  entete: string
  champ: ChampCible | null
  confiance: 'exacte' | 'approchee' | 'contenu' | 'aucune'
  echantillon: string[]
}

export interface ResultatAnalyse {
  indexEntete: number
  nbLignesDonnees: number
  colonnes: ColonneDetectee[]
  produits: ProduitDerive[]
  avertissements: string[]
}

// ============================================================
// REFERENTIELS — dictionnaires de RECONNAISSANCE, pas des filtres de rejet.
// Une marque absente d'ici est importee puis signalee « a verifier » : la
// production contient deja PANASONIC, que l'ancienne whitelist refusait.
// ============================================================

export const MARQUES_CONNUES = [
  'Airwell', 'LG', 'Samsung', 'Panasonic', 'Daikin', 'Midea', 'Gree', 'Hisense',
  'TCL', 'Sharp', 'Nasco', 'Mona', 'Solstar', 'Boreal', 'Roch', 'Beko', 'Haier',
  'Chigo', 'Innova', 'Westpoint', 'Super General', 'Toshiba', 'Mitsubishi',
  'Carrier', 'Fujitsu', 'Hitachi', 'Aux', 'Oscar', 'Astech', 'Telefunken', 'Zenet'
]

export const CATEGORIES = ['Mural/Split', 'Cassette', 'Gainable', 'Colonne', 'Multi-split', 'Rooftop', 'Industriel']

export const CLASSES_ENERGIE = ['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G']

// Conversion chevaux -> BTU du marche ouest-africain. La correspondance n'est pas
// lineaire et les fiches locales melangent les deux notations (« 12000 BTU
// (1.3 CV) » existe en base) : on retient donc la cle la plus proche.
export const CV_VERS_BTU: Array<[number, number]> = [
  [1, 9000], [1.5, 12000], [2, 18000], [2.5, 24000], [3, 30000], [4, 36000], [5, 48000], [6, 60000]
]

// Dimensionnement en climat chaud (~100 BTU/m2, marge Sahel). Interpole entre
// deux paliers, extrapole proportionnellement au-dela.
const SURFACES_PAR_BTU: Array<[number, number, number]> = [
  [9000, 10, 18], [12000, 15, 25], [18000, 25, 35], [24000, 35, 50],
  [30000, 50, 65], [36000, 65, 80], [48000, 80, 110], [60000, 110, 140]
]

// Bornes de vraisemblance, appliquees cote serveur quelle que soit l'UI : un POST
// forge ne doit pas pouvoir inserer un BTU a neuf chiffres.
export const BORNES = {
  btuMin: 1000, btuMax: 200000,
  prixMin: 1, prixMax: 100000000,
  stockMin: 0, stockMax: 100000,
  surfaceMin: 1, surfaceMax: 1000
}

export const MAX_LIGNES_PAR_LOT = 500
export const GARANTIE_DEFAUT = '1 an constructeur'
export const CLASSE_DEFAUT = 'A++'
export const CATEGORIE_DEFAUT = 'Mural/Split'
export const IMAGE_DEFAUT = 'AC'

// ============================================================
// NORMALISATION
// ============================================================

// Retire les diacritiques par comparaison de points de code plutot qu'avec une
// classe de caracteres : les diacritiques combinants sont invisibles dans un
// editeur et se perdraient au moindre reencodage du fichier.
function sansAccents(s: string): string {
  let sortie = ''
  for (const caractere of s.normalize('NFD')) {
    const code = caractere.codePointAt(0) as number
    // Bloc Unicode « Combining Diacritical Marks » : U+0300 a U+036F.
    if (code >= 768 && code <= 879) continue
    sortie += caractere
  }
  return sortie
}

// Cle de comparaison d'un intitule de colonne : casse, accents, ponctuation,
// asterisques de champ obligatoire et unites entre parentheses sont ecartes.
export function normaliserEntete(valeur: unknown): string {
  const s = valeur == null ? '' : String(valeur)
  return sansAccents(s)
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[*:_\-\/.,;'"!?#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Cle de rapprochement pour la detection de doublons.
export function normaliserTexte(valeur: unknown): string {
  const s = valeur == null ? '' : String(valeur)
  return sansAccents(s).toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Cle d'unicite d'un produit. Aucune contrainte UNIQUE n'existe en base : le
// rapprochement se fait donc en memoire, a partir de cette cle.
export function cleProduit(marque: unknown, btu: unknown, modele: unknown, nom: unknown): string {
  const identifiant = normaliserTexte(modele) || normaliserTexte(nom)
  return normaliserTexte(marque) + '|' + String(btu == null ? '' : btu) + '|' + identifiant
}

// ============================================================
// DICTIONNAIRE DE SYNONYMES
// ============================================================

const SYNONYMES: Array<[ChampCible, string[]]> = [
  ['nom', ['nom', 'nom du produit', 'produit', 'designation', 'designation produit', 'libelle', 'libelle produit', 'article', 'intitule', 'description produit', 'appareil', 'materiel', 'name', 'product', 'denomination']],
  ['marque', ['marque', 'brand', 'fabricant', 'constructeur', 'marque fournisseur']],
  ['modele', ['modele', 'model', 'reference', 'ref', 'code article', 'code produit', 'sku', 'modele reference', 'reference fabricant']],
  ['categorie', ['categorie', 'category', 'type', 'type de produit', 'famille', 'gamme', 'segment', 'type appareil']],
  ['puissanceBtu', ['btu', 'btuh', 'btu h', 'puissance', 'puissance btu', 'capacite', 'capacite btu', 'frigories', 'puissance frigorifique', 'puissance froid']],
  ['puissanceCv', ['cv', 'chevaux', 'puissance cv', 'ch']],
  ['puissanceKw', ['kw', 'puissance kw', 'kilowatt', 'kilowatts']],
  ['prixFcfa', ['prix', 'prix fcfa', 'pu', 'prix unitaire', 'prix de vente', 'prix vente', 'pv', 'tarif', 'montant', 'prix ttc', 'prix public', 'prix detail', 'price', 'pvc']],
  ['prixGrossisteFcfa', ['prix grossiste', 'prix gros', 'pu gros', 'prix achat', 'prix d achat', 'pa', 'grossiste', 'prix revendeur', 'cout achat', 'prix ht']],
  ['stockInitial', ['stock', 'stock initial', 'qte', 'quantite', 'quantite en stock', 'qty', 'nombre', 'nb', 'stock dispo']],
  ['classeEnergie', ['classe energie', 'classe energetique', 'classe', 'energie', 'energy class', 'etiquette energie']],
  ['surfaceMin', ['surface min', 'surface minimale', 'superficie min', 'surface min m2']],
  ['surfaceMax', ['surface max', 'surface maximale', 'superficie max', 'surface max m2']],
  ['inverter', ['inverter', 'technologie inverter', 'technologie', 'dc inverter']],
  ['disponible', ['disponible', 'disponible a la vente', 'en vente', 'actif', 'publie', 'visible', 'statut', 'disponibilite']],
  ['description', ['description', 'descriptif', 'detail', 'details', 'commentaire', 'commentaires', 'observations', 'note', 'notes']],
  ['mentions', ['mentions', 'fonctionnalites', 'fonctions', 'caracteristiques', 'options', 'equipements', 'features', 'atouts', 'points forts']],
  ['refrigerant', ['refrigerant', 'gaz', 'gaz refrigerant', 'fluide', 'fluide frigorigene', 'type de gaz']],
  ['compresseur', ['compresseur', 'type compresseur', 'compressor', 'type de compresseur']],
  ['garantie', ['garantie', 'warranty', 'duree garantie', 'duree de garantie']],
  ['photo', ['photo', 'photos', 'image', 'images', 'lien image', 'url image', 'illustration', 'visuel', 'lien photo']]
]

// Champs que l'admin peut corriger a la main depuis l'apercu.
export const CHAMPS_CORRIGEABLES: ChampCible[] = ['nom', 'marque', 'categorie', 'puissanceBtu', 'prixFcfa', 'stockInitial']

// Libelles des champs cibles, pour le selecteur de l'ecran de correspondance.
// Exportes depuis le moteur plutot que recopies dans l'UI : la liste des champs
// reconnus a une seule definition, celle de ChampCible juste au-dessus.
export const LIBELLES_CHAMPS: Array<[ChampCible, string]> = [
  ['nom', 'Nom du produit'],
  ['marque', 'Marque'],
  ['modele', 'Modèle / référence'],
  ['categorie', 'Catégorie'],
  ['puissanceBtu', 'Puissance (BTU)'],
  ['puissanceCv', 'Puissance (CV)'],
  ['puissanceKw', 'Puissance (kW)'],
  ['prixFcfa', 'Prix de vente (FCFA)'],
  ['prixGrossisteFcfa', 'Prix grossiste (FCFA)'],
  ['stockInitial', 'Stock'],
  ['classeEnergie', 'Classe énergétique'],
  ['surfaceMin', 'Surface min (m²)'],
  ['surfaceMax', 'Surface max (m²)'],
  ['inverter', 'Inverter'],
  ['disponible', 'Disponible à la vente'],
  ['description', 'Description'],
  ['mentions', 'Mentions / fonctionnalités'],
  ['refrigerant', 'Fluide réfrigérant'],
  ['compresseur', 'Compresseur'],
  ['garantie', 'Garantie'],
  ['photo', 'Photo (ignorée à l\'import)']
]

// Modele .xlsx facultatif, genere par le navigateur. Les intitules sont choisis
// parmi les synonymes reconnus ci-dessus, donc le modele reste synchronise par
// construction — contrairement au fichier statique auquel l'ancienne UI renvoyait
// et qui n'existait pas dans le depot.
export const COLONNES_MODELE: Array<[string, string]> = [
  ['Désignation', 'Climatiseur LG Dual Cool 12000 BTU Inverter'],
  ['Marque', 'LG'],
  ['Modèle', 'S4-Q12JA3QA'],
  ['Catégorie', 'Mural/Split'],
  ['Puissance BTU', '12000'],
  ['Prix de vente', '450000'],
  ['Prix grossiste', '400000'],
  ['Quantité', '5'],
  ['Classe énergétique', 'A++'],
  ['Inverter', 'oui'],
  ['Fluide réfrigérant', 'R32'],
  ['Compresseur', 'Rotatif'],
  ['Garantie', '2 ans constructeur'],
  ['Description', 'Refroidissement rapide, faible consommation.'],
  ['Mentions', 'Inverter; Filtre antibactérien; Mode nuit']
]

// Correspondance exacte de l'intitule normalise.
function champExact(entete: string): ChampCible | null {
  if (!entete) return null
  for (const paire of SYNONYMES) {
    if (paire[1].indexOf(entete) !== -1) return paire[0]
  }
  return null
}

// Correspondance approchee : le synonyme LE PLUS LONG contenu dans l'intitule
// gagne. Indispensable pour departager « prix » de « prix grossiste » ou
// « description » de « description produit ».
function champApproche(entete: string): ChampCible | null {
  if (!entete) return null
  let meilleur: ChampCible | null = null
  let longueur = 0
  const mots = entete.split(' ')
  for (const paire of SYNONYMES) {
    for (const synonyme of paire[1]) {
      if (synonyme.length <= longueur) continue
      if (entete.indexOf(synonyme) === -1) continue
      // Un synonyme tres court ne vaut qu'en mot entier, sinon « pa » attraperait
      // « paiement » et « ch » attraperait « chambre ».
      if (synonyme.length <= 3 && mots.indexOf(synonyme) === -1) continue
      meilleur = paire[0]
      longueur = synonyme.length
    }
  }
  return meilleur
}

// ============================================================
// DETECTION DE LA LIGNE D'EN-TETE
// ============================================================

// Note un candidat en-tete. Les fichiers fournisseurs commencent souvent par un
// titre, un logo ou des lignes vides : la premiere ligne n'est pas l'en-tete.
export function scorerLigneEntete(cellules: any[]): number {
  let score = 0
  let nonVides = 0
  for (const cellule of cellules) {
    const n = normaliserEntete(cellule)
    if (!n) continue
    nonVides++
    // Une cellule purement numerique est une donnee, pas un intitule.
    if (/^[\d\s.,]+$/.test(n)) { score -= 2; continue }
    if (champExact(n)) score += 4
    else if (champApproche(n)) score += 2
  }
  if (nonVides < 2) return -1
  return score
}

function detecterIndexEntete(lignes: any[][]): number {
  const limite = Math.min(15, lignes.length)
  let meilleurIndex = -1
  let meilleurScore = 0
  for (let i = 0; i < limite; i++) {
    const score = scorerLigneEntete(lignes[i] || [])
    if (score > meilleurScore) { meilleurScore = score; meilleurIndex = i }
  }
  return meilleurIndex
}

// ============================================================
// LECTURE DES VALEURS
// ============================================================

// Analyse un nombre ecrit a l'humaine. Deux pieges :
//  * l'ambiguite des separateurs — « 1.250 » vaut 1250 dans un fichier francais,
//    pas 1,25 ;
//  * les cellules contenant plusieurs nombres — « 9000 BTU (1.3 CV) » ne doit pas
//    se concatener en 90001.3. On extrait donc le PREMIER groupe numerique.
// `\s` couvre les espaces insecables des exports Excel (U+00A0, U+202F...), ce qui
// evite d'ecrire ces caracteres invisibles dans le source.
export function parseNombre(valeur: unknown): number | null {
  if (typeof valeur === 'number') return Number.isFinite(valeur) ? valeur : null
  if (valeur == null) return null
  let s = sansAccents(String(valeur)).toLowerCase().replace(/\s/g, ' ')
  const negatif = /^\s*[-(]/.test(s)

  // Unites retirees AVANT l'extraction : « m2 » et « btuh » contiennent des
  // chiffres qui seraient sinon confondus avec la valeur.
  s = s.replace(/f\s*cfa|fcfa|xof|cfa|francs?|frs?/g, ' ')
  s = s.replace(/btu\s*\/?\s*h|btuh|btu|kwh|kw|m2|pcs?|unites?/g, ' ')

  // Premier groupe : chiffres et separateurs colles, puis eventuels groupes de
  // milliers separes par une espace (« 1 250 000 »).
  const groupe = s.match(/\d[\d.,]*(?:\s\d{3})*(?:[.,]\d+)?/)
  if (!groupe) return null
  s = groupe[0].replace(/\s/g, '')
  if (!s) return null

  const dernierPoint = s.lastIndexOf('.')
  const derniereVirgule = s.lastIndexOf(',')
  let normalise = s

  if (dernierPoint >= 0 && derniereVirgule >= 0) {
    // Les deux presents : le dernier rencontre est le separateur decimal.
    if (dernierPoint > derniereVirgule) normalise = s.replace(/,/g, '')
    else normalise = s.replace(/\./g, '').replace(',', '.')
  } else {
    const sep = dernierPoint >= 0 ? '.' : (derniereVirgule >= 0 ? ',' : '')
    if (sep) {
      const occurrences = s.split(sep).length - 1
      const position = s.lastIndexOf(sep)
      const apres = s.length - position - 1
      if (occurrences > 1 || (apres === 3 && position > 0)) {
        // « 1.250.000 » ou « 1.250 » : separateur de milliers.
        normalise = s.split(sep).join('')
      } else if (sep === ',') {
        normalise = s.replace(',', '.')
      }
    }
  }

  const n = parseFloat(normalise)
  if (!Number.isFinite(n)) return null
  return negatif ? -n : n
}

export function parseEntier(valeur: unknown): number | null {
  const n = parseNombre(valeur)
  return n == null ? null : Math.round(n)
}

export function parseBooleen(valeur: unknown): boolean | null {
  if (typeof valeur === 'boolean') return valeur
  if (typeof valeur === 'number') return valeur !== 0
  if (valeur == null) return null
  const s = sansAccents(String(valeur)).toLowerCase().trim()
  if (!s) return null
  if (/^(oui|o|yes|y|vrai|true|1|x|v|si|disponible|en stock|actif|active|publie)$/.test(s)) return true
  if (/^(non|n|no|faux|false|0|indisponible|rupture|epuise|inactif|masque)$/.test(s)) return false
  return null
}

// ============================================================
// DERIVATIONS
// ============================================================

export function cvVersBtu(cv: number): number {
  let meilleur = CV_VERS_BTU[0]
  let ecart = Math.abs(CV_VERS_BTU[0][0] - cv)
  for (const entree of CV_VERS_BTU) {
    const d = Math.abs(entree[0] - cv)
    if (d < ecart) { ecart = d; meilleur = entree }
  }
  return meilleur[1]
}

function btuPlausible(n: number | null): boolean {
  return n != null && n >= BORNES.btuMin && n <= BORNES.btuMax
}

// Surfaces conseillees a partir de la puissance : interpolation lineaire entre
// deux paliers du referentiel, extrapolation proportionnelle au-dela.
export function deriverSurfaces(btu: number): [number, number] {
  const t = SURFACES_PAR_BTU
  const borner = (v: number) => Math.min(BORNES.surfaceMax, Math.max(BORNES.surfaceMin, Math.round(v)))
  if (btu <= t[0][0]) {
    const r = btu / t[0][0]
    return [borner(t[0][1] * r), borner(t[0][2] * r)]
  }
  const dernier = t[t.length - 1]
  if (btu >= dernier[0]) {
    const r = btu / dernier[0]
    return [borner(dernier[1] * r), borner(dernier[2] * r)]
  }
  for (let i = 0; i < t.length - 1; i++) {
    const a = t[i]
    const b = t[i + 1]
    if (btu >= a[0] && btu <= b[0]) {
      const f = (btu - a[0]) / (b[0] - a[0])
      return [borner(a[1] + (b[1] - a[1]) * f), borner(a[2] + (b[2] - a[2]) * f)]
    }
  }
  return [10, 25]
}

const REGLES_CATEGORIE: Array<[RegExp, string]> = [
  [/multi[\s-]*split|bi[\s-]*split|tri[\s-]*split|multisplit/, 'Multi-split'],
  [/cassette|plafonnier|plafond/, 'Cassette'],
  [/gainable|gaine|ducted|conduit/, 'Gainable'],
  [/colonne|armoire|floor\s*standing|sur\s*pied/, 'Colonne'],
  [/roof\s*top|rooftop|toiture/, 'Rooftop'],
  [/industriel|industrielle|chiller|groupe\s*froid|refroidisseur|chambre\s*froide/, 'Industriel'],
  [/mural|split|wall|fenetre|window/, 'Mural/Split']
]

export function deriverCategorie(texte: string): string | null {
  const t = sansAccents(texte).toLowerCase()
  for (const regle of REGLES_CATEGORIE) {
    if (regle[0].test(t)) return regle[1]
  }
  return null
}

// Reconnait une categorie ecrite librement (« split mural », « CASSETTE 4 voies »)
// et la ramene sur le referentiel, sans jamais rejeter la ligne.
export function normaliserCategorie(valeur: unknown): string | null {
  const brut = String(valeur == null ? '' : valeur).trim()
  if (!brut) return null
  const n = normaliserTexte(brut)
  for (const categorie of CATEGORIES) {
    if (normaliserTexte(categorie) === n) return categorie
  }
  return deriverCategorie(brut)
}

const MOTS_GENERIQUES = /^(climatiseur|climatiseurs|clim|clims|climatisation|split|splits|ac|air|conditioner|unite|unites|appareil|kit|ensemble|nouveau|nouveaute|promo|lot|type|modele|cassette|gainable|colonne|mural|murale|inverter|neuf|the|de|du|la|le)$/

// Echappe une chaine destinee a une regex.
function echapperRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// La marque est NOT NULL en base : on ne rejette donc jamais la ligne, on deduit
// le meilleur candidat et on signale. Retirer les mots generiques de tete suffit
// en pratique (« Climatiseur LG 9000 BTU » -> « LG »).
export function deriverMarque(texte: string): string | null {
  const t = sansAccents(texte)
  for (const marque of MARQUES_CONNUES) {
    const motif = new RegExp('(^|[^A-Za-z0-9])' + echapperRegex(sansAccents(marque)) + '([^A-Za-z0-9]|$)', 'i')
    if (motif.test(t)) return marque
  }
  const jetons = t.split(/[^A-Za-z0-9+]+/).filter(Boolean)
  for (const jeton of jetons) {
    if (/^\d/.test(jeton)) continue
    if (MOTS_GENERIQUES.test(jeton.toLowerCase())) continue
    if (jeton.length < 2) continue
    return jeton.length <= 4 ? jeton.toUpperCase() : jeton.charAt(0).toUpperCase() + jeton.slice(1).toLowerCase()
  }
  return null
}

export function normaliserClasseEnergie(valeur: unknown): string | null {
  const s = sansAccents(String(valeur == null ? '' : valeur)).toUpperCase().replace(/[\s_-]/g, '')
  if (!s) return null
  const m = s.match(/^([A-G])(\+{0,3})$/)
  if (!m) return null
  const candidat = m[1] + m[2]
  return CLASSES_ENERGIE.indexOf(candidat) !== -1 ? candidat : null
}

// Refrigerant et compresseur ne sont JAMAIS devines : mieux vaut un champ vide
// qu'une caracteristique technique inventee sur une fiche publique.
export function deriverRefrigerant(texte: string): string | null {
  const m = sansAccents(texte).toUpperCase().match(/\bR[\s-]?(32|410\s?A|410|407\s?C|134\s?A|290|600\s?A|22)\b/)
  if (!m) return null
  const code = m[1].replace(/\s/g, '')
  if (code === '410') return 'R410A'
  return 'R' + code
}

export function deriverCompresseur(texte: string): string | null {
  const t = sansAccents(texte).toLowerCase()
  if (/twin\s*rotary/.test(t)) return 'Twin Rotary'
  if (/rotatif|rotary/.test(t)) return 'Rotatif'
  if (/scroll|spirale/.test(t)) return 'Scroll'
  if (/piston|reciproc|alternatif/.test(t)) return 'Piston'
  return null
}

export function deriverInverter(texte: string): boolean {
  return /inverter|invertor|dual\s*cool|dc\s*inv/i.test(sansAccents(texte))
}

// Decoupe une liste de fonctionnalites. On privilegie « ; » et les retours a la
// ligne ; la virgule ne sert de separateur qu'en dernier recours, car elle est
// courante a l'interieur d'une mention.
export function decouperMentions(valeur: unknown): string[] {
  const brut = String(valeur == null ? '' : valeur)
  if (!brut.trim()) return []
  let separateur: RegExp = /,+/
  if (/[;\n\r]/.test(brut)) separateur = /[;\n\r]+/
  else if (brut.indexOf('|') !== -1) separateur = /\|+/
  const vues: Record<string, boolean> = {}
  const sortie: string[] = []
  for (const morceau of brut.split(separateur)) {
    const m = sanitizeText(morceau, 120)
    if (!m) continue
    const cle = normaliserTexte(m)
    if (!cle || vues[cle]) continue
    vues[cle] = true
    sortie.push(m)
    if (sortie.length >= 20) break
  }
  return sortie
}

// ============================================================
// DETECTION DU MAPPING COLONNE -> CHAMP
// ============================================================

// Deduction par le CONTENU, utilisee quand les intitules sont absents ou
// inexploitables. On raisonne sur les ordres de grandeur du marche local : au
// Burkina un climatiseur se compte en centaines de milliers de FCFA, un BTU en
// milliers, un stock en unites.
function infererParContenu(valeurs: unknown[]): ChampCible | null {
  const nombres: number[] = []
  let textes = 0
  let nonVides = 0
  for (const valeur of valeurs) {
    const brut = String(valeur == null ? '' : valeur).trim()
    if (!brut) continue
    nonVides++
    const n = parseNombre(brut)
    // Une cellule est « numerique » si elle ne contient presque que le nombre.
    const lettres = brut.replace(/[^A-Za-z]/g, '').length
    if (n != null && lettres <= 4) nombres.push(n)
    else if (brut.replace(/[^A-Za-z]/g, '').length >= 3) textes++
  }
  if (nonVides < 3) return null

  const partNumerique = nombres.length / nonVides
  if (partNumerique >= 0.8) {
    const dans = (min: number, max: number) =>
      nombres.filter((n) => n >= min && n <= max).length / nombres.length
    if (dans(50000, 100000000) >= 0.8) return 'prixFcfa'
    if (dans(BORNES.btuMin, 80000) >= 0.8) return 'puissanceBtu'
    if (dans(0.5, 12) >= 0.8) return 'puissanceCv'
    if (dans(0, 5000) >= 0.8) return 'stockInitial'
    return null
  }

  if (textes / nonVides >= 0.6) {
    // Un libelle produit est long et contient generalement des chiffres (BTU) ;
    // une categorie ou une marque est courte et repetitive.
    let longueurTotale = 0
    let avecChiffre = 0
    const distinctes: Record<string, boolean> = {}
    for (const valeur of valeurs) {
      const brut = String(valeur == null ? '' : valeur).trim()
      if (!brut) continue
      longueurTotale += brut.length
      if (/\d/.test(brut)) avecChiffre++
      distinctes[normaliserTexte(brut)] = true
    }
    const longueurMoyenne = longueurTotale / nonVides
    const nbDistinctes = Object.keys(distinctes).length
    if (longueurMoyenne >= 15 && avecChiffre / nonVides >= 0.4) return 'nom'
    if (longueurMoyenne <= 14 && nbDistinctes <= Math.max(3, nonVides * 0.5)) {
      let marques = 0
      for (const valeur of valeurs) {
        if (deriverMarque(String(valeur == null ? '' : valeur)) && MARQUES_CONNUES.some((m) => normaliserTexte(m) === normaliserTexte(valeur))) marques++
      }
      if (marques / nonVides >= 0.5) return 'marque'
      let categories = 0
      for (const valeur of valeurs) {
        if (normaliserCategorie(valeur)) categories++
      }
      if (categories / nonVides >= 0.6) return 'categorie'
    }
    if (longueurMoyenne >= 30) return 'description'
  }
  return null
}

// Construit la table de correspondance colonne -> champ.
// Ordre de priorite : intitule exact, puis intitule approche, puis contenu.
// Un champ deja attribue n'est pas repris par une colonne moins sure, sinon
// « Prix » et « Prix grossiste » se disputeraient la meme cible.
export function detecterMapping(entetes: any[], echantillons: unknown[][]): ColonneDetectee[] {
  const nbColonnes = Math.max(entetes.length, echantillons.length)
  const colonnes: ColonneDetectee[] = []
  const pris: Partial<Record<ChampCible, number>> = {}

  for (let i = 0; i < nbColonnes; i++) {
    const brut = entetes[i]
    const echantillon = (echantillons[i] || []).slice(0, 3).map((v) => sanitizeText(String(v == null ? '' : v), 60))
    colonnes.push({
      index: i,
      entete: sanitizeText(String(brut == null ? '' : brut), 80),
      champ: null,
      confiance: 'aucune',
      echantillon
    })
  }

  const attribuer = (colonne: ColonneDetectee, champ: ChampCible | null, confiance: ColonneDetectee['confiance']) => {
    if (!champ) return false
    if (pris[champ] !== undefined) return false
    colonne.champ = champ
    colonne.confiance = confiance
    pris[champ] = colonne.index
    return true
  }

  // Passe 1 : intitules exacts.
  for (let i = 0; i < nbColonnes; i++) {
    attribuer(colonnes[i], champExact(normaliserEntete(entetes[i])), 'exacte')
  }
  // Passe 2 : intitules approches.
  for (let i = 0; i < nbColonnes; i++) {
    if (colonnes[i].champ) continue
    attribuer(colonnes[i], champApproche(normaliserEntete(entetes[i])), 'approchee')
  }
  // Passe 3 : contenu, pour les colonnes restees orphelines.
  for (let i = 0; i < nbColonnes; i++) {
    if (colonnes[i].champ) continue
    attribuer(colonnes[i], infererParContenu(echantillons[i] || []), 'contenu')
  }

  return colonnes
}

// ============================================================
// DERIVATION DE LA PUISSANCE
// ============================================================

// Extrait une puissance depuis un texte libre. Les libelles reels du catalogue la
// portent deja : « Climatiseur LG 12000 BTU (1.3 CV) ».
export function extraireBtuTexte(texte: string): number | null {
  const t = sansAccents(texte).toLowerCase()

  // 1. BTU explicite.
  const btu = t.match(/(\d[\d\s.,]*)\s*(?:btu|btuh|btu\s*\/?\s*h)/)
  if (btu) {
    const n = parseEntier(btu[1])
    if (btuPlausible(n)) return n as number
  }

  // 2. Chevaux. « 1.3 CV » n'est pas une valeur de catalogue : on retient le
  //    palier le plus proche, ce qui redonne bien 12000 pour 1.3.
  const cv = t.match(/(\d+(?:[.,]\d+)?)\s*(?:cv|ch\b|chevaux)/)
  if (cv) {
    const n = parseNombre(cv[1])
    if (n != null && n > 0 && n <= 20) {
      const converti = cvVersBtu(n)
      if (btuPlausible(converti)) return converti
    }
  }

  // 3. Kilowatts frigorifiques.
  const kw = t.match(/(\d+(?:[.,]\d+)?)\s*kw/)
  if (kw) {
    const n = parseNombre(kw[1])
    if (n != null && n > 0 && n <= 60) {
      const converti = Math.round((n * 3412) / 500) * 500
      if (btuPlausible(converti)) return converti
    }
  }

  // 4. Dernier recours : un nombre isole a l'ordre de grandeur d'un BTU
  //    commercial (9000, 12000, 18000...), sans unite.
  const nu = t.match(/\b(\d{4,5})\b/)
  if (nu) {
    const n = parseInt(nu[1], 10)
    if (n >= 5000 && n <= 60000 && n % 1000 === 0) return n
  }

  return null
}

// ============================================================
// ASSEMBLAGE D'UNE FICHE PRODUIT
// ============================================================

export interface LigneBrute {
  ligne: number
  valeurs: Record<string, unknown>
  texteComplet: string
}

// Extrait les valeurs d'une ligne selon le mapping, et concatene tout le texte de
// la ligne : les derivations cherchent BTU/marque/categorie dans l'ensemble du
// libelle, pas seulement dans la colonne « nom ».
export function extraireLigne(cellules: any[], colonnes: ColonneDetectee[], numeroLigne: number): LigneBrute {
  const valeurs: Record<string, unknown> = {}
  const morceaux: string[] = []
  for (const colonne of colonnes) {
    const cellule = cellules[colonne.index]
    const brut = String(cellule == null ? '' : cellule).trim()
    if (brut) morceaux.push(brut)
    if (colonne.champ && brut) valeurs[colonne.champ] = cellule
  }
  return { ligne: numeroLigne, valeurs, texteComplet: morceaux.join(' ') }
}

function ligneVide(cellules: any[]): boolean {
  for (const cellule of cellules) {
    if (String(cellule == null ? '' : cellule).trim()) return false
  }
  return true
}

// Coeur du moteur : transforme une ligne brute en fiche produit complete, en
// notant pour chaque champ d'ou vient la valeur.
export function construireProduit(brut: LigneBrute, corrections?: Record<string, unknown>): ProduitDerive {
  const v = brut.valeurs
  const origines: Partial<Record<keyof ChampsProduit, Origine>> = {}
  const alertes: string[] = []
  const erreurs: string[] = []

  // Les corrections de l'admin ecrasent la deduction et sont traitees comme des
  // valeurs « fichier » : elles ont ete validees par un humain.
  const lire = (champ: ChampCible): unknown => {
    if (corrections && Object.prototype.hasOwnProperty.call(corrections, champ)) {
      const c = corrections[champ]
      if (c !== null && c !== undefined && String(c).trim() !== '') return c
    }
    return v[champ]
  }

  const texte = brut.texteComplet

  // --- Nom (bloquant) ---
  let nom = sanitizeText(lire('nom'), 200)
  if (!nom) {
    // Repli : la colonne « nom » peut manquer alors qu'un modele est present.
    const modeleSeul = sanitizeText(lire('modele'), 200)
    const marqueSeule = sanitizeText(lire('marque'), 120)
    if (modeleSeul || marqueSeule) {
      nom = ('Climatiseur ' + marqueSeule + ' ' + modeleSeul).replace(/\s+/g, ' ').trim()
      origines.nom = 'deduit'
    }
  } else {
    origines.nom = 'fichier'
  }
  if (!nom) erreurs.push('Nom du produit introuvable')

  // --- Puissance (bloquant) ---
  let btu: number | null = null
  const btuColonne = parseEntier(lire('puissanceBtu'))
  if (btuColonne != null) {
    if (btuPlausible(btuColonne)) {
      btu = btuColonne
      origines.puissanceBtu = 'fichier'
    } else {
      // Une colonne « puissance » peut contenir des CV et non des BTU.
      const cvProbable = btuColonne > 0 && btuColonne <= 20 ? cvVersBtu(btuColonne) : null
      if (cvProbable && btuPlausible(cvProbable)) {
        btu = cvProbable
        origines.puissanceBtu = 'deduit'
        alertes.push('Puissance ' + btuColonne + ' interpretee comme ' + btuColonne + ' CV = ' + btu + ' BTU')
      } else {
        erreurs.push('Puissance ' + btuColonne + ' hors bornes (' + BORNES.btuMin + '-' + BORNES.btuMax + ' BTU)')
      }
    }
  }
  if (btu == null && erreurs.length === 0) {
    const cvColonne = parseNombre(lire('puissanceCv'))
    if (cvColonne != null && cvColonne > 0 && cvColonne <= 20) {
      const converti = cvVersBtu(cvColonne)
      if (btuPlausible(converti)) { btu = converti; origines.puissanceBtu = 'deduit' }
    }
  }
  if (btu == null && erreurs.length === 0) {
    const kwColonne = parseNombre(lire('puissanceKw'))
    if (kwColonne != null && kwColonne > 0 && kwColonne <= 60) {
      const converti = Math.round((kwColonne * 3412) / 500) * 500
      if (btuPlausible(converti)) { btu = converti; origines.puissanceBtu = 'deduit' }
    }
  }
  if (btu == null && erreurs.length === 0) {
    const extrait = extraireBtuTexte(texte)
    if (extrait != null) { btu = extrait; origines.puissanceBtu = 'deduit' }
  }
  if (btu == null && !erreurs.some((e) => e.indexOf('Puissance') === 0)) {
    erreurs.push('Puissance introuvable (ni BTU, ni CV, ni kW, ni dans le libelle)')
  }

  // --- Prix (bloquant) ---
  let prixFcfa: number | null = parseNombre(lire('prixFcfa'))
  if (prixFcfa != null) {
    prixFcfa = Math.round(prixFcfa)
    if (prixFcfa < BORNES.prixMin || prixFcfa > BORNES.prixMax) {
      erreurs.push('Prix ' + prixFcfa + ' hors bornes (' + BORNES.prixMin + '-' + BORNES.prixMax + ' FCFA)')
      prixFcfa = null
    } else {
      origines.prixFcfa = 'fichier'
    }
  } else {
    erreurs.push('Prix de vente introuvable ou illisible')
  }

  // --- Prix grossiste (optionnel) ---
  let prixGrossisteFcfa: number | null = parseNombre(lire('prixGrossisteFcfa'))
  if (prixGrossisteFcfa != null) {
    prixGrossisteFcfa = Math.round(prixGrossisteFcfa)
    if (prixGrossisteFcfa < BORNES.prixMin || prixGrossisteFcfa > BORNES.prixMax) {
      alertes.push('Prix grossiste ' + prixGrossisteFcfa + ' hors bornes, ignore')
      prixGrossisteFcfa = null
    } else {
      origines.prixGrossisteFcfa = 'fichier'
      if (prixFcfa != null && prixGrossisteFcfa > prixFcfa) {
        alertes.push('Prix grossiste superieur au prix de vente, a verifier')
      }
    }
  }

  // --- Marque (NOT NULL en base : on deduit toujours quelque chose) ---
  let marque = sanitizeText(lire('marque'), 120)
  if (marque) {
    const connue = MARQUES_CONNUES.find((m) => normaliserTexte(m) === normaliserTexte(marque))
    if (connue) { marque = connue; origines.marque = 'fichier' }
    else { origines.marque = 'fichier'; alertes.push('Marque "' + marque + '" inconnue du referentiel, a verifier') }
  } else {
    const deduite = deriverMarque(texte)
    if (deduite) {
      marque = deduite
      origines.marque = 'deduit'
      if (!MARQUES_CONNUES.some((m) => normaliserTexte(m) === normaliserTexte(deduite))) {
        alertes.push('Marque deduite "' + deduite + '" inconnue du referentiel, a verifier')
      }
    } else {
      marque = 'Non precisee'
      origines.marque = 'defaut'
      alertes.push('Marque introuvable, a completer')
    }
  }

  // --- Modele ---
  let modele = sanitizeText(lire('modele'), 120)
  if (modele) origines.modele = 'fichier'
  else {
    // Sans reference fournie, la puissance sert de discriminant : c'est aussi la
    // cle de rapprochement des doublons, elle doit rester stable d'un import a
    // l'autre.
    modele = btu != null ? String(btu) + ' BTU' : ''
    if (modele) origines.modele = 'deduit'
  }

  // --- Categorie ---
  let categorie = normaliserCategorie(lire('categorie'))
  if (categorie) origines.categorie = 'fichier'
  else {
    const brute = sanitizeText(lire('categorie'), 60)
    if (brute) alertes.push('Categorie "' + brute + '" non reconnue, deduite du libelle')
    categorie = deriverCategorie(texte)
    if (categorie) origines.categorie = 'deduit'
    else { categorie = CATEGORIE_DEFAUT; origines.categorie = 'defaut' }
  }

  // --- Classe energetique ---
  let classeEnergie = normaliserClasseEnergie(lire('classeEnergie'))
  if (classeEnergie) origines.classeEnergie = 'fichier'
  else {
    const brute = sanitizeText(lire('classeEnergie'), 20)
    if (brute) alertes.push('Classe energetique "' + brute + '" non reconnue')
    const dansTexte = sansAccents(texte).toUpperCase().match(/\bclasse\s*([A-G]\+{0,3})\b/)
    classeEnergie = dansTexte ? normaliserClasseEnergie(dansTexte[1]) : null
    if (classeEnergie) origines.classeEnergie = 'deduit'
    else { classeEnergie = CLASSE_DEFAUT; origines.classeEnergie = 'defaut' }
  }

  // --- Surfaces conseillees ---
  let surfaceMin = parseEntier(lire('surfaceMin'))
  let surfaceMax = parseEntier(lire('surfaceMax'))
  const surfacesFournies = surfaceMin != null && surfaceMax != null
  if (surfacesFournies) {
    origines.surfaceMin = 'fichier'
    origines.surfaceMax = 'fichier'
  }
  if (surfaceMin == null || surfaceMax == null || surfaceMin < BORNES.surfaceMin || surfaceMax > BORNES.surfaceMax || surfaceMin > surfaceMax) {
    if (surfacesFournies) alertes.push('Surfaces fournies incoherentes, recalculees depuis la puissance')
    const paire = deriverSurfaces(btu != null ? btu : 12000)
    surfaceMin = paire[0]
    surfaceMax = paire[1]
    origines.surfaceMin = btu != null ? 'deduit' : 'defaut'
    origines.surfaceMax = origines.surfaceMin
  }

  // --- Stock ---
  let stockInitial = parseEntier(lire('stockInitial'))
  if (stockInitial != null && stockInitial >= BORNES.stockMin && stockInitial <= BORNES.stockMax) {
    origines.stockInitial = 'fichier'
  } else {
    if (stockInitial != null) alertes.push('Stock ' + stockInitial + ' hors bornes, ramene a 0')
    stockInitial = 0
    origines.stockInitial = 'defaut'
  }

  // --- Inverter ---
  const inverterColonne = parseBooleen(lire('inverter'))
  let inverter: boolean
  if (inverterColonne != null) { inverter = inverterColonne; origines.inverter = 'fichier' }
  else { inverter = deriverInverter(texte); origines.inverter = inverter ? 'deduit' : 'defaut' }

  // --- Disponibilite ---
  const dispoColonne = parseBooleen(lire('disponible'))
  let disponible: boolean
  if (dispoColonne != null) { disponible = dispoColonne; origines.disponible = 'fichier' }
  else { disponible = stockInitial > 0; origines.disponible = 'deduit' }

  // --- Description ---
  let description = sanitizeText(lire('description'), 3000)
  if (description) origines.description = 'fichier'
  else {
    description = 'Climatiseur ' + marque + ' ' + (btu != null ? btu + ' BTU' : '') +
      (inverter ? ' Inverter' : '') + ', adapte aux pieces de ' + surfaceMin + ' a ' + surfaceMax +
      ' m2. Classe energetique ' + classeEnergie + '.'
    description = description.replace(/\s+/g, ' ').trim()
    origines.description = 'deduit'
  }

  // --- Mentions / fonctionnalites ---
  const mentions = decouperMentions(lire('mentions'))
  if (mentions.length) origines.mentions = 'fichier'
  else origines.mentions = 'defaut'

  // --- Caracteristiques techniques : jamais inventees ---
  let refrigerant = sanitizeText(lire('refrigerant'), 40)
  if (refrigerant) origines.refrigerant = 'fichier'
  else {
    refrigerant = deriverRefrigerant(texte) || ''
    if (refrigerant) origines.refrigerant = 'deduit'
  }

  let compresseur = sanitizeText(lire('compresseur'), 60)
  if (compresseur) origines.compresseur = 'fichier'
  else {
    compresseur = deriverCompresseur(texte) || ''
    if (compresseur) origines.compresseur = 'deduit'
  }

  let garantie = sanitizeText(lire('garantie'), 80)
  if (garantie) origines.garantie = 'fichier'
  else { garantie = GARANTIE_DEFAUT; origines.garantie = 'defaut' }

  // Une colonne photo detectee est signalee, pas silencieusement ecartee.
  if (v.photo) alertes.push('Colonne photo ignoree (les visuels restent a ajouter manuellement)')

  return {
    ligne: brut.ligne,
    champs: {
      nom,
      marque,
      modele,
      categorie,
      puissanceBtu: btu,
      prixFcfa,
      prixGrossisteFcfa,
      stockInitial,
      classeEnergie,
      surfaceMin: surfaceMin as number,
      surfaceMax: surfaceMax as number,
      inverter,
      disponible,
      description,
      mentions,
      refrigerant,
      compresseur,
      garantie
    },
    origines,
    alertes,
    erreurs
  }
}

// ============================================================
// ANALYSE D'UN CLASSEUR
// ============================================================

export interface OptionsAnalyse {
  // Mapping impose par l'admin depuis l'ecran de correspondance :
  // index de colonne -> champ cible (ou null pour ignorer la colonne).
  mapping?: Record<string, ChampCible | null>
  // Corrections manuelles, indexees par numero de ligne du fichier.
  corrections?: Record<string, Record<string, unknown>>
  // Index de la ligne d'en-tete impose par l'admin (-1 = aucune en-tete).
  indexEntete?: number
  // Decalage a ajouter aux numeros de ligne. Sert au decoupage en lots : l'UI
  // renvoie l'en-tete avec chaque lot, donc l'index local repart de zero, alors
  // que les numeros de ligne et les cles de `corrections` doivent rester ceux du
  // tableur d'origine.
  decalageLigne?: number
}

// Point d'entree unique. `lignes` est le tableau de tableaux brut renvoye par
// SheetJS (`sheet_to_json(feuille, { header: 1 })`), en-tete incluse.
export function analyserClasseur(lignes: any[][], options?: OptionsAnalyse): ResultatAnalyse {
  const avertissements: string[] = []
  const opts = options || {}

  const utiles = Array.isArray(lignes) ? lignes.filter((l) => Array.isArray(l)) : []
  if (!utiles.length) {
    return { indexEntete: -1, nbLignesDonnees: 0, colonnes: [], produits: [], avertissements: ['Feuille vide'] }
  }

  const indexEntete = opts.indexEntete !== undefined && opts.indexEntete !== null
    ? opts.indexEntete
    : detecterIndexEntete(utiles)

  if (indexEntete < 0) {
    avertissements.push('Aucune ligne d\'en-tete reconnue : les colonnes sont deduites de leur contenu.')
  } else if (indexEntete > 0) {
    avertissements.push('En-tete detectee ligne ' + (indexEntete + 1) + ' ; les ' + indexEntete + ' ligne(s) au-dessus sont ignorees.')
  }

  const entetes: any[] = indexEntete >= 0 ? (utiles[indexEntete] || []) : []
  const lignesDonnees = utiles.slice(indexEntete >= 0 ? indexEntete + 1 : 0).filter((l) => !ligneVide(l))

  // Largeur reelle du tableau : certains exports laissent des cellules absentes
  // en fin de ligne, la longueur varie donc d'une ligne a l'autre.
  let largeur = entetes.length
  for (const ligne of lignesDonnees) {
    if (ligne.length > largeur) largeur = ligne.length
  }

  // Echantillons par colonne, pour la deduction par contenu et l'affichage.
  const echantillons: unknown[][] = []
  for (let i = 0; i < largeur; i++) {
    const colonne: unknown[] = []
    for (const ligne of lignesDonnees) {
      const cellule = ligne[i]
      if (String(cellule == null ? '' : cellule).trim()) colonne.push(cellule)
      if (colonne.length >= 40) break
    }
    echantillons.push(colonne)
  }

  const colonnes = detecterMapping(entetes.slice(0, largeur), echantillons)

  // Mapping impose par l'admin : il prime toujours sur la deduction.
  if (opts.mapping) {
    const dejaPris: Partial<Record<ChampCible, boolean>> = {}
    for (const colonne of colonnes) {
      const cle = String(colonne.index)
      if (!Object.prototype.hasOwnProperty.call(opts.mapping, cle)) continue
      const impose = opts.mapping[cle]
      if (!impose) { colonne.champ = null; colonne.confiance = 'aucune'; continue }
      if (dejaPris[impose]) {
        avertissements.push('Champ "' + impose + '" affecte a plusieurs colonnes : seule la premiere est retenue.')
        colonne.champ = null
        colonne.confiance = 'aucune'
        continue
      }
      dejaPris[impose] = true
      colonne.champ = impose
      colonne.confiance = 'exacte'
    }
    // Une colonne deduite qui reutilise un champ impose ailleurs doit ceder.
    for (const colonne of colonnes) {
      const cle = String(colonne.index)
      if (Object.prototype.hasOwnProperty.call(opts.mapping, cle)) continue
      if (colonne.champ && dejaPris[colonne.champ]) { colonne.champ = null; colonne.confiance = 'aucune' }
      else if (colonne.champ) dejaPris[colonne.champ] = true
    }
  }

  const champsTrouves = colonnes.filter((c) => c.champ).map((c) => c.champ as ChampCible)
  const aNom = champsTrouves.indexOf('nom') !== -1 || champsTrouves.indexOf('modele') !== -1 || champsTrouves.indexOf('description') !== -1
  const aPrix = champsTrouves.indexOf('prixFcfa') !== -1
  if (!aNom) avertissements.push('Aucune colonne de libelle produit identifiee : verifiez la correspondance.')
  if (!aPrix) avertissements.push('Aucune colonne de prix identifiee : verifiez la correspondance.')
  // Les visuels sont hors perimetre de l'import : la colonne est reconnue et
  // annoncee ignoree plutot qu'ecartee en silence, sinon l'admin croit ses photos
  // importees et ne les ajoute jamais a la main.
  if (champsTrouves.indexOf('photo') !== -1) {
    avertissements.push('Une colonne de photo a ete reconnue : elle est ignoree, les visuels s\'ajoutent depuis chaque fiche produit.')
  }

  const produits: ProduitDerive[] = []
  const decalage = opts.decalageLigne || 0
  for (let i = 0; i < lignesDonnees.length; i++) {
    // Numero de ligne tel qu'affiche dans le tableur (base 1), pour que l'admin
    // retrouve la ligne fautive dans son fichier.
    const numeroLigne = decalage + (indexEntete >= 0 ? indexEntete + 1 : 0) + i + 1
    const brut = extraireLigne(lignesDonnees[i], colonnes, numeroLigne)
    const correction = opts.corrections ? opts.corrections[String(numeroLigne)] : undefined
    produits.push(construireProduit(brut, correction))
  }

  return {
    indexEntete,
    nbLignesDonnees: lignesDonnees.length,
    colonnes,
    produits,
    avertissements
  }
}
