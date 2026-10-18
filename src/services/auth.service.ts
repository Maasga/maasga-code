import type { Context, Next } from 'hono'
import type { HonoEnv } from '../types'

export const DEFAULT_FIREBASE_PROJECT_ID = 'maasga-83b35'
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

let _jwksCache: { keys: any[]; fetchedAt: number } | null = null
const JWKS_CACHE_TTL_MS = 3600_000 // 1 hour

export async function getFirebasePublicKeys(): Promise<any[]> {
  const now = Date.now()
  if (_jwksCache && now - _jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
    return _jwksCache.keys
  }
  const res = await fetch(FIREBASE_JWKS_URL)
  if (!res.ok) throw new Error('Impossible de récupérer les clés JWKS Firebase')
  const data = (await res.json()) as { keys: any[] }
  _jwksCache = { keys: data.keys, fetchedAt: now }
  return data.keys
}

export function base64urlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')
  const binary = atob(padded)
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)))
}

export async function importJwkPublicKey(jwk: any): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
}

export async function verifyFirebaseToken(
  idToken: string,
  projectId: string = DEFAULT_FIREBASE_PROJECT_ID
): Promise<Record<string, any>> {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('JWT malformé')

  const [headerB64, payloadB64, signatureB64] = parts

  const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')))
  if (header.alg !== 'RS256') throw new Error('Algorithme JWT non supporté')

  const payload = JSON.parse(
    new TextDecoder().decode(base64urlToUint8Array(payloadB64))
  ) as Record<string, any>

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) throw new Error('Token expiré')
  if (payload.iat && payload.iat > now + 300) throw new Error('Token émis dans le futur')
  if (payload.aud !== projectId) throw new Error('Audience invalide')
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Émetteur invalide')
  if (!payload.sub) throw new Error('Subject manquant')

  const keys = await getFirebasePublicKeys()
  let jwk = keys.find((k: any) => k.kid === header.kid)
  if (!jwk) {
    _jwksCache = null
    const freshKeys = await getFirebasePublicKeys()
    jwk = freshKeys.find((k: any) => k.kid === header.kid)
    if (!jwk) throw new Error('Clé publique introuvable pour ce token')
  }

  const key = await importJwkPublicKey(jwk)
  const sig = base64urlToUint8Array(signatureB64)
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    sig.buffer as ArrayBuffer,
    data.buffer as ArrayBuffer
  )
  if (!valid) throw new Error('Signature JWT invalide')

  return payload
}

export const mobileAuth = async (c: Context<HonoEnv>, next: Next) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return c.json({ error: 'Token manquant' }, 401)
  try {
    const projectId = c.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
    const payload = await verifyFirebaseToken(token, projectId)
    c.set('mobileUser', {
      uid: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      role: 'client',
    })
    return next()
  } catch (e: any) {
    console.warn('[mobileAuth] Token invalide:', e.message)
    return c.json({ error: 'Token invalide ou expiré' }, 401)
  }
}

export const mobileAdminAuth = async (c: Context<HonoEnv>, next: Next) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return c.json({ error: 'Token manquant' }, 401)
  try {
    const projectId = c.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
    const payload = await verifyFirebaseToken(token, projectId)
    const isAdmin = payload['role'] === 'admin' || payload['https://maasga.app/role'] === 'admin'
    if (!isAdmin) return c.json({ error: 'Accès admin requis' }, 403)
    c.set('mobileUser', {
      uid: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      role: 'admin',
    })
    return next()
  } catch (e: any) {
    console.warn('[mobileAdminAuth] Token invalide:', e.message)
    return c.json({ error: 'Token invalide ou expiré' }, 401)
  }
}
