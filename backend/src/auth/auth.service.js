import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import prisma from '../lib/prisma.js'

// ── Validation schemas ────────────
const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(120),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role:     z.enum(['kitchen', 'waiter', 'manager'], {
    errorMap: () => ({ message: 'Role must be kitchen, waiter, or manager' }),
  }),
})

// ── Token helper ─────────
function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  )
}

// ── Login ─────────
export async function loginUser(email, password) {
  // 1. Validate input
  const parsed = loginSchema.safeParse({ email, password })
  if (!parsed.success) {
    const err = new Error(parsed.error.errors[0].message)
    err.status = 400
    throw err
  }

  // 2. Find user — use generic error to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  // 3. Compare password (always run bcrypt even if user not found)
  const dummyHash = '$2a$12$dummyhashtopreventtimingattacks000000000000000000000000'
  const isValid = await bcrypt.compare(
    password,
    user ? user.password_hash : dummyHash
  )

  if (!user || !isValid || !user.is_active) {
    const err = new Error('Invalid email or password')
    err.status = 401
    throw err
  }

  // 4. Sign token
  const token = signToken(user)

  return {
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  }
}

// ── Register ─────────
export async function registerUser({ name, email, password, role }) {
  // 1. Validate input
  const parsed = registerSchema.safeParse({ name, email, password, role })
  if (!parsed.success) {
    const err = new Error(parsed.error.errors[0].message)
    err.status = 400
    throw err
  }

  // 2. Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  if (existing) {
    const err = new Error('An account with this email already exists')
    err.status = 409
    throw err
  }

  // 3. Hash password — cost factor 12 (production standard)
  const password_hash = await bcrypt.hash(password, 12)

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      name:          name.trim(),
      email:         email.toLowerCase().trim(),
      password_hash,
      role,
    },
  })

  // 5. Sign token
  const token = signToken(user)

  return {
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  }
}