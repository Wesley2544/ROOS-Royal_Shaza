import { describe, it, expect, beforeAll } from 'vitest'
import { api } from './helpers.js'

describe('Server & infrastructure', () => {

  describe('Health endpoint', () => {
    it('returns 200 with status ok', async () => {
      const res = await api().get('/health')
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
    })
    it('confirms database is connected', async () => {
      const res = await api().get('/health')
      expect(res.body.database).toBe('connected')
    })
    it('includes timestamp and uptime', async () => {
      const res = await api().get('/health')
      expect(res.body.timestamp).toBeTruthy()
      expect(res.body.uptime).toBeTruthy()
    })
  })

  describe('404 handler', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await api().get('/api/v1/nonexistent')
      expect(res.status).toBe(404)
      expect(res.body.error).toBeTruthy()
    })
    it('returns JSON not HTML for 404', async () => {
      const res = await api().get('/does/not/exist')
      expect(res.headers['content-type']).toMatch(/json/)
    })
  })

  describe('Security headers', () => {
    it('includes X-Content-Type-Options header from Helmet', async () => {
      const res = await api().get('/health')
      expect(res.headers['x-content-type-options']).toBe('nosniff')
    })
    it('does not expose X-Powered-By header', async () => {
      const res = await api().get('/health')
      expect(res.headers['x-powered-by']).toBeUndefined()
    })
  })

  describe('Body size limit', () => {
    it('rejects payload larger than 10kb', async () => {
      const bigPayload = { data: 'x'.repeat(20000) }
      const res = await api()
        .post('/api/v1/auth/login')
        .send(bigPayload)
      expect(res.status).toBe(413)
    })
  })

  describe('Malformed JSON', () => {
    it('returns 400 for malformed JSON body', async () => {
      const res = await api()
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json :::')
      expect(res.status).toBe(400)
    })
  })

})