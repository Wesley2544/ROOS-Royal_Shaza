import { describe, it, expect, beforeAll } from 'vitest'
import { api } from './helpers.js'

describe('Auth API', () => {

  describe('POST /api/v1/auth/register', () => {
    const unique = Date.now()

    it('creates a new staff account and returns token', async () => {
      const res = await api().post('/api/v1/auth/register').send({
        name: 'Test Staff', username: `staff${unique}`,
        password: 'StaffPass2026', role: 'waiter',
      })
      expect(res.status).toBe(201)
      expect(res.body.token).toBeTruthy()
      expect(res.body.user.role).toBe('waiter')
      expect(res.body.user.password_hash).toBeUndefined()
    })

    it('rejects duplicate username with 409', async () => {
      const username = `dup${unique}`
      await api().post('/api/v1/auth/register').send({
        name:'Dup', username, password:'Pass12345', role:'waiter' })
      const res = await api().post('/api/v1/auth/register').send({
        name:'Dup2', username, password:'Pass12345', role:'waiter' })
      expect(res.status).toBe(409)
      expect(res.body.error).toMatch(/already taken/i)
    })

    it('rejects username with invalid characters with 400', async () => {
      const res = await api().post('/api/v1/auth/register').send({
        name:'Bad', username:'bad user!', password:'Pass12345', role:'waiter' })
      expect(res.status).toBe(400)
    })

    it('rejects username shorter than 3 characters with 400', async () => {
      const res = await api().post('/api/v1/auth/register').send({
        name:'Bad', username:'ab', password:'Pass12345', role:'waiter' })
      expect(res.status).toBe(400)
    })

    it('rejects password shorter than 8 characters with 400', async () => {
      const res = await api().post('/api/v1/auth/register').send({
        name:'Bad', username:`short${unique}`, password:'123', role:'waiter' })
      expect(res.status).toBe(400)
    })

    it('rejects invalid role with 400', async () => {
      const res = await api().post('/api/v1/auth/register').send({
        name:'Bad', username:`role${unique}`, password:'Pass12345', role:'hacker' })
      expect(res.status).toBe(400)
    })

    it('rejects missing required fields with 400', async () => {
      const res = await api().post('/api/v1/auth/register').send({ name:'NoUsername' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('returns token on valid credentials', async () => {
      const res = await api().post('/api/v1/auth/login').send({
        username:'admin', password:'Manager2026!', role:'manager' })
      expect(res.status).toBe(200)
      expect(res.body.token).toBeTruthy()
      expect(res.body.user.role).toBe('manager')
    })

    it('returns 401 for wrong password', async () => {
      const res = await api().post('/api/v1/auth/login').send({
        username:'admin', password:'wrongpassword', role:'manager' })
      expect(res.status).toBe(401)
    })

    it('returns 401 for non-existent username', async () => {
      const res = await api().post('/api/v1/auth/login').send({
        username:'ghostuser', password:'anypassword', role:'manager' })
      expect(res.status).toBe(401)
    })

    it('returns 401 when role does not match the account', async () => {
      const res = await api().post('/api/v1/auth/login').send({
        username:'admin', password:'Manager2026!', role:'waiter' })
      expect(res.status).toBe(401)
    })

    it('returns same error for wrong username and wrong password (prevents enumeration)', async () => {
      const r1 = await api().post('/api/v1/auth/login').send({
        username:'ghostuser', password:'wrongpassword', role:'manager' })
      const r2 = await api().post('/api/v1/auth/login').send({
        username:'admin', password:'wrongpassword', role:'manager' })
      expect(r1.body.error).toBe(r2.body.error)
    })

    it('rejects missing username with 400', async () => {
      const res = await api().post('/api/v1/auth/login').send({ password:'pass', role:'manager' })
      expect([400, 429]).toContain(res.status)
    })
  })

  describe('GET /api/v1/auth/me', () => {

    it('returns user info with valid token', async () => {
      const loginRes = await api().post('/api/v1/auth/login').send({
        username: 'admin', password: 'Manager2026!', role: 'manager',
      })
      const freshToken = loginRes.body.token
      expect(freshToken).toBeTruthy()

      const res = await api().get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${freshToken}`)
      expect(res.status).toBe(200)
      expect(res.body.user.userId).toBeTruthy()
      expect(res.body.user.role).toBe('manager')
    })

    it('returns 401 with no token', async () => {
      const res = await api().get('/api/v1/auth/me')
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('No token provided')
    })

    it('returns 401 with invalid token', async () => {
      const res = await api().get('/api/v1/auth/me')
        .set('Authorization', 'Bearer fakeinvalidtoken')
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid or expired token')
    })

    it('returns 401 with malformed authorization header', async () => {
      const res = await api().get('/api/v1/auth/me')
        .set('Authorization', 'NotBearer token')
      expect(res.status).toBe(401)
    })
  })

})