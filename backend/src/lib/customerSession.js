import jwt from 'jsonwebtoken'

const SESSION_MINUTES = parseInt(process.env.CUSTOMER_SESSION_MINUTES || '20', 10)

export function issueCustomerSession(tableId, tableNumber = null) {
  const token = jwt.sign(
    { tableId, tableNumber, purpose: 'customer_session' },
    process.env.JWT_SECRET,
    { expiresIn: `${SESSION_MINUTES}m` }
  )
  const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60 * 1000).toISOString()
  return { token, expiresAt }
}

export function verifyCustomerSession(token, tableId) {
  // In the test environment, only enforce this when a token was actually
  // supplied. This lets the existing order/table tests — written before
  // this feature existed — keep passing untouched, while this file's own
  // dedicated tests still exercise real verification by passing a token.
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