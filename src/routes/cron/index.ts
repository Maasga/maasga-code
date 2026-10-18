// Cron Route: Daily maintenance visit reminders (email + Telegram)
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import { ensureNotificationsTable } from '../../utils/notifications'

export const cronRouter = new Hono<HonoEnv>()

// ============================================================
// CRON : Daily maintenance visit reminders (email + Telegram)
// Runs at 07:00 UTC (08:00 Ouagadougou) every day
// ============================================================

async function sendMaintenanceEmail(apiKey: string, toEmail: string, toName: string, subject: string, htmlContent: string): Promise<boolean> {
  if (!apiKey) return false
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
        to: [{ email: toEmail, name: toName }],
        subject,
        htmlContent
      })
    })
    return res.ok
  } catch { return false }
}

function buildMaintenanceReminderHtml(clientName: string, visitDate: string, planType: string, isToday: boolean): string {
  const fmtD = (() => { try { return new Date(visitDate).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) } catch { return visitDate } })()
  const urgencyColor = isToday ? '#ef4444' : '#f59e0b'
  const urgencyText = isToday ? "aujourd'hui" : 'demain'
  const planLabels: Record<string,string> = { trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel Premium' }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#03045e,#0077b6);padding:32px;text-align:center;">
    <div style="font-size:28px;font-weight:800;color:white;">MAASGA &#10052;</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Rappel de maintenance</div>
  </div>
  <div style="padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${urgencyColor}15;border:2px solid ${urgencyColor}30;border-radius:16px;padding:16px 32px;">
        <div style="font-size:32px;font-weight:900;color:${urgencyColor};">ðŸ””</div>
        <div style="font-size:18px;font-weight:800;color:${urgencyColor};margin-top:4px;">Maintenance ${urgencyText} !</div>
      </div>
    </div>
    <h2 style="font-size:18px;font-weight:700;color:#03045e;margin:0 0 16px;">Bonjour ${clientName},</h2>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      Nous vous rappelons que votre visite de maintenance préventive est prévue <strong style="color:${urgencyColor};">${urgencyText}</strong>.
    </p>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;font-size:14px;color:#334155;">
        <tr><td style="padding:6px 0;font-weight:600;">📅 Date</td><td style="padding:6px 0;">${fmtD}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">ðŸ“‹ Contrat</td><td style="padding:6px 0;">${planLabels[planType] || planType}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">🔧 Type</td><td style="padding:6px 0;">Visite préventive</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 20px;">
      Merci de vous assurer que l'accès Ã  vos équipements est possible. En cas d'empêchement, contactez-nous au plus vite.
    </p>
    <div style="text-align:center;">
      <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA%2C%20concernant%20ma%20maintenance%20du%20${encodeURIComponent(fmtD)}" style="display:inline-block;background:#25d366;color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        <span style="margin-right:6px;">ðŸ“±</span>Contacter via WhatsApp
      </a>
    </div>
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
      MAASGA — Froid &amp; Climatisation - Ouagadougou, Burkina Faso<br>
      Tel: +226 55 99 64 18 - maasgabf@gmail.com
    </div>
  </div>
</div>
</body></html>`
}

async function handleScheduled(env: HonoEnv['Bindings']) {
  const db = env.DB
  if (!db) return

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const tomorrowObj = new Date(now)
  tomorrowObj.setDate(tomorrowObj.getDate() + 1)
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0]

  // Find visits due today or tomorrow that are still scheduled
  const { results: dueVisits } = await db.prepare(
    `SELECT mv.id, mv.contract_id, mv.client_id, mv.client_name, mv.client_phone, mv.visit_date,
            mc.plan_type, mc.client_name as contract_client_name
     FROM maintenance_visits mv
     LEFT JOIN maintenance_contracts mc ON mc.id = mv.contract_id
     WHERE mv.status IN ('planifiee', 'confirmee')
       AND (mv.visit_date = ? OR mv.visit_date = ?)
     ORDER BY mv.visit_date`
  ).bind(todayStr, tomorrowStr).all()

  if (!dueVisits || dueVisits.length === 0) return

  for (const visit of dueVisits as any[]) {
    const isToday = visit.visit_date === todayStr
    const clientName = visit.client_name || visit.contract_client_name || 'Client'
    const planType = visit.plan_type || 'trimestriel'
    const label = isToday ? "AUJOURD'HUI" : 'DEMAIN'

    // 1. Send email to client (get email from clients table)
    if (env.BREVO_API_KEY && visit.client_id) {
      try {
        const client = await db.prepare('SELECT email, name FROM clients WHERE id = ?').bind(visit.client_id).first() as any
        if (client?.email) {
          await sendMaintenanceEmail(
            env.BREVO_API_KEY,
            client.email,
            client.name || clientName,
            `ðŸ”” Rappel : Maintenance ${label} — MAASGA`,
            buildMaintenanceReminderHtml(client.name || clientName, visit.visit_date, planType, isToday)
          )
        }
      } catch (e) { console.error('[CRON] Email client error:', e) }
    }

    // 2. Send email to admin
    if (env.BREVO_API_KEY && env.ADMIN_EMAIL) {
      try {
        await sendMaintenanceEmail(
          env.BREVO_API_KEY,
          env.ADMIN_EMAIL,
          'Admin MAASGA',
          `🔧 [ADMIN] Maintenance ${label} — ${clientName}`,
          buildMaintenanceReminderHtml(clientName, visit.visit_date, planType, isToday)
        )
      } catch (e) { console.error('[CRON] Email admin error:', e) }
    }

    // 3. Telegram notification to admin
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      try {
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: `ðŸ”” *RAPPEL MAINTENANCE — ${label}*\n\nðŸ‘¤ Client: ${clientName}\nðŸ“± Tél: ${visit.client_phone || '—'}\n📅 Date: ${visit.visit_date}\nðŸ“‹ Contrat: ${planType}\n\n${isToday ? "âš ï¸ La visite est prévue AUJOURD\'HUI !" : 'ðŸ“Œ La visite est prévue DEMAIN.'}`,
            parse_mode: 'Markdown'
          })
        })
      } catch(e) { console.error('[CRON] Telegram error:', e) }
    }

    // 4. Store notification in D1
    try {
      await ensureNotificationsTable(db)
      await db.prepare(
        'INSERT INTO admin_notifications (type, summary) VALUES (?, ?)'
      ).bind('maintenance', `ðŸ”” Rappel maintenance ${label}: ${clientName} (${visit.visit_date}) — Contrat ${planType}`).run()
    } catch(_) {}
  }

  console.log(`[CRON] Processed ${dueVisits.length} maintenance reminder(s)`)
}

// ============================================================
