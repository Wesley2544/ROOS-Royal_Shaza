export function isTableSessionValid(tableNumber: string): boolean {
  const storedForTable = sessionStorage.getItem('session_table_number')
  const expiresAt       = sessionStorage.getItem('table_session_expires_at')
  const token            = sessionStorage.getItem('table_session_token')

  if (storedForTable !== tableNumber || !expiresAt || !token) return false
  return new Date(expiresAt).getTime() > Date.now()
}