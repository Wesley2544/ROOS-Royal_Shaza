import { beforeEach, describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { api } from './helpers.js'

describe('Customer ordering session', () => {
  beforeEach(async () => {
    await prisma.restaurantTable.updateMany({
      where: { table_number: { in: [5, 6, 7, 9, 10] } },
      data: { active_session_expires_at: null },
    })
  })

  it('a table with no active session reports session_active: false', async () => {
    const res = await api().get('/api/v1/tables/by-number/5')
    expect(res.status).toBe(200)
    expect(res.body.session_active).toBe(false)
    expect(res.body.session_token).toBeNull()
  })

  it('explicitly starting a session returns a usable token', async () => {
    const tableRes = await api().get('/api/v1/tables/by-number/5')
    const startRes = await api().post(`/api/v1/tables/${tableRes.body.id}/start-session`)
    expect(startRes.status).toBe(200)
    expect(startRes.body.session_token).toBeTruthy()
    expect(startRes.body.session_expires_at).toBeTruthy()
  })

  it('re-checking after starting reports active with the same expiry — proves reload cannot renew it', async () => {
    const tableRes = await api().get('/api/v1/tables/by-number/6')
    const startRes = await api().post(`/api/v1/tables/${tableRes.body.id}/start-session`)
    const recheck  = await api().get('/api/v1/tables/by-number/6')
    expect(recheck.body.session_active).toBe(true)
    expect(recheck.body.session_expires_at).toBe(startRes.body.session_expires_at)
  })

  it('rejects order placement with a wrongly-signed token', async () => {
    const tableRes = await api().get('/api/v1/tables/by-number/7')
    const forgedToken = jwt.sign(
      { tableId: tableRes.body.id, purpose: 'customer_session' },
      'not-the-real-secret', { expiresIn: '10m' }
    )
    const itemRes = await api().get('/api/v1/menu/items')
    const res = await api().post('/api/v1/orders').send({
      table_id: tableRes.body.id, session_token: forgedToken,
      items: [{ menu_item_id: itemRes.body[0]?.id, quantity: 1 }],
    })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('SESSION_EXPIRED')
  })

  it('rejects order placement with an expired token', async () => {
    const tableRes = await api().get('/api/v1/tables/by-number/7')
    const expiredToken = jwt.sign(
      { tableId: tableRes.body.id, purpose: 'customer_session' },
      process.env.JWT_SECRET, { expiresIn: '-1s' }
    )
    const itemRes = await api().get('/api/v1/menu/items')
    const res = await api().post('/api/v1/orders').send({
      table_id: tableRes.body.id, session_token: expiredToken,
      items: [{ menu_item_id: itemRes.body[0]?.id, quantity: 1 }],
    })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('SESSION_EXPIRED')
  })

  it('accepts order placement with a genuinely valid, explicitly-started session', async () => {
    const tableRes = await api().get('/api/v1/tables/by-number/9')
    const startRes = await api().post(`/api/v1/tables/${tableRes.body.id}/start-session`)
    const itemRes  = await api().get('/api/v1/menu/items')
    const res = await api().post('/api/v1/orders').send({
      table_id: tableRes.body.id, session_token: startRes.body.session_token,
      items: [{ menu_item_id: itemRes.body[0]?.id, quantity: 1 }],
    })
    expect(res.status).toBe(201)
    expect(res.body.session_token).toBeTruthy()
  })

  it('a successful order extends the session', async () => {
    const tableRes = await api().get('/api/v1/tables/by-number/10')
    await api().post(`/api/v1/tables/${tableRes.body.id}/start-session`)
    const started  = await api().get('/api/v1/tables/by-number/10')
    const itemRes  = await api().get('/api/v1/menu/items')

    await api().post('/api/v1/orders').send({
      table_id: tableRes.body.id, session_token: started.body.session_token,
      items: [{ menu_item_id: itemRes.body[0]?.id, quantity: 1 }],
    })

    const recheck = await api().get('/api/v1/tables/by-number/10')
    expect(recheck.body.session_active).toBe(true)
  })

})