import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../lib/prisma.js'

// ── Validation schemas ─────────────────────────────────────────
const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

const loginSchema = z.object({
  username: usernameSchema,
  role:     z.enum(['kitchen', 'waiter', 'manager']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(120),
  username: usernameSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role:     z.enum(['kitchen', 'waiter', 'manager'], {
    errorMap: () => ({ message: 'Role must be kitchen, waiter, or manager' }),
  }),
})

// ── Token helper ───────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )
}

// ── Login ──────────────────────────────────────────────────────
export async function loginUser(username, password, role) {
  const parsed = loginSchema.safeParse({ username, password, role })
  if (!parsed.success) {
    const message = parsed.error.errors?.[0]?.message || 'Invalid request data'
    const err = new Error(message)
    err.status = 400
    throw err
  }

  // Find user — must match username AND role (same username could theoretically
  // exist across roles since uniqueness is system-wide, but role check adds safety)
  const user = await prisma.user.findUnique({
    where: { username: username.trim() },
  })

  // Always run bcrypt even if user not found — prevents timing attacks
  const dummyHash = '$2a$12$dummyhashtopreventtimingattacks000000000000000000000000'
  const isValid = await bcrypt.compare(
    password,
    user ? user.password_hash : dummyHash
  )

  if (!user || !isValid || !user.is_active || user.role !== role) {
    const err = new Error('Invalid username, role, or password')
    err.status = 401
    throw err
  }

  const token = signToken(user)

  return {
    token,
    user: {
      id:       user.id,
      name:     user.name,
      username: user.username,
      role:     user.role,
    },
  }
}

// ── Register ───────────────────────────────────────────────────
export async function registerUser({ name, username, password, role, inviteCode }) {
  const parsed = registerSchema.safeParse({ name, username, password, role })
  if (!parsed.success) {
    const message = parsed.error.errors?.[0]?.message || 'Invalid request data'
    const err = new Error(message)
    err.status = 400
    throw err
  }
  // Manager accounts require a valid invite code — prevents anyone
  // from self-granting manager access through the public signup form
  if (role=='manager'){
    if (!inviteCode || inviteCode !== process.env.MANAGER_INVITE_CODE){
      const err=new Error('A valid manager invite code is required to create a manager account')
      err.status=403
      throw err
    }
  }

  const existing = await prisma.user.findUnique({
    where: { username: username.trim() },
  })
  if (existing) {
    const err = new Error('This username is already taken')
    err.status = 409
    throw err
  }

  const password_hash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name:     name.trim(),
      username: username.trim(),
      password_hash,
      role,
    },
  })

  const token = signToken(user)

  return {
    token,
    user: {
      id:       user.id,
      name:     user.name,
      username: user.username,
      role:     user.role,
    },
  }
}
// change password
export async function changePassword(userId, currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    const err = new Error('New password must be at least 8 characters')
    err.status = 400
    throw err
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    const err = new Error('Account not found')
    err.status = 404
    throw err
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!isValid) {
    const err = new Error('Current password is incorrect')
    err.status = 401
    throw err
  }

  const password_hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { password_hash } })

  return { message: 'Password updated successfully' }
}