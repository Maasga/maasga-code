// Session and Client Security Service for MAASGA
import { escapeHtml } from '../utils/helpers'

export const SESSION_TTL_MS = 86400000 // 24h
export const SESSION_CACHE_MAX_SIZE = 500
export const EMAIL_VERIFY_TTL = 24 * 60 * 60 * 1000 // 24h
export const CLIENT_RESET_CODE_MAX_AGE = 15 * 60 * 1000 // 15 minutes

const sessionCache = new Map<string, { clientId: number; createdAt: number }>()
export const clientResetCodes = new Map<string, { code: string; phone: string; email: string; createdAt: number; used: boolean }>()

// Helper : hachage mot de passe sécurisé (PBKDF2 avec salt unique par utilisateur)
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder()
  if (!salt) {
    const saltBytes = new Uint8Array(16)
    crypto.getRandomValues(saltBytes)
    salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  const hash = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${salt}:${hash}`
}

// Vérifier un mot de passe contre un hash stocké (supporte ancien SHA-256 + nouveau PBKDF2)
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':')
    if (parts.length !== 3) return false
    const salt = parts[1]
    const rehashed = await hashPassword(password, salt)
    return rehashed === storedHash
  }
  // Rétrocompatibilité : ancien format SHA-256 simple (migration automatique au login)
  console.warn('Legacy SHA-256 password verification attempt — will auto-migrate to PBKDF2')
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'maasga_salt_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const legacyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return legacyHash === storedHash
}

// Générer un token de session sécurisé (non devinable)
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function ensureSessionTable(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS client_sessions (
      token TEXT PRIMARY KEY,
      client_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`).run()
  } catch (_) {}
}

export async function setSession(db: any, token: string, clientId: number) {
  const now = Date.now()
  if (sessionCache.size >= SESSION_CACHE_MAX_SIZE) {
    let oldest: string | null = null, oldestTime = Infinity
    for (const [k, v] of sessionCache) {
      if (v.createdAt < oldestTime) { oldest = k; oldestTime = v.createdAt }
    }
    if (oldest) sessionCache.delete(oldest)
  }
  sessionCache.set(token, { clientId, createdAt: now })
  if (db) {
    try {
      await ensureSessionTable(db)
      await db.prepare('INSERT OR REPLACE INTO client_sessions (token, client_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .bind(token, clientId, now, now + SESSION_TTL_MS).run()
    } catch (_) {}
  }
}

export async function getSession(db: any, token: string): Promise<{ clientId: number; createdAt: number } | null> {
  const cached = sessionCache.get(token)
  if (cached) {
    if (Date.now() - cached.createdAt < SESSION_TTL_MS) return cached
    sessionCache.delete(token)
  }
  if (db) {
    try {
      await ensureSessionTable(db)
      if (Math.random() < 0.01) {
        await db.prepare('DELETE FROM client_sessions WHERE expires_at < ?').bind(Date.now()).run()
      }
      const row = await db.prepare('SELECT client_id, created_at FROM client_sessions WHERE token = ? AND expires_at > ?')
        .bind(token, Date.now()).first() as any
      if (row) {
        const session = { clientId: row.client_id, createdAt: row.created_at }
        sessionCache.set(token, session)
        return session
      }
    } catch (_) {}
  }
  return null
}

export async function deleteSession(db: any, token: string) {
  sessionCache.delete(token)
  if (db) {
    try {
      await ensureSessionTable(db)
      await db.prepare('DELETE FROM client_sessions WHERE token = ?').bind(token).run()
    } catch (_) {}
  }
}

export async function ensureEmailVerificationTable(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`).run()
  } catch (_) {}
}

export function generateEmailToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function sendVerificationEmail(env: any, toEmail: string, toName: string, verifyUrl: string): Promise<boolean> {
  const apiKey = env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('[EMAIL] BREVO_API_KEY not configured — skipping verification email')
    return false
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
        to: [{ email: toEmail, name: toName }],
        subject: 'Vérifiez votre email — MAASGA',
        htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#03045e,#0077b6);padding:32px;text-align:center;">
    <div style="font-size:28px;font-weight:800;color:white;">MAASGA &#10052;</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Froid &amp; Climatisation</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;font-weight:700;color:#03045e;margin:0 0 16px;">Bonjour ${escapeHtml(toName)} !</h2>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Merci de votre inscription. Pour activer votre espace client MAASGA, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:linear-gradient(135deg,#03045e,#0077b6);color:white;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">
        Vérifier mon email
      </a>
    </div>
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;">
      Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte sur MAASGA, ignorez cet email.
    </p>
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
      MAASGA — Froid &amp; Climatisation - Ouagadougou, Burkina Faso<br>
      Tel: +226 55 99 64 18 - maasgabf@gmail.com
    </div>
  </div>
</div>
</body></html>`
      })
    })

    return res.ok
  } catch (e) {
    console.error('[EMAIL] Brevo send error:', e)
    return false
  }
}

export async function sendPasswordResetEmail(env: any, toEmail: string, toName: string, code: string): Promise<boolean> {
  const apiKey = env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('[EMAIL] BREVO_API_KEY not configured — cannot send reset email')
    return false
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
        to: [{ email: toEmail, name: toName }],
        subject: 'Code de réinitialisation — MAASGA',
        htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#03045e,#0077b6);padding:32px;text-align:center;">
    <div style="font-size:28px;font-weight:800;color:white;">MAASGA &#10052;</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Froid &amp; Climatisation</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;font-weight:700;color:#03045e;margin:0 0 16px;">Réinitialisation de mot de passe</h2>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 8px;">
      Bonjour ${escapeHtml(toName || 'Client')} !
    </p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de vérification :
    </p>
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,#03045e,#0077b6);color:white;font-weight:800;font-size:32px;padding:16px 40px;border-radius:16px;letter-spacing:0.3em;">
        ${escapeHtml(code)}
      </div>
    </div>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 8px;">
      Ce code expire dans <strong>15 minutes</strong>.
    </p>
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;">
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe ne sera pas modifié.
    </p>
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
      MAASGA — Froid &amp; Climatisation - Ouagadougou, Burkina Faso<br>
      Tel: +226 55 99 64 18 - maasgabf@gmail.com
    </div>
  </div>
</div>
</body></html>`
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[EMAIL] Brevo reset email failed:', res.status, errText)
    }
    return res.ok
  } catch (e) {
    console.error('[EMAIL] Brevo reset email error:', e)
    return false
  }
}

export async function ensureResetCodesTable(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS password_reset_codes (token TEXT PRIMARY KEY, code TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0)`).run()
    try { await db.prepare(`ALTER TABLE password_reset_codes ADD COLUMN email TEXT NOT NULL DEFAULT ''`).run() } catch (_) { /* already exists */ }
  } catch (_) {}
}
