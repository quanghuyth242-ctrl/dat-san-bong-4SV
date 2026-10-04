import { getUser, getRemembered, setUser, clearUser } from './session.js'
import { toast, syncAuthNav, escapeHtml } from './auth-nav.js'

const USERS_KEY = '4sv_auth_users'
const BOOKING_KEY = '4sv_bookings'
const ACCOUNT_URL = 'tai-khoan.html'
const LOGIN_URL = 'auth.html#login'

const ROLE_LABEL = { player: 'Người chơi', owner: 'Chủ sân' }

const BOOKING_STATUS = {
  pending: { text: 'Chờ xử lý', cls: 'is-pending' },
  confirmed: { text: 'Đã xác nhận', cls: 'is-confirmed' },
  completed: { text: 'Đã hoàn thành', cls: 'is-completed' },
  cancelled: { text: 'Đã hủy', cls: 'is-cancelled' },
}

/** Danh sách sân để lấy ảnh/địa chỉ hiển thị cho đơn đã đặt. */
const FIELD_IMAGES = [
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&q=75',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=75',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&q=75',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&q=75',
]

const $ = (sel) => document.querySelector(sel)

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    toast('Không lưu được dữ liệu, trình duyệt có thể đang chặn lưu trữ.', 'error')
    return false
  }
}

/** Chuẩn hoá mã sân về 'san-N' để đơn cũ (dùng số) và đơn mới cùng nhận diện. */
function courtKey(id) {
  const raw = String(id)
  const n = parseInt(raw.replace(/^san-/, ''), 10)
  return Number.isFinite(n) ? 'san-' + n : raw
}

function venueName(b) {
  if (b.courtName) return b.courtName
  try {
    const fields = readJson('admin_fields', [])
    const hit = fields.find((f) => courtKey(f.id) === courtKey(b.courtId))
    if (hit) return hit.name
  } catch {
    /* bỏ qua */
  }
  return 'Sân bóng đá'
}

function venueAddr(b) {
  try {
    const fields = readJson('admin_fields', [])
    const hit = fields.find((f) => courtKey(f.id) === courtKey(b.courtId))
    return hit?.address || ''
  } catch {
    return ''
  }
}

function venueImg(b) {
  const n = parseInt(String(b.courtId || '').replace(/^san-/, ''), 10)
  return FIELD_IMAGES[(Number.isFinite(n) ? n - 1 : 0) % FIELD_IMAGES.length]
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').replace(/^84/, '0')
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeLabel(h) {
  const hh = Math.floor(Number(h) || 0)
  const mm = Math.round(((Number(h) || 0) - hh) * 60)
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
}

function formatDate(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value || ''
}

/** Hồ sơ đầy đủ trong danh sách tài khoản (có SĐT, ngày tạo). */
function profileRecord(email) {
  const users = readJson(USERS_KEY, [])
  if (!Array.isArray(users)) return null
  return (
    users.find(
      (u) => String(u.email || '').toLowerCase() === String(email || '').toLowerCase(),
    ) || null
  )
}

/** Đơn của người đang đăng nhập: ưu tiên khớp email, đơn cũ chỉ có SĐT thì khớp theo SĐT. */
function myBookings(user, record) {
  const email = String(user.email || '').toLowerCase()
  const phone = normalizePhone(user.phone || record?.phone)
  const list = readJson(BOOKING_KEY, [])
  if (!Array.isArray(list)) return []
  return list.filter((b) => {
    const bEmail = String(b.customer?.email || b.userEmail || '').toLowerCase()
    if (email && bEmail) return bEmail === email
    if (phone) return normalizePhone(b.customer?.phone) === phone
    return false
  })
}

function isUpcoming(b) {
  if (b.status === 'cancelled' || !b.date) return false
  if (b.date > todayStr()) return true
  if (b.date < todayStr()) return false
  return Number(b.startHour ?? 0) >= new Date().getHours()
}

function bookingCard(b) {
  const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending
  const court = venueName(b)
  const addr = venueAddr(b)
  const startHour = Number(b.startHour) || 0
  const endHour = Number(b.endHour) > startHour ? Number(b.endHour) : startHour + (Number(b.duration) || 1)
  const contact = [b.customer?.name, b.customer?.phone].filter(Boolean).join(' · ')

  return `
    <article class="hist-item">
      <div class="hist-thumb">
        <img src="${venueImg(b)}" alt="${escapeHtml(court)}" loading="lazy" />
      </div>
      <div class="hist-main">
        <div class="hist-head">
          <h3 class="hist-name">${escapeHtml(court)}</h3>
          <span class="hist-badge ${st.cls}">${st.text}</span>
        </div>
        <div class="hist-meta">
          <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(formatDate(b.date))}</span>
          <span><i class="fa-regular fa-clock"></i> ${timeLabel(startHour)} – ${timeLabel(endHour)}</span>
          <span><i class="fa-solid fa-tag"></i> ${escapeHtml(b.type || 'Sân bóng')}</span>
          ${addr ? `<span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(addr)}</span>` : ''}
        </div>
        <div class="hist-code">
          Mã đơn <b>${escapeHtml(b.id || '')}</b>${contact ? ` · ${escapeHtml(contact)}` : ''}
        </div>
      </div>
      <div class="hist-side">
        <div class="hist-price">${(Number(b.total) || 0).toLocaleString('vi-VN')}đ</div>
        ${
          b.status === 'pending'
            ? `<button type="button" class="hist-cancel" data-cancel="${escapeHtml(b.id || '')}">
                 <i class="fa-solid fa-xmark"></i> Huỷ đặt sân
               </button>`
            : ''
        }
      </div>
    </article>
  `
}

const state = { user: null, record: null, bookings: [], filter: 'all' }

function visibleBookings() {
  const list = [...state.bookings].sort((a, b) => {
    const key = (x) => `${x.date || ''} ${String(Math.floor(Number(x.startHour) || 0)).padStart(2, '0')}`
    return key(b).localeCompare(key(a))
  })
  if (state.filter === 'upcoming') return list.filter(isUpcoming)
  if (state.filter === 'pending') return list.filter((b) => b.status === 'pending')
  if (state.filter === 'cancelled') return list.filter((b) => b.status === 'cancelled')
  return list
}

function renderProfile() {
  const { user, record } = state
  const name = user.name || user.email

  $('#accAvatar').textContent = name.trim().charAt(0).toUpperCase()
  $('#accName').textContent = name
  $('#accMail').textContent = user.email
  $('#accRole').textContent = ROLE_LABEL[user.role] || 'Người chơi'
  $('#accPhone').textContent = user.phone || record?.phone || 'Chưa cập nhật'

  const created = record?.createdAt || user.at
  $('#accSince').textContent = created
    ? formatDate(String(created).slice(0, 10))
    : 'Chưa có thông tin'

  $('#accRemember').textContent = getRemembered() ? 'Ghi nhớ' : 'Chỉ phiên này'

  $('#accFormName').value = name
  $('#accFormPhone').value = user.phone || record?.phone || ''
  $('#accFormMail').value = user.email
  $('#accFormRemember').checked = Boolean(getRemembered())
}

function renderStats() {
  const list = state.bookings
  const spent = list
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.total) || 0), 0)

  $('#accTotal').textContent = String(list.length)
  $('#accUpcoming').textContent = String(list.filter(isUpcoming).length)
  $('#accDone').textContent = String(list.filter((b) => b.status === 'completed').length)
  $('#accSpent').textContent = spent.toLocaleString('vi-VN') + 'đ'
}

function renderHistory() {
  const wrap = $('#historyList')
  const list = visibleBookings()

  if (!state.bookings.length) {
    wrap.innerHTML = `
      <div class="hist-empty">
        <div class="empty-icon-4sv"><i class="fa-solid fa-calendar-check"></i></div>
        <h3>Bạn chưa có đơn đặt sân nào</h3>
        <p>Đặt sân đầu tiên ngay hôm nay, lịch sử sẽ hiển thị ở đây.</p>
        <a href="../#tim-san" class="btn btn-light-dark">
          <i class="fa-solid fa-magnifying-glass"></i> Tìm sân ngay
        </a>
      </div>`
    return
  }

  wrap.innerHTML = list.length
    ? list.map(bookingCard).join('')
    : `<div class="hist-empty">
         <div class="empty-icon-4sv"><i class="fa-solid fa-filter-circle-xmark"></i></div>
         <h3>Không có đơn nào ở mục này</h3>
         <p>Chọn bộ lọc khác để xem toàn bộ lịch sử đặt sân của bạn.</p>
       </div>`
}

function refresh() {
  renderProfile()
  renderStats()
  renderHistory()
}

function setErr(field, message) {
  const el = document.querySelector(`[data-err="${field}"]`)
  if (el) el.textContent = message
  document.getElementById('accForm' + field.charAt(0).toUpperCase() + field.slice(1))
    ?.closest('.acc-field')
    ?.classList.toggle('invalid', Boolean(message))
}

function saveProfile(e) {
  e.preventDefault()
  const name = $('#accFormName').value.trim()
  const phone = $('#accFormPhone').value.trim().replace(/[\s.-]/g, '')

  const nameOk = name.length >= 2
  const phoneOk = phone === '' || /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone)

  setErr('name', nameOk ? '' : 'Vui lòng nhập họ tên (tối thiểu 2 ký tự).')
  setErr(
    'phone',
    phoneOk ? '' : 'Số điện thoại không hợp lệ (VD: 0912345678).',
  )
  if (!nameOk || !phoneOk) return

  const users = readJson(USERS_KEY, [])
  if (Array.isArray(users)) {
    const idx = users.findIndex(
      (u) => String(u.email || '').toLowerCase() === state.user.email.toLowerCase(),
    )
    if (idx !== -1) {
      users[idx].name = name
      users[idx].phone = phone
      if (!writeJson(USERS_KEY, users)) return
    }
  }

  setUser(
    { email: state.user.email, name, phone, role: state.user.role },
    $('#accFormRemember').checked,
  )

  state.user = getUser()
  state.record = profileRecord(state.user.email)
  refresh()
  syncAuthNav({ accountUrl: ACCOUNT_URL })
  toast('Đã cập nhật thông tin tài khoản')
}

function cancelBooking(id) {
  const list = readJson(BOOKING_KEY, [])
  if (!Array.isArray(list)) return
  const idx = list.findIndex((b) => b.id === id)
  if (idx === -1) return
  if (list[idx].status !== 'pending') {
    toast('Chỉ huỷ được đơn đang chờ xử lý.', 'error')
    return
  }
  list[idx].status = 'cancelled'
  list[idx].cancelledAt = new Date().toISOString()
  if (!writeJson(BOOKING_KEY, list)) return
  state.bookings = myBookings(state.user, state.record)
  renderStats()
  renderHistory()
  toast(`Đã huỷ đơn ${id}`)
}

function init() {
  const year = $('#year')
  if (year) year.textContent = String(new Date().getFullYear())

  const user = getUser()
  if (!user) {
    window.location.replace(LOGIN_URL)
    return
  }

  syncAuthNav({ accountUrl: ACCOUNT_URL })

  state.user = user
  state.record = profileRecord(user.email)
  state.bookings = myBookings(user, state.record)
  refresh()

  $('#profileForm').addEventListener('submit', saveProfile)
  ;['accFormName', 'accFormPhone'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      setErr(id === 'accFormName' ? 'name' : 'phone', '')
      e.target.closest('.acc-field')?.classList.remove('invalid')
    })
  })

  $('#historyList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]')
    if (btn) cancelBooking(btn.dataset.cancel)
  })

  $('#accFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]')
    if (!btn) return
    state.filter = btn.dataset.filter
    $('#accFilters')
      .querySelectorAll('[data-filter]')
      .forEach((chip) => chip.classList.toggle('is-active', chip === btn))
    renderHistory()
  })

  $('#accLogout').addEventListener('click', () => {
    clearUser()
    window.location.replace(LOGIN_URL)
  })

  $('#accSwitch').addEventListener('click', (e) => {
    e.preventDefault()
    clearUser()
    window.location.replace(LOGIN_URL)
  })
}

document.addEventListener('DOMContentLoaded', init)