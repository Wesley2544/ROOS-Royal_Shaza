import { z } from 'zod'
import prisma from '../lib/prisma.js'

const VALID_STATUSES = ['free', 'ordering', 'waiting', 'served']

const statusSchema = z.object({
  status: z.enum(['free', 'ordering', 'waiting', 'served'], {
    errorMap: () => ({
      message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
    })
  })
})

function notFound(item) {
  const err = new Error(`${item} not found`)
  err.status = 404
  throw err
}

export async function fetchAllTables() {
  return prisma.restaurantTable.findMany({
    orderBy: { table_number: 'asc' },
    include: {
      orders: {
        where:   { status: { not: 'served' } },
        select:  { id: true, status: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 1,
      }
    }
  })
}

export async function fetchTableByNumber(tableNumber) {
  const table = await prisma.restaurantTable.findUnique({
    where: { table_number: tableNumber },
    include: {
      orders: {
        where:   { status: { not: 'served' } },
        include: { items: true },
        orderBy: { created_at: 'desc' },
        take: 1,
      }
    }
  })
  if (!table) notFound('Table')
  return table
}

export async function changeTableStatus(id, status) {
  const parsed = statusSchema.safeParse({ status })
  if (!parsed.success) {
    const err = new Error(parsed.error.errors[0].message)
    err.status = 400
    throw err
  }

  const table = await prisma.restaurantTable.findUnique({ where: { id } })
  if (!table) notFound('Table')

  return prisma.restaurantTable.update({
    where: { id },
    data:  { status },
  })
}