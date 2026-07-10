import prisma from '../lib/prisma.js'

export async function fetchAllUsers() {
  return prisma.user.findMany({
    where: { is_deleted: false },
    select: { id: true, name: true, username: true, role: true, is_active: true, created_at: true },
    orderBy: { created_at: 'asc' },
  })
}

export async function fetchDeletedUsers() {
  return prisma.user.findMany({
    where: { is_deleted: true },
    select: { id: true, name: true, username: true, role: true, deleted_at: true },
    orderBy: { deleted_at: 'desc' },
  })
}

export async function toggleUserActive(id, is_active) {
  if (typeof is_active !== 'boolean') {
    const err = new Error('is_active must be true or false')
    err.status = 400
    throw err
  }
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.is_deleted) {
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

export async function softDeleteUser(id) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.is_deleted) {
    const err = new Error('Staff account not found')
    err.status = 404
    throw err
  }
  if (user.role === 'manager') {
    const err = new Error('Manager accounts cannot be deleted here. Deactivate instead.')
    err.status = 403
    throw err
  }
  await prisma.user.update({
    where: { id },
    data: { is_deleted: true, deleted_at: new Date(), is_active: false },
  })
  return { message: 'Staff account moved to trash' }
}

export async function restoreUser(id) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || !user.is_deleted) {
    const err = new Error('Deleted account not found')
    err.status = 404
    throw err
  }
  return prisma.user.update({
    where: { id },
    data: { is_deleted: false, deleted_at: null },
    select: { id: true, name: true, username: true, role: true, is_active: true },
  })
}

export async function permanentlyDeleteUser(id) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || !user.is_deleted) {
    const err = new Error('This account must be in the trash before it can be permanently deleted')
    err.status = 400
    throw err
  }
  const ordersServed = await prisma.order.count({ where: { waiter_id: id } })
  if (ordersServed > 0) {
    const err = new Error(
      `This account has served ${ordersServed} order${ordersServed === 1 ? '' : 's'} and can't be permanently deleted — its order history would be lost. It will remain safely in the trash.`
    )
    err.status = 409
    throw err
  }
  await prisma.user.delete({ where: { id } })
  return { message: 'Staff account permanently deleted' }
}