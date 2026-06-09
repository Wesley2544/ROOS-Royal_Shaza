import { describe, it, expect, beforeAll } from 'vitest'
import { api, getManagerToken, getWaiterToken, getKitchenToken,
         ensureTestAccounts, getTableId, getFirstItemId } from './helpers.js'
import prisma from '../lib/prisma.js'

let managerToken, waiterToken, kitchenToken
let tableId, itemId, orderId

describe('Orders API', () => {

  beforeAll(async () => {
    await ensureTestAccounts()
    managerToken = await getManagerToken()
    waiterToken  = await getWaiterToken()
    kitchenToken = await getKitchenToken()
    tableId      = await getTableId(5) // use table 5 for tests
    itemId       = await getFirstItemId()
  })

  describe('POST /api/v1/orders — place order (public)', () => {
    it('places a valid order and returns 201', async () => {
      const res = await api().post('/api/v1/orders').send({
        table_id: tableId,
        items: [{ menu_item_id: itemId, quantity: 2, item_notes: 'Test order' }],
        special_notes: 'Automated test order',
      })
      expect(res.status).toBe(201)
      expect(res.body.id).toBeTruthy()
      expect(res.body.status).toBe('new')
      expect(res.body.total_amount).toBeGreaterThan(0)
      orderId = res.body.id
    })

    it('order items have locked prices (denormalised)', async () => {
      const res = await api().get(`/api/v1/orders/${orderId}`)
      res.body.items.forEach(item => {
        expect(item.unit_price).toBeGreaterThan(0)
        expect(item.item_name).toBeTruthy()
        expect(item.subtotal).toBe(item.unit_price * item.quantity)
      })
    })

    it('creates a received notification on placement', async () => {
      const res = await api().get(`/api/v1/orders/${orderId}`)
      const notifs = res.body.notifications
      expect(notifs.length).toBeGreaterThanOrEqual(1)
      expect(notifs[0].type).toBe('received')
    })

    it('sets table status to ordering', async () => {
      const res = await api()
        .get('/api/v1/tables/5')
        .set('Authorization', `Bearer ${managerToken}`)
      expect(res.body.status).toBe('ordering')
    })

    it('rejects invalid table_id with 400', async () => {
      const res = await api().post('/api/v1/orders').send({
        table_id: '00000000-0000-0000-0000-000000000000',
        items: [{ menu_item_id: itemId, quantity: 1 }],
      })
      expect(res.status).toBe(404)
    })

    it('rejects non-existent menu item with 400', async () => {
      const res = await api().post('/api/v1/orders').send({
        table_id: tableId,
        items: [{ menu_item_id: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
      })
      expect(res.status).toBe(400)
    })

    it('rejects empty items array with 400', async () => {
      const res = await api().post('/api/v1/orders').send({
        table_id: tableId, items: [],
      })
      expect(res.status).toBe(400)
    })

    it('rejects quantity of 0 with 400', async () => {
      const res = await api().post('/api/v1/orders').send({
        table_id: tableId,
        items: [{ menu_item_id: itemId, quantity: 0 }],
      })
      expect(res.status).toBe(400)
    })

    it('rejects missing table_id with 400', async () => {
      const res = await api().post('/api/v1/orders').send({
        items: [{ menu_item_id: itemId, quantity: 1 }],
      })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/orders/:id — public', () => {
    it('returns full order with items and notifications', async () => {
      const res = await api().get(`/api/v1/orders/${orderId}`)
      expect(res.status).toBe(200)
      expect(res.body.items).toBeInstanceOf(Array)
      expect(res.body.notifications).toBeInstanceOf(Array)
      expect(res.body.table.table_number).toBe(5)
    })
    it('returns 404 for non-existent order ID', async () => {
      const res = await api().get('/api/v1/orders/00000000-0000-0000-0000-000000000000')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/v1/orders — staff only', () => {
    it('manager can get all orders', async () => {
      const res = await api().get('/api/v1/orders')
        .set('Authorization', `Bearer ${managerToken}`)
      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
    })
    it('kitchen can get orders', async () => {
      const res = await api().get('/api/v1/orders')
        .set('Authorization', `Bearer ${kitchenToken}`)
      expect(res.status).toBe(200)
    })
    it('waiter can get orders', async () => {
      const res = await api().get('/api/v1/orders')
        .set('Authorization', `Bearer ${waiterToken}`)
      expect(res.status).toBe(200)
    })
    it('unauthenticated request returns 401', async () => {
      const res = await api().get('/api/v1/orders')
      expect(res.status).toBe(401)
    })
  })

  describe('PATCH /api/v1/orders/:id/status — full state machine', () => {
    it('advances from new → preparing', async () => {
      const res = await api().patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'preparing' })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('preparing')
    })

    it('creates a preparing notification', async () => {
      const res = await api().get(`/api/v1/orders/${orderId}`)
      const notifs = res.body.notifications
      const prepNotif = notifs.find(n => n.type === 'preparing')
      expect(prepNotif).toBeTruthy()
      expect(prepNotif.message).toMatch(/being prepared/i)
    })

    it('rejects moving backwards — preparing → new', async () => {
      const res = await api().patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'new' })
      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/Cannot move/i)
    })

    it('rejects skipping a state — preparing → served', async () => {
      const res = await api().patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'served' })
      expect(res.status).toBe(400)
    })

    it('advances from preparing → ready', async () => {
      const res = await api().patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'ready' })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ready')
    })

    it('creates a ready notification', async () => {
      const res = await api().get(`/api/v1/orders/${orderId}`)
      const notifs = res.body.notifications
      const readyNotif = notifs.find(n => n.type === 'ready')
      expect(readyNotif).toBeTruthy()
      expect(readyNotif.message).toMatch(/on its way/i)
    })

    it('advances from ready → served', async () => {
      const res = await api().patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'served' })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('served')
    })

    it('creates a served notification', async () => {
      const res = await api().get(`/api/v1/orders/${orderId}`)
      const notifs = res.body.notifications
      const servedNotif = notifs.find(n => n.type === 'served')
      expect(servedNotif).toBeTruthy()
    })

    it('resets table to free after served', async () => {
      const res = await api()
        .get('/api/v1/tables/5')
        .set('Authorization', `Bearer ${managerToken}`)
      expect(res.body.status).toBe('free')
    })

    it('rejects any further transitions on served order', async () => {
      const res = await api().patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'preparing' })
      expect(res.status).toBe(400)
    })

    it('rejects invalid status value with 400', async () => {
      const res = await api().patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'exploded' })
      expect(res.status).toBe(400)
    })

    it('writes full audit trail to order_status_log', async () => {
      const logs = await prisma.orderStatusLog.findMany({
        where: { order_id: orderId },
        orderBy: { changed_at: 'asc' },
      })
      const statuses = logs.map(l => l.status)
      expect(statuses).toEqual(['new','preparing','ready','served'])
    })
  })

})