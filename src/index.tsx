import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import type { D1Database } from '@cloudflare/workers-types'
import { HomePage } from './pages/home'
import { CataloguePage } from './pages/catalogue'
import { SimulateurPage } from './pages/simulateur'
import { RendezVousPage } from './pages/rendez-vous'
import { AvisPage } from './pages/avis'
import { AProposPage } from './pages/a-propos'
import { ContactPage } from './pages/contact'
import { EspaceClientPage } from './pages/espace-client'
import { AdminPage, AdminProduitsPage, AdminRDVPage, AdminClientsPage, AdminCommandesPage, AdminAvisPage, AdminParametresPage, AdminDevisListPage, AdminDevisNewPage } from './pages/admin'
import { RealisationsPage } from './pages/realisations'
import { appointments, reviews, orders, clients } from './data/store'
import type { Order } from './data/store'
import { products } from './data/products'
import { quartiers } from './data/quartiers'
import { createAppointment, updateAppointmentStatus, createOrder, createReview, getProducts, getReviews, getQuartiers, createClient, getClients, getAppointments, getOrders, deleteProduct, deleteClient, deleteOrder, getClientById, getProductById } from './db'

// Créer l'app Hono avec support D1 optionnel
type HonoEnv = {
  Bindings: {
    DB?: D1Database
    TWILIO_ACCOUNT_SID?: string
    TWILIO_AUTH_TOKEN?: string
    TWILIO_FROM?: string
  }
}

const app = new Hono<HonoEnv>()

app.use('/api/*', cors())

// Charger les produits depuis D1 au démarrage
app.use(async (c, next) => {
  if (products.length === 0 && c.env.DB) {
    try {
      const result = await c.env.DB.prepare(
        'SELECT * FROM products WHERE available = 1'
      ).all()
      
      if (result.results && Array.isArray(result.results)) {
        result.results.forEach((p: any) => {
          const product = {
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
            inverter: p.inverter === 1,
            available: p.available === 1,
            image: p.image || '❄️',
            imageUrl: p.imageUrl,
            features: (() => { try { return JSON.parse(p.features || '[]') } catch { return [] } })(),
            warranty: p.warranty || '1 an constructeur',
            techSpecs: (() => { try { return p.tech_specs ? JSON.parse(p.tech_specs) : undefined } catch { return undefined } })(),
            media: (() => { try { return p.media_urls ? JSON.parse(p.media_urls) : [] } catch { return [] } })()
          }
          products.push(product)
        })
        console.log(`✓ Chargé ${products.length} produits depuis D1`)
      }
    } catch (error) {
      console.log('ℹ Info: D1 non disponible ou migrations non appliquées. Mode mémoire seul.')
    }
  }
  await next()
})

// Charger les orders depuis D1 au démarrage (commandes persistantes)
app.use(async (c, next) => {
  if (orders.length === 0 && c.env.DB) {
    try {
      const result = await getOrders(c.env.DB)
      if (result && Array.isArray(result)) {
        result.forEach((o: any) => {
          orders.push({
            id: o.id,
            appointment_id: o.appointment_id,
            client_id: o.client_id,
            product_id: o.product_id,
            client_name: o.client_name,
            client_phone: o.client_phone,
            quartier: o.quartier,
            type: o.type || 'devis',
            status: o.status || 'pending',
            notes: o.notes,
            created_at: o.created_at
          })
        })
        console.log(`✓ Chargé ${orders.length} commandes depuis D1`)
      }
    } catch (error) {
      console.log('ℹ Info: D1 orders non disponible.')
    }
  }
  await next()
})

// Servir les fichiers statiques
// @ts-ignore – manifest requis en prod CF Pages uniquement
app.use('/static/*', serveStatic({ root: './' } as any))

// Favicon inline
app.get('/favicon.ico', (c) => c.body(null, 204))
app.get('/favicon.svg', (c) => {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1e3a8a"/><text x="16" y="23" text-anchor="middle" font-size="20" fill="white">❄</text></svg>`,
    { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=86400' } }
  )
})

// OG Image for social sharing (1200x630 standard)
app.get('/og-image.png', (c) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0b1120"/><stop offset="50%" style="stop-color:#0f2557"/><stop offset="100%" style="stop-color:#0b1120"/></linearGradient><linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#0ea5e9"/><stop offset="100%" style="stop-color:#3b82f6"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <circle cx="900" cy="200" r="300" fill="rgba(14,165,233,0.06)"/>
    <circle cx="300" cy="500" r="200" fill="rgba(59,130,246,0.05)"/>
    <rect x="80" y="490" width="1040" height="4" rx="2" fill="url(#accent)" opacity="0.3"/>
    <text x="600" y="220" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="72" fill="white">MAASGA</text>
    <text x="600" y="290" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="500" font-size="32" fill="#38bdf8">Expert Froid &amp; Climatisation</text>
    <text x="600" y="380" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="400" font-size="26" fill="#94a3b8">Vente · Installation · Maintenance</text>
    <text x="600" y="430" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="400" font-size="22" fill="#64748b">Ouagadougou, Burkina Faso</text>
    <rect x="430" y="460" width="340" height="50" rx="25" fill="url(#accent)"/>
    <text x="600" y="492" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="18" fill="white">Devis Gratuit · 55 99 64 18</text>
    <text x="600" y="560" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="600" font-size="18" fill="#38bdf8">maasga.pages.dev</text>
  </svg>`
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=86400' }
  })
})

// Robots.txt
app.get('/robots.txt', (c) => {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: https://maasga-website.pages.dev/sitemap.xml`,
    { headers: { 'Content-Type': 'text/plain' } }
  )
})

// Sitemap.xml
app.get('/sitemap.xml', (c) => {
  const pages = ['/', '/catalogue', '/simulateur', '/rendez-vous', '/realisations', '/avis', '/a-propos', '/contact', '/espace-client']
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>https://maasga-website.pages.dev${p}</loc><changefreq>${p === '/' ? 'weekly' : 'monthly'}</changefreq><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
})

// ============================================================
// ROUTES PUBLIQUES
// ============================================================

app.get('/', (c) => {
  const approvedReviews = reviews.filter(r => r.approved)
  const avgNote = approvedReviews.length > 0
    ? approvedReviews.reduce((s, r) => s + r.note, 0) / approvedReviews.length
    : 0
  const stats = {
    clientCount: clients.length,
    avgNote,
    reviewCount: approvedReviews.length
  }
  return c.html(<HomePage stats={stats} />)
})

app.get('/catalogue', (c) => {
  const brand = c.req.query('brand')
  const btu = c.req.query('btu')
  const inverter = c.req.query('inverter')
  const available = c.req.query('available')
  const product = c.req.query('product')
  return c.html(<CataloguePage filters={{ brand, btu, inverter, available, product }} />)
})

app.get('/simulateur', (c) => {
  const productId = c.req.query('product')
  let productData = null
  
  if (productId) {
    const id = parseInt(productId)
    productData = products.find(p => p.id === id)
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

app.get('/rendez-vous', (c) => {
  const productId = c.req.query('product')
  const type = c.req.query('type')
  const success = c.req.query('success') === '1'
  const error = c.req.query('error')
  const clientName = c.req.query('name')
  const clientPhone = c.req.query('phone')
  const surface = c.req.query('surface') || ''
  const btu = c.req.query('btu') || ''
  return c.html(<RendezVousPage success={success} error={error} productId={productId} type={type} clientName={clientName} clientPhone={clientPhone} surface={surface} btu={btu} />)
})

app.get('/avis', (c) => {
  const success = c.req.query('success') === '1'
  return c.html(<AvisPage success={success} />)
})

app.get('/a-propos', (c) => c.html(<AProposPage />))

app.get('/realisations', (c) => c.html(<RealisationsPage />))

app.get('/contact', (c) => {
  const success = c.req.query('success') === '1'
  return c.html(<ContactPage success={success} />)
})

// ============================================================
// ESPACE CLIENT
// ============================================================

app.get('/espace-client', (c) => {
  const error = c.req.query('error')
  return c.html(<EspaceClientPage error={error} />)
})

// Helper : rendre le dashboard directement (pas de redirect — évite les problèmes Set-Cookie en dev)
async function renderDashboard(c: any, clientId: number): Promise<Response> {
  const db = c.env.DB
  const client = await db.prepare(
    'SELECT id, name, phone, email, quartier, created_at FROM clients WHERE id = ?'
  ).bind(clientId).first() as any
  if (!client) return c.redirect('/espace-client?error=' + encodeURIComponent('Session invalide.'))
  const orders = await db.prepare(
    'SELECT o.id, o.type, o.status, o.notes, o.total_price, o.created_at, p.name as product_name, p.btu, p.brand, p.image FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE o.client_phone = ? ORDER BY o.created_at DESC'
  ).bind(client.phone).all().then((r: any) => r.results || []).catch(() => [])
  const rdvs = await db.prepare(
    'SELECT id, date, heure_debut, heure_fin, type, status, quartier, notes, created_at FROM appointments WHERE phone = ? ORDER BY date DESC'
  ).bind(client.phone).all().then((r: any) => r.results || []).catch(() => [])
  return c.html(<EspaceClientPage
    loggedIn={true}
    fixUrl={true}
    sessionClientId={clientId}
    clientName={client.name || ''}
    clientPhone={client.phone || ''}
    clientEmail={client.email || ''}
    clientQuartier={client.quartier || ''}
    clientOrders={orders as any[]}
    clientRdvs={rdvs as any[]}
    clientSince={client.created_at || ''}
  />)
}

// Helper : hachage mot de passe (SHA-256 + sel)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'maasga_salt_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// API Login
app.post('/api/login', async (c) => {
  const body = await c.req.parseBody()
  const identifier = (body['identifier'] as string || '').trim()
  const password = (body['password'] as string || '').trim()

  if (!identifier || !password) {
    return c.redirect('/espace-client?error=' + encodeURIComponent('Identifiants manquants.'))
  }

  const db = c.env.DB

  // ── Vérification admin ──────────────────────────────────────────
  {
    let validAdminUsername = DEFAULT_ADMIN_USERNAME
    let validAdminHash = ''
    if (db) {
      try {
        await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
        const hashRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_password_hash').first() as any
        if (hashRow?.value) validAdminHash = hashRow.value
        const userRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_username').first() as any
        if (userRow?.value) validAdminUsername = userRow.value
      } catch(e) { /* table may not exist */ }
    }
    if (!validAdminHash) validAdminHash = await hashPassword(DEFAULT_ADMIN_HASH_INPUT)
    const submittedHash = await hashPassword(password)
    if (identifier === validAdminUsername && submittedHash === validAdminHash) {
      const token = await signToken(`admin_${Date.now()}`)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/admin',
          'Set-Cookie': `maasga_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`
        }
      })
    }
  }
  // ───────────────────────────────────────────────────────────────

  if (db) {
    try {
      // Normalise le numéro : essaie tel quel, avec +226, et sans espaces
      const cleanId = identifier.replace(/\s/g, '')
      const withPrefix = cleanId.startsWith('+226') ? cleanId : ('+226' + cleanId)
      const withoutPrefix = cleanId.startsWith('+226') ? cleanId.slice(4) : cleanId
      const client = await db.prepare(
        'SELECT id, name, password_hash FROM clients WHERE phone = ? OR phone = ? OR phone = ? OR email = ?'
      ).bind(cleanId, withPrefix, withoutPrefix, identifier).first() as any

      if (client && client.password_hash && client.password_hash !== 'pending') {
        // Client existant avec mot de passe
        const hash = await hashPassword(password)
        if (hash === client.password_hash) {
          return renderDashboard(c, client.id)
        }
        return c.redirect('/espace-client?error=' + encodeURIComponent('Mot de passe incorrect.'))
      }

      if (client && (!client.password_hash || client.password_hash === 'pending')) {
        // Client existant sans mot de passe: activer son compte
        const hash = await hashPassword(password)
        await db.prepare('UPDATE clients SET password_hash = ?, updated_at = ? WHERE id = ?')
          .bind(hash, new Date().toISOString(), client.id).run()
        return renderDashboard(c, client.id)
      }

      // Client introuvable: auto-inscription
      if (password.length >= 4) {
        const hash = await hashPassword(password)
        const isEmail = identifier.includes('@')
        const now = new Date().toISOString()
        const phoneVal = isEmail ? ('auto_' + Date.now()) : identifier
        await db.prepare(
          'INSERT INTO clients (name, phone, email, quartier, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind('Client', phoneVal, isEmail ? identifier : null, '', hash, now, now).run()
        const newClient = await db.prepare(
          'SELECT id FROM clients WHERE phone = ? OR email = ? ORDER BY id DESC LIMIT 1'
        ).bind(phoneVal, isEmail ? identifier : phoneVal).first() as any
        if (newClient) return renderDashboard(c, newClient.id)
      }
    } catch (e) {
      console.error('Login D1 error:', e)
    }
  }

  return c.redirect('/espace-client?error=' + encodeURIComponent('Identifiants incorrects. Veuillez reessayer.'))
})

// API Inscription (après commande)
app.post('/api/register', async (c) => {
  const body = await c.req.parseBody()
  const name = ((body['name'] as string) || '').trim()
  const phone = ((body['phone'] as string) || '').trim()
  const email = ((body['email'] as string) || '').trim()
  const quartier = ((body['quartier'] as string) || '').trim()
  const password = ((body['password'] as string) || '').trim()

  const errRedirect = (msg: string) =>
    c.redirect('/espace-client?tab=signup&error=' + encodeURIComponent(msg))

  if (!name || !phone) return errRedirect('Nom et téléphone sont obligatoires.')
  if (password.length < 6) return errRedirect('Le mot de passe doit faire au moins 6 caractères.')

  const db = c.env.DB
  if (!db) return errRedirect('Service temporairement indisponible.')

  try {
    const fullPhone = '+226' + phone.replace(/\s/g, '')
    const existing = await db.prepare(
      'SELECT id, password_hash FROM clients WHERE phone = ? OR phone = ?'
    ).bind(phone, fullPhone).first() as any

    if (existing && existing.password_hash && existing.password_hash !== 'pending') {
      return errRedirect('Un compte existe déjà avec ce numéro. Connectez-vous.')
    }

    const password_hash = await hashPassword(password)
    const now = new Date().toISOString()
    let clientId: number

    if (existing) {
      await db.prepare('UPDATE clients SET password_hash = ?, name = ?, email = ?, quartier = ?, updated_at = ? WHERE id = ?')
        .bind(password_hash, name, email || null, quartier || null, now, existing.id).run()
      clientId = existing.id
    } else {
      await db.prepare(
        'INSERT INTO clients (name, phone, email, quartier, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(name, fullPhone, email || null, quartier || null, password_hash, now, now).run()
      const inserted = await db.prepare('SELECT id FROM clients WHERE phone = ?').bind(fullPhone).first() as any
      clientId = inserted?.id
    }
    if (!clientId) return errRedirect('Erreur lors de la création du compte.')

    return renderDashboard(c, clientId)
  } catch (e) {
    console.error('Register error:', e)
    return errRedirect('Erreur lors de la création du compte.')
  }
})

// DEBUG TEMPORAIRE - à supprimer après diagnostic
app.get('/api/debug-session', async (c) => {
  const cookieHeader = c.req.header('cookie') || ''
  const sessionVal = getCookie(c, 'maasga_session') || ''
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)maasga_session=([^;]+)/)
  const manualVal = cookieMatch ? cookieMatch[1] : ''
  const finalVal = sessionVal || manualVal
  const clientId = finalVal ? parseInt(finalVal.split('_')[0]) : NaN
  let client = null
  if (c.env.DB && clientId && !isNaN(clientId)) {
    client = await c.env.DB.prepare('SELECT id, name, phone, email, quartier FROM clients WHERE id = ?').bind(clientId).first().catch(() => null)
  }
  let allClients: any[] = []
  if (c.env.DB) {
    const r = await c.env.DB.prepare('SELECT id, name, phone, password_hash FROM clients ORDER BY id DESC LIMIT 10').all().catch(() => ({ results: [] }))
    allClients = (r.results || []) as any[]
  }
  return c.json({ cookieHeader: cookieHeader.slice(0, 300), getCookieResult: sessionVal, manualResult: manualVal, finalVal, clientId, client, allClients })
})

app.get('/espace-client', async (c) => {
  const error = c.req.query('error')
  
  // Check session cookie (fallback manual parsing si getCookie échoue)
  const cookieHeader = c.req.header('cookie') || ''
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)maasga_session=([^;]+)/)
  const sessionVal = getCookie(c, 'maasga_session') || (cookieMatch ? cookieMatch[1] : '') || ''
  const clientId = sessionVal ? parseInt(sessionVal.split('_')[0]) : NaN
  const db = c.env.DB

  console.log('[EC] sessionVal=', sessionVal, 'clientId=', clientId, 'db=', !!db)
  if (db && sessionVal && clientId && !isNaN(clientId)) {
    try {
      const client = await db.prepare(
        'SELECT id, name, phone, email, quartier, created_at FROM clients WHERE id = ?'
      ).bind(clientId).first() as any
      console.log('[EC] client=', JSON.stringify(client))
      if (client) {
        const clientOrders = await db.prepare(
          'SELECT o.id, o.type, o.status, o.notes, o.total_price, o.created_at, p.name as product_name, p.btu, p.brand, p.image FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE o.client_phone = ? ORDER BY o.created_at DESC'
        ).bind(client.phone).all().then((r: any) => r.results || []).catch(() => [])
        const clientRdvs = await db.prepare(
          'SELECT id, date, heure_debut, heure_fin, type, status, quartier, notes, created_at FROM appointments WHERE phone = ? ORDER BY date DESC'
        ).bind(client.phone).all().then((r: any) => r.results || []).catch(() => [])
        return c.html(<EspaceClientPage
          loggedIn={true}
          clientName={client.name || ''}
          clientPhone={client.phone || ''}
          clientEmail={client.email || ''}
          clientQuartier={client.quartier || ''}
          clientOrders={clientOrders as any[]}
          clientRdvs={clientRdvs as any[]}
          clientSince={client.created_at || ''}
        />)
      }
    } catch(e) { console.error('Session lookup error:', e) }
  }

  const tab = c.req.query('tab')
  return c.html(<EspaceClientPage error={error} tab={tab} />)
})

app.get('/api/logout', (_c) => {
  return new Response(null, {
    status: 302,
    headers: { 'Location': '/espace-client', 'Set-Cookie': 'maasga_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' }
  })
})

// ============================================================
// API RENDEZ-VOUS
// ============================================================

app.post('/api/rdv', async (c) => {
  const body = await c.req.parseBody()
  const name = (body['name'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const quartier = (body['quartier'] as string || '').trim()
  const date = (body['date'] as string || '').trim()
  const heure_debut = (body['heure_debut'] as string || '08:00').trim()
  const heure_fin = (body['heure_fin'] as string || '18:00').trim()
  const email = (body['email'] as string || '').trim()
  const typeRaw = (body['type'] as string || 'devis').toLowerCase()
  const type: 'devis' | 'installation' = (typeRaw === 'installation' ? 'installation' : 'devis')
  const notes = (body['notes'] as string || '').trim()
  const latitude = parseFloat(body['latitude'] as string) || null
  const longitude = parseFloat(body['longitude'] as string) || null
  const adresse_precise = (body['adresse_precise'] as string || '').trim()
  const productId = body['product_id'] as string

  // Construire les notes avec les hints BTU/surface du simulateur
  const surfaceHint = (body['surface_hint'] as string || '').trim()
  const btuHint = (body['btu_hint'] as string || '').trim()
  let notesWithHints = notes
  if (surfaceHint || btuHint) {
    const hints = [surfaceHint ? `Surface: ${surfaceHint} m2` : '', btuHint ? `BTU: ${btuHint}` : ''].filter(Boolean).join(' | ')
    notesWithHints = notesWithHints ? `${notesWithHints} [${hints}]` : `[${hints}]`
  }

  if (!name || !phone || !quartier || !date) {
    return c.redirect('/rendez-vous?error=' + encodeURIComponent('Tous les champs obligatoires doivent être remplis.'))
  }

  const newRdv = {
    id: appointments.length + 1,
    name,
    phone,
    quartier,
    date,
    heure_debut,
    heure_fin,
    type,
    notes: notesWithHints + (productId ? ` [Produit #${productId}]` : ''),
    latitude,
    longitude,
    adresse_precise,
    status: 'pending' as 'pending',
    created_at: new Date().toISOString().split('T')[0]
  }
  appointments.push(newRdv)

  // Écrire en base de données D1 si disponible
  const db = c.env.DB
  if (db) {
    // 1. Enregistrer/mettre à jour le client (indépendant du RDV)
    try {
      await createClient(db, {
        name,
        phone,
        email: body['email'] as string || null,
        quartier,
        adresse_precise: adresse_precise || null,
        latitude: latitude || null,
        longitude: longitude || null,
        type_demande: type,
        notes,
        product_id: productId ? parseInt(productId) : null
      })
    } catch (error) {
      console.error('Erreur createClient depuis RDV (non bloquant):', error)
    }
    // 2. Créer le rendez-vous (séparé pour ne pas être bloqué par createClient)
    try {
      await createAppointment(db, {
        name,
        phone,
        quartier,
        date,
        heure_debut,
        heure_fin,
        type,
        notes: notesWithHints + (productId ? ` [Produit #${productId}]` : ''),
        latitude: latitude || null,
        longitude: longitude || null,
        adresse_precise: adresse_precise || null
      })
      console.log('✓ RDV sauvegardé en D1:', name, date)
    } catch (error) {
      console.error('Erreur createAppointment en D1:', error)
    }
  }

  // Envoyer SMS de confirmation (Twilio)
  const accountSid = c.env.TWILIO_ACCOUNT_SID || ''
  const authToken = c.env.TWILIO_AUTH_TOKEN || ''
  const fromNumber = c.env.TWILIO_FROM || '+1234567890'
  
  if (accountSid && authToken) {
    const toNumber = phone.startsWith('+') ? phone : '+221' + phone.replace(/^0/, '')
    const typeLabel = { devis: 'Devis', installation: 'Installation', entretien: 'Entretien', depannage: 'Dépannage' }[type]
    const message = `Bonjour ${name}! Votre ${typeLabel} MAASGA est confirmée pour le ${date} de ${heure_debut} à ${heure_fin}. Réf: #${newRdv.id}. Questions? +221 77 XXX XXXX`
    
    try {
      const auth = btoa(`${accountSid}:${authToken}`)
      await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Body: message
        }).toString()
      }).catch(() => {}) // Silent fail si SMS échoue
      console.log(`✓ SMS envoyé à ${toNumber}`)
    } catch (error) {
      console.log('ℹ SMS non envoyé (Twilio non configuré)', error)
    }
  }

  return c.redirect('/rendez-vous?success=1&name=' + encodeURIComponent(name) + '&phone=' + encodeURIComponent(phone))
})

// ============================================================
// API AVIS
// ============================================================

app.post('/api/avis', async (c) => {
  const body = await c.req.parseBody()
  const name = (body['name'] as string || '').trim()
  const note = parseInt(body['note'] as string || '5')
  const comment = (body['comment'] as string || '').trim()
  const service = (body['service'] as string || '').trim()

  if (!name || !comment || comment.length < 10) {
    return c.redirect('/avis?error=' + encodeURIComponent('Veuillez remplir tous les champs correctement.'))
  }

  const newReview = {
    id: reviews.length + 1,
    name,
    note: Math.min(5, Math.max(1, note)),
    comment,
    date: new Date().toISOString().split('T')[0],
    service: service || 'Service MAASGA',
    approved: false // En attente de modération
  }
  reviews.push(newReview)

  // Écrire en base de données D1 si disponible
  const db = c.env.DB
  if (db) {
    try {
      await createReview(db, {
        name,
        note: Math.min(5, Math.max(1, note)),
        comment,
        date: new Date().toISOString().split('T')[0],
        service: service || 'Service MAASGA'
      })
    } catch (error) {
      console.error('Erreur lors de la création de l\'avis en D1:', error)
    }
  }

  return c.redirect('/avis?success=1')
})

// ============================================================
// API CONTACT
// ============================================================

app.post('/api/contact', async (c) => {
  const body = await c.req.parseBody()
  const name = (body['name'] as string || '').trim()
  const email = (body['email'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const message = (body['message'] as string || '').trim()

  if (!name || !message) {
    return c.redirect('/contact?error=' + encodeURIComponent('Nom et message sont obligatoires.'))
  }

  // Enregistrer le contact comme client potentiel
  const db = c.env.DB
  if (db && (phone || email)) {
    try {
      await createClient(db, {
        name,
        phone: phone || '',
        email: email || null,
        quartier: '',
        adresse_precise: null,
        latitude: null,
        longitude: null,
        type_demande: 'contact',
        notes: message.substring(0, 500),
        product_id: null
      })
    } catch (error) {
      console.error('Erreur createClient depuis contact (non bloquant):', error)
    }
  }

  console.log('Contact recu:', { name, email, phone, message })
  return c.redirect('/contact?success=1')
})

// ============================================================
// ORDERS - Gestion des commandes/panier
// ============================================================

app.post('/api/order/create', async (c) => {
  try {
    const body = await c.req.json().catch(() => null) || await c.req.parseBody()
    const db = c.env.DB
    
    const str = (v: any) => (typeof v === 'string' ? v : v != null ? String(v) : '')
    const rawType = (str(body['type']) || 'vente').trim()
    const allowedTypes: Order['type'][] = ['devis', 'installation', 'vente', 'commande']
    const normalizedType: Order['type'] = allowedTypes.includes(rawType as Order['type']) ? (rawType as Order['type']) : 'vente'
    const orderData = {
      client_id: body['client_id'] ? parseInt(str(body['client_id'])) : null,
      appointment_id: body['appointment_id'] ? parseInt(str(body['appointment_id'])) : null,
      product_id: body['product_id'] ? parseInt(str(body['product_id'])) : null,
      quantity: body['quantity'] ? parseInt(str(body['quantity'])) : 1,
      client_name: str(body['client_name']).trim(),
      client_phone: str(body['client_phone']).trim(),
      client_email: str(body['client_email']).trim() || null,
      quartier: (str(body['quartier']) || str(body['client_address'])).trim() || null,
      type: normalizedType,
      status: 'pending' as const,
      notes: str(body['notes']).trim() || null,
      total_price: body['total_price'] ? parseFloat(str(body['total_price'])) : 0,
      installation_price: body['installation_price'] ? parseFloat(str(body['installation_price'])) : 50000
    }

    // Validation
    if (!orderData.client_name || !orderData.client_phone) {
      return c.json({ error: 'Nom et téléphone obligatoires' }, 400)
    }

    // Ajouter à mémoire locale
    const newOrder: Order = {
      id: Math.max(...orders.map(o => o.id), 0) + 1,
      ...orderData,
      created_at: new Date().toISOString()
    }
    orders.push(newOrder)

    // Sauvegarder en D1 si disponible
    if (db) {
      try {
        await createOrder(db, orderData)
        console.log('✓ Commande sauvegardée en D1:', newOrder.id)
      } catch (error) {
        console.error('Erreur sauvegarde D1 order:', error)
      }
      // Enregistrer/mettre à jour le client dans D1
      try {
        await createClient(db, {
          name: orderData.client_name,
          phone: orderData.client_phone,
          email: orderData.client_email,
          quartier: orderData.quartier || '',
          adresse_precise: null,
          latitude: body['latitude'] ? parseFloat(str(body['latitude'])) : null,
          longitude: body['longitude'] ? parseFloat(str(body['longitude'])) : null,
          type_demande: 'commande',
          notes: orderData.notes,
          product_id: orderData.product_id
        })
        console.log('✓ Client enregistré/mis à jour en D1:', orderData.client_phone)
      } catch (error) {
        console.error('Erreur createClient depuis order:', error)
      }
    }

    return c.json({ success: true, order: newOrder }, 201)
  } catch (error) {
    console.error('Erreur /api/order/create:', error)
    return c.json({ error: 'Erreur création commande' }, 500)
  }
})

// ============================================================
// ADMIN ROUTES
// ============================================================

// Middleware auth admin — HMAC signed cookie
const ADMIN_SECRET = 'maasga_hmac_secret_2026_x9k'
async function signToken(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(ADMIN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return payload + '.' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}
async function verifyToken(token: string): Promise<boolean> {
  const parts = token.split('.')
  if (parts.length < 2) return false
  const payload = parts.slice(0, -1).join('.')
  const expected = await signToken(payload)
  return token === expected
}

// CSRF token generation
function generateCSRF(): string {
  const arr = new Uint8Array(24)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(36)).join('').slice(0, 32)
}

const adminAuth = async (c: any, next: any) => {
  const cookie = c.req.header('Cookie') || ''
  const match = cookie.match(/maasga_admin=([^;]+)/)
  if (match) {
    const valid = await verifyToken(decodeURIComponent(match[1]))
    if (valid) {
      // Generate CSRF token for forms
      const csrf = generateCSRF()
      c.set('csrf', csrf)
      return next()
    }
  }
  // Forward error query param to login page
  const url = new URL(c.req.url)
  const error = url.searchParams.get('error')
  return c.html(AdminLoginPage({ error: error || undefined }))
}

// Recharge toutes les données depuis D1 dans les tableaux mémoire (évite reset au deploy)
const refreshAdminCache = async (c: any, next: any) => {
  const db = c.env.DB
  if (db) {
    try {
      // ---------- Appointments ----------
      appointments.length = 0
      const dbAppts = await getAppointments(db)
      dbAppts.forEach((a: any) => appointments.push({
        id: a.id,
        name: a.name,
        phone: a.phone,
        quartier: a.quartier || '',
        date: a.date,
        heure_debut: a.heure_debut || '08:00',
        heure_fin: a.heure_fin || '18:00',
        type: a.type || 'devis',
        notes: a.notes || '',
        latitude: a.latitude ?? null,
        longitude: a.longitude ?? null,
        adresse_precise: a.adresse_precise || '',
        status: a.status || 'pending',
        created_at: a.created_at
      }))

      // ---------- Clients ----------
      clients.length = 0
      const dbClients = await getClients(db)
      dbClients.forEach((cl: any) => clients.push({
        id: cl.id,
        name: cl.name,
        phone: cl.phone,
        email: cl.email || '',
        quartier: cl.quartier || '',
        password_hash: cl.password_hash || '',
        type_demande: cl.type_demande || '',
        notes: cl.notes || '',
        created_at: cl.created_at
      }))

      // ---------- Reviews ----------
      reviews.length = 0
      const dbReviews = await getReviews(db, false)
      dbReviews.forEach((r: any) => reviews.push({
        id: r.id,
        name: r.name,
        note: r.note,
        comment: r.comment,
        date: r.date,
        service: r.service,
        approved: r.approved === 1 || r.approved === true
      }))

      // ---------- Orders ----------
      orders.length = 0
      const dbOrders = await getOrders(db)
      dbOrders.forEach((o: any) => orders.push({
        id: o.id,
        appointment_id: o.appointment_id,
        client_id: o.client_id,
        product_id: o.product_id,
        quantity: o.quantity || 1,
        client_name: o.client_name,
        client_phone: o.client_phone,
        client_email: o.client_email || null,
        quartier: o.quartier || '',
        type: (o.type || 'vente') as any,
        status: (o.status || 'pending') as any,
        notes: o.notes,
        total_price: o.total_price || 0,
        installation_price: o.installation_price || 50000,
        created_at: o.created_at
      }))

      // ---------- Products ----------
      if (products.length === 0) {
        const dbProducts = await getProducts(db)
        dbProducts.forEach((p: any) => products.push(p))
      }
    } catch (e) {
      console.error('Erreur refreshAdminCache D1:', e)
    }
  }
  await next()
}

const AdminLoginPage = ({ error }: { error?: string } = {}) => (
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>MAASGA Admin - Connexion</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #0f1e3c 0%, #1e3a8a 50%, #0284c7 100%); }
        .input-field { border: 1.5px solid #e5e7eb; }
        .input-field:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      `}} />
    </head>
    <body class="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-3xl shadow-2xl p-8">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i class="fas fa-snowflake text-white text-2xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">MAASGA Admin</h1>
            <p class="text-sm text-gray-500 mt-1">Accès back-office sécurisé</p>
          </div>
          {error && (
            <div class="mb-4 rounded-xl p-3 bg-red-50 border border-red-200 flex items-center space-x-2">
              <i class="fas fa-exclamation-circle text-red-500"></i>
              <span class="text-sm text-red-700 font-medium">
                {error === '1' ? 'Identifiant ou mot de passe incorrect.' :
                 error === 'logged_out' ? 'Session terminée avec succès.' :
                 'Erreur de connexion.'}
              </span>
            </div>
          )}
          <form method="post" action="/api/admin/login" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Identifiant admin</label>
              <input type="text" name="username" required placeholder="admin"
                class="input-field w-full rounded-xl px-4 py-3 bg-gray-50" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
              <input type="password" name="password" required placeholder="••••••••"
                class="input-field w-full rounded-xl px-4 py-3 bg-gray-50" />
            </div>
            <button type="submit"
              class="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-md mt-2">
              <i class="fas fa-lock mr-2"></i>Accéder au back-office
            </button>
          </form>
          <div class="mt-4 text-center text-xs text-gray-400">
            Accès restreint - MAASGA Froid & Climatisation
          </div>
        </div>
      </div>
    </body>
  </html>
)

// Admin password — stored as SHA-256 hash, checked via D1 first then fallback
let ADMIN_PASSWORD_HASH = '' // Will be loaded from D1 or default
const DEFAULT_ADMIN_HASH_INPUT = 'maasga2025'
const DEFAULT_ADMIN_USERNAME = 'admin'

app.post('/api/admin/login', async (c) => {
  const body = await c.req.parseBody()
  const username = (body['username'] as string || '').trim()
  const password = (body['password'] as string || '').trim()

  if (!username || !password) return c.redirect('/admin?error=1')

  // Hash the submitted password
  const submittedHash = await hashPassword(password)
  
  // Try D1 admin settings first
  let validHash = ''
  let validUsername = DEFAULT_ADMIN_USERNAME
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
      const hashRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_password_hash').first() as any
      if (hashRow?.value) validHash = hashRow.value
      const userRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_username').first() as any
      if (userRow?.value) validUsername = userRow.value
    } catch(e) { /* settings table may not exist yet */ }
  }
  // Fallback to default
  if (!validHash) validHash = await hashPassword(DEFAULT_ADMIN_HASH_INPUT)

  if (username === validUsername && submittedHash === validHash) {
    const payload = `admin_${Date.now()}`
    const token = await signToken(payload)
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin',
        'Set-Cookie': `maasga_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`
      }
    })
    return response
  }
  return c.redirect('/admin?error=1')
})

// Admin logout — clears admin cookie
app.get('/api/admin/logout', (c) => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/admin?error=logged_out',
      'Set-Cookie': 'maasga_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    }
  })
})

// Admin password reset — secret route to reset to default
app.get('/api/admin/reset-secret-xK9m2025', async (c) => {
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM admin_settings WHERE key = ?').bind('admin_password_hash').run()
      await db.prepare('DELETE FROM admin_settings WHERE key = ?').bind('admin_username').run()
    } catch(e) { /* table may not exist — that's fine */ }
  }
  return c.html(
    <html lang="fr"><head><meta charset="UTF-8"/><title>Reset Admin</title><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="min-h-screen flex items-center justify-center" style="background:#0f1e3c;">
      <div class="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
        <div class="text-4xl mb-4">✅</div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">Mot de passe admin réinitialisé</h1>
        <p class="text-gray-600 text-sm mb-4">Les identifiants par défaut sont restaurés :</p>
        <div class="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
          <p class="text-sm"><strong>Identifiant :</strong> <code class="bg-blue-100 px-2 py-0.5 rounded text-blue-700">admin</code></p>
          <p class="text-sm"><strong>Mot de passe :</strong> <code class="bg-blue-100 px-2 py-0.5 rounded text-blue-700">maasga2025</code></p>
        </div>
        <a href="/admin" class="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition">Accéder au back-office →</a>
        <p class="text-xs text-red-500 mt-4">⚠️ Changez votre mot de passe immédiatement après connexion.</p>
      </div>
    </body></html>
  )
})

app.get('/admin', adminAuth, refreshAdminCache, (c) => {
  return c.html(<AdminPage />)
})

app.get('/admin/produits', adminAuth, refreshAdminCache, (c) => {
  const success = c.req.query('success')
  const deleted = c.req.query('deleted')
  return c.html(<AdminProduitsPage success={success} deleted={deleted} />)
})

app.get('/admin/rdv', adminAuth, refreshAdminCache, (c) => {
  const status = c.req.query('status')
  return c.html(<AdminRDVPage filterStatus={status} />)
})

app.get('/admin/clients', adminAuth, refreshAdminCache, (c) => {
  return c.html(<AdminClientsPage />)
})

app.get('/admin/commandes', adminAuth, refreshAdminCache, (c) => {
  return c.html(<AdminCommandesPage />)
})

app.get('/admin/avis', adminAuth, refreshAdminCache, (c) => {
  return c.html(<AdminAvisPage />)
})

app.get('/admin/parametres', adminAuth, refreshAdminCache, (c) => {
  const success = c.req.query('success')
  const error = c.req.query('error')
  return c.html(<AdminParametresPage success={success} error={error} />)
})

app.post('/api/admin/change-password', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const current = (body['current_password'] as string || '').trim()
  const newPwd = (body['new_password'] as string || '').trim()
  const confirm = (body['confirm_password'] as string || '').trim()
  const newUsername = (body['new_username'] as string || '').trim()
  if (!newPwd || newPwd !== confirm) return c.redirect('/admin/parametres?error=mismatch')
  if (newPwd.length < 8) return c.redirect('/admin/parametres?error=too_short')
  if (newUsername && newUsername.length < 3) return c.redirect('/admin/parametres?error=username_short')

  // Verify current password
  const currentHash = await hashPassword(current)
  let storedHash = ''
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
      const row = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_password_hash').first() as any
      if (row?.value) storedHash = row.value
    } catch(e) { /* table may not exist */ }
  }
  if (!storedHash) storedHash = await hashPassword(DEFAULT_ADMIN_HASH_INPUT)
  if (currentHash !== storedHash) return c.redirect('/admin/parametres?error=wrong_current')

  // Store new password hash (and optional username) in D1
  const newHash = await hashPassword(newPwd)
  if (db) {
    try {
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', newHash, new Date().toISOString()).run()
      if (newUsername) {
        await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_username', newUsername, new Date().toISOString()).run()
      }
    } catch(e) { console.error('Error saving admin credentials:', e) }
  }
  return c.redirect('/admin/parametres?success=pwd')
})

// ============================================================
// DEVIS — HELPER FUNCTIONS
// ============================================================
async function ensureDevisTable(db: any) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS devis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rdv_id INTEGER,
    numero TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    client_quartier TEXT,
    surface REAL,
    btu_recommande INTEGER,
    produit_id INTEGER,
    produit_nom TEXT,
    produit_btu INTEGER,
    produit_prix INTEGER DEFAULT 0,
    produit_quantite INTEGER DEFAULT 1,
    installation_prix INTEGER DEFAULT 50000,
    accessoires TEXT DEFAULT '[]',
    remise INTEGER DEFAULT 0,
    total_ht INTEGER DEFAULT 0,
    message_client TEXT,
    notes_internes TEXT,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'draft',
    expires_at TEXT,
    accepted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run()
}

function generateDevisToken(): string {
  const arr = new Uint8Array(20)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function generateDevisNumber(db: any): Promise<string> {
  const year = new Date().getFullYear()
  try {
    const row = await db.prepare('SELECT COUNT(*) as cnt FROM devis').first() as any
    const count = (Number(row?.cnt) || 0) + 1
    return `DEV-${count.toString().padStart(4, '0')}-${year}`
  } catch { return `DEV-0001-${year}` }
}

function buildClientDevisHTML(d: any): string {
  const accs: any[] = JSON.parse(d.accessoires || '[]')
  const prodTotal = (Number(d.produit_prix) || 0) * (Number(d.produit_quantite) || 1)
  const installTotal = Number(d.installation_prix) || 0
  const accTotal = accs.reduce((s: number, a: any) => s + (Number(a.prix) || 0), 0)
  const sousTotal = prodTotal + installTotal + accTotal
  const remisePct = Number(d.remise) || 0
  const remiseMt = Math.round(sousTotal * remisePct / 100)
  const total = sousTotal - remiseMt
  const daysLeft = d.expires_at ? Math.max(0, Math.floor((new Date(d.expires_at).getTime() - Date.now()) / 86400000)) : 30
  const isExpired = d.expires_at && new Date(d.expires_at) < new Date() && d.status !== 'accepted'
  const isAccepted = d.status === 'accepted'
  const expiryStr = d.expires_at ? new Date(d.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const createdStr = new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Estimated annual savings (inverter vs fixed-speed estimate)
  let savingsHtml = ''
  if (d.btu_recommande && Number(d.btu_recommande) > 0) {
    const btu = Number(d.btu_recommande)
    const kw = btu / 3412 // rough kW
    const annualKwh = Math.round(kw * 8 * 300) // 8h/day, 300 days
    const savings = Math.round(annualKwh * 0.30 * 100) // 100 FCFA/kWh, 30% inverter saving
    savingsHtml = `
    <div style="background:linear-gradient(135deg,rgba(52,211,153,0.08),rgba(16,185,129,0.05)); border:1px solid rgba(52,211,153,0.2); border-radius:16px; padding:20px; margin:24px 0;">
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <div style="width:44px; height:44px; background:rgba(52,211,153,0.15); border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:20px;">💡</div>
        <div style="flex:1;">
          <div style="font-weight:700; color:#34d399; margin-bottom:4px;">Économies estimées avec Inverter</div>
          <div style="font-size:13px; color:#6b7280; line-height:1.6;">Pour un climatiseur ${btu.toLocaleString('fr-FR')} BTU, la technologie Inverter réduit votre consommation d'environ <strong style="color:#34d399;">30%</strong>, soit une économie annuelle estimée à :</div>
          <div style="font-size:28px; font-weight:800; color:#34d399; margin:8px 0;">${savings.toLocaleString('fr-FR')} FCFA <span style="font-size:14px; font-weight:500; color:#6b7280;">/ an</span></div>
          <div style="font-size:11px; color:#9ca3af;">Estimation basée sur 8h/jour, 300 jours/an et un tarif de 100 FCFA/kWh</div>
        </div>
      </div>
    </div>`
  }

  const acceptFormHtml = !isAccepted && !isExpired ? `
    <div style="text-align:center; padding:32px 20px; background:linear-gradient(135deg,rgba(56,189,248,0.06),rgba(99,102,241,0.06)); border-radius:16px; border:1px solid rgba(56,189,248,0.15); margin:24px 0;">
      <div style="font-size:18px; font-weight:700; color:#e2e8f0; margin-bottom:8px;">✅ Accepter ce devis ?</div>
      <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">En acceptant, vous confirmez votre accord sur les conditions ci-dessus.<br>Notre équipe vous contactera sous 24h pour planifier l'intervention.</p>
      <form method="post" action="/api/devis/${d.token}/accept" style="display:inline;">
        <button type="submit" style="background:linear-gradient(135deg,#059669,#10b981); color:white; font-weight:700; font-size:15px; padding:14px 32px; border-radius:12px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:10px; box-shadow:0 4px 15px rgba(16,185,129,0.3);">
          J'accepte ce devis — ${total.toLocaleString('fr-FR')} FCFA
        </button>
      </form>
      <div style="margin-top:16px;">
        <a href="https://wa.me/22655996418?text=${encodeURIComponent('Bonjour, je souhaite discuter du devis ' + d.numero)}" style="display:inline-flex; align-items:center; gap:8px; background:rgba(37,211,102,0.1); color:#25D366; font-weight:600; font-size:13px; padding:10px 20px; border-radius:10px; text-decoration:none; border:1px solid rgba(37,211,102,0.25);">
          <span style="font-size:18px;">💬</span> Poser une question par WhatsApp
        </a>
      </div>
    </div>` : isAccepted ? `
    <div style="text-align:center; padding:24px; background:rgba(52,211,153,0.08); border-radius:16px; border:1px solid rgba(52,211,153,0.2); margin:24px 0;">
      <div style="font-size:24px; margin-bottom:8px;">🎉</div>
      <div style="font-size:18px; font-weight:700; color:#34d399;">Devis accepté — Merci !</div>
      <p style="color:#94a3b8; font-size:13px; margin-top:6px;">Notre équipe va vous contacter très prochainement.</p>
    </div>` : `
    <div style="text-align:center; padding:24px; background:rgba(239,68,68,0.08); border-radius:16px; border:1px solid rgba(239,68,68,0.2); margin:24px 0;">
      <div style="font-size:18px; font-weight:700; color:#f87171;">⚠️ Ce devis est expiré</div>
      <p style="color:#94a3b8; font-size:13px; margin-top:6px;">Contactez-nous pour un nouveau devis actualisé.</p>
    </div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${d.numero} · Devis MAASGA</title>
<meta name="robots" content="noindex,nofollow">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; background: #0b1120; color: #e2e8f0; min-height: 100vh; }
  .container { max-width: 680px; margin: 0 auto; padding: 20px 16px 60px; }
  .header { background: linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 50%, #0ea5e9 100%); border-radius: 20px; padding: 28px 24px; margin-bottom: 24px; position: relative; overflow: hidden; }
  .header::before { content: '❄️'; position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-size: 64px; opacity: 0.12; }
  .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .logo-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .logo-text { font-weight: 800; font-size: 20px; color: white; }
  .logo-sub { font-size: 11px; color: rgba(255,255,255,0.7); }
  .devis-num { font-size: 24px; font-weight: 800; color: white; }
  .devis-date { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 10px; }
  .status-sent { background: rgba(251,191,36,0.2); color: #fbbf24; border: 1px solid rgba(251,191,36,0.35); }
  .status-accepted { background: rgba(52,211,153,0.2); color: #34d399; border: 1px solid rgba(52,211,153,0.35); }
  .status-expired { background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.35); }
  .expiry-banner { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; font-size: 13px; color: #fbbf24; margin-bottom: 20px; }
  .section { background: #111827; border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(56,189,248,0.1); }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #38bdf8; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid rgba(148,180,220,0.06); font-size: 13px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #64748b; flex-shrink: 0; margin-right: 12px; }
  .info-val { color: #e2e8f0; font-weight: 500; text-align: right; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: rgba(56,189,248,0.06); padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
  td { padding: 12px; border-bottom: 1px solid rgba(148,180,220,0.06); vertical-align: top; }
  .td-right { text-align: right; white-space: nowrap; font-weight: 600; color: #e2e8f0; }
  .total-row td { border-bottom: none; padding-top: 16px; }
  .total-label { font-size: 16px; font-weight: 700; color: #e2e8f0; }
  .total-amount { font-size: 22px; font-weight: 800; color: #38bdf8; text-align: right; }
  .discount-row td { color: #34d399; font-size: 12px; }
  .footer { text-align: center; padding: 20px; color: #4b5563; font-size: 11px; line-height: 1.7; }
  @media print { body { background: white; color: #111; } .section { background: #f9fafb; border: 1px solid #e5e7eb; } }
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <div class="logo">
      <div class="logo-icon">❄️</div>
      <div>
        <div class="logo-text">MAASGA</div>
        <div class="logo-sub">Froid & Climatisation · Ouagadougou</div>
      </div>
    </div>
    <div class="devis-num">${d.numero}</div>
    <div class="devis-date">Émis le ${createdStr}</div>
    <div>
      <span class="status-pill ${isAccepted ? 'status-accepted' : isExpired ? 'status-expired' : 'status-sent'}">
        ${isAccepted ? '✓ Devis accepté' : isExpired ? '⚠ Expiré' : '⏳ En attente de validation'}
      </span>
    </div>
  </div>

  ${!isAccepted && !isExpired && daysLeft <= 7 ? `
  <div class="expiry-banner">
    <span style="font-size:18px;">⏰</span>
    <span>Ce devis expire dans <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong> — ${expiryStr}. Acceptez avant cette date.</span>
  </div>` : !isAccepted && !isExpired && expiryStr ? `
  <div style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.12); border-radius:12px; padding:10px 16px; font-size:12px; color:#38bdf8; margin-bottom:16px;">
    ✓ Devis valable jusqu'au ${expiryStr} · ${daysLeft} jours restants
  </div>` : ''}

  <div class="section">
    <div class="section-title">👤 Client</div>
    <div class="info-row"><span class="info-label">Nom</span><span class="info-val">${d.client_name}</span></div>
    <div class="info-row"><span class="info-label">Téléphone</span><span class="info-val">${d.client_phone}</span></div>
    ${d.client_email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val">${d.client_email}</span></div>` : ''}
    ${d.client_quartier ? `<div class="info-row"><span class="info-label">Adresse</span><span class="info-val">${d.client_quartier}, Ouagadougou</span></div>` : ''}
  </div>

  ${(d.surface || d.btu_recommande) ? `
  <div class="section">
    <div class="section-title">📐 Données techniques</div>
    ${d.surface ? `<div class="info-row"><span class="info-label">Surface à climatiser</span><span class="info-val">${Number(d.surface).toLocaleString('fr-FR')} m²</span></div>` : ''}
    ${d.btu_recommande ? `<div class="info-row"><span class="info-label">Puissance recommandée</span><span class="info-val">${Number(d.btu_recommande).toLocaleString('fr-FR')} BTU / ${Number(d.btu_recommande) === 9000 ? '1' : Number(d.btu_recommande) === 12000 ? '1,5' : Number(d.btu_recommande) === 18000 ? '2' : Number(d.btu_recommande) === 24000 ? '3' : '5'} CV</span></div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="section-title">📋 Détail du devis</div>
    <table>
      <thead><tr>
        <th style="width:50%">Désignation</th>
        <th style="width:15%">Qté</th>
        <th style="width:20%">P.U.</th>
        <th style="width:15%">Total</th>
      </tr></thead>
      <tbody>
        ${d.produit_nom ? `<tr>
          <td><strong style="color:#e2e8f0;">${d.produit_nom}</strong></td>
          <td class="td-right">${Number(d.produit_quantite) || 1}</td>
          <td class="td-right">${(Number(d.produit_prix) || 0).toLocaleString('fr-FR')}</td>
          <td class="td-right">${prodTotal.toLocaleString('fr-FR')}</td>
        </tr>` : ''}
        <tr>
          <td>Main d'œuvre &amp; installation</td>
          <td class="td-right">1</td>
          <td class="td-right">${installTotal.toLocaleString('fr-FR')}</td>
          <td class="td-right">${installTotal.toLocaleString('fr-FR')}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding-top:4px; padding-bottom:4px; font-size:11px; color:#4b5563; font-style:italic;">Mise en service · Test complet · Vérification étanchéité · Formation utilisation</td>
          <td></td>
        </tr>
        ${accs.filter((a:any) => a.nom).map((a:any) => `<tr>
          <td style="color:#94a3b8;">${a.nom}</td>
          <td class="td-right">1</td>
          <td class="td-right">${(Number(a.prix) || 0).toLocaleString('fr-FR')}</td>
          <td class="td-right">${(Number(a.prix) || 0).toLocaleString('fr-FR')}</td>
        </tr>`).join('')}
        <tr style="border-top:1px solid rgba(148,180,220,0.15);">
          <td colspan="3" style="padding-top:12px; font-size:12px; color:#6b7280;">Sous-total</td>
          <td class="td-right" style="padding-top:12px;">${sousTotal.toLocaleString('fr-FR')}</td>
        </tr>
        ${remisePct > 0 ? `<tr class="discount-row">
          <td colspan="3" style="padding-bottom:8px; font-size:12px;">Remise accordée (${remisePct}%)</td>
          <td class="td-right" style="padding-bottom:8px;">− ${remiseMt.toLocaleString('fr-FR')}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td colspan="3"><span class="total-label">TOTAL TTC</span><div style="font-size:10px; color:#6b7280; margin-top:2px;">Toutes taxes comprises</div></td>
          <td><div class="total-amount">${total.toLocaleString('fr-FR')}<br><span style="font-size:11px; font-weight:600; color:#38bdf8;">FCFA</span></div></td>
        </tr>
      </tbody>
    </table>
  </div>

  ${savingsHtml}

  ${acceptFormHtml}

  ${d.message_client ? `
  <div class="section" style="border-color:rgba(99,102,241,0.2);">
    <div class="section-title" style="color:#a78bfa;">💬 Message de l'équipe MAASGA</div>
    <p style="font-size:14px; color:#cbd5e1; line-height:1.7; white-space:pre-wrap;">${d.message_client}</p>
  </div>` : ''}

  <div class="section" style="background:rgba(56,189,248,0.03);">
    <div class="section-title">✅ Nos engagements</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      ${[
        ['🔧', 'Techniciens certifiés', 'Équipe qualifiée'],
        ['🛡️', 'Garantie installation', '12 mois pièces et main d\'œuvre'],
        ['📞', 'SAV rapide', 'Intervention sous 48h'],
        ['💯', 'Satisfaction garantie', 'Ou intervention gratuite']
      ].map(([icon, title, sub]) => `
      <div style="background:rgba(56,189,248,0.04); border:1px solid rgba(56,189,248,0.08); border-radius:10px; padding:12px;">
        <div style="font-size:20px; margin-bottom:6px;">${icon}</div>
        <div style="font-size:12px; font-weight:700; color:#e2e8f0;">${title}</div>
        <div style="font-size:11px; color:#64748b; margin-top:2px;">${sub}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="footer">
    <strong>MAASGA — Froid &amp; Climatisation</strong><br>
    📞 +226 55 99 64 18 &nbsp;|&nbsp; Ouagadougou, Burkina Faso<br>
    Lundi–Dimanche · 8h00–18h00<br><br>
    <em>Ce devis est valable jusqu'au ${expiryStr || '30 jours'}. Aucun paiement n'est requis avant accord et signature du client. Le montant définitif peut être ajusté après visite technique si les conditions réelles diffèrent.</em>
  </div>
</div>
</body>
</html>`
}

// ============================================================
// DEVIS ROUTES — ADMIN
// ============================================================

app.get('/admin/devis', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let devisData: any[] = []
  if (db) {
    try {
      await ensureDevisTable(db)
      const rows = await db.prepare('SELECT * FROM devis ORDER BY created_at DESC').all()
      devisData = (rows.results as any[]) || []
    } catch(e) { console.error('Devis list error:', e) }
  }
  return c.html(<AdminDevisListPage devisData={devisData} />)
})

app.get('/admin/devis/new', adminAuth, refreshAdminCache, async (c) => {
  const rdvId = parseInt(c.req.query('rdvId') || '0')
  const rdv = rdvId ? appointments.find((a: any) => a.id === rdvId) : null
  // Try to extract surface/btu from URL params OR from RDV notes
  let surface = c.req.query('surface') || ''
  let btu = c.req.query('btu') || ''
  if (rdv?.notes && (!surface || !btu)) {
    const surfMatch = rdv.notes.match(/(\d+(?:\.\d+)?)\s*m²/)
    const btuMatch = rdv.notes.match(/(\d{4,5})\s*BTU/)
    if (surfMatch && !surface) surface = surfMatch[1]
    if (btuMatch && !btu) btu = btuMatch[1]
  }
  return c.html(<AdminDevisNewPage rdv={rdv} productsList={products} surface={surface} btu={btu} />)
})

app.post('/api/admin/devis/create', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const db = c.env.DB
  if (!db) return c.redirect('/admin/devis?error=no_db')
  try {
    await ensureDevisTable(db)
    const token = generateDevisToken()
    const numero = await generateDevisNumber(db)
    const rdvId = body['rdv_id'] ? parseInt(body['rdv_id'] as string) : null
    const action = (body['action'] as string) || 'draft'

    // Build accessories JSON
    const accs: any[] = []
    for (let i = 1; i <= 5; i++) {
      const nom = (body[`acc_nom_${i}`] as string || '').trim()
      const prix = parseInt(body[`acc_prix_${i}`] as string) || 0
      if (nom) accs.push({ nom, prix })
    }

    // Compute total
    const prodPrix = parseInt(body['produit_prix'] as string) || 0
    const prodQty = parseInt(body['produit_quantite'] as string) || 1
    const installPrix = parseInt(body['installation_prix'] as string) || 50000
    const remise = parseInt(body['remise'] as string) || 0
    const accTotal = accs.reduce((s, a) => s + a.prix, 0)
    const sousTotal = (prodPrix * prodQty) + installPrix + accTotal
    const totalHt = sousTotal - Math.round(sousTotal * remise / 100)

    const expiresAt = (body['expires_at'] as string) || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const now = new Date().toISOString()
    const status = action === 'send' ? 'sent' : 'draft'

    await db.prepare(`INSERT INTO devis (rdv_id,numero,client_name,client_phone,client_email,client_quartier,surface,btu_recommande,produit_nom,produit_prix,produit_quantite,installation_prix,accessoires,remise,total_ht,message_client,notes_internes,token,status,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(rdvId, numero, body['client_name'], body['client_phone'], body['client_email'] || null, body['client_quartier'] || null, body['surface'] ? parseFloat(body['surface'] as string) : null, body['btu_recommande'] ? parseInt(body['btu_recommande'] as string) : null, body['produit_nom'] || null, prodPrix, prodQty, installPrix, JSON.stringify(accs), remise, totalHt, body['message_client'] || null, body['notes_internes'] || null, token, status, expiresAt, now, now)
      .run()
    return c.redirect('/admin/devis')
  } catch(e) {
    console.error('Devis create error:', e)
    return c.redirect('/admin/devis/new?error=create_failed')
  }
})

app.post('/api/admin/devis/accept', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare("UPDATE devis SET status='accepted', accepted_at=?, updated_at=? WHERE id=?").bind(new Date().toISOString(), new Date().toISOString(), id).run()
    } catch(e) { console.error('Devis accept error:', e) }
  }
  return c.redirect('/admin/devis')
})

app.post('/api/admin/devis/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const db = c.env.DB
  if (db) {
    try { await db.prepare('DELETE FROM devis WHERE id=?').bind(id).run() } catch(e) { /* ignore */ }
  }
  return c.redirect('/admin/devis')
})

// ============================================================
// DEVIS — CLIENT VIEW (public)
// ============================================================

app.get('/devis/:token', async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (!db) return c.html('<h1>Erreur: base de données indisponible</h1>', 500)
  try {
    await ensureDevisTable(db)
    const devis = await db.prepare('SELECT * FROM devis WHERE token = ?').bind(token).first() as any
    if (!devis) return c.html('<html><body style="background:#0b1120;color:#fff;font-family:sans-serif;text-align:center;padding:80px 20px;"><h1>Devis introuvable</h1><p style="color:#6b7280;">Ce lien est invalide ou expiré.</p><br><a href="/" style="color:#38bdf8;">← MAASGA</a></body></html>', 404)
    return c.html(buildClientDevisHTML(devis as any))
  } catch(e) {
    console.error('Devis view error:', e)
    return c.html('<html><body style="background:#0b1120;color:#fff;font-family:sans-serif;text-align:center;padding:80px 20px;"><h1>Erreur</h1><p>Impossible de charger ce devis.</p></body></html>', 500)
  }
})

app.post('/api/devis/:token/accept', async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare("UPDATE devis SET status='accepted', accepted_at=?, updated_at=? WHERE token=? AND status='sent'").bind(new Date().toISOString(), new Date().toISOString(), token).run()
    } catch(e) { console.error('Devis accept error:', e) }
  }
  return c.redirect(`/devis/${token}`)
})

// API Admin - Mise à jour statut RDV
app.post('/api/admin/rdv/update', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const status = body['status'] as 'pending' | 'confirmed' | 'done'
  const rdv = appointments.find(a => a.id === id)
  if (rdv) rdv.status = status
  
  // Modifier status en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind(status, id).run()
    } catch (error) {
      console.error('Erreur D1 rdv update:', error)
    }
  }
  
  return c.redirect('/admin/rdv?success=1')
})

// API Admin - Valider la visite (marquer RDV done SANS créer de commande)
app.post('/api/admin/rdv/validate-visit', adminAuth, async (c) => {
  const body = await c.req.json()
  const appointment_id = body.appointment_id as number
  const rdv = appointments.find(a => a.id === appointment_id)
  if (rdv) rdv.status = 'done'

  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind('done', appointment_id).run()
    } catch (error) {
      console.error('Erreur D1 validate-visit:', error)
    }
  }

  return c.json({ success: true, message: 'Visite validée avec succès' })
})

// API Admin - Approuver avis
app.post('/api/admin/avis/approve', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const review = reviews.find(r => r.id === id)
  if (review) review.approved = true
  
  // Approuver en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('UPDATE reviews SET approved = 1 WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 avis approve:', error)
    }
  }
  
  return c.redirect('/admin/avis?success=1')
})

// API Admin - Rejeter avis
app.post('/api/admin/avis/reject', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = reviews.findIndex(r => r.id === id)
  if (idx !== -1) reviews.splice(idx, 1)
  
  // Rejeter (supprimer) en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 avis reject:', error)
    }
  }
  
  return c.redirect('/admin/avis?deleted=1')
})

// API Admin - Ajouter un produit
app.post('/api/admin/produit/add', adminAuth, async (c) => {
  const body = await c.req.parseBody()
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
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    imageUrl = `data:${file.type || 'image/jpeg'};base64,${btoa(binary)}`
  }

  // Parse media JSON
  let media: any[] = []
  try {
    const mediaJson = body['media_json'] as string
    media = mediaJson ? JSON.parse(mediaJson) : []
  } catch (e) {
    media = []
  }

  const newProduct: any = {
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
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

  // Écrire en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO products (name, brand, model, btu, price, stock, surface_min, surface_max, energy_class, description, inverter, available, warranty, features, image, imageUrl, tech_specs, media_urls)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        name, brand, model, btu, price, stock, surface_min, surface_max, energy_class,
        description, inverter ? 1 : 0, available ? 1 : 0, '1 an constructeur',
        features.length > 0 ? JSON.stringify(features) : null,
        '❄️', imageUrl || null, techSpecsJson,
        media.length > 0 ? JSON.stringify(media) : null
      ).run()
    } catch (error) {
      console.error('Erreur D1 produit add:', error)
    }
  }
  
  return c.redirect('/admin/produits?success=1')
})

// API Admin - Modifier un produit
app.post('/api/admin/produit/update', adminAuth, async (c) => {
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
  
  // Parse media JSON
  let media: any[] = []
  try {
    const mediaJson = body['media_json'] as string
    if (mediaJson) {
      media = JSON.parse(mediaJson)
    } else {
      // Keep existing media if not updated
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
app.post('/api/admin/produit/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = products.findIndex(p => p.id === id)
  if (idx !== -1) products.splice(idx, 1)
  
  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 produit delete:', error)
    }
  }
  
  return c.redirect('/admin/produits?deleted=1')
})

// API Admin - Uploader/changer l'image d'un produit
app.post('/api/admin/produit/image', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const file = body['image'] as File | null
  if (file && file instanceof File && file.size > 0) {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${btoa(binary)}`
    const product = products.find(p => p.id === id)
    if (product) (product as any).imageUrl = dataUrl
  }
  return c.redirect('/admin/produits?success=1')
})

// API Admin - Modifier stock produit
app.post('/api/admin/produit/stock', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const stock = parseInt(body['stock'] as string)
  const product = products.find(p => p.id === id)
  if (product) {
    product.stock = stock
    product.available = stock > 0
  }
  
  // Modifier stock en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      const available = stock > 0 ? 1 : 0
      await db.prepare('UPDATE products SET stock = ?, available = ? WHERE id = ?')
        .bind(stock, available, id).run()
    } catch (error) {
      console.error('Erreur D1 produit stock:', error)
    }
  }
  
  return c.redirect('/admin/produits?success=1')
})

// API Génération devis PDF (simulation)
app.get('/api/devis/:rdvId', adminAuth, (c) => {
  const rdvId = parseInt(c.req.param('rdvId'))
  const rdv = appointments.find(a => a.id === rdvId)
  if (!rdv) return c.json({ error: 'RDV non trouvé' }, 404)

  const html = `
    <!DOCTYPE html>
    <html><head>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        .header { background: linear-gradient(135deg, #1e3a8a, #0284c7); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; }
        .subtitle { font-size: 14px; opacity: 0.8; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .total { font-size: 20px; font-weight: bold; color: #1e3a8a; }
        .notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; font-size: 13px; color: #92400e; margin-top: 20px; }
        .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head><body>
      <div class="header">
        <div class="title">❄️ MAASGA - Devis Technique</div>
        <div class="subtitle">Froid & Climatisation · Ouagadougou, Burkina Faso</div>
      </div>
      <h2>Devis N° DEV-${rdvId.toString().padStart(4,'0')}-${new Date().getFullYear()}</h2>
      <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
      <p><strong>Client :</strong> ${rdv.name}</p>
      <p><strong>Téléphone :</strong> ${rdv.phone}</p>
      <p><strong>Quartier :</strong> ${rdv.quartier}</p>
      <p><strong>Type :</strong> ${rdv.type === 'devis' ? 'Dimensionnement / Devis' : 'Installation'}</p>
      ${rdv.notes ? `<p><strong>Notes :</strong> ${rdv.notes}</p>` : ''}
      <table>
        <thead><tr><th>Prestation</th><th>Détails</th><th>Montant</th></tr></thead>
        <tbody>
          <tr><td>Visite technique sur site</td><td>Dimensionnement et conseil</td><td>GRATUIT</td></tr>
          <tr><td>Climatiseur recommandé</td><td>À définir après visite technique</td><td>Sur devis</td></tr>
          <tr><td>Installation professionnelle</td><td>Main d'œuvre + accessoires</td><td>Sur devis</td></tr>
          <tr><td>Mise en service + test</td><td>Vérification complète</td><td>Inclus</td></tr>
        </tbody>
      </table>
      <div class="notice">
        ⚠️ Ce devis est indicatif. Le montant définitif sera déterminé après la visite technique sur site. Aucun paiement n'est requis avant Visite technique gratuite et accord du client.
      </div>
      <div class="footer">
        MAASGA - Froid & Climatisation | contact@maasga.bf | +226 70 00 00 00<br/>
        Ouagadougou, Burkina Faso | Techniciens certifiés
      </div>
    </body></html>
  `
  return c.html(html)
})

// ============================================================
// API JSON (pour intégration app mobile future)
// ============================================================

app.get('/api/products', async (c) => {
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

app.get('/api/products/:id', async (c) => {
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

app.get('/api/reviews', async (c) => {
  // Mode hybride
  let list = reviews.filter(r => r.approved)
  const db = c.env.DB
  
  if (db) {
    try {
      const dbReviews = await getReviews(db, true)
      list = dbReviews as any[]
    } catch (error) {
      console.error('Erreur D1 avis, fallback mémoire:', error)
      list = reviews.filter(r => r.approved)
    }
  }
  
  return c.json(list)
})

app.get('/api/quartiers', async (c) => {
  // Mode hybride
  let list = quartiers
  const db = c.env.DB
  
  if (db) {
    try {
      list = await getQuartiers(db) as any
    } catch (error) {
      console.error('Erreur D1 quartiers, fallback mémoire:', error)
      list = quartiers
    }
  }
  
  return c.json(list)
})

// API Admin - Créer une commande depuis un RDV
app.post('/api/admin/create-order', adminAuth, async (c) => {
  const body = await c.req.json()
  const appointment_id = body.appointment_id as number
  const client_name = (body.client_name as string || '').trim()
  const client_phone = (body.client_phone as string || '').trim()
  const quartier = (body.quartier as string || '').trim()
  const type = body.type as 'devis' | 'installation'

  // Vérifier que le RDV existe
  const appointment = appointments.find(a => a.id === appointment_id)
  if (!appointment) {
    return c.json({ success: false, error: 'Rendez-vous non trouvé' }, 404)
  }

  // Mettre à jour le statut du RDV à 'confirmed'
  appointment.status = 'confirmed'

  // Créer une nouvelle commande
  const newOrder = {
    id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
    appointment_id,
    client_name,
    client_phone,
    quartier,
    type,
    status: 'validated' as const,
    created_at: new Date().toISOString()
  }
  orders.push(newOrder)

  // Mettre à jour en base de données D1 si disponible
  const db = c.env.DB
  if (db) {
    try {
      await updateAppointmentStatus(db, appointment_id, 'confirmed')
      await createOrder(db, {
        appointment_id,
        client_name,
        client_phone,
        quartier,
        type,
        status: 'validated'
      })
    } catch (error) {
      console.error('Erreur lors de la création de la commande en D1:', error)
    }
  }

  return c.json({ 
    success: true, 
    order_id: newOrder.id,
    message: `✅ Commande #${newOrder.id} créée avec succès. Statut du RDV mis à jour.`
  })
})

// API Admin - Récupérer les commandes par RDV
app.get('/api/admin/orders-by-appointment/:id', adminAuth, async (c) => {
  const appointment_id = parseInt(c.req.param('id'))
  const appointmentOrders = orders.filter(o => o.appointment_id === appointment_id)
  return c.json(appointmentOrders)
})

app.get('/api/stats', adminAuth, (c) => {
  const totalRdv = appointments.length
  const pendingRdv = appointments.filter(a => a.status === 'pending').length
  const confirmedRdv = appointments.filter(a => a.status === 'confirmed').length
  const doneRdv = appointments.filter(a => a.status === 'done').length
  const totalProducts = products.length
  const availableProducts = products.filter(p => p.available && p.stock > 0).length
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 3).length
  const outOfStockProducts = products.filter(p => p.stock === 0).length
  const totalReviews = reviews.length
  const pendingReviews = reviews.filter(r => !r.approved).length
  const avgNote = reviews.filter(r => r.approved).length > 0
    ? (reviews.filter(r => r.approved).reduce((s, r) => s + r.note, 0) / reviews.filter(r => r.approved).length).toFixed(1)
    : '5.0'

  return c.json({
    rdv: { total: totalRdv, pending: pendingRdv, confirmed: confirmedRdv, done: doneRdv },
    products: { total: totalProducts, available: availableProducts, lowStock: lowStockProducts, outOfStock: outOfStockProducts },
  })
})

// ============================================================
// API CLIENTS - CRUD COMPLET
// ============================================================

// Réinitialiser la base de données (supprimer toutes les données)
app.post('/api/admin/reset-db', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) {
    return c.json({ success: false, error: 'D1 non disponible' }, 400)
  }

  try {
    // Désactiver les contraintes de clés étrangères pour permettre la suppression
    await db.prepare('PRAGMA foreign_keys = OFF').run()
    
    // Vider toutes les tables (ordonnéé pour éviter les FK conflicts)
    await db.prepare('DELETE FROM orders').run()
    await db.prepare('DELETE FROM appointments').run()
    await db.prepare('DELETE FROM admin_sessions').run()
    await db.prepare('DELETE FROM reviews').run()
    await db.prepare('DELETE FROM clients').run()
    await db.prepare('DELETE FROM products').run()
    await db.prepare('DELETE FROM quartiers').run()
    
    // Réactiver les contraintes
    await db.prepare('PRAGMA foreign_keys = ON').run()
    
    // Réinitialiser les compteurs autoincrement
    await db.prepare('DELETE FROM sqlite_sequence').run()
    
    // Vider aussi les données en mémoire
    appointments.length = 0
    reviews.length = 0
    orders.length = 0
    clients.length = 0
    
    return c.json({ 
      success: true, 
      message: '✅ Base de données complètement réinitialisée (D1 + mémoire + sqlite_sequence)'
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: `Erreur lors de la réinitialisation: ${error}`
    }, 500)
  }
})

app.post('/api/admin/client/add', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const name = (body['name'] as string || '').trim()
  const email = (body['email'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const quartier = (body['quartier'] as string || '').trim()

  if (!name || !phone) {
    return c.json({ success: false, error: 'Nom et téléphone requis' }, 400)
  }

  const newClient = {
    id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
    name, email, phone, quartier,
    password_hash: 'pending',
    created_at: new Date().toISOString().split('T')[0]
  }
  clients.push(newClient)

  // Écrire en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO clients (name, email, phone, quartier, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(name, email, phone, quartier, 'pending', new Date().toISOString().split('T')[0]).run()
    } catch (error) {
      console.error('Erreur D1 client add:', error)
    }
  }

  return c.redirect('/admin/clients?success=1')
})

app.post('/api/admin/client/update', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const clientIndex = clients.findIndex(cl => cl.id === id)

  if (clientIndex === -1) {
    return c.redirect('/admin/clients?error=notfound')
  }

  const name = (body['name'] as string || '').trim()
  const email = (body['email'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const quartier = (body['quartier'] as string || '').trim()

  clients[clientIndex] = { ...clients[clientIndex], name, email, phone, quartier }

  // Écrire en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(`
        UPDATE clients SET name = ?, email = ?, phone = ?, quartier = ? WHERE id = ?
      `).bind(name, email, phone, quartier, id).run()
    } catch (error) {
      console.error('Erreur D1 client update:', error)
    }
  }

  return c.redirect('/admin/clients?success=1')
})

app.post('/api/admin/client/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = clients.findIndex(cl => cl.id === id)
  if (idx !== -1) clients.splice(idx, 1)

  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM clients WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 client delete:', error)
    }
  }

  return c.redirect('/admin/clients?success=1')
})

// ============================================================
// API RDV - CRUD COMPLET
// ============================================================
app.post('/api/admin/rdv/add', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const name = (body['name'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const quartier = (body['quartier'] as string || '').trim()
  const date = (body['date'] as string || '').trim()
  const heure_debut = (body['heure_debut'] as string || '08:00').trim()
  const heure_fin = (body['heure_fin'] as string || '18:00').trim()
  const type = (body['type'] as string || 'devis') as 'devis' | 'installation'
  const notes = (body['notes'] as string || '').trim()
  const latitude = parseFloat(body['latitude'] as string) || null
  const longitude = parseFloat(body['longitude'] as string) || null

  if (!name || !phone || !quartier || !date) {
    return c.json({ success: false, error: 'Champs requis: nom, téléphone, quartier, date' }, 400)
  }

  const newRdv = {
    id: appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1,
    name, phone, quartier, date, heure_debut, heure_fin, type, notes,
    latitude: latitude as any, longitude: longitude as any,
    adresse_precise: '', status: 'pending' as 'pending',
    created_at: new Date().toISOString().split('T')[0]
  }
  appointments.push(newRdv)

  // Écrire en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await createAppointment(db, {
        name, phone, quartier, date, heure_debut, heure_fin, type, notes,
        latitude, longitude, adresse_precise: ''
      })
    } catch (error) {
      console.error('Erreur D1 rdv add:', error)
    }
  }

  return c.redirect('/admin/rdv?success=1')
})

app.post('/api/admin/rdv/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = appointments.findIndex(a => a.id === id)
  if (idx !== -1) appointments.splice(idx, 1)

  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM appointments WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 rdv delete:', error)
    }
  }

  return c.redirect('/admin/rdv?success=1')
})

// ============================================================
// API COMMANDES - CRUD COMPLET
// ============================================================
app.post('/api/admin/commande/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = orders.findIndex(o => o.id === id)
  if (idx !== -1) orders.splice(idx, 1)

  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM orders WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 commande delete:', error)
    }
  }

  return c.redirect('/admin/commandes?success=1')
})

app.post('/api/admin/commande/update-statut', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const status = body['status'] as string
  const order = orders.find(o => o.id === id)

  if (order) {
    order.status = status as any
  }

  // Mettre à jour en D1
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, id).run()
    } catch (error) {
      console.error('Erreur D1 commande update:', error)
    }
  }

  return c.redirect('/admin/commandes?success=1')
})

// ============================================================
// 404
// ============================================================

app.notFound((c) => {
  return c.html(
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Page non trouvée - MAASGA</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div class="text-center max-w-md">
          <div class="text-8xl font-black text-blue-100 mb-4">404</div>
          <div class="text-6xl mb-6">❄️</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">Page introuvable</h1>
          <p class="text-gray-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
          <a href="/" class="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2">
            <span>Retour à l'accueil</span>
          </a>
        </div>
      </body>
    </html>,
    404
  )
})

export default app
