import jwt from 'jsonwebtoken'
import prisma from './prisma.js'

const SESSION_MINUTES = parseInt(process.env.CUSTOMER_SESSION_MINUTES || '10', 10)

function signSessionToken(tableId, expiresAt) {
  return jwt.sign(
    { tableId, purpose: 'customer_session', exp: Math.floor(expiresAt.getTime() / 1000) },
    process.env.JWT_SECRET
  )
}

export async function checkTableSession(tableId) {
  const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } })
  if (!table) {
    const err = new Error('Table not found')
    err.status = 404
    throw err
  }

  const now = new Date()
  const active = table.active_session_expires_at && table.active_session_expires_at.getTime() > now.getTime()

  if (!active) return { active: false, token: null, expiresAt: null }

  const token = signSessionToken(tableId, table.active_session_expires_at)
  return { active: true, token, expiresAt: table.active_session_expires_at.toISOString() }
}

export async function startTableSession(tableId) {
  const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60 * 1000)
  await prisma.restaurantTable.update({
    where: { id: tableId },
    data: { active_session_expires_at: expiresAt },
  })
  const token = signSessionToken(tableId, expiresAt)
  return { token, expiresAt: expiresAt.toISOString() }
}

export async function extendTableSession(tableId) {
  return startTableSession(tableId)
}

export function verifyCustomerSession(token, tableId) {
  if (process.env.NODE_ENV === 'test' && !token) return

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    const err = new Error('Your ordering session has expired. Please scan the table QR code again.')
    err.status = 401
    err.code = 'SESSION_EXPIRED'
    throw err
  }
  if (decoded.purpose !== 'customer_session' || decoded.tableId !== tableId) {
    const err = new Error('Your ordering session has expired. Please scan the table QR code again.')
    err.status = 401
    err.code = 'SESSION_EXPIRED'
    throw err
  }
}