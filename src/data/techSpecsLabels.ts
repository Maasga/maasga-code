// Libellés FR des caractéristiques techniques produit.
// Partagé entre le catalogue (client, modale — historique) et la fiche produit
// (server-rendu, src/pages/produit.tsx). Garder synchronisé avec les clés de
// `product.techSpecs`.
export const TECH_LABELS: Record<string, string> = {
  power_source: 'Source de courant',
  cooling_capacity: 'Capacité refroidissement',
  cooling_input_power: 'Puissance refroid. entrée',
  nominal_cooling_current: 'Courant nominal refroid.',
  max_input_consumption: 'Max. Consommation entrée',
  max_current: 'Courant max',
  starting_current: 'Courant de démarrage',
  compressor_type: 'Type de compresseur',
  indoor_airflow: "Débit d'air intérieur",
  indoor_noise: 'Bruit intérieur',
  refrigerant_type: 'Type de réfrigérant',
  design_pressure: 'Pression de conception',
  operating_temp: 'Temp. de fonctionnement',
  ambient_temp_cooling: 'Temp. ambiante refroid.'
}
