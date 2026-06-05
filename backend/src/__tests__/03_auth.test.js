import { describe, it, expect, beforeAll } from 'vitest'
import { api } from './helpers.js'

describe('Auth API', () => {

  describe('POST /api/v1/auth/register', () => {
    const unique = Date.now()

    it('creates a new staff account and returns token', async () => {
      const res = await api().post('/api/v1/auth/register').send({
        name: 'Test Staff', email: `staff${unique}@royalshaza.ke`,
        password: 'StaffPass2026', role: 'waiter',
      })
      expect(res.status).toBe(201)
      expect(res.body.token).toBeTruthy()
      expect(res.body.user.role).toBe('waiter')
      expect(res.body.user.password_hash).toBeUndefined()
    })

    it('rejects duplicate email with 409', async () => {
      const email = `dup${unique}@royalshaza.ke`
      await api().post('/api/v1/auth/register').send({
        name:'Dup',email,password:'Pass12345',role:'waiter'})
      const res = await api().post('/api/v1/auth/register').send({
        name:'Dup2',email,password:'Pass12345',role:'waiter'})
      expect(res.status).toBe(409)
      expect(res.body.error).toMatch(/already exists/i)
    })

    it('rejects invalid email format with 400', async () => {
      const res = await api().post('/api/v1/auth/register').send({
        name:'Bad',email:'notanemail',password:'Pass12345',role:'waiter'})
      expect(res.status).toBe(400)
    })

    it('rejects password shorter than 8 characters with 400', async () => {
      const res = await api().post('/api/v1/auth/register').send({
        name:'Bad',email:`short${unique}@test.ke`,password:'123',role:'waiter'})
      expect(res.status).toBe(400)
    })

    it('rejects invalid role with 400', async () => {
      const res = await api().post('/api/v1/auth/register').send({
        name:'Bad',email:`role${unique}@test.ke`,password:'Pass12345',role:'hacker'})
      expect(res.status).toBe(400)
    })

    it('rejects missing required fields with 400', async () => {
      const res = await api().post('/api/v1/auth/register').send({name:'NoEmail'})
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('returns token on valid credentials', async () => {
      const res = await api().post('/api/v1/auth/login').send({
        email:'admin@royalshaza.ke', password:'Manager2026!'})
      expect(res.status).toBe(200)
      expect(res.body.token).toBeTruthy()
      expect(res.body.user.role).toBe('manager')
    })

    it('returns 401 for wrong password', async () => {
      const res = await api().post('/api/v1/auth/login').send({
        email:'admin@royalshaza.ke', password:'wrongpassword'})
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid email or password')
    })

    it('returns 401 for non-existent email', async () => {
      const res = await api().post('/api/v1/auth/login').send({
        email:'ghost@royalshaza.ke', password:'anypassword'})
      expect(res.status).toBe(401)
      expect(res.body.error).toBe('Invalid email or password')
    })

    it('returns same error for wrong email and wrong password (prevents enumeration)', async () => {
      const r1 = await api().post('/api/v1/auth/login').send({
        email:'ghost@royalshaza.ke', password:'pass'})
      const r2 = await api().post('/api/v1/auth/login').send({
        email:'admin@royalshaza.ke', password:'wrongpass'})
      expect(r1.body.error).toBe(r2.body.error)
    })

    it('rejects missing email with 400', async () => {
      const res = await api().post('/api/v1/auth/login').send({password:'pass'})
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    let token

    beforeAll(async () => {
      const res = await api().post('/api/v1/auth/login').send({
        email:'admin@royalshaza.ke', password:'Manager2026!'})
      token = res.body.token
    })

    it('returns user info with valid token', async () => {
      const res = await api().get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
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