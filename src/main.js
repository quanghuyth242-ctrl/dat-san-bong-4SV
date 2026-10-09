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

const PROVINCES = ['Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ','Bình Dương','Đồng Nai','Khánh Hòa','Nghệ An','Thanh Hóa','Huế','Quảng Ninh','Bà Rịa - Vũng Tàu','Lâm Đồng','Kiên Giang','Bắc Ninh','Hải Dương','Hưng Yên','Nam Định','Thái Nguyên','Quảng Nam','Bình Định','Gia Lai','Đắk Lắk','Long An','Tiền Giang','Vĩnh Long','An Giang','Bình Thuận','Ninh Thuận','Phú Yên','Quảng Ngãi','Bình Phước','Tây Ninh']

/**
 * Quy mô nền tảng dùng cho phần giới thiệu (promo + footer). Đây là số liệu
 * quảng bá, KHÔNG phải số đếm từ dữ liệu. Phần tìm sân, hero và lưới tỉnh
 * dùng số thật từ VENUES (xem datasetStats() và provinceStats()).
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

function isPastSlot(date, hour) {
  if (date !== todayStr() || hour === null) return false
  const now = new Date()
  return hour < now.getHours() + now.getMinutes() / 60
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
  if (when && when.hasTime && isPastSlot(when.date, when.hour)) return false
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
  if (isPastSlot(date, h)) return false
  if (h < venue.hours.open || h + duration > venue.hours.close) return false
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
    },
  }
}

/** Yêu cầu do trợ lý ở trang khác chuyển sang: điền bộ lọc rồi chạy tìm kiếm. */
function applyStashedIntent() {
  const intent = takeStashedIntent()
  if (!intent) return
  applyIntentToFilters(intent)
  applyFilters({ scroll: true })
  toast('Đã điền yêu cầu của bạn vào ô tìm kiếm')
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
        <img src="${esc(v.img)}" alt="${esc(v.name)}" loading="lazy">
        <span class="court-badge">${v.icon} ${esc(typeLabel(v.type))}</span>
      </div>
      <div class="court-body">
        <div class="court-name">${esc(v.name)}</div>
        <div class="court-addr"><i class="fa-solid fa-location-dot"></i><span>${esc(v.addr)}</span></div>
        <div class="court-hours"><i class="fa-regular fa-clock"></i> ${timeLabel(v.hours.open)} – ${timeLabel(v.hours.close)}</div>
        <div class="court-meta">
          <div class="court-price">${formatPriceShort(v.price)} <small>${esc(v.per)}</small></div>
          <div class="court-courts">${v.courts} sân</div>
        </div>
        <a href="#" class="btn-book" data-book="${esc(v.id)}">Đặt sân</a>
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
      <img class="nearby-thumb" src="${esc(v.img)}" alt="">
      <div>
        <div class="nearby-name">${esc(v.name)}</div>
        <div class="nearby-addr">${esc(v.addr)}</div>
      </div>
      <span class="nearby-price">${formatPriceShort(v.price)}</span>
    </li>
  `
    )
    .join('')
}

// ================================ TỈNH THÀNH ================================

/** Khoá so khớp tỉnh: bỏ dấu, thường hoá, gộp mọi dấu phân cách thành khoảng trắng. */
function provinceKey(name) {
  return expand(name).replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Tỉnh của một sân, ưu tiên tên dài nhất ("TP. Hồ Chí Minh" hơn "Hà Nội"). */
function matchProvince(v) {
  const hay = provinceKey(`${v.name} ${v.addr}`)
  let best = null
  // Tạo khi cần: ABBREVIATIONS khai báo sau nên không được gọi provinceKey ở top-level.
  for (const p of PROVINCES.map((name) => ({ name, key: provinceKey(name) }))) {
    if (hay.includes(p.key) && (!best || p.key.length > best.key.length)) best = p
  }
  return best
}

/**
 * Số sân thật theo tỉnh cho từng loại sân. Trước đây hàm này bịa ra số ngẫu nhiên
 * cho cả 34 tỉnh, khiến 32/34 thẻ dẫn tới trang không có kết quả. Giờ chỉ trả
 * về tỉnh thực sự có sân, nên mọi thẻ đều bấm được và ra kết quả.
 */
function provinceStats(pitchType) {
  const counts = new Map()
  for (const v of VENUES) {
    if (pitchType && v.type !== pitchType) continue
    const p = matchProvince(v)
    if (!p) continue
    counts.set(p.name, (counts.get(p.name) || 0) + v.courts)
  }
  return counts
}

function renderProvinces(pitchType) {
  const grid = document.getElementById('provinceGrid')
  if (!grid) return
  const label = pitchType ? typeLabel(pitchType).toLowerCase() : 'sân bóng đá'
  const counts = provinceStats(pitchType)

  if (!counts.size) {
    grid.innerHTML = `<p class="province-empty">Chưa có ${esc(label)} nào được cập nhật địa chỉ. Xem <a href="#san-noi-bat">tất cả sân</a> nhé.</p>`
    return
  }

  grid.innerHTML = PROVINCES.filter((p) => counts.has(p))
    .map((p) => `<a href="#tim-san" class="province-card" data-province="${esc(p)}"><span><span class="province-name">${esc(p)}</span><span class="province-count">${counts.get(p)} ${esc(label)}</span></span><i class="fa-solid fa-chevron-right"></i></a>`)
    .join('')

  grid.querySelectorAll('.province-card').forEach((a) => {
    a.addEventListener('click', () => {
      document.getElementById('qLocation').value = a.dataset.province
      applyFilters({ scroll: true })
      toast(`Tìm ${label} tại ${a.dataset.province}`)
    })
  })
}

// ================================ BỘ LỌC DÙNG CHUNG ================================

let lastResult = VENUES.slice()

/**
 * Điểm vào duy nhất cho mọi thay đổi bộ lọc: submit form, dropdown Loại sân,
 * bấm tab tỉnh, bấm nút xoá lọc. Không bao giờ tự đổi sang hiển thị tất cả.
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

const bookState = { venue: null, duration: 1, refresh: null }

function shakeField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.classList.remove('shake')
  void el.offsetWidth
  el.classList.add('shake')
}

/**
 * Mở form đặt sân. `preset` cho phép trợ lý điền sẵn ngày/giờ/thời lượng đã hiểu
 * được từ câu người dùng.
 */
function openBook(venue, preset = {}) {
  bookState.venue = venue
  bookState.duration = 1

  const user = window.SV?.currentUser ? window.SV.currentUser() : null
  const defaultName = user ? (user.name || '') : ''
  const defaultPhone = user ? (user.phone || '') : ''

  const body = document.getElementById('bookBody')
  if (body) {
    body.innerHTML = `
      <div class="bk-info">
        <img src="${esc(venue.img)}" alt="${esc(venue.name)}" />
        <div>
          <div class="bk-name">${esc(venue.name)}</div>
          <div class="bk-sub">${venue.icon} ${esc(typeLabel(venue.type))} · ${formatPriceShort(venue.price)}${esc(venue.per)} · ${timeLabel(venue.hours.open)} – ${timeLabel(venue.hours.close)}</div>
        </div>
      </div>
      <form id="bookForm" novalidate>
        <div class="bk-grid">
          <div class="bk-field" id="f-date">
            <label for="bkDate">Ngày <span style="color:#dc2626">*</span></label>
            <input type="date" id="bkDate" required />
            <span class="bk-err">Vui lòng chọn ngày không ở quá khứ.</span>
          </div>
          <div class="bk-field" id="f-time">
            <label for="bkTime">Khung giờ <span style="color:#dc2626">*</span></label>
            <select id="bkTime" required></select>
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
            <label for="bkName">Họ tên <span style="color:#dc2626">*</span></label>
            <input type="text" id="bkName" placeholder="VD: Nguyễn Văn A" autocomplete="name" value="${esc(defaultName)}" required />
            <span class="bk-err">Vui lòng nhập họ tên (tối thiểu 2 ký tự).</span>
          </div>
          <div class="bk-field" id="f-phone">
            <label for="bkPhone">Số điện thoại <span style="color:#dc2626">*</span></label>
            <input type="tel" id="bkPhone" placeholder="VD: 0912345678" autocomplete="tel" value="${esc(defaultPhone)}" required />
            <span class="bk-err">Số điện thoại không hợp lệ (VD: 0912345678).</span>
          </div>
          <div class="bk-field" id="f-voucher">
            <label for="bkVoucher">Mã giảm giá (nếu có)</label>
            <input type="text" id="bkVoucher" placeholder="VD: WELCOME4SV" autocomplete="off" />
            <span class="bk-err">Mã giảm giá không dùng được với đơn này.</span>
          </div>
          <div class="bk-field" id="f-total">
            <label>Tổng tiền</label>
            <div class="bk-total" id="bkTotal">0đ</div>
          </div>
        </div>
        <button type="submit" class="btn-book btn-book-full" id="btnConfirmBook"><i class="fa-solid fa-check-circle"></i> Xác nhận đặt sân</button>
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
    const html = buildTimeOptions(bookState.venue || venue, date, bookState.duration)
    sel.innerHTML = html || '<option value="">-- Đã kín lịch --</option>'
  }

  const updateTotal = () => {
    bookState.duration = parseFloat(document.getElementById('bkDuration').value) || 1
    const current = bookState.venue || venue
    const subtotal = Math.round(current.price * bookState.duration)
    const code = document.getElementById('bkVoucher').value.trim().toUpperCase()
    const voucher = code && window.SV?.previewVoucher ? window.SV.previewVoucher(code, subtotal) : null
    const usable = !!(voucher && voucher.ok)

    document.getElementById('f-voucher')?.classList.toggle('invalid', !!code && !usable)

    const el = document.getElementById('bkTotal')
    if (usable) {
      el.innerHTML = `${(subtotal - voucher.discount).toLocaleString('vi-VN')}đ <small style="opacity:.75">(-${voucher.discount.toLocaleString('vi-VN')}đ)</small>`
    } else {
      el.textContent = subtotal.toLocaleString('vi-VN') + 'đ'
    }
    refresh()
  }

  bookState.refresh = updateTotal

  dateInput.addEventListener('change', refresh)
  document.getElementById('bkDuration').addEventListener('change', updateTotal)
  document.getElementById('bkVoucher').addEventListener('input', updateTotal)
  document.getElementById('bookForm').querySelectorAll('input, select').forEach((el) => {
    if (el.id === 'bkVoucher') return
    const clearErr = () => {
      const field = el.closest('.bk-field')
      if (field) {
        field.classList.remove('invalid')
        field.classList.remove('shake')
      }
    }
    el.addEventListener('input', clearErr)
    el.addEventListener('change', clearErr)
  })

  document.getElementById('bookForm').addEventListener('submit', (e) => {
    e.preventDefault()
    submitBooking(venue)
  })

  // Trợ lý có thể điền sẵn thời lượng/ngày/giờ đã hiểu được.
  if (preset.duration && [1, 1.5, 2, 3].includes(Number(preset.duration))) {
    document.getElementById('bkDuration').value = String(preset.duration)
  }
  if (preset.date && preset.date >= todayStr()) {
    dateInput.value = preset.date
  }

  updateTotal()

  if (preset.hour != null) {
    const sel = document.getElementById('bkTime')
    const hours = [...sel.options].map((o) => Number(o.value)).filter(Number.isFinite)
    if (hours.length) {
      sel.value = String(hours.reduce((a, b) => (Math.abs(b - preset.hour) < Math.abs(a - preset.hour) ? b : a)))
    }
  }

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

  const dateInput = document.getElementById('bkDate')
  const timeInput = document.getElementById('bkTime')
  const nameInput = document.getElementById('bkName')
  const phoneInput = document.getElementById('bkPhone')

  const date = dateInput ? dateInput.value : ''
  const startHour = parseFloat(timeInput ? timeInput.value : NaN)
  const duration = bookState.duration
  const name = nameInput ? nameInput.value.trim() : ''
  const phone = phoneInput ? phoneInput.value.trim().replace(/[\s.-]/g, '') : ''

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

  if (!nameOk) {
    nameInput?.focus()
    shakeField('f-name')
    toast('Vui lòng nhập họ và tên của bạn (tối thiểu 2 ký tự)', 'error')
    return
  }
  if (!phoneOk) {
    phoneInput?.focus()
    shakeField('f-phone')
    toast('Vui lòng nhập số điện thoại hợp lệ (10 số, VD: 0912345678)', 'error')
    return
  }
  if (!dateOk) {
    dateInput?.focus()
    shakeField('f-date')
    toast('Vui lòng chọn ngày đặt hợp lệ (không chọn ngày quá khứ)', 'error')
    return
  }
  if (!timeOk) {
    timeInput?.focus()
    shakeField('f-time')
    toast('Khung giờ này đã có người đặt hoặc nằm ngoài giờ hoạt động', 'error')
    return
  }

  const btn = document.getElementById('btnConfirmBook')
  if (btn) {
    btn.disabled = true
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...'
  }

  try {
    const bookFn = window.SV?.createBooking || window.SV?.addBooking
    if (!bookFn) {
      toast('Hệ thống dữ liệu chưa sẵn sàng. Vui lòng tải lại trang.', 'error')
      if (btn) {
        btn.disabled = false
        btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Xác nhận đặt sân'
      }
      return
    }

    const currentUser = window.SV?.currentUser ? window.SV.currentUser() : null

    const result = bookFn({
      courtId: courtKey(venue.id),
      courtName: venue.name,
      date,
      startHour,
      endHour: startHour + duration,
      duration,
      total: venue.price * duration,
      voucherCode: (document.getElementById('bkVoucher')?.value || '').trim().toUpperCase(),
      userId: currentUser?.id || '',
      userName: name,
      customer: { name, phone, email: currentUser?.email || '' },
      status: 'pending',
    })

    if (!result || !result.ok) {
      toast(result?.error || 'Không tạo được đơn đặt, vui lòng thử lại.', 'error')
      if (btn) {
        btn.disabled = false
        btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Xác nhận đặt sân'
      }
      return
    }

    const booking = result.booking
    const body = document.getElementById('bookBody')
    if (body) {
      body.innerHTML = `
        <div class="bk-success">
          <div class="bk-success-icon"><i class="fa-solid fa-check"></i></div>
          <h3>Đặt sân thành công!</h3>
          <p>Mã đơn <b>${booking.id}</b> · Chúng tôi sẽ liên hệ xác nhận sớm nhất.</p>
          <dl class="bk-summary">
            <div><dt>Sân</dt><dd>${esc(venue.name)}</dd></div>
            <div><dt>Ngày</dt><dd>${date}</dd></div>
            <div><dt>Giờ</dt><dd>${timeLabel(startHour)} – ${timeLabel(startHour + duration)}</dd></div>
            <div><dt>Thời lượng</dt><dd>${duration} giờ</dd></div>
            ${
              booking.discount > 0
                ? `<div><dt>Tạm tính</dt><dd style="text-decoration:line-through">${booking.subtotal.toLocaleString('vi-VN')}đ</dd></div>
                   <div><dt>Giảm giá (${esc(booking.voucherCode)})</dt><dd style="color:#16a34a">-${booking.discount.toLocaleString('vi-VN')}đ</dd></div>
                   <div><dt>Tổng tiền</dt><dd><b>${booking.total.toLocaleString('vi-VN')}đ</b></dd></div>`
                : `<div><dt>Tổng tiền</dt><dd>${booking.total.toLocaleString('vi-VN')}đ</dd></div>`
            }
            <div><dt>Liên hệ</dt><dd>${esc(name)} · ${esc(phone)}</dd></div>
          </dl>
          <button type="button" class="btn-book btn-book-full" id="bkDone">Đóng</button>
        </div>
      `
      document.getElementById('bkDone')?.addEventListener('click', () => closeModal('bookModal'))
    }
    toast(`Đặt sân thành công · ${booking.id}`)
  } catch (err) {
    console.error('Lỗi khi đặt sân:', err)
    toast('Đã có lỗi xảy ra khi đặt sân: ' + (err.message || 'vui lòng thử lại'), 'error')
    if (btn) {
      btn.disabled = false
      btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Xác nhận đặt sân'
    }
  }
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

// ================================ ĐÁNH GIÁ ================================

/** Vòng xoay đánh giá, chỉ hiện những đánh giá admin đã duyệt. */
function renderReviews() {
  const wrap = document.getElementById('reviewsGrid')
  if (!wrap) return
  const list = SV.visibleReviews()
  if (list.length === 0) {
    wrap.innerHTML = '<p class="empty-state-4sv">Chưa có đánh giá nào được hiển thị.</p>'
    return
  }
  wrap.innerHTML = list
    .map((r) => {
      const stars = Array.from({ length: 5 }, (_, i) => `<i class="fa-solid fa-star${i < r.rating ? '' : ' is-off'}"></i>`).join('')
      return `
        <article class="review-card">
          <div class="review-head">
            <img src="${esc(r.userAvatar || '')}" alt="" class="review-avatar" loading="lazy" />
            <div>
              <strong>${esc(r.userName)}</strong>
              <span class="review-stars">${stars}</span>
            </div>
          </div>
          <p class="review-text">${esc(r.comment)}</p>
          <footer class="review-foot">
            <span>${esc(r.fieldName || 'Sân bóng')}</span>
            <time>${esc(r.date)}</time>
          </footer>
        </article>`
    })
    .join('')
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
 * mà không cần tải lại. Sân biến mất thì đóng modal đang mở để không đặt nhầm.
 */
function watchStore() {
  SV.on((key) => {
    if (key === 'settings' || key === '*') {
      applySettings()
    }
    if (key === 'reviews' || key === '*') {
      renderReviews()
    }
    if (key === 'fields' || key === '*') {
      VENUES = loadVenues()
      applyStats()
      if (bookState.venue) {
        const current = VENUES.find((v) => v.id === bookState.venue.id)
        if (!current) {
          closeModal('bookModal')
          bookState.venue = null
        } else {
          // Giá / giờ mở cửa / số sân có thể vừa bị admin sửa: lấy lại bản
          // mới để khung giờ và tổng tiền trong modal khỏi cũ.
          bookState.venue = current
          bookState.refresh?.()
        }
      }
    }
    if (key === 'bookings' || key === '*') {
      if (bookState.venue) {
        // Tab khác vừa đặt/huỷ đơn: vẽ lại khung giờ còn trống.
        bookState.refresh?.()
      }
    }
    applyFilters({ silent: true })
    renderProvinces(document.querySelector('.sport-tab.active')?.getAttribute('data-type') || '')
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

  // province tabs
  document.querySelectorAll('.sport-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sport-tab').forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      renderProvinces(btn.getAttribute('data-type'))
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

  // Render đặt cuối cùng, sau khi mọi listener đã gắn xong. Trước đây applyFilters()
  // chạy trước nên chỉ cần một lỗi render là toàn bộ phần còn lại của init bị bỏ.
  try {
    applySettings()
    renderReviews()
    applyStats()
    renderProvinces('')
    applyFilters({ silent: true })
  } catch (e) {
    console.error('Lỗi khởi tạo trang chủ:', e)
    const grid = document.getElementById('featuredGrid')
    if (grid) grid.innerHTML = '<p class="empty-state-4sv">Không tải được danh sách sân. Vui lòng tải lại trang.</p>'
  }

  watchStore()
  initAuthNav()

  // Trợ lý đặt sân: hiểu yêu cầu tiếng Việt, lọc sân và mở form đặt sân.
  mountAssistant(assistantHandlers())
  applyStashedIntent()
})

// ================================ TÀI KHOẢN ĐANG ĐĂNG NHẬP ================================

/**
 * Đã đăng nhập thì ẩn nút "Đăng nhập"/"Đăng ký", thay bằng avatar + tên và menu
 * (tài khoản của tôi / đăng xuất). Đăng nhập ở tab khác thì ô này cũng đổi theo.
 */
function initAuthNav() {
  const box = document.querySelector('[data-auth="user"]')
  const btn = document.getElementById('navUserBtn')
  const menu = document.getElementById('navUserMenu')
  const logout = document.getElementById('navUserLogout')
  if (!box || !btn || !menu) return

  const avatar = document.getElementById('navUserAvatar')
  const name = document.getElementById('navUserName')
  const menuName = document.getElementById('navUserMenuName')
  const mail = document.getElementById('navUserMail')

  function render() {
    const user = SV.currentUser()
    // Ẩn/hiện theo data-auth nên không phải nhớ 2 nút riêng.
    document.querySelectorAll('[data-auth="login"], [data-auth="register"]').forEach((el) => {
      el.hidden = !!user
    })
    box.hidden = !user
    if (!user) {
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
  function closeMenu() {
    menu.hidden = true
    btn.setAttribute('aria-expanded', 'false')
  }

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
