/**
 * Trợ lý đặt sân: hiểu câu tiếng Việt của người dùng rồi điền vào bộ lọc / mở form đặt sân.
 *
 * Chạy hoàn toàn trong trình duyệt bằng luật và mẫu câu (không gọi API ngoài):
 * - "sân 7 tối mai 18h ở cầu giấy" -> loại sân + ngày + giờ + địa điểm
 * - "sân rẻ nhất hôm nay"          -> sắp xếp theo giá
 * - "sân gần tôi nhất"              -> dùng vị trí đã lấy được, nếu chưa có thì hỏi xin quyền
 */

import { escapeHtml } from './auth-nav.js'
import { priceValue } from './venues.js'
import { norm, expand, venueHaystack, deaccent } from './vn-text.js'

const STASH_KEY = '4sv_ai_intent'

// ================================ TỪ ĐIỂN ================================

const WEEKDAYS = {
  'chu nhat': 0, 'cn': 0, 'chunhat': 0,
  'thu hai': 1, 'thu 2': 1, 't2': 1,
  'thu ba': 2, 'thu 3': 2, 't3': 2,
  'thu tu': 3, 'thu 4': 3, 't4': 3,
  'thu nam': 4, 'thu 5': 4, 't5': 4,
  'thu sau': 5, 'thu 6': 5, 't6': 5,
  'thu bay': 6, 'thu 7': 6, 't7': 6,
}

const PART_OF_DAY = {
  'sang': { from: 6, to: 11, hint: 'buoi sang' },
  'trua': { from: 11, to: 14, hint: 'buoi trua' },
  'chieu': { from: 14, to: 18, hint: 'buoi chieu' },
  'toi': { from: 18, to: 23, hint: 'buoi toi' },
  'dem': { from: 20, to: 23, hint: 'buoi dem' },
}

const TYPE_WORDS = [
  [/\bsan\s*(?:nam|5)\b/, 'Sân 5'],
  [/\bsan\s*(?:bay|7)\b/, 'Sân 7'],
  [/\bsan\s*(?:muoi\s*mot|11)\b/, 'Sân 11'],
  [/\b(?:nam|5)\s*(?:nguoi|ng)\b/, 'Sân 5'],
  [/\b(?:bay|7)\s*(?:nguoi|ng)\b/, 'Sân 7'],
  [/\b(?:muoi\s*mot|11)\s*(?:nguoi|ng)\b/, 'Sân 11'],
]

/** Sân nào hợp với số người chơi được nói ra ("cho 12 người" -> Sân 11). */
const TEAM_SIZE = [
  [/\b(?:cho|may|hai|co)\s*(\d{1,2})\s*(?:nguoi|ng)\b/, 'team'],
  [/\b(?:cho|may|hai|co)\s*(muoi\s*mot|nam|hai|ba|muoi)\s*(?:nguoi|ng)\b/, 'teamWord'],
]

const NUM_WORDS = { 'mot': 1, 'hai': 2, 'ba': 3, 'bon': 4, 'nam': 5, 'sau': 6, 'bay': 7, 'tam': 8, 'chin': 9, 'muoi': 10 }

/** Khung giờ mà form đặt sân đang cho phép chọn. */
const DURATIONS = [1, 1.5, 2, 3]

// ================================ TIỆN ÍCH NGÀY GIỜ ================================

function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return todayStr(dt)
}

function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

/** Ngày gần nhất >= from rơi vào đúng thứ trong tuần (0 = Chủ nhật). */
function nextWeekday(from, target) {
  const cur = weekdayOf(from)
  const delta = (target - cur + 7) % 7
  return addDays(from, delta)
}

function timeLabel(h) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
}

/** "sau 18:00" nghĩa là 18:30 để vừa khung giờ mở cửa. */
function ceilToHalfHour(h) {
  return Math.ceil(h * 2) / 2
}

// ================================ ĐỌC ĐỊA ĐIỂM TỪ DỮ LIỆU SÂN ================================

/**
 * Gom các từ khoá địa điểm xuất hiện trong tên/địa chỉ sân để so khớp.
 * Ví dụ "68 Cầu Giấy, Cầu Giấy, Hà Nội" -> "cau giay", "ha noi".
 */
function buildPlaceIndex(venues) {
  const generic = /\b(san|san co nhan tao|co|nam tao|football|thuong|nhan tao)\b/g
  const map = new Map()

  for (const v of venues) {
    // Địa chỉ được ưu tiên hơn tên sân khi trùng cụm ("Cầu Giấy" trong addr)
    const parts = [
      [v.addr, true],
      [v.name, false],
    ]
    for (const [part, fromAddr] of parts) {
      if (!part) continue
      for (const chunk of String(part).split(',')) {
        const words = expand(chunk)
          .replace(generic, ' ')
          .replace(GENERIC_PLACE_PHRASE_RE, ' ')
          .replace(/\b(so|ngo|duong|pho|hem|ki)\s*(\d+[a-z]?)\b/g, ' $2 ')
          .split(' ')
          .filter(Boolean)
          .filter((w) => w.length > 1 && !/^\d+$/.test(w))
        // Tên hiển thị: bỏ số nhà ở đầu chunk và tiền tố "sân bóng", "sân cỏ nhân tạo"
        let display = chunk.trim().replace(/^\s*(?:so|ngo|duong|pho|hem|ki|kdt)\s*\d+[a-z]?\s*/i, '').replace(/^\s*\d+[a-z]?\s*/i, '').trim()
        display = stripVenuePrefix(display)
        // Giữ cụm 2-3 từ liền nhau: "cau giay", "nam tu liem"
        for (let i = 0; i < words.length; i++) {
          for (const span of [3, 2]) {
            if (i + span > words.length) continue
            const phrase = words.slice(i, i + span).join(' ')
            const score = span + (fromAddr ? 0.5 : 0)
            const prev = map.get(phrase)
            if (!prev || score > prev.score) map.set(phrase, { text: display, span, score })
          }
        }
      }
    }
  }
  return [...map.entries()].map(([key, val]) => ({ key, ...val })).sort((a, b) => b.score - a.score || b.key.length - a.key.length)
}

/** Từ báo hiệu địa điểm đứng trước tên khu vực ("ở Cầu Giấy", "khu Đà Nẵng"). */
const PLACE_CUES = 'o|tai|khu vuc|khu|gan|quanh|thuoc|ben|canh|gap'

/** Từ chung về địa danh, không dùng để lọc sân. */
const GENERIC_PLACE_WORDS = new Set([
  'quan', 'huyen', 'phuong', 'xa', 'khu', 'vuc', 'khu_vuc',
  'ngo', 'duong', 'hem', 'street', 'so', 'khu_pho',
])

/** Cụm chung ("khu đô thị", "đô thị") cũng cần bỏ, kể cả khi expand() đã mở rộng viết tắt. */
const GENERIC_PLACE_PHRASE_RE = /\b(?:khu\s+(?:do\s+thi|vuc|pho)|do\s+thi)\b/g

/** Từ báo hiệu đoạn thời gian ở cuối câu, dùng để cắt phần địa điểm. */
const TIME_CUT_RE = /^(?:toi|sang|trua|chieu|dem|hom|ngay|cuoi|lien|nay)$/

/** Từ chung trong câu địa điểm, không dùng để lọc sân. */
const NOISE_PLACE_WORDS = new Set([
  'san', 'nha', 'gan', 'cua', 'tim', 'choi', 'dat', 'trong', 'ngoai', 'thuoc', 'ven', 'ben',
  // đại từ và dạng so sánh: "gần em nhất" là tìm sân gần nhất, không phải tên khu vực
  'em', 'toi', 'minh', 'ban', 'nhat',
])

/** Bỏ tiền tố "sân bóng / sân cỏ nhân tạo" trong tên sân để tên địa điểm gọn. */
const VENUE_PREFIX_RE = /^(?:san\s+(?:bong|co(?:\s+nhan\s+tao)?|football)|co(?:\s+nhan\s+tao)?|bong|football|nam\s+tao)\s+/i

/** deaccent() giữ nguyên độ dài nên cắt theo độ dài khớp được với bản có dấu. */
function stripVenuePrefix(str) {
  let out = String(str).trim()
  for (;;) {
    const probe = deaccent(out)
    const m = VENUE_PREFIX_RE.exec(probe)
    if (!m) return out
    out = out.slice(m[0].length).trim()
  }
}

/**
 * Trả về { text: tên địa điểm để hiển thị, words: các từ khoá để lọc sân }.
 * Chỉ nhận cụm >= 2 từ và phải nằm ngay sau từ báo hiệu hoặc ở cuối câu,
 * tránh nhận nhầm môn thể thao làm địa điểm ("đá bóng" -> "Đà Nẵng").
 */
function findPlace(nText, placeIndex) {
  for (const place of placeIndex) {
    if (!place.span || place.span < 2) continue
    const afterCue = new RegExp(`(?:^|\\s)(?:${PLACE_CUES})\\s+${place.key}(?:\\s|$)`)
    const atEnd = new RegExp(`${place.key}\\s*$`)
    if (afterCue.test(nText) || atEnd.test(nText)) {
      return { text: place.text, words: place.key.split(' ') }
    }
  }
  return null
}

/**
 * Câu không có tên địa điểm quen thuộc thì cắt phần sau "ở / tại / gần / khu vực".
 * `soft` là bản bỏ dấu hạ chữ của `raw` nhưng giữ nguyên độ dài, nên cắt theo offset
 * của `soft` vẫn ra đúng chữ người dùng gõ (kể cả dấu tiếng Việt).
 * Đuôi "tối nay / cuối tuần / thứ 7" bị cắt theo TIME_CUT_RE, không phải theo từng từ dừng,
 * nhờ vậy "Hoàng Mai" và "Nam Từ Liêm" không bị mất chữ.
 */
function findFreePlace(soft, raw = soft) {
  if (soft.length !== raw.length) return null
  const m = soft.match(new RegExp(`(?:^|\\s)(?:${PLACE_CUES})\\s+([^?!]+)`))
  if (!m) return null
  const end = m.index + m[0].length
  const start = end - m[1].length
  // soft và raw cùng độ dài nên offset ký tự là chung: cắt ở soft, hiển thị ở raw.
  const tail = m[1].replace(/\s+$/, '')
  let cut = tail.length
  const token = /\S+/g
  let hit
  while ((hit = token.exec(tail))) {
    if (TIME_CUT_RE.test(hit[0])) {
      cut = hit.index
      break
    }
  }
  const text = raw.slice(start, start + cut).trim()
  if (!text) return null
  const words = expand(text)
    .replace(GENERIC_PLACE_PHRASE_RE, ' ')
    .split(' ')
    .filter(Boolean)
    .filter((w) => w.length > 1 && !/^\d/.test(w) && !GENERIC_PLACE_WORDS.has(w) && !NOISE_PLACE_WORDS.has(w))
  // Chỉ toàn từ chung ("quận 10") thì không lọc sân, để bot liệt kê mọi sân trống.
  return words.length ? { text, words } : null
}

// ================================ PARSER ================================

function parseFieldType(nText) {
  for (const [re, type] of TYPE_WORDS) {
    if (re.test(nText)) return type
  }
  for (const [re, kind] of TEAM_SIZE) {
    const m = nText.match(re)
    if (!m) continue
    const size = kind === 'team' ? Number(m[1]) : NUM_WORDS[m[1]]
    if (!Number.isFinite(size)) continue
    if (size >= 11) return 'Sân 11'
    if (size >= 7) return 'Sân 7'
    return 'Sân 5'
  }
  return ''
}

function parseDuration(nText) {
  let best = null
  for (const m of nText.matchAll(/(\d+(?:[.,]\d+)?)\s*(tieng|phut)\b/g)) {
    const value = m[2] === 'phut' ? Number(m[1].replace(',', '.')) / 60 : Number(m[1].replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) continue
    best = value
  }
  if (best === null) return null
  // Về gần nhất khung giờ form cho phép
  return DURATIONS.reduce((a, b) => (Math.abs(b - best) < Math.abs(a - best) ? b : a))
}

function parseTime(nText) {
  const part = Object.keys(PART_OF_DAY).find((k) => new RegExp(`\\b${k}\\b`).test(nText))
  const partInfo = part ? PART_OF_DAY[part] : null

  // "17h30", "17:30", "17.30" — bỏ qua khi phút >= 60 ("19 giờ 90 phút" là 19h, không phải 19h90)
  for (const re of [/\b(\d{1,2})\s*(?:h|gio)\s*(\d{2})\b/, /\b(\d{1,2})\s*[:.]\s*(\d{2})\b/]) {
    const m = nText.match(re)
    if (!m) continue
    const minutes = Number(m[2])
    if (minutes >= 60) continue
    return normalizeHour(Number(m[1]) + minutes / 60, partInfo)
  }

  // "17h", "17 giờ"
  const mHour = nText.match(/\b(\d{1,2})\s*(?:h|gio)\b/)
  if (mHour) {
    const hour = Number(mHour[1])
    if (hour >= 0 && hour <= 23) return normalizeHour(hour, partInfo)
  }

  // Chỉ có "tối" / "chiều" -> chọn giờ điển hình
  if (partInfo) return ceilToHalfHour((partInfo.from + partInfo.to) / 2 - 0.5)

  return null
}

/** Đưa giờ về đúng khung "buổi" người dùng nói ("5 giờ chiều" -> 17:00). */
function normalizeHour(hour, partInfo) {
  if (!Number.isFinite(hour)) return null
  let h = hour
  if (partInfo && hour < 12) {
    if (h < partInfo.from) h += 12
    else if (h > partInfo.to - 1) h += 12
  }
  return h >= 0 && h <= 23.5 ? ceilToHalfHour(h) : null
}

function parseDate(nText, hour, today) {
  // Ngày cụ thể: 15/10, 15/10/2026, 15-10
  let m = nText.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (m) {
    const day = Number(m[1])
    const month = Number(m[2])
    let year = m[3] ? Number(m[3]) : Number(today.slice(0, 4))
    if (year < 100) year += 2000
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return iso >= today ? iso : `${year + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // "ngày 15 tháng 10"
  m = nText.match(/\bngay\s*(\d{1,2})\s*thang\s*(\d{1,2})/)
  if (m) {
    const year = Number(today.slice(0, 4))
    const iso = `${year}-${String(Number(m[2])).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`
    return iso >= today ? iso : addDays(iso, 365)
  }

  if (/\bhom\s*nay\b/.test(nText)) return today
  if (/\bngay\s*kia\b/.test(nText)) return addDays(today, 2)
  if (/\bngay\s*mai\b/.test(nText)) return addDays(today, 1)
  if (/\bcuoi\s*tuan\b/.test(nText)) return nextWeekday(today, 6)
  if (/\btuan\s*sau\b/.test(nText)) return addDays(today, 7)

  // Thứ trong tuần: "thứ 7", "chủ nhật", "cn"
  for (const [key, target] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`(?:^|\\s)${key}(?:\\s|$)`).test(nText)) {
      const base = /\btuan\s*sau\b/.test(nText) ? addDays(today, 7) : today
      return nextWeekday(base, target)
    }
  }

  // Có giờ mà không nói ngày: coi như hôm nay, nếu đã qua thì chuyển sang mai.
  if (hour != null) {
    const now = new Date()
    const nowHour = now.getHours() + now.getMinutes() / 60
    return hour >= nowHour ? today : addDays(today, 1)
  }
  return null
}

/**
 * Đọc một câu của người dùng thành intent có cấu trúc.
 * @returns {{fieldType:string, loc:string, locWords:string[]|null, date:string|null, hour:number|null,
 *            duration:number|null, sort:'price'|'near'|'default', people:number|null, raw:string, understood:boolean}}
 */
export function parseIntent(text, { venues = [], today = todayStr() } = {}) {
  const raw = String(text || '').trim()
  // nText dùng để so từ khoá/địa điểm (đã mở rộng viết tắt).
  // nTime giữ nguyên dấu ":" và "." để không vỡ mấy mốc giờ kiểu "17.30".
  const nText = expand(raw)
  const nTime = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  const intent = {
    raw,
    fieldType: parseFieldType(nText),
    loc: '',
    locWords: null,
    date: null,
    hour: null,
    duration: parseDuration(nText),
    sort: 'default',
    people: null,
    understood: false,
  }

  if (!nText) return intent

  const hour = parseTime(nTime)
  intent.hour = hour
  intent.date = parseDate(nTime, hour, today)

  // Số người chơi: "cho 12 người", "nhóm 10 người"
  const teamM = nText.match(/\b(?:cho|nhom|mot)\s*(\d{1,2})\s*(?:nguoi|ng)\b/)
  if (teamM) intent.people = Number(teamM[1])

  if (/\b(re|re nhat|gia re|thap nhat|it tien nhat)\b/.test(nText)) intent.sort = 'price'
  if (/\b(gan nhat|gan toi|gan em|gan minh|gan ban|gan nha|gan day|gan nhat chung|nearby|o gan)\b/.test(nText)) intent.sort = 'near'

  const placeIndex = buildPlaceIndex(venues)
  // Ưu tiên tên địa điểm có sẵn trong dữ liệu sân; không có thì dùng phần người dùng gõ tự do.
  // `soft` bỏ dấu và đổi dấu câu thành khoảng trắng nhưng giữ nguyên độ dài,
  // nên findFreePlace cắt được đúng chữ người gõ mà không đứt "q.10".
  const soft = deaccent(raw).toLowerCase().replace(/[,;.]/g, ' ')
  const found = findPlace(nText, placeIndex) || findFreePlace(soft, raw)
  intent.loc = found ? found.text : ''
  intent.locWords = found ? found.words : null

  intent.understood = Boolean(intent.fieldType || intent.loc || intent.date || intent.sort !== 'default' || intent.hour !== null)
  return intent
}

// ================================ XẾP HẠNG SÂN ================================

function haversine(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * words = null nghĩa là chưa xác định (lọc theo chữ người dùng gõ),
 * words = [] nghĩa là địa điểm chỉ gồm từ chung ("quận 10") nên không lọc.
 */
function placeMatches(venue, loc, words) {
  if (!loc) return true
  const tokens = (Array.isArray(words) ? words : expand(loc).split(' ')).filter((t) => t.length > 1)
  if (!tokens.length) return true
  const hay = venueHaystack(venue)
  return tokens.every((t) => hay.includes(t))
}

/**
 * Chọn danh sách sân phù hợp intent, kèm lý do để trợ lý giải thích.
 * Ưu tiên sẵn sàng đúng khung giờ người dùng nói, rồi mới tới giá/khoảng cách.
 */
export function rankVenues(intent, { venues = [], coords = null, hasSlot = null } = {}) {
  let list = venues.filter((v) => {
    if (intent.fieldType && v.type !== intent.fieldType) return false
    if (!placeMatches(v, intent.loc, intent.locWords)) return false
    if (intent.hour != null && (intent.hour < v.hours.open || intent.hour >= v.hours.close)) return false
    return true
  })

  const scored = list.map((v) => {
    const free = hasSlot && intent.hour != null && intent.date ? hasSlot(v, intent.date, intent.hour, intent.duration ?? 1) : null
    let score = 0
    if (free === true) score += 100
    if (free === false) score -= 40
    if (intent.sort === 'price') score -= priceValue(v) / 1e6
    if (intent.sort === 'near' && coords) score -= haversine(coords, v)
    // Ưu tiên sân nhiều sân hơn khi người dùng không nói gì về giá.
    if (intent.sort === 'default') score += Math.min(v.courts || 1, 5) * 0.1
    return { v, free, score }
  })

  scored.sort((a, b) => b.score - a.score || priceValue(a.v) - priceValue(b.v))
  return scored.map(({ v, free }) => ({ venue: v, free }))
}

/** Khung giờ trống sớm nhất từ `from` trở đi. */
export function nextFreeHour(venue, { date, duration = 1, from = null, hasSlot = null }) {
  if (!hasSlot || !date) return null
  const start = Math.max(venue.hours.open, from ?? venue.hours.open)
  for (let h = start; h + duration <= venue.hours.close; h += 0.5) {
    if (hasSlot(venue, date, h, duration)) return h
  }
  return null
}

// ================================ GIAO DIỆN ================================

const EXAMPLES = [
  'Sân 7 tối mai 18h ở Cầu Giấy',
  'Sân 5 rẻ nhất hôm nay',
  'Sân gần tôi nhất',
  'Sân 11 cho 12 người',
  'Sân 7 thứ 7 sáng 8h đặt 2 tiếng',
]

function describeIntent(intent) {
  const bits = []
  if (intent.fieldType) bits.push(intent.fieldType)
  if (intent.loc) bits.push(intent.loc)
  if (intent.date) {
    const today = todayStr()
    let label = intent.date
    if (intent.date === today) label = 'hôm nay'
    else if (intent.date === addDays(today, 1)) label = 'ngày mai'
    else if (intent.date === addDays(today, 2)) label = 'ngày kia'
    bits.push(label + (intent.hour != null ? ' ' + timeLabel(intent.hour) : ''))
  } else if (intent.hour != null) {
    bits.push(timeLabel(intent.hour))
  }
  if (intent.duration) bits.push(intent.duration + ' tiếng')
  if (intent.sort === 'price') bits.push('rẻ nhất')
  if (intent.sort === 'near') bits.push('gần nhất')
  return bits.join(' · ')
}

// ================================ WIDGET ================================

const AVATAR = '<i class="fa-solid fa-robot"></i>'

export function mountAssistant(handlers = {}) {
  const {
    venues = [],
    onSearch = null,
    onBook = null,
    getCoords = null,
    requestLocation = null,
    getBookings = null,
    getUser = null,
    stashIntent = null,
  } = handlers

  if (typeof document === 'undefined' || !document.body) return null
  if (document.getElementById('aiAssistant')) return null

  // ----- Nút trôi + khung chat -----
  const fab = document.createElement('button')
  fab.type = 'button'
  fab.className = 'ai-fab'
  fab.id = 'aiFab'
  fab.setAttribute('aria-label', 'Trợ lý đặt sân')
  fab.setAttribute('aria-expanded', 'false')
  fab.innerHTML = `<i class="fa-solid fa-robot"></i><span class="ai-fab-dot"></span>`

  const panel = document.createElement('div')
  panel.className = 'ai-panel'
  panel.id = 'aiPanel'
  panel.innerHTML = `
    <div class="ai-head">
      <div class="ai-head-info">
        <div class="ai-head-title"><i class="fa-solid fa-robot"></i> Trợ lý đặt sân</div>
        <div class="ai-head-sub">Mô tả điều bạn cần, mình tìm giúp</div>
      </div>
      <button type="button" class="ai-head-close" aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="ai-log" id="aiLog"></div>
    <form class="ai-input-row" id="aiForm">
      <input type="text" id="aiField" placeholder="VD: sân 7 tối mai 18h ở Cầu Giấy" autocomplete="off" />
      <button type="submit" class="ai-send" aria-label="Gửi"><i class="fa-solid fa-paper-plane"></i></button>
    </form>
  `

  document.body.appendChild(panel)
  document.body.appendChild(fab)

  const log = panel.querySelector('#aiLog')
  const form = panel.querySelector('#aiForm')
  const field = panel.querySelector('#aiField')
  const closeBtn = panel.querySelector('.ai-head-close')

  let opened = false
  let busy = false

  // ----- Gửi câu hỏi -----
  function pushUser(text) {
    const row = document.createElement('div')
    row.className = 'ai-msg ai-msg-user'
    row.textContent = text
    log.appendChild(row)
    scroll()
  }

  function pushBot(html) {
    const row = document.createElement('div')
    row.className = 'ai-msg ai-msg-bot'
    row.innerHTML = AVATAR + `<div class="ai-bubble">${html}</div>`
    log.appendChild(row)
    scroll()
  }

  function pushTyping() {
    const row = document.createElement('div')
    row.className = 'ai-msg ai-msg-bot ai-typing'
    row.id = 'aiTyping'
    row.innerHTML = AVATAR + '<div class="ai-bubble"><i></i><i></i><i></i></div>'
    log.appendChild(row)
    scroll()
  }

  function scroll() {
    log.scrollTop = log.scrollHeight
  }

  function quickReplies(items) {
    const row = document.createElement('div')
    row.className = 'ai-quick'
    row.innerHTML = items
      .map((t) => `<button type="button" class="ai-chip" data-ask="${escapeHtml(t)}">${escapeHtml(t)}</button>`)
      .join('')
    log.appendChild(row)
    scroll()
  }

  function venueCard(entry, intent, index) {
    const v = entry.venue
    const slot = entry.free
    let slotNote = ''
    if (slot === true) slotNote = '<span class="ai-slot ai-slot-free">Trống khung giờ này</span>'
    else if (slot === false) slotNote = '<span class="ai-slot ai-slot-busy">Đã kín khung giờ này</span>'
    else if (intent.hour != null && intent.date) {
      const alt = nextFreeHour(v, { date: intent.date, duration: intent.duration ?? 1, from: venueOpenFor(v, intent), hasSlot: handlers.hasSlot })
      slotNote = alt != null
        ? `<span class="ai-slot ai-slot-free">Còn trống từ ${timeLabel(alt)}</span>`
        : '<span class="ai-slot ai-slot-busy">Hết lịch trong ngày</span>'
    }
    return `
      <div class="ai-card">
        <img src="${v.img}" alt="" />
        <div class="ai-card-body">
          <div class="ai-card-name">${escapeHtml(v.name)}</div>
          <div class="ai-card-meta">${escapeHtml(v.type || 'Sân bóng')} · ${escapeHtml(v.addr || '')}</div>
          <div class="ai-card-foot">
            <span class="ai-card-price">${escapeHtml(v.price)}${escapeHtml(v.per || '/tiếng')}</span>
            ${slotNote}
          </div>
        </div>
        <button type="button" class="ai-card-btn" data-book="${index}">Đặt</button>
      </div>`
  }

  function venueOpenFor(venue, intent) {
    return intent.hour != null ? Math.max(venue.hours.open, intent.hour) : venue.hours.open
  }

  // ----- Xử lý yêu cầu -----
  function handle(text) {
    const q = String(text || '').trim()
    if (!q || busy) return
    pushUser(q)
    field.value = ''
    busy = true
    pushTyping()

    // Chạy trả lời sau một nhịp để cảm giác như đang "suy nghĩ"
    setTimeout(() => {
      log.querySelector('#aiTyping')?.remove()
      try {
        respond(q)
      } catch (err) {
        console.warn('Trợ lý đặt sân lỗi:', err)
        pushBot('Xin lỗi, mình bị lỗi khi xử lý. Bạn thử nói lại giúp mình nhé.')
      } finally {
        busy = false
      }
    }, 260)
  }

  function respond(text) {
    // Câu hỏi về đơn của chính mình
    const n = norm(text)
    if (getBookings && /\b( don | lich su | da dat | trang thai | don cua toi )\b/.test(n)) {
      const user = getUser ? getUser() : null
      const email = (user && user.email) || ''
      const phone = (user && user.phone) || ''
      const mine = getBookings().filter(
        (b) => (email && (b.userEmail === email || b.customer?.email === email)) || (phone && b.customer?.phone === phone),
      )
      if (!mine.length) {
        pushBot('Bạn chưa có đơn nào. Nói giúp mình loại sân, khu vực và khung giờ nhé.')
        quickReplies(EXAMPLES.slice(0, 2))
        return
      }
      const pending = mine.filter((b) => b.status === 'pending').length
      pushBot(
        `Bạn có <b>${mine.length}</b> đơn, trong đó <b>${pending}</b> đang chờ xác nhận. Đơn gần nhất: <b>${escapeHtml(mine[mine.length - 1].courtName || '')}</b> ${formatWhen(mine[mine.length - 1])}.`,
      )
      quickReplies(['Đặt thêm 1 sân', 'Sân rẻ nhất hôm nay'])
      return
    }

    const intent = parseIntent(text, { venues })
    const coords = getCoords ? getCoords() : null

    if (!intent.understood) {
      pushBot('Mình chưa nắm được bạn muốn tìm gì. Bạn thử nói như: <b>“sân 7 tối mai 18h ở Cầu Giấy”</b>.')
      quickReplies(EXAMPLES)
      return
    }

    // "gần tôi" mà chưa có vị trí -> xin quyền định vị rồi thử lại
    if (intent.sort === 'near' && !coords) {
      if (requestLocation) {
        pushBot('Mình cần vị trí của bạn để tìm sân gần nhất. Cho phép định vị nhé!')
        requestLocation(() => {
          pushTyping()
          setTimeout(() => {
            log.querySelector('#aiTyping')?.remove()
            const now = getCoords ? getCoords() : null
            const results = rankVenues(intent, { venues, coords: now, hasSlot: handlers.hasSlot })
            if (!results.length) {
              pushBot('Chưa lấy được vị trí. Bạn thử cho tên khu vực như “quận Cầu Giấy” nhé.')
              quickReplies(EXAMPLES)
              return
            }
            replyResults(results, intent)
          }, 300)
        })
        return
      }
      pushBot('Mình chưa có vị trí của bạn. Bạn cho tên khu vực giúp mình nhé.')
      quickReplies(EXAMPLES)
      return
    }

    const results = rankVenues(intent, { venues, coords, hasSlot: handlers.hasSlot })

    if (onSearch) onSearch(intent, results)
    if (stashIntent) stashIntent(intent)

    if (!results.length) {
      const only = [intent.fieldType, intent.loc].filter(Boolean).join(' ở ')
      pushBot(
        `Không tìm thấy sân nào khớp <b>${escapeHtml(only || 'yêu cầu của bạn')}</b>${
          intent.date ? ' vào ' + escapeHtml(formatDate(intent.date)) + (intent.hour != null ? ' ' + timeLabel(intent.hour) : '') : ''
        }.`,
      )
      quickReplies([
        'Bỏ địa điểm, xem tất cả',
        'Sân 5 rẻ nhất hôm nay',
        'Sân 7 tối mai 18h',
      ])
      return
    }

    replyResults(results, intent)
  }

  function replyResults(results, intent) {
    const top = results.slice(0, 3)
    const freeCount = top.filter((r) => r.free === true).length
    const head = [
      `Mình tìm được <b>${results.length}</b> sân`,
      intent.fieldType ? `loại <b>${intent.fieldType}</b>` : '',
      // Địa điểm gõ tự do thì nói "gần ...", địa điểm có trong dữ liệu thì nói "tại ..."
      intent.loc ? `${Array.isArray(intent.locWords) ? 'gần' : 'tại'} <b>${escapeHtml(intent.loc)}</b>` : '',
      intent.date ? `ngày <b>${escapeHtml(formatDate(intent.date))}</b>` : '',
      intent.hour != null ? `lúc <b>${timeLabel(intent.hour)}</b>` : '',
    ]
      .filter(Boolean)
      .join(' ')
    pushBot(head + '. ' + (freeCount ? `${freeCount} sân còn trống đúng khung giờ.` : ''))

    const wrap = document.createElement('div')
    wrap.className = 'ai-cards'
    wrap.innerHTML = top.map((entry, i) => venueCard(entry, intent, i)).join('')
    wrap._intent = intent
    wrap._results = top
    log.appendChild(wrap)
    scroll()

    quickReplies(['Sân rẻ nhất', 'Xem tất cả sân', 'Đặt khung giờ tối'])
  }

  // ----- Sự kiện -----
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    handle(field.value)
  })

  log.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-ask]')
    if (chip) {
      handle(chip.dataset.ask)
      return
    }
    const bookBtn = e.target.closest('[data-book]')
    if (bookBtn) {
      const cards = log.querySelectorAll('.ai-cards')
      const last = cards[cards.length - 1]
      const entry = last?._results?.[Number(bookBtn.dataset.book)]
      if (entry && onBook) onBook(entry.venue, last._intent)
    }
  })

  fab.addEventListener('click', () => setOpen(!opened))
  closeBtn.addEventListener('click', () => setOpen(false))

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && opened) setOpen(false)
  })

  function setOpen(next) {
    opened = next
    panel.classList.toggle('open', opened)
    fab.classList.toggle('hide', opened)
    fab.setAttribute('aria-expanded', String(opened))
    document.body.classList.toggle('ai-open', opened)
    if (opened) {
      if (!log.childElementCount) greet()
      setTimeout(() => field.focus(), 60)
    }
  }

  function greet() {
    pushBot('Chào bạn! Mình tìm sân theo yêu cầu của bạn. Thử nói:')
    quickReplies(EXAMPLES)
  }

  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    ask: (text) => {
      setOpen(true)
      handle(text)
    },
    greet,
  }
}

// ================================ CẦU NỐI GIỮA CÁC TRANG ================================

/** Lưu intent rồi chuyển sang trang có bộ lọc (trang chủ). */
export function stashIntentForHome(intent, { homeUrl = '/', navigate } = {}) {
  try {
    sessionStorage.setItem(STASH_KEY, JSON.stringify(intent))
  } catch {
    /* bỏ qua */
  }
  const go = navigate || ((u) => { window.location.href = u })
  go(homeUrl)
}

export function takeStashedIntent() {
  try {
    const raw = sessionStorage.getItem(STASH_KEY)
    if (!raw) return null
    sessionStorage.removeItem(STASH_KEY)
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

// ================================ ĐỊNH DẠNG HIỂN THỊ ================================

function formatDate(dateStr) {
  const today = todayStr()
  if (dateStr === today) return 'hôm nay'
  if (dateStr === addDays(today, 1)) return 'ngày mai'
  if (dateStr === addDays(today, 2)) return 'ngày kia'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

function formatWhen(b) {
  const when = `${formatDate(b.date)}${b.startHour != null ? ' ' + timeLabel(Number(b.startHour)) : ''}`
  return when
}

export { todayStr, timeLabel, describeIntent }