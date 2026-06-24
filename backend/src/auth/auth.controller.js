import { loginUser, registerUser } from './auth.service.js'

export async function login(req, res, next) {
  try {
    const { username, password, role } = req.body
    const result = await loginUser(username, password, role)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function register(req, res, next) {
  try {
    const { name, username, password, role } = req.body
    const result = await registerUser({ name, username, password, role })
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function getMe(req, res) {
  res.json({ user: req.user })
}