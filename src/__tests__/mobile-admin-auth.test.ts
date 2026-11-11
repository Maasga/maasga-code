import { describe, it, expect } from 'vitest'
import { isMobileAdminPayload } from '../services/auth.service'

describe('isMobileAdminPayload (contrôle du rôle admin mobile)', () => {
  it('accepte le custom claim role=admin', () => {
    expect(isMobileAdminPayload({ sub: 'u1', role: 'admin' })).toBe(true)
  })

  it('accepte le claim namespacé https://maasga.app/role=admin', () => {
    expect(isMobileAdminPayload({ sub: 'u1', 'https://maasga.app/role': 'admin' })).toBe(true)
  })

  it('refuse un compte quelconque dont l\'email finit par @maasga.com', () => {
    expect(isMobileAdminPayload({ sub: 'x', email: 'pirate@maasga.com', email_verified: true })).toBe(false)
  })

  it('refuse un compte quelconque dont l\'email finit par @maasga.bf', () => {
    expect(isMobileAdminPayload({ sub: 'x', email: 'pirate@maasga.bf', email_verified: true })).toBe(false)
  })

  it('accepte un email de la liste explicite seulement si email_verified=true', () => {
    expect(isMobileAdminPayload({ sub: 'a', email: 'maasgabf@gmail.com', email_verified: true })).toBe(true)
    expect(isMobileAdminPayload({ sub: 'a', email: 'MaasgaBF@gmail.com ', email_verified: true })).toBe(true)
  })

  it('refuse un email de la liste explicite non vérifié', () => {
    expect(isMobileAdminPayload({ sub: 'a', email: 'maasgabf@gmail.com', email_verified: false })).toBe(false)
    expect(isMobileAdminPayload({ sub: 'a', email: 'maasgabf@gmail.com' })).toBe(false)
  })

  it('refuse un client normal', () => {
    expect(isMobileAdminPayload({ sub: 'c', email: 'client@gmail.com', email_verified: true, role: 'client' })).toBe(false)
  })
})
