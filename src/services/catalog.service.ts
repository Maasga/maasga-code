import type { D1Database } from '@cloudflare/workers-types'
import { products, type Product, type MediaItem } from '../data/products'

/**
 * Version de contenu partagée entre tous les isolates Workers.
 *
 * Problème résolu : le tableau `products` est un cache mémoire *par isolate*.
 * Quand l'admin modifie un produit, seul l'isolate qui a traité la requête
 * était à jour ; les autres servaient l'ancienne version jusqu'à leur recyclage,
 * et le cache edge (10 min) aggravait le décalage.
 *
 * Désormais toute mutation admin incrémente `site_settings.content_version`.
 * Chaque isolate relit cette version au plus toutes les VERSION_TTL_MS et
 * recharge le catalogue si elle a changé. La version fait aussi partie de la
 * clé du cache edge : une mutation « purge » donc implicitement les pages.
 */
export const CONTENT_VERSION_KEY = 'content_version'
const VERSION_TTL_MS = 5_000

let cachedVersion = '0'
let versionCheckedAt = 0
let versionPromise: Promise<string> | null = null

let catalogVersion: string | null = null
let catalogPromise: Promise<void> | null = null

const parseJson = <T>(raw: unknown, fallback: T): T => {
  if (typeof raw !== 'string' || raw === '') return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

/** Convertit une ligne D1 `products` en objet `Product` utilisé par les vues. */
export function mapProductRow(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    model: p.model,
    btu: p.btu,
    price: p.price,
    price_install: 0,
    stock: p.stock,
    surface_min: p.surface_min,
    surface_max: p.surface_max,
    energy_class: p.energy_class,
    description: p.description,
    inverter: p.inverter === 1 || p.inverter === true,
    available: p.available === 1 || p.available === true,
    image: p.image || '❄️',
    imageUrl: p.imageUrl || p.image_url,
    features: parseJson<string[]>(p.features, []),
    warranty: p.warranty || '1 an constructeur',
    techSpecs: parseJson<any>(p.tech_specs, undefined),
    media: parseJson<MediaItem[]>(p.media_urls, []),
  }
}

/** Version courante (mémoïsée VERSION_TTL_MS par isolate, requêtes dédupliquées). */
export async function getContentVersion(db: D1Database | undefined): Promise<string> {
  if (!db) return cachedVersion
  if (Date.now() - versionCheckedAt < VERSION_TTL_MS) return cachedVersion
  if (!versionPromise) {
    versionPromise = (async () => {
      try {
        const row = await db
          .prepare('SELECT value FROM site_settings WHERE key = ?')
          .bind(CONTENT_VERSION_KEY)
          .first<{ value: string }>()
        cachedVersion = row?.value || '0'
      } catch {
        // Table absente (base locale vierge) : on garde la dernière valeur connue.
      }
      versionCheckedAt = Date.now()
      return cachedVersion
    })().finally(() => { versionPromise = null })
  }
  return versionPromise
}

/** À appeler après toute écriture qui change un contenu visible publiquement. */
export async function bumpContentVersion(db: D1Database | undefined): Promise<void> {
  if (!db) return
  const next = String(Date.now())
  try {
    await db
      .prepare(`INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
      .bind(CONTENT_VERSION_KEY, next)
      .run()
    cachedVersion = next
    versionCheckedAt = Date.now()
  } catch (e) {
    console.warn('[catalog] bumpContentVersion a échoué:', (e as Error)?.message)
  }
}

/** Recharge le tableau `products` (en place) depuis D1. */
export async function reloadCatalog(db: D1Database): Promise<void> {
  const { results } = await db.prepare('SELECT * FROM products').all()
  const fresh = (results || []).map(mapProductRow)
  products.length = 0
  products.push(...fresh)
}

/**
 * Garantit que `products` correspond à la version de contenu courante.
 * Coût normal : zéro requête (version mémoïsée) ; une requête légère toutes les 5 s.
 */
export async function ensureCatalogFresh(db: D1Database | undefined, opts: { force?: boolean } = {}): Promise<void> {
  if (!db) return
  const version = await getContentVersion(db)
  if (!opts.force && catalogVersion === version && products.length > 0) return
  if (!catalogPromise) {
    catalogPromise = reloadCatalog(db)
      .then(() => { catalogVersion = version })
      .catch((e) => console.error('[catalog] rechargement échoué:', e))
      .finally(() => { catalogPromise = null })
  }
  await catalogPromise
}

/** Réservé aux tests. */
export function __resetCatalogStateForTests() {
  cachedVersion = '0'
  versionCheckedAt = 0
  versionPromise = null
  catalogVersion = null
  catalogPromise = null
}
