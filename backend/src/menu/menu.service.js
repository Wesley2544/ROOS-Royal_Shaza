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
  name: z.string().min(1, 'Category name is required').max(60, 'Category name is too long'),
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

export async function createCategory({ name }) {
  const parsed = categorySchema.safeParse({ name })
  if (!parsed.success) {
    const message = parsed.error.errors?.[0]?.message || parsed.error.issues?.[0]?.message || 'Invalid request data'
    const err = new Error(message)
    err.status = 400
    throw err
  }

  const existing = await prisma.menuCategory.findFirst({
    where: { name: { equals: name.trim(), mode: 'insensitive' }, is_active: true },
  })
  if (existing) {
    const err = new Error('A category with this name already exists')
    err.status = 409
    throw err
  }

  const maxSort = await prisma.menuCategory.aggregate({
    _max: { sort_order: true },
    where: { is_active: true },
  })
  const nextSortOrder = (maxSort._max.sort_order ?? 0) + 1

  return prisma.menuCategory.create({
    data: { name: name.trim(), sort_order: nextSortOrder, is_active: true },
  })
}

export async function addCategory(body) {
  return createCategory(body)
}

export async function editCategory(id, { name }) {
  const parsed = categorySchema.safeParse({ name })
  if (!parsed.success) {
    const message = parsed.error.errors?.[0]?.message || parsed.error.issues?.[0]?.message || 'Invalid request data'
    const err = new Error(message)
    err.status = 400
    throw err
  }

  const category = await prisma.menuCategory.findUnique({ where: { id } })
  if (!category || !category.is_active) {
    const err = new Error('Category not found')
    err.status = 404
    throw err
  }

  const duplicate = await prisma.menuCategory.findFirst({
    where: { name: { equals: name.trim(), mode: 'insensitive' }, is_active: true, NOT: { id } },
  })
  if (duplicate) {
    const err = new Error('A category with this name already exists')
    err.status = 409
    throw err
  }

  return prisma.menuCategory.update({ where: { id }, data: { name: name.trim() } })
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
    const message = parsed.error.errors?.[0].message || 'Invalid request data'
    const err = new Error(message)
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
    const message = parsed.error.errors?.[0].message || 'Invalid request data'
    const err = new Error(message)
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
