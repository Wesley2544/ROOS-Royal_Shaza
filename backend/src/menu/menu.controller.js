import {
  fetchCategories,
  fetchItems,
  fetchItemById,
  addItem,
  editItem,
  setAvailability,
  removeItem,
  addCategory,
  editCategory,
} from './menu.service.js'

export async function getCategories(req, res, next) {
  try {
    const data = await fetchCategories()
    res.json(data)
  } catch (err) { next(err) }
}

export async function getItems(req, res, next) {
  try {
    const { category_id } = req.query
    const data = await fetchItems(category_id)
    res.json(data)
  } catch (err) { next(err) }
}

export async function getItemById(req, res, next) {
  try {
    const data = await fetchItemById(req.params.id)
    res.json(data)
  } catch (err) { next(err) }
}

export async function createItem(req, res, next) {
  try {
    const data = await addItem(req.body)
    res.status(201).json(data)
  } catch (err) { next(err) }
}

export async function updateItem(req, res, next) {
  try {
    const data = await editItem(req.params.id, req.body)
    res.json(data)
  } catch (err) { next(err) }
}

export async function toggleAvailability(req, res, next) {
  try {
    const data = await setAvailability(req.params.id, req.body.is_available)
    res.json(data)
  } catch (err) { next(err) }
}

export async function deleteItem(req, res, next) {
  try {
    const data = await removeItem(req.params.id)
    res.json(data)
  } catch (err) { next(err) }
}

export async function createCategory(req, res, next) {
  try {
    const data = await addCategory(req.body)
    res.status(201).json(data)
  } catch (err) { next(err) }
}

export async function updateCategory(req, res, next) {
  try {
    const data = await editCategory(req.params.id, req.body)
    res.json(data)
  } catch (err) { next(err) }
}