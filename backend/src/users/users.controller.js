import {
  fetchAllUsers,
  fetchDeletedUsers,
  toggleUserActive,
  softDeleteUser,
  restoreUser,
  permanentlyDeleteUser,
} from './users.service.js'

export async function getUsers(req, res, next) {
  try {
    res.json(await fetchAllUsers())
  } catch (err) { next(err) }
}

export async function getTrash(req, res, next) {
  try {
    res.json(await fetchDeletedUsers())
  } catch (err) { next(err) }
}

export async function updateUserStatus(req, res, next) {
  try {
    res.json(await toggleUserActive(req.params.id, req.body.is_active))
  } catch (err) { next(err) }
}

export async function deleteUser(req, res, next) {
  try {
    res.json(await softDeleteUser(req.params.id))
  } catch (err) { next(err) }
}

export async function restoreUserAccount(req, res, next) {
  try {
    res.json(await restoreUser(req.params.id))
  } catch (err) { next(err) }
}

export async function permanentDeleteUser(req, res, next) {
  try {
    res.json(await permanentlyDeleteUser(req.params.id))
  } catch (err) { next(err) }
}