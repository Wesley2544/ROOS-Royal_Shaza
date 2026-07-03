import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { api } from './helpers.js'

describe('Customer ordering session', () => {

  it('issues a session token when looking up a table by number', async () => {
    const res = await api().get('/api/v1/tables/by-number/3')
    expect(res.status).toBe(200)
    expect(res.body.session_token).toBeTruthy()
    expect(res.body.session_expires_at).toBeTruthy()
  })

  it('rejects order placement with a wrongly-signed token', async () => {
    const tableRes = await api().get('/api/v1/tables/by-number/3')
    const tableId  = tableRes.body.id
    const forgedToken = jwt.sign(
      { tableId, purpose: 'customer_session' },
      'not-the-real-secret',
      { expiresIn: '10m' }
    )
    const itemRes = await api().get('/api/v1/menu/items')
    const itemId  = itemRes.body[0]?.id

    const res = await api().post('/api/v1/orders').send({
      table_id: tableId,
      session_token: forgedToken,
      items: [{ menu_item_id: itemId, quantity: 1 }],
    })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('SESSION_EXPIRED')
  })

  it('rejects order placement with an expired token', async () => {
    const tableRes = await api().get('/api/v1/tables/by-number/3')
    const tableId  = tableRes.body.id
    const expiredToken = jwt.sign(
      { tableId, purpose: 'customer_session' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    )
    const itemRes = await api().get('/api/v1/menu/items')
    const itemId  = itemRes.body[0]?.id

    const res = await api().post('/api/v1/orders').send({
      table_id: tableId,
      session_token: expiredToken,
      items: [{ menu_item_id: itemId, quantity: 1 }],
    })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('SESSION_EXPIRED')
  })

  it('accepts order placement with a genuinely valid session token', async () => {
    const tableRes = await api().get('/api/v1/tables/by-number/9')
    const tableId  = tableRes.body.id
    const token    = tableRes.body.session_token
    const itemRes = await api().get('/api/v1/menu/items')
    const itemId  = itemRes.body[0]?.id

    const res = await api().post('/api/v1/orders').send({
      table_id: tableId,
      session_token: token,
      items: [{ menu_item_id: itemId, quantity: 1 }],
    })
    expect(res.status).toBe(201)
    expect(res.body.session_token).toBeTruthy()
  })

})