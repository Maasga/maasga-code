import { describe, it, expect, beforeEach } from 'vitest'
import { clientRouter } from '../routes/client/index'

// Fausse D1 minimale : table password_reset_codes + capture des UPDATE clients.
// Toute autre requête lève une erreur (rateLimitD1 retombe alors sur le limiteur mémoire).
function makeFakeDb() {
  const codes = new Map<string, any>()
  const passwordUpdates: any[] = []
  const db = {
    codes,
    passwordUpdates,
    prepare(sql: string) {
      let args: any[] = []
      const stmt = {
        bind(...a: any[]) { args = a; return stmt },
        async first() {
          if (/SELECT code, phone, email, created_at, used FROM password_reset_codes/.test(sql)) {
            return codes.get(args[0]) ?? null
          }
          throw new Error('unsupported: ' + sql)
        },
        async run() {
          if (/^\s*(CREATE TABLE|ALTER TABLE) password_reset_codes/.test(sql)) return {}
          if (/INSERT OR REPLACE INTO password_reset_codes/.test(sql)) {
            const [token, code, phone, email, created_at] = args
            codes.set(token, { code, phone, email, created_at, used: 0 })
            return {}
          }
          if (/UPDATE password_reset_codes SET used = 1/.test(sql)) {
            const row = codes.get(args[0]); if (row) row.used = 1
            return {}
          }
          if (/DELETE FROM password_reset_codes/.test(sql)) return {}
          if (/UPDATE clients SET password_hash/.test(sql)) { passwordUpdates.push(args); return {} }
          throw new Error('unsupported: ' + sql)
        },
      }
      return stmt
    },
  }
  return db
}

function form(data: Record<string, string>) {
  return { method: 'POST', body: new URLSearchParams(data), headers: { 'content-type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': '10.0.0.' + Math.floor(Math.random() * 250) } }
}

let db: ReturnType<typeof makeFakeDb>
let tokenSeq = 0
function seedToken(code = '12345678') {
  const token = 'tok' + (++tokenSeq) + Date.now()
  db.codes.set(token, { code, phone: '+22670000000', email: '', created_at: Date.now(), used: 0 })
  return token
}
const env = () => ({ DB: db } as any)
const goodPwd = { new_password: 'NouveauMdp123', confirm_password: 'NouveauMdp123' }

describe('Reset mot de passe client (sécurité)', () => {
  beforeEach(() => { db = makeFakeDb() })

  it('REFUSE le reset avec le token initial sans avoir vérifié le code', async () => {
    const token = seedToken()
    const res = await clientRouter.request('/api/client/reset-password', form({ token, ...goodPwd }), env())
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toContain('error=')
    expect(db.passwordUpdates).toHaveLength(0)
  })

  it('refuse un code incorrect', async () => {
    const token = seedToken()
    const res = await clientRouter.request('/api/client/verify-reset-code', form({ token, code: '00000000' }), env())
    expect(res.headers.get('location')).toContain('Code%20incorrect')
  })

  it('parcours complet : code correct → nouveau token vérifié → reset OK', async () => {
    const token = seedToken('87654321')
    const v = await clientRouter.request('/api/client/verify-reset-code', form({ token, code: '87654321' }), env())
    const loc = v.headers.get('location') || ''
    expect(loc).toContain('step=newpwd')
    const verifiedToken = new URL(loc, 'http://x').searchParams.get('token')!
    expect(verifiedToken).not.toBe(token)
    // l'ancien token est invalidé
    expect(db.codes.get(token).used).toBe(1)

    const r = await clientRouter.request('/api/client/reset-password', form({ token: verifiedToken, ...goodPwd }), env())
    expect(r.headers.get('location')).toContain('success=')
    expect(db.passwordUpdates).toHaveLength(1)

    // le token vérifié est à usage unique
    const again = await clientRouter.request('/api/client/reset-password', form({ token: verifiedToken, ...goodPwd }), env())
    expect(again.headers.get('location')).toContain('error=')
    expect(db.passwordUpdates).toHaveLength(1)
  })

  it('bloque le brute-force : après 5 essais le token est invalidé', async () => {
    const token = seedToken('11112222')
    for (let i = 0; i < 5; i++) {
      await clientRouter.request('/api/client/verify-reset-code', form({ token, code: String(10000000 + i) }), env())
    }
    const res = await clientRouter.request('/api/client/verify-reset-code', form({ token, code: '11112222' }), env())
    expect(res.headers.get('location')).not.toContain('step=newpwd')
    expect(db.codes.get(token).used).toBe(1)
  })
})
