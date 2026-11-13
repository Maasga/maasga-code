// Devis : création, envoi, PDF, acceptation client
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import {
  AdminDevisListPage,
  AdminDevisNewPage,
  AdminDevisDetailPage
} from '../../pages/admin'
import {
  appointments,
  orders,
  clients
} from '../../data/store'
import { products } from '../../data/products'
import {
  escapeHtml,
  sanitizeText
} from '../../utils/helpers'
import {
  notifyAdmin
} from '../../utils/notifications'
import { adminAuth, refreshAdminCache } from './shared'

export const adminDevisRouter = new Hono<HonoEnv>()

// ============================================================
// DEVIS — HELPER FUNCTIONS
// ============================================================
async function ensureDevisTable(db: any) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS devis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rdv_id INTEGER,
    order_id INTEGER,
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
  // Patch columns that might not exist in tables created by older app versions
  const colPatches = [
    'ALTER TABLE devis ADD COLUMN rdv_id INTEGER',
    'ALTER TABLE devis ADD COLUMN order_id INTEGER',
    'ALTER TABLE devis ADD COLUMN client_email TEXT',
    'ALTER TABLE devis ADD COLUMN client_quartier TEXT',
    'ALTER TABLE devis ADD COLUMN surface REAL',
    'ALTER TABLE devis ADD COLUMN btu_recommande INTEGER',
    'ALTER TABLE devis ADD COLUMN produit_id INTEGER',
    'ALTER TABLE devis ADD COLUMN produit_nom TEXT',
    'ALTER TABLE devis ADD COLUMN produit_btu INTEGER',
    "ALTER TABLE devis ADD COLUMN produit_prix INTEGER DEFAULT 0",
    "ALTER TABLE devis ADD COLUMN produit_quantite INTEGER DEFAULT 1",
    "ALTER TABLE devis ADD COLUMN installation_prix INTEGER DEFAULT 50000",
    "ALTER TABLE devis ADD COLUMN accessoires TEXT DEFAULT '[]'",
    'ALTER TABLE devis ADD COLUMN remise INTEGER DEFAULT 0',
    'ALTER TABLE devis ADD COLUMN total_ht INTEGER DEFAULT 0',
    'ALTER TABLE devis ADD COLUMN message_client TEXT',
    'ALTER TABLE devis ADD COLUMN notes_internes TEXT',
    'ALTER TABLE devis ADD COLUMN expires_at TEXT',
    'ALTER TABLE devis ADD COLUMN accepted_at TEXT',
  ]
  for (const sql of colPatches) { try { await db.prepare(sql).run() } catch {} }
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
    <div style="background:linear-gradient(135deg,rgba(var(--rgb-emerald),0.08),rgba(var(--rgb-green),0.05)); border:1px solid rgba(var(--rgb-emerald),0.2); border-radius:16px; padding:20px; margin:24px 0;">
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <div style="width:44px; height:44px; background:rgba(var(--rgb-emerald),0.15); border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:20px;">💡</div>
        <div style="flex:1;">
          <div style="font-weight:700; color:var(--fg-on-dark-success); margin-bottom:4px;">Économies estimées avec Inverter</div>
          <div style="font-size:13px; color:var(--fg-gray); line-height:1.6;">Pour un climatiseur ${btu.toLocaleString('fr-FR')} BTU, la technologie Inverter réduit votre consommation d'environ <strong style="color:var(--fg-on-dark-success);">30%</strong>, soit une économie annuelle estimée à :</div>
          <div style="font-size:28px; font-weight:800; color:var(--fg-on-dark-success); margin:8px 0;">${savings.toLocaleString('fr-FR')} FCFA <span style="font-size:14px; font-weight:500; color:var(--fg-gray);">/ an</span></div>
          <div style="font-size:11px; color:#9ca3af;">Estimation basée sur 8h/jour, 300 jours/an et un tarif de 100 FCFA/kWh</div>
        </div>
      </div>
    </div>`
  }

  const acceptFormHtml = !isAccepted && !isExpired ? `
    <div style="text-align:center; padding:32px 20px; background:linear-gradient(135deg,rgba(var(--rgb-sky),0.06),rgba(var(--rgb-indigo),0.06)); border-radius:16px; border:1px solid rgba(var(--rgb-sky),0.15); margin:24px 0;">
      <div style="font-size:18px; font-weight:700; color:var(--fg-on-dark-soft); margin-bottom:8px;">✅ Accepter ce devis ?</div>
      <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">En acceptant, vous confirmez votre accord sur les conditions ci-dessus.<br>Notre équipe vous contactera sous 24h pour planifier l'intervention.</p>
      <form method="post" action="/api/devis/${d.token}/accept" style="display:inline;">
        <button type="submit" style="background:linear-gradient(135deg,var(--surface-success),var(--surface-success-bright)); color:var(--fg-on-dark); font-weight:700; font-size:15px; padding:14px 32px; border-radius:12px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:10px; box-shadow:0 4px 15px rgba(var(--rgb-green),0.3);">
          J'accepte ce devis — ${total.toLocaleString('fr-FR')} FCFA
        </button>
      </form>
      <div style="margin-top:16px;">
        <a href="https://wa.me/22655996418?text=${encodeURIComponent('Bonjour, je souhaite discuter du devis ' + d.numero)}" style="display:inline-flex; align-items:center; gap:8px; background:rgba(var(--rgb-whatsapp),0.1); color:var(--fg-whatsapp); font-weight:600; font-size:13px; padding:10px 20px; border-radius:10px; text-decoration:none; border:1px solid rgba(var(--rgb-whatsapp),0.25);">
          <span style="font-size:18px;">💬</span> Poser une question par WhatsApp
        </a>
      </div>
    </div>` : isAccepted ? `
    <div style="text-align:center; padding:24px; background:rgba(var(--rgb-emerald),0.08); border-radius:16px; border:1px solid rgba(var(--rgb-emerald),0.2); margin:24px 0;">
      <div style="font-size:24px; margin-bottom:8px;">🎉</div>
      <div style="font-size:18px; font-weight:700; color:var(--fg-on-dark-success);">Devis accepté — Merci !</div>
      <p style="color:#94a3b8; font-size:13px; margin-top:6px;">Notre équipe va vous contacter très prochainement.</p>
    </div>` : `
    <div style="text-align:center; padding:24px; background:rgba(var(--rgb-red),0.08); border-radius:16px; border:1px solid rgba(var(--rgb-red),0.2); margin:24px 0;">
      <div style="font-size:18px; font-weight:700; color:var(--fg-on-dark-danger);">⚠️ Ce devis est expiré</div>
      <p style="color:#94a3b8; font-size:13px; margin-top:6px;">Contactez-nous pour un nouveau devis actualisé.</p>
    </div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(d.numero)} · Devis MAASGA</title>
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
    <div class="devis-num">${escapeHtml(d.numero)}</div>
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
    <div class="info-row"><span class="info-label">Nom</span><span class="info-val">${escapeHtml(d.client_name || '')}</span></div>
    <div class="info-row"><span class="info-label">Téléphone</span><span class="info-val">${escapeHtml(d.client_phone || '')}</span></div>
    ${d.client_email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val">${escapeHtml(d.client_email)}</span></div>` : ''}
    ${d.client_quartier ? `<div class="info-row"><span class="info-label">Adresse</span><span class="info-val">${escapeHtml(d.client_quartier)}, Ouagadougou</span></div>` : ''}
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
          <td><strong style="color:#e2e8f0;">${escapeHtml(d.produit_nom)}</strong></td>
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
          <td style="color:#94a3b8;">${escapeHtml(a.nom)}</td>
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
    <p style="font-size:14px; color:#cbd5e1; line-height:1.7; white-space:pre-wrap;">${escapeHtml(d.message_client)}</p>
  </div>` : ''}

  <div class="section" style="background:rgba(56,189,248,0.03);">
    <div class="section-title">✅ Nos engagements</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      ${[
        ['🔧', 'Techniciens certifiés', 'Équipe qualifiée'],
        ['🛡️', 'Garantie installation', "12 mois pièces et main d'œuvre"],
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
    <div style="margin-bottom:16px;">
      <a href="/devis/${escapeHtml(d.token)}/pdf" style="display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#0077b6,#0ea5e9); color:white; font-weight:700; font-size:14px; padding:12px 28px; border-radius:12px; text-decoration:none; box-shadow:0 4px 15px rgba(0,119,182,0.3);">
        🖨️ Télécharger le devis en PDF
      </a>
    </div>
    <strong>MAASGA — Froid &amp; Climatisation</strong><br>
    📞 +226 55 99 64 18 &nbsp;|&nbsp; Ouagadougou, Burkina Faso<br>
    Lundi–Dimanche · 8h00–18h00<br><br>
    <em>Ce devis est valable jusqu'au ${expiryStr || '30 jours'}. Aucun paiement n'est requis avant accord et signature du client. Le montant définitif peut être ajusté après visite technique si les conditions réelles diffèrent.</em>
  </div>
</div>
</body>
</html>`
}

function buildDevisPDF(d: any): string {
  const accs: any[] = JSON.parse(d.accessoires || '[]')
  const prodTotal = (Number(d.produit_prix) || 0) * (Number(d.produit_quantite) || 1)
  const installTotal = Number(d.installation_prix) || 0
  const accTotal = accs.reduce((s: number, a: any) => s + (Number(a.prix) || 0), 0)
  const sousTotal = prodTotal + installTotal + accTotal
  const remisePct = Number(d.remise) || 0
  const remiseMt = Math.round(sousTotal * remisePct / 100)
  const total = sousTotal - remiseMt
  const createdStr = new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const expiryStr = d.expires_at ? new Date(d.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const isAccepted = d.status === 'accepted'
  const acceptedStr = d.accepted_at ? new Date(d.accepted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const btuCvMap: Record<number,string> = { 9000: '1', 12000: '1,5', 18000: '2', 24000: '3', 36000: '5' }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(d.numero)} — Devis PDF MAASGA</title>
<meta name="robots" content="noindex,nofollow">
<style>
  @page { margin: 15mm 12mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; font-size: 13px; line-height: 1.5; background: #fff; }
  .page { max-width: 780px; margin: 0 auto; padding: 20px; }
  
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #0077b6; }
  .company { display: flex; align-items: flex-start; gap: 14px; }
  .company-logo { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 2px solid #e2e8f0; }
  .company-name { font-size: 24px; font-weight: 800; color: #03045e; letter-spacing: -0.5px; }
  .company-tagline { font-size: 11px; color: #0077b6; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
  .company-info { font-size: 11px; color: #64748b; margin-top: 6px; line-height: 1.7; }
  .devis-box { text-align: right; }
  .devis-title { font-size: 22px; font-weight: 800; color: #0077b6; text-transform: uppercase; letter-spacing: 0.05em; }
  .devis-num { font-size: 16px; font-weight: 700; color: #03045e; margin-top: 4px; }
  .devis-meta { font-size: 11px; color: #64748b; margin-top: 8px; line-height: 1.6; }
  .status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-top: 6px; }
  .status-accepted { background: #dcfce7; color: #16a34a; }
  .status-sent { background: #fef3c7; color: #d97706; }
  .status-expired { background: #fee2e2; color: #dc2626; }
  
  /* Two-column info */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
  .info-card-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0077b6; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .info-label { color: #64748b; }
  .info-val { color: #1a1a2e; font-weight: 600; }
  
  /* Table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead th { background: #03045e; color: white; padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
  thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align: right; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; vertical-align: top; }
  tbody td.right { text-align: right; font-weight: 600; white-space: nowrap; }
  .subtotal-row td { border-top: 2px solid #e2e8f0; font-size: 12px; color: #64748b; }
  .discount-row td { color: #16a34a; font-size: 12px; }
  .total-row td { border-top: 3px solid #03045e; padding-top: 14px; }
  .total-label { font-size: 15px; font-weight: 800; color: #03045e; }
  .total-amount { font-size: 22px; font-weight: 800; color: #0077b6; text-align: right; }
  
  /* Technical */
  .tech-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
  .tech-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; text-align: center; }
  .tech-val { font-size: 16px; font-weight: 800; color: #0077b6; }
  .tech-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
  
  /* Engagements */
  .engagements { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 20px 0; }
  .engage-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #334155; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 10px; }
  .engage-icon { font-size: 16px; flex-shrink: 0; }
  
  /* Conditions */
  .conditions { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 11px; color: #92400e; line-height: 1.7; }
  .conditions-title { font-weight: 700; font-size: 12px; margin-bottom: 6px; color: #78350f; }
  
  /* Footer */
  .footer { text-align: center; padding: 20px 0; border-top: 2px solid #e2e8f0; margin-top: 24px; font-size: 11px; color: #64748b; line-height: 1.7; }
  .footer strong { color: #03045e; }
  
  /* Print toolbar */
  .print-bar { display: flex; justify-content: center; gap: 12px; padding: 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }
  .print-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; text-decoration: none; }
  .print-btn-primary { background: #0077b6; color: white; }
  .print-btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
  
  @media print {
    .print-bar { display: none !important; }
    body { background: white; }
    .page { padding: 0; max-width: none; }
  }
  
  /* Screen only padding */
  @media screen {
    body { background: #f1f5f9; }
    .page { background: white; margin: 20px auto; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  }
</style>
</head>
<body>
<div class="print-bar">
  <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ Imprimer / Télécharger PDF</button>
  <a class="print-btn print-btn-secondary" href="/devis/${escapeHtml(d.token)}">← Retour au devis</a>
</div>

<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="company">
      <img src="/logo-site.png" alt="MAASGA" class="company-logo" />
      <div>
        <div class="company-name">MAASGA</div>
        <div class="company-tagline">Froid & Climatisation</div>
        <div class="company-info">
          📍 Ouagadougou, Burkina Faso<br>
          📞 +226 55 99 64 18<br>
          ✉️ maasgabf@gmail.com<br>
          🕐 Lun–Dim · 8h00–18h00
        </div>
      </div>
    </div>
    <div class="devis-box">
      <div class="devis-title">Devis</div>
      <div class="devis-num">${escapeHtml(d.numero)}</div>
      <div class="devis-meta">
        Date : ${createdStr}<br>
        ${expiryStr ? `Valable jusqu'au : ${expiryStr}` : 'Validité : 30 jours'}
      </div>
      <span class="status-badge ${isAccepted ? 'status-accepted' : d.status === 'sent' ? 'status-sent' : 'status-expired'}">
        ${isAccepted ? '✓ Accepté' + (acceptedStr ? ' le ' + acceptedStr : '') : d.status === 'sent' ? '⏳ En attente' : '📋 ' + (d.status || 'Brouillon')}
      </span>
    </div>
  </div>

  <!-- CLIENT + TECHNIQUE -->
  <div class="info-grid">
    <div class="info-card">
      <div class="info-card-title">👤 Informations client</div>
      <div class="info-row"><span class="info-label">Nom</span><span class="info-val">${escapeHtml(d.client_name || '')}</span></div>
      <div class="info-row"><span class="info-label">Téléphone</span><span class="info-val">${escapeHtml(d.client_phone || '')}</span></div>
      ${d.client_email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val">${escapeHtml(d.client_email)}</span></div>` : ''}
      ${d.client_quartier ? `<div class="info-row"><span class="info-label">Adresse</span><span class="info-val">${escapeHtml(d.client_quartier)}, Ouagadougou</span></div>` : ''}
    </div>
    <div class="info-card">
      <div class="info-card-title">🏢 Émetteur</div>
      <div class="info-row"><span class="info-label">Entreprise</span><span class="info-val">MAASGA</span></div>
      <div class="info-row"><span class="info-label">Activité</span><span class="info-val">Froid & Climatisation</span></div>
      <div class="info-row"><span class="info-label">Ville</span><span class="info-val">Ouagadougou, BF</span></div>
      <div class="info-row"><span class="info-label">Tél</span><span class="info-val">+226 55 99 64 18</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-val">maasgabf@gmail.com</span></div>
    </div>
  </div>

  ${(d.surface || d.btu_recommande) ? `
  <!-- DONNÉES TECHNIQUES -->
  <div class="tech-grid">
    ${d.surface ? `<div class="tech-card"><div class="tech-val">${Number(d.surface).toLocaleString('fr-FR')} m²</div><div class="tech-label">Surface</div></div>` : ''}
    ${d.btu_recommande ? `<div class="tech-card"><div class="tech-val">${Number(d.btu_recommande).toLocaleString('fr-FR')} BTU</div><div class="tech-label">Puissance recommandée</div></div>` : ''}
    ${d.btu_recommande ? `<div class="tech-card"><div class="tech-val">${btuCvMap[Number(d.btu_recommande)] || '—'} CV</div><div class="tech-label">Chevaux vapeur</div></div>` : ''}
  </div>` : ''}

  <!-- TABLEAU DES PRESTATIONS -->
  <table>
    <thead><tr>
      <th style="width:45%">Désignation</th>
      <th style="width:10%">Qté</th>
      <th style="width:22%">Prix unitaire</th>
      <th style="width:23%">Total</th>
    </tr></thead>
    <tbody>
      ${d.produit_nom ? `<tr>
        <td><strong>${escapeHtml(d.produit_nom)}</strong>${d.produit_btu ? '<br><span style="font-size:11px;color:#64748b;">' + Number(d.produit_btu).toLocaleString('fr-FR') + ' BTU</span>' : ''}</td>
        <td class="right">${Number(d.produit_quantite) || 1}</td>
        <td class="right">${(Number(d.produit_prix) || 0).toLocaleString('fr-FR')} FCFA</td>
        <td class="right">${prodTotal.toLocaleString('fr-FR')} FCFA</td>
      </tr>` : ''}
      <tr>
        <td>Installation professionnelle<br><span style="font-size:10px;color:#64748b;">Mise en service · Test · Vérification étanchéité · Formation</span></td>
        <td class="right">1</td>
        <td class="right">${installTotal.toLocaleString('fr-FR')} FCFA</td>
        <td class="right">${installTotal.toLocaleString('fr-FR')} FCFA</td>
      </tr>
      ${accs.filter((a:any) => a.nom).map((a:any) => `<tr>
        <td style="color:#475569;">${escapeHtml(a.nom)}</td>
        <td class="right">1</td>
        <td class="right">${(Number(a.prix) || 0).toLocaleString('fr-FR')} FCFA</td>
        <td class="right">${(Number(a.prix) || 0).toLocaleString('fr-FR')} FCFA</td>
      </tr>`).join('')}
      <tr class="subtotal-row">
        <td colspan="3" style="text-align:right; font-weight:600;">Sous-total HT</td>
        <td class="right">${sousTotal.toLocaleString('fr-FR')} FCFA</td>
      </tr>
      ${remisePct > 0 ? `<tr class="discount-row">
        <td colspan="3" style="text-align:right;">Remise (${remisePct}%)</td>
        <td class="right">− ${remiseMt.toLocaleString('fr-FR')} FCFA</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="3"><span class="total-label">TOTAL TTC</span></td>
        <td><div class="total-amount">${total.toLocaleString('fr-FR')} FCFA</div></td>
      </tr>
    </tbody>
  </table>

  <!-- ENGAGEMENTS -->
  <div class="engagements">
    <div class="engage-item"><span class="engage-icon">🔧</span><span><strong>Techniciens certifiés</strong> — Équipe qualifiée et expérimentée</span></div>
    <div class="engage-item"><span class="engage-icon">🛡️</span><span><strong>Garantie 12 mois</strong> — Pièces et main d'œuvre</span></div>
    <div class="engage-item"><span class="engage-icon">📞</span><span><strong>SAV rapide</strong> — Intervention sous 48h</span></div>
    <div class="engage-item"><span class="engage-icon">💯</span><span><strong>Satisfaction garantie</strong> — Ou reprise gratuite</span></div>
  </div>

  ${d.message_client ? `
  <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:16px; margin:20px 0;">
    <div style="font-size:11px; font-weight:700; color:#0077b6; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">💬 Message de l'équipe</div>
    <p style="font-size:13px; color:#334155; line-height:1.7; white-space:pre-wrap;">${escapeHtml(d.message_client)}</p>
  </div>` : ''}

  <!-- CONDITIONS -->
  <div class="conditions">
    <div class="conditions-title">📋 Conditions générales</div>
    • Ce devis est valable ${expiryStr ? `jusqu'au ` + expiryStr : `30 jours à compter de la date d'émission`}.<br>
    • Aucun paiement n'est requis avant accord du client et visite technique sur site.<br>
    • Le montant définitif peut être ajusté si les conditions réelles diffèrent du dimensionnement initial.<br>
    • TVA non applicable (régime simplifié).<br>
    • L'installation comprend : mise en service, test complet et formation d'utilisation.
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <strong>MAASGA — Froid & Climatisation</strong><br>
    📍 Ouagadougou, Burkina Faso &nbsp;|&nbsp; 📞 +226 55 99 64 18 &nbsp;|&nbsp; ✉️ maasgabf@gmail.com<br>
    🕐 Lundi – Dimanche · 8h00 – 18h00<br><br>
    <em>Merci pour votre confiance. L'équipe MAASGA reste à votre disposition.</em>
  </div>
</div>

<script>
  // Auto-print if requested via query param
  if (new URLSearchParams(window.location.search).get('auto') === '1') {
    window.addEventListener('load', function() { setTimeout(function(){ window.print(); }, 500); });
  }
</script>
</body>
</html>`
}

// ADMIN — Order devis management
// ============================================================

// Admin creates a devis for an order
adminDevisRouter.post('/api/admin/order/create-devis', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/commandes?error=DB indisponible')

  const body = await c.req.parseBody()
  const orderId = parseInt(body['order_id'] as string || '0')
  if (!orderId) return c.redirect('/admin/commandes?error=Données manquantes')

  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any
  if (!order) return c.redirect('/admin/commandes?error=Commande introuvable')

  const now = new Date().toISOString()

  // Parse new structured fields
  const climatiseurNom = sanitizeText(body['climatiseur_nom'], 200) || null
  const climatiseurPrix = parseInt(body['climatiseur_prix'] as string || '0') || 0
  const mainOeuvrePrix = parseInt(body['main_oeuvre_prix'] as string || '50000') || 0
  const motif = sanitizeText(body['motif'], 500) || null
  const messageClient = sanitizeText(body['message_client'], 2000) || null

  // Build fournitures JSON from dynamic d_acc_nom_N / d_acc_prix_N fields
  const fournitures: Array<{nom: string; prix: number}> = []
  for (let i = 1; i <= 20; i++) {
    const nom = sanitizeText(body[`d_acc_nom_${i}`], 200)
    const prix = parseInt(body[`d_acc_prix_${i}`] as string || '0') || 0
    if (nom) fournitures.push({ nom, prix })
  }
  const accTotal = fournitures.reduce((s, a) => s + a.prix, 0)

  // Compute total
  const totalAmount = climatiseurPrix + mainOeuvrePrix + accTotal

  // Build legacy title/description for backward compat
  const title = "Devis d'installation"

  try {
    await db.prepare(
      `INSERT INTO order_devis (order_id, client_id, client_name, client_phone, client_email, title, description, items, total_amount, status, climatiseur_nom, climatiseur_prix, main_oeuvre_prix, fournitures, motif, message_client, admin_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, '', '[]', ?, 'sent', ?, ?, ?, ?, ?, ?, '', ?, ?)`
    ).bind(
      orderId,
      order.client_id || null,
      order.client_name,
      order.client_phone,
      order.client_email || '',
      title,
      totalAmount,
      climatiseurNom,
      climatiseurPrix,
      mainOeuvrePrix,
      JSON.stringify(fournitures),
      motif,
      messageClient,
      now, now
    ).run()

    // Devis envoyé au client : la commande passe à « contacte » (le suivi fin du
    // devis vit dans order_devis.status — 'devis_en_attente' n'existe plus depuis 0036)
    await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .bind('contacte', now, orderId).run()
    const memOrder = orders.find(o => o.id === orderId)
    if (memOrder) memOrder.status = 'contacte' as any

    // Email notification if client has email
    if (order.client_email) {
      try {
        const brevoKey = c.env.BREVO_API_KEY
        if (brevoKey) {
          const climLine = climatiseurNom ? `<tr><td>Climatiseur</td><td>${escapeHtml(climatiseurNom)}</td><td style="text-align:right">${climatiseurPrix.toLocaleString()} FCFA</td></tr>` : ''
          const mdoLine = mainOeuvrePrix > 0 ? `<tr><td>Main d'œuvre / Installation</td><td></td><td style="text-align:right">${mainOeuvrePrix.toLocaleString()} FCFA</td></tr>` : ''
          const fLines = fournitures.map(f => `<tr><td>${f.nom}</td><td></td><td style="text-align:right">${f.prix.toLocaleString()} FCFA</td></tr>`).join('')
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
              to: [{ email: order.client_email, name: order.client_name }],
              subject: `Devis d'installation — Commande #${orderId} — MAASGA`,
              htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;">
                <h2 style="color:#d97706;">❄ Devis d'installation disponible</h2>
                <p>Bonjour ${order.client_name},</p>
                <p>Un devis d'installation a été préparé pour votre commande #${orderId}.</p>
                ${motif ? `<p><strong>Motif :</strong> ${escapeHtml(motif)}</p>` : ''}
                ${messageClient ? `<p style="background:#f0f9ff;border-left:4px solid #0284c7;padding:12px;">${escapeHtml(messageClient)}</p>` : ''}
                <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">${climLine}${mdoLine}${fLines}
                  <tr style="border-top:2px solid #e5e7eb;"><td colspan="2" style="padding-top:8px;font-weight:700;">TOTAL</td><td style="text-align:right;font-weight:800;color:#d97706;font-size:18px;">${totalAmount.toLocaleString()} FCFA</td></tr>
                </table>
                <p>Connectez-vous à votre espace client pour valider ou refuser ce devis :</p>
                <p><a href="https://maasga.com/espace-client" style="display:inline-block;background:#d97706;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Voir et valider le devis</a></p>
                <p style="color:#6b7280;font-size:12px;">MAASGA SARL — Solutions Climatisation & Maintenance — Ouagadougou, Burkina Faso</p>
              </body></html>`
            })
          })
        }
      } catch(emailErr) { console.error('Erreur envoi email devis:', emailErr) }
    }

    await notifyAdmin(c.env, 'order', `Devis d'installation créé — Commande #${orderId} — ${order.client_name} (${order.client_phone}) — ${totalAmount.toLocaleString()} FCFA`)

    return c.redirect('/admin/commandes?success=devis_created')
  } catch(e: any) {
    console.error('Create order devis error:', e)
    const errMsg = encodeURIComponent(String(e?.message || 'Erreur lors de la création du devis').substring(0, 150))
    return c.redirect(`/admin/commandes?error=${errMsg}`)
  }
})

// ============================================================
// DEVIS ROUTES — ADMIN
// ============================================================

adminDevisRouter.get('/admin/devis', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let devisData: any[] = []
  if (db) {
    try {
      await ensureDevisTable(db)
      const rows = await db.prepare('SELECT * FROM devis ORDER BY created_at DESC').all()
      devisData = (rows.results as any[]) || []
    } catch(e) { console.error('Devis list error:', e) }
  }
  // RDVs de type 'devis' sans devis associé
  const devisRdvIds = new Set(devisData.filter(d => d.rdv_id).map(d => d.rdv_id))
  const rdvsPending = appointments.filter((a: any) => a.type === 'devis' && !devisRdvIds.has(a.id))
  return c.html(<AdminDevisListPage devisData={devisData} rdvsPending={rdvsPending} />)
})

adminDevisRouter.get('/admin/devis/new', adminAuth, refreshAdminCache, async (c) => {
  const rdvId = parseInt(c.req.query('rdvId') || '0')
  const orderId = parseInt(c.req.query('order_id') || '0')
  const ticketId = parseInt(c.req.query('ticket_id') || '0')
  const contractId = parseInt(c.req.query('contract_id') || '0')
  const clientId = parseInt(c.req.query('client_id') || '0')
  const rdv = rdvId ? appointments.find((a: any) => a.id === rdvId) : null
  const order = orderId ? orders.find((o: any) => o.id === orderId) : null
  const db = c.env.DB
  let ticket: any = null, contract: any = null, clientData: any = null
  if (db) {
    const [t, con, cl] = await Promise.all([
      ticketId ? db.prepare('SELECT * FROM sav_tickets WHERE id=?').bind(ticketId).first() : Promise.resolve(null),
      contractId ? db.prepare('SELECT * FROM maintenance_contracts WHERE id=?').bind(contractId).first() : Promise.resolve(null),
      clientId ? db.prepare('SELECT * FROM clients WHERE id=?').bind(clientId).first() : Promise.resolve(null),
    ])
    ticket = t; contract = con; clientData = cl
  }
  let surface = c.req.query('surface') || ''
  let btu = c.req.query('btu') || ''
  if (rdv?.notes && (!surface || !btu)) {
    const surfMatch = rdv.notes.match(/(\d+(?:\.\d+)?)\s*m²/)
    const btuMatch = rdv.notes.match(/(\d{4,5})\s*BTU/)
    if (surfMatch && !surface) surface = surfMatch[1]
    if (btuMatch && !btu) btu = btuMatch[1]
  }
  const effectiveRdv = rdv || (order ? { id: null, name: order.client_name, phone: order.client_phone, quartier: order.quartier, notes: order.notes, type: order.type } : null)
  const errorMsg = c.req.query('error') || undefined
  return c.html(<AdminDevisNewPage rdv={effectiveRdv} productsList={products} clientsList={clients} surface={surface} btu={btu} orderId={orderId || undefined} ticket={ticket} contract={contract} clientData={clientData} error={errorMsg} />)
})

adminDevisRouter.post('/api/admin/devis/create', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const db = c.env.DB
  if (!db) return c.redirect('/admin/devis?error=no_db')
  try {
    await ensureDevisTable(db)
    const token = generateDevisToken()
    const numero = await generateDevisNumber(db)
    const rdvId = body['rdv_id'] ? parseInt(body['rdv_id'] as string) : null
    const orderId = body['order_id'] ? parseInt(body['order_id'] as string) : null
    const action = (body['action'] as string) || 'draft'
    const isSendAction = action === 'send' || action === 'send_whatsapp' || action === 'send_email'

    // Build accessories JSON (dynamic numbering from form)
    const accs: any[] = []
    for (let i = 1; i <= 20; i++) {
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
    const status = isSendAction ? 'sent' : 'draft'

    // Build notes_internes: prepend origine/urgence context if provided
    let notesInternes = (body['notes_internes'] as string || '').trim()
    const origine = (body['origine'] as string || '').trim()
    const urgence = (body['urgence'] as string || '').trim()
    const origineLabels: Record<string, string> = { appel: 'Appel entrant', visite: 'Visite physique', recommandation: 'Recommandation', reseaux: 'Réseaux sociaux', publicite: 'Publicité', bouche_a_oreille: 'Bouche-à-oreille' }
    const urgenceLabels: Record<string, string> = { urgent: '⚡ Urgent', tres_urgent: '🔴 Très urgent' }
    const ctxParts: string[] = []
    if (origine && origineLabels[origine]) ctxParts.push(`Origine: ${origineLabels[origine]}`)
    if (urgence && urgenceLabels[urgence]) ctxParts.push(urgenceLabels[urgence])
    if (ctxParts.length) notesInternes = ctxParts.join(' | ') + (notesInternes ? '\n' + notesInternes : '')

    await db.prepare(`INSERT INTO devis (rdv_id,order_id,numero,client_name,client_phone,client_email,client_quartier,surface,btu_recommande,produit_nom,produit_prix,produit_quantite,installation_prix,accessoires,remise,total_ht,message_client,notes_internes,token,status,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(rdvId, orderId, numero, body['client_name'], body['client_phone'], body['client_email'] || null, body['client_quartier'] || null, body['surface'] ? parseFloat(body['surface'] as string) : null, body['btu_recommande'] ? parseInt(body['btu_recommande'] as string) : null, body['produit_nom'] || null, prodPrix, prodQty, installPrix, JSON.stringify(accs), remise, totalHt, body['message_client'] || null, notesInternes || null, token, status, expiresAt, now, now)
      .run()

    // If linked to an order, always sync to order_devis so client can see it in their portal
    // Draft → 'pending' status in order_devis (visible but client can act); Sent → 'sent'
    if (orderId) {
      const linkedOrder = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any
      if (linkedOrder) {
        const orderDevisStatus = isSendAction ? 'sent' : 'pending'
        // Upsert: if already exists update it, otherwise insert
        const existing = await db.prepare(`SELECT id FROM order_devis WHERE order_id = ? AND status NOT IN ('validated','refused') ORDER BY id DESC`).bind(orderId).first() as any
        if (existing) {
          await db.prepare(`UPDATE order_devis SET client_name=?,client_phone=?,client_email=?,total_amount=?,status=?,climatiseur_nom=?,climatiseur_prix=?,main_oeuvre_prix=?,fournitures=?,message_client=?,updated_at=? WHERE id=?`)
            .bind(
              String(body['client_name'] || linkedOrder.client_name),
              String(body['client_phone'] || linkedOrder.client_phone),
              String(body['client_email'] || linkedOrder.client_email || ''),
              totalHt,
              orderDevisStatus,
              body['produit_nom'] || null,
              prodPrix * prodQty,
              installPrix,
              JSON.stringify(accs),
              body['message_client'] || null,
              now,
              existing.id
            ).run()
        } else {
          // No existing order_devis — insert fresh
          await db.prepare(`INSERT INTO order_devis (order_id, client_id, client_name, client_phone, client_email, title, description, items, total_amount, status, climatiseur_nom, climatiseur_prix, main_oeuvre_prix, fournitures, motif, message_client, admin_notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, '', '[]', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(
              orderId,
              linkedOrder.client_id || null,
              String(body['client_name'] || linkedOrder.client_name),
              String(body['client_phone'] || linkedOrder.client_phone),
              String(body['client_email'] || linkedOrder.client_email || ''),
              "Devis d'installation",
              totalHt,
              orderDevisStatus,
              body['produit_nom'] || null,
              prodPrix * prodQty,
              installPrix,
              JSON.stringify(accs),
              null,
              body['message_client'] || null,
              notesInternes || null,
              now, now
            ).run()
        }
        // Envoi effectif du devis : la commande passe à « contacte »
        // ('devis_en_attente' n'existe plus dans le CHECK depuis la migration 0036)
        if (isSendAction) {
          await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
            .bind('contacte', now, orderId).run()
          const memOrder = orders.find(o => o.id === orderId)
          if (memOrder) memOrder.status = 'contacte' as any
          // Email client notification on send
          if (linkedOrder.client_email) {
            try {
              const brevoKey = c.env.BREVO_API_KEY
              if (brevoKey) {
                await fetch('https://api.brevo.com/v3/smtp/email', {
                  method: 'POST',
                  headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
                    to: [{ email: linkedOrder.client_email, name: linkedOrder.client_name }],
                    subject: `Devis d'installation disponible — Commande #${orderId} — MAASGA`,
                    htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;"><h2 style="color:#d97706;">❄ Devis d'installation disponible</h2><p>Bonjour ${escapeHtml(linkedOrder.client_name)},</p><p>Un devis d'installation a été préparé pour votre commande #${orderId}. Connectez-vous à votre espace client pour le consulter et le valider :</p><p><a href="https://maasga.com/espace-client" style="display:inline-block;background:#d97706;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Voir et valider le devis</a></p><p style="color:#6b7280;font-size:12px;">MAASGA SARL — Solutions Climatisation & Maintenance — Ouagadougou, Burkina Faso</p></body></html>`
                  })
                })
              }
            } catch(emailErr) { console.error('Email notification error:', emailErr) }
          }
          await notifyAdmin(c.env, 'order', `Devis d'installation envoyé — Commande #${orderId} — ${linkedOrder.client_name} — ${totalHt.toLocaleString()} FCFA`)
        }
      }
    }

    // Handle send_email — send via Brevo
    let emailOk = false, emailErrMsg = ''
    if (action === 'send_email') {
      const clientEmail = (body['client_email'] as string || '').trim()
      if (!clientEmail) {
        emailErrMsg = 'Email client non renseigné dans le formulaire'
      } else {
        const brevoKey = c.env.BREVO_API_KEY
        if (!brevoKey) {
          emailErrMsg = 'Service email non configuré'
        } else {
          try {
            const publicUrl = `https://maasga.com/devis/${token}`
            const prodRow = (body['produit_nom'] as string || '').trim()
              ? `<tr><td style="padding:8px 12px;">${escapeHtml(body['produit_nom'] as string)} × ${prodQty}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${(prodPrix * prodQty).toLocaleString('fr-FR')} FCFA</td></tr>` : ''
            const installRow = installPrix > 0
              ? `<tr><td style="padding:8px 12px;">Main d'œuvre / Installation</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${installPrix.toLocaleString('fr-FR')} FCFA</td></tr>` : ''
            const accRows = accs.map((a: any) => `<tr><td style="padding:8px 12px;">${escapeHtml(a.nom)}</td><td style="padding:8px 12px;text-align:right;">${Number(a.prix || 0).toLocaleString('fr-FR')} FCFA</td></tr>`).join('')
            const msgBlock = (body['message_client'] as string || '').trim()
              ? `<p style="background:var(--surface-info);border-left:4px solid var(--line-brand);padding:14px;margin:20px 0;border-radius:0 8px 8px 0;">${escapeHtml(body['message_client'] as string)}</p>` : ''
            const emailResp = await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
                to: [{ email: clientEmail, name: (body['client_name'] as string) || 'Client' }],
                subject: `Votre devis MAASGA — ${numero}`,
                htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;color:#1a1a2e;">
                  <h2 style="color:#0077b6;border-bottom:2px solid #e2e8f0;padding-bottom:16px;">Devis ${escapeHtml(numero)}</h2>
                  <p>Bonjour <strong>${escapeHtml((body['client_name'] as string) || '')}</strong>,</p>
                  <p>MAASGA vous a préparé un devis personnalisé.</p>
                  ${msgBlock}
                  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;border:1px solid #e2e8f0;">
                    <thead><tr style="background:#0077b6;color:white;"><th style="padding:10px 12px;text-align:left;">Désignation</th><th style="padding:10px 12px;text-align:right;">Montant</th></tr></thead>
                    <tbody>${prodRow}${installRow}${accRows}
                      <tr style="border-top:2px solid #0077b6;"><td style="padding:12px;font-weight:700;font-size:15px;">Total HT</td><td style="padding:12px;text-align:right;font-weight:800;color:#0077b6;font-size:18px;">${totalHt.toLocaleString('fr-FR')} FCFA</td></tr>
                    </tbody>
                  </table>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${publicUrl}" style="display:inline-block;background:#0077b6;color:white;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;">Consulter et valider le devis</a>
                  </div>
                  <p style="color:#6b7280;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;">MAASGA SARL — Froid & Climatisation — Ouagadougou, Burkina Faso — +226 55 99 64 18</p>
                </body></html>`
              })
            })
            emailOk = emailResp.ok
            if (!emailResp.ok) emailErrMsg = `Erreur envoi (${emailResp.status})`
          } catch(emailEx: any) {
            console.error('send_email devis error:', emailEx)
            emailErrMsg = "Erreur lors de l'envoi de l'email"
          }
        }
      }
    }

    // Redirect based on action
    if (action === 'draft') return c.redirect('/admin/devis')
    if (action === 'send_email') {
      if (emailOk) return c.redirect(`/admin/devis/detail/${token}?email=ok`)
      if (emailErrMsg) return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent(emailErrMsg)}`)
      return c.redirect(`/admin/devis/detail/${token}`)
    }
    if (action === 'send_whatsapp') return c.redirect(`/admin/devis/detail/${token}?notify=whatsapp`)
    // generate, send (legacy), default → show detail page
    return c.redirect(`/admin/devis/detail/${token}`)
  } catch(e: any) {
    console.error('Devis create error:', e)
    const errMsg = encodeURIComponent(String(e?.message || 'Erreur lors de la création du devis').substring(0, 150))
    const oidParam = body['order_id'] ? `&order_id=${body['order_id']}` : ''
    return c.redirect(`/admin/devis/new?error=${errMsg}${oidParam}`)
  }
})

// ============================================================
// DEVIS DETAIL — Admin view of a single devis with share/send options
// ============================================================
adminDevisRouter.get('/admin/devis/detail/:token', adminAuth, async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (!db) return c.redirect('/admin/devis?error=no_db')
  try {
    await ensureDevisTable(db)
    const devis = await db.prepare('SELECT * FROM devis WHERE token = ?').bind(token).first() as any
    if (!devis) return c.redirect('/admin/devis?error=Devis+introuvable')
    const host = c.req.header('host') || 'maasga.com'
    const publicUrl = `https://${host}/devis/${token}`
    const notify = c.req.query('notify') || ''
    const emailOk = c.req.query('email') === 'ok'
    const emailErr = c.req.query('email_err') ? decodeURIComponent(c.req.query('email_err') || '') : undefined
    return c.html(<AdminDevisDetailPage devis={devis} publicUrl={publicUrl} notify={notify} emailOk={emailOk} emailErr={emailErr} />)
  } catch(e: any) {
    console.error('Devis detail error:', e)
    return c.redirect(`/admin/devis?error=${encodeURIComponent(String(e?.message || 'Erreur').substring(0, 100))}`)
  }
})

// ============================================================
// DEVIS SEND EMAIL — Sends devis email from the detail page
// ============================================================
adminDevisRouter.post('/api/admin/devis/send-email', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const db = c.env.DB
  const token = (body['token'] as string || '').trim()
  if (!db || !token) return c.redirect('/admin/devis?error=Paramètres manquants')
  try {
    await ensureDevisTable(db)
    const devis = await db.prepare('SELECT * FROM devis WHERE token = ?').bind(token).first() as any
    if (!devis) return c.redirect(`/admin/devis?error=Devis introuvable`)
    if (!devis.client_email) return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent('Email client non renseigné')}`)
    const brevoKey = c.env.BREVO_API_KEY
    if (!brevoKey) return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent('Service email non configuré')}`)

    const host = c.req.header('host') || 'maasga.com'
    const publicUrl = `https://${host}/devis/${token}`
    const accs: any[] = JSON.parse(devis.accessoires || '[]')
    const prodTotal = Number(devis.produit_prix || 0) * Number(devis.produit_quantite || 1)
    const prodRow = devis.produit_nom ? `<tr><td style="padding:8px 12px;">${escapeHtml(devis.produit_nom)} × ${Number(devis.produit_quantite) || 1}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${prodTotal.toLocaleString('fr-FR')} FCFA</td></tr>` : ''
    const installRow = Number(devis.installation_prix) > 0 ? `<tr><td style="padding:8px 12px;">Main d'œuvre / Installation</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${Number(devis.installation_prix).toLocaleString('fr-FR')} FCFA</td></tr>` : ''
    const accRows = accs.filter((a: any) => a.nom).map((a: any) => `<tr><td style="padding:8px 12px;">${escapeHtml(a.nom)}</td><td style="padding:8px 12px;text-align:right;">${Number(a.prix || 0).toLocaleString('fr-FR')} FCFA</td></tr>`).join('')
    const msgBlock = devis.message_client ? `<p style="background:var(--surface-info);border-left:4px solid var(--line-brand);padding:14px;margin:20px 0;border-radius:0 8px 8px 0;">${escapeHtml(devis.message_client)}</p>` : ''

    const emailResp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
        to: [{ email: devis.client_email, name: devis.client_name }],
        subject: `Votre devis MAASGA — ${devis.numero}`,
        htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;color:#1a1a2e;">
          <h2 style="color:#0077b6;border-bottom:2px solid #e2e8f0;padding-bottom:16px;">Devis ${escapeHtml(devis.numero)}</h2>
          <p>Bonjour <strong>${escapeHtml(devis.client_name)}</strong>,</p>
          <p>MAASGA vous a préparé un devis personnalisé.</p>
          ${msgBlock}
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;border:1px solid #e2e8f0;">
            <thead><tr style="background:#0077b6;color:white;"><th style="padding:10px 12px;text-align:left;">Désignation</th><th style="padding:10px 12px;text-align:right;">Montant</th></tr></thead>
            <tbody>${prodRow}${installRow}${accRows}
              <tr style="border-top:2px solid #0077b6;"><td style="padding:12px;font-weight:700;font-size:15px;">Total HT</td><td style="padding:12px;text-align:right;font-weight:800;color:#0077b6;font-size:18px;">${Number(devis.total_ht || 0).toLocaleString('fr-FR')} FCFA</td></tr>
            </tbody>
          </table>
          <div style="text-align:center;margin:24px 0;">
            <a href="${publicUrl}" style="display:inline-block;background:#0077b6;color:white;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;">Consulter et valider le devis</a>
          </div>
          <p style="color:#6b7280;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;">MAASGA SARL — Froid & Climatisation — Ouagadougou, Burkina Faso — +226 55 99 64 18</p>
        </body></html>`
      })
    })
    if (!emailResp.ok) {
      const errTxt = await emailResp.text().catch(() => '')
      console.error('Send devis email failed:', emailResp.status, errTxt)
      return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent('Erreur envoi (' + emailResp.status + ')')}`)
    }
    // Mark as sent if was draft
    if (devis.status === 'draft') {
      await db.prepare('UPDATE devis SET status=?, updated_at=? WHERE token=?').bind('sent', new Date().toISOString(), token).run()
    }
    return c.redirect(`/admin/devis/detail/${token}?email=ok`)
  } catch(e: any) {
    console.error('Devis send-email error:', e)
    return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent(String(e?.message || 'Erreur').substring(0, 100))}`)
  }
})

// ============================================================
// DEVIS PREVIEW — Returns PDF HTML without saving to DB
// ============================================================
adminDevisRouter.post('/api/admin/devis/preview', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  try {
    // Build accessories JSON
    const accs: any[] = []
    for (let i = 1; i <= 20; i++) {
      const nom = (body[`acc_nom_${i}`] as string || '').trim()
      const prix = parseInt(body[`acc_prix_${i}`] as string) || 0
      if (nom) accs.push({ nom, prix })
    }

    const prodPrix = parseInt(body['produit_prix'] as string) || 0
    const prodQty = parseInt(body['produit_quantite'] as string) || 1
    const installPrix = parseInt(body['installation_prix'] as string) || 0
    const remise = parseInt(body['remise'] as string) || 0
    const accTotal = accs.reduce((s: number, a: any) => s + a.prix, 0)
    const sousTotal = (prodPrix * prodQty) + installPrix + accTotal
    const totalHt = sousTotal - Math.round(sousTotal * remise / 100)
    const expiresAt = (body['expires_at'] as string) || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

    // Build a fake devis object for the PDF builder
    const fakeDev = {
      numero: 'DEV-PREVIEW',
      client_name: body['client_name'] || 'Client',
      client_phone: body['client_phone'] || '',
      client_email: body['client_email'] || null,
      client_quartier: body['client_quartier'] || null,
      surface: body['surface'] ? parseFloat(body['surface'] as string) : null,
      btu_recommande: body['btu_recommande'] ? parseInt(body['btu_recommande'] as string) : null,
      produit_nom: body['produit_nom'] || null,
      produit_prix: prodPrix,
      produit_quantite: prodQty,
      installation_prix: installPrix,
      accessoires: JSON.stringify(accs),
      remise,
      total_ht: totalHt,
      message_client: body['message_client'] || null,
      notes_internes: null,
      token: 'preview',
      status: 'draft',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      accepted_at: null
    }
    const html = buildDevisPDF(fakeDev)
    return c.html(html)
  } catch(e: any) {
    return c.text('Erreur preview: ' + e.message, 500)
  }
})

adminDevisRouter.post('/api/admin/devis/accept', adminAuth, async (c) => {
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

adminDevisRouter.post('/api/admin/devis/delete', adminAuth, async (c) => {
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

adminDevisRouter.get('/devis/:token', async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (!db) return c.html('<h1>Erreur: base de données indisponible</h1>', 500)
  try {
    await ensureDevisTable(db)
    const devis = await db.prepare('SELECT * FROM devis WHERE token = ?').bind(token).first() as any
    if (!devis) return c.html('<html><body class="text-fg-on-dark text-center py-[80px] px-[20px]" style="background:#0b1120; font-family:sans-serif;"><h1>Devis introuvable</h1><p class="text-fg-gray">Ce lien est invalide ou expiré.</p><br><a href="/" class="text-fg-on-dark-accent">← MAASGA</a></body></html>', 404)
    return c.html(buildClientDevisHTML(devis as any))
  } catch(e) {
    console.error('Devis view error:', e)
    return c.html('<html><body class="text-fg-on-dark text-center py-[80px] px-[20px]" style="background:#0b1120; font-family:sans-serif;"><h1>Erreur</h1><p>Impossible de charger ce devis.</p></body></html>', 500)
  }
})

adminDevisRouter.post('/api/devis/:token/accept', async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare("UPDATE devis SET status='accepted', accepted_at=?, updated_at=? WHERE token=? AND status='sent'").bind(new Date().toISOString(), new Date().toISOString(), token).run()
    } catch(e) { console.error('Devis accept error:', e) }
  }
  return c.redirect(`/devis/${token}`)
})

// ============================================================
// DEVIS PDF — Version imprimable avec logo, infos entreprise & client
// ============================================================
adminDevisRouter.get('/devis/:token/pdf', async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (!db) return c.text('Base de données indisponible', 500)
  try {
    await ensureDevisTable(db)
    const d = await db.prepare('SELECT * FROM devis WHERE token = ?').bind(token).first() as any
    if (!d) return c.text('Devis introuvable', 404)
    return c.html(buildDevisPDF(d))
  } catch(e) {
    console.error('Devis PDF error:', e)
    return c.text('Erreur lors de la génération du PDF', 500)
  }
})

// API Génération devis PDF (simulation)
adminDevisRouter.get('/api/devis/:rdvId', adminAuth, (c) => {
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
        .footer { margin-top: 40px; font-maasgabf@gmail.com | +226 55 99 64 18gn: center; }
      </style>
    </head><body>
      <div class="header">
        <div class="title">❄️ MAASGA - Devis Technique</div>
        <div class="subtitle">Froid & Climatisation · Ouagadougou, Burkina Faso</div>
      </div>
      <h2>Devis N° DEV-${rdvId.toString().padStart(4,'0')}-${new Date().getFullYear()}</h2>
      <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
      <p><strong>Client :</strong> ${escapeHtml(rdv.name || '')}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(rdv.phone || '')}</p>
      <p><strong>Quartier :</strong> ${escapeHtml(rdv.quartier || '')}</p>
      <p><strong>Type :</strong> ${{ devis: 'Dimensionnement / Devis', installation: 'Installation', entretien: 'Entretien / Maintenance', depannage: 'Dépannage / Réparation urgente' }[rdv.type as string] || rdv.type}</p>
      ${rdv.notes ? `<p><strong>Notes :</strong> ${escapeHtml(rdv.notes || '')}</p>` : ''}
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
        MAASGA - Froid & Climatisation | maasgabf@gmail.com | +226 55 99 64 18<br/>
        Ouagadougou, Burkina Faso | Techniciens certifiés
      </div>
    </body></html>
  `
  return c.html(html)
})
