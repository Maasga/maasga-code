import { describe, it, expect } from 'vitest'
import { AdminPage } from '../components/admin/tabs/AdminDashboardTab'

describe('AdminPage', () => {
  it('renders without throwing', () => {
    expect(() => AdminPage()).not.toThrow()
  })
})
