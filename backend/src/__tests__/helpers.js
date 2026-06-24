import request from 'supertest'

export function api() {
  return request(`http://localhost:${process.env.TEST_PORT}`)
}

export async function getToken(username, password, role) {
  const res = await api()
    .post('/api/v1/auth/login')
    .send({ username, password, role })
  return res.body.token
}

export async function getManagerToken() {
  return getToken('admin', 'Manager2026!', 'manager')
}

export async function getWaiterToken() {
  return getToken('testwaiter', 'Waiter2026', 'waiter')
}

export async function getKitchenToken() {
  return getToken('testkitchen', 'Kitchen2026', 'kitchen')
}

export async function ensureTestAccounts() {
  const accounts = [
    { name:'Test Waiter',  username:'testwaiter',  password:'Waiter2026',  role:'waiter'  },
    { name:'Test Kitchen', username:'testkitchen', password:'Kitchen2026', role:'kitchen' },
  ]
  for (const acc of accounts) {
    await api().post('/api/v1/auth/register').send(acc)
  }
}

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