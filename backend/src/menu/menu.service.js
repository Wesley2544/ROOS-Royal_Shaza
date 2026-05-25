import { z } from 'zod'
import prisma from '../lib/prisma.js'

//  Validation schemas
const itemSchema = z.object({
  category_id:  z.string().uuid('Invalid category ID'),
  name:         z.string().min(2).max(120),
  description:  z.string().optional(),
  price:        z.number().int().positive('Price must be a positive integer in KES cents'),
  dietary_tags: z.array(z.string()).default([]),
  image_url:    z.string().url().optional().or(z.literal('')),
})

const categorySchema = z.object({
  name:       z.string().min(2).max(80),
  sort_order: z.number().int().default(0),
})

//  Helper: throw a clean 404 error 
function notFound(item) {
  const err = new Error(`${item} not found`)
  err.status = 404
  throw err
}

// Categories 
export async function fetchCategories() {
  return prisma.menuCategory.findMany({
    where:   { is_active: true },
    orderBy: { sort_order: 'asc' },
    include: {
      _count: { select: { items: { where: { is_available: true, is_deleted: false } } } }
    },
  })
}

export async function addCategory(body) {
  const parsed = categorySchema.safeParse(body)
  if (!parsed.success) {
    const err = new Error(parsed.error.errors[0].message)
    err.status = 400
    throw err
  }
  return prisma.menuCategory.create({ data: parsed.data })
}

export async function editCategory(id, body) {
  const existing = await prisma.menuCategory.findUnique({ where: { id } })
  if (!existing) notFound('Category')
  const parsed = categorySchema.partial().safeParse(body)
  if (!parsed.success) {
    const err = new Error(parsed.error.errors[0].message)
    err.status = 400
    throw err
  }
  return prisma.menuCategory.update({ where: { id }, data: parsed.data })
}

// Menu items
export async function fetchItems(category_id) {
  return prisma.menuItem.findMany({
    where: {
      is_deleted:  false,
      is_available: true,
      ...(category_id ? { category_id } : {}),
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function fetchItemById(id) {
  const item = await prisma.menuItem.findFirst({
    where:   { id, is_deleted: false },
    include: { category: { select: { id: true, name: true } } },
  })
  if (!item) notFound('Menu item')
  return item
}

export async function addItem(body) {
  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) {
    const err = new Error(parsed.error.errors[0].message)
    err.status = 400
    throw err
  }
  // Confirm category exists
  const cat = await prisma.menuCategory.findUnique({
    where: { id: parsed.data.category_id }
  })
  if (!cat) notFound('Category')
  return prisma.menuItem.create({ data: parsed.data })
}

export async function editItem(id, body) {
  const existing = await prisma.menuItem.findFirst({
    where: { id, is_deleted: false }
  })
  if (!existing) notFound('Menu item')
  const parsed = itemSchema.partial().safeParse(body)
  if (!parsed.success) {
    const err = new Error(parsed.error.errors[0].message)
    err.status = 400
    throw err
  }
  return prisma.menuItem.update({ where: { id }, data: parsed.data })
}

export async function setAvailability(id, is_available) {
  if (typeof is_available !== 'boolean') {
    const err = new Error('is_available must be true or false')
    err.status = 400
    throw err
  }
  const existing = await prisma.menuItem.findFirst({
    where: { id, is_deleted: false }
  })
  if (!existing) notFound('Menu item')
  return prisma.menuItem.update({ where: { id }, data: { is_available } })
}

export async function removeItem(id) {
  const existing = await prisma.menuItem.findFirst({
    where: { id, is_deleted: false }
  })
  if (!existing) notFound('Menu item')
  // Soft delete — never permanently remove
  await prisma.menuItem.update({ where: { id }, data: { is_deleted: true } })
  return { message: 'Item removed from menu' }
}