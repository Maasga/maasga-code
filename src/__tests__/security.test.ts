import { describe, it, expect } from 'vitest'
import {
  signToken,
  verifyToken,
  timingSafeEqualStr,
  adminPayloadEpoch,
  rateLimit
} from '../utils/security'

describe('Security Utilities', () => {
  const secret = 'super_secret_test_key_minimum_16_chars_long'

  it('signs and verifies HMAC tokens correctly', async () => {
    const payload = `admin_1_${Date.now()}`
    const token = await signToken(payload, secret)

    expect(token).toContain('.')
    const isValid = await verifyToken(token, secret)
    expect(isValid).toBe(true)
  })

  it('rejects tampered HMAC tokens', async () => {
    const payload = `admin_1_${Date.now()}`
    const token = await signToken(payload, secret)
    const tampered = token.slice(0, -3) + 'abc'

    const isValid = await verifyToken(tampered, secret)
    expect(isValid).toBe(false)
  })

  it('rejects expired tokens', async () => {
    // 25 hours ago
    const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000)
    const payload = `admin_1_${oldTimestamp}`
    const token = await signToken(payload, secret)

    const isValid = await verifyToken(token, secret)
    expect(isValid).toBe(false)
  })

  it('extracts epoch from admin token payload', () => {
    const token = 'admin_42_1700000000.signaturehash123'
    expect(adminPayloadEpoch(token)).toBe('42')

    const legacyToken = 'admin_1700000000.signaturehash123'
    expect(adminPayloadEpoch(legacyToken)).toBeNull()
  })

  it('compares strings with constant-time equality', () => {
    expect(timingSafeEqualStr('hello', 'hello')).toBe(true)
    expect(timingSafeEqualStr('hello', 'world')).toBe(false)
    expect(timingSafeEqualStr('hello', 'hell')).toBe(false)
  })

  it('enforces rate limits per key and window', () => {
    const key = `test_rate_limit_${Date.now()}`
    const max = 3
    const windowMs = 5000

    expect(rateLimit(key, max, windowMs).allowed).toBe(true)
    expect(rateLimit(key, max, windowMs).allowed).toBe(true)
    expect(rateLimit(key, max, windowMs).allowed).toBe(true)

    // 4th request exceeds max
    const fourth = rateLimit(key, max, windowMs)
    expect(fourth.allowed).toBe(false)
    expect(fourth.remaining).toBe(0)
  })
})
