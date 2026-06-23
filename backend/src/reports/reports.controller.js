import { fetchSummary } from './reports.service.js'

export async function getSummary(req, res, next) {
  try {
    const data = await fetchSummary()
    res.json(data)
  } catch (err) { next(err) }
}