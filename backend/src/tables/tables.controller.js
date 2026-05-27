import {
  fetchAllTables,
  fetchTableByNumber,
  changeTableStatus,
} from './tables.service.js'

export async function getAllTables(req, res, next) {
  try {
    const data = await fetchAllTables()
    res.json(data)
  } catch (err) { next(err) }
}

export async function getTableByNumber(req, res, next) {
  try {
    const data = await fetchTableByNumber(parseInt(req.params.number))
    res.json(data)
  } catch (err) { next(err) }
}

export async function updateTableStatus(req, res, next) {
  try {
    const data = await changeTableStatus(
      req.params.id,
      req.body.status
    )
    res.json(data)
  } catch (err) { next(err) }
}