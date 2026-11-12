// Maintenance : demandes, contrats, visites
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import {
  AdminMaintenancePage
} from '../../pages/admin'
import {
  sanitizeText
} from '../../utils/helpers'
import {
  sendSmsWithLog,
  notifyAdmin
} from '../../utils/notifications'
import { adminAuth, refreshAdminCache } from './shared'

export const adminMaintenanceRouter = new Hono<HonoEnv>()

async function insertContractSafe(
  db: any,
  params: {
    clientId?: number,
    clientName: string,
    clientPhone: string,
    planType: string,
    planPrice: number,
    startDate: string,
    endDate: string,
    status: string,
    totalVisits: number,
    nextVisitDate?: string,
    notes?: string
  }
): Promise<number> {
  if (!db) return 0
  let contractId = 0
  const cleanPlan = (params.planType || 'residentiel').toLowerCase()

  try {
    const res = await db.prepare(
      `INSERT INTO maintenance_contracts (client_id, client_name, client_phone, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(
      params.clientId || null,
      sanitizeText(params.clientName, 120),
      sanitizeText(params.clientPhone, 20),
      cleanPlan,
      params.planPrice || 0,
      params.startDate,
      params.endDate,
      params.status || 'en_attente',
      params.totalVisits || 2,
      params.nextVisitDate || null,
      params.notes || null
    ).run()
    contractId = res?.meta?.last_row_id || 0
  } catch (err: any) {
    console.warn('Direct contract insert failed, falling back to legacy plan type mapping:', err)
    const fallbackPlan = params.totalVisits === 1 ? 'annuel' : (params.totalVisits === 3 ? 'trimestriel' : 'semestriel')
    const fullNotes = `[Formule: ${cleanPlan.toUpperCase()}] ${params.notes || ''}`.trim()
    try {
      const resFallback = await db.prepare(
        `INSERT INTO maintenance_contracts (client_id, client_name, client_phone, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
      ).bind(
        params.clientId || null,
        sanitizeText(params.clientName, 120),
        sanitizeText(params.clientPhone, 20),
        fallbackPlan,
        params.planPrice || 0,
        params.startDate,
        params.endDate,
        params.status || 'en_attente',
        params.totalVisits || 2,
        params.nextVisitDate || null,
        fullNotes
      ).run()
      contractId = resFallback?.meta?.last_row_id || 0
    } catch (_) {}
  }
  return contractId
}

async function scheduleVisitsForContract(
  db: any,
  contractId: number,
  clientName: string,
  clientPhone: string,
  clientId: number,
  planType: string,
  visitsCount: number,
  startDateStr: string,
  months: number = 12
) {
  if (!db || !contractId) return
  const count = Math.max(1, visitsCount || 2)
  const intervalMonths = Math.max(1, Math.floor(months / count))
  let firstDate = ''

  for (let i = 1; i <= count; i++) {
    const vd = new Date(startDateStr || new Date().toISOString().split('T')[0])
    vd.setMonth(vd.getMonth() + (intervalMonths * i))
    const dateStr = vd.toISOString().split('T')[0]
    if (i === 1) firstDate = dateStr

    try {
      const existing = await db.prepare("SELECT id FROM maintenance_visits WHERE contract_id = ? AND visit_date = ?").bind(contractId, dateStr).first()
      if (!existing) {
        await db.prepare(
          `INSERT INTO maintenance_visits (contract_id, client_id, client_name, client_phone, visit_type, visit_date, status, description)
           VALUES (?, ?, ?, ?, 'preventive', ?, 'planifiee', ?)`
        ).bind(
          contractId,
          clientId || 0,
          sanitizeText(clientName, 120),
          sanitizeText(clientPhone, 20),
          dateStr,
          `Visite préventive #${i}/${count} — Formule ${planType.toUpperCase()}`
        ).run()
      }
    } catch(e) {
      console.error('scheduleVisitsForContract error:', e)
    }
  }

  if (firstDate) {
    try {
      await db.prepare("UPDATE maintenance_contracts SET next_visit_date = ? WHERE id = ?").bind(firstDate, contractId).run()
    } catch(_) {}
  }
}

// ============================================================
// ADMIN MAINTENANCE
// ============================================================

adminMaintenanceRouter.get('/admin/maintenance', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let contracts: any[] = []
  let requests: any[] = []
  let visits: any[] = []
  if (db) {
    try {
      const cRows = await db.prepare('SELECT * FROM maintenance_contracts ORDER BY id DESC LIMIT 200').all()
      contracts = (cRows.results || []) as any[]
    } catch(e) { console.error('Admin contracts load:', e) }
    try {
      let rRows: any
      try { rRows = await db.prepare('SELECT *, name as client_name, phone as client_phone FROM maintenance_requests ORDER BY id DESC LIMIT 200').all() }
      catch(_) { rRows = await db.prepare('SELECT *, client_name, client_phone FROM maintenance_requests ORDER BY id DESC LIMIT 200').all() }
      requests = (rRows.results || []) as any[]
    } catch(e) { console.error('Admin requests load:', e) }
    try {
      const vRows = await db.prepare('SELECT * FROM maintenance_visits ORDER BY visit_date ASC LIMIT 200').all()
      visits = (vRows.results || []) as any[]
    } catch(e) { console.error('Admin visits load:', e) }
  }
  const success = c.req.query('success') || ''
  const error = c.req.query('error') || ''
  return c.html(<AdminMaintenancePage contracts={contracts} requests={requests} visits={visits} success={success} error={error} />)
})

adminMaintenanceRouter.post('/admin/maintenance/update-request', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const requestId = parseInt(body['request_id'] as string || '0')
  const status = (body['status'] as string || '').trim()
  const ALLOWED_REQUEST_STATUSES = ['pending', 'contacted', 'scheduled', 'done', 'cancelled']
  if (requestId && status && ALLOWED_REQUEST_STATUSES.includes(status)) {
    try {
      await db.prepare('UPDATE maintenance_requests SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(status, requestId).run()
    } catch(e) { console.error('Request status update error:', e) }
  }
  return c.redirect(`/admin/maintenance?success=${status === 'cancelled' ? 'request_cancelled' : 'request_updated'}`)
})

adminMaintenanceRouter.post('/admin/maintenance/delete-request', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const requestId = parseInt(body['request_id'] as string || '0')
  if (requestId) {
    try {
      await db.prepare('DELETE FROM maintenance_requests WHERE id = ?').bind(requestId).run()
    } catch(e) { console.error('Delete request error:', e) }
  }
  return c.redirect('/admin/maintenance?success=request_deleted')
})

// Convertir une demande en contrat actif et planifier automatiquement ses visites
adminMaintenanceRouter.post('/admin/maintenance/convert-to-contract', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance?error=no_db')
  const body = await c.req.parseBody()
  const requestId = parseInt(body['request_id'] as string || '0')
  if (!requestId) return c.redirect('/admin/maintenance?error=invalid_request')

  try {
    const req = await db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').bind(requestId).first() as any
    if (!req) return c.redirect('/admin/maintenance?error=not_found')

    const clientName = req.name || req.client_name || 'Client'
    const clientPhone = req.phone || req.client_phone || ''
    const clientId = req.client_id || 0
    const rawPlan = (req.plan_type || 'residentiel').toLowerCase()

    let nbClims = req.nb_climatiseurs || 1
    let freq = req.frequence_visites || 'Confort'
    if (req.description) {
      const climMatch = req.description.match(/(\d+)\s*climatiseur/i)
      if (climMatch) nbClims = parseInt(climMatch[1]) || nbClims
      if (req.description.includes('Essentiel')) freq = 'Essentiel'
      else if (req.description.includes('Pro')) freq = 'Pro'
    }

    let visits = freq.toLowerCase().includes('essentiel') ? 1 : (freq.toLowerCase().includes('pro') ? 3 : 2)
    const getUnitRate = (cnt: number) => cnt <= 4 ? 8500 : cnt <= 8 ? 7500 : cnt <= 15 ? 6000 : 5000
    let price = (rawPlan === 'industriel' || rawPlan === 'sur_mesure') ? 0 : getUnitRate(nbClims) * nbClims * visits

    const startDate = req.preferred_date || new Date().toISOString().split('T')[0]
    const endDateObj = new Date(startDate)
    endDateObj.setMonth(endDateObj.getMonth() + 12)
    const endDate = endDateObj.toISOString().split('T')[0]

    const notes = `Formule: ${rawPlan.toUpperCase()} | ${nbClims} clim(s) | ${freq} | Quartier: ${req.quartier || '—'}`

    const contractId = await insertContractSafe(db, {
      clientId,
      clientName,
      clientPhone,
      planType: rawPlan,
      planPrice: price,
      startDate,
      endDate,
      status: 'actif',
      totalVisits: visits,
      notes
    })

    if (contractId) {
      await scheduleVisitsForContract(db, contractId, clientName, clientPhone, clientId, rawPlan, visits, startDate, 12)
      await db.prepare("UPDATE maintenance_requests SET status = 'done', admin_notes = ? WHERE id = ?").bind(`Contrat #${contractId} actif`, requestId).run()
      await notifyAdmin(c.env as any, 'maintenance', `Contrat #${contractId} CRÉÉ & VISITES PROGRAMMÉES pour ${clientName} (${clientPhone})`)
    }

    return c.redirect('/admin/maintenance?success=contract_created')
  } catch(e) {
    console.error('convert-to-contract error:', e)
    return c.redirect('/admin/maintenance?error=server_error')
  }
})

// Synchroniser toutes les demandes de contrat en attente en contrats actifs
adminMaintenanceRouter.post('/admin/maintenance/sync-pending-requests', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance?error=no_db')

  try {
    const pending = await db.prepare("SELECT * FROM maintenance_requests WHERE (request_type = 'contrat' OR plan_type IS NOT NULL) AND status IN ('pending', 'contacted')").all()
    const rows = (pending?.results || []) as any[]
    let count = 0

    for (const req of rows) {
      const clientName = req.name || req.client_name || 'Client'
      const clientPhone = req.phone || req.client_phone || ''
      const clientId = req.client_id || 0
      const rawPlan = (req.plan_type || 'residentiel').toLowerCase()

      let nbClims = req.nb_climatiseurs || 1
      let freq = req.frequence_visites || 'Confort'
      if (req.description) {
        const climMatch = req.description.match(/(\d+)\s*climatiseur/i)
        if (climMatch) nbClims = parseInt(climMatch[1]) || nbClims
        if (req.description.includes('Essentiel')) freq = 'Essentiel'
        else if (req.description.includes('Pro')) freq = 'Pro'
      }

      let visits = freq.toLowerCase().includes('essentiel') ? 1 : (freq.toLowerCase().includes('pro') ? 3 : 2)
      const getUnitRate = (cnt: number) => cnt <= 4 ? 8500 : cnt <= 8 ? 7500 : cnt <= 15 ? 6000 : 5000
      let price = (rawPlan === 'industriel' || rawPlan === 'sur_mesure') ? 0 : getUnitRate(nbClims) * nbClims * visits

      const startDate = req.preferred_date || new Date().toISOString().split('T')[0]
      const endDateObj = new Date(startDate)
      endDateObj.setMonth(endDateObj.getMonth() + 12)
      const endDate = endDateObj.toISOString().split('T')[0]

      const notes = `Formule: ${rawPlan.toUpperCase()} | ${nbClims} clim(s) | ${freq} | Quartier: ${req.quartier || '—'}`

      const contractId = await insertContractSafe(db, {
        clientId,
        clientName,
        clientPhone,
        planType: rawPlan,
        planPrice: price,
        startDate,
        endDate,
        status: 'actif',
        totalVisits: visits,
        notes
      })

      if (contractId) {
        await scheduleVisitsForContract(db, contractId, clientName, clientPhone, clientId, rawPlan, visits, startDate, 12)
        await db.prepare("UPDATE maintenance_requests SET status = 'done', admin_notes = ? WHERE id = ?").bind(`Contrat #${contractId} actif`, req.id).run()
        count++
      }
    }

    return c.redirect(`/admin/maintenance?success=all_contracts_created&count=${count}`)
  } catch(e) {
    console.error('sync-pending-requests error:', e)
    return c.redirect('/admin/maintenance?error=server_error')
  }
})

adminMaintenanceRouter.post('/admin/maintenance/update-visit', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const visitId = parseInt(body['visit_id'] as string || '0')
  const status = (body['status'] as string || '').trim()
  const ALLOWED_VISIT_STATUSES = ['planifiee', 'confirmee', 'effectuee', 'annulee']
  if (visitId && status && ALLOWED_VISIT_STATUSES.includes(status)) {
    try {
      await db.prepare(`UPDATE maintenance_visits SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(status, visitId).run()
      if (status === 'effectuee' || status === 'annulee') {
        const visit = await db.prepare('SELECT contract_id FROM maintenance_visits WHERE id = ?').bind(visitId).first() as any
        if (visit?.contract_id) {
          const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE contract_id = ? AND status = 'effectuee'").bind(visit.contract_id).first() as any
          await db.prepare(`UPDATE maintenance_contracts SET completed_visits = ?, updated_at = datetime('now') WHERE id = ?`).bind(countRes?.cnt || 0, visit.contract_id).run()
        }
      }
    } catch(e) { console.error('Visit status update error:', e) }
  }
  return c.redirect('/admin/maintenance')
})

adminMaintenanceRouter.post('/admin/maintenance/delete-visit', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const visitId = parseInt(body['visit_id'] as string || '0')
  if (visitId) {
    try {
      const visit = await db.prepare('SELECT contract_id FROM maintenance_visits WHERE id = ?').bind(visitId).first() as any
      await db.prepare('DELETE FROM maintenance_visits WHERE id = ?').bind(visitId).run()
      if (visit?.contract_id) {
        const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE contract_id = ? AND status = 'effectuee'").bind(visit.contract_id).first() as any
        const nextVisit = await db.prepare("SELECT visit_date FROM maintenance_visits WHERE contract_id = ? AND status IN ('planifiee','confirmee') ORDER BY visit_date ASC LIMIT 1").bind(visit.contract_id).first() as any
        await db.prepare("UPDATE maintenance_contracts SET completed_visits = ?, next_visit_date = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(countRes?.cnt || 0, nextVisit?.visit_date || null, visit.contract_id).run()
      }
    } catch(e) { console.error('Delete visit error:', e) }
  }
  return c.redirect('/admin/maintenance?success=visit_deleted')
})

// Ajouter une visite manuellement
adminMaintenanceRouter.post('/admin/maintenance/add-visit', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const contractId = parseInt(body['contract_id'] as string || '0')
  const clientName = (body['client_name'] as string || '').trim()
  const clientPhone = (body['client_phone'] as string || '').trim()
  const visitDate = (body['visit_date'] as string || '').trim()
  const visitType = (body['visit_type'] as string || 'preventive').trim()
  const technician = (body['technician'] as string || '').trim()
  const description = (body['description'] as string || '').trim()

  if (!clientName || !visitDate) {
    return c.redirect('/admin/maintenance?error=invalid_visit_data')
  }

  try {
    let clientId = 0
    if (contractId) {
      const cRow = await db.prepare('SELECT client_id, client_name, client_phone FROM maintenance_contracts WHERE id = ?').bind(contractId).first() as any
      if (cRow) clientId = cRow.client_id || 0
    }

    await db.prepare(
      `INSERT INTO maintenance_visits (contract_id, client_id, client_name, client_phone, visit_type, visit_date, status, technician, description)
       VALUES (?, ?, ?, ?, ?, ?, 'planifiee', ?, ?)`
    ).bind(
      contractId || null,
      clientId,
      sanitizeText(clientName, 120),
      sanitizeText(clientPhone, 20),
      visitType,
      visitDate,
      technician ? sanitizeText(technician, 120) : null,
      description ? sanitizeText(description, 1000) : 'Visite programmée manuellement'
    ).run()

    if (contractId) {
      const nextVisit = await db.prepare("SELECT visit_date FROM maintenance_visits WHERE contract_id = ? AND status IN ('planifiee','confirmee') ORDER BY visit_date ASC LIMIT 1").bind(contractId).first() as any
      if (nextVisit?.visit_date) {
        await db.prepare("UPDATE maintenance_contracts SET next_visit_date = ?, updated_at = datetime('now') WHERE id = ?").bind(nextVisit.visit_date, contractId).run()
      }
    }
  } catch(e) { console.error('Add visit error:', e) }
  return c.redirect('/admin/maintenance?success=visit_added')
})

// Validate a visit with full details (technician, actions, etc.)
adminMaintenanceRouter.post('/admin/maintenance/validate-visit', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const visitId = parseInt(body['visit_id'] as string || '0')
  const technician = (body['technician'] as string || '').trim()
  const actionsPerformed = (body['actions_performed'] as string || '').trim()
  const gasRecharged = body['gas_recharged'] === '1' ? 1 : 0
  const filtersCleaned = body['filters_cleaned'] === '1' ? 1 : 0
  const notes = (body['notes'] as string || '').trim()

  if (!visitId || !technician) {
    return c.redirect('/admin/maintenance?error=visite_incomplete')
  }
  try {
    const res = await db.prepare(
      `UPDATE maintenance_visits SET status = 'effectuee', technician = ?, actions_performed = ?, gas_recharged = ?, filters_cleaned = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(sanitizeText(technician, 120), sanitizeText(actionsPerformed, 2000), gasRecharged, filtersCleaned, sanitizeText(notes, 2000), visitId).run()
    if (!res?.meta?.changes) {
      return c.redirect('/admin/maintenance?error=visite_introuvable')
    }

    const visit = await db.prepare('SELECT contract_id FROM maintenance_visits WHERE id = ?').bind(visitId).first() as any
    if (visit?.contract_id) {
      const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE contract_id = ? AND status = 'effectuee'").bind(visit.contract_id).first() as any
      const completedCount = countRes?.cnt || 0
      const nextVisit = await db.prepare("SELECT visit_date FROM maintenance_visits WHERE contract_id = ? AND status IN ('planifiee','confirmee') ORDER BY visit_date ASC LIMIT 1").bind(visit.contract_id).first() as any
      await db.prepare(`UPDATE maintenance_contracts SET completed_visits = ?, next_visit_date = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(completedCount, nextVisit?.visit_date || null, visit.contract_id).run()
    }
  } catch(e) {
    console.error('Visit validation error:', e)
    return c.redirect('/admin/maintenance?error=visite_echec')
  }
  return c.redirect('/admin/maintenance?success=visite_validee')
})

// Valider / Activer un contrat de maintenance et programmer ses visites
adminMaintenanceRouter.post('/api/admin/maintenance/validate-contract', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB unavailable' }, 503)
  let body: any = {}
  const contentType = c.req.header('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => ({}))
    } else {
      body = await c.req.parseBody().catch(() => ({}))
    }
  } catch(e) {}
  const contractId = parseInt(body.contract_id || '0')
  if (!contractId) return c.json({ error: 'contract_id requis' }, 400)

  try {
    const contract = await db.prepare('SELECT * FROM maintenance_contracts WHERE id = ?').bind(contractId).first() as any
    if (!contract) return c.json({ error: 'Contrat introuvable' }, 404)

    if (contract.status === 'actif') {
      return c.req.header('content-type')?.includes('application/json')
        ? c.json({ success: true, message: 'Contrat déjà actif — aucune action' })
        : c.redirect('/admin/maintenance?success=contract_already_active')
    }

    await db.prepare("UPDATE maintenance_contracts SET status = 'actif', updated_at = datetime('now') WHERE id = ?").bind(contractId).run()

    // Planifier les visites selon la formule et total_visits
    const totalVisits = contract.total_visits || (contract.plan_type === 'annuel' ? 1 : (contract.plan_type === 'trimestriel' || contract.plan_type === 'industriel' ? 3 : 2))
    const startDate = contract.start_date || new Date().toISOString().split('T')[0]
    await scheduleVisitsForContract(db, contractId, contract.client_name, contract.client_phone, contract.client_id, contract.plan_type, totalVisits, startDate, 12)

    await notifyAdmin(c.env as any, 'maintenance', `Contrat #${contractId} (${contract.plan_type}) ACTIVÉ avec ${totalVisits} visite(s) — ${contract.client_name}`)

    const isJson = c.req.header('content-type')?.includes('application/json')
    if (isJson) {
      return c.json({ success: true, message: 'Contrat activé et visites planifiées' })
    } else {
      return c.redirect('/admin/maintenance?success=contract_validated')
    }
  } catch (e) {
    console.error('validate-contract error:', e)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ── Refuser un contrat de maintenance (pending → cancelled) ──
adminMaintenanceRouter.post('/api/admin/maintenance/refuse-contract', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB unavailable' }, 503)
  let body: any = {}
  const contentType = c.req.header('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => ({}))
    } else {
      body = await c.req.parseBody().catch(() => ({}))
    }
  } catch(e) {}
  const contractId = parseInt(body.contract_id || '0')
  const reason = (body.reason || '').trim()
  if (!contractId) return c.json({ error: 'contract_id requis' }, 400)

  try {
    const contract = await db.prepare('SELECT * FROM maintenance_contracts WHERE id = ?').bind(contractId).first() as any
    if (!contract) return c.json({ error: 'Contrat introuvable' }, 404)

    await db.prepare("UPDATE maintenance_contracts SET status = 'annule', notes = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(reason ? `Refusé : ${reason}` : 'Refusé par admin', contractId).run()

    await notifyAdmin(c.env as any, 'maintenance', `Contrat #${contractId} (${contract.plan_type}) REFUSÉ — ${contract.client_name}`)

    await sendSmsWithLog(c.env, db, contract.client_phone,
      `Bonjour ${contract.client_name}, votre demande de contrat de maintenance MAASGA (${contract.plan_type}) ne peut pas être traitée pour le moment. Contactez-nous au +226 55 99 64 18 pour plus d'informations.`
    )

    const isJson = c.req.header('content-type')?.includes('application/json')
    if (isJson) {
      return c.json({ success: true, message: 'Contrat refusé' })
    } else {
      return c.redirect('/admin/maintenance?success=contract_refused')
    }
  } catch (e) {
    console.error('refuse-contract error:', e)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// ── Supprimer définitivement un contrat de maintenance et ses visites ──
adminMaintenanceRouter.post('/api/admin/maintenance/delete-contract', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB unavailable' }, 503)
  let body: any = {}
  const contentType = c.req.header('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => ({}))
    } else {
      body = await c.req.parseBody().catch(() => ({}))
    }
  } catch(e) {}
  const contractId = parseInt(body.contract_id || '0')
  if (!contractId) return c.json({ error: 'contract_id requis' }, 400)

  try {
    // Supprimer les visites associées d'abord
    await db.prepare("DELETE FROM maintenance_visits WHERE contract_id = ?").bind(contractId).run()
    
    // Supprimer le contrat
    await db.prepare("DELETE FROM maintenance_contracts WHERE id = ?").bind(contractId).run()

    // Notification admin
    await notifyAdmin(c.env as any, 'maintenance', `Contrat #${contractId} SUPPRIMÉ définitivement par admin`)

    const isJson = c.req.header('content-type')?.includes('application/json')
    if (isJson) {
      return c.json({ success: true, message: 'Contrat et visites supprimés définitivement' })
    } else {
      return c.redirect('/admin/maintenance?success=contract_deleted')
    }
  } catch (e) {
    console.error('delete-contract error:', e)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})
