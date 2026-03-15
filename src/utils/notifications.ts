import type { HonoEnv } from '../types'
import { normalizePhone } from './helpers'

// ============================================================
// SMS / WhatsApp notification logging
// ============================================================

async function ensureSmsLog(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS sms_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      provider TEXT DEFAULT 'whatsapp',
      error_detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
  } catch(_) {}
}

export async function sendSmsWithLog(_env: any, db: any, phone: string, message: string): Promise<{ sent: boolean; whatsappFallback?: string }> {
  const toNumber = phone.startsWith('+') ? phone : '+226' + normalizePhone(phone)
  const whatsappUrl = 'https://wa.me/' + toNumber.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(message)

  if (db) {
    try {
      await ensureSmsLog(db)
      await db.prepare('INSERT INTO sms_log (phone, message, status, provider) VALUES (?, ?, ?, ?)')
        .bind(toNumber, message.substring(0, 500), 'whatsapp_link', 'whatsapp').run()
    } catch(_) {}
  }
  return { sent: false, whatsappFallback: whatsappUrl }
}

// ============================================================
// ADMIN NOTIFICATION — WhatsApp, Telegram, D1
// ============================================================

let _notifTableReady = false
export async function ensureNotificationsTable(db: any) {
  if (_notifTableReady) return
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS admin_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      summary TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
    _notifTableReady = true
  } catch(_) {}
}

export async function notifyAdmin(env: HonoEnv['Bindings'], type: 'rdv' | 'order' | 'contact' | 'maintenance' | 'client' | 'payment' | 'product', summary: string) {
  const tasks: Promise<void>[] = []

  const labels: Record<string, string> = {
    rdv: 'Nouveau RDV 📅',
    order: 'Nouvelle Commande 🛒',
    contact: 'Nouveau Message ✉️',
    maintenance: 'Demande Maintenance 🔧',
    client: 'Nouvelle Inscription 👤',
    payment: 'Paiement Reçu 💳',
    product: 'Produit Ajouté 📦',
  }

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    tasks.push(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: `🔔 *MAASGA — ${labels[type] || type}*\n\n${summary}`,
          parse_mode: 'Markdown'
        })
      }).then(() => {}).catch(() => {})
    )
  }

  if (env.DB) {
    tasks.push(
      (async () => {
        try {
          await ensureNotificationsTable(env.DB as any)
          await (env.DB as any).prepare(
            'INSERT INTO admin_notifications (type, summary) VALUES (?, ?)'
          ).bind(type, summary).run()
        } catch(_) {}
      })()
    )
  }

  await Promise.allSettled(tasks)
}

// ============================================================
// ACTIVITY LOG (immutable insert-only)
// ============================================================

export async function ensureActivityLog(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS user_activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      client_phone TEXT,
      action TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general' CHECK(category IN ('auth','order','rdv','maintenance','payment','profile','general')),
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
  } catch(_) {}
}

export async function logActivity(db: any, data: { clientId: number; clientPhone?: string; action: string; category: string; details?: string; ip?: string }) {
  if (!db) return
  try {
    await ensureActivityLog(db)
    await db.prepare(
      'INSERT INTO user_activity_log (client_id, client_phone, action, category, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(data.clientId, data.clientPhone || null, data.action, data.category, data.details || null, data.ip || null).run()
  } catch(_) {}
}

// ============================================================
// SECURITY EVENT LOG
// ============================================================

let _secLogReady = false
export async function logSecurityEvent(db: any, data: { event: string; severity: 'info' | 'warn' | 'critical'; ip?: string; details?: string }) {
  if (!db) return
  try {
    if (!_secLogReady) {
      await db.prepare(`CREATE TABLE IF NOT EXISTS security_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        severity TEXT NOT NULL CHECK(severity IN ('info','warn','critical')),
        ip_address TEXT,
        details TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`).run()
      _secLogReady = true
    }
    await db.prepare('INSERT INTO security_log (event, severity, ip_address, details) VALUES (?, ?, ?, ?)')
      .bind(data.event, data.severity, data.ip || null, data.details || null).run()
  } catch(_) {}
}

// ============================================================
// TELEGRAM MESSAGE HELPER
// ============================================================

export async function sendTelegramMessage(token: string, chatId: string, text: string, keyboard?: any) {
  const payload: any = { chat_id: chatId, text, parse_mode: 'Markdown' }
  if (keyboard) payload.reply_markup = JSON.stringify(keyboard)
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
