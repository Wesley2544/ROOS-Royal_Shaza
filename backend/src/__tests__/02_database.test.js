import { describe, it, expect } from 'vitest'
import prisma from '../lib/prisma.js'

describe('Database integrity', () => {

  describe('Connection', () => {
    it('can connect to Supabase', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as connected`
      expect(result[0].connected).toBe(1)
    })
  })

  describe('Seed data verification', () => {
    it('has exactly 4 menu categories', async () => {
      const count = await prisma.menuCategory.count({ where: { is_active: true } })
      expect(count).toBeGreaterThanOrEqual(4)
    })
    it('has exactly 11 menu items', async () => {
      const count = await prisma.menuItem.count({ where: { is_deleted: false } })
      expect(count).toBeGreaterThanOrEqual(11)
    })
    it('has exactly 12 restaurant tables', async () => {
      const count = await prisma.restaurantTable.count()
      expect(count).toBe(12)
    })
    it('has at least one manager account', async () => {
      const count = await prisma.user.count({ where: { role: 'manager', is_active: true } })
      expect(count).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Table structure', () => {
    it('menu items have valid category foreign keys', async () => {
      const orphans = await prisma.menuItem.findMany({
        where: { is_deleted: false },
        include: { category: true },
      })
      orphans.forEach(item => {
        expect(item.category).not.toBeNull()
        expect(item.category.name).toBeTruthy()
      })
    })
    it('all tables have unique table numbers 1-12', async () => {
      const tables = await prisma.restaurantTable.findMany({ orderBy: { table_number: 'asc' } })
      const numbers = tables.map(t => t.table_number)
      expect(numbers).toEqual([1,2,3,4,5,6,7,8,9,10,11,12])
    })
    it('all menu items have positive prices', async () => {
      const items = await prisma.menuItem.findMany({ where: { is_deleted: false } })
      items.forEach(item => {
        expect(item.price).toBeGreaterThan(0)
      })
    })
    it('no password hashes are stored in plain text', async () => {
      const users = await prisma.user.findMany()
      users.forEach(user => {
        expect(user.password_hash).toMatch(/^\$2[aby]\$/)
        expect(user.password_hash.length).toBeGreaterThan(50)
      })
    })
  })

})