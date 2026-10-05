/**
 * Panel "Tài khoản của tôi" trong src/auth.html: thông tin cá nhân + lịch sử
 * đặt sân. Mọi đọc/ghi đều đi qua store chung (SV) nên người dùng sửa ở đây
 * thì trang quản trị và trang chủ thấy ngay, không phải đăng nhập lại.
 */

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

const STATUS = {
  pending: { text: 'Chờ xử lý', cls: 'is-pending' },
  confirmed: { text: 'Đã xác nhận', cls: 'is-confirmed' },
  completed: { text: 'Đã hoàn thành', cls: 'is-completed' },
  cancelled: { text: 'Đã huỷ', cls: 'is-cancelled' },
}

const ROLE = {
  player: 'Người chơi',
  owner: 'Chủ sân',
  admin: 'Quản trị viên',
}

/** Trạng thái cho phép người dùng tự huỷ (đơn đã hoàn thành thì giữ lại). */
const CANCELLED_BY_USER = ['pending', 'confirmed']

const state = { user: null, bookings: [], filter: 'all' }
let notify = () => {}

const digits = (v) => String(v || '').replace(/\D/g, '')
const esc = (v) => SV.escape(v)

function todayStr() {
  return SV.todayStr()
}

function isUpcoming(b) {
  if (b.status === 'cancelled' || b.status === 'completed' || !b.date) return false
  if (b.date > todayStr()) return true
  if (b.date < todayStr()) return false
  return Number(b.startHour || 0) >= new Date().getHours()
}

function timeLabel(hour) {
  return SV.hourToHHMM(hour)
}

function formatDate(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value || ''
}

function createdLabel(value) {
  if (!value) return '—'
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? formatDate(value) : String(value)
}

/** Đơn của riêng người đang đăng nhập: ưu tiên userId, đơn cũ chỉ có SĐT thì khớp SĐT. */
function myBookings(user) {
  if (!user) return []
  const email = String(user.email || '').trim().toLowerCase()
  const phone = digits(user.phone)
  return SV.bookings().filter((b) => {
    if (user.id && b.userId && b.userId === user.id) return true
    const bEmail = String(b.customer?.email || '').trim().toLowerCase()
    if (email && bEmail) return bEmail === email
    if (phone && digits(b.customer?.phone)) return digits(b.customer.phone) === phone
    return false
  })
}

function sortBookings(list, upcomingFirst) {
  const dir = upcomingFirst ? 1 : -1
  return list.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -dir : dir
    return (Number(a.startHour) - Number(b.startHour)) * dir
  })
}

function statsHtml(list) {
  const total = list.length
  const upcoming = list.filter(isUpcoming).length
  const done = list.filter((b) => b.status === 'completed').length
  const cancelled = list.filter((b) => b.status === 'cancelled').length
  return `
    <span class="acc-stat"><b>${total}</b> đơn</span>
    <span class="acc-stat is-upcoming"><b>${upcoming}</b> sắp diễn ra</span>
    <span class="acc-stat is-done"><b>${done}</b> hoàn thành</span>
    <span class="acc-stat is-cancelled"><b>${cancelled}</b> huỷ</span>
  `
}

function matchesFilter(b, filter) {
  if (filter === 'all') return true
  if (filter === 'upcoming') return isUpcoming(b)
  if (filter === 'done') return b.status === 'completed'
  return b.status === filter
}

function cardHtml(b) {
  const st = STATUS[b.status] || STATUS.pending
  const start = Number(b.startHour) || 0
  const end = Number(b.endHour) > start ? Number(b.endHour) : start + (Number(b.duration) || 1)
  const canCancel = CANCELLED_BY_USER.includes(b.status)
  const contact = [b.customer?.name, b.customer?.phone].filter(Boolean).join(' · ')

  return `
    <article class="acc-item">
      <div class="acc-item-main">
        <div class="acc-item-head">
          <h4 class="acc-item-name">${esc(b.fieldName || b.courtName || 'Sân bóng đá')}</h4>
          <span class="acc-badge ${st.cls}">${st.text}</span>
        </div>
        <div class="acc-item-meta">
          <span><i class="fa-regular fa-calendar"></i> ${esc(formatDate(b.date))}</span>
          <span><i class="fa-regular fa-clock"></i> ${esc(timeLabel(start))} – ${esc(timeLabel(end))}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${esc(b.fieldId || b.courtId || '')}</span>
        </div>
        <div class="acc-item-code">
          Mã đơn <b>${esc(b.id)}</b>${contact ? ` · ${esc(contact)}` : ''}
        </div>
      </div>
      <div class="acc-item-side">
        <div class="acc-item-price">${(Number(b.total) || 0).toLocaleString('vi-VN')}đ</div>
        ${
          canCancel
            ? `<button type="button" class="acc-cancel" data-cancel="${esc(b.id)}">
                 <i class="fa-solid fa-xmark"></i> Huỷ đặt sân
               </button>`
            : ''
        }
      </div>
    </article>
  `
}

function emptyHtml() {
  return `
    <div class="acc-empty">
      <i class="fa-solid fa-calendar-xmark"></i>
      <p class="acc-empty-title">Chưa có đơn đặt sân nào</p>
      <p class="acc-empty-sub">Đặt sân ở trang chủ, đơn sẽ hiện ở đây kèm trạng thái và mã đơn.</p>
      <a class="btn-book" href="../index.html#tim-san">
        <i class="fa-solid fa-futbol"></i> Đặt sân ngay
      </a>
    </div>
  `
}

function renderHistory() {
  const box = $('#accHistory')
  if (!box) return
  const list = state.bookings.filter((b) => matchesFilter(b, state.filter))
  if (list.length === 0) {
    box.innerHTML = state.bookings.length === 0 ? emptyHtml() : emptyHtml().replace('Chưa có đơn đặt sân nào', 'Không có đơn nào ở bộ lọc này')
    return
  }
  const upcomingFirst = state.filter === 'upcoming'
  box.innerHTML = sortBookings(list, upcomingFirst).map(cardHtml).join('')
}

function renderStats() {
  const box = $('#accStats')
  if (box) box.innerHTML = statsHtml(state.bookings)
}

function renderProfile() {
  const user = state.user
  if (!user) return

  const label = user.name || user.email || 'Tài khoản'
  const title = $('#accTitle')
  const mail = $('#accMail')
  if (title) title.textContent = label
  if (mail) mail.textContent = user.email || ''

  const avatar = $('#accAvatar')
  if (avatar) {
    // Không có avatar thì lấy chữ cái đầu, không gọi mạng bên ngoài.
    const initial = label.trim().charAt(0).toUpperCase() || '4'
    avatar.src = user.avatar || `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#16a34a"/><text x="48" y="62" font-family="sans-serif" font-size="42" fill="#fff" text-anchor="middle">${initial}</text></svg>`,
    )}`
    avatar.alt = label
  }

  const nameInput = $('#accName')
  const phoneInput = $('#accPhone')
  if (nameInput && nameInput.value !== (user.name || '')) nameInput.value = user.name || ''
  if (phoneInput && phoneInput.value !== (user.phone || '')) phoneInput.value = user.phone || ''

  const email = $('#accEmail')
  const role = $('#accRole')
  const created = $('#accCreated')
  if (email) email.textContent = user.email || '—'
  if (role) role.textContent = ROLE[user.role] || 'Người chơi'
  if (created) created.textContent = createdLabel(user.createdAt)
}

/** Nạp lại từ store: dùng khi mở panel và khi store báo có thay đổi. */
function refresh() {
  state.user = SV.currentUser()
  if (!state.user) return false
  state.bookings = myBookings(state.user)
  renderProfile()
  renderStats()
  renderHistory()
  return true
}

function saveProfile() {
  const nameInput = $('#accName')
  const phoneInput = $('#accPhone')
  if (!state.user) return

  const name = nameInput.value.trim()
  const phone = digits(phoneInput.value)
  if (name.length < 2) {
    notify('Họ tên quá ngắn')
    nameInput.focus()
    return
  }
  if (!/^0?\d{9,10}$/.test(phone)) {
    notify('Số điện thoại phải có 9-10 chữ số')
    phoneInput.focus()
    return
  }

  // SĐT là cách nhận diện thứ hai nên phải trùng với tài khoản khác thì báo.
  const taken = SV.users().find(
    (u) => u.id !== state.user.id && digits(u.phone) === phone,
  )
  if (taken) {
    notify('Số điện thoại này đã thuộc về tài khoản khác')
    return
  }

  const result = SV.updateUser(state.user.id, { name, phone })
  if (!result.ok) {
    notify(result.error || 'Không lưu được thông tin')
    return
  }
  // Tên trong header và phiên đăng nhập lấy từ users(), nên chỉ cần ghi là cả hai
  // trang tự đổi theo.
  refresh()
  notify('Đã cập nhật thông tin cá nhân')
}

function cancelBooking(id) {
  const booking = SV.booking(id)
  if (!booking) {
    notify('Không tìm thấy đơn')
    return
  }
  if (!CANCELLED_BY_USER.includes(booking.status)) {
    notify('Chỉ huỷ được đơn đang chờ xử lý hoặc đã xác nhận')
    return
  }
  const result = SV.setBookingStatus(id, 'cancelled')
  if (!result.ok) {
    notify(result.error || 'Không huỷ được đơn')
    return
  }
  refresh()
  notify(`Đã huỷ đơn ${id}`)
}

/**
 * Gắn panel vào trang. `toast` được truyền từ auth.js để hai màn hình dùng
 * chung một kiểu thông báo.
 */
export function initProfile({ toast } = {}) {
  notify = typeof toast === 'function' ? toast : () => {}
  const panel = $('#panelProfile')
  if (!panel) return

  const form = $('#profileForm')
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault()
    saveProfile()
  })

  const logout = $('#accLogout')
  if (logout) logout.addEventListener('click', () => {
    SV.signOut()
    location.href = 'auth.html#login'
  })

  const filters = $('#accFilters')
  if (filters) filters.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]')
    if (!chip) return
    state.filter = chip.dataset.filter
    $$('[data-filter]', filters).forEach((el) => el.classList.toggle('is-active', el === chip))
    renderHistory()
  })

  const history = $('#accHistory')
  if (history) history.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]')
    if (btn) cancelBooking(btn.dataset.cancel)
  })

  // Admin đổi trạng thái đơn ở tab khác thì lịch sử tự làm mới.
  SV.on(() => {
    if (!panel.hidden) refresh()
  })
}

/** Được auth.js gọi mỗi khi chuyển sang panel tài khoản. */
export function openProfile() {
  return refresh()
}

export function hasProfilePanel() {
  return Boolean($('#panelProfile'))
}