import './style.css'
import { mountAssistant, takeStashedIntent } from './ai-assistant.js'

// Giờ mở/đóng dùng khi nguồn dữ liệu không có (sân cũ chỉ có id/name/type/price).
const DEFAULT_OPEN = 6
const DEFAULT_CLOSE = 22

// Nền tảng chỉ phục vụ sân bóng đá, phân theo số người trong một trận.
const SPORT = 'Bóng đá'

const PITCH_TYPES = ['5', '7', '11']
const PITCH_TYPE_LABEL = { 5: 'Sân 5', 7: 'Sân 7', 11: 'Sân 11' }

/**
 * "Sân 7", "7", 7, "sân 11 người" -> '7' | '5' | '11'.
 * Sân không đọc được số người thì coi như sân 7 vì đây là quy mô phổ biến nhất.
 */
function parsePitchType(value) {
  const match = String(value ?? '').match(/\d+/)
  return PITCH_TYPES.includes(match?.[0]) ? match[0] : '7'
}

// Ảnh mặc định cho sân bóng đá theo loại sân
const FIELD_IMAGES = [
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&q=75',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=75',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&q=75',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&q=75',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=75',
  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&q=75',
  'https://images.unsplash.com/photo-1579952363873-27f3bfad9c0d?w=400&q=75',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=400&q=75',
]

// Sân demo KHÔNG khai ở trang chủ nữa: sân lấy hoàn toàn từ store chung
// (SV.fields()). store.js đã có DEFAULT_FIELDS đúng nội dung này rồi, nếu
// khai hai nơi sẽ lệch nhau khi admin sửa sân.

// ============================= SÂN + TỚI ĐỘA ĐỒ =============================

function toHour(value, fallback) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 && n <= 24 ? n : fallback
}

function toCoord(value) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : null
}

/**
 * Đưa mọi cách viết giá về cùng một số đồng.
 * "300k" -> 300000, "1.2tr" -> 1200000, "300.000đ" -> 300000, 300000 -> 300000.
 * Có hậu tố rút gọn thì dấu chấm là thập phân; không có thì là dấu phân cách nghìn.
 */
function toPriceNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0
  const s = String(value ?? '').trim().toLowerCase().replace(/\s/g, '')
  if (!s) return 0
  const hasTr = /tr/.test(s)
  const hasK = !hasTr && /k/.test(s)
  let digits = s.replace(/[^\d.,]/g, '')
  if (hasTr || hasK) {
    // Dạng rút gọn: dấu phân cách cuối là dấu thập phân, các dấu trước đó là
    // dấu phân cách nghìn. "1,2tr" và "1.2tr" đều phải ra 1.200.000.
    const sep = Math.max(digits.lastIndexOf('.'), digits.lastIndexOf(','))
    const head = sep >= 0 ? digits.slice(0, sep).replace(/[.,]/g, '') : digits
    const tail = sep >= 0 ? digits.slice(sep + 1) : ''
    digits = tail ? head + '.' + tail : head
  } else {
    // Dạng đầy đủ: mọi dấu phân cách đều là dấu nghìn.
    digits = digits.replace(/[.,]/g, '')
  }
  const n = parseFloat(digits)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * (hasTr ? 1e6 : hasK ? 1e3 : 1))
}

/** 300000 -> "300k", 1200000 -> "1,2tr". Chỉ dùng khi hiển thị. */
function formatPriceShort(price) {
  const n = toPriceNumber(price)
  if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace('.', ',') + 'tr'
  if (n >= 1000) return Math.round(n / 1000) + 'k'
  return n.toLocaleString('vi-VN') + 'đ'
}

/** Thoát ký tự HTML: tên/địa chỉ sân đến từ admin_fields có thể chứa markup. */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

/**
 * Mọi sân - kể cả sân tạo trong admin - đều phải có đủ các trường mà phần render
 * và phần đặt sân dùng tới. Trước đây nhánh đọc từ admin bỏ sót `hours`, khiến
 * renderVenues() ném TypeError và làm chết mọi đăng ký sự kiện còn lại.
 */
function normalizeVenue(v, idx = 0) {
  const open = toHour(v.hours?.open, DEFAULT_OPEN)
  const close = toHour(v.hours?.close, DEFAULT_CLOSE)
  return {
    id: String(v.id ?? 'san-' + (idx + 1)),
    name: String(v.name || 'Sân chưa đặt tên'),
    sport: SPORT,
    type: parsePitchType(v.type),
    addr: String(v.addr || v.address || ''),
    price: toPriceNumber(v.price),
    per: v.per || '/tiếng',
    courts: Math.max(1, parseInt(v.courts, 10) || 1),
    hours: { open, close: close > open ? close : open + 1 },
    lat: toCoord(v.lat),
    lng: toCoord(v.lng),
    img: v.img || FIELD_IMAGES[idx % FIELD_IMAGES.length],
    icon: '⚽',
  }
}

/** Nhãn hiển thị của loại sân: '7' -> 'Sân 7'. */
function typeLabel(type) {
  return PITCH_TYPE_LABEL[type] || 'Sân 7'
}

/**
 * Sân lấy thẳng từ store dùng chung: sửa sân ở trang quản trị là trang chủ
 * đổi theo, kể cả khi đang mở trang chủ ở một tab khác.
 *
 * Không fallback về dữ liệu mẫu: admin khoá hết sân thì trang chủ phải
 * hiện 0 sân chứ không tự bật lại sân demo.
 */
function loadVenues() {
  return SV.fields()
    .filter((f) => f.status === 'active')
    .map(normalizeVenue)
}

let VENUES = loadVenues()

/**
 * Quy mô nền tảng dùng cho footer. Đây là số liệu quảng bá, KHÔNG phải số đếm
 * từ dữ liệu. Phần tìm sân và hero dùng số thật từ VENUES (xem datasetStats()).
 */
const PLATFORM = { venues: 629, courts: 858 }

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

/** Chuỗi để tìm kiếm của một sân: tên + địa chỉ + loại sân, đã chuẩn hoá. */
function haystack(v) {
  return expand(`${v.name} ${v.addr} ${typeLabel(v.type)}`)
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

/** "YYYY-MM-DDTHH:MM" theo giờ địa phương, làm giá trị min cho input datetime-local. */
function nowLocalInput() {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${todayStr()}T${hh}:${mm}`
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

/**
 * Khung giờ đã qua giờ đặt chưa.
 * - Khung thường: quá ngay khi đã qua giờ BẮT ĐẦU.
 * - Khung cuối trong ngày (kết thúc đúng giờ đóng cửa): vẫn đặt được cho tới tận giờ đóng cửa.
 * endHour/closeHour không truyền thì giữ luật cũ.
 */
function isPastSlot(date, hour, endHour, closeHour) {
  if (date !== todayStr() || hour === null) return false
  const now = new Date()
  const nowH = now.getHours() + now.getMinutes() / 60
  if (Number.isFinite(endHour) && Number.isFinite(closeHour) && endHour >= closeHour) {
    return nowH >= closeHour
  }
  return hour < nowH
}

function matches(v, filters) {
  const { loc, type, when } = filters

  if (type && v.type !== type) return false
  if (loc) {
    const hay = haystack(v)
    // Mọi từ trong từ khoá đều phải xuất hiện -> "sân 7 hà nội" hoạt động
    if (!loc.split(' ').every((t) => hay.includes(t))) return false
  }
  if (when && !isOpenAt(v, when)) return false
  if (when && when.hasTime && isPastSlot(when.date, when.hour, when.hour + 1, v.hours.close)) return false
  return true
}

function readFilters() {
  return {
    loc: expand(document.getElementById('qLocation')?.value || ''),
    type: document.getElementById('qType')?.value || '',
    when: parseWhen(document.getElementById('qDate')?.value || ''),
  }
}

function hasAnyFilter(f) {
  return Boolean(f.loc || f.type || f.when)
}

function describeFilters(f) {
  const bits = []
  if (f.type) bits.push(typeLabel(f.type))
  if (f.loc) bits.push(`tại "${f.loc}"`)
  if (f.when?.hasTime) bits.push(`${f.when.date} lúc ${timeLabel(f.when.hour)}`)
  else if (f.when) bits.push(`ngày ${f.when.date}`)
  return bits.join(' · ')
}

// ================================ ĐẶT SÂN ================================

function loadBookings() {
  return SV.bookings()
}

/**
 * Khoá so khớp duy nhất cho một sân. Ba nguồn từng dùng ba kiểu mã khác nhau:
 * sân demo trang chủ 'demo-N', sân trang danh sách 'san-N', sân admin tạo
 * 'SAN003'. Store đã chuẩn hoá mã khi ghi nhưng đơn cũ vẫn còn trong máy
 * người dùng, nên vẫn cần quy về cùng một khuôn khi so khớp.
 */
function courtKey(id) {
  const raw = String(id)
  const digits = raw.replace(/^san-/, '')
  return /^\d+$/.test(digits) ? 'san-' + Number(digits) : raw
}

function isSlotTaken(venueId, date, startHour, duration) {
  // Nhờ store quyết định để đơn đã huỷ không còn chiếm slot và không lệch
  // với trang đặt sân / trang quản trị.
  return SV.isSlotTaken(venueId, date, startHour, duration)
}

// ================================ TRỢ LÝ ĐẶT SÂN ================================

// Vị trí người dùng đã lấy được (chỉ trong phiên này). Trợ lý dùng để xếp sân
// theo khoảng cách khi người dùng nói "gần tôi".
let lastCoords = null

/** Khung giờ đặt sân dùng giờ tròn, nên làm tròn lên khi kiểm tra chỗ trống. */
function hasFreeSlot(venue, date, hour, duration = 1) {
  const h = Math.ceil(hour)
  if (!date || !Number.isFinite(h)) return true
  if (h < venue.hours.open || h + duration > venue.hours.close) return false
  if (isPastSlot(date, h, h + duration, venue.hours.close)) return false
  return !isSlotTaken(venue.id, date, h, duration)
}

/** Đổ kết quả trợ lý hiểu được vào các ô lọc trên trang chủ. */
function applyIntentToFilters(intent) {
  const loc = document.getElementById('qLocation')
  const type = document.getElementById('qType')
  const date = document.getElementById('qDate')
  if (loc) loc.value = intent.loc || ''
  if (type) type.value = String(intent.fieldType || '').match(/\d+/)?.[0] || ''
  if (date) {
    if (!intent.date) date.value = ''
    else if (intent.hour == null) date.value = intent.date
    else {
      const hh = String(Math.floor(intent.hour)).padStart(2, '0')
      const mm = String(Math.round((intent.hour % 1) * 60)).padStart(2, '0')
      date.value = `${intent.date}T${hh}:${mm}`
    }
  }
}

function assistantHandlers() {
  return {
    venues: VENUES,
    hasSlot: hasFreeSlot,
    getCoords: () => lastCoords,
    getBookings: loadBookings,
    getUser: () => (SV.currentUser ? SV.currentUser() : null),
    requestLocation: (done) => {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lastCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          done()
        },
        () => done(),
        { timeout: 8000, maximumAge: 60000 },
      )
    },
    onSearch: (intent) => {
      applyIntentToFilters(intent)
      applyFilters({ scroll: false, silent: true })
    },
    onBook: (venue, intent) => {
      openBook(venue, { date: intent.date, hour: intent.hour, duration: intent.duration })
      // openBook() reset cờ, đánh dấu lại: form này mở từ khung chat.
      bookFromChat = true
    },
  }
}

/** Yêu cầu do trợ lý ở trang khác chuyển sang: điền bộ lọc rồi chạy tìm kiếm. */
function applyStashedIntent() {
  const intent = takeStashedIntent()
  if (!intent) return
  applyIntentToFilters(intent)
  applyFilters({ scroll: true })
  // Trợ lý ở trang tài khoản đã chọn sẵn sân -> mở luôn form đặt sân cho sân đó.
  if (intent.venueId) {
    const venue = VENUES.find((v) => String(v.id) === String(intent.venueId))
    if (venue) {
      setTimeout(() => {
        openBook(venue, { date: intent.date, hour: intent.hour, duration: intent.duration })
        // Form này mở theo yêu cầu từ khung chat ở trang khác.
        bookFromChat = true
      }, 250)
      return
    }
  }
  toast('Đã điền yêu cầu của bạn vào ô tìm kiếm')
}

/**
 * Trang chi tiết sân (?book=id) đưa người dùng về đây và mở thẳng form đặt sân
 * cho đúng sân họ vừa xem, không phải tìm lại trong danh sách.
 */
function openBookFromQuery() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('book')
  if (!id) return
  const venue = VENUES.find(
    (v) => String(v.id) === id || SV.courtKey(v.id) === SV.courtKey(id),
  )
  if (!venue) return
  // Dịch vụ đi kèm chọn ở trang chi tiết (?svc=nuoc-suoi:2,trong-tai:1).
  const presetServices = {}
  const svcParam = params.get('svc')
  if (svcParam) {
    svcParam.split(',').forEach((pair) => {
      const [svcId, qty] = pair.split(':')
      const n = parseInt(qty, 10)
      if (svcId && n > 0) presetServices[svcId.trim()] = n
    })
  }
  // Bỏ query khỏi thanh địa chỉ để F5 không mở lại modal lần nữa.
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  setTimeout(() => {
    openBook(venue, { services: presetServices })
    bookFromChat = true
  }, 300)
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
    .map((v) => {
      // Ảnh, tên và nút "Chi tiết" đều mở trang chi tiết của chính sân này.
      const detail = `src/chi-tiet.html?id=${encodeURIComponent(v.id)}`
      return `
    <div class="court-card">
      <a class="court-img-wrap" href="${detail}" aria-label="Xem chi tiết ${esc(v.name)}">
        <img src="${esc(v.img)}" alt="${esc(v.name)}" loading="lazy">
        <span class="court-badge">${v.icon} ${esc(typeLabel(v.type))}</span>
      </a>
      <div class="court-body">
        <a class="court-name" href="${detail}">${esc(v.name)}</a>
        <div class="court-addr"><i class="fa-solid fa-location-dot"></i><span>${esc(v.addr)}</span></div>
        <div class="court-hours"><i class="fa-regular fa-clock"></i> ${timeLabel(v.hours.open)} – ${timeLabel(v.hours.close)}</div>
        <div class="court-meta">
          <div class="court-price">${formatPriceShort(v.price)} <small>${esc(v.per)}</small></div>
          <div class="court-courts">${v.courts} sân</div>
        </div>
        <div class="court-actions">
          <a href="${detail}" class="btn-book btn-detail">Chi tiết</a>
          <a href="#" class="btn-book" data-book="${esc(v.id)}">Đặt sân</a>
        </div>
      </div>
    </div>
  `
    })
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
      <a class="nearby-link" href="src/chi-tiet.html?id=${encodeURIComponent(v.id)}">
        <img class="nearby-thumb" src="${esc(v.img)}" alt="">
        <div>
          <div class="nearby-name">${esc(v.name)}</div>
          <div class="nearby-addr">${esc(v.addr)}</div>
        </div>
        <span class="nearby-price">${formatPriceShort(v.price)}</span>
      </a>
    </li>
  `
    )
    .join('')
}

// ================================ BỘ LỌC DÙNG CHUNG ================================

let lastResult = VENUES.slice()

/**
 * Điểm vào duy nhất cho mọi thay đổi bộ lọc: submit form, dropdown Loại sân,
 * link data-type ở navbar/footer, nút xoá lọc. Không bao giờ tự đổi sang hiển thị tất cả.
 */
function applyFilters({ scroll = false, silent = false } = {}) {
  const filters = readFilters()
  const list = VENUES.filter((v) => matches(v, filters))
  lastResult = list

  renderVenues(list, filters)
  renderNearby(list)
  renderMapFields(list)
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

/** Giữ select qType và mọi link [data-type] luôn khớp với bộ lọc đang chạy. */
function syncFilterUI(filters) {
  const type = filters?.type ?? document.getElementById('qType')?.value ?? ''

  document.querySelectorAll('a[data-type]').forEach((item) => {
    item.classList.toggle('active', (item.getAttribute('data-type') || '') === type)
  })
}

function setTypeFilter(type) {
  const select = document.getElementById('qType')
  if (select) select.value = type || ''
  applyFilters({ scroll: true })
}

function clearFilters() {
  document.getElementById('qLocation').value = ''
  document.getElementById('qType').value = ''
  document.getElementById('qDate').value = ''
  applyFilters({ silent: true })
  toast('Đã xoá bộ lọc')
}

function handleSearch(e) {
  e.preventDefault()
  applyFilters({ scroll: true })
}

// ================================ MODAL ĐẶT SÂN ================================

/** Form đặt sân do trợ lý mở: người dùng đóng mà chưa đặt xong thì mở lại khung chat. */
let bookFromChat = false

/** Tham chiếu trợ lý đặt sân để mở/đóng khung chat từ các handler của trang. */
let assistant = null

/**
 * Mở form đặt sân dùng chung (DatSanModal). `preset` cho phép trợ lý điền sẵn
 * ngày/giờ/thời lượng/dịch vụ đã hiểu được từ câu người dùng.
 */
function openBook(venue, preset = {}) {
  bookFromChat = false
  DatSanModal.open(venue, {
    services: preset.services,
    date: preset.date,
    hour: preset.hour,
    duration: preset.duration,
    onClose: () => {
      // Đóng form đặt sân mở từ trợ lý mà chưa đặt được -> mở lại khung chat
      // để người dùng đổi sân/khung giờ mà không phải tìm lại từ đầu.
      if (bookFromChat) {
        bookFromChat = false
        assistant?.say?.('Form đặt sân đã đóng. Bạn muốn chọn <b>sân khác</b> hay <b>khung giờ khác</b> không? Cứ nhắn mình nhé!')
      }
    },
  })
}

// Modal "Đặt sân" (bookModal) giờ do DatSanModal quản lý toàn bộ: mở/đóng/dựng
// form và trả lại khung chat khi đóng (xem openBook -> DatSanModal.onClose).
// closeModal chỉ là helper gỡ class cho các modal khác của trang (nếu có).
function closeModal(id) {
  const m = document.getElementById(id)
  if (!m) return
  m.classList.remove('open')
  document.body.style.overflow = ''
}
// ================================ VỊ TRÍ ================================

// openstreetmap.org không truy cập được ở một số mạng nội bộ, CARTO thì bắt
// API key, nên dùng tile Esri World Street Map (y/x đảo chiều so với OSM).
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const TILE_ATTR = 'Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, INCREMENT P, USGS'
const MAP_ZOOM = 12

let map = null
let meMarker = null
const fieldLayers = new Map()

/**
 * Tâm bản đồ bám theo sân đang có thay vì đoạn cứng: sân do admin nhập ở Hà Nội
 * thì bản đồ không mở ở TP.HCM với những chấm nhỏ ngoài khung.
 */
function mapViewFor(list) {
  const points = list.filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng))
  if (points.length === 0) return { center: [21.0285, 105.8542], zoom: MAP_ZOOM }
  const lat = points.reduce((s, v) => s + v.lat, 0) / points.length
  const lng = points.reduce((s, v) => s + v.lng, 0) / points.length
  const span = points.reduce((s, v) => s + Math.max(Math.abs(v.lat - lat), Math.abs(v.lng - lng)), 0) / points.length
  return { center: [lat, lng], zoom: span > 0.5 ? 10 : span > 0.05 ? 12 : 14 }
}

function pinIcon(isMe) {
  return L.divIcon({
    className: '',
    html: `<div class="map-pin${isMe ? ' is-me' : ''}"><i class="fa-solid ${isMe ? 'fa-location-crosshairs' : 'fa-futbol'}"></i></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  })
}

function initMap() {
  const canvas = document.getElementById('mapCanvas')
  if (!canvas || typeof L === 'undefined') return
  const view = mapViewFor(lastResult)
  map = L.map(canvas, { scrollWheelZoom: false }).setView(view.center, view.zoom)
  L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map)
  renderMapFields(lastResult)
}

function renderMapFields(list) {
  if (!map) return
  fieldLayers.forEach((layer) => map.removeLayer(layer))
  fieldLayers.clear()
  list.forEach((v) => {
    if (!Number.isFinite(v.lat) || !Number.isFinite(v.lng)) return
    const layer = L.marker([v.lat, v.lng], { icon: pinIcon(false), title: v.name })
      .addTo(map)
      .bindPopup(
        `<div class="map-popup"><strong>${esc(v.name)}</strong><span>${esc(v.addr)}</span></div>`
      )
    fieldLayers.set(v.id, layer)
  })
}

function setMePosition(lat, lng) {
  if (!map) return
  meMarker?.remove()
  meMarker = L.marker([lat, lng], { icon: pinIcon(true), title: 'Vị trí của tôi' }).addTo(map)
  map.setView([lat, lng], 14)
}

function haversine(a, b) {
  if (![a.lat, a.lng, b.lat, b.lng].every(Number.isFinite)) return Infinity
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
      // Sân tạo trong admin không có toạ độ nên bị loại khỏi danh sách khoảng cách.
      const sorted = VENUES.map((v) => ({ v, d: haversine(me, v) }))
        .filter((x) => Number.isFinite(x.d))
        .sort((a, b) => a.d - b.d)

      const ul = document.getElementById('nearbyList')
      if (!sorted.length) {
        if (ul) ul.innerHTML = '<li class="nearby-empty">Chưa có sân nào được ghi toạ độ. Bạn có thể tìm theo địa điểm ở ô tìm sân.</li>'
        toast('Các sân trong danh sách chưa có toạ độ để so khoảng cách', 'error')
        return
      }

      const nearest = sorted[0]
      toast(`Sân gần bạn nhất: ${nearest.v.name} · ${nearest.d.toFixed(1)} km`)

      setMePosition(me.lat, me.lng)

      if (ul) {
        ul.innerHTML = sorted
          .slice(0, 4)
          .map(
            ({ v, d }) => `
      <li>
        <img class="nearby-thumb" src="${esc(v.img)}" alt="">
        <div>
          <div class="nearby-name">${esc(v.name)}</div>
          <div class="nearby-addr">${esc(v.addr)}</div>
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

/** Số liệu đếm thật từ danh sách sân đang dùng. */
function datasetStats() {
  return {
    venues: VENUES.length,
    courts: VENUES.reduce((sum, v) => sum + v.courts, 0),
    types: new Set(VENUES.map((v) => v.type)).size,
  }
}

/**
 * Ghi số liệu từ một nguồn duy nhất để badge và hero-stats không mâu thuẫn.
 * `data-stat` = số thật từ dữ liệu; `data-platform-stat` = số quy mô nền tảng.
 */
function applyStats() {
  const real = datasetStats()
  const badge = document.getElementById('heroVenueCount')
  if (badge) badge.textContent = String(real.venues)

  document.querySelectorAll('[data-stat]').forEach((el) => {
    const key = el.getAttribute('data-stat')
    if (key in real) el.textContent = String(real[key])
  })

  document.querySelectorAll('[data-platform-stat]').forEach((el) => {
    const key = el.getAttribute('data-platform-stat')
    if (key in PLATFORM) el.textContent = String(PLATFORM[key])
  })
}

// ================================ CÀI ĐẶT CHUNG ================================

/** Tên, logo, màu và dark mode do admin đặt trong trang giao diện áp ở trang chủ. */
function applySettings() {
  const s = SV.settings()
  if (s.siteName) {
    document.querySelectorAll('[data-site-name]').forEach((el) => {
      el.textContent = s.siteName
    })
    document.title = `${s.siteName} - Đặt sân bóng đá online`
  }
  // Trang giao diện admin đặt ở --primary, trang chủ dùng --4sv-primary (mà
  // các biến xanh trong style.css dẫn xuất từ nó): ghi cả hai cho nhất quán.
  document.documentElement.style.setProperty('--primary', s.primaryColor || '#16a34a')
  document.documentElement.style.setProperty('--4sv-primary', s.primaryColor || '#16a34a')
  document.documentElement.classList.toggle('dark', !!s.darkMode)
  document.body.classList.toggle('dark-mode', !!s.darkMode)
  document.querySelectorAll('img[data-site-logo]').forEach((el) => {
    // Admin xoá logo thì trở về chữ, không giữ ảnh cũ.
    el.hidden = !s.logo
    if (s.logo) el.src = s.logo
  })
}

// ================================ ĐỒNG BỘ CHÉO TAB ================================

/**
 * Admin hoặc trang khác sửa dữ liệu trong tab khác thì trang chủ cập nhật ngay
 * mà không cần tải lại. Form đặt sân dùng chung (DatSanModal) tự lắng nghe
 * store để tự cập nhật/dựng form đang mở, nên trang chỉ cần tải lại danh sách.
 */
function watchStore() {
  SV.on((key) => {
    if (key === 'settings' || key === '*') {
      applySettings()
    }
    if (key === 'fields' || key === '*') {
      VENUES = loadVenues()
      applyStats()
    }
    applyFilters({ silent: true })
    if (map) renderMapFields(VENUES)
  })
}

// expose for backward compat if HTML still uses inline handlers
window.handleSearch = handleSearch
window.locateMe = locateMe

document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year')
  if (y) y.textContent = String(new Date().getFullYear())

  const typeSelect = document.getElementById('qType')

  // Ô tìm kiếm: lọc ngay khi gõ để không phải bấm nút
  const locInput = document.getElementById('qLocation')
  locInput?.addEventListener('input', () => applyFilters({ silent: true }))

  const searchForm = document.getElementById('searchForm')
  if (searchForm) searchForm.addEventListener('submit', handleSearch)

  // select Loại sân lọc ngay, để đồng bộ với dropdown trên navbar
  typeSelect?.addEventListener('change', () => applyFilters({ scroll: true }))

  const dateInput = document.getElementById('qDate')
  // Không cho chọn ngày giờ trong quá khứ (ngoài ra JS vẫn kiểm tra lại khi lọc).
  if (dateInput) dateInput.min = nowLocalInput()
  dateInput?.addEventListener('change', () => applyFilters({ scroll: true }))

  document.getElementById('venueEmptyReset')?.addEventListener('click', clearFilters)

  document.getElementById('btnLocate')?.addEventListener('click', locateMe)

  initMap()

  const footerForm = document.getElementById('footerForm')
  if (footerForm) footerForm.addEventListener('submit', (e) => {
    e.preventDefault()
    toast('Đăng ký thành công! Voucher đã gửi qua email.')
    e.target.reset()
  })

  // Mọi link mang data-type (dropdown "Loại sân" trên navbar + link ở footer)
  // đều đi qua một chỗ để không lệch logic với nhau.
  document.querySelectorAll('a[data-type]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      setTypeFilter(link.getAttribute('data-type') || '')
    })
  })

  // modal (bỏ qua #bookModal — form đặt sân dùng chung do DatSanModal tự quản
  // lý lớp open/dóng và onClose, không cần handler chung ở đây.)
  document.querySelectorAll('.modal-overlay:not(#bookModal)').forEach((ov) => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeModal(ov.id)
    })
  })
  document.querySelectorAll('.modal-close').forEach((btn) => {
    if (btn.closest('#bookModal')) return
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
      document.querySelectorAll('.modal-overlay.open:not(#bookModal)').forEach((m) => closeModal(m.id))
    }
  })

  function closeAllDd() {
    dropdowns.forEach((dd) => dd.classList.remove('open'))
  }

  // Render đặt cuối cùng, sau khi mọi listener đã gắn xong. Trước đây applyFilters()
  // chạy trước nên chỉ cần một lỗi render là toàn bộ phần còn lại của init bị bỏ.
  try {
    applySettings()
    applyStats()
    applyFilters({ silent: true })
  } catch (e) {
    console.error('Lỗi khởi tạo trang chủ:', e)
    const grid = document.getElementById('featuredGrid')
    if (grid) grid.innerHTML = '<p class="empty-state-4sv">Không tải được danh sách sân. Vui lòng tải lại trang.</p>'
  }

  watchStore()
  initAuthNav()

  // Trợ lý đặt sân: hiểu yêu cầu tiếng Việt, lọc sân và mở form đặt sân.
  assistant = mountAssistant(assistantHandlers())
  applyStashedIntent()
  openBookFromQuery()
})

// ================================ TÀI KHOẢN ĐANG ĐĂNG NHẬP ================================

/** 2 nút Đăng nhập/Đăng ký: khớp cả theo data-auth lẫn theo href để không sót trang. */
const AUTH_LINK_SELECTOR =
  '[data-auth="login"], [data-auth="register"], .nav-actions a[href*="auth.html#login"], .nav-actions a[href*="auth.html#register"]'

/**
 * Đã đăng nhập thì ẩn nút "Đăng nhập"/"Đăng ký", thay bằng avatar + tên và menu
 * (tài khoản của tôi / đăng xuất). Đăng nhập ở tab khác thì ô này cũng đổi theo.
 */
function initAuthNav() {
  const box = document.querySelector('[data-auth="user"]')
  const btn = document.getElementById('navUserBtn')
  const menu = document.getElementById('navUserMenu')
  const logout = document.getElementById('navUserLogout')
  // Trang không dựng sẵn ô tài khoản thì vẫn phải ẩn được 2 nút đăng nhập/đăng ký.
  const hasChip = Boolean(box && btn && menu)

  const avatar = document.getElementById('navUserAvatar')
  const name = document.getElementById('navUserName')
  const menuName = document.getElementById('navUserMenuName')
  const mail = document.getElementById('navUserMail')

  function closeMenu() {
    if (!hasChip) return
    menu.hidden = true
    btn.setAttribute('aria-expanded', 'false')
  }

  function render() {
    const user = SV.currentUser()
    // Ẩn/hiện theo data-auth nên không phải nhớ 2 nút riêng. Vừa đặt hidden vừa
    // ghi style.display để chắc chắn ẩn hẳn, kể cả khi CSS gán display cho link.
    document.querySelectorAll(AUTH_LINK_SELECTOR).forEach((el) => {
      const hide = Boolean(user)
      el.hidden = hide
      el.style.display = hide ? 'none' : ''
    })
    if (hasChip) {
      box.hidden = !user
      box.style.display = user ? '' : 'none'
    }
    if (!user || !hasChip) {
      closeMenu()
      return
    }
    const label = user.name || user.email || 'Tài khoản'
    if (name) name.textContent = label
    if (menuName) menuName.textContent = label
    if (mail) mail.textContent = user.email || ''
    if (avatar) {
      // Không có avatar thì dùng chữ cái đầu, không gọi mạng bên ngoài.
      const initial = label.trim().charAt(0).toUpperCase() || '4'
      avatar.src = user.avatar || avatarFor(initial)
      avatar.alt = label
    }
  }

  function avatarFor(initial) {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56">' +
      '<rect width="56" height="56" rx="28" fill="#dcfce7"/>' +
      '<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Be Vietnam Pro,sans-serif" font-size="24" font-weight="700" fill="#16a34a">' +
      esc(initial) +
      '</text></svg>'
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }

  function openMenu() {
    menu.hidden = false
    btn.setAttribute('aria-expanded', 'true')
  }

  if (hasChip) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (menu.hidden) openMenu()
      else closeMenu()
    })
    document.addEventListener('click', (e) => {
      if (!menu.hidden && !box.contains(e.target)) closeMenu()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu()
    })

    logout?.addEventListener('click', () => {
      SV.signOut()
      closeMenu()
      render()
    })
  }

  // Tab khác đăng nhập/đăng xuất, hoặc admin khoá chính tài khoản này.
  SV.on((key) => {
    if (key === 'auth' || key === 'users' || key === '*') render()
  })

  render()
}

// Cho trang khác (danh sách sân) dùng lại: đăng nhập xong thì về trang trước.
window.svSignOut = () => {
  SV.signOut()
}
