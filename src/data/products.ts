export interface TechSpecs {
  power_source?: string           // Source de courant (ex: 220V/1Ph/50Hz)
  cooling_capacity?: string       // Capacité de refroidissement (ex: 3500 W)
  cooling_input_power?: string    // Puissance de refroidissement d'entrée (ex: 1150 W)
  nominal_cooling_current?: string // Courant nominal de refroidissement (ex: 5.5 A)
  max_input_consumption?: string  // Max. Consommation d'entrée (ex: 1400 W)
  max_current?: string            // Courant max (ex: 6.5 A)
  starting_current?: string       // Courant de démarrage (ex: 45 A)
  compressor_type?: string        // Type de compresseur (ex: Rotatif)
  indoor_airflow?: string         // Débit d'air intérieur (ex: 600 m³/h)
  indoor_noise?: string           // Niveau de bruit intérieur (ex: 26-42 dB(A))
  refrigerant_type?: string       // Type de réfrigérant (ex: R32)
  design_pressure?: string        // Pression de conception (ex: 4.3/1.9 MPa)
  operating_temp?: string         // Température de fonctionnement (ex: -15°C à 50°C)
  ambient_temp_cooling?: string   // Température ambiante refroidissement (ex: 18°C à 43°C)
}

export interface MediaItem {
  type: 'image' | 'video'
  url: string
  caption?: string
  thumbnail?: string  // pour les vidéos
}

export interface Product {
  id: number
  name: string
  brand: string
  btu: number
  surface_min: number
  surface_max: number
  price: number
  price_install: number
  stock: number
  inverter: boolean
  available: boolean
  image: string       // emoji fallback
  imageUrl?: string   // vraie image (base64 ou URL)
  description: string
  features: string[]
  energy_class: string
  warranty: string
  model: string
  techSpecs?: TechSpecs
  media?: MediaItem[]  // galerie multi-media
}

// Les produits ne sont plus définis ici en dur.
// Cette liste est alimentée exclusivement depuis D1 au démarrage de l'isolate
// (voir le middleware _d1LoadPromise dans src/index.tsx).
// Laisser ce tableau vide garantit que D1 est la seule source de vérité :
// un produit supprimé en base ne réapparaît jamais après un redéploiement.
export const products: Product[] = []

export const getBrands = () => [...new Set(products.map(p => p.brand))]
export const getBTUList = () => [...new Set(products.map(p => p.btu))].sort((a, b) => a - b)
export const getPriceRange = () => ({ min: Math.min(...products.map(p => p.price)), max: Math.max(...products.map(p => p.price)) })
