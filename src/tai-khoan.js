import { getUser, getRemembered, setUser, clearUser } from './session.js'
import { toast, syncAuthNav, escapeHtml } from './auth-nav.js'
import { FIELD_IMAGES, loadVenues } from './venues.js'
import { mountAssistant, stashIntentForHome } from './ai-assistant.js'
import { BOOKING_KEY, readFields, readJson, readUsers, writeUsers } from './storage.js'

const ACCOUNT_URL = 'tai-khoan.html'
const LOGIN_URL = 'auth.html#login'

const ROLE_LABEL = { player: 'Người chơi', owner: 'Chủ sân' }

const BOOKING_STATUS = {
  pending: { text: 'Chờ xử lý', cls: 'is-pending' },
  confirmed: { text: 'Đã xác nhận', cls: 'is-confirmed' },
  completed: { text: 'Đã hoàn thành', cls: 'is-completed' },
  cancelled: { text: 'Đã hủy', cls: 'is-cancelled' },
}

/** Trạng thái thanh toán: trang thanh-toan.html ghi vào đơn, trang này hiển thị. */
const PAYMENT_STATUS = {
  paid: { text: 'Đã thanh toán', cls: 'is-paid', icon: 'fa-circle-check' },
  unpaid: { text: 'Chưa thanh toán', cls: 'is-unpaid', icon: 'fa-clock' },
  at_venue: { text: 'Trả tại quầy', cls: 'is-at-venue', icon: 'fa-shop' },
  refunded: { text: 'Đã hoàn tiền', cls: 'is-refunded', icon: 'fa-arrow-rotate-left' },
}

/** Mã phương thức do trang thanh toán lưu, đổi sang tên người dùng đọc được. */
const PAYMENT_METHODS = {
  momo: 'Ví MoMo',
  zalopay: 'Ví ZaloPay',
  vnpay: 'VNPay',
  bank: 'Chuyển khoản ngân hàng',
  cash: 'Tiền mặt tại quầy',
}

function isPaid(b) {
  return b.paid === true || b.paymentStatus === 'paid'
}

function paymentState(b) {
  if (b.paymentStatus === 'refunded') return PAYMENT_STATUS.refunded
  if (isPaid(b)) return PAYMENT_STATUS.paid
  return PAYMENT_STATUS[b.paymentStatus] || PAYMENT_STATUS.unpaid
}

/** Dòng mô tả dưới mã đơn: phương thức + thời điểm thanh toán, hoặc thời điểm hoàn tiền. */
function paymentNote(b) {
  if (b.paymentStatus === 'refunded') {
    return b.refundAt ? `Hoàn tiền ${b.refundAt}` : 'Đã hoàn tiền'
  }
  if (!isPaid(b) || !b.paidAt) return ''
  const method = PAYMENT_METHODS[b.paymentMethod] || 'Ví điện tử'
  return `${method} · ${b.paidAt}`
}

/** Danh sách sân để lấy ảnh/địa chỉ hiển thị cho đơn đã đặt. */

const $ = (sel) => document.querySelector(sel)

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

/** Đơn do trang quản trị tạo dùng tên trường fieldId/fieldName, đơn của trang chủ dùng courtId/courtName. */
function bookingCourtId(b) {
  return b.fieldId || b.courtId
}

function venueName(b) {
  if (b.courtName) return b.courtName
  if (b.fieldName) return b.fieldName
  try {
    const fields = readFields()
    const hit = fields.find((f) => courtKey(f.id) === courtKey(bookingCourtId(b)))
    if (hit) return hit.name
  } catch {
    /* bỏ qua */
  }
  return 'Sân bóng đá'
}

function venueAddr(b) {
  try {
    const fields = readFields()
    const hit = fields.find((f) => courtKey(f.id) === courtKey(bookingCourtId(b)))
    return hit?.address || ''
  } catch {
    return ''
  }
}

function venueImg(b) {
  const n = parseInt(String(bookingCourtId(b) || '').replace(/^san-/, ''), 10)
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
  const users = readUsers()
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
  const userId = String(record?.id || '').toLowerCase()
  return list.filter((b) => {
    if (userId && String(b.userId || '').toLowerCase() === userId) return true
    const bEmail = String(b.customer?.email || b.userEmail || '').toLowerCase()
    if (email && bEmail) return bEmail === email
    if (phone) return normalizePhone(b.customer?.phone) === phone
    return false
  })
}

function isUpcoming(b) {
  if (b.status === 'cancelled' || b.status === 'completed' || !b.date) return false
  if (b.date > todayStr()) return true
  if (b.date < todayStr()) return false
  return Number(b.startHour ?? 0) >= new Date().getHours()
}

function bookingCard(b) {
  const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending
  const pay = paymentState(b)
  const payNote = paymentNote(b)
  const court = venueName(b)
  const addr = venueAddr(b)
  const startHour = Number(b.startHour) || 0
  const endHour = Number(b.endHour) > startHour ? Number(b.endHour) : startHour + (Number(b.duration) || 1)
  const contact = [b.customer?.name, b.customer?.phone].filter(Boolean).join(' · ')
  const code = b.id || ''
  // Đơn chưa đóng tiền (hoặc chọn trả tại quầy) thì vẫn thanh toán online được.
  const canPay = code && b.status !== 'cancelled' && !isPaid(b) && b.paymentStatus !== 'refunded'
  const canCancel = ['pending', 'confirmed'].includes(b.status)

  return `
    <article class="hist-item">
      <div class="hist-thumb">
        <img src="${venueImg(b)}" alt="${escapeHtml(court)}" loading="lazy" />
      </div>
      <div class="hist-main">
        <div class="hist-head">
          <h3 class="hist-name">${escapeHtml(court)}</h3>
          <span class="hist-badge ${st.cls}">${st.text}</span>
          <span class="hist-badge ${pay.cls}">
            <i class="fa-solid ${pay.icon}"></i> ${pay.text}
          </span>
        </div>
        <div class="hist-meta">
          <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(formatDate(b.date))}</span>
          <span><i class="fa-regular fa-clock"></i> ${timeLabel(startHour)} – ${timeLabel(endHour)}</span>
          <span><i class="fa-solid fa-tag"></i> ${escapeHtml(b.type || 'Sân bóng')}</span>
          ${addr ? `<span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(addr)}</span>` : ''}
        </div>
        <div class="hist-code">
          Mã đơn <b>${escapeHtml(code)}</b>${contact ? ` · ${escapeHtml(contact)}` : ''}
        </div>
        ${payNote ? `<div class="hist-pay-note"><i class="fa-solid fa-receipt"></i> ${escapeHtml(payNote)}</div>` : ''}
      </div>
      <div class="hist-side">
        <div class="hist-price">${(Number(b.total) || 0).toLocaleString('vi-VN')}đ</div>
        ${
          canPay
            ? `<a class="hist-pay-btn" href="thanh-toan.html?ma=${encodeURIComponent(code)}">
                 <i class="fa-solid fa-wallet"></i> ${
                   b.paymentStatus === 'at_venue' ? 'Thanh toán online' : 'Thanh toán ngay'
                 }
               </a>`
            : ''
        }
        ${
          canCancel
            ? `<button type="button" class="hist-cancel" data-cancel="${escapeHtml(code)}">
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
  if (state.filter === 'completed') return list.filter((b) => b.status === 'completed')
  if (state.filter === 'cancelled') return list.filter((b) => b.status === 'cancelled')
  if (state.filter === 'paid') return list.filter(isPaid)
  if (state.filter === 'unpaid')
    return list.filter((b) => !isPaid(b) && b.status !== 'cancelled' && b.paymentStatus !== 'refunded')
  if (state.filter === 'refunded') return list.filter((b) => b.paymentStatus === 'refunded')
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
  // Tổng chi tiêu là số tiền ĐÃ đóng: đơn huỷ (kể cả đã hoàn tiền) không tính.
  const spent = list.filter(isPaid).reduce((sum, b) => sum + (Number(b.total) || 0), 0)

  $('#accTotal').textContent = String(list.length)
  $('#accUpcoming').textContent = String(list.filter(isUpcoming).length)
  $('#accDone').textContent = String(list.filter((b) => b.status === 'completed').length)
  $('#accSpent').textContent = spent.toLocaleString('vi-VN') + 'đ'
}

/**
 * Đơn đã xác nhận mà qua giờ đá thì tự chuyển sang "Đã hoàn thành", người dùng
 * không phải chờ chủ sân bấm xác nhận sau buổi đá. Chỉ chạm tới đơn của chính
 * người đang đăng nhập và ghi lại vào localStorage chung để trang quản trị
 * thấy cùng trạng thái.
 */
function syncCompleted() {
  const today = todayStr()
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60
  let changed = false

  state.bookings.forEach((b) => {
    if (b.status !== 'confirmed' || !b.date) return
    const end =
      Number(b.endHour) > 0 ? Number(b.endHour) : (Number(b.startHour) || 0) + (Number(b.duration) || 1)
    const past = b.date < today || (b.date === today && end <= nowHour)
    if (!past) return
    b.status = 'completed'
    b.completedAt = new Date().toISOString()
    changed = true
  })

  if (!changed) return
  const all = readJson(BOOKING_KEY, [])
  if (!Array.isArray(all)) return
  state.bookings.forEach((done) => {
    const hit = all.find((b) => b.id === done.id)
    if (hit) {
      hit.status = done.status
      hit.completedAt = done.completedAt
    }
  })
  if (writeJson(BOOKING_KEY, all)) toast('Có đơn đã qua giờ đá nên được đánh dấu Đã hoàn thành.')
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

  const users = readUsers()
  const idx = users.findIndex(
    (u) => String(u.email || '').toLowerCase() === state.user.email.toLowerCase(),
  )
  if (idx !== -1) {
    users[idx].name = name
    users[idx].phone = phone
    if (!writeUsers(users)) return
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
  const booking = list[idx]
  if (!['pending', 'confirmed'].includes(booking.status)) {
    toast('Chỉ huỷ được đơn đang chờ xử lý hoặc đã xác nhận.', 'error')
    return
  }

  const wasPaid = isPaid(booking)
  booking.status = 'cancelled'
  booking.cancelledAt = new Date().toISOString()
  // Đơn đã đóng tiền mà bị huỷ thì chuyển sang trạng thái hoàn tiền cho rõ ràng.
  if (wasPaid) {
    booking.paid = false
    booking.paymentStatus = 'refunded'
    booking.refundAt = new Date().toLocaleString('vi-VN')
  }

  if (!writeJson(BOOKING_KEY, list)) return
  state.bookings = myBookings(state.user, state.record)
  renderStats()
  renderHistory()
  toast(
    wasPaid
      ? `Đã huỷ đơn ${id}, ${(Number(booking.total) || 0).toLocaleString('vi-VN')}đ sẽ được hoàn tiền.`
      : `Đã huỷ đơn ${id}`,
  )
}

function init() {
  const year = $('#year')
  if (year) year.textContent = String(new Date().getFullYear())

  const user = getUser()
  if (!user) {
    window.location.href = LOGIN_URL
    return
  }

  syncAuthNav({ accountUrl: ACCOUNT_URL })

  state.user = user
  state.record = profileRecord(user.email)
  state.bookings = myBookings(user, state.record)
  syncCompleted()
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
    window.location.href = LOGIN_URL
  })

  $('#accSwitch').addEventListener('click', (e) => {
    e.preventDefault()
    clearUser()
    window.location.href = LOGIN_URL
  })

  // Trợ lý đặt sân: hiểu yêu cầu ngay tại đây rồi chuyển sang trang chủ để đặt.
  mountAssistant({
    venues: loadVenues(),
    getBookings: () => readJson(BOOKING_KEY, []),
    getUser,
    onSearch: (intent) => stashIntentForHome(intent, { homeUrl: '../#tim-san' }),
    onBook: (venue, intent) =>
      stashIntentForHome({ ...intent, venueId: venue?.id || '' }, { homeUrl: '../#tim-san' }),
  })
}

document.addEventListener('DOMContentLoaded', init)