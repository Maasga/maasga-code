// Public Web Form Endpoints (/api/rdv, /api/avis, /api/contact, /api/stock-alert, /api/maintenance/request)
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { HonoEnv } from '../../types'
import { appointments, reviews } from '../../data/store'
import { createAppointment, createClient } from '../../db'
import { rateLimit } from '../../utils/security'
import { isValidPhone, isValidEmail, sanitizeText } from '../../utils/helpers'
import { notifyAdmin } from '../../utils/notifications'
import { calculatePlanPricing } from '../../services/pricing.service'
import { getSession } from '../../services/session.service'

export const webFormsRouter = new Hono<HonoEnv>()

// ============================================================
// API RENDEZ-VOUS
// ============================================================
webFormsRouter.post('/api/rdv', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`rdv:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/rendez-vous?error=' + encodeURIComponent('Trop de demandes. Réessayez plus tard.'))
  }

  const body = await c.req.parseBody()
  if (body['website']) return c.redirect('/rendez-vous?success=1')
  const name = (body['name'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const quartier = (body['quartier'] as string || '').trim()
  const date = (body['date'] as string || '').trim()
  const heure_debut = (body['heure_debut'] as string || '08:00').trim()
  const heure_fin = (body['heure_fin'] as string || '18:00').trim()
  const email = (body['email'] as string || '').trim()
  const typeRaw = (body['type'] as string || 'devis').toLowerCase()
  const validRdvTypes = ['devis', 'installation', 'entretien', 'depannage'] as const
  const type = (validRdvTypes.includes(typeRaw as any) ? typeRaw : 'devis') as 'devis' | 'installation' | 'entretien' | 'depannage'
  const notes = (body['notes'] as string || '').trim()
  const latitude = parseFloat(body['latitude'] as string) || null
  const longitude = parseFloat(body['longitude'] as string) || null
  const adresse_precise = (body['adresse_precise'] as string || '').trim()
  const productId = body['product_id'] as string

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

  if (!isValidPhone(phone)) {
    return c.redirect('/rendez-vous?error=' + encodeURIComponent('Numéro de téléphone invalide (8 chiffres requis).'))
  }

  if (email && !isValidEmail(email)) {
    return c.redirect('/rendez-vous?error=' + encodeURIComponent('Adresse email invalide.'))
  }

  const newRdv = {
    id: appointments.length + 1,
    name: name,
    phone: phone,
    quartier: quartier,
    date,
    heure_debut,
    heure_fin,
    type,
    notes: notesWithHints + (productId ? ` [Produit #${productId}]` : ''),
    latitude,
    longitude,
    adresse_precise,
    status: 'pending' as const,
    created_at: new Date().toISOString().split('T')[0]
  }
  appointments.push(newRdv)

  const db = c.env.DB
  if (db) {
    try {
      await createClient(db, {
        name: name,
        phone: phone,
        email: email || null,
        quartier: quartier,
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

    try {
      await createAppointment(db, {
        name: name,
        phone: phone,
        quartier: quartier,
        date,
        heure_debut,
        heure_fin,
        type,
        notes: notesWithHints + (productId ? ` [Produit #${productId}]` : ''),
        latitude: latitude || null,
        longitude: longitude || null,
        adresse_precise: adresse_precise || null
      })
    } catch (error) {
      console.error('Erreur createAppointment D1:', error)
    }
  }

  const typeLabels: Record<string, string> = { devis: 'Devis', installation: 'Installation', entretien: 'Entretien', depannage: 'Dépannage' }
  const message = `Nouveau RDV (${typeLabels[type] || type}) pour ${name} le ${date} à ${quartier}. Tél: ${phone}`
  await notifyAdmin(c.env, 'rdv', message)

  return c.redirect('/rendez-vous?success=1')
})

// ============================================================
// API AVIS
// ============================================================
webFormsRouter.post('/api/avis', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`avis:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/avis?error=' + encodeURIComponent('Trop de soumissions. Réessayez plus tard.'))
  }

  const body = await c.req.parseBody()
  const name = (body['name'] as string || '').trim()
  const note = parseInt(body['note'] as string || '5')
  const comment = (body['comment'] as string || '').trim()
  const service = (body['service'] as string || '').trim()

  if (!name || !comment || comment.length < 10) {
    return c.redirect('/avis?error=' + encodeURIComponent('Veuillez remplir tous les champs correctement.'))
  }

  const safeNote = Math.min(5, Math.max(1, isNaN(note) ? 5 : note))
  const reviewDate = new Date().toISOString().split('T')[0]
  const reviewService = service || 'Service MAASGA'

  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(
        'INSERT INTO reviews (name, note, comment, date, service, approved) VALUES (?, ?, ?, ?, ?, 0)'
      ).bind(name, safeNote, comment, reviewDate, reviewService).run()
    } catch (error) {
      console.error('Erreur D1 avis:', error)
      return c.redirect('/avis?error=' + encodeURIComponent('Erreur lors de la sauvegarde. Réessayez.'))
    }
  } else {
    reviews.push({ id: reviews.length + 1, name, note: safeNote, comment, date: reviewDate, service: reviewService, approved: false })
  }

  return c.redirect('/avis?success=1')
})

// ============================================================
// API CONTACT
// ============================================================
webFormsRouter.post('/api/contact', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/contact?error=' + encodeURIComponent('Trop de messages envoyés. Réessayez plus tard.'))
  }

  const body = await c.req.parseBody()
  if (body['website']) return c.redirect('/contact?success=1')
  const name = (body['name'] as string || '').trim()
  const email = (body['email'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const message = (body['message'] as string || '').trim()

  if (!name || !message) {
    return c.redirect('/contact?error=' + encodeURIComponent('Nom et message sont obligatoires.'))
  }

  if (email && !isValidEmail(email)) {
    return c.redirect('/contact?error=' + encodeURIComponent('Adresse email invalide.'))
  }

  if (phone && !isValidPhone(phone)) {
    return c.redirect('/contact?error=' + encodeURIComponent('Numéro de téléphone invalide (8 chiffres requis).'))
  }

  const db = c.env.DB
  if (db && (phone || email)) {
    try {
      await createClient(db, {
        name: name,
        phone: phone || '',
        email: email || null,
        quartier: '',
        adresse_precise: null,
        latitude: null,
        longitude: null,
        type_demande: 'contact',
        notes: `Message de contact: ${message}`
      })
    } catch (_) {}
  }

  await notifyAdmin(c.env, 'contact', `${name} — ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}${phone ? ' | Tél: ' + phone : ''}${email ? ' | Email: ' + email : ''}`)

  return c.redirect('/contact?success=1')
})

// ============================================================
// API STOCK ALERTS
// ============================================================
webFormsRouter.post('/api/stock-alert', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`stockalert:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.json({ ok: false, error: 'Trop de demandes. Réessayez plus tard.' }, 429)
  }

  const body = await c.req.parseBody()
  const productId = parseInt(body['product_id'] as string || '0')
  const phone = (body['phone'] as string || '').trim()

  if (!productId || !phone || !isValidPhone(phone)) {
    return c.json({ ok: false, error: 'Numéro de téléphone invalide (8 chiffres requis).' }, 400)
  }

  const db = c.env.DB
  if (!db) {
    return c.json({ ok: false, error: 'Service indisponible.' }, 500)
  }

  const safePhone = sanitizeText(phone, 20)
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS stock_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      phone TEXT NOT NULL,
      notified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()

    const existing = await db.prepare(
      'SELECT id FROM stock_alerts WHERE product_id = ? AND phone = ? AND notified = 0'
    ).bind(productId, safePhone).first()
    if (existing) {
      return c.json({ ok: true, message: 'Vous êtes déjà inscrit pour ce produit.' })
    }
    await db.prepare(
      'INSERT INTO stock_alerts (product_id, phone) VALUES (?, ?)'
    ).bind(productId, safePhone).run()
    return c.json({ ok: true, message: 'Vous serez notifié dès le réapprovisionnement.' })
  } catch (err) {
    console.error('Stock alert error:', err)
    return c.json({ ok: false, error: 'Erreur serveur.' }, 500)
  }
})

// ============================================================
// API MAINTENANCE REQUESTS
// ============================================================
webFormsRouter.post('/api/maintenance/request', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`maintenance:${ip}`, 5, 60 * 60 * 1000)

  const isJsonReq = (c.req.header('content-type') || '').includes('application/json')
  const sendErr = (msg: string, status = 400) => {
    if (isJsonReq) return c.json({ error: msg }, status as any)
    return c.redirect('/contrat-maintenance?error=' + encodeURIComponent(msg))
  }

  if (!rl.allowed) {
    return sendErr('Trop de demandes. Réessayez plus tard.', 429)
  }

  let body: any = {}
  if (isJsonReq) {
    body = await c.req.json().catch(() => ({}))
  } else {
    body = await c.req.parseBody().catch(() => ({}))
  }

  if (body['website']) {
    if (isJsonReq) return c.json({ success: true })
    return c.redirect('/contrat-maintenance?success=1')
  }

  const name = (body['name'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const email = (body['email'] as string || '').trim()
  const quartier = (body['quartier'] as string || '').trim()
  const planType = (body['plan_type'] as string || '').trim().toLowerCase()
  let requestType = (body['request_type'] as string || '').trim().toLowerCase()
  if (!requestType) {
    requestType = planType ? 'contrat' : 'occasionnelle'
  }
  const description = (body['description'] as string || '').trim()
  const preferredDate = (body['preferred_date'] as string || '').trim()
  const equipmentType = (body['equipment_type'] as string || '').trim()
  const nbClimatiseurs = Math.max(1, parseInt(body['nb_climatiseurs'] as string || '1', 10))
  const frequenceVisites = (body['frequence_visites'] as string || 'Confort').trim()
  const typeEtablissement = (body['type_etablissement'] as string || '').trim()
  const exigences = (body['exigences'] as string || '').trim()

  if (!name || !phone) {
    return sendErr('Nom et téléphone sont obligatoires.')
  }
  if (!isValidPhone(phone)) {
    return sendErr('Numéro de téléphone invalide (8 chiffres requis).')
  }
  if (email && !isValidEmail(email)) {
    return sendErr('Adresse email invalide.')
  }
  if (!['occasionnelle', 'urgence', 'contrat'].includes(requestType)) {
    return sendErr('Type de demande invalide.')
  }

  const db = c.env.DB
  if (db) {
    try {
      const sessionToken = getCookie(c, 'maasga_session') || ''
      const session = sessionToken && db ? await getSession(db, sessionToken) : null
      
      const rawPhone = phone.replace(/\D/g, '')
      const last8 = rawPhone.slice(-8)
      
      const existingClient = (phone && db) 
        ? await db.prepare('SELECT id FROM clients WHERE phone = ? OR phone LIKE ? LIMIT 1').bind(phone, `%${last8}`).first() as any
        : null
      const clientId = session?.clientId || existingClient?.id || null

      let fullDescription = description
      if (typeEtablissement || exigences || nbClimatiseurs > 1) {
        fullDescription = [
          nbClimatiseurs ? `${nbClimatiseurs} climatiseur(s)` : '',
          frequenceVisites ? `Fréquence: ${frequenceVisites}` : '',
          typeEtablissement ? `Établissement: ${typeEtablissement}` : '',
          exigences ? `Exigences: ${exigences}` : '',
          description
        ].filter(Boolean).join(' | ')
      }

      const { months, visits, price } = calculatePlanPricing(planType, nbClimatiseurs, frequenceVisites)
      const isV2 = ['residentiel', 'professionnel', 'professionnel_pme', 'industriel', 'sur_mesure'].includes(planType)
      const isLegacy = ['trimestriel', 'semestriel', 'annuel'].includes(planType)

      try {
        await db.prepare(
          `INSERT INTO maintenance_requests (client_id, name, phone, email, quartier, request_type, description, preferred_date, equipment_type, plan_type, plan_price, nb_climatiseurs, frequence_visites, type_etablissement, exigences, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
        ).bind(
          clientId,
          sanitizeText(name, 120),
          sanitizeText(phone, 20),
          email ? sanitizeText(email, 160) : null,
          quartier ? sanitizeText(quartier, 120) : null,
          requestType,
          fullDescription ? sanitizeText(fullDescription, 2000) : null,
          preferredDate || null,
          equipmentType || null,
          planType || null,
          price,
          nbClimatiseurs,
          frequenceVisites,
          typeEtablissement || null,
          exigences || null
        ).run()
      } catch (err) {
        await db.prepare(
          `INSERT INTO maintenance_requests (client_id, name, phone, email, quartier, request_type, description, preferred_date, equipment_type, plan_type, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
        ).bind(
          clientId,
          sanitizeText(name, 120),
          sanitizeText(phone, 20),
          email ? sanitizeText(email, 160) : null,
          quartier ? sanitizeText(quartier, 120) : null,
          requestType,
          fullDescription ? sanitizeText(fullDescription, 2000) : null,
          preferredDate || null,
          equipmentType || null,
          planType || null
        ).run()
      }

      const planNameFormatted = planType === 'residentiel' ? 'Résidentiel' :
        planType === 'professionnel' || planType === 'professionnel_pme' ? 'Professionnel / PME' :
        planType === 'industriel' ? 'Industriel' :
        planType === 'sur_mesure' ? 'Sur Mesure' : (planType || 'Standard')

      if (requestType === 'contrat' && planType && (isV2 || isLegacy)) {
        const startDate = preferredDate || new Date().toISOString().split('T')[0]
        const endDateObj = new Date(startDate)
        endDateObj.setMonth(endDateObj.getMonth() + months)
        const endDate = endDateObj.toISOString().split('T')[0]
        const contractNote = `Formule: ${planNameFormatted} (v2) | ${nbClimatiseurs} clim(s) | ${frequenceVisites} | ${typeEtablissement ? typeEtablissement + ' | ' : ''}${exigences}`.trim()

        try {
          await db.prepare(
            `INSERT INTO maintenance_contracts (client_id, client_name, client_phone, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'en_attente', ?, 0, ?, ?)`
          ).bind(
            clientId,
            sanitizeText(name, 120),
            sanitizeText(phone, 20),
            planType,
            price,
            startDate,
            endDate,
            visits,
            null,
            contractNote
          ).run()
        } catch (_) {}
      }

      if (clientId) {
        try {
          await db.prepare(
            `INSERT INTO user_activity_log (client_id, action, category, details) VALUES (?, ?, 'maintenance', ?)`
          ).bind(clientId, 'Souscription contrat maintenance', `Plan ${planNameFormatted} — ${price > 0 ? price.toLocaleString() + ' FCFA' : 'Sur devis'} — ${visits} visite(s)`).run()
        } catch (_) {}
      }
    } catch (error) {
      console.error('Erreur maintenance request:', error)
      return sendErr("Erreur lors de l'envoi. Veuillez réessayer.")
    }
  }

  try {
    const productName = planType ? ` (Plan ${planType})` : ''
    await notifyAdmin(c.env, 'maintenance', `Nouvelle demande/souscription de maintenance par ${name}${productName}. Tél: ${phone}`)
  } catch (ne) {
    console.error('Failed to notify admin on maintenance:', ne)
  }

  if (isJsonReq) {
    return c.json({ success: true, message: 'Souscription enregistrée avec succès' })
  }
  return c.redirect('/contrat-maintenance?success=1')
})
