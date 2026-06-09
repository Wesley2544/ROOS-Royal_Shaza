// Save auth data after login
export function saveAuth(token, user) {
  localStorage.setItem('roos_token', token)
  localStorage.setItem('roos_user', JSON.stringify(user))
}

// Get current user from localStorage
export function getUser() {
  if (typeof window === 'undefined') return null
  try {
    const user = localStorage.getItem('roos_user')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}

// Get current token
export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('roos_token')
}

// Clear auth data on logout
export function clearAuth() {
  localStorage.removeItem('roos_token')
  localStorage.removeItem('roos_user')
}

// Check if user has a specific role
export function hasRole(role) {
  const user = getUser()
  return user?.role === role
}

// Redirect path based on role after login
export function getHomeByRole(role) {
  const paths = {
    kitchen: '/kitchen',
    waiter:  '/waiter',
    manager: '/manager',
  }
  return paths[role] || '/login'
}