/**
 * Khoá dữ liệu dùng chung giữa trang chủ, trang tài khoản và trang quản trị.
 *
 * Trang quản trị mới lưu dưới khoá 4sv_* và khi chạy lần đầu sẽ migrate rồi
 * xoá luôn khoá cũ (admin_fields, admin_users, 4sv_auth_users). Nếu chỉ đọc
 * khoá cũ thì sau khi admin đã migrate là mất tên sân và thông tin người dùng,
 * nên mọi thao tác đọc đều thử khoá mới trước rồi mới tới khoá cũ.
 */

export const FIELD_KEYS = ['4sv_fields', 'admin_fields']
export const USER_KEYS = ['4sv_users', '4sv_auth_users', 'admin_users']
export const BOOKING_KEY = '4sv_bookings'

/** Đọc một khoá trong localStorage, JSON hỏng thì trả về giá trị dự phòng. */
export function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const value = JSON.parse(raw)
    return value === null ? fallback : value
  } catch {
    return fallback
  }
}

/** Ghi một khoá trong localStorage; trả false nếu trình duyệt chặn lưu trữ. */
export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Lấy mảng đầu tiên còn dữ liệu trong danh sách khoá (khoá mới đứng trước). */
export function readList(keys, fallback = []) {
  for (const key of keys) {
    const value = readJson(key, null)
    if (Array.isArray(value) && value.length > 0) return value
  }
  return fallback
}

/** Danh sách sân do quản trị đăng. */
export function readFields() {
  return readList(FIELD_KEYS, [])
}

/** Danh sách tài khoản: khoá của trang quản trị mới được thử trước. */
export function readUsers() {
  return readList(USER_KEYS, [])
}

/** Ghi danh sách sân vào khoá mới để trang quản trị đọc được. */
export function writeFields(fields) {
  return writeJson(FIELD_KEYS[0], fields)
}

/** Ghi danh sách tài khoản vào khoá mới để trang quản trị đọc được. */
export function writeUsers(users) {
  return writeJson(USER_KEYS[0], users)
}