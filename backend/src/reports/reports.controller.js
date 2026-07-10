import { fetchSummary } from './reports.service.js'

export async function getSummary(req, res, next) {
  try {
    const range = ['today', 'week', 'month'].includes(req.query.range) ? req.query.range : 'today'
    res.json(await fetchSummary(range))
  } catch (err) { next(err) }
}