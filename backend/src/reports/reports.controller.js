import { fetchSummary } from './reports.service.js'

export async function getSummary(req, res, next) {
  try {
    const range = ['today', 'week', 'month'].includes(req.query.range) ? req.query.range : 'today'
    const data = await fetchSummary(range)
    res.json(data)
  } catch (err) { next(err) }
}