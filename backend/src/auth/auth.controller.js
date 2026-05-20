import { loginUser, registerUser } from './auth.service.js'

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const result = await loginUser(email, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body
    const result = await registerUser({ name, email, password, role })
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function getMe(req, res) {
  // req.user is set by the auth middleware
  res.json({ user: req.user })
}