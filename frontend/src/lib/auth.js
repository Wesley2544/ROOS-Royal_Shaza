export function saveAuth(token, user) {
  sessionStorage.setItem('roos_token', token)
  sessionStorage.setItem('roos_user', JSON.stringify(user))
}
export function getUser() {
  if (typeof window === 'undefined') return null
  try {
    const user = sessionStorage.getItem('roos_user')
    return user ? JSON.parse(user) : null
  } catch { return null }
}
export function getToken() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('roos_token')
}
export function clearAuth() {
  sessionStorage.removeItem('roos_token')
  sessionStorage.removeItem('roos_user')
}
export function hasRole(role) {
  return getUser()?.role === role
}
export function getHomeByRole(role) {
  const paths = { kitchen: '/kitchen', waiter: '/waiter', manager: '/manager' }
  return paths[role] || '/login'
}