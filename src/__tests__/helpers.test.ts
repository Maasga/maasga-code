import { describe, it, expect } from 'vitest'
import {
  isValidPhone,
  normalizePhone,
  isValidEmail,
  sanitizeText,
  escapeHtml,
  validateImageMagicBytes
} from '../utils/helpers'

describe('Helper Utilities', () => {
  it('validates Burkina Faso telephone numbers (8 digits or with +226 prefix)', () => {
    expect(isValidPhone('70123456')).toBe(true)
    expect(isValidPhone('+22670123456')).toBe(true)
    expect(isValidPhone('+226 70 12 34 56')).toBe(true)
    expect(isValidPhone('22670123456')).toBe(true)
    expect(isValidPhone('123')).toBe(false)
    expect(isValidPhone('abcdefgh')).toBe(false)
  })

  it('normalizes telephone numbers to 8-digit local format', () => {
    expect(normalizePhone('+226 70 12 34 56')).toBe('70123456')
    expect(normalizePhone('22670123456')).toBe('70123456')
    expect(normalizePhone('70-12-34-56')).toBe('70123456')
  })

  it('validates email formats accurately', () => {
    expect(isValidEmail('client@maasga.com')).toBe(true)
    expect(isValidEmail('test.user+tag@domain.bf')).toBe(true)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('@nodomain.com')).toBe(false)
  })

  it('sanitizes and escapes text against XSS injection', () => {
    const raw = '<script>alert("xss")</script>'
    const escaped = escapeHtml(raw)
    expect(escaped).not.toContain('<script>')
    expect(escaped).toContain('&lt;script&gt;')

    const longText = 'a'.repeat(200)
    expect(sanitizeText(longText, 50).length).toBe(50)
  })

  it('validates image magic bytes accurately', () => {
    // JPEG magic bytes: FF D8 FF
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])
    expect(validateImageMagicBytes(jpegBytes)).toBe(true)

    // PNG magic bytes: 89 50 4E 47
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(validateImageMagicBytes(pngBytes)).toBe(true)

    // Invalid / binary executable bytes
    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00])
    expect(validateImageMagicBytes(exeBytes)).toBe(false)
  })
})
