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
  if (typeof window !== 'undefined' && window.SV?.currentUser) {
    const cur = window.SV.currentUser()
    if (cur) return cur
  }
  const user = readRaw(REMEMBER_KEY) || readRaw(SESSION_KEY)
  if (!user || typeof user !== 'object') return null
  if (!user.email && !user.name && !user.phone) return null
  return {
    id: user.id || '',
    email: user.email || '',
    name: user.name || user.email || 'Thành viên 4SV',
    phone: user.phone || '',
    role: user.role || 'player',
    avatar: user.avatar || '',
  }
}

export function isLoggedIn() {
  return getUser() !== null
}

export function getRemembered() {
  return readRaw(REMEMBER_KEY)
}

export function setUser(user, remember = false) {
  if (typeof window !== 'undefined' && window.SV?.signIn) {
    return window.SV.signIn(user, remember)
  }
  const payload = {
    id: user.id || '',
    email: user.email || '',
    name: user.name || user.email || 'Thành viên 4SV',
    phone: user.phone || '',
    role: user.role || 'player',
    avatar: user.avatar || '',
    at: Date.now(),
  }
  clearUser()
  try {
    localStorage.setItem(remember ? REMEMBER_KEY : SESSION_KEY, JSON.stringify(payload))
  } catch {
    /* storage bị chặn - bỏ qua */
  }
  return payload
}

export function clearUser() {
  if (typeof window !== 'undefined' && window.SV?.signOut) {
    window.SV.signOut()
    return
  }
  try {
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage bị chặn - bỏ qua */
  }
}