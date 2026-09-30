import './style.css'

const VENUES = [
  { id: 1, name: 'Sân Bóng Đá Thành Công', sport: 'Bóng đá', addr: '18 Thành Công, Ba Đình, Hà Nội', price: '300k', per: '/tiếng', courts: 3, hours: { open: 6, close: 22 }, lat: 21.0465, lng: 105.8069, img: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&q=75', icon: '⚽' },
  { id: 2, name: 'Tennis Club Cầu Giấy', sport: 'Tennis', addr: '68 Cầu Giấy, Hà Nội', price: '250k', per: '/tiếng', courts: 4, hours: { open: 6, close: 23 }, lat: 21.0409, lng: 105.7822, img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&q=75', icon: '🎾' },
  { id: 3, name: 'Nhà Thi Đấu Cầu Lông Mỹ Đình', sport: 'Cầu lông', addr: 'Lê Đức Thọ, Nam Từ Liêm, Hà Nội', price: '120k', per: '/tiếng', courts: 6, hours: { open: 5, close: 22 }, lat: 21.0285, lng: 105.78, img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&q=75', icon: '🏸' },
  { id: 4, name: 'Pickleball Arena Q.1', sport: 'Pickleball', addr: '28 Thảo Điền, Thủ Đức, TP.HCM', price: '180k', per: '/tiếng', courts: 2, hours: { open: 6, close: 23 }, lat: 10.7769, lng: 106.7009, img: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=400&q=75', icon: '🏓' },
  { id: 5, name: 'Sân Bóng Rổ Tây Hồ', sport: 'Bóng rổ', addr: 'Ngõ 431 Âu Cơ, Tây Hồ, Hà Nội', price: '200k', per: '/tiếng', courts: 2, hours: { open: 7, close: 22 }, lat: 21.066, lng: 105.85, img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=75', icon: '🏀' },
  { id: 6, name: 'Sân Bóng Chuyền Hoàng Hoa Thám', sport: 'Bóng chuyền', addr: '290 Hoàng Hoa Thám, Ba Đình, Hà Nội', price: '150k', per: '/tiếng', courts: 2, hours: { open: 6, close: 22 }, lat: 21.033, lng: 105.839, img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&q=75', icon: '🏐' },
  { id: 7, name: 'Bóng Đá Mini Đầm Hồng', sport: 'Bóng đá', addr: 'KĐT Đầm Hồng, Thanh Xuân, Hà Nội', price: '400k', per: '/tiếng', courts: 5, hours: { open: 6, close: 21 }, lat: 20.988, lng: 105.813, img: 'https://images.unsplash.com/photo-1579952363873-27f3bfad9c0d?w=400&q=75', icon: '⚽' },
  { id: 8, name: 'Ace Pickleball Club', sport: 'Pickleball', addr: 'Pullman Hanoi, Cát Linh, Đống Đa, Hà Nội', price: '220k', per: '/tiếng', courts: 2, hours: { open: 7, close: 23 }, lat: 21.046, lng: 105.838, img: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400&q=75', icon: '🏓' },
]

const PROVINCES = ['Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ','Bình Dương','Đồng Nai','Khánh Hòa','Nghệ An','Thanh Hóa','Huế','Quảng Ninh','Bà Rịa - Vũng Tàu','Lâm Đồng','Kiên Giang','Bắc Ninh','Hải Dương','Hưng Yên','Nam Định','Thái Nguyên','Quảng Nam','Bình Định','Gia Lai','Đắk Lắk','Long An','Tiền Giang','Vĩnh Long','An Giang','Bình Thuận','Ninh Thuận','Phú Yên','Quảng Ngãi','Bình Phước','Tây Ninh']

const SPORT_LABELS = {
  'bong-da': 'Bóng đá',
  tennis: 'Tennis',
  'cau-long': 'Cầu lông',
  pickleball: 'Pickleball',
  'bong-ro': 'Bóng rổ',
  'bong-chuyen': 'Bóng chuyền',
  'bong-ban': 'Bóng bàn',
}

// Số liệu nền tảng: tổng sân = tổng các loại sân, tổng cơ sở dùng chung cho badge + hero-stats
const TOTAL_COURTS = 858
const TOTAL_VENUES = 629
const SPORT_COUNTS = [
  { sport: 'Bóng đá', count: 186 },
  { sport: 'Tennis', count: 92 },
  { sport: 'Cầu lông', count: 124 },
  { sport: 'Pickleball', count: 68 },
  { sport: 'Bóng rổ', count: 41 },
  { sport: 'Bóng chuyền', count: 37 },
  { sport: 'Bóng bàn', count: 24 },
  { sport: '', count: TOTAL_COURTS - 186 - 92 - 124 - 68 - 41 - 37 - 24 },
]

const BOOKING_KEY = '4sv_bookings'

// ================================ CHUẨN HOÁ TIẾNG VIỆT ================================

/** Bỏ dấu + lowercase. "Hồ Chí Minh" -> "ho chi minh", "Đà Nẵng" -> "da nang". */
function deaccent(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/** Chuẩn hoá để so khớp: bỏ dấu, hạ chữ thường, gộp khoảng trắng, bỏ dấu phẩy/chấm. */
function norm(str) {
  return deaccent(String(str || ''))
    .toLowerCase()
    .replace(/[,;.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Cách viết tắt thường gặp -> dạng đầy đủ. Áp dụng cho cả dữ liệu lẫn từ khoá người dùng.
// Lưu ý: norm() đã đổi dấu chấm thành khoảng trắng, nên "TP.HCM" tới đây là "tp hcm".
const ABBREVIATIONS = [
  [/\btp\s*ho\s*chi\s*minh\b|\btp\s*hcm\b|\btphcm\b|\bho\s*chi\s*minh\b/g, 'tp ho chi minh'],
  [/\btp\s*ha\s*noi\b|\btp\s*hn\b|\bthanh\s*pho\b|\bha\s*noi\b/g, 'ha noi'],
  [/\bq\.?\s*(\d{1,2})\b/g, 'quan $1'],
  [/\bquan\s*(\d{1,2})\b/g, 'quan $1'],
  [/\bp\.?\s*(\d{1,2})\b/g, 'phuong $1'],
  [/\bphuong\s*(\d{1,2})\b/g, 'phuong $1'],
  [/\bkdt\b|\bkhu\s*do\s*thi\b/g, 'khu do thi'],
  [/\btt\b|\btp\s*tay\s*son\b/g, 'tay son'],
  [/\bq\.?\s*go\b/g, 'go vap'],
  [/\btd\b|\btp\s*thu\s*duc\b/g, 'thu duc'],
  [/\bq\.?\s*bn\b/g, 'binh duong'],
  [/\bq\.?\s*dn\b/g, 'dong nai'],
]

/** Mở rộng viết tắt để "q.10" và "quận 10" không khác nhau. */
function expand(str) {
  let out = norm(str)
  for (const [re, to] of ABBREVIATIONS) out = out.replace(re, to)
  return out
}

/** Chuỗi để tìm kiếm của một sân: tên + địa chỉ + môn, đã chuẩn hoá. */
function haystack(v) {
  return expand(`${v.name} ${v.addr} ${v.sport}`)
}

// ================================ LỌC ================================

function timeLabel(h) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Đọc giờ từ input datetime-local ("2026-05-01T18:30") hoặc date ("2026-05-01"). */
function parseWhen(value) {
  if (!value) return null
  const m = value.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/)
  if (!m) return null
  const date = m[1]
  const hour = m[2] === undefined ? null : Number(m[2]) + Number(m[3]) / 60
  return { date, hour, hasTime: m[2] !== undefined }
}

/** Khoảng giờ sân còn phục vụ tại giờ đã chọn. */
function isOpenAt(v, when) {
  if (!when || when.hour === null) return true
  return when.hour >= v.hours.open && when.hour < v.hours.close
}

function isPastSlot(date, hour) {
  if (date !== todayStr() || hour === null) return false
  const now = new Date()
  return hour < now.getHours() + now.getMinutes() / 60
}

function matches(v, filters) {
  const { loc, sport, when } = filters

  if (sport && v.sport !== sport) return false
  if (loc) {
    const hay = haystack(v)
    // Mọi từ trong từ khoá đều phải xuất hiện -> "bóng đá hà nội" hoạt động
    if (!loc.split(' ').every((t) => hay.includes(t))) return false
  }
  if (when && !isOpenAt(v, when)) return false
  if (when && when.hasTime && isPastSlot(when.date, when.hour)) return false
  return true
}

function readFilters() {
  return {
    loc: expand(document.getElementById('qLocation')?.value || ''),
    sport: document.getElementById('qSport')?.value || '',
    when: parseWhen(document.getElementById('qDate')?.value || ''),
  }
}

function hasAnyFilter(f) {
  return Boolean(f.loc || f.sport || f.when)
}

function describeFilters(f) {
  const bits = []
  if (f.sport) bits.push(f.sport)
  if (f.loc) bits.push(`tại "${f.loc}"`)
  if (f.when?.hasTime) bits.push(`${f.when.date} lúc ${timeLabel(f.when.hour)}`)
  else if (f.when) bits.push(`ngày ${f.when.date}`)
  return bits.join(' · ')
}

// ================================ ĐẶT SÂN ================================

function loadBookings() {
  try {
    const raw = localStorage.getItem(BOOKING_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function isSlotTaken(venueId, date, startHour, duration) {
  const endHour = startHour + duration
  return loadBookings().some(
    (b) => b.courtId === venueId && b.date === date && startHour < b.endHour && endHour > b.startHour
  )
}

function buildTimeOptions(venue, date, duration) {
  const out = []
  for (let h = venue.hours.open; h < venue.hours.close; h += 1) {
    if (h + duration > venue.hours.close) continue
    if (isPastSlot(date, h)) continue
    if (isSlotTaken(venue.id, date, h, duration)) continue
    out.push(`<option value="${h}">${timeLabel(h)} – ${timeLabel(h + duration)}</option>`)
  }
  return out.join('')
}

// ================================ RENDER ================================

function toast(msg, type = 'success') {
  const t = document.createElement('div')
  t.className = 'toast-4sv' + (type === 'error' ? ' toast-error' : '')
  t.textContent = msg
  document.body.appendChild(t)
  requestAnimationFrame(() => t.classList.add('show'))
  setTimeout(() => {
    t.classList.remove('show')
    setTimeout(() => t.remove(), 250)
  }, type === 'error' ? 4000 : 2500)
}

function renderVenues(list, filters) {
  const grid = document.getElementById('featuredGrid')
  const empty = document.getElementById('venueEmpty')
  if (!grid) return

  const count = document.getElementById('venueCount')
  if (count) count.textContent = String(list.length)

  if (!list.length) {
    grid.innerHTML = ''
    if (empty) {
      empty.style.display = 'block'
      const desc = document.getElementById('venueEmptyDesc')
      const reset = document.getElementById('venueEmptyReset')
      if (desc) {
        if (filters?.when?.hasTime && isPastSlot(filters.when.date, filters.when.hour)) {
          desc.textContent = `Thời gian ${timeLabel(filters.when.hour)} ngày ${filters.when.date} đã qua. Vui lòng chọn thời gian từ hiện tại trở đi.`
        } else {
          desc.textContent = hasAnyFilter(filters)
            ? `Không có sân nào khớp với ${describeFilters(filters)}.`
            : 'Chưa có sân nào trong danh sách.'
        }
      }
      if (reset) reset.style.display = hasAnyFilter(filters) ? 'inline-flex' : 'none'
    }
    return
  }

  if (empty) empty.style.display = 'none'

  grid.innerHTML = list
    .map((v) => `
    <div class="court-card">
      <div class="court-img-wrap">
        <img src="${v.img}" alt="${v.name}" loading="lazy">
        <span class="court-badge">${v.icon} ${v.sport}</span>
      </div>
      <div class="court-body">
        <div class="court-name">${v.name}</div>
        <div class="court-addr"><i class="fa-solid fa-location-dot"></i><span>${v.addr}</span></div>
        <div class="court-hours"><i class="fa-regular fa-clock"></i> ${timeLabel(v.hours.open)} – ${timeLabel(v.hours.close)}</div>
        <div class="court-meta">
          <div class="court-price">${v.price} <small>${v.per}</small></div>
          <div class="court-courts">${v.courts} sân</div>
        </div>
        <a href="#" class="btn-book" data-book="${v.id}">Xem chi tiết</a>
      </div>
    </div>
  `)
    .join('')

  grid.querySelectorAll('[data-book]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      const venue = VENUES.find((x) => String(x.id) === a.dataset.book)
      if (venue) openBook(venue)
    })
  })
}

function renderNearby(list) {
  const ul = document.getElementById('nearbyList')
  const count = document.getElementById('mapCount')
  if (count) count.textContent = String(list.length)
  if (!ul) return
  if (!list.length) {
    ul.innerHTML = '<li class="nearby-empty">Không có sân nào khớp bộ lọc hiện tại.</li>'
    return
  }
  ul.innerHTML = list
    .slice(0, 4)
    .map(
      (v) => `
    <li>
      <img class="nearby-thumb" src="${v.img}" alt="">
      <div>
        <div class="nearby-name">${v.name}</div>
        <div class="nearby-addr">${v.addr}</div>
      </div>
      <span class="nearby-price">${v.price}</span>
    </li>
  `
    )
    .join('')
}

// Số sân theo tỉnh: hash ổn định thay vì Math.random() để số không nhảy mỗi lần bấm tab
function provinceCount(province, sport) {
  const seed = expand(province) + '|' + sport
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100000
  return 4 + (h % 45)
}

function renderProvinces(sportKey) {
  const grid = document.getElementById('provinceGrid')
  if (!grid) return
  const label = SPORT_LABELS[sportKey] || 'Bóng đá'
  grid.innerHTML = PROVINCES.map(
    (p) => `<a href="#" class="province-card" data-province="${p}"><span><span class="province-name">${p}</span><span class="province-count">${provinceCount(p, label)} sân ${label}</span></span><i class="fa-solid fa-chevron-right"></i></a>`
  ).join('')
  grid.querySelectorAll('.province-card').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById('qLocation').value = a.dataset.province
      document.getElementById('qSport').value = ''
      applyFilters({ scroll: true })
      toast(`Tìm sân ${label} tại ${a.dataset.province}`)
    })
  })
}

// ================================ BỘ LỌC DÙNG CHUNG ================================

let lastResult = VENUES.slice()

/**
 * Điểm vào duy nhất cho mọi thay đổi bộ lọc: submit form, bấm sport-card,
 * bấm tab tỉnh, bấm nút xoá lọc. Không bao giờ tự đổi sang hiển thị tất cả.
 */
function applyFilters({ scroll = false, silent = false } = {}) {
  const filters = readFilters()
  const list = VENUES.filter((v) => matches(v, filters))
  lastResult = list

  renderVenues(list, filters)
  renderNearby(list)
  syncFilterUI(filters)

  if (!silent) {
    if (!list.length) {
      toast('Không tìm thấy sân phù hợp')
    } else {
      const where = describeFilters(filters)
      toast(where ? `Tìm thấy ${list.length} sân · ${where}` : `Tìm thấy ${list.length} sân`)
    }
  }

  if (scroll) document.getElementById('san-noi-bat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Giữ sport-card, select qSport và dropdown "Loại sân" luôn khớp với bộ lọc đang chạy. */
function syncFilterUI(filters) {
  const sport = filters?.sport ?? document.getElementById('qSport')?.value ?? ''

  document.querySelectorAll('.sport-card').forEach((card) => {
    card.classList.toggle('active', (card.getAttribute('data-sport') || '') === sport)
  })

  document.querySelectorAll('#ddType .dropdown-item').forEach((item) => {
    item.classList.toggle('active', (item.getAttribute('data-sport') || '') === sport)
  })
}

function clearFilters() {
  document.getElementById('qLocation').value = ''
  document.getElementById('qSport').value = ''
  document.getElementById('qDate').value = ''
  applyFilters({ silent: true })
  toast('Đã xoá bộ lọc')
}

function handleSearch(e) {
  e.preventDefault()
  applyFilters({ scroll: true })
}

// ================================ MODAL ĐẶT SÂN ================================

const bookState = { venue: null, duration: 1 }

function openBook(venue) {
  bookState.venue = venue
  bookState.duration = 1

  const body = document.getElementById('bookBody')
  if (body) {
    body.innerHTML = `
      <div class="bk-info">
        <img src="${venue.img}" alt="${venue.name}" />
        <div>
          <div class="bk-name">${venue.name}</div>
          <div class="bk-sub">${venue.icon} ${venue.sport} · ${venue.price}${venue.per} · ${timeLabel(venue.hours.open)} – ${timeLabel(venue.hours.close)}</div>
        </div>
      </div>
      <form id="bookForm" novalidate>
        <div class="bk-grid">
          <div class="bk-field" id="f-date">
            <label for="bkDate">Ngày</label>
            <input type="date" id="bkDate" />
            <span class="bk-err">Vui lòng chọn ngày không ở quá khứ.</span>
          </div>
          <div class="bk-field" id="f-time">
            <label for="bkTime">Khung giờ</label>
            <select id="bkTime"></select>
            <span class="bk-err">Khung giờ này không còn trống hoặc nằm ngoài giờ mở cửa.</span>
          </div>
          <div class="bk-field" id="f-duration">
            <label for="bkDuration">Thời lượng</label>
            <select id="bkDuration">
              <option value="1">1 giờ</option>
              <option value="1.5">1,5 giờ</option>
              <option value="2">2 giờ</option>
              <option value="3">3 giờ</option>
            </select>
          </div>
          <div class="bk-field" id="f-name">
            <label for="bkName">Họ tên</label>
            <input type="text" id="bkName" placeholder="VD: Nguyễn Văn A" autocomplete="name" />
            <span class="bk-err">Vui lòng nhập họ tên (tối thiểu 2 ký tự).</span>
          </div>
          <div class="bk-field" id="f-phone">
            <label for="bkPhone">Số điện thoại</label>
            <input type="tel" id="bkPhone" placeholder="VD: 0912345678" autocomplete="tel" />
            <span class="bk-err">Số điện thoại không hợp lệ (VD: 0912345678).</span>
          </div>
          <div class="bk-field" id="f-total">
            <label>Tổng tiền</label>
            <div class="bk-total" id="bkTotal">0đ</div>
          </div>
        </div>
        <button type="submit" class="btn-book btn-book-full"><i class="fa-solid fa-check-circle"></i> Xác nhận đặt sân</button>
      </form>
    `
  }

  const dateInput = document.getElementById('bkDate')
  dateInput.min = todayStr()
  dateInput.value = todayStr()

  const refresh = () => {
    const date = dateInput.value
    const sel = document.getElementById('bkTime')
    if (!date) {
      sel.innerHTML = '<option value="">-- Chọn ngày trước --</option>'
      return
    }
    const html = buildTimeOptions(venue, date, bookState.duration)
    sel.innerHTML = html || '<option value="">-- Đã kín lịch --</option>'
  }

  const updateTotal = () => {
    bookState.duration = parseFloat(document.getElementById('bkDuration').value) || 1
    const perHour = parseInt(String(venue.price).replace(/\D/g, ''), 10) || 0
    const total = perHour * 1000 * bookState.duration
    document.getElementById('bkTotal').textContent = total.toLocaleString('vi-VN') + 'đ'
    refresh()
  }

  dateInput.addEventListener('change', refresh)
  document.getElementById('bkDuration').addEventListener('change', updateTotal)
  document.getElementById('bookForm').querySelectorAll('input').forEach((el) => {
    const clearErr = () => el.closest('.bk-field')?.classList.remove('invalid')
    el.addEventListener('input', clearErr)
    el.addEventListener('change', clearErr)
  })

  document.getElementById('bookForm').addEventListener('submit', (e) => {
    e.preventDefault()
    submitBooking(venue)
  })

  updateTotal()
  openModal('bookModal')
}

function openModal(id) {
  const m = document.getElementById(id)
  if (!m) return
  m.classList.add('open')
  document.body.style.overflow = 'hidden'
  m.querySelector('input, select, button')?.focus()
}

function closeModal(id) {
  const m = document.getElementById(id)
  if (!m) return
  m.classList.remove('open')
  document.body.style.overflow = ''
}

function submitBooking(venue) {
  const set = (field, ok) => document.getElementById('f-' + field)?.classList.toggle('invalid', !ok)

  const date = document.getElementById('bkDate').value
  const startHour = parseFloat(document.getElementById('bkTime').value)
  const duration = bookState.duration
  const name = document.getElementById('bkName').value.trim()
  const phone = document.getElementById('bkPhone').value.trim().replace(/[\s.-]/g, '')

  const dateOk = !!date && date >= todayStr()
  let timeOk = Number.isFinite(startHour) && dateOk
  if (timeOk) {
    timeOk =
      startHour >= venue.hours.open &&
      startHour + duration <= venue.hours.close &&
      !isPastSlot(date, startHour) &&
      !isSlotTaken(venue.id, date, startHour, duration)
  }
  const nameOk = name.length >= 2
  const phoneOk = /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone)

  set('date', dateOk)
  set('time', timeOk)
  set('name', nameOk)
  set('phone', phoneOk)

  if (!dateOk || !timeOk || !nameOk || !phoneOk) {
    document.getElementById('bookForm')?.querySelector('.bk-field.invalid')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return
  }

  const perHour = parseInt(String(venue.price).replace(/\D/g, ''), 10) || 0
  const total = perHour * 1000 * duration
  const list = loadBookings()
  const booking = {
    id: 'BD' + Date.now(),
    courtId: venue.id,
    courtName: venue.name,
    date,
    startHour,
    endHour: startHour + duration,
    duration,
    total,
    customer: { name, phone },
    status: 'pending',
  }

  list.push(booking)
  try {
    localStorage.setItem(BOOKING_KEY, JSON.stringify(list))
  } catch {
    toast('Không lưu được đơn đặt, trình duyệt có thể đang chặn lưu trữ. Vui lòng thử lại.', 'error')
    list.pop()
    return
  }

  const body = document.getElementById('bookBody')
  body.innerHTML = `
    <div class="bk-success">
      <div class="bk-success-icon"><i class="fa-solid fa-check"></i></div>
      <h3>Đặt sân thành công!</h3>
      <p>Mã đơn <b>${booking.id}</b> · Chúng tôi sẽ liên hệ xác nhận sớm nhất.</p>
      <dl class="bk-summary">
        <div><dt>Sân</dt><dd>${venue.name}</dd></div>
        <div><dt>Ngày</dt><dd>${date}</dd></div>
        <div><dt>Giờ</dt><dd>${timeLabel(startHour)} – ${timeLabel(startHour + duration)}</dd></div>
        <div><dt>Thời lượng</dt><dd>${duration} giờ</dd></div>
        <div><dt>Tổng tiền</dt><dd>${total.toLocaleString('vi-VN')}đ</dd></div>
        <div><dt>Liên hệ</dt><dd>${name} · ${phone}</dd></div>
      </dl>
      <button type="button" class="btn-book btn-book-full" id="bkDone">Đóng</button>
    </div>
  `
  document.getElementById('bkDone').addEventListener('click', () => closeModal('bookModal'))
  toast(`Đặt sân thành công · ${booking.id}`)
}

// ================================ VỊ TRÍ ================================

function haversine(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function locateMe() {
  if (!navigator.geolocation) {
    toast('Trình duyệt không hỗ trợ định vị')
    return
  }
  toast('Đang lấy vị trí của bạn...')
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const me = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      const sorted = VENUES.slice()
        .map((v) => ({ v, d: haversine(me, v) }))
        .sort((a, b) => a.d - b.d)

      const nearest = sorted[0]
      if (!nearest) return
      toast(`Sân gần bạn nhất: ${nearest.v.name} · ${nearest.d.toFixed(1)} km`)

      const ul = document.getElementById('nearbyList')
      if (ul) {
        ul.innerHTML = sorted
          .slice(0, 4)
          .map(
            ({ v, d }) => `
      <li>
        <img class="nearby-thumb" src="${v.img}" alt="">
        <div>
          <div class="nearby-name">${v.name}</div>
          <div class="nearby-addr">${v.addr}</div>
        </div>
        <span class="nearby-price">${d.toFixed(1)} km</span>
      </li>`
          )
          .join('')
      }
    },
    () => toast('Không lấy được vị trí. Vui lòng bật quyền định vị trên trình duyệt.'),
    { timeout: 8000, maximumAge: 60000 }
  )
}

// ================================ SỐ LIỆU ================================

/** Ghi số liệu từ một nguồn duy nhất để badge, hero-stats và sport-card không mâu thuẫn. */
function applyStats() {
  const badge = document.getElementById('heroVenueCount')
  if (badge) badge.textContent = String(TOTAL_VENUES)

  const stats = document.querySelectorAll('[data-stat]')
  stats.forEach((el) => {
    const key = el.getAttribute('data-stat')
    if (key === 'venues') el.textContent = String(TOTAL_VENUES)
    if (key === 'courts') el.textContent = String(TOTAL_COURTS)
    if (key === 'sports') el.textContent = String(SPORT_COUNTS.length)
  })

  document.querySelectorAll('.sport-card').forEach((card) => {
    const sport = card.getAttribute('data-sport') || ''
    const entry = SPORT_COUNTS.find((s) => s.sport === sport)
    const label = card.querySelector('.sport-count')
    if (entry && label) label.textContent = `${entry.count} sân`
  })
}

// expose for backward compat if HTML still uses inline handlers
window.handleSearch = handleSearch
window.locateMe = locateMe
window.subscribe = (e) => {
  e.preventDefault()
  toast('Đăng ký thành công! Voucher đã gửi qua email.')
  e.target.reset()
  return false
}

document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year')
  if (y) y.textContent = String(new Date().getFullYear())

  applyStats()
  renderProvinces('bong-da')
  applyFilters({ silent: true })

  // Ô tìm kiếm: lọc ngay khi gõ để không phải bấm nút
  const locInput = document.getElementById('qLocation')
  locInput?.addEventListener('input', () => applyFilters({ silent: true }))

  const searchForm = document.getElementById('searchForm')
  if (searchForm) searchForm.addEventListener('submit', handleSearch)

  // select Loại sân lọc ngay, và đồng bộ ngược lại sport-card
  const sportSelect = document.getElementById('qSport')
  sportSelect?.addEventListener('change', () => applyFilters({ scroll: true }))

  const dateInput = document.getElementById('qDate')
  dateInput?.addEventListener('change', () => applyFilters({ scroll: true }))

  document.getElementById('venueEmptyReset')?.addEventListener('click', clearFilters)

  document.getElementById('btnLocate')?.addEventListener('click', locateMe)

  const footerForm = document.getElementById('footerForm')
  if (footerForm) footerForm.addEventListener('submit', (e) => {
    e.preventDefault()
    toast('Đăng ký thành công! Voucher đã gửi qua email.')
    e.target.reset()
  })

  // sport-card: chỉ đặt bộ lọc, không tự render riêng -> tránh lệch với form
  document.querySelectorAll('.sport-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault()
      const s = card.getAttribute('data-sport') || ''
      sportSelect.value = s
      applyFilters({ scroll: true })
    })
  })

  // dropdown "Loại sân" trên navbar
  document.querySelectorAll('#ddType .dropdown-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      sportSelect.value = item.getAttribute('data-sport') || ''
      applyFilters({ scroll: true })
    })
  })

  // province tabs
  document.querySelectorAll('.sport-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sport-tab').forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      renderProvinces(btn.getAttribute('data-sport'))
    })
  })

  // modal
  document.querySelectorAll('.modal-overlay').forEach((ov) => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeModal(ov.id)
    })
  })
  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')?.id))
  })

  // mobile nav toggle
  const navToggle = document.getElementById('navToggle')
  const navMenu = document.getElementById('navMenu')
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.contains('open')
      navMenu.classList.toggle('open', !isOpen)
      navToggle.setAttribute('aria-expanded', String(!isOpen))
      navToggle.innerHTML = isOpen ? '<i class="fa-solid fa-bars"></i>' : '<i class="fa-solid fa-xmark"></i>'
    })
  }

  // dropdown
  const dropdowns = document.querySelectorAll('.dropdown')
  dropdowns.forEach((dd) => {
    const toggle = dd.querySelector('.dropdown-toggle')
    if (!toggle) return
    toggle.addEventListener('click', (e) => {
      e.preventDefault()
      const isOpen = dd.classList.contains('open')
      closeAllDd()
      if (!isOpen) dd.classList.add('open')
    })
  })

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) closeAllDd()
    if (navMenu && navToggle && !e.target.closest('#navMenu') && !e.target.closest('#navToggle')) {
      navMenu.classList.remove('open')
      navToggle.setAttribute('aria-expanded', 'false')
      navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>'
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDd()
      if (navMenu) {
        navMenu.classList.remove('open')
        navToggle?.setAttribute('aria-expanded', 'false')
        if (navToggle) navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>'
      }
      document.querySelectorAll('.modal-overlay.open').forEach((m) => closeModal(m.id))
    }
  })

  function closeAllDd() {
    dropdowns.forEach((dd) => dd.classList.remove('open'))
  }
})
