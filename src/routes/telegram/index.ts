// Telegram Bot Webhook & Admin Commands
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import { adminAuth } from '../admin'
import { products } from '../../data/products'
import { quartiers } from '../../data/quartiers'
import {
  appointments,
  reviews,
  orders,
  clients,
  notifications,
  setMaintenanceDueCount,
  setPendingMaintenanceContractsCount,
  setPendingMaintenanceRequestsCount,
  pendingMaintenanceContracts
} from '../../data/store'
import {
  createAppointment,
  updateAppointmentStatus,
  createOrder,
  createReview,
  getProducts,
  getReviews,
  getQuartiers,
  createClient,
  getClients,
  getAppointments,
  getAppointmentById,
  getOrders,
  deleteProduct,
  deleteClient,
  deleteOrder,
  getClientById,
  getProductById
} from '../../db'
import { sendTelegramMessage } from '../../utils/notifications'
import { timingSafeEqualStr } from '../../utils/security'

// Secret du webhook Telegram : TELEGRAM_WEBHOOK_SECRET si défini, sinon dérivé
// (HMAC-SHA256) du bot token — aucun nouveau secret à configurer.
// ⚠️ Après déploiement, rappeler la route de setup du webhook une fois.
export async function telegramWebhookSecret(env: any): Promise<string> {
  if (env.TELEGRAM_WEBHOOK_SECRET) return String(env.TELEGRAM_WEBHOOK_SECRET)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(env.TELEGRAM_BOT_TOKEN || '')),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('maasga-telegram-webhook'))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 64)
}

export const telegramRouter = new Hono<HonoEnv>()

// TELEGRAM BOT WEBHOOK — Admin control commands
// ============================================================

// sendTelegramMessage imported from ./utils/notifications

// Endpoint to setup/verify webhook (call once after deployment — admin only)
telegramRouter.get('/api/telegram/setup', adminAuth, async (c) => {
  const env = c.env
  if (!env.TELEGRAM_BOT_TOKEN) {
    return c.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, 500)
  }
  
  // Get the base URL from request
  const url = new URL(c.req.url)
  const webhookUrl = `${url.origin}/api/telegram/webhook`
  
  try {
    // Set the webhook URL with Telegram
    const setRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
        secret_token: await telegramWebhookSecret(env)
      })
    })
    const setData = await setRes.json() as any
    
    // Get webhook info to verify
    const infoRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
    const infoData = await infoRes.json() as any
    
    // Also set bot commands for menu
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'stats', description: 'Tableau de bord complet' },
          { command: 'rdv', description: 'RDV a venir' },
          { command: 'commandes', description: 'Commandes recentes' },
          { command: 'devis', description: 'Devis en attente' },
          { command: 'paiements', description: 'Paiements recents' },
          { command: 'messages', description: 'Messages non lus' },
          { command: 'contrats', description: 'Contrats maintenance actifs' },
          { command: 'visites', description: 'Prochaines visites maintenance' },
          { command: 'sav', description: 'Tickets SAV ouverts' },
          { command: 'avis', description: 'Avis clients en attente' },
          { command: 'stock', description: 'Etat du stock produits' },
          { command: 'clients', description: 'Derniers clients inscrits' },
          { command: 'client', description: 'Rechercher un client ex: /client Jean' },
          { command: 'recherche', description: 'Chercher produit ex: /recherche LG 18000' },
          { command: 'convertir', description: 'Convertir CV en BTU ex: /convertir 2' },
          { command: 'confirmer', description: 'Confirmer un RDV ex: /confirmer 3' },
          { command: 'annuler', description: 'Annuler un RDV ex: /annuler 3' },
          { command: 'terminer', description: 'Marquer RDV termine ex: /terminer 3' },
          { command: 'valider', description: 'Valider visite maintenance ex: /valider 5' },
          { command: 'approuver', description: 'Approuver un avis ex: /approuver 7' },
          { command: 'stock_update', description: 'Modifier stock ex: /stock_update 3 10' },
          { command: 'backup', description: 'Resume base de donnees' },
          { command: 'help', description: 'Aide et menu complet' }
        ]
      })
    })
    
    return c.json({
      ok: true,
      webhook_set: setData,
      webhook_info: infoData?.result,
      message: 'Webhook configuré ! Envoyez /start à votre bot.'
    })
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500)
  }
})

telegramRouter.post('/api/telegram/webhook', async (c) => {
  const env = c.env
  if (!env.TELEGRAM_BOT_TOKEN) {
    return c.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, 500)
  }

  // SÉCURITÉ : seul Telegram connaît le secret_token enregistré via setWebhook
  const headerSecret = c.req.header('X-Telegram-Bot-Api-Secret-Token') || ''
  if (!timingSafeEqualStr(headerSecret, await telegramWebhookSecret(env))) {
    return c.json({ ok: false }, 401)
  }

  let update: any
  try { update = await c.req.json() } catch { return c.json({ ok: true }) }

  const db = env.DB as any
  const token = env.TELEGRAM_BOT_TOKEN

  // Handle callback queries (inline button clicks)
  if (update.callback_query) {
    const cbq = update.callback_query
    const chatId = String(cbq.message?.chat?.id || cbq.from?.id)
    const data = cbq.data || ''
    
    // Verify admin
    if (env.TELEGRAM_CHAT_ID && chatId !== env.TELEGRAM_CHAT_ID) {
      return c.json({ ok: true })
    }

    // Answer callback to remove loading state
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cbq.id })
    })

    try {
      // Parse callback data: action:type:id
      const [action, type, id] = data.split(':')
      
      if (action === 'confirm' && type === 'rdv' && db) {
        await db.prepare(`UPDATE appointments SET status='confirmed' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ RDV #${id} confirmé !`)
      } else if (action === 'cancel' && type === 'rdv' && db) {
        await db.prepare(`UPDATE appointments SET status='cancelled' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `❌ RDV #${id} annulé.`)
      } else if (action === 'done' && type === 'rdv' && db) {
        await db.prepare(`UPDATE appointments SET status='done' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `☑️ RDV #${id} marqué terminé.`)
      } else if (action === 'validate' && type === 'order' && db) {
        await db.prepare(`UPDATE orders SET status='livre', delivered_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ Commande #${id} livrée !`)
      } else if (action === 'cancel' && type === 'order' && db) {
        await db.prepare(`UPDATE orders SET status='annule' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `❌ Commande #${id} annulée.`)
      } else if (action === 'installed' && type === 'order' && db) {
        await db.prepare(`UPDATE orders SET status='livre', installed_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `📦 Commande #${id} installée !`)
      } else if (action === 'complete' && type === 'visit' && db) {
        await db.prepare(`UPDATE maintenance_visits SET status='effectuee', updated_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ Visite #${id} complétée !`)
      } else if (action === 'read' && type === 'msg' && db) {
        await db.prepare(`UPDATE contact_messages SET is_read=1 WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `📖 Message #${id} marqué lu.`)
      } else if (action === 'resolve' && type === 'sav' && db) {
        await db.prepare(`UPDATE sav_tickets SET status='resolved', updated_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ Ticket SAV #${id} résolu !`)
      } else if (action === 'approve' && type === 'review' && db) {
        await db.prepare(`UPDATE reviews SET approved=1 WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ Avis #${id} approuvé et publié !`)
      } else if (action === 'reject' && type === 'review' && db) {
        await db.prepare(`DELETE FROM reviews WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `🗑️ Avis #${id} supprimé.`)
      } else if (action === 'menu') {
        // Show main menu
        await sendTelegramMessage(token, chatId, 
          `🏠 *Menu Principal MAASGA*\n\nChoisissez une section :`,
          { inline_keyboard: [
            [{ text: '📊 Dashboard', callback_data: 'show:stats' }, { text: '📆 RDV', callback_data: 'show:rdv' }],
            [{ text: '🛒 Commandes', callback_data: 'show:orders' }, { text: '📄 Devis', callback_data: 'show:devis' }],
            [{ text: '📋 Contrats', callback_data: 'show:contracts' }, { text: '📅 Visites', callback_data: 'show:visits' }],
            [{ text: '💬 Messages', callback_data: 'show:messages' }, { text: '💳 Paiements', callback_data: 'show:payments' }],
            [{ text: '🎧 SAV', callback_data: 'show:sav' }, { text: '⭐ Avis', callback_data: 'show:avis' }],
            [{ text: '👤 Clients', callback_data: 'show:clients' }, { text: '📦 Stock', callback_data: 'show:stock' }]
          ]}
        )
      } else if (action === 'search' && db) {
        // search:BTU:brand (from /convertir button)
        const btuFilter = parseInt(type) || 0
        const brandFilter = id || ''
        let sql = `SELECT id, name, brand, btu, price, stock, energy_class, inverter FROM products WHERE available = 1`
        const bindings: any[] = []
        if (btuFilter) { sql += ` AND btu = ?`; bindings.push(btuFilter) }
        if (brandFilter) { sql += ` AND brand = ?`; bindings.push(brandFilter.toUpperCase()) }
        sql += ` ORDER BY brand ASC, btu ASC LIMIT 10`
        let stmt = db.prepare(sql)
        if (bindings.length) stmt = stmt.bind(...bindings)
        const rows = await stmt.all()
        if (!rows.results?.length) {
          await sendTelegramMessage(token, chatId, `🔍 Aucun produit disponible pour ${btuFilter ? btuFilter.toLocaleString() + ' BTU' : ''}.`)
        } else {
          let txt = `🔍 *Produits ${btuFilter ? btuFilter.toLocaleString() + ' BTU' : ''}*\n\n`
          for (const p of rows.results as any[]) {
            const stk = p.stock <= 0 ? '🔴 Rupture' : p.stock <= 2 ? `🟡 ${p.stock} rest.` : `🟢 ${p.stock} en stock`
            txt += `*${p.brand}* — ${(p.btu || 0).toLocaleString()} BTU\n   💰 ${(p.price || 0).toLocaleString()} FCFA | ${p.inverter ? '⚡ Inverter' : 'Standard'} | ${stk}\n\n`
          }
          await sendTelegramMessage(token, chatId, txt, { inline_keyboard: [[{ text: '📦 Tout le stock', callback_data: 'show:stock' }]] })
        }
        return c.json({ ok: true })
      } else if (action === 'show') {
        // Redirect to command handler
        const cmdMap: Record<string, string> = { stats: '/stats', rdv: '/rdv', orders: '/commandes', devis: '/devis', contracts: '/contrats', visits: '/visites', messages: '/messages', stock: '/stock', payments: '/paiements', sav: '/sav', avis: '/avis', clients: '/clients' }
        if (cmdMap[type]) {
          // Simulate command
          update = { message: { chat: { id: chatId }, text: cmdMap[type] } }
          // Fall through to message handler below
        }
      } else if (action === 'detail' && type === 'rdv' && db) {
        const rdv = await db.prepare(`SELECT * FROM appointments WHERE id=?`).bind(parseInt(id)).first()
        if (rdv) {
          const stMap: Record<string, string> = { pending: '⏳ En attente', confirmed: '✅ Confirmé', done: '☑️ Terminé', cancelled: '❌ Annulé' }
          await sendTelegramMessage(token, chatId,
            `📆 *RDV #${rdv.id}*\n\n` +
            `👤 *${rdv.name}*\n` +
            `📱 ${rdv.phone}\n` +
            `📅 ${rdv.date} | ${rdv.heure_debut || '—'}–${rdv.heure_fin || '—'}\n` +
            `📍 ${rdv.quartier || '—'}\n` +
            `🏷️ ${rdv.type || 'standard'}\n` +
            `📊 ${stMap[rdv.status] || rdv.status}\n` +
            (rdv.notes ? `\n📝 ${rdv.notes}` : ''),
            { inline_keyboard: [
              [
                { text: '✅ Confirmer', callback_data: `confirm:rdv:${id}` },
                { text: '☑️ Terminer', callback_data: `done:rdv:${id}` },
                { text: '❌ Annuler', callback_data: `cancel:rdv:${id}` }
              ],
              [
                { text: `📱 Appeler`, url: `tel:${rdv.phone}` },
                { text: `💬 WhatsApp`, url: `https://wa.me/${(rdv.phone || '').replace(/\D/g, '')}` }
              ],
              [{ text: '« Retour RDV', callback_data: 'show:rdv' }]
            ]}
          )
        }
        return c.json({ ok: true })
      } else if (action === 'detail' && type === 'order' && db) {
        const o = await db.prepare(`SELECT o.*, c.name as client FROM orders o LEFT JOIN clients c ON o.client_id=c.id WHERE o.id=?`).bind(parseInt(id)).first()
        if (o) {
          const stMap: Record<string, string> = { pending: '⏳ En attente', paid: '💰 Payée', livre: '🚚 Livrée', validation_terrain: '🔍 Validation', devis_en_attente: '📄 Devis envoyé', devis_valide: '✅ Devis accepté', installed: '📦 Installé', cancelled: '❌ Annulé' }
          await sendTelegramMessage(token, chatId,
            `🛒 *Commande #${o.id}*\n\n` +
            `👤 *${o.client || o.client_name || 'Anonyme'}*\n` +
            `📱 ${o.client_phone || '—'}\n` +
            `💰 ${(o.total_price || 0).toLocaleString()} FCFA\n` +
            `📦 Produit: ${o.product_name || '—'} × ${o.quantity || 1}\n` +
            `📊 ${stMap[o.status] || o.status}\n` +
            `📅 ${(o.created_at || '').slice(0, 10)}`,
            { inline_keyboard: [
              [
                { text: '🚚 Livrée', callback_data: `validate:order:${id}` },
                { text: '📦 Installé', callback_data: `installed:order:${id}` },
                { text: '❌ Annuler', callback_data: `cancel:order:${id}` }
              ],
              o.client_phone ? [{ text: `📱 Appeler`, url: `tel:${o.client_phone}` }, { text: `💬 WhatsApp`, url: `https://wa.me/${(o.client_phone || '').replace(/\D/g, '')}` }] : [],
              [{ text: '« Retour Commandes', callback_data: 'show:orders' }]
            ].filter(r => r.length > 0)}
          )
        }
        return c.json({ ok: true })
      }
    } catch (err: any) {
      console.error('[TELEGRAM CB]', err)
      await sendTelegramMessage(token, chatId, `❌ Erreur: ${err.message}`)
    }
    
    // If not a 'show:' action that needs to fall through
    if (!data.startsWith('show:')) return c.json({ ok: true })
  }

  const msg = update?.message
  if (!msg?.text) return c.json({ ok: true })

  const chatId = String(msg.chat.id)

  // If TELEGRAM_CHAT_ID is set, only allow that specific admin chat
  if (env.TELEGRAM_CHAT_ID && chatId !== env.TELEGRAM_CHAT_ID) {
    return c.json({ ok: true })
  }

  const text = msg.text.trim()
  const cmd = text.split(/\s+/)[0].toLowerCase().replace(/@\w+$/, '')
  const args = text.split(/\s+/).slice(1)

  async function reply(text: string, keyboard?: any) {
    await sendTelegramMessage(token, chatId, text, keyboard)
  }

  try {
    switch (cmd) {
      // ---- /start or /help ----
      case '/start':
      case '/help': {
        await reply(
          `🤖 *MAASGA Bot Admin*\n\n` +
          `━━━ 📊 TABLEAU DE BORD ━━━\n` +
          `/stats — Tableau de bord complet\n` +
          `/clients — Derniers clients inscrits\n\n` +
          `━━━ 📆 RDV ━━━\n` +
          `/rdv — Rendez-vous à venir\n` +
          `/confirmer <id> — Confirmer un RDV\n` +
          `/terminer <id> — Marquer terminé\n` +
          `/annuler <id> — Annuler un RDV\n\n` +
          `━━━ 🛒 COMMANDES & DEVIS ━━━\n` +
          `/commandes — Commandes récentes\n` +
          `/devis — Devis en attente\n` +
          `/paiements — Paiements récents\n\n` +
          `━━━ 🔧 MAINTENANCE ━━━\n` +
          `/contrats — Contrats actifs\n` +
          `/visites — Prochaines visites\n` +
          `/valider <id> — Valider une visite\n\n` +
          `━━━ 🎧 SAV & AVIS ━━━\n` +
          `/sav — Tickets SAV ouverts\n` +
          `/avis — Avis en attente d'approbation\n` +
          `/approuver <id> — Approuver un avis\n\n` +
          `━━━ 💬 MESSAGES ━━━\n` +
          `/messages — Messages non lus\n\n` +
          `━━━ 📦 PRODUITS ━━━\n` +
          `/stock — État du stock\n` +
          `/stock_update <id> <qté> — Modifier stock\n` +
          `/recherche [marque] [BTU] — Chercher produit\n` +
          `/convertir <cv> — CV vers BTU\n\n` +
          `━━━ 🗃️ SYSTÈME ━━━\n` +
          `/client <nom> — Rechercher client\n` +
          `/backup — Résumé base de données\n\n` +
          `💡 *Actions rapides :*`,
          { inline_keyboard: [
            [{ text: '📊 Dashboard', callback_data: 'show:stats' }, { text: '📆 RDV', callback_data: 'show:rdv' }],
            [{ text: '🛒 Commandes', callback_data: 'show:orders' }, { text: '📄 Devis', callback_data: 'show:devis' }],
            [{ text: '📋 Contrats', callback_data: 'show:contracts' }, { text: '📅 Visites', callback_data: 'show:visits' }],
            [{ text: '💬 Messages', callback_data: 'show:messages' }, { text: '💳 Paiements', callback_data: 'show:payments' }],
            [{ text: '🎧 SAV', callback_data: 'show:sav' }, { text: '⭐ Avis', callback_data: 'show:avis' }],
            [{ text: '👤 Clients', callback_data: 'show:clients' }, { text: '📦 Stock', callback_data: 'show:stock' }]
          ]}
        )
        break
      }

      // ---- /stats ----
      case '/stats': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const [contracts, visits, rdvs, orders, devis, contacts, products] = await Promise.all([
          db.prepare(`SELECT COUNT(*) as c FROM maintenance_contracts WHERE status='actif'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM maintenance_visits WHERE status='planifiee' AND visit_date >= date('now')`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM appointments WHERE date >= date('now') AND status != 'cancelled'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status='en_attente'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM devis WHERE status='sent'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM contact_messages WHERE is_read=0`).first(),
          db.prepare(`SELECT COUNT(*) as c, SUM(CASE WHEN stock <= 2 THEN 1 ELSE 0 END) as low FROM products`).first(),
        ])
        await reply(
          `📊 *Tableau de bord MAASGA*\n\n` +
          `📆 RDV à venir: *${rdvs?.c || 0}*\n` +
          `🛒 Commandes en attente: *${orders?.c || 0}*\n` +
          `📄 Devis envoyés: *${devis?.c || 0}*\n` +
          `💬 Messages non lus: *${contacts?.c || 0}*\n` +
          `🔧 Contrats actifs: *${contracts?.c || 0}*\n` +
          `📅 Visites à venir: *${visits?.c || 0}*\n` +
          `📦 Produits stock bas: *${products?.low || 0}*`,
          { inline_keyboard: [
            [{ text: '📆 Voir RDV', callback_data: 'show:rdv' }, { text: '🛒 Commandes', callback_data: 'show:orders' }],
            [{ text: '💬 Messages', callback_data: 'show:messages' }, { text: '💳 Paiements', callback_data: 'show:payments' }],
            [{ text: '🎧 SAV', callback_data: 'show:sav' }, { text: '⭐ Avis', callback_data: 'show:avis' }],
            [{ text: '👤 Clients', callback_data: 'show:clients' }, { text: '📦 Stock', callback_data: 'show:stock' }],
            [{ text: '🔄 Actualiser', callback_data: 'show:stats' }]
          ]}
        )
        break
      }

      // ---- /stock ----
      case '/stock': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, name, stock, price FROM products ORDER BY stock ASC LIMIT 15`
        ).all()
        if (!rows.results?.length) { await reply('Aucun produit.'); break }
        let txt = `📦 *État du Stock*\n\n`
        for (const p of rows.results as any[]) {
          const icon = p.stock <= 0 ? '🔴' : p.stock <= 2 ? '🟡' : '🟢'
          txt += `${icon} *${p.name}*\n   Stock: ${p.stock} | ${(p.price || 0).toLocaleString()} FCFA\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:stock' }]] })
        break
      }

      // ---- /contrats ----
      case '/contrats': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT mc.id, mc.plan_type, mc.status, mc.start_date, mc.end_date, c.name as client
           FROM maintenance_contracts mc
           JOIN clients c ON mc.client_id = c.id
           WHERE mc.status = 'actif'
           ORDER BY mc.start_date DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucun contrat actif.'); break }
        let txt = `📋 *Contrats maintenance actifs*\n\n`
        for (const r of rows.results as any[]) {
          const plan = r.plan_type === 'trimestriel' ? '3×/an' : r.plan_type === 'semestriel' ? '2×/an' : '1×/an'
          txt += `#${r.id} — *${r.client}*\n   ${r.plan_type} (${plan}) | ${r.start_date} → ${r.end_date}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '📅 Visites', callback_data: 'show:visits' }, { text: '🔄 Actualiser', callback_data: 'show:contracts' }]] })
        break
      }

      // ---- /visites ----
      case '/visites': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT mv.id, mv.visit_date, mv.status, c.name as client, c.phone as client_phone, mc.plan_type
           FROM maintenance_visits mv
           JOIN maintenance_contracts mc ON mv.contract_id = mc.id
           JOIN clients c ON mc.client_id = c.id
           WHERE mv.status IN ('planifiee','confirmee') AND mv.visit_date >= date('now')
           ORDER BY mv.visit_date ASC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucune visite à venir.'); break }
        let txt = `📅 *Prochaines visites maintenance*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          txt += `🔹 #${r.id} — *${r.client}*\n   📆 ${r.visit_date} | ${r.plan_type}\n   📱 ${r.client_phone || '—'}\n\n`
          buttons.push([{ text: `✅ Valider #${r.id}`, callback_data: `complete:visit:${r.id}` }])
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:visits' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 6) })
        break
      }

      // ---- /valider <id> ----
      case '/valider': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const visitId = parseInt(args[0])
        if (!visitId) { await reply('⚠️ Usage: /valider <id\\_visite>'); break }
        const visit = await db.prepare(
          `SELECT mv.*, c.name as client_name FROM maintenance_visits mv
           JOIN maintenance_contracts mc ON mv.contract_id = mc.id
           JOIN clients c ON mc.client_id = c.id
           WHERE mv.id = ?`
        ).bind(visitId).first() as any
        if (!visit) { await reply(`❌ Visite #${visitId} introuvable.`); break }
        if (visit.status === 'effectuee') { await reply(`✅ Visite #${visitId} est déjà complétée.`); break }
        await db.prepare(
          `UPDATE maintenance_visits SET status='effectuee', updated_at=datetime('now'), notes='Validée via Telegram Bot' WHERE id=?`
        ).bind(visitId).run()
        await reply(
          `✅ *Visite #${visitId} validée !*\n\n` +
          `👤 Client: ${visit.client_name}\n` +
          `📅 Date prévue: ${visit.visit_date}\n` +
          `🕐 Complétée: ${new Date().toISOString().replace('T', ' ').slice(0, 16)}`
        )
        break
      }

      // ---- /rdv ----
      case '/rdv': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const today = new Date().toISOString().split('T')[0]
        const rows = await db.prepare(
          `SELECT id, name, phone, date, heure_debut, heure_fin, type, quartier, status FROM appointments
           WHERE date >= ? AND status != 'cancelled' ORDER BY date ASC, heure_debut ASC LIMIT 10`
        ).bind(today).all()
        if (!rows.results?.length) { await reply('Aucun RDV à venir.', { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:rdv' }]] }); break }
        let txt = `📆 *Prochains rendez-vous*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const dateStr = r.date === today ? "📍 AUJOURD'HUI" : `📅 ${r.date}`
          const horaire = r.heure_debut ? `${r.heure_debut}–${r.heure_fin || '18:00'}` : '—'
          const stIcon = r.status === 'confirmed' ? '✅' : r.status === 'done' ? '☑️' : '⏳'
          txt += `${stIcon} #${r.id} — *${r.name}*\n   ${dateStr} | ${horaire}\n   📱 ${r.phone} | 📍 ${r.quartier || '—'}\n\n`
          if (r.status === 'pending') {
            buttons.push([{ text: `👁️ #${r.id} ${r.name}`, callback_data: `detail:rdv:${r.id}` }])
          }
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:rdv' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 6) })
        break
      }

      // ---- /commandes ----
      case '/commandes': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT o.id, o.total_price, o.client_name, o.client_phone, o.status, o.created_at, c.name as client
           FROM orders o LEFT JOIN clients c ON o.client_id = c.id
           ORDER BY o.created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucune commande.', { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:orders' }]] }); break }
        let txt = `🛒 *Commandes récentes*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const st = r.status === 'en_attente' ? '⏳' : r.status === 'contacte' ? '📞' : r.status === 'confirme' ? '✅' : r.status === 'en_livraison' ? '🚚' : r.status === 'livre' ? '📦' : r.status === 'annule' ? '❌' : '🔄'
          const nom = r.client || r.client_name || 'Anonyme'
          txt += `${st} #${r.id} — *${nom}*\n   ${(r.total_price || 0).toLocaleString()} FCFA | ${r.status}\n\n`
          if (r.status === 'pending') {
            buttons.push([{ text: `👁️ #${r.id} ${nom}`, callback_data: `detail:order:${r.id}` }])
          }
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:orders' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 6) })
        break
      }

      // ---- /messages ----
      case '/messages': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, name, phone, email, message, created_at FROM contact_messages
           WHERE is_read = 0 ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('✅ Aucun message non lu.', { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:messages' }]] }); break }
        let txt = `💬 *Messages non lus*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          txt += `🔹 #${r.id} — *${r.name}*\n   📱 ${r.phone || r.email || '—'}\n   💬 ${(r.message || '').slice(0, 80)}...\n\n`
          buttons.push([
            { text: `📖 Lu #${r.id}`, callback_data: `read:msg:${r.id}` },
            r.phone ? { text: `💬 WhatsApp`, url: `https://wa.me/${(r.phone || '').replace(/\D/g, '')}` } : { text: `📧 Email`, url: `mailto:${r.email || ''}` }
          ])
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:messages' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 8) })
        break
      }

      // ---- /devis ----
      case '/devis': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, numero, client_name, total_ht, status, created_at, expires_at FROM devis
           WHERE status IN ('sent','draft') ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucun devis en attente.', { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:devis' }]] }); break }
        let txt = `📄 *Devis en attente*\n\n`
        for (const r of rows.results as any[]) {
          const st = r.status === 'sent' ? '📤' : '📝'
          txt += `${st} ${r.numero} — *${r.client_name}*\n   💰 ${(r.total_ht || 0).toLocaleString()} FCFA\n   📅 Expire: ${(r.expires_at || '').slice(0, 10)}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:devis' }]] })
        break
      }

      // ---- /client <nom> ----
      case '/client': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const search = args.join(' ')
        if (!search) { await reply('⚠️ Usage: /client <nom ou téléphone>'); break }
        const rows = await db.prepare(
          `SELECT id, name, phone, email, quartier FROM clients
           WHERE name LIKE ? OR phone LIKE ? LIMIT 5`
        ).bind(`%${search}%`, `%${search}%`).all()
        if (!rows.results?.length) { await reply(`🔍 Aucun client trouvé pour "${search}".`); break }
        let txt = `🔍 *Résultats pour "${search}"*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          txt += `👤 #${r.id} — *${r.name}*\n   📱 ${r.phone || '—'} | 📧 ${r.email || '—'}\n   📍 ${r.quartier || '—'}\n\n`
          if (r.phone) {
            buttons.push([{ text: `💬 WhatsApp ${r.name}`, url: `https://wa.me/${(r.phone || '').replace(/\D/g, '')}` }])
          }
        }
        await reply(txt, buttons.length ? { inline_keyboard: buttons.slice(0, 4) } : undefined)
        break
      }

      // ---- /confirmer <id> (RDV) ----
      case '/confirmer': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rdvId = parseInt(args[0])
        if (!rdvId) { await reply('⚠️ Usage: /confirmer <id\\_rdv>'); break }
        await db.prepare(`UPDATE appointments SET status='confirmed' WHERE id=?`).bind(rdvId).run()
        await reply(`✅ RDV #${rdvId} confirmé !`)
        break
      }

      // ---- /annuler <id> (RDV) ----
      case '/annuler': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rdvId = parseInt(args[0])
        if (!rdvId) { await reply('⚠️ Usage: /annuler <id\\_rdv>'); break }
        await db.prepare(`UPDATE appointments SET status='cancelled' WHERE id=?`).bind(rdvId).run()
        await reply(`❌ RDV #${rdvId} annulé.`)
        break
      }

      // ---- /convertir <cv> ----
      case '/convertir': {
        const CV_TO_BTU: Record<string, number> = {
          '0.75': 7000, '1': 9000, '1.5': 12000, '2': 18000,
          '2.5': 24000, '3': 24000, '3.5': 30000, '4': 36000, '5': 48000
        }
        const SURFACE: Record<number, string> = {
          7000: '≈ 7–10 m²', 9000: '≈ 9–15 m²', 12000: '≈ 15–23 m²',
          18000: '≈ 25–40 m²', 24000: '≈ 40–60 m²', 30000: '≈ 60–80 m²',
          36000: '≈ 80–100 m²', 48000: '≈ 100–130 m²'
        }
        if (!args[0]) {
          let txt = `🔄 *Conversion CV → BTU*\n\n`
          for (const [cv, btu] of Object.entries(CV_TO_BTU)) {
            txt += `*${cv} CV* = ${btu.toLocaleString()} BTU — ${SURFACE[btu] || ''}\n`
          }
          txt += `\n💡 Usage: /convertir 2`
          await reply(txt)
          break
        }
        const cv = parseFloat(args[0].replace(',', '.'))
        const key = cv.toString()
        const btu = CV_TO_BTU[key]
        if (!btu) {
          await reply(`⚠️ Valeur non reconnue: ${args[0]} CV\n\n🔢 Valeurs valides: 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5`)
          break
        }
        await reply(
          `🔄 *Conversion CV → BTU*\n\n` +
          `*${cv} CV* = *${btu.toLocaleString()} BTU*\n` +
          `📐 Surface couverte: ${SURFACE[btu] || '—'}\n\n` +
          `💡 Tapez /recherche ${btu} pour voir les produits disponibles.`,
          { inline_keyboard: [[{ text: `🔍 Voir produits ${btu} BTU`, callback_data: `search:${btu}:` }]] }
        )
        break
      }

      // ---- /recherche [marques...] [BTU...] ----
      case '/recherche': {
        if (!db) { await reply('❌ Base de données indisponible'); break }

        const KNOWN_BRANDS = ['LG', 'SAMSUNG', 'GREE', 'MIDEA', 'HAIER', 'DAIKIN', 'CARRIER', 'TOSHIBA', 'FUJITSU', 'PANASONIC', 'HISENSE']
        const CV_TO_BTU_MAP: Record<number, number> = { 1: 9000, 2: 18000, 3: 24000, 4: 36000, 5: 48000 }
        const CV_FLOAT: Record<string, number> = { '0.75': 7000, '1': 9000, '1.5': 12000, '2': 18000, '2.5': 24000, '3': 24000, '3.5': 30000, '4': 36000, '5': 48000 }

        const brands: string[] = []
        const btuValues: number[] = []

        for (const arg of args) {
          const upper = arg.toUpperCase()
          if (KNOWN_BRANDS.includes(upper)) {
            brands.push(upper)
          } else {
            const num = parseFloat(arg.replace(',', '.'))
            if (!isNaN(num)) {
              if (num >= 1000) {
                // Direct BTU value
                btuValues.push(num)
              } else {
                // CV value — convert to BTU
                const btu = CV_FLOAT[num.toString()] || Math.round(num) in CV_TO_BTU_MAP ? CV_TO_BTU_MAP[Math.round(num)] : null
                const resolved = CV_FLOAT[num.toString()] || btu
                if (resolved) btuValues.push(resolved)
              }
            }
          }
        }

        // Build SQL query dynamically
        let sql = `SELECT id, name, brand, btu, price, stock, energy_class, inverter FROM products WHERE available = 1`
        const bindings: any[] = []

        if (brands.length > 0) {
          sql += ` AND brand IN (${brands.map(() => '?').join(',')})`
          bindings.push(...brands)
        }
        if (btuValues.length > 0) {
          sql += ` AND btu IN (${btuValues.map(() => '?').join(',')})`
          bindings.push(...btuValues)
        }
        sql += ` ORDER BY brand ASC, btu ASC LIMIT 20`

        let stmt = db.prepare(sql)
        if (bindings.length > 0) stmt = stmt.bind(...bindings)
        const rows = await stmt.all()

        if (!rows.results?.length) {
          const what = [...brands, ...btuValues.map(b => `${b} BTU`)].join(', ') || 'tous produits'
          await reply(`🔍 Aucun produit disponible pour: *${what}*\n\nEssayez /stock pour voir tout le catalogue.`)
          break
        }

        const filterDesc = [
          brands.length ? `Marques: *${brands.join(', ')}*` : '',
          btuValues.length ? `BTU: *${btuValues.map(b => b.toLocaleString()).join(', ')}*` : ''
        ].filter(Boolean).join(' · ') || '*Tout le catalogue*'

        let txt = `🔍 *Recherche produits* — ${filterDesc}\n📦 ${rows.results.length} résultat(s)\n\n`
        for (const p of rows.results as any[]) {
          const stockIcon = p.stock <= 0 ? '🔴 Rupture' : p.stock <= 2 ? `🟡 ${p.stock} restant(s)` : `🟢 En stock (${p.stock})`
          const inv = p.inverter ? '⚡ Inverter' : 'Standard'
          txt += `*${p.brand}* — ${(p.btu || 0).toLocaleString()} BTU\n`
          txt += `   💰 ${(p.price || 0).toLocaleString()} FCFA | ${inv} | ${p.energy_class || '—'}\n`
          txt += `   ${stockIcon}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '🔄 Tout le catalogue', callback_data: 'show:stock' }]] })
        break
      }

      // ---- /paiements → redirigé vers commandes ----
      case '/paiements': {
        await reply('💡 Le système de paiement en ligne a été remplacé par un flux contact direct.\nConsultez les commandes avec /commandes.')
        break
      }

      // ---- /sav ----
      case '/sav': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, ticket_ref, subject, priority, status, client_name, client_phone, created_at
           FROM sav_tickets WHERE status NOT IN ('resolved','closed') ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('✅ Aucun ticket SAV ouvert.'); break }
        let txt = `🎧 *Tickets SAV ouverts*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const pIcon = r.priority==='urgent'?'🔴':r.priority==='high'?'🟠':r.priority==='normal'?'🟡':'⚪'
          const stIcon = r.status==='open'?'📬':r.status==='in_progress'?'🔧':'📋'
          txt += `${stIcon} ${r.ticket_ref} — *${r.client_name||'?'}*\n   ${pIcon} ${r.priority||'normal'} | ${r.subject||'—'}\n   📱 ${r.client_phone||'—'}\n\n`
          buttons.push([{ text: `✅ Résoudre ${r.ticket_ref}`, callback_data: `resolve:sav:${r.id}` }])
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:sav' }])
        await reply(txt, { inline_keyboard: buttons.slice(0,6) })
        break
      }

      // ---- /avis ----
      case '/avis': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, client_name, note, comment, service, created_at FROM reviews WHERE approved=0 ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply("✅ Aucun avis en attente d'approbation."); break }
        let txt = `⭐ *Avis en attente*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const stars = '⭐'.repeat(Math.min(r.rating||5,5))
          txt += `#${r.id} ${stars} — *${r.client_name||'?'}*\n   💬 ${(r.comment||'').slice(0,80)}${r.comment?.length>80?'…':''}\n\n`
          buttons.push([
            { text: `✅ Approuver #${r.id}`, callback_data: `approve:review:${r.id}` },
            { text: `❌ Rejeter #${r.id}`, callback_data: `reject:review:${r.id}` }
          ])
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:avis' }])
        await reply(txt, { inline_keyboard: buttons.slice(0,6) })
        break
      }

      // ---- /approuver <id> (avis) ----
      case '/approuver': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const reviewId = parseInt(args[0])
        if (!reviewId) { await reply('⚠️ Usage: /approuver <id\_avis>'); break }
        await db.prepare(`UPDATE reviews SET approved=1 WHERE id=?`).bind(reviewId).run()
        await reply(`✅ Avis #${reviewId} approuvé et publié !`)
        break
      }

      // ---- /terminer <id> (RDV → done) ----
      case '/terminer': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rdvId = parseInt(args[0])
        if (!rdvId) { await reply('⚠️ Usage: /terminer <id\_rdv>'); break }
        const rdv = await db.prepare(`SELECT name FROM appointments WHERE id=?`).bind(rdvId).first() as any
        if (!rdv) { await reply(`❌ RDV #${rdvId} introuvable.`); break }
        await db.prepare(`UPDATE appointments SET status='done' WHERE id=?`).bind(rdvId).run()
        await reply(`☑️ RDV #${rdvId} (${rdv.name}) marqué comme *terminé* !`)
        break
      }

      // ---- /stock_update <id> <quantite> ----
      case '/stock_update': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const prodId = parseInt(args[0])
        const qty = parseInt(args[1])
        if (!prodId || isNaN(qty)) { await reply('⚠️ Usage: /stock\_update <id\_produit> <nouvelle\_quantité>\nEx: /stock\_update 3 10'); break }
        const prod = await db.prepare(`SELECT id, name, stock FROM products WHERE id=?`).bind(prodId).first() as any
        if (!prod) { await reply(`❌ Produit #${prodId} introuvable. Tapez /stock pour voir les IDs.`); break }
        await db.prepare(`UPDATE products SET stock=?, updated_at=datetime('now') WHERE id=?`).bind(qty, prodId).run()
        await reply(`📦 Stock mis à jour !\n\n*${prod.name}*\n   Ancien stock: ${prod.stock} → Nouveau: *${qty}*`)
        break
      }

      // ---- /clients (derniers inscrits) ----
      case '/clients': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, name, phone, email, quartier, created_at FROM clients ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucun client.'); break }
        let txt = `👤 *Derniers clients inscrits*\n\n`
        for (const r of rows.results as any[]) {
          txt += `#${r.id} — *${r.name}*\n   📱 ${r.phone||'—'} | 📍 ${r.quartier||'—'}\n   📅 ${(r.created_at||'').slice(0,10)}\n\n`
        }
        const totalRes = await db.prepare(`SELECT COUNT(*) as c FROM clients`).first() as any
        txt += `📊 Total: *${totalRes?.c||0}* clients`
        await reply(txt, { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:clients' }]] })
        break
      }

      // ---- /backup ----
      case '/backup': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const backupTables = ['products', 'clients', 'appointments', 'orders', 'reviews', 'contact_messages', 'maintenance_contracts', 'sav_tickets', 'site_settings']
        const counts: string[] = []
        let totalRows = 0
        for (const table of backupTables) {
          try {
            const r = await db.prepare(`SELECT COUNT(*) as c FROM ${table}`).first() as { c: number } | null
            const count = r?.c || 0
            totalRows += count
            counts.push(`  ${table}: *${count}* lignes`)
          } catch (_) {
            counts.push(`  ${table}: ⚠️ erreur`)
          }
        }
        await reply(
          `💾 *Backup D1 — Résumé*\n\n` +
          `📊 Total: *${totalRows.toLocaleString()}* lignes\n` +
          `📋 Tables:\n${counts.join('\n')}\n\n` +
          `🔗 *Pour télécharger le backup JSON complet:*\n` +
          `Allez sur /admin → Paramètres → Backup\n` +
          `ou: \`/api/admin/backup\` (authentifié)`,
          { inline_keyboard: [[{ text: '📊 Dashboard', callback_data: 'show:stats' }]] }
        )
        break
      }

      default: {
        if (cmd.startsWith('/')) {
          await reply(`❓ Commande inconnue: ${cmd}\n\nTapez /help pour voir les commandes disponibles.`)
        }
      }
    }
  } catch (err: any) {
    console.error('[TELEGRAM BOT]', err)
    await reply(`❌ Erreur: ${err.message || 'interne'}`)
  }

  return c.json({ ok: true })
})

// ============================================================
