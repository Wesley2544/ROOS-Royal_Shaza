import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check user still exists and is still active
    const user = await prisma.user.findUnique({
      where:  { id: decoded.userId },
      select: { id: true, role: true, is_active: true },
    })

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account not found or deactivated' })
    }

    req.user = { userId: user.id, role: user.role }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        error: 'You do not have permission to access this resource',
      })
    }
    next()
  }
}