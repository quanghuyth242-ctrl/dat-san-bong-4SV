const SESSION_KEY = '4sv_auth_session'
const REMEMBER_KEY = '4sv_auth_remember'

function readRaw(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getUser() {
  const user = readRaw(REMEMBER_KEY) || readRaw(SESSION_KEY)
  if (!user || typeof user !== 'object') return null
  if (!user.email && !user.name) return null
  return {
    email: user.email || '',
    name: user.name || user.email || '',
    phone: user.phone || '',
    role: user.role || 'player',
  }
}

export function isLoggedIn() {
  return getUser() !== null
}

export function getRemembered() {
  return readRaw(REMEMBER_KEY)
}

export function setUser(user, remember = false) {
  const payload = {
    email: user.email || '',
    name: user.name || user.email || '',
    phone: user.phone || '',
    role: user.role || 'player',
    at: Date.now(),
  }
  clearUser()
  try {
    localStorage.setItem(remember ? REMEMBER_KEY : SESSION_KEY, JSON.stringify(payload))
  } catch {
    /* storage bị chặn - bỏ qua */
  }
}

export function clearUser() {
  try {
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage bị chặn - bỏ qua */
  }
}