/**
 * Panel "Tài khoản của tôi" trong src/auth.html: thông tin cá nhân + lịch sử
 * đặt sân. Mọi đọc/ghi đều đi qua store chung (SV) nên người dùng sửa ở đây
 * thì trang quản trị và trang chủ thấy ngay, không phải đăng nhập lại.
 */

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

const STATUS = {
  pending: { text: 'Chờ xử lý', cls: 'is-pending', icon: 'fa-hourglass-half' },
  confirmed: { text: 'Đã xác nhận', cls: 'is-confirmed', icon: 'fa-circle-check' },
  completed: { text: 'Đã hoàn thành', cls: 'is-completed', icon: 'fa-flag-checkered' },
  cancelled: { text: 'Đã huỷ', cls: 'is-cancelled', icon: 'fa-circle-xmark' },
}

const ROLE = {
  player: 'Người chơi',
  owner: 'Chủ sân',
  admin: 'Quản trị viên',
}

const ROLE_ICON = {
  player: 'fa-person-running',
  owner: 'fa-helmet-safety',
  admin: 'fa-user-shield',
}

/** Trạng thái cho phép người dùng tự huỷ (đơn đã hoàn thành thì giữ lại). */
const CANCELLED_BY_USER = ['pending', 'confirmed']

/** Số đơn mỗi trang ở khu vực lịch sử đặt sân. */
const PAGE_SIZE = 3

const state = {
  user: null,
  bookings: [],
  filter: 'all',
  search: '',
  page: 1,
}
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

/** Đơn coi như đã thanh toán: có cờ paid/paymentStatus hoặc đã hoàn thành. */
function isPaid(b) {
  if (b.paid === true || b.paymentStatus === 'paid') return true
  return b.status === 'completed'
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
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(value)
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
  const spent = list
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.total) || 0), 0)
  return `
    <div class="acc-stat">
      <i class="fa-solid fa-receipt"></i>
      <b>${total}</b><span>Tổng đơn</span>
    </div>
    <div class="acc-stat is-upcoming">
      <i class="fa-solid fa-bolt"></i>
      <b>${upcoming}</b><span>Sắp diễn ra</span>
    </div>
    <div class="acc-stat is-done">
      <i class="fa-solid fa-circle-check"></i>
      <b>${done}</b><span>Hoàn thành</span>
    </div>
    <div class="acc-stat is-money">
      <i class="fa-solid fa-wallet"></i>
      <b>${spent.toLocaleString('vi-VN')}<small>đ</small></b><span>Tổng chi tiêu</span>
    </div>
  `
}

function matchesFilter(b, filter) {
  if (filter === 'all') return true
  if (filter === 'upcoming') return isUpcoming(b)
  if (filter === 'processing') return b.status === 'pending'
  if (filter === 'done') return b.status === 'completed'
  if (filter === 'incomplete') return b.status === 'pending' || b.status === 'confirmed'
  if (filter === 'cancelled') return b.status === 'cancelled'
  if (filter === 'paid') return isPaid(b)
  if (filter === 'unpaid') return !isPaid(b) && b.status !== 'cancelled'
  return b.status === filter
}

function matchesSearch(b, keyword) {
  if (!keyword) return true
  const hay = [
    b.fieldName,
    b.courtName,
    b.fieldId,
    b.id,
    b.customer?.name,
    b.voucherCode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(keyword)
}

function cardHtml(b) {
  const st = STATUS[b.status] || STATUS.pending
  const start = Number(b.startHour) || 0
  const end = Number(b.endHour) > start ? Number(b.endHour) : start + (Number(b.duration) || 1)
  const duration = Math.max(1, Math.round((end - start) * 10) / 10)
  const canCancel = CANCELLED_BY_USER.includes(b.status)
  const paid = isPaid(b)
  const discount = Number(b.discount) || 0
  const total = Number(b.total) || 0
  const contact = [b.customer?.name, b.customer?.phone].filter(Boolean).join(' · ')
  const rebook = `../index.html#tim-san`

  return `
    <article class="acc-item">
      <div class="acc-item-main">
        <div class="acc-item-head">
          <h4 class="acc-item-name">${esc(b.fieldName || b.courtName || 'Sân bóng đá')}</h4>
          <span class="acc-badge ${st.cls}">
            <i class="fa-solid ${st.icon}"></i> ${st.text}
          </span>
        </div>
        <div class="acc-item-meta">
          <span><i class="fa-regular fa-calendar"></i> ${esc(formatDate(b.date))}</span>
          <span><i class="fa-regular fa-clock"></i> ${esc(timeLabel(start))} – ${esc(timeLabel(end))}</span>
          <span><i class="fa-solid fa-hourglass-half"></i> ${duration} giờ</span>
          <span><i class="fa-solid fa-location-dot"></i> ${esc(b.fieldId || b.courtId || '—')}</span>
        </div>
        <div class="acc-item-code">
          Mã đơn <b>${esc(b.id)}</b>${contact ? ` · ${esc(contact)}` : ''}
          ${b.voucherCode ? ` · Voucher <b>${esc(b.voucherCode)}</b>` : ''}
        </div>
      </div>
      <div class="acc-item-side">
        <div class="acc-item-price">
          ${total.toLocaleString('vi-VN')}đ
          ${discount > 0 ? `<small>-${discount.toLocaleString('vi-VN')}đ</small>` : ''}
        </div>
        <span class="acc-item-pay ${paid ? 'is-paid' : 'is-unpaid'}">
          <i class="fa-solid ${paid ? 'fa-circle-check' : 'fa-clock'}"></i>
          ${paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
        </span>
        <div class="acc-item-actions">
          ${
            canCancel
              ? `<button type="button" class="acc-cancel" data-cancel="${esc(b.id)}">
                   <i class="fa-solid fa-xmark"></i> Huỷ
                 </button>`
              : ''
          }
          <a class="acc-rebook" href="${rebook}">
            <i class="fa-solid fa-rotate-right"></i> Đặt lại
          </a>
        </div>
      </div>
    </article>
  `
}

function emptyHtml(title, sub) {
  return `
    <div class="acc-empty">
      <i class="fa-solid fa-calendar-xmark"></i>
      <p class="acc-empty-title">${esc(title)}</p>
      <p class="acc-empty-sub">${esc(sub)}</p>
      <a class="btn-book" href="../index.html#tim-san">
        <i class="fa-solid fa-futbol"></i> Đặt sân ngay
      </a>
    </div>
  `
}

function filteredBookings() {
  return state.bookings
    .filter((b) => matchesFilter(b, state.filter))
    .filter((b) => matchesSearch(b, state.search))
}

function pagerHtml(page, pageCount) {
  if (pageCount <= 1) return ''
  const buttons = []
  buttons.push(`
    <button type="button" class="acc-page" data-page="${page - 1}" ${
      page <= 1 ? 'disabled' : ''
    } aria-label="Trang trước">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `)
  for (let i = 1; i <= pageCount; i += 1) {
    buttons.push(`
      <button type="button" class="acc-page ${i === page ? 'is-active' : ''}" data-page="${i}">
        ${i}
      </button>
    `)
  }
  buttons.push(`
    <button type="button" class="acc-page" data-page="${page + 1}" ${
      page >= pageCount ? 'disabled' : ''
    } aria-label="Trang sau">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `)
  return buttons.join('')
}

function renderHistory() {
  const box = $('#accHistory')
  if (!box) return
  const pager = $('#accPager')

  const list = filteredBookings()
  if (list.length === 0) {
    if (state.bookings.length === 0) {
      box.innerHTML = emptyHtml(
        'Chưa có đơn đặt sân nào',
        'Đặt sân ở trang chủ, đơn sẽ hiện ở đây kèm trạng thái và mã đơn.',
      )
    } else {
      box.innerHTML = emptyHtml(
        'Không có đơn nào phù hợp',
        'Thử đổi bộ lọc hoặc từ khoá tìm kiếm khác nhé.',
      )
    }
    if (pager) pager.innerHTML = ''
    return
  }

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  state.page = Math.min(Math.max(1, state.page), pageCount)

  const upcomingFirst = state.filter === 'upcoming'
  const sorted = sortBookings(list, upcomingFirst)
  const startIdx = (state.page - 1) * PAGE_SIZE
  box.innerHTML = sorted.slice(startIdx, startIdx + PAGE_SIZE).map(cardHtml).join('')

  if (pager) pager.innerHTML = pagerHtml(state.page, pageCount)
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
  if (mail) mail.textContent = user.email || 'Chưa cập nhật email'

  const avatar = $('#accAvatar')
  if (avatar) {
    // Không có avatar thì lấy chữ cái đầu, không gọi mạng bên ngoài.
    const initial = label.trim().charAt(0).toUpperCase() || '4'
    avatar.src = user.avatar || `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#8b1e1e"/><text x="48" y="62" font-family="sans-serif" font-size="42" fill="#fff" text-anchor="middle">${initial}</text></svg>`,
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
  if (email) email.value = user.email || ''
  if (role) {
    const key = user.role || 'player'
    role.innerHTML = `<i class="fa-solid ${ROLE_ICON[key] || ROLE_ICON.player}"></i> ${
      ROLE[key] || ROLE.player
    }`
  }
  if (created) {
    created.innerHTML = `<i class="fa-regular fa-calendar-check"></i> ${esc(createdLabel(user.createdAt))}`
  }
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

/* ---------- VALIDATION ---------- */
function setFieldError(input, message) {
  const field = input.closest('.acc-field')
  const error = $(`[data-error-for="${input.id}"]`)
  if (field) {
    field.classList.toggle('is-invalid', Boolean(message))
    field.classList.toggle('is-valid', !message && input.value.trim() !== '')
  }
  if (error) {
    error.innerHTML = message ? `<i class="fa-solid fa-circle-exclamation"></i> ${message}` : ''
    error.hidden = !message
  }
  input.setAttribute('aria-invalid', String(Boolean(message)))
}

function validateProfileForm() {
  const nameInput = $('#accName')
  const phoneInput = $('#accPhone')
  let firstBad = null

  const name = nameInput.value.trim()
  if (name.length < 2) {
    setFieldError(nameInput, 'Họ tên phải có ít nhất 2 ký tự')
    if (!firstBad) firstBad = nameInput
  } else if (/\d/.test(name)) {
    setFieldError(nameInput, 'Họ tên không được chứa chữ số')
    if (!firstBad) firstBad = nameInput
  } else {
    setFieldError(nameInput, '')
  }

  const phone = digits(phoneInput.value)
  if (!/^0?\d{9,10}$/.test(phone)) {
    setFieldError(phoneInput, 'Số điện thoại phải có 9-10 chữ số')
    if (!firstBad) firstBad = phoneInput
  } else {
    setFieldError(phoneInput, '')
  }

  if (firstBad) firstBad.focus()
  return !firstBad
}

function saveProfile() {
  if (!state.user) return
  if (!validateProfileForm()) return

  const name = $('#accName').value.trim()
  const phone = digits($('#accPhone').value)

  // SĐT là cách nhận diện thứ hai nên phải trùng với tài khoản khác thì báo.
  const taken = SV.users().find((u) => u.id !== state.user.id && digits(u.phone) === phone)
  if (taken) {
    setFieldError($('#accPhone'), 'Số điện thoại này đã thuộc tài khoản khác')
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
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      saveProfile()
    })

    $$('.acc-input', form).forEach((input) => {
      input.addEventListener('input', () => {
        if (input.closest('.acc-field')?.classList.contains('is-invalid')) {
          setFieldError(input, '')
        }
      })
      input.addEventListener('blur', () => {
        if (input.id === 'accName' || input.id === 'accPhone') validateProfileForm()
      })
    })
  }

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
    state.page = 1
    $$('[data-filter]', filters).forEach((el) => el.classList.toggle('is-active', el === chip))
    renderHistory()
  })

  const search = $('#accSearch')
  if (search) {
    let debounce = null
    search.addEventListener('input', () => {
      clearTimeout(debounce)
      debounce = setTimeout(() => {
        state.search = search.value.trim().toLowerCase()
        state.page = 1
        renderHistory()
      }, 160)
    })
  }

  const history = $('#accHistory')
  if (history) history.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]')
    if (btn) cancelBooking(btn.dataset.cancel)
  })

  const pager = $('#accPager')
  if (pager) pager.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]')
    if (!btn || btn.disabled) return
    state.page = Number(btn.dataset.page)
    renderHistory()
    $('#accHistory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })

  // Admin đổi trạng thái đơn ở tab khác thì lịch sử tự làm mới.
  SV.on(() => {
    if (!panel.hidden) refresh()
  })
}

/** Được auth.js gọi mỗi khi chuyển sang panel tài khoản. */
export function openProfile() {
  state.filter = 'all'
  state.search = ''
  state.page = 1
  const search = $('#accSearch')
  if (search) search.value = ''
  const filters = $('#accFilters')
  if (filters) {
    $$('[data-filter]', filters).forEach((el) =>
      el.classList.toggle('is-active', el.dataset.filter === 'all'),
    )
  }
  return refresh()
}

export function hasProfilePanel() {
  return Boolean($('#panelProfile'))
}
