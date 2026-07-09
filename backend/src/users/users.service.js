import prisma from '../lib/prisma.js'

export async function fetchAllUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true, is_active: true, created_at: true },
    orderBy: { created_at: 'asc' },
  })
}

export async function toggleUserActive(id, is_active) {
  if (typeof is_active !== 'boolean') {
    const err = new Error('is_active must be true or false')
    err.status = 400
    throw err
  }
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    const err = new Error('Staff account not found')
    err.status = 404
    throw err
  }
  return prisma.user.update({
    where: { id },
    data: { is_active },
    select: { id: true, name: true, username: true, role: true, is_active: true },
  })
}