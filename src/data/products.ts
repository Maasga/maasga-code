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

export const products: Product[] = [
  {
    id: 1,
    name: "Climatiseur Split Inverter 9000 BTU",
    brand: "SAMSUNG",
    model: "AR09TXHQASINUA",
    btu: 9000,
    price: 280000,
    stock: 8,
    surface_min: 9,
    surface_max: 15,
    energy_class: "A++",
    description: "Climatiseur inverter haute performance, idéal pour les petites pièces. Technologie WindFree pour un confort optimal sans courant d'air direct.",
    inverter: true,
    available: true,
    warranty: "2 ans constructeur",
    features: ["Mode Turbo", "Auto-nettoyage", "Wi-Fi intégré", "Mode Eco", "Anti-bactérien"],
    image: "/assets/icons/temperature.svg", // était '🌡️'
    imageUrl: undefined
  },
  {
    id: 2,
    name: "Climatiseur Split Inverter 12000 BTU",
    brand: "SAMSUNG",
    model: "AR12TXHQASINUA",
    btu: 12000,
    price: 340000,
    stock: 5,
    surface_min: 15,
    surface_max: 25,
    energy_class: "A++",
    description: "Solution parfaite pour les chambres et bureaux de taille moyenne. Refroidissement rapide et silencieux.",
    inverter: true,
    available: true,
    warranty: "2 ans constructeur",
    features: ["Mode Turbo", "Auto-nettoyage", "Wi-Fi intégré", "Mode Eco", "Timer programmable"],
    image: "/assets/icons/snowflake.svg", // était '❄️'
    imageUrl: undefined
  },
  {
    id: 3,
    name: "Climatiseur Split Inverter 18000 BTU",
    brand: "LG",
    model: "S18EQ-NSLA",
    btu: 18000,
    price: 480000,
    stock: 3,
    surface_min: 25,
    surface_max: 40,
    energy_class: "A+++",
    description: "Climatiseur puissant pour les grands espaces. Technologie Dual Inverter pour une efficacité énergétique maximale.",
    inverter: true,
    available: true,
    warranty: "2 ans + extension disponible",
    features: ["Dual Inverter", "Mode Quiet", "Auto Cleaning", "4-Way Swing", "Smart Diagnosis"],
    image: "/assets/icons/office.svg", // était '🏢'
    imageUrl: undefined
  },
  {
    id: 4,
    name: "Climatiseur Split 9000 BTU Non-Inverter",
    brand: "MIDEA",
    model: "MSAF1-09CRN8-QD0GW",
    btu: 9000,
    price: 175000,
    stock: 12,
    surface_min: 9,
    surface_max: 14,
    energy_class: "A",
    description: "Climatiseur entrée de gamme robuste et fiable. Idéal pour les petites pièces avec un budget maîtrisé.",
    inverter: false,
    available: true,
    warranty: "1 an constructeur",
    features: ["Refroidissement rapide", "Mode Sommeil", "Timer 24h", "Filtre lavable"],
    image: "/assets/icons/wind.svg", // était '💨'
    imageUrl: undefined
  },
  {
    id: 5,
    name: "Climatiseur Split 12000 BTU Non-Inverter",
    brand: "MIDEA",
    model: "MSAF1-12CRN8-QD0GW",
    btu: 12000,
    price: 220000,
    stock: 7,
    surface_min: 14,
    surface_max: 22,
    energy_class: "A",
    description: "Bon rapport qualité-prix pour les pièces à vivre. Fiabilité éprouvée en climat tropical.",
    inverter: false,
    available: true,
    warranty: "1 an constructeur",
    features: ["Démarrage à froid", "Mode Auto", "Filtre anti-poussière", "Timer programmable"],
    image: "/assets/icons/wind.svg", // était '🌬️'
    imageUrl: undefined
  },
  {
    id: 6,
    name: "Climatiseur Split Inverter 24000 BTU",
    brand: "LG",
    model: "S24EQ-NSLA",
    btu: 24000,
    price: 650000,
    stock: 2,
    surface_min: 40,
    surface_max: 60,
    energy_class: "A+++",
    description: "Solution professionnelle pour les grands espaces commerciaux et bureaux open-space. Performance maximale.",
    inverter: true,
    available: true,
    warranty: "3 ans constructeur",
    features: ["Dual Inverter Gold Fin", "Mode Jet Cool", "Auto Cleaning", "Smart ThinQ", "UVnano"],
    image: "/assets/icons/store.svg", // était '🏬'
    imageUrl: undefined
  },
  {
    id: 7,
    name: "Climatiseur Cassette 18000 BTU",
    brand: "DAIKIN",
    model: "FCAG18AV1",
    btu: 18000,
    price: 720000,
    stock: 0,
    surface_min: 25,
    surface_max: 45,
    energy_class: "A++",
    description: "Climatiseur cassette plafond idéal pour les espaces commerciaux. Diffusion d'air à 360°.",
    inverter: true,
    available: false,
    warranty: "3 ans constructeur",
    features: ["Diffusion 4 directions", "Filtre plasma", "Mode Confort", "Programmation hebdo"],
    image: "/assets/icons/factory.svg", // était '🏗️'
    imageUrl: undefined
  },
  {
    id: 8,
    name: "Climatiseur Split Inverter 24000 BTU",
    brand: "SAMSUNG",
    model: "AR24TXHQASINUA",
    btu: 24000,
    price: 580000,
    stock: 4,
    surface_min: 38,
    surface_max: 58,
    energy_class: "A+++",
    description: "Puissance et économie d'énergie pour les grands volumes. Idéal pour salons, salles de réunion.",
    inverter: true,
    available: true,
    warranty: "2 ans constructeur",
    features: ["WindFree Cooling", "AI Auto Mode", "SmartThings", "Self Clean", "Triple Protection+"],
    image: "/assets/icons/temperature.svg", // était '🔵'
    imageUrl: undefined
  }
];

export const getBrands = () => [...new Set(products.map(p => p.brand))]
export const getBTUList = () => [...new Set(products.map(p => p.btu))].sort((a, b) => a - b)
export const getPriceRange = () => ({ min: Math.min(...products.map(p => p.price)), max: Math.max(...products.map(p => p.price)) })
