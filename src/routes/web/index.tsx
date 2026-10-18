import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { HonoEnv } from '../../types'
import { HomePage } from '../../pages/home'
import { CataloguePage } from '../../pages/catalogue'
import { ProductDetailPage } from '../../pages/produit'
import { SimulateurPage } from '../../pages/simulateur'
import { RendezVousPage } from '../../pages/rendez-vous'
import { AvisPage } from '../../pages/avis'
import { AProposPage } from '../../pages/a-propos'
import { ContactPage } from '../../pages/contact'
import { RealisationsPage } from '../../pages/realisations'
import { ContratMaintenancePage } from '../../pages/contrat-maintenance'
import { MentionsLegalesPage } from '../../pages/mentions-legales'
import { PolitiqueDeConfidentialitePage } from '../../pages/politique-de-confidentialite'
import { reviews, clients } from '../../data/store'
import { products } from '../../data/products'
import { getReviews } from '../../db'
import { StorageService } from '../../services/storage.service'
import { webFormsRouter } from './forms.routes'

export const webRouter = new Hono<HonoEnv>()

webRouter.route('', webFormsRouter)

// ── GET /media/:key{.*} ─────────────────────────────────────────────
// Diffusion publique des images Cloudflare R2 avec en-têtes de mise en cache CDN
webRouter.get('/media/:key{.*}', async (c) => {
  const key = c.req.param('key')
  if (!key || key.includes('..')) {
    return c.text('Image non trouvée', 404)
  }
  const storage = new StorageService(c.env.IMAGES_BUCKET)
  const object = await storage.getImage(key)
  if (!object) {
    return c.text('Image non trouvée', 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return new Response(object.body, { headers })
})

// ── GET / ───────────────────────────────────────────────────────────
webRouter.get('/', async (c) => {
  const db = c.env.DB
  let approvedReviews: any[] = reviews.filter((r) => r.approved)
  let clientCount = clients.length

  if (db) {
    try {
      const dbReviews = await getReviews(db, true)
      if (dbReviews.length > 0) {
        approvedReviews = dbReviews as any[]
      }
    } catch (_) {}

    try {
      const countResult = (await db.prepare('SELECT COUNT(*) as cnt FROM clients').first()) as any
      clientCount = countResult?.cnt || clientCount
    } catch (_) {}
  }

  const avgNote =
    approvedReviews.length > 0
      ? approvedReviews.reduce((s: number, r: any) => s + r.note, 0) / approvedReviews.length
      : 0

  const stats = {
    clientCount,
    avgNote,
    reviewCount: approvedReviews.length,
  }
  const topReviews = approvedReviews.filter((r: any) => r.note >= 4).slice(0, 6)
  return c.html(<HomePage stats={stats} topReviews={topReviews} />)
})

// ── GET /catalogue ──────────────────────────────────────────────────
webRouter.get('/catalogue', (c) => {
  const brand = c.req.query('brand')
  const btu = c.req.query('btu')
  const inverter = c.req.query('inverter')
  const available = c.req.query('available')
  const product = c.req.query('product')
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  return c.html(<CataloguePage filters={{ brand, btu, inverter, available, product }} page={page} />)
})

// ── GET /catalogue/:id ──────────────────────────────────────────────
webRouter.get('/catalogue/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (!id || isNaN(id)) return c.redirect('/catalogue?error=produit_introuvable')
  const product = products.find((p) => p.id === id)
  if (!product) return c.redirect('/catalogue?error=produit_introuvable')
  return c.html(<ProductDetailPage product={product} />)
})

// ── GET /simulateur ─────────────────────────────────────────────────
webRouter.get('/simulateur', (c) => {
  const productId = c.req.query('product')
  let productData = null

  if (productId) {
    const id = parseInt(productId, 10)
    productData = products.find((p) => p.id === id)
  }

  return c.html(
    <SimulateurPage
      product={productData?.id}
      productBtu={productData?.btu}
      productName={productData?.name}
      productBrand={productData?.brand}
      productModel={productData?.model}
    />
  )
})

// ── GET /rendez-vous ────────────────────────────────────────────────
webRouter.get('/rendez-vous', async (c) => {
  const productId = c.req.query('product')
  const type = c.req.query('type')
  const success = c.req.query('success') === '1'
  const error = c.req.query('error')
  const clientName = c.req.query('name')
  const clientPhone = c.req.query('phone')
  const surface = c.req.query('surface') || ''
  const btu = c.req.query('btu') || ''
  const sessionToken = getCookie(c, 'maasga_session') || ''
  const loggedIn = !!sessionToken

  return c.html(
    <RendezVousPage
      success={success}
      error={error}
      productId={productId}
      type={type}
      clientName={clientName}
      clientPhone={clientPhone}
      surface={surface}
      btu={btu}
      loggedIn={loggedIn}
    />
  )
})

// ── GET /avis ───────────────────────────────────────────────────────
webRouter.get('/avis', async (c) => {
  const success = c.req.query('success') === '1'
  const errorMsg = c.req.query('error')
  const db = c.env.DB
  let approvedReviews: any[] = reviews.filter((r) => r.approved)
  if (db) {
    try {
      const dbReviews = await getReviews(db, true)
      approvedReviews = dbReviews as any[]
    } catch (_) {}
  }
  return c.html(<AvisPage success={success} error={errorMsg} approvedReviews={approvedReviews} />)
})

// ── GET /a-propos ───────────────────────────────────────────────────
webRouter.get('/a-propos', (c) => c.html(<AProposPage />))

// ── GET /realisations ───────────────────────────────────────────────
webRouter.get('/realisations', async (c) => {
  const db = c.env.DB
  let realisationsList: any[] = []
  if (db) {
    try {
      const result = await db
        .prepare(
          'SELECT id, title, description, category, client_name, quartier, image_url, date_realisation, is_featured FROM realisations WHERE is_visible = 1 ORDER BY is_featured DESC, date_realisation DESC LIMIT 30'
        )
        .all()
      realisationsList = result?.results || []
    } catch (_) {}
  }
  return c.html(<RealisationsPage realisations={realisationsList} />)
})

// ── GET /contrat-maintenance ────────────────────────────────────────
webRouter.get('/contrat-maintenance', async (c) => {
  const sessionToken = getCookie(c, 'maasga_session') || ''
  if (!sessionToken) {
    return c.redirect(
      '/espace-client?redirect=contrat-maintenance&error=' +
        encodeURIComponent('Veuillez vous connecter pour souscrire un contrat de maintenance.')
    )
  }

  let clientName = ''
  let clientPhone = ''
  const success = c.req.query('success') === '1'
  const error = c.req.query('error')

  return c.html(
    <ContratMaintenancePage
      success={success}
      error={error}
      clientName={clientName}
      clientPhone={clientPhone}
    />
  )
})

// ── GET /contact ────────────────────────────────────────────────────
webRouter.get('/contact', (c) => {
  const success = c.req.query('success') === '1'
  return c.html(<ContactPage success={success} />)
})

// ── GET /mentions-legales ───────────────────────────────────────────
webRouter.get('/mentions-legales', (c) => c.html(<MentionsLegalesPage />))

// ── GET /politique-de-confidentialite ───────────────────────────────
webRouter.get('/politique-de-confidentialite', (c) =>
  c.html(<PolitiqueDeConfidentialitePage />)
)
