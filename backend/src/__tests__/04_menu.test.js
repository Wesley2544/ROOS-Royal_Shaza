import { describe, it, expect, beforeAll } from 'vitest'
import { api, getManagerToken, getWaiterToken, ensureTestAccounts, getCategoryId } from './helpers.js'

let managerToken, waiterToken, categoryId, createdItemId

describe('Menu API', () => {

  beforeAll(async () => {
    await ensureTestAccounts()
    managerToken = await getManagerToken()
    waiterToken  = await getWaiterToken()
    categoryId   = await getCategoryId('Mains')
  })

  describe('GET /api/v1/menu/categories — public', () => {
    it('returns 200 with categories array', async () => {
      const res = await api().get('/api/v1/menu/categories')
      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBeGreaterThanOrEqual(4)
    })
    it('each category has required fields', async () => {
      const res = await api().get('/api/v1/menu/categories')
      res.body.forEach(cat => {
        expect(cat.id).toBeTruthy()
        expect(cat.name).toBeTruthy()
        expect(typeof cat.sort_order).toBe('number')
      })
    })
    it('categories are ordered by sort_order ascending', async () => {
      const res = await api().get('/api/v1/menu/categories')
      const orders = res.body.map(c => c.sort_order)
      expect(orders).toEqual([...orders].sort((a,b) => a-b))
    })
    it('no auth required — accessible without token', async () => {
      const res = await api().get('/api/v1/menu/categories')
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/v1/menu/items — public', () => {
    it('returns all available items', async () => {
      const res = await api().get('/api/v1/menu/items')
      expect(res.status).toBe(200)
      expect(res.body.length).toBeGreaterThanOrEqual(11)
    })
    it('each item includes its category', async () => {
      const res = await api().get('/api/v1/menu/items')
      res.body.forEach(item => {
        expect(item.category).toBeTruthy()
        expect(item.category.name).toBeTruthy()
      })
    })
    it('does not return soft-deleted items', async () => {
      const res = await api().get('/api/v1/menu/items')
      res.body.forEach(item => {
        expect(item.is_deleted).toBe(false)
      })
    })
    it('filters by category_id correctly', async () => {
      const mainsCatId = await getCategoryId('Mains')
      const res = await api().get(`/api/v1/menu/items?category_id=${mainsCatId}`)
      expect(res.status).toBe(200)
      res.body.forEach(item => {
        expect(item.category_id).toBe(mainsCatId)
      })
    })
    it('returns empty array for non-existent category filter', async () => {
      const res = await api().get('/api/v1/menu/items?category_id=00000000-0000-0000-0000-000000000000')
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
  })

  describe('GET /api/v1/menu/items/:id — public', () => {
    it('returns a single item by ID', async () => {
      const listRes = await api().get('/api/v1/menu/items')
      const itemId  = listRes.body[0].id
      const res     = await api().get(`/api/v1/menu/items/${itemId}`)
      expect(res.status).toBe(200)
      expect(res.body.id).toBe(itemId)
    })
    it('returns 404 for non-existent item', async () => {
      const res = await api().get('/api/v1/menu/items/00000000-0000-0000-0000-000000000000')
      expect(res.status).toBe(404)
      expect(res.body.error).toMatch(/not found/i)
    })
    it('returns 404 for invalid UUID format', async () => {
      const res = await api().get('/api/v1/menu/items/not-a-real-uuid')
      expect([400,404]).toContain(res.status)
    })
  })

  describe('POST /api/v1/menu/items — manager only', () => {
    it('manager can create a new item', async () => {
      const res = await api().post('/api/v1/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          category_id:  categoryId,
          name:         'Test Item For Suite',
          description:  'Created by automated test',
          price:        1500,
          dietary_tags: ['gluten_free'],
        })
      expect(res.status).toBe(201)
      expect(res.body.id).toBeTruthy()
      expect(res.body.name).toBe('Test Item For Suite')
      createdItemId = res.body.id
    })
    it('waiter cannot create menu items — returns 403', async () => {
      const res = await api().post('/api/v1/menu/items')
        .set('Authorization', `Bearer ${waiterToken}`)
        .send({ category_id:categoryId, name:'Hack',price:100 })
      expect(res.status).toBe(403)
    })
    it('unauthenticated request returns 401', async () => {
      const res = await api().post('/api/v1/menu/items')
        .send({ category_id:categoryId, name:'Hack',price:100 })
      expect(res.status).toBe(401)
    })
    it('rejects missing required fields with 400', async () => {
      const res = await api().post('/api/v1/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name:'No category or price' })
      expect(res.status).toBe(400)
    })
    it('rejects negative price with 400', async () => {
      const res = await api().post('/api/v1/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ category_id:categoryId, name:'NegPrice', price:-100 })
      expect(res.status).toBe(400)
    })
    it('rejects non-existent category_id with 404', async () => {
      const res = await api().post('/api/v1/menu/items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ category_id:'00000000-0000-0000-0000-000000000000', name:'Bad Cat',price:100 })
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/v1/menu/items/:id — manager only', () => {
    it('manager can update an existing item', async () => {
      const res = await api().put(`/api/v1/menu/items/${createdItemId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ price:2000, description:'Updated by test' })
      expect(res.status).toBe(200)
      expect(res.body.price).toBe(2000)
    })
    it('partial update only changes provided fields', async () => {
      const res = await api().put(`/api/v1/menu/items/${createdItemId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ price:1800 })
      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Test Item For Suite')
    })
  })

  describe('PATCH /api/v1/menu/items/:id/availability — manager only', () => {
    it('manager can toggle availability off', async () => {
      const res = await api().patch(`/api/v1/menu/items/${createdItemId}/availability`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ is_available: false })
      expect(res.status).toBe(200)
      expect(res.body.is_available).toBe(false)
    })
    it('unavailable item does not appear in public menu', async () => {
      const res = await api().get('/api/v1/menu/items')
      const found = res.body.find(i => i.id === createdItemId)
      expect(found).toBeUndefined()
    })
    it('manager can toggle availability back on', async () => {
      const res = await api().patch(`/api/v1/menu/items/${createdItemId}/availability`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ is_available: true })
      expect(res.status).toBe(200)
      expect(res.body.is_available).toBe(true)
    })
    it('rejects non-boolean is_available with 400', async () => {
      const res = await api().patch(`/api/v1/menu/items/${createdItemId}/availability`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ is_available: 'yes' })
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/v1/menu/items/:id — manager only', () => {
    it('manager can soft delete an item', async () => {
      const res = await api().delete(`/api/v1/menu/items/${createdItemId}`)
        .set('Authorization', `Bearer ${managerToken}`)
      expect(res.status).toBe(200)
      expect(res.body.message).toMatch(/removed/i)
    })
    it('deleted item no longer appears in public menu', async () => {
      const res = await api().get('/api/v1/menu/items')
      const found = res.body.find(i => i.id === createdItemId)
      expect(found).toBeUndefined()
    })
    it('deleted item returns 404 on direct lookup', async () => {
      const res = await api().get(`/api/v1/menu/items/${createdItemId}`)
      expect(res.status).toBe(404)
    })
  })

})