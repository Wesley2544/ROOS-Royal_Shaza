import { describe, it, expect, beforeAll } from 'vitest'
import { api, getManagerToken, getWaiterToken, ensureTestAccounts,
         getTableId, getFirstItemId } from './helpers.js'

let managerToken, waiterToken, tableUUID, orderId

describe('Tables & Notifications API', () => {

  beforeAll(async () => {
    await ensureTestAccounts()
    managerToken = await getManagerToken()
    waiterToken  = await getWaiterToken()
    tableUUID    = await getTableId(6)
  })

  describe('GET /api/v1/tables', () => {
    it('returns all 12 tables', async () => {
      const res = await api().get('/api/v1/tables')
        .set('Authorization', `Bearer ${managerToken}`)
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(12)
    })
    it('tables are ordered by table_number ascending', async () => {
      const res = await api().get('/api/v1/tables')
        .set('Authorization', `Bearer ${managerToken}`)
      const nums = res.body.map(t => t.table_number)
      expect(nums[0]).toBe(1)
      expect(nums[nums.length-1]).toBe(12)
    })
    it('each table includes QR code URL', async () => {
      const res = await api().get('/api/v1/tables')
        .set('Authorization', `Bearer ${managerToken}`)
      res.body.forEach(t => {
        expect(t.qr_code_url).toMatch(/table=/)
      })
    })
    it('unauthenticated request returns 401', async () => {
      const res = await api().get('/api/v1/tables')
      expect(res.status).toBe(401)
    })
    it('customer token returns 401 (no role)', async () => {
      const res = await api().get('/api/v1/tables')
        .set('Authorization', 'Bearer fakecustomertoken')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/v1/tables/:number', () => {
    it('returns table 4 by number', async () => {
      const res = await api().get('/api/v1/tables/4')
        .set('Authorization', `Bearer ${managerToken}`)
      expect(res.status).toBe(200)
      expect(res.body.table_number).toBe(4)
    })
    it('returns 404 for non-existent table number', async () => {
      const res = await api().get('/api/v1/tables/99')
        .set('Authorization', `Bearer ${managerToken}`)
      expect(res.status).toBe(404)
    })
    it('waiter can access table detail', async () => {
      const res = await api().get('/api/v1/tables/1')
        .set('Authorization', `Bearer ${waiterToken}`)
      expect(res.status).toBe(200)
    })
  })

  describe('PATCH /api/v1/tables/:id/status', () => {
    it('manager can update table status', async () => {
      const res = await api().patch(`/api/v1/tables/${tableUUID}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'waiting' })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('waiting')
    })
    it('resets table back to free', async () => {
      const res = await api().patch(`/api/v1/tables/${tableUUID}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'free' })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('free')
    })
    it('rejects invalid status value with 400', async () => {
      const res = await api().patch(`/api/v1/tables/${tableUUID}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'broken' })
      expect(res.status).toBe(400)
    })
    it('rejects missing status with 400', async () => {
      const res = await api().patch(`/api/v1/tables/${tableUUID}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({})
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/notifications', () => {
    beforeAll(async () => {
      const itemId = await getFirstItemId()
      const tId    = await getTableId(8)
      const res = await api().post('/api/v1/orders').send({
        table_id: tId,
        items: [{ menu_item_id: itemId, quantity: 1 }],
      })
      orderId = res.body.id
    })

    it('returns notifications for a valid order', async () => {
      const res = await api().get(`/api/v1/notifications?order_id=${orderId}`)
      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })
    it('first notification type is received', async () => {
      const res = await api().get(`/api/v1/notifications?order_id=${orderId}`)
      expect(res.body[0].type).toBe('received')
    })
    it('returns 400 when order_id is missing', async () => {
      const res = await api().get('/api/v1/notifications')
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/order_id/i)
    })
    it('returns empty array for non-existent order_id', async () => {
      const res = await api().get('/api/v1/notifications?order_id=00000000-0000-0000-0000-000000000000')
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
  })

})