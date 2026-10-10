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

// Ảnh cho mục "Sân nổi bật". Có sẵn 44 ảnh bóng đá (sân vận động, mặt cỏ, trận
// đấu) để mỗi sân hiển thị một ảnh khác nhau. Nguồn: Wikimedia Commons (CC).
const FIELD_IMAGES = [
  // Sân vận động
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Allianz_arena_daylight_Richard_Bartz.jpg/960px-Allianz_arena_daylight_Richard_Bartz.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Olympiastadion_at_dusk.JPG/960px-Olympiastadion_at_dusk.JPG',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/Santiagobernabeupanoramav45.JPG/960px-Santiagobernabeupanoramav45.JPG',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Anfield_Football_Stadium_-_geograph.org.uk_-_6297559.jpg/960px-Anfield_Football_Stadium_-_geograph.org.uk_-_6297559.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/SydneyFootballStadium_Aug2022_Pre-open.jpg/960px-SydneyFootballStadium_Aug2022_Pre-open.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Huntington_Bank_Stadium_Aerial.jpg/960px-Huntington_Bank_Stadium_Aerial.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Petrovskiy_football_stadium_in_SPB.jpg/960px-Petrovskiy_football_stadium_in_SPB.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/TEDA_Football_Stadium_2.jpg/960px-TEDA_Football_Stadium_2.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Olympic_Stadium_Munich_-_Rows_of_Seats%2C_April_2019_-04.jpg/960px-Olympic_Stadium_Munich_-_Rows_of_Seats%2C_April_2019_-04.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/Petrovskiy_Football_Stadium_SPB.jpg/960px-Petrovskiy_Football_Stadium_SPB.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Football_and_athletics_stadium%2C_Doln%C3%BD_Kub%C3%ADn%2C_Slovakia.jpg/960px-Football_and_athletics_stadium%2C_Doln%C3%BD_Kub%C3%ADn%2C_Slovakia.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Football_stadium_Za_Lu%C5%BE%C3%A1nkami_Brno_Panorama_2010.jpg/960px-Football_stadium_Za_Lu%C5%BE%C3%A1nkami_Brno_Panorama_2010.jpg',
  // Sân bóng / mặt cỏ
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Floating_Pitch%2C_Frankfurt_am_Main_%281X7A5564%29.jpg/960px-Floating_Pitch%2C_Frankfurt_am_Main_%281X7A5564%29.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Football_pitch_in_Gspon%2C_Staldenried.jpg/960px-Football_pitch_in_Gspon%2C_Staldenried.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Football_pitch_in_Shurskol_settlement.jpg/960px-Football_pitch_in_Shurskol_settlement.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Football_pitch_-_geograph.org.uk_-_2679895.jpg/960px-Football_pitch_-_geograph.org.uk_-_2679895.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Football_pitch_-_geograph.org.uk_-_2681293.jpg/960px-Football_pitch_-_geograph.org.uk_-_2681293.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Football_pitch_and_Charlton_Court_-_geograph.org.uk_-_3682477.jpg/960px-Football_pitch_and_Charlton_Court_-_geograph.org.uk_-_3682477.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Football_pitch%2C_Ebonyi_State_University_Abakaliki.jpg/960px-Football_pitch%2C_Ebonyi_State_University_Abakaliki.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Football_Pitch%2C_Hampden_Park_sports_park_-_geograph.org.uk_-_4453952.jpg/960px-Football_Pitch%2C_Hampden_Park_sports_park_-_geograph.org.uk_-_4453952.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Football_pitch%2C_Iona_-_geograph.org.uk_-_4762347.jpg/960px-Football_pitch%2C_Iona_-_geograph.org.uk_-_4762347.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Football_Pitch%2C_Naphill_-_geograph.org.uk_-_5211535.jpg/960px-Football_Pitch%2C_Naphill_-_geograph.org.uk_-_5211535.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Football_pitch%2C_Sheringham_-_geograph.org.uk_-_5311969.jpg/960px-Football_pitch%2C_Sheringham_-_geograph.org.uk_-_5311969.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Bangor_City_Football_Club_training_pitch_-_geograph.org.uk_-_5319039.jpg/960px-Bangor_City_Football_Club_training_pitch_-_geograph.org.uk_-_5319039.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Football_pitch%2C_Meadowbank_Recreation_Ground%2C_Dorking_Surrey.jpg/960px-Football_pitch%2C_Meadowbank_Recreation_Ground%2C_Dorking_Surrey.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Football_pitch%2C_Ralegh_Crescent_Recreation_%26_Play_Park%2C_Witney%2C_Oxon_-_geograph.org.uk_-_5692545.jpg/960px-Football_pitch%2C_Ralegh_Crescent_Recreation_%26_Play_Park%2C_Witney%2C_Oxon_-_geograph.org.uk_-_5692545.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Football_pitch%2C_Farmers%27_Showfield_-_geograph.org.uk_-_5708398.jpg/960px-Football_pitch%2C_Farmers%27_Showfield_-_geograph.org.uk_-_5708398.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/Five-a-side_pitch_at_Plantation_Park_Football_Ground_-_geograph.org.uk_-_5832811.jpg/960px-Five-a-side_pitch_at_Plantation_Park_Football_Ground_-_geograph.org.uk_-_5832811.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Football_pitch%2C_Normandy_Common%2C_Hunts_Hill_Road%2C_Normandy%2C_Surrey.jpg/960px-Football_pitch%2C_Normandy_Common%2C_Hunts_Hill_Road%2C_Normandy%2C_Surrey.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Football_pitch%2C_Shieldaig_-_geograph.org.uk_-_7300278.jpg/960px-Football_pitch%2C_Shieldaig_-_geograph.org.uk_-_7300278.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Soccer_pitch_at_Bentham_Sports_Club_-_geograph.org.uk_-_8348344.jpg/960px-Soccer_pitch_at_Bentham_Sports_Club_-_geograph.org.uk_-_8348344.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Overview_of_soccer_field_near_Veleslav%C3%ADnova_street_in_Jarom%C4%9B%C5%99ice_nad_Rokytnou%2C_T%C5%99eb%C3%AD%C4%8D_District.jpg/960px-Overview_of_soccer_field_near_Veleslav%C3%ADnova_street_in_Jarom%C4%9B%C5%99ice_nad_Rokytnou%2C_T%C5%99eb%C3%AD%C4%8D_District.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/June_2007%2C_soccer_field_in_Mexico_City.jpg/960px-June_2007%2C_soccer_field_in_Mexico_City.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/June_2007%2C_soccer_field_in_Mexico_City_3.jpg/960px-June_2007%2C_soccer_field_in_Mexico_City_3.jpg',
  // Trận đấu / cầu thủ
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/20191002_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Olympique_Lyonnais_by_Stepro_StP_0064-2.jpg/960px-20191002_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Olympique_Lyonnais_by_Stepro_StP_0064-2.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Germany_and_Argentina_face_off_in_the_final_of_the_World_Cup_2014_-2014-07-13_%285%29.jpg/960px-Germany_and_Argentina_face_off_in_the_final_of_the_World_Cup_2014_-2014-07-13_%285%29.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/David_Villa_-_01.jpg/960px-David_Villa_-_01.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Beitar_Jerusalem_FC_vs._MTK_Budapest_FC_2016-06-18_%28016%29.jpg/960px-Beitar_Jerusalem_FC_vs._MTK_Budapest_FC_2016-06-18_%28016%29.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Ryan_Valentine_scores.jpg/960px-Ryan_Valentine_scores.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Christian_Mendes_-_SC_Austria_Lustenau_%2808%29.jpg/960px-Christian_Mendes_-_SC_Austria_Lustenau_%2808%29.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Alg%C3%A9rie_-_Arm%C3%A9nie_-_20140531_-_Yacine_Brahimi_%28Alg%29_face_%C3%A0_Taron_Voskanyan_%28Arm%29.jpg/960px-Alg%C3%A9rie_-_Arm%C3%A9nie_-_20140531_-_Yacine_Brahimi_%28Alg%29_face_%C3%A0_Taron_Voskanyan_%28Arm%29.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/1alessandromartinelli2015.jpg/960px-1alessandromartinelli2015.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Hertha_BSC_vs._West_Ham_United_20190731_%28032%29.jpg/960px-Hertha_BSC_vs._West_Ham_United_20190731_%28032%29.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/Milan_Baro%C5%A13%2C_FCB-SLAVIA_30092018.jpg/960px-Milan_Baro%C5%A13%2C_FCB-SLAVIA_30092018.jpg',
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
  const sports = Array.isArray(v.sports) && v.sports.length
    ? v.sports
    : (v.sport ? [v.sport] : ['Bóng đá'])
  const sport = v.sport || sports[0] || 'Bóng đá'
  return {
    id: String(v.id ?? 'san-' + (idx + 1)),
    name: String(v.name || 'Sân chưa đặt tên'),
    sport,
    sports,
    type: parsePitchType(v.type),
    addr: String(v.addr || v.address || ''),
    price: toPriceNumber(v.price),
    per: v.per || ' đ/giờ',
    courts: Math.max(1, parseInt(v.courts, 10) || 1),
    hours: { open, close: close > open ? close : open + 1 },
    lat: toCoord(v.lat),
    lng: toCoord(v.lng),
    img: v.img || FIELD_IMAGES[idx % FIELD_IMAGES.length],
    badge: v.badge || (sports.length > 1 ? `${sports.length} môn thể thao` : '1 môn thể thao'),
    rating: v.rating || 4.9,
    reviewCount: v.reviewCount || 150,
    icon: sport.includes('Pickleball') ? '🏓' : (sport.includes('Cầu lông') ? '🏸' : '⚽'),
  }
}

/** Nhãn hiển thị của loại sân: '7' -> 'Sân 7'. */
function typeLabel(type) {
  return PITCH_TYPE_LABEL[type] || 'Sân 7'
}

/**
 * Sân lấy thẳng từ store dùng chung: sửa sân ở trang quản trị là trang chủ
 * đổi theo, kể cả khi đang mở trang chủ ở một tab khác.
 */
function loadVenues() {
  return SV.fields()
    .filter((f) => f.status === 'active')
    .map(normalizeVenue)
}

let VENUES = loadVenues()

const PROVINCES = ['Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ','Bình Dương','Đồng Nai','Khánh Hòa','Nghệ An','Thanh Hóa','Huế','Quảng Ninh','Bà Rịa - Vũng Tàu','Lâm Đồng','Kiên Giang','Bắc Ninh','Hải Dương','Hưng Yên','Nam Định','Thái Nguyên','Quảng Nam','Bình Định','Gia Lai','Đắk Lắk','Long An','Tiền Giang','Vĩnh Long','An Giang','Bình Thuận','Ninh Thuận','Phú Yên','Quảng Ngãi','Bình Phước','Tây Ninh']

const PLATFORM = { venues: 629, courts: 858 }

// ================================ CHUẨN HOÁ TIẾNG VIỆT ================================

function deaccent(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

function norm(str) {
  return deaccent(String(str || ''))
    .toLowerCase()
    .replace(/[,;.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

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

function expand(str) {
  let out = norm(str)
  for (const [re, to] of ABBREVIATIONS) out = out.replace(re, to)
  return out
}

function haystack(v) {
  const sportsStr = (v.sports || [v.sport]).join(' ')
  return expand(`${v.name} ${v.addr} ${typeLabel(v.type)} ${sportsStr}`)
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

function nowLocalInput() {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${todayStr()}T${hh}:${mm}`
}

function parseWhen(value) {
  if (!value) return null
  const m = value.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/)
  if (!m) return null
  const date = m[1]
  const hour = m[2] === undefined ? null : Number(m[2]) + Number(m[3]) / 60
  return { date, hour, hasTime: m[2] !== undefined }
}

function isOpenAt(v, when) {
  if (!when || when.hour === null) return true
  return when.hour >= v.hours.open && when.hour < v.hours.close
}

function isPastSlot(date, hour) {
  if (date !== todayStr() || hour === null) return false
  const now = new Date()
  return hour < now.getHours() + now.getMinutes() / 60
}

let activeSportFilter = 'all'

function matches(v, filters) {
  const { loc, type, when, sport } = filters

  if (sport && sport !== 'all') {
    const sNorm = norm(sport)
    const hasSport = (v.sports || [v.sport]).some((s) => norm(s).includes(sNorm))
    if (!hasSport) return false
  }

  if (type) {
    if (['5', '7', '11'].includes(type)) {
      if (v.type !== type) return false
    } else if (type === 'caulong') {
      const has = (v.sports || [v.sport]).some((s) => norm(s).includes('cau long'))
      if (!has) return false
    } else if (type === 'pickleball') {
      const has = (v.sports || [v.sport]).some((s) => norm(s).includes('pickleball'))
      if (!has) return false
    } else if (v.type !== type) {
      return false
    }
  }

  if (loc) {
    const hay = haystack(v)
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
    sport: activeSportFilter,
  }
}

function hasAnyFilter(f) {
  return Boolean(f.loc || f.type || f.when || (f.sport && f.sport !== 'all'))
}

function describeFilters(f) {
  const bits = []
  if (f.sport && f.sport !== 'all') bits.push(`môn ${f.sport}`)
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

function courtKey(id) {
  const raw = String(id)
  const digits = raw.replace(/^san-/, '')
  return /^\d+$/.test(digits) ? 'san-' + Number(digits) : raw
}

function isSlotTaken(venueId, date, startHour, duration) {
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

/**
 * Ảnh cho từng thẻ ở mục "Sân nổi bật": lấy theo vị trí của sân trong danh sách
 * chung nên mỗi sân một ảnh khác nhau và giữ nguyên ảnh dù đang lọc theo tỉnh,
 * loại sân hay giờ.
 */
function featuredImage(v) {
  const i = VENUES.findIndex((x) => x.id === v.id)
  const idx = i >= 0 ? i : Math.abs(String(v.id).length)
  return FIELD_IMAGES[idx % FIELD_IMAGES.length]
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
      const tagsHtml = (v.sports || [v.sport || 'Bóng đá'])
        .map((s) => `<span class="tag green">${esc(s)}</span>`)
        .join('')

      return `
      <div class="col-md-6 col-lg-4 field-col">
        <article class="field-card">
          <a href="project/pages/chi-tiet-san.html?id=${esc(v.id)}" class="field-thumb" style="display:block;text-decoration:none;">
            <img src="${esc(v.img)}" alt="${esc(v.name)}" loading="lazy">
            <span class="field-badge">${esc(v.badge || '1 môn thể thao')}</span>
          </a>
          <div class="field-body">
            <h3 class="field-name">
              <a href="project/pages/chi-tiet-san.html?id=${esc(v.id)}" class="text-decoration-none text-reset">
                ${esc(v.name)}
              </a>
            </h3>
            <p class="field-loc">
              <i class="bi bi-geo-alt-fill"></i> ${esc(v.addr)}
            </p>
            <div class="field-tags">
              ${tagsHtml}
            </div>
            <div class="field-foot">
              <div class="field-price">
                <strong>từ ${v.price.toLocaleString('vi-VN')} đ/giờ</strong>
                <div class="field-rating">
                  <i class="bi bi-star-fill"></i> ${v.rating || '4.9'} · ${v.reviewCount || 150} đánh giá
                </div>
              </div>
              <a href="project/pages/chi-tiet-san.html?id=${esc(v.id)}&book=1" class="btn btn-primary-grad">
                Đặt sân
              </a>
            </div>
          </div>
        </article>
      </div>
      `
    })
    .join('')
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
      <a href="project/pages/chi-tiet-san.html?id=${esc(v.id)}" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;width:100%;">
        <img class="nearby-thumb" src="${esc(v.img)}" alt="">
        <div style="flex:1;">
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
  bookState.selectedHour = null

  const user = window.SV?.currentUser ? window.SV.currentUser() : null
  const defaultName = user ? (user.name || '') : ''
  const defaultPhone = user ? (user.phone || '') : ''

  const body = document.getElementById('bookBody')
  if (body) {
    const sports = venue.sports || [venue.sport || 'Bóng đá']
    const sportPicksHtml = sports.map((s, idx) => `
      <button type="button" class="sport-pick ${idx === 0 ? 'selected' : ''}" data-sport="${esc(s)}">${esc(s)}</button>
    `).join('')

    body.innerHTML = `
      <div class="booking-thumb">
        <img src="${esc(venue.img)}" alt="${esc(venue.name)}" />
        <div class="booking-thumb-overlay">
          <h4>${esc(venue.name)}</h4>
        </div>
      </div>
      <div class="booking-meta-row">
        <span><i class="bi bi-geo-alt-fill"></i> ${esc(venue.addr)}</span>
        <span><i class="bi bi-star-fill" style="color:var(--accent)"></i> ${venue.rating || '4.9'} (${venue.reviewCount || 150} đánh giá)</span>
        <span><i class="bi bi-clock"></i> ${timeLabel(venue.hours.open)} – ${timeLabel(venue.hours.close)}</span>
      </div>
      <form id="bookForm" novalidate>
        <div class="sb-label">MÔN THỂ THAO</div>
        <div class="sport-pick-list" id="bkSportList">
          ${sportPicksHtml}
        </div>

        <div class="bk-grid">
          <div class="bk-field" id="f-date">
            <label for="bkDate">Ngày chơi <span style="color:#dc2626">*</span></label>
            <input type="date" id="bkDate" required />
            <span class="bk-err">Vui lòng chọn ngày không ở quá khứ.</span>
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
        </div>

        <div class="slot-section" id="f-time">
          <label class="sb-label">CHỌN KHUNG GIỜ TRỐNG <span style="color:#dc2626">*</span></label>
          <div class="slot-grid" id="bkSlotGrid"></div>
          <select id="bkTime" style="display:none;" required></select>
          <span class="bk-err" style="margin-top:6px;">Vui lòng chọn một khung giờ trống.</span>
        </div>

        <div class="bk-grid">
          <div class="bk-field" id="f-name">
            <label for="bkName">Họ tên <span style="color:#dc2626">*</span></label>
            <input type="text" id="bkName" placeholder="VD: Nguyễn Văn A" autocomplete="name" value="${esc(defaultName)}" required />
            <span class="bk-err">Vui lòng nhập họ tên (tối thiểu 2 ký tự).</span>
          </div>
          <div class="bk-field" id="f-phone">
            <label for="bkPhone">Số điện thoại <span style="color:#dc2626">*</span></label>
            <input type="tel" id="bkPhone" placeholder="VD: 0912345678" autocomplete="tel" value="${esc(defaultPhone)}" required />
            <span class="bk-err">Số điện thoại không hợp lệ (10 số).</span>
          </div>
          <div class="bk-field full" id="f-voucher">
            <label for="bkVoucher">Mã giảm giá (nếu có)</label>
            <input type="text" id="bkVoucher" placeholder="VD: WELCOME4SV" autocomplete="off" />
            <span class="bk-err">Mã giảm giá không dùng được với đơn này.</span>
          </div>
        </div>

        <div class="pay-summary">
          <div class="pay-row">
            <span>Đơn giá thuê sân:</span>
            <span>${venue.price.toLocaleString('vi-VN')} đ/giờ</span>
          </div>
          <div class="pay-row">
            <span>Thời lượng thuê:</span>
            <span id="payDuration">1 giờ</span>
          </div>
          <div class="pay-total">
            <span>Tổng thanh toán:</span>
            <strong id="bkTotal">0đ</strong>
          </div>
        </div>

        <button type="submit" class="btn-book-main" id="btnConfirmBook">
          <i class="bi bi-bag-check-fill"></i> Xác nhận đặt sân ngay
        </button>
        <p class="booking-secure"><i class="bi bi-shield-check"></i> Thanh toán an toàn · Xác nhận tức thì</p>
      </form>
    `
  }

  const dateInput = document.getElementById('bkDate')
  dateInput.min = todayStr()
  dateInput.value = todayStr()

  // Handle Sport Picks click
  document.querySelectorAll('#bkSportList .sport-pick').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#bkSportList .sport-pick').forEach((b) => b.classList.remove('selected'))
      btn.classList.add('selected')
    })
  })

  const refreshSlots = () => {
    const date = dateInput.value
    const grid = document.getElementById('bkSlotGrid')
    const sel = document.getElementById('bkTime')
    if (!grid || !sel) return

    if (!date) {
      grid.innerHTML = '<p class="text-muted small">Vui lòng chọn ngày trước</p>'
      sel.innerHTML = '<option value="">-- Chọn ngày --</option>'
      return
    }

    const duration = bookState.duration
    let hasAvailable = false
    let gridHtml = ''
    let selHtml = ''

    for (let h = venue.hours.open; h < venue.hours.close; h += 1) {
      if (h + duration > venue.hours.close) continue
      const isPast = isPastSlot(date, h)
      const isTaken = isSlotTaken(venue.id, date, h, duration)
      const disabled = isPast || isTaken
      const label = `${timeLabel(h)} - ${timeLabel(h + duration)}`

      if (!disabled) hasAvailable = true

      const isSelected = bookState.selectedHour === h
      gridHtml += `
        <button type="button" class="time-slot ${disabled ? 'taken' : ''} ${isSelected ? 'selected' : ''}" data-hour="${h}" ${disabled ? 'disabled' : ''}>
          ${label}
        </button>
      `
      if (!disabled) {
        selHtml += `<option value="${h}" ${isSelected ? 'selected' : ''}>${label}</option>`
      }
    }

    if (!hasAvailable) {
      grid.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;grid-column:1/-1;">Đã kín lịch trong ngày này.</p>'
      sel.innerHTML = '<option value="">-- Kín lịch --</option>'
      bookState.selectedHour = null
    } else {
      grid.innerHTML = gridHtml
      sel.innerHTML = selHtml

      grid.querySelectorAll('.time-slot:not([disabled])').forEach((btn) => {
        btn.addEventListener('click', () => {
          grid.querySelectorAll('.time-slot').forEach((b) => b.classList.remove('selected'))
          btn.classList.add('selected')
          bookState.selectedHour = parseFloat(btn.dataset.hour)
          sel.value = String(bookState.selectedHour)
          const fTime = document.getElementById('f-time')
          if (fTime) fTime.classList.remove('invalid')
        })
      })

      // Auto-select first available if none selected
      if (bookState.selectedHour === null || !sel.querySelector(`option[value="${bookState.selectedHour}"]`)) {
        const firstBtn = grid.querySelector('.time-slot:not([disabled])')
        if (firstBtn) {
          firstBtn.classList.add('selected')
          bookState.selectedHour = parseFloat(firstBtn.dataset.hour)
          sel.value = String(bookState.selectedHour)
        }
      }
    }
  }

  const updateTotal = () => {
    bookState.duration = parseFloat(document.getElementById('bkDuration').value) || 1
    const current = bookState.venue || venue
    const subtotal = Math.round(current.price * bookState.duration)
    const code = document.getElementById('bkVoucher')?.value?.trim().toUpperCase() || ''
    const voucher = code && window.SV?.previewVoucher ? window.SV.previewVoucher(code, subtotal) : null
    const usable = !!(voucher && voucher.ok)

    document.getElementById('f-voucher')?.classList.toggle('invalid', !!code && !usable)

    const durEl = document.getElementById('payDuration')
    if (durEl) durEl.textContent = `${bookState.duration} giờ`

    const el = document.getElementById('bkTotal')
    if (usable) {
      el.innerHTML = `${(subtotal - voucher.discount).toLocaleString('vi-VN')}đ <small style="opacity:.75">(-${voucher.discount.toLocaleString('vi-VN')}đ)</small>`
    } else {
      el.textContent = subtotal.toLocaleString('vi-VN') + 'đ'
    }
    refreshSlots()
  }

  bookState.refresh = updateTotal

  dateInput.addEventListener('change', refreshSlots)
  document.getElementById('bkDuration').addEventListener('change', updateTotal)
  document.getElementById('bkVoucher')?.addEventListener('input', updateTotal)

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
  document.documentElement.style.setProperty('--primary', s.primaryColor || '#8b1e1e')
  document.documentElement.style.setProperty('--4sv-primary', s.primaryColor || '#8b1e1e')
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

function boot() {
  const y = document.getElementById('year')
  if (y) y.textContent = String(new Date().getFullYear())

  const typeSelect = document.getElementById('qType')

  // Ô tìm kiếm: lọc ngay khi gõ để không phải bấm nút
  const locInput = document.getElementById('qLocation')
  locInput?.addEventListener('input', () => applyFilters({ silent: true }))
  locInput?.addEventListener('change', () => applyFilters({ silent: true }))

  const searchForm = document.getElementById('searchForm')
  if (searchForm) searchForm.addEventListener('submit', handleSearch)

  // select Loại sân lọc ngay, để đồng bộ với dropdown trên navbar
  typeSelect?.addEventListener('change', () => applyFilters({ scroll: true }))

  const dateInput = document.getElementById('qDate')
  if (dateInput) {
    dateInput.min = todayStr()
    if (!dateInput.value) dateInput.value = todayStr()
  }
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}

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
    // Ẩn/hiện triệt để theo data-auth kết hợp thuộc tính hidden và inline style display
    document.querySelectorAll('[data-auth="login"], [data-auth="register"]').forEach((el) => {
      el.hidden = !!user
      el.style.display = user ? 'none' : ''
    })
    box.hidden = !user
    box.style.display = user ? 'inline-flex' : 'none'
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
      '<rect width="56" height="56" rx="28" fill="#fee2e2"/>' +
      '<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Be Vietnam Pro,sans-serif" font-size="24" font-weight="700" fill="#8b1e1e">' +
      esc(initial) +
      '</text></svg>'
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }

  function openMenu() {
    menu.hidden = false
    menu.style.display = 'block'
    btn.setAttribute('aria-expanded', 'true')
  }
  function closeMenu() {
    menu.hidden = true
    menu.style.display = 'none'
    btn.setAttribute('aria-expanded', 'false')
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (menu.hidden || menu.style.display === 'none') openMenu()
    else closeMenu()
  })
  document.addEventListener('click', (e) => {
    if ((!menu.hidden || menu.style.display === 'block') && !box.contains(e.target)) closeMenu()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu()
  })

  logout?.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản 4SV.com?')) {
      SV.signOut()
      closeMenu()
      render()
    }
  })

  // Tab khác đăng nhập/đăng xuất, hoặc admin khoá chính tài khoản này.
  SV.on((key) => {
    if (key === 'auth' || key === 'users' || key === '*') render()
  })
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key.includes('auth') || e.key.includes('users')) {
      render()
    }
  })

  render()
}

// Cho trang khác (danh sách sân) dùng lại: đăng nhập xong thì về trang trước.
window.svSignOut = () => {
  SV.signOut()
}

// Chạy khởi tạo auth nav ngay lập tức nếu DOM đã có sẵn
if (document.querySelector('[data-auth="user"]')) {
  initAuthNav()
}
