import { describe, it, expect } from 'vitest'
import { AdminLayout } from '../components/admin/AdminLayout'
import {
  AdminPage,
  AdminProduitsPage,
  AdminRDVPage,
  AdminClientsPage,
  AdminCommandesPage,
  AdminAvisPage,
  AdminParametresPage,
  AdminMaintenancePage
} from '../pages/admin'

describe('Admin Layout & Tabs Rendering', () => {
  it('AdminLayout renders without throwing', () => {
    expect(() => AdminLayout({ children: '<div>Test</div>', activePage: 'dashboard' })).not.toThrow()
  })

  it('AdminPage renders without throwing', () => {
    expect(() => AdminPage()).not.toThrow()
  })

  it('AdminProduitsPage renders without throwing', () => {
    expect(() => AdminProduitsPage({})).not.toThrow()
  })

  it('AdminRDVPage renders without throwing', () => {
    expect(() => AdminRDVPage({})).not.toThrow()
  })

  it('AdminClientsPage renders without throwing', () => {
    expect(() => AdminClientsPage()).not.toThrow()
  })

  it('AdminCommandesPage renders without throwing', () => {
    expect(() => AdminCommandesPage({})).not.toThrow()
  })

  it('AdminAvisPage renders without throwing', () => {
    expect(() => AdminAvisPage()).not.toThrow()
  })

  it('AdminParametresPage renders without throwing', () => {
    expect(() => AdminParametresPage()).not.toThrow()
  })

  it('AdminMaintenancePage renders without throwing', () => {
    expect(() => AdminMaintenancePage({})).not.toThrow()
  })
})
