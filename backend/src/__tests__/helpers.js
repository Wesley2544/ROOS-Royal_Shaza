import request from 'supertest'
import { createServer } from 'http'
import app from '../../app.js'

// Returns a supertest agent pointed at the running test server
export function api() {
  return request(`http://localhost:${process.env.TEST_PORT}`)
}

// Login and return a token for a given role
export async function getToken(email, password) {
  const res = await api()
    .post('/api/v1/auth/login')
    .send({ email, password })
  return res.body.token
}

export async function getManagerToken() {
  return getToken('admin@royalshaza.ke', 'Manager2026!')
}

export async function getWaiterToken() {
  return getToken('testwaiter@royalshaza.ke', 'Waiter2026')
}

export async function getKitchenToken() {
  return getToken('testkitchen@royalshaza.ke', 'Kitchen2026')
}

// Create test accounts if they don't exist
export async function ensureTestAccounts() {
  const accounts = [
    { name:'Test Waiter',  email:'testwaiter@royalshaza.ke',  password:'Waiter2026',  role:'waiter'  },
    { name:'Test Kitchen', email:'testkitchen@royalshaza.ke', password:'Kitchen2026', role:'kitchen' },
  ]
  for (const acc of accounts) {
    await api().post('/api/v1/auth/register').send(acc)
    // Ignore 409 conflict if already exists
  }
}

// Get a real table ID and item ID for order tests
export async function getTableId(tableNumber = 1) {
  const res = await api()
    .get(`/api/v1/tables/${tableNumber}`)
    .set('Authorization', `Bearer ${await getManagerToken()}`)
  return res.body.id
}

export async function getFirstItemId() {
  const res = await api().get('/api/v1/menu/items')
  return res.body[0]?.id
}

export async function getCategoryId(name = 'Starters') {
  const res = await api().get('/api/v1/menu/categories')
  return res.body.find(c => c.name === name)?.id
}