// Catalogue : produits, stock, images, médiathèque, bannières, marques, API produits
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import { SITE_URL } from '../../types'
import { AdminBannersPage } from '../../pages/banners'
import { products } from '../../data/products'
import { gallerySelectColumns, parseGallery, saveProductGallery } from '../../utils/productGallery'
import {
  getProducts
} from '../../db'
import {
  sanitizeText,
  validateImageMagicBytes
} from '../../utils/helpers'
import {
  notifyAdmin
} from '../../utils/notifications'
import {
  analyserClasseur,
  cleProduit,
  MAX_LIGNES_PAR_LOT
} from '../../utils/importProduits'
import type { ChampCible,ChampsProduit,ProduitDerive } from '../../utils/importProduits'
import {
  rateLimitD1,
  logAdminAudit,
  timingSafeEqualStr,
  getAdminSecret
} from '../../utils/security'
import { BannerRepository } from '../../repositories/banner.repository'
import { adminAuth, refreshAdminCache } from './shared'

export const adminCatalogueRouter = new Hono<HonoEnv>()

async function logStockMovement(db: any, productId: number, productName: string, type: string, quantity: number, stockBefore: number, stockAfter: number, reason: string = '', reference: string = '') {
  try {
    await ensureStockMovements(db)
    await db.prepare('INSERT INTO stock_movements (product_id, product_name, movement_type, quantity, stock_before, stock_after, reason, reference) VALUES (?,?,?,?,?,?,?,?)').bind(productId, productName, type, quantity, stockBefore, stockAfter, reason, reference).run()
  } catch(_) {}
}

interface CorpsImportProduits {
  mode?: ModeImport
  feuille?: string
  lignes?: any[][]
  mapping?: Record<string, ChampCible | null>
  corrections?: Record<string, Record<string, unknown>>
  indexEntete?: number
  decalageLigne?: number
  strategieDoublon?: StrategieDoublon
}

// Champ du moteur -> colonne SQL.
//
// `image`, `imageUrl` et `image_url` sont volontairement absents de cette liste :
// les visuels sont hors perimetre de l'import, donc une photo ajoutee a la main
// doit survivre a tout re-import. C'est l'un des deux modes de defaillance
// dangereux d'un upsert ; l'autre est traite par `apporteValeur` plus bas.
const COLONNES_IMPORT: Array<[keyof ChampsProduit, string]> = [
  ['nom', 'name'],
  ['marque', 'brand'],
  ['modele', 'model'],
  ['categorie', 'category'],
  ['puissanceBtu', 'btu'],
  ['prixFcfa', 'price'],
  ['prixGrossisteFcfa', 'price_wholesale'],
  ['stockInitial', 'stock'],
  ['classeEnergie', 'energy_class'],
  ['surfaceMin', 'surface_min'],
  ['surfaceMax', 'surface_max'],
  ['inverter', 'inverter'],
  ['disponible', 'available'],
  ['description', 'description'],
  ['mentions', 'features'],
  ['refrigerant', 'refrigerant'],
  ['compresseur', 'compressor'],
  ['garantie', 'warranty']
]

// Regle de non-ecrasement, appliquee au seul UPDATE : une colonne n'est touchee
// que si l'import apporte reellement quelque chose.
//   - origine 'fichier' ou 'deduit' -> la valeur vient du tableau importe, elle ecrit ;
//   - origine 'defaut' -> valeur de repli ('A++', 'Mural/Split', garantie
//     standard, stock 0). Elle n'ecrase jamais une saisie manuelle : sans cela,
//     une liste de tarifs ne portant que des prix remettrait a zero le stock et
//     effacerait descriptions et caracteristiques du catalogue.
function apporteValeur(champ: keyof ChampsProduit, produit: ProduitDerive): boolean {
  const origine = produit.origines[champ]
  if (origine !== 'fichier' && origine !== 'deduit') return false
  return valeurSqlImport(champ, produit.champs) !== null
}

// ============================================================
// IMAGE SIZE LIMITS - Centralized configuration
// ============================================================
const IMAGE_SIZE_LIMITS = {
  PRODUCT_IMAGE: 500 * 1024,       // 500 KB
  GALLERY_IMAGE: 5 * 1024 * 1024,  // 5 MB
  MOBILE_UPLOAD: 10 * 1024 * 1024, // 10 MB
  BRAND_MEDIA: 10 * 1024 * 1024    // 10 MB
} as const
 // 1 minute window

function checkImageUploadRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = imageUploadRateLimit.get(identifier)
  
  if (!entry || now > entry.resetAt) {
    imageUploadRateLimit.set(identifier, { count: 1, resetAt: now + IMAGE_UPLOAD_WINDOW })
    return { allowed: true, remaining: IMAGE_UPLOAD_MAX - 1 }
  }
  
  if (entry.count >= IMAGE_UPLOAD_MAX) {
    return { allowed: false, remaining: 0 }
  }
  
  entry.count++
  return { allowed: true, remaining: IMAGE_UPLOAD_MAX - entry.count }
}

// ============================================================
// STORAGE DELETE HELPER (CLOUDFLARE R2)
// ============================================================
async function deleteFromStorage(
  c: { env: any },
  imageUrlOrKey?: string
): Promise<boolean> {
  if (!imageUrlOrKey || typeof imageUrlOrKey !== 'string') return false
  const r2 = c.env?.IMAGES_BUCKET
  if (!r2) return false
  let key = imageUrlOrKey
  if (key.includes('/media/')) {
    key = key.split('/media/')[1]
  }
  if (!key || key.includes('..')) return false
  try {
    await r2.delete(key)
    return true
  } catch (err) {
    console.warn('R2 delete warning:', err)
    return false
  }
}

// ============================================================
// STORAGE UPLOAD HELPER (CLOUDFLARE R2 STRICT)
// ============================================================
async function uploadToStorage(
  c: { env: any; req: { url: string; header: (name: string) => string | undefined } },
  fileBuffer: ArrayBuffer,
  mimeType: string,
  folder: string = 'uploads'
): Promise<{ url: string; deleteUrl: string }> {
  const r2 = c.env.IMAGES_BUCKET
  if (!r2) {
    throw new Error('Stockage Cloudflare R2 non configuré')
  }

  const ext = mimeType === 'image/png' ? 'png'
    : mimeType === 'image/webp' ? 'webp'
    : mimeType === 'image/gif' ? 'gif'
    : mimeType === 'image/svg+xml' ? 'svg'
    : 'jpg'
  const randomSuffix = Math.random().toString(36).substring(2, 10)
  const key = `${folder}/${Date.now()}-${randomSuffix}.${ext}`
  
  await r2.put(key, fileBuffer, {
    httpMetadata: {
      contentType: mimeType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })
  
  let baseUrl = SITE_URL
  try {
    const parsedUrl = new URL(c.req.url)
    baseUrl = parsedUrl.origin
  } catch (_) {}
  
  const url = `${baseUrl}/media/${key}`
  return { url, deleteUrl: '' }
}

// ============================================================
// MÉDIATHÈQUE CENTRALISÉE PAR MARQUE
// Permet d'uploader des images une fois, taguées par marque,
// puis de les affecter à n'importe quel produit (image principale ou galerie).
// ============================================================

// Helper d'initialisation automatique de la table médiathèque par marque sur D1
async function ensureBrandMediaTable(db: any) {
  if (!db) return
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS brand_media_library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL,
        url TEXT NOT NULL,
        delete_url TEXT,
        label TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run()
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_brand_media_brand ON brand_media_library(brand)`).run()
  } catch (e) {
    console.error('ensureBrandMediaTable error:', e)
  }
}

async function ensureStockMovements(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT DEFAULT '',
      movement_type TEXT NOT NULL DEFAULT 'ajustement',
      quantity INTEGER NOT NULL,
      stock_before INTEGER NOT NULL,
      stock_after INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      reference TEXT DEFAULT '',
      created_by TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now'))
    )`).run()
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_moves_product ON stock_movements(product_id)`).run()
  } catch(_) {}
}

// ============================================================
// IMPORT EN MASSE DE PRODUITS DEPUIS UN TABLEUR
//
// Un seul endpoint, deux modes, servis par le meme moteur
// (src/utils/importProduits.ts) :
//   - 'analyse'   : n'ecrit rien, renvoie ce que le systeme a compris de chaque
//                   ligne (valeurs derivees, origine de chaque champ, alertes,
//                   doublons). Alimente l'apercu.
//   - 'execution' : re-derive depuis les memes donnees brutes, applique les
//                   corrections de l'admin, revalide, puis ecrit.
//
// L'apercu montre donc litteralement ce qui sera enregistre. La version
// precedente dupliquait la validation cote navigateur et cote serveur, avec deux
// copies des referentiels vouees a diverger — et exigeait un fichier modele qui
// n'existe pas dans le depot.
// ============================================================

type ModeImport = 'analyse' | 'execution'

type StrategieDoublon = 'maj' | 'ignorer' | 'creer'

function valeurSqlImport(champ: keyof ChampsProduit, champs: ChampsProduit): any {
  const valeur = champs[champ]
  if (champ === 'mentions') return Array.isArray(valeur) && valeur.length > 0 ? JSON.stringify(valeur) : null
  if (champ === 'inverter' || champ === 'disponible') return valeur ? 1 : 0
  if (typeof valeur === 'string') return valeur.trim() ? valeur : null
  return valeur === undefined ? null : valeur
}

// ============================================================
// IMAGE UPLOAD RATE LIMITING
// ============================================================
const imageUploadRateLimit = new Map<string, { count: number; resetAt: number }>()

const IMAGE_UPLOAD_MAX = 10
 // 10 uploads per window
const IMAGE_UPLOAD_WINDOW = 60000

// ============================================================
// STOCK MOVEMENTS
// ============================================================

// Admin: historique des mouvements de stock
adminCatalogueRouter.get('/api/admin/stock/movements', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  await ensureStockMovements(db)
  const productId = c.req.query('product_id')
  let rows: any[]
  if (productId) {
    rows = (await db.prepare('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 100').bind(parseInt(productId)).all())?.results || []
  } else {
    rows = (await db.prepare('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 200').all())?.results || []
  }
  return c.json(rows)
})

// Admin: ajouter un mouvement de stock manuel
adminCatalogueRouter.post('/api/admin/stock/movement', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)
  const body = await c.req.parseBody()
  const productId = parseInt(body['product_id'] as string || '0')
  const quantity = parseInt(body['quantity'] as string || '0')
  const type = (body['type'] as string || 'ajustement').trim()
  const reason = (body['reason'] as string || '').trim()
  if (!productId || !quantity) return c.redirect('/admin/produits?error=stock_invalide')
  
  // Get current stock
  const product = products.find(p => p.id === productId)
  if (!product) return c.redirect('/admin/produits?error=produit_introuvable')
  const oldStock = product.stock || 0
  const newStock = Math.max(0, oldStock + quantity)
  
  // Update in-memory
  product.stock = newStock
  product.available = newStock > 0
  
  // Log movement
  await logStockMovement(db, productId, product.name, type, quantity, oldStock, newStock, reason)
  
  // Update D1
  try {
    await db.prepare('UPDATE products SET stock = ?, available = ? WHERE id = ?').bind(newStock, newStock > 0 ? 1 : 0, productId).run()
  } catch(_) {}
  
  return c.redirect('/admin/produits?success=stock_modifie')
})

// Admin: produits en stock bas (seuil configurable)
adminCatalogueRouter.get('/api/admin/stock/low', adminAuth, async (c) => {
  const threshold = parseInt(c.req.query('threshold') || '3')
  const lowStock = products.filter(p => p.stock <= threshold && p.stock >= 0)
  return c.json(lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stock, price: p.price })))
})

// ============================================================
// BANNIÈRES & MARQUES — Admin page + CRUD
// ============================================================
adminCatalogueRouter.get('/admin/banners', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let banners: any[] = []
  let brands: any[] = []
  if (db) {
    try {
      const bannerRepo = new BannerRepository(db)
      banners = await bannerRepo.findBanners()
      brands = await bannerRepo.findBrands()
    } catch (_) {}
  }
  const success = c.req.query('success') || undefined
  const error = c.req.query('error') || undefined
  return c.html(<AdminBannersPage banners={banners} brands={brands} success={success} error={error} />)
})

// Upload image générique (utilisé par la page Bannières)
adminCatalogueRouter.post('/api/admin/upload/image', adminAuth, async (c) => {
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = checkImageUploadRateLimit(clientIp)
  if (!rl.allowed) return c.json({ error: 'Trop d\'uploads récents. Attendez 1 minute.' }, 429)
  let file: any = null
  try {
    const form = await c.req.formData()
    file = form.get('image')
  } catch (_) {
    const body = await c.req.parseBody()
    file = body['image']
  }
  if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function' || !file.size) {
    return c.json({ error: 'Fichier image manquant' }, 400)
  }
  if (file.size > IMAGE_SIZE_LIMITS.BRAND_MEDIA) return c.json({ error: 'Image trop volumineuse (max 10 MB)' }, 400)
  const rawType = (file.type || '').toLowerCase()
  const fileType = rawType.startsWith('image/') ? rawType : 'image/jpeg'
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (!validateImageMagicBytes(bytes)) return c.json({ error: 'Format d\'image non valide' }, 400)
  try {
    const r = await uploadToStorage(c, buffer, fileType, 'banners')
    return c.json({ url: r.url, delete_url: r.deleteUrl })
  } catch (e: any) {
    return c.json({ error: 'Upload échoué : ' + (e?.message || 'Erreur') }, 500)
  }
})

// CRUD bannières
adminCatalogueRouter.post('/api/admin/banners/create', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/banners?error=Base+de+données+indisponible')
  const body = await c.req.parseBody()
  const title = sanitizeText(body['title'] as string, 200)
  const subtitle = sanitizeText(body['subtitle'] as string, 300) || undefined
  const image_url = (body['image_url'] as string || '').trim()
  const target_page = (body['target_page'] as string || '').trim() || undefined
  const display_order = parseInt(body['display_order'] as string) || 0
  const is_active = body['is_active'] ? 1 : 0
  if (!title) return c.redirect('/admin/banners?error=Titre+requis')
  if (!image_url) return c.redirect('/admin/banners?error=Image+requise')
  try {
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.createBanner({ title, subtitle, image_url, target_page, display_order, is_active })
    return c.redirect('/admin/banners?success=Bannière+créée')
  } catch (e: any) {
    return c.redirect('/admin/banners?error=' + encodeURIComponent(e?.message || 'Erreur'))
  }
})

adminCatalogueRouter.post('/api/admin/banners/:id/update', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/banners?error=Base+de+données+indisponible')
  const id = parseInt(c.req.param('id'))
  const body = await c.req.parseBody()
  const title = sanitizeText(body['title'] as string, 200)
  const subtitle = sanitizeText(body['subtitle'] as string, 300) || undefined
  const image_url = (body['image_url'] as string || '').trim()
  const target_page = (body['target_page'] as string || '').trim() || undefined
  const display_order = parseInt(body['display_order'] as string) || 0
  const is_active = body['is_active'] ? 1 : 0
  try {
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.updateBanner(id, { title, subtitle, image_url, target_page, display_order, is_active })
    return c.redirect('/admin/banners?success=Bannière+mise+à+jour')
  } catch (e: any) {
    return c.redirect('/admin/banners?error=' + encodeURIComponent(e?.message || 'Erreur'))
  }
})

adminCatalogueRouter.post('/api/admin/banners/:id/delete', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/banners?error=Base+de+données+indisponible')
  const id = parseInt(c.req.param('id'))
  try {
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.deleteBanner(id)
    return c.redirect('/admin/banners?success=Bannière+supprimée')
  } catch (e: any) {
    return c.redirect('/admin/banners?error=' + encodeURIComponent(e?.message || 'Erreur'))
  }
})

// CRUD marques
adminCatalogueRouter.post('/api/admin/brands/create', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/banners?error=Base+de+données+indisponible')
  const body = await c.req.parseBody()
  const name = sanitizeText((body['name'] as string || '').toUpperCase(), 100)
  const logo_url = (body['logo_url'] as string || '').trim() || undefined
  const asset_key = sanitizeText(body['asset_key'] as string, 100) || undefined
  const display_order = parseInt(body['display_order'] as string) || 0
  const is_active = body['is_active'] ? 1 : 0
  if (!name) return c.redirect('/admin/banners?error=Nom+requis')
  try {
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.createBrand({ name, logo_url, asset_key, display_order, is_active })
    return c.redirect('/admin/banners?success=Marque+créée')
  } catch (e: any) {
    return c.redirect('/admin/banners?error=' + encodeURIComponent(e?.message || 'Erreur'))
  }
})

adminCatalogueRouter.post('/api/admin/brands/:id/update', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/banners?error=Base+de+données+indisponible')
  const id = parseInt(c.req.param('id'))
  const body = await c.req.parseBody()
  const name = sanitizeText((body['name'] as string || '').toUpperCase(), 100)
  const logo_url = (body['logo_url'] as string || '').trim() || undefined
  const asset_key = sanitizeText(body['asset_key'] as string, 100) || undefined
  const display_order = parseInt(body['display_order'] as string) || 0
  const is_active = body['is_active'] ? 1 : 0
  try {
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.updateBrand(id, { name, logo_url, asset_key, display_order, is_active })
    return c.redirect('/admin/banners?success=Marque+mise+à+jour')
  } catch (e: any) {
    return c.redirect('/admin/banners?error=' + encodeURIComponent(e?.message || 'Erreur'))
  }
})

adminCatalogueRouter.post('/api/admin/brands/:id/delete', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/banners?error=Base+de+données+indisponible')
  const id = parseInt(c.req.param('id'))
  try {
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.deleteBrand(id)
    return c.redirect('/admin/banners?success=Marque+supprimée')
  } catch (e: any) {
    return c.redirect('/admin/banners?error=' + encodeURIComponent(e?.message || 'Erreur'))
  }
})

adminCatalogueRouter.post('/api/admin/produit/add', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const rawName = (body['name'] as string || '').trim()
  const rawBrand = (body['brand'] as string || '').trim()
  const rawModel = (body['model'] as string || '').trim()
  if (!rawName || !rawBrand) {
    return c.redirect('/admin/produits?error=' + encodeURIComponent('Nom et marque du produit sont requis.'))
  }
  const name = sanitizeText(rawName, 200)
  const brand = sanitizeText(rawBrand, 120)
  const model = sanitizeText(rawModel, 120)
  const btu = parseInt(body['btu'] as string) || 12000
  const price = parseInt(body['price'] as string) || 0
  const stock = parseInt(body['stock'] as string) || 0
  const surface_min = parseInt(body['surface_min'] as string) || 10
  const surface_max = parseInt(body['surface_max'] as string) || 25
  const energy_class = (body['energy_class'] as string) || 'A++'
  const description = sanitizeText(body['description'], 3000)
  const inverter = !!body['inverter']
  const available = stock > 0
  
  // Parse features JSON
  let features: string[] = []
  try {
    const featuresJson = body['features_json'] as string
    features = featuresJson ? JSON.parse(featuresJson) : []
  } catch (e) {
    features = []
  }

  // Parse tech specs
  const techSpecsFields = ['power_source','cooling_capacity','cooling_input_power','nominal_cooling_current',
    'max_input_consumption','max_current','starting_current','compressor_type',
    'indoor_airflow','indoor_noise','refrigerant_type','design_pressure','operating_temp','ambient_temp_cooling']
  const techSpecs: Record<string, string> = {}
  techSpecsFields.forEach(f => {
    const val = (body[f] as string || '').trim()
    if (val) techSpecs[f] = val
  })
  const techSpecsJson = Object.keys(techSpecs).length > 0 ? JSON.stringify(techSpecs) : null
  let imageUrl = ''
  const file = body['image'] as File | null
  if (file && file instanceof File && file.size > 0) {
    // Limit image size to 500KB to prevent bloating D1
    if (file.size > IMAGE_SIZE_LIMITS.PRODUCT_IMAGE) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Image trop grande (max 500 KB). Compressez-la avant upload.'))
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.'))
    }
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // Validate magic bytes to prevent spoofed Content-Type
    if (!validateImageMagicBytes(bytes)) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Le fichier ne semble pas être une image valide.'))
    }
    // Upload vers Cloudflare R2
    try {
      const r2 = await uploadToStorage(c, buffer, file.type, 'produits')
      imageUrl = r2.url
    } catch(uploadErr2) {
      console.error('Upload error (create):', uploadErr2)
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Upload image échoué.'))
    }
  }

  // Parse media JSON
  let media: any[] = []
  try {
    const mediaJson = body['media_json'] as string
    media = mediaJson ? JSON.parse(mediaJson) : []
  } catch (e) {
    media = []
  }

  // Écrire en D1 d'abord : l'identifiant vient de l'AUTOINCREMENT, pas d'un
  // Math.max sur le cache mémoire (partiel et par isolate, donc source de
  // collisions d'id) ; le produit n'est mis en cache qu'en cas de succès.
  const db = c.env.DB
  let newId = 0
  if (db) {
    try {
      const res = await db.prepare(`
        INSERT INTO products (name, brand, model, btu, price, stock, surface_min, surface_max, energy_class, description, inverter, available, warranty, features, image, imageUrl, tech_specs, media_urls)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        name, brand, model, btu, price, stock, surface_min, surface_max, energy_class,
        description, inverter ? 1 : 0, available ? 1 : 0, '1 an constructeur',
        features.length > 0 ? JSON.stringify(features) : null,
        '❄️', imageUrl || null, techSpecsJson,
        media.length > 0 ? JSON.stringify(media) : null
      ).run()
      newId = Number(res?.meta?.last_row_id || 0)
    } catch (error) {
      console.error('Erreur D1 produit add:', error)
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Enregistrement impossible (base de données)'))
    }
  }
  if (!newId) newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1

  const newProduct: any = {
    id: newId,
    name, brand, model, btu, price, price_install: 0, stock,
    surface_min, surface_max, energy_class, description,
    inverter, available,
    image: '❄️',
    imageUrl,
    features,
    warranty: '1 an constructeur',
    techSpecs: Object.keys(techSpecs).length > 0 ? techSpecs : undefined,
    media: media.length > 0 ? media : undefined
  }
  products.push(newProduct)

  await notifyAdmin((c as any).env, 'product', `${name} — ${brand}, ${btu.toLocaleString()} BTU — ${price.toLocaleString()} FCFA (stock: ${stock})`)
  return c.redirect('/admin/produits?success=1')
})

adminCatalogueRouter.post('/api/admin/produits/import', adminAuth, async (c) => {
  const body = await c.req.json<CorpsImportProduits>().catch(() => null)
  if (!body || typeof body !== 'object') {
    return c.json({ succes: false, message: 'Corps de requête illisible.' }, 400)
  }

  const mode: ModeImport = body.mode === 'execution' ? 'execution' : 'analyse'
  const lignesBrutes = Array.isArray(body.lignes) ? body.lignes : []
  if (lignesBrutes.length === 0) {
    return c.json({ succes: false, message: 'Aucune ligne reçue.' }, 400)
  }
  // Marge au-dessus du plafond : l'UI renvoie les lignes d'en-tête avec chaque
  // lot pour que la détection reste serveur. Le vrai plafond porte sur les
  // lignes de données, vérifié après analyse.
  if (lignesBrutes.length > MAX_LIGNES_PAR_LOT + 20) {
    return c.json({ succes: false, message: `Maximum ${MAX_LIGNES_PAR_LOT} lignes par lot.` }, 400)
  }

  const db = c.env.DB
  if (!db) {
    return c.json({ succes: false, message: 'Base de données indisponible.' }, 500)
  }

  const analyse = analyserClasseur(lignesBrutes, {
    mapping: body.mapping && typeof body.mapping === 'object' ? body.mapping : undefined,
    corrections: body.corrections && typeof body.corrections === 'object' ? body.corrections : undefined,
    indexEntete: typeof body.indexEntete === 'number' ? body.indexEntete : undefined,
    decalageLigne: typeof body.decalageLigne === 'number' && body.decalageLigne > 0 ? Math.floor(body.decalageLigne) : 0
  })

  if (analyse.nbLignesDonnees > MAX_LIGNES_PAR_LOT) {
    return c.json({ succes: false, message: `Maximum ${MAX_LIGNES_PAR_LOT} lignes de données par lot.` }, 400)
  }

  // Rapprochement des doublons : une seule lecture du catalogue, puis une Map en
  // mémoire — pas une requête par ligne.
  const existants = new Map<string, { id: number; nom: string }>()
  try {
    const res = await db.prepare('SELECT id, name, brand, model, btu FROM products').all()
    for (const r of ((res as any)?.results || []) as any[]) {
      const cle = cleProduit(r.brand, r.btu, r.model, r.name)
      if (!existants.has(cle)) existants.set(cle, { id: Number(r.id), nom: String(r.name || '') })
    }
  } catch (err) {
    console.error('Erreur lecture du catalogue pour import:', err)
    return c.json({ succes: false, message: 'Lecture du catalogue impossible.' }, 500)
  }

  const strategie: StrategieDoublon =
    body.strategieDoublon === 'ignorer' || body.strategieDoublon === 'creer' ? body.strategieDoublon : 'maj'

  // Rapprochement, plus détection des doublons internes au fichier : deux lignes
  // identiques dans le même tableau ne doivent pas créer deux fiches.
  const vues = new Set<string>()
  const preparees = analyse.produits.map((produit) => {
    const cle = cleProduit(produit.champs.marque, produit.champs.puissanceBtu, produit.champs.modele, produit.champs.nom)
    const existant = existants.get(cle) || null
    const doublonFichier = vues.has(cle)
    vues.add(cle)
    return { produit, existant, doublonFichier }
  })

  if (mode === 'analyse') {
    let aCreer = 0
    let aMettreAJour = 0
    let enErreur = 0
    const produits = preparees.map(({ produit, existant, doublonFichier }) => {
      const bloque = produit.erreurs.length > 0
      if (bloque) enErreur++
      else if (doublonFichier) enErreur++
      else if (existant) aMettreAJour++
      else aCreer++
      return {
        ligne: produit.ligne,
        champs: produit.champs,
        origines: produit.origines,
        alertes: doublonFichier
          ? produit.alertes.concat('Ligne déjà présente plus haut dans le fichier : elle sera ignorée.')
          : produit.alertes,
        erreurs: produit.erreurs,
        doublon: existant ? { id: existant.id, nom: existant.nom } : null
      }
    })
    return c.json({
      succes: true,
      mode: 'analyse',
      feuille: sanitizeText(body.feuille, 120) || null,
      indexEntete: analyse.indexEntete,
      nbLignesDonnees: analyse.nbLignesDonnees,
      colonnes: analyse.colonnes,
      avertissements: analyse.avertissements,
      produits,
      resume: { total: produits.length, aCreer, aMettreAJour, enErreur }
    })
  }

  // ---------- mode execution ----------

  const maintenant = new Date().toISOString()
  const nomsColonnes = COLONNES_IMPORT.map(([, colonne]) => colonne)
  const sqlInsert = `INSERT INTO products (${nomsColonnes.join(', ')}, image, created_at, updated_at)
    VALUES (${nomsColonnes.map(() => '?').join(', ')}, ?, ?, ?)`
  const stmtInsert = db.prepare(sqlInsert)

  const batch: any[] = []
  const erreurs: Array<{ ligne: number; messages: string[] }> = []
  const ignorees: Array<{ ligne: number; raison: string }> = []
  let crees = 0
  let misAJour = 0

  for (const { produit, existant, doublonFichier } of preparees) {
    if (produit.erreurs.length > 0) {
      erreurs.push({ ligne: produit.ligne, messages: produit.erreurs })
      continue
    }
    if (doublonFichier) {
      ignorees.push({ ligne: produit.ligne, raison: 'Doublon dans le fichier importé.' })
      continue
    }

    if (existant && strategie === 'ignorer') {
      ignorees.push({ ligne: produit.ligne, raison: `Déjà au catalogue (fiche #${existant.id}), conservée telle quelle.` })
      continue
    }

    if (existant && strategie === 'maj') {
      const colonnes: string[] = []
      const valeurs: any[] = []
      for (const [champ, colonne] of COLONNES_IMPORT) {
        if (!apporteValeur(champ, produit)) continue
        colonnes.push(`${colonne} = ?`)
        valeurs.push(valeurSqlImport(champ, produit.champs))
      }
      if (colonnes.length === 0) {
        ignorees.push({ ligne: produit.ligne, raison: `Fiche #${existant.id} inchangée : le fichier n'apporte aucune valeur.` })
        continue
      }
      colonnes.push('updated_at = ?')
      valeurs.push(maintenant)
      valeurs.push(existant.id)
      batch.push(db.prepare(`UPDATE products SET ${colonnes.join(', ')} WHERE id = ?`).bind(...valeurs))
      misAJour++
      continue
    }

    // Création : les valeurs de repli ont ici toute leur place, c'est ce qui
    // permet à un simple libellé + prix de produire une fiche complète.
    const valeurs = COLONNES_IMPORT.map(([champ]) => valeurSqlImport(champ, produit.champs))
    batch.push(stmtInsert.bind(...valeurs, '❄️', maintenant, maintenant))
    crees++
  }

  if (batch.length === 0) {
    return c.json({
      succes: false,
      mode: 'execution',
      message: erreurs.length > 0
        ? 'Aucune ligne exploitable : rien n\'a été enregistré.'
        : 'Rien à enregistrer : toutes les lignes étaient déjà au catalogue.',
      crees: 0,
      misAJour: 0,
      ignorees,
      erreurs,
      avertissements: analyse.avertissements
    }, erreurs.length > 0 ? 422 : 200)
  }

  try {
    // db.batch est transactionnel côté D1 : tout ou rien.
    await db.batch(batch)
  } catch (err) {
    console.error('Erreur import produits:', err)
    return c.json({ succes: false, message: "Erreur serveur pendant l'écriture. Rien n'a été enregistré." }, 500)
  }

  // Un upsert ne peut pas être reflété par un products.push (il dupliquerait les
  // fiches mises à jour en mémoire) : on invalide le cache, refreshAdminCache
  // rechargera depuis D1 au prochain GET.
  // Invalidation : gérée par le middleware content_version (src/index.tsx)

  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  await logAdminAudit(db, {
    action: 'import_produits',
    detail: JSON.stringify({
      feuille: sanitizeText(body.feuille, 120) || null,
      lignes: analyse.nbLignesDonnees,
      crees,
      maj: misAJour,
      ignores: ignorees.length,
      erreurs: erreurs.length
    }),
    ip,
    userAgent: c.req.header('User-Agent') || ''
  })

  const parts: string[] = []
  if (crees > 0) parts.push(`${crees} créé(s)`)
  if (misAJour > 0) parts.push(`${misAJour} mis à jour`)
  if (ignorees.length > 0) parts.push(`${ignorees.length} ignoré(s)`)
  if (erreurs.length > 0) parts.push(`${erreurs.length} en erreur`)

  await notifyAdmin((c as any).env, 'product', `Import en masse : ${parts.join(', ')}.`)

  return c.json({
    succes: true,
    mode: 'execution',
    crees,
    misAJour,
    ignorees,
    erreurs,
    avertissements: analyse.avertissements,
    message: `Import terminé : ${parts.join(', ')}.` + (crees > 0 ? ' Pense à ajouter les photos depuis chaque fiche produit.' : '')
  })
})

// API Admin - Modifier un produit
adminCatalogueRouter.post('/api/admin/produit/update', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const productIndex = products.findIndex(p => p.id === id)
  
  if (productIndex === -1) {
    return c.redirect('/admin/produits?error=notfound')
  }
  
  const name = (body['name'] as string || '').trim()
  const brand = (body['brand'] as string || '').trim()
  const model = (body['model'] as string || '').trim()
  const btu = parseInt(body['btu'] as string) || 12000
  const price = parseInt(body['price'] as string) || 0
  const stock = parseInt(body['stock'] as string) || 0
  const surface_min = parseInt(body['surface_min'] as string) || 10
  const surface_max = parseInt(body['surface_max'] as string) || 25
  const energy_class = (body['energy_class'] as string) || 'A++'
  const description = (body['description'] as string || '').trim()
  const inverter = !!body['inverter']
  const available = stock > 0
  
  // Parse features JSON
  let features: string[] = []
  try {
    const featuresJson = body['features_json'] as string
    features = featuresJson ? JSON.parse(featuresJson) : []
  } catch (e) {
    features = products[productIndex].features
  }

  // Parse tech specs
  const techSpecsFields2 = ['power_source','cooling_capacity','cooling_input_power','nominal_cooling_current',
    'max_input_consumption','max_current','starting_current','compressor_type',
    'indoor_airflow','indoor_noise','refrigerant_type','design_pressure','operating_temp','ambient_temp_cooling']
  const techSpecs2: Record<string, string> = {}
  techSpecsFields2.forEach(f => {
    const val = (body[f] as string || '').trim()
    if (val) techSpecs2[f] = val
  })
  const techSpecsJson2 = Object.keys(techSpecs2).length > 0 ? JSON.stringify(techSpecs2) : null
  
  // Parse media JSON et uploader les nouvelles images (data: URLs) vers Cloudflare R2.
  // Les items dont l'URL est déjà HTTPS sont conservés tels quels — aucun
  // blob base64 n'est jamais écrit en D1, ce qui évite de dépasser la limite
  // de taille de ligne SQLite et de dégrader les performances de lecture.
  let media: any[] = []
  try {
    const mediaJson = body['media_json'] as string
    if (mediaJson) {
      const parsed = JSON.parse(mediaJson)
      if (!Array.isArray(parsed)) throw new Error('media_json doit être un tableau')
      for (const item of parsed) {
        if (typeof item.url === 'string' && item.url.startsWith('data:image/')) {
          try {
            const base64Data = item.url.split(',')[1]
            const mimeMatch = item.url.match(/data:(image\/[^;]+)/)
            const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
            const binaryStr = atob(base64Data)
            const bytes = new Uint8Array(binaryStr.length)
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
            const result = await uploadToStorage(c, bytes.buffer, mime, 'produits/galerie')
            media.push({ type: 'image', url: result.url, deleteUrl: result.deleteUrl, caption: item.caption || '' })
          } catch (uploadErr) {
            console.error('Upload for media item failed:', uploadErr)
          }
        } else {
          // URL HTTPS déjà hébergée (Cloudflare R2 ou autre) : conserver l'item intact
          media.push(item)
        }
      }
    } else {
      // Aucun media_json envoyé : conserver les médias existants du produit
      media = products[productIndex].media || []
    }
  } catch (e) {
    media = products[productIndex].media || []
  }

  products[productIndex] = {
    ...products[productIndex],
    name, brand, model, btu, price, stock,
    surface_min, surface_max, energy_class, description,
    inverter, available, features,
    techSpecs: Object.keys(techSpecs2).length > 0 ? techSpecs2 : undefined,
    media: media.length > 0 ? media : undefined
  }

  // Écrire en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      // Log stock movement if stock changed
      const oldStock = products[productIndex].stock || 0
      if (stock !== oldStock) {
        const diff = stock - oldStock
        const mvtType = diff > 0 ? 'entree' : (diff < 0 ? 'sortie' : 'ajustement')
        await logStockMovement(db, id, name, mvtType, diff, oldStock, stock, 'Modification manuelle admin')
      }
      await db.prepare(`
        UPDATE products
        SET name=?, brand=?, model=?, btu=?, price=?, stock=?, 
            surface_min=?, surface_max=?, energy_class=?, description=?, 
            inverter=?, available=?, features=?, tech_specs=?, media_urls=?
        WHERE id = ?
      `).bind(
        name, brand, model, btu, price, stock,
        surface_min, surface_max, energy_class, description,
        inverter ? 1 : 0, available ? 1 : 0,
        features.length > 0 ? JSON.stringify(features) : null,
        techSpecsJson2,
        media.length > 0 ? JSON.stringify(media) : null,
        id
      ).run()
    } catch (error) {
      console.error('Erreur D1 produit update:', error)
    }
  }
  
  return c.redirect('/admin/produits?success=1')
})

// API Admin - Supprimer un produit
adminCatalogueRouter.post('/api/admin/produit/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = products.findIndex(p => p.id === id)
  if (idx !== -1) products.splice(idx, 1)
  
  // Supprimer les images Cloudflare R2 du produit si elles existent
  try {
    const dbForDel = c.env.DB
    if (dbForDel) {
      const prod = await dbForDel.prepare('SELECT imageUrl, media_urls FROM products WHERE id = ?').bind(id).first() as any
      if (prod?.imageUrl) {
        await deleteFromStorage(c, prod.imageUrl)
      }
      if (prod?.media_urls) {
        try {
          const mediaList = JSON.parse(prod.media_urls)
          if (Array.isArray(mediaList)) {
            for (const m of mediaList) {
              if (m?.url) await deleteFromStorage(c, m.url)
            }
          }
        } catch (_) {}
      }
    }
  } catch(e) { console.warn('R2 delete warning:', e) }

  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 produit delete:', error)
    }
  }

  // Invalider le cache en mémoire pour forcer un rechargement depuis D1
  // au prochain démarrage d'isolate — garantit qu'un produit supprimé ne
  // réapparaît pas après un redéploiement ou une mise en veille du Worker.
  // Invalidation : gérée par le middleware content_version (src/index.tsx)
  
  return c.redirect('/admin/produits?deleted=1')
})

// API Admin - Uploader/changer l'image d'un produit
adminCatalogueRouter.post('/api/admin/produit/image', adminAuth, async (c) => {
  // Rate limiting for image uploads
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rateLimit = checkImageUploadRateLimit(clientIp)
  if (!rateLimit.allowed) {
    return c.json({ error: 'Trop d\'uploads récents. Attendez 1 minute.' }, 429)
  }
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const file = body['image'] as File | null
  if (file && file instanceof File && file.size > 0) {
    // Limit image size to 500KB
    if (file.size > IMAGE_SIZE_LIMITS.PRODUCT_IMAGE) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Image trop grande (max 500 KB).'))
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Type non autorisé. Utilisez JPEG, PNG ou WebP.'))
    }
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // Validate magic bytes to prevent spoofed Content-Type
    if (!validateImageMagicBytes(bytes)) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Le fichier ne semble pas être une image valide.'))
    }
    // Upload vers Cloudflare R2
    let uploadedUrl = ''
    try {
      const r1 = await uploadToStorage(c, buffer, file.type, 'produits')
      uploadedUrl = r1.url
    } catch(uploadErr) {
      console.error('Image upload error:', uploadErr)
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Upload image échoué.'))
    }
    const db = c.env.DB
    if (db) {
      try {
        const oldProd = await db.prepare('SELECT imageUrl FROM products WHERE id = ?').bind(id).first() as any
        const res = await db.prepare('UPDATE products SET imageUrl = ? WHERE id = ?').bind(uploadedUrl, id).run()
        if (!res?.meta?.changes) {
          return c.redirect('/admin/produits?error=' + encodeURIComponent('Produit introuvable.'))
        }
        if (oldProd?.imageUrl && oldProd.imageUrl !== uploadedUrl) {
          await deleteFromStorage(c, oldProd.imageUrl)
        }
      } catch(e) {
        console.error('Erreur D1 produit image:', e)
        return c.redirect('/admin/produits?error=' + encodeURIComponent('Enregistrement image impossible.'))
      }
    }
    const product = products.find(p => p.id === id)
    if (product) { (product as any).imageUrl = uploadedUrl }
    else if (!db) return c.redirect('/admin/produits?error=' + encodeURIComponent('Produit introuvable.'))
  }
  
  return c.redirect('/admin/produits?success=1')
})

// ============================================================
// API GALERIE PRODUIT — ajouter/supprimer une image Cloudflare R2
// ============================================================

// Ajouter une image a la galerie d'un produit
adminCatalogueRouter.post('/api/admin/produit/gallery/add', adminAuth, async (c) => {
  // Rate limiting for image uploads
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rateLimit = checkImageUploadRateLimit(clientIp)
  if (!rateLimit.allowed) {
    return c.json({ error: 'Trop d\'uploads récents. Attendez 1 minute.' }, 429)
  }
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const file = body['image'] as File | null
  if (!file || !(file instanceof File) || file.size === 0) return c.json({ error: 'Fichier manquant' }, 400)
  if (file.size > IMAGE_SIZE_LIMITS.GALLERY_IMAGE) return c.json({ error: 'Image trop grande (max 5 MB)' }, 400)
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) return c.json({ error: 'Format non autorise' }, 400)
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  // Validate magic bytes before upload
  if (!validateImageMagicBytes(bytes)) {
    return c.json({ error: 'Format d\'image non valide' }, 400)
  }
  let imgUrl = '', imgDelUrl = ''
  try {
    const r = await uploadToStorage(c, buffer, file.type, 'produits/galerie')
    imgUrl = r.url; imgDelUrl = r.deleteUrl
  } catch(e) { return c.json({ error: 'Upload image échoué' }, 500) }
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB indisponible' }, 500)
  try {
    const row = await db.prepare('SELECT media_urls FROM products WHERE id = ?').bind(id).first() as any
    let gallery: any[] = []
    try { gallery = JSON.parse(row?.media_urls || '[]') } catch(_) {}
    gallery.push({ url: imgUrl, deleteUrl: imgDelUrl, type: 'image' })
    await db.prepare('UPDATE products SET media_urls = ? WHERE id = ?').bind(JSON.stringify(gallery), id).run()
    return c.json({ success: true, url: imgUrl, deleteUrl: imgDelUrl, gallery })
  } catch(e) {
    console.error('Gallery add error:', e)
    return c.json({ error: 'Erreur DB' }, 500)
  }
})

// Supprimer une image de la galerie d'un produit
adminCatalogueRouter.post('/api/admin/produit/gallery/remove', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const urlToRemove = body['url'] as string
  const deleteUrl = body['delete_url'] as string
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB indisponible' }, 500)
  try {
    const row = await db.prepare('SELECT media_urls FROM products WHERE id = ?').bind(id).first() as any
    let gallery: any[] = []
    try { gallery = JSON.parse(row?.media_urls || '[]') } catch(_) {}
    gallery = gallery.filter((item: any) => item.url !== urlToRemove)
    await db.prepare('UPDATE products SET media_urls = ? WHERE id = ?').bind(JSON.stringify(gallery), id).run()
    // Supprimer de Cloudflare R2
    if (urlToRemove) {
      await deleteFromStorage(c, urlToRemove)
    }
    return c.json({ success: true, gallery })
  } catch(e) {
    console.error('Gallery remove error:', e)
    return c.json({ error: 'Erreur DB' }, 500)
  }
})

// GET galerie d'un produit (pour le modal JS)
adminCatalogueRouter.get('/api/admin/produit/gallery/:id', adminAuth, async (c) => {
  const id = parseInt(c.req.param('id'))
  const db = c.env.DB
  if (!db) return c.json({ gallery: [] })
  try {
    const row = await db.prepare('SELECT media_urls FROM products WHERE id = ?').bind(id).first() as any
    let gallery: any[] = []
    try { gallery = JSON.parse(row?.media_urls || '[]') } catch(_) {}
    return c.json({ gallery })
  } catch(e) {
    return c.json({ gallery: [] })
  }
})

// Lister toutes les images (optionnel : filtrer par brand)
adminCatalogueRouter.get('/api/admin/media/brand', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ images: [] })
  await ensureBrandMediaTable(db)
  const brand = c.req.query('brand') || ''
  try {
    const sql = brand
      ? 'SELECT * FROM brand_media_library WHERE brand = ? ORDER BY created_at DESC'
      : 'SELECT * FROM brand_media_library ORDER BY brand ASC, created_at DESC'
    const res = brand
      ? await db.prepare(sql).bind(brand).all()
      : await db.prepare(sql).all()
    return c.json({ images: (res as any)?.results || [] })
  } catch (e) {
    console.error('GET brand_media_library error:', e)
    return c.json({ images: [] })
  }
})

// Uploader une image dans la médiathèque (taguée par marque)
adminCatalogueRouter.post('/api/admin/media/brand/upload', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Base de données D1 indisponible' }, 500)
  await ensureBrandMediaTable(db)

  let brand = ''
  let label = ''
  let file: any = null

  try {
    const form = await c.req.formData()
    brand = sanitizeText(form.get('brand') as string, 120)
    label = sanitizeText(form.get('label') as string, 200) || ''
    file = form.get('image')
  } catch (e) {
    const body = await c.req.parseBody()
    brand = sanitizeText(body['brand'] as string, 120)
    label = sanitizeText(body['label'] as string, 200) || ''
    file = body['image']
  }

  if (!brand) return c.json({ error: 'Marque requise pour ranger l\'image dans la médiathèque' }, 400)
  if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function' || !file.size) {
    return c.json({ error: 'Fichier image manquant ou corrompu' }, 400)
  }
  if (file.size > IMAGE_SIZE_LIMITS.BRAND_MEDIA) return c.json({ error: 'Image trop volumineuse (max 10 MB)' }, 400)
  
  const rawType = (file.type || '').toLowerCase()
  const fileType = rawType.startsWith('image/') ? rawType : 'image/jpeg'

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  // Validate magic bytes before upload
  if (!validateImageMagicBytes(bytes)) {
    return c.json({ error: 'Format d\'image non valide' }, 400)
  }
  try {
    const safeBrand = encodeURIComponent(brand.toLowerCase().replace(/[^a-z0-9_-]/g, '')) || 'generale'
    const folder = `marques/${safeBrand}`
    const r = await uploadToStorage(c, buffer, fileType, folder)
    await db.prepare(
      'INSERT INTO brand_media_library (brand, url, delete_url, label) VALUES (?, ?, ?, ?)'
    ).bind(brand, r.url, r.deleteUrl, label).run()

    return c.json({ success: true, image: { brand, url: r.url, delete_url: r.deleteUrl, label } })
  } catch (e: any) {
    console.error('Brand media upload error:', e)
    return c.json({ error: 'Upload image échoué : ' + (e?.message || 'Erreur API') }, 500)
  }
})

// Supprimer une image de la médiathèque
adminCatalogueRouter.post('/api/admin/media/brand/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  if (!id) return c.json({ error: 'ID manquant' }, 400)
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB indisponible' }, 500)
  await ensureBrandMediaTable(db)
  try {
    const row = await db.prepare('SELECT url, delete_url FROM brand_media_library WHERE id = ?').bind(id).first() as any
    await db.prepare('DELETE FROM brand_media_library WHERE id = ?').bind(id).run()
    if (row?.url) {
      await deleteFromStorage(c, row.url)
    }
    // Hard delete + nettoyage automatique des références produits (image principale et galerie) pour éviter les références cassées.
    if (row?.url) {
      const url = row.url
      // (a) Image principale : vider imageUrl et image_url (alias) pour tous les produits qui référencent l'URL
      await db.prepare(`UPDATE products SET imageUrl = '', image_url = '', updated_at = ? WHERE imageUrl = ? OR image_url = ?`).bind(new Date().toISOString(), url, url).run()
      // (b) Galerie : retirer l'URL de media_urls et gallery (alias) pour chaque produit concerné
      const rows = await db.prepare(`SELECT id, ${await gallerySelectColumns(db)} FROM products`).all() as any
      for (const p of (rows?.results || [])) {
        const galleryList = parseGallery(p)
        const filtered = galleryList.filter((g: any) => (typeof g === 'string' ? g : g?.url) !== url)
        if (filtered.length !== galleryList.length) {
          await saveProductGallery(db, p.id, filtered)
        }
      }
      // Synchroniser le cache mémoire `products` : imageUrl et media nettoyés pour l'URL supprimée
      for (const p of products) {
        if (p.imageUrl === url) p.imageUrl = undefined
        if (Array.isArray(p.media)) {
          p.media = p.media.filter((g: any) => (typeof g === 'string' ? g : g?.url) !== url)
        }
      }
    }
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Erreur DB' }, 500)
  }
})

// Affecter une ou plusieurs images de la médiathèque à un/plusieurs produits ou à toute une marque
adminCatalogueRouter.post('/api/admin/media/brand/assign', adminAuth, async (c) => {
  let body: any = {}
  try { body = await c.req.formData() } catch (_) { body = await c.req.parseBody() }

  const getVal = (k: string) => typeof body.get === 'function' ? body.get(k) : body[k]
  // Accepte la clé répétée ET/OU des listes séparées par des virgules ("4,5,6").
  // (Avant : une valeur CSV unique était renvoyée telle quelle, puis parseInt("4,5,6")
  // ne gardait que 4 → une seule image/un seul produit réellement affecté.)
  const getAll = (k: string): string[] => {
    const raw: any[] = typeof body.getAll === 'function' ? body.getAll(k) : [getVal(k)]
    return raw
      .flatMap((v: any) => (v === null || v === undefined ? [] : String(v).split(',')))
      .map((s: string) => s.trim())
      .filter(Boolean)
  }

  const scope = (getVal('scope') as string) === 'brand' ? 'brand' : 'single'
  const target = (getVal('target') as string) === 'gallery' ? 'gallery' : 'main'
  const db = c.env.DB
  if (!db) return c.json({ error: 'Base de données D1 indisponible' }, 500)
  await ensureBrandMediaTable(db)

  // Normaliser les IDs médias : media_ids (CSV/répété) OU media_id (rétrocompat)
  let rawMediaIds = getAll('media_ids')
  if (!rawMediaIds.length) {
    const single = getVal('media_id')
    if (single) rawMediaIds = [String(single)]
  }
  const mediaIds = [...new Set(rawMediaIds.map(v => parseInt(v)).filter(n => Number.isFinite(n) && n > 0))]
  if (!mediaIds.length) return c.json({ error: 'Aucun ID image valide' }, 400)

  // Normaliser les IDs produits pour scope=single : product_ids (CSV/répété) OU product_id (rétrocompat)
  let rawProductIds = getAll('product_ids')
  if (!rawProductIds.length) {
    const single = getVal('product_id')
    if (single) rawProductIds = [String(single)]
  }
  const productIds = [...new Set(rawProductIds.map(v => parseInt(v)).filter(n => Number.isFinite(n) && n > 0))]

  // main_media_id (optionnel) : cette image devient la vignette, les AUTRES images
  // de la sélection partent en images annexes (galerie) — le tout en un seul appel.
  const mainMediaId = parseInt(String(getVal('main_media_id') || '')) || 0
  if (mainMediaId && !mediaIds.includes(mainMediaId)) {
    return c.json({ error: 'L\'image choisie comme vignette ne fait pas partie de la sélection.' }, 400)
  }

  // Sans main_media_id (ancien mode), target=main n'est autorisé que pour une seule image
  if (!mainMediaId && target === 'main' && mediaIds.length > 1) {
    return c.json({ error: 'Une seule image peut être la vignette. Indiquez laquelle, ou sélectionnez une seule image.' }, 400)
  }

  try {
    // Charger toutes les lignes média demandées (ignorer les manquantes)
    const mediaRows: any[] = []
    for (const mid of mediaIds) {
      const row = await db.prepare('SELECT * FROM brand_media_library WHERE id = ?').bind(mid).first() as any
      if (row) mediaRows.push(row)
    }
    if (!mediaRows.length) return c.json({ error: 'Aucune image trouvée dans la médiathèque pour les IDs fournis' }, 404)

    // Répartition des rôles : une vignette au plus, le reste en images annexes
    let mainRow: any = null
    if (mainMediaId) {
      mainRow = mediaRows.find(r => Number(r.id) === mainMediaId) || null
      if (!mainRow) return c.json({ error: 'L\'image choisie comme vignette est introuvable dans la médiathèque.' }, 404)
    } else if (target === 'main') {
      mainRow = mediaRows[0]
    }
    const galleryRows = mediaRows.filter(r => r !== mainRow)

    if (scope === 'single' && !productIds.length) return c.json({ error: 'ID produit manquant' }, 400)

    // Produits ciblés par une image : ceux choisis (single) ou tous ceux de sa marque (brand)
    const brandCache = new Map<string, number[]>()
    const targetsFor = async (row: any): Promise<number[]> => {
      if (scope === 'single') return productIds
      const key = String(row.brand || '').toLowerCase()
      if (!key) return []
      if (!brandCache.has(key)) {
        const res = await db.prepare('SELECT id FROM products WHERE LOWER(brand) = LOWER(?)').bind(row.brand).all() as any
        brandCache.set(key, (res?.results || []).map((r: any) => Number(r.id)))
      }
      return brandCache.get(key)!
    }
    // D1 limite à 100 paramètres liés par requête
    const chunks = <T,>(arr: T[], size = 80): T[][] => {
      const out: T[][] = []
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
      return out
    }
    const now = new Date().toISOString()
    const touched = new Set<number>()

    // (1) Vignette
    let mainCount = 0
    if (mainRow) {
      const ids = await targetsFor(mainRow)
      for (const part of chunks(ids)) {
        await db.prepare(`UPDATE products SET imageUrl = ?, image_url = ?, updated_at = ? WHERE id IN (${part.map(() => '?').join(',')})`)
          .bind(mainRow.url, mainRow.url, now, ...part).run()
      }
      for (const pid of ids) {
        const p = products.find(item => item.id === pid)
        if (p) (p as any).imageUrl = mainRow.url
        touched.add(pid)
        mainCount++
      }
    }

    // (2) Images annexes : regrouper par produit pour ne lire/écrire chaque galerie qu'une fois
    const additions = new Map<number, any[]>()
    for (const row of galleryRows) {
      for (const pid of await targetsFor(row)) {
        if (!additions.has(pid)) additions.set(pid, [])
        additions.get(pid)!.push(row)
      }
    }
    let galleryCount = 0
    const galleryCols = await gallerySelectColumns(db)
    for (const part of chunks([...additions.keys()])) {
      const res = await db.prepare(`SELECT id, ${galleryCols} FROM products WHERE id IN (${part.map(() => '?').join(',')})`).bind(...part).all() as any
      for (const prodRow of (res?.results || [])) {
        const gallery = parseGallery(prodRow)
        let added = 0
        for (const row of additions.get(Number(prodRow.id)) || []) {
          if (gallery.some((g: any) => (typeof g === 'string' ? g : g?.url) === row.url)) continue
          gallery.push({ url: row.url, deleteUrl: row.delete_url || '', type: 'image', caption: row.label || '' })
          added++
        }
        if (!added) continue
        await saveProductGallery(db, Number(prodRow.id), gallery)
        const p = products.find(item => item.id === Number(prodRow.id))
        if (p) p.media = gallery
        touched.add(Number(prodRow.id))
        galleryCount += added
      }
    }

    const nbProducts = scope === 'single' ? productIds.length : touched.size
    const parts: string[] = []
    if (mainRow) parts.push('vignette définie')
    if (galleryRows.length) parts.push(galleryCount > 0 ? `${galleryCount} image(s) annexe(s) ajoutée(s)` : 'images annexes déjà présentes')
    const message = `${nbProducts} produit(s) mis à jour : ${parts.join(' + ')}.`
    return c.json({ success: true, count: mainCount + galleryCount, images: mediaRows.length, main: mainCount, gallery: galleryCount, products: nbProducts, message })
  } catch (e: any) {
    console.error('Brand media assign error:', e)
    return c.json({ error: 'Erreur lors de l\'affectation : ' + (e?.message || 'Erreur DB') }, 500)
  }
})

// ============================================================
// API JSON (pour intégration app mobile future)
// ============================================================

adminCatalogueRouter.get('/api/products', async (c) => {
  const available = c.req.query('available')
  const brand = c.req.query('brand')
  
  // Mode hybride: essayer D1 d'abord, fallback à la mémoire
  let list = [...products]
  const db = c.env.DB
  
  if (db) {
    try {
      const dbProducts = await getProducts(db)
      list = dbProducts as any[]
    } catch (error) {
      console.error('Erreur D1 produits, fallback mémoire:', error)
    }
  }
  
  if (available === 'true') list = list.filter((p: any) => p.available && p.stock > 0)
  if (brand) list = list.filter((p: any) => p.brand === brand)
  return c.json(list)
})

adminCatalogueRouter.get('/api/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  
  // Mode hybride
  let product: any = products.find(p => p.id === id)
  const db = c.env.DB
  
  if (db && !product) {
    try {
      const dbProducts = await getProducts(db)
      product = (dbProducts as any[]).find((p: any) => p.id === id)
    } catch (error) {
      console.error('Erreur D1 produit, fallback mémoire:', error)
      product = products.find(p => p.id === id)
    }
  }
  
  if (!product) return c.json({ error: 'Produit non trouvé' }, 404)
  return c.json(product)
})

// POST /api/products — Create a product (requires Bearer token = ADMIN_SECRET)
adminCatalogueRouter.post('/api/products', async (c) => {
  const env = c.env
  // Token auth via Authorization header
  const authHeader = c.req.header('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  let secret: string
  try { secret = getAdminSecret(env) } catch { return c.json({ error: 'Server misconfigured' }, 503) }
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = await rateLimitD1(env?.DB, `api-products-bearer:${ip}`, 20, 15 * 60 * 1000)
  if (!rl.allowed) return c.json({ error: 'Trop de tentatives' }, 429)
  if (!token || !timingSafeEqualStr(token, secret)) {
    return c.json({ error: 'Non autorisé' }, 401)
  }

  let data: any
  try { data = await c.req.json() } catch { return c.json({ error: 'JSON invalide' }, 400) }

  const { name, brand, model, btu, price, stock, energy_class, surface_min, surface_max,
          description, refrigerant, compressor, image_url, inverter, warranty, features } = data

  if (!name || !brand || !btu || !price) {
    return c.json({ error: 'Champs requis manquants: name, brand, btu, price' }, 400)
  }

  const db = env.DB as any
  if (!db) return c.json({ error: 'Base de données indisponible' }, 503)

  try {
    const result = await db.prepare(`
      INSERT INTO products (name, brand, model, btu, price, stock, energy_class,
        surface_min, surface_max, description, image_url, inverter, warranty, features, available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      name,
      brand,
      model || '',
      parseInt(btu),
      parseInt(price),
      parseInt(stock ?? 1),
      energy_class || '',
      surface_min ? parseInt(surface_min) : null,
      surface_max ? parseInt(surface_max) : null,
      description || '',
      image_url || '',
      inverter ? 1 : 0,
      warranty || '1 an constructeur',
      features ? (typeof features === 'string' ? features : JSON.stringify(features)) : null
    ).run()

    // Invalidate in-memory cache so next GET fetches from D1
    // Invalidation : gérée par le middleware content_version (src/index.tsx)

    return c.json({ success: true, id: result.meta?.last_row_id }, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})
