import { fetchAllUsers, toggleUserActive } from './users.service.js'

export async function getUsers(req, res, next) {
  try {
    res.json(await fetchAllUsers())
  } catch (err) { next(err) }
}

export async function updateUserStatus(req, res, next) {
  try {
    res.json(await toggleUserActive(req.params.id, req.body.is_active))
  } catch (err) { next(err) }
}