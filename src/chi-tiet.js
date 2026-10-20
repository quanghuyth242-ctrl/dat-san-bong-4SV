import './style.css'
import { syncAuthNav } from './auth-nav.js'

/**
 * Trang chi tiết một sân bóng đá (?id=xxx).
 * Nguồn dữ liệu duy nhất vẫn là store chung (SV.fields()) nên sân admin sửa ở
 * trang quản trị là trang chi tiết đổi theo, không có bản sao ở đây.
 */

const DEFAULT_OPEN = 6
const DEFAULT_CLOSE = 22
const PITCH_TYPE_LABEL = { 5: 'Sân 5', 7: 'Sân 7', 11: 'Sân 11' }

function esc(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
}

function toHour(value, fallback) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 && n <= 24 ? n : fallback
}

function toCoord(value) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : null
}

/** "300k" / 300000 / "1.2tr" -> số đồng. Cùng khuôn với trang chủ. */
function toPriceNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0
  const s = String(value ?? '').trim().toLowerCase().replace(/\s/g, '')
  if (!s) return 0
  const hasTr = /tr/.test(s)
  const hasK = !hasTr && /k/.test(s)
  let digits = s.replace(/[^\d.,]/g, '')
  if (hasTr || hasK) {
    const sep = Math.max(digits.lastIndexOf('.'), digits.lastIndexOf(','))
    const head = sep >= 0 ? digits.slice(0, sep).replace(/[.,]/g, '') : digits
    const tail = sep >= 0 ? digits.slice(sep + 1) : ''
    digits = tail ? head + '.' + tail : head
  } else {
    digits = digits.replace(/[.,]/g, '')
  }
  const n = parseFloat(digits)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * (hasTr ? 1e6 : hasK ? 1e3 : 1))
}

/** 300000 -> "300k", 1200000 -> "1,2tr". */
function formatPriceShort(price) {
  const n = toPriceNumber(price)
  if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace('.', ',') + 'tr'
  if (n >= 1000) return Math.round(n / 1000) + 'k'
  return n.toLocaleString('vi-VN') + 'đ'
}

function formatPriceFull(price) {
  return toPriceNumber(price).toLocaleString('vi-VN') + 'đ'
}

function typeLabel(type) {
  return PITCH_TYPE_LABEL[type] || 'Sân 7'
}

function timeLabel(h) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

/** Chuẩn hoá một sân từ store cho phần hiển thị. */
function normalizeField(raw, idx = 0) {
  const open = toHour(raw.hours?.open, DEFAULT_OPEN)
  const close = toHour(raw.hours?.close, DEFAULT_CLOSE)
  const type = String(SV.pitchNumber?.(raw.type) || '7')
  return {
    id: String(raw.id ?? 'san-' + (idx + 1)),
    name: String(raw.name || 'Sân chưa đặt tên'),
    type: PITCH_TYPE_LABEL[type] ? type : '7',
    addr: String(raw.address || raw.addr || ''),
    price: toPriceNumber(raw.price),
    per: '/tiếng',
    courts: Math.max(1, parseInt(raw.courts, 10) || 1),
    hours: { open, close: close > open ? close : open + 1 },
    lat: toCoord(raw.lat),
    lng: toCoord(raw.lng),
    img: String(raw.img || ''),
    desc: String(raw.desc || ''),
    sport: String(raw.sport || 'Bóng đá'),
    sports: Array.isArray(raw.sports) && raw.sports.length ? raw.sports : [raw.sport || 'Bóng đá'],
    badge: String(raw.badge || ''),
    rating: Number(raw.rating) || 0,
    reviewCount: Number(raw.reviewCount) || 0,
    status: raw.status === 'active' ? 'active' : 'inactive',
  }
}

function allFields() {
  return SV.fields().map(normalizeField)
}

/** Sân trong URL: khớp thẳng trước, sau đó khớp theo khoá chuẩn hoá của store. */
function findField(id) {
  const list = allFields()
  const raw = String(id || '')
  return (
    list.find((f) => f.id === raw) ||
    list.find((f) => SV.courtKey(f.id) === SV.courtKey(raw)) ||
    null
  )
}

function isOpenNow(field) {
  const now = new Date()
  const h = now.getHours() + now.getMinutes() / 60
  return h >= field.hours.open && h < field.hours.close
}

/** Mọi khung giờ 1 tiếng của hôm nay kèm trạng thái: past = đã quá giờ đặt, taken = đã có người đặt, free = còn trống. */
function slotsToday(field) {
  const date = todayStr()
  const out = []
  for (let h = Math.ceil(field.hours.open); h + 1 <= field.hours.close; h++) {
    const isPast = isPastSlot(date, h, h + 1, field.hours.close)
    const isTaken = SV.isSlotTaken(field.id, date, h, 1)
    out.push({ hour: h, state: isPast ? 'past' : isTaken ? 'taken' : 'free' })
  }
  return out
}

function starsHtml(value) {
  const full = Math.round(value)
  let out = ''
  for (let i = 1; i <= 5; i++) {
    out += `<i class="${i <= full ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
  }
  return out
}

/** Đánh giá của chính sân này. Trống thì trả về mảng rỗng để trang hiện "chưa có". */
function reviewsOf(field) {
  const name = field.name.trim().toLowerCase()
  return SV.visibleReviews()
    .filter((r) => {
      const fn = String(r.fieldName || '').trim().toLowerCase()
      if (!fn) return false
      return fn === name || fn.includes(name) || name.includes(fn)
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

function ratingSummary(field, reviews) {
  if (reviews.length) {
    const avg = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
    return { value: Math.round(avg * 10) / 10, count: reviews.length, fromGuests: true }
  }
  return {
    value: field.rating || 0,
    count: field.reviewCount || 0,
    fromGuests: false,
  }
}

function reviewItemHtml(r) {
  const avatar = r.userAvatar
    ? `<img class="dt-rv-avatar" src="${esc(r.userAvatar)}" alt="">`
    : `<span class="dt-rv-avatar dt-rv-initial">${esc(String(r.userName || '?').trim().charAt(0).toUpperCase())}</span>`
  return `
    <li class="dt-rv">
      ${avatar}
      <div class="dt-rv-body">
        <div class="dt-rv-top">
          <strong>${esc(r.userName)}</strong>
          <span class="dt-rv-stars">${starsHtml(Number(r.rating) || 0)}</span>
          <span class="dt-rv-date">${esc(r.date)}</span>
        </div>
        <p class="dt-rv-text">${esc(r.comment)}</p>
        ${r.reply ? `<div class="dt-rv-reply"><i class="fa-solid fa-reply"></i> ${esc(r.reply)}</div>` : ''}
      </div>
    </li>`
}

function relatedHtml(field) {
  const others = allFields()
    .filter((f) => f.status === 'active' && f.id !== field.id)
    .sort((a, b) => Number(b.type === field.type) - Number(a.type === field.type))
    .slice(0, 4)

  if (!others.length) return ''

  return `
    <section class="pay-card dt-related">
      <div class="pay-card-title"><i class="fa-solid fa-futbol"></i> Sân khác dành cho bạn</div>
      <div class="dt-related-grid">
        ${others
          .map(
            (f) => `
          <a class="dt-related-item" href="./chi-tiet.html?id=${encodeURIComponent(f.id)}">
            <img src="${esc(f.img)}" alt="${esc(f.name)}" loading="lazy">
            <span class="dt-related-name">${esc(f.name)}</span>
            <span class="dt-related-meta">${esc(typeLabel(f.type))} · ${esc(formatPriceShort(f.price))}${esc(f.per)}</span>
          </a>`,
          )
          .join('')}
      </div>
    </section>`
}

// Bảng giá dịch vụ đi kèm — hiển thị để tham khảo; chọn dịch vụ (số lượng)
// làm ngay trong form đặt sân dùng chung (DatSanModal).
const SERVICES = DatSanModal.SERVICES

function servicesSectionHtml() {
  return `
    <section class="pay-card">
      <div class="pay-card-title"><i class="fa-solid fa-cart-plus"></i> Dịch vụ đi kèm</div>
      <p class="dt-note"><i class="fa-solid fa-circle-info"></i> Giá tham khảo, tính cho mỗi buổi. Chọn dịch vụ (số lượng) ngay trong form đặt sân khi bạn bấm "Đặt sân ngay".</p>
      <div class="service-list" id="dtServiceList">
        ${SERVICES.map((s) => `
          <div class="service-item">
            <i class="fa-solid ${s.icon} svc-icon"></i>
            <div class="svc-info">
              <div class="svc-name">${esc(s.name)}</div>
              <div class="svc-price">${s.price.toLocaleString('vi-VN')}đ / ${esc(s.unit)}</div>
            </div>
          </div>`).join('')}
      </div>
    </section>`
}

function initServices(field) {
  // "Đặt sân ngay" mở form đặt sân dùng chung (DatSanModal) — chọn dịch vụ
  // trong form chứ không chọn ở trang chi tiết.
  document.getElementById('dtBookCta')?.addEventListener('click', () => DatSanModal.open(field))
}

function renderField(field) {
  const root = document.getElementById('detailRoot')
  if (!root) return

  const crumb = document.getElementById('dtCrumbName')
  if (crumb) crumb.textContent = field.name

  const settings = SV.settings()
  document.title = `${field.name} · ${settings.siteName || '4SV.vn'}`

  const reviews = reviewsOf(field)
  const rating = ratingSummary(field, reviews)
  const open = isOpenNow(field)
  const slotItems = slotsToday(field)
  const freeCount = slotItems.filter((s) => s.state === 'free').length
  const mapReady = Number.isFinite(field.lat) && Number.isFinite(field.lng)

  root.innerHTML = `
    <article class="dt-page">
      <div class="dt-grid">
        <div class="dt-main">
          <div class="dt-hero">
            <img src="${esc(field.img)}" alt="${esc(field.name)}">
            <span class="court-badge">${esc(typeLabel(field.type))}</span>
            <span class="dt-open ${open ? 'is-open' : 'is-closed'}">
              <i class="fa-solid fa-circle"></i> ${open ? 'Đang mở cửa' : 'Đã đóng cửa'}
            </span>
          </div>

          <header class="dt-head">
            <h1 class="dt-title">${esc(field.name)}</h1>
            <div class="dt-head-meta">
              <span class="dt-rate">
                <i class="fa-solid fa-star dt-rate-star"></i>
                <strong>${rating.value ? rating.value.toFixed(1) : '—'}</strong>
                <small>(${rating.count} đánh giá${rating.fromGuests ? '' : ' · số liệu của cơ sở'})</small>
              </span>
              <span><i class="fa-solid fa-location-dot"></i> ${esc(field.addr || 'Chưa cập nhật địa chỉ')}</span>
              <span><i class="fa-solid fa-futbol"></i> ${esc(field.sport)}</span>
            </div>
          </header>

          <section class="pay-card">
            <div class="pay-card-title"><i class="fa-solid fa-circle-info"></i> Thông tin cơ bản</div>
            <div class="dt-info">
              <div><span>Loại sân</span><strong>${esc(typeLabel(field.type))}</strong></div>
              <div><span>Số sân</span><strong>${field.courts} sân</strong></div>
              <div><span>Giờ mở cửa</span><strong>${timeLabel(field.hours.open)} – ${timeLabel(field.hours.close)}</strong></div>
              <div><span>Giá thuê</span><strong>${esc(formatPriceShort(field.price))} ${esc(field.per)} · ${esc(formatPriceFull(field.price))}</strong></div>
              <div><span>Địa chỉ</span><strong>${esc(field.addr || 'Chưa cập nhật')}</strong></div>
            </div>
          </section>

          <section class="pay-card">
            <div class="pay-card-title"><i class="fa-solid fa-align-left"></i> Giới thiệu</div>
            <p class="dt-desc">${
              esc(field.desc) ||
              `${esc(field.name)} là cơ sở ${esc(typeLabel(field.type).toLowerCase())} tại ${esc(
                field.addr || 'khu vực này',
              )}, mở cửa ${timeLabel(field.hours.open)}–${timeLabel(field.hours.close)} hằng ngày với ${field.courts} sân. Đặt sân ngay trên ${esc(
                settings.siteName || '4SV.vn',
              )} để xem lịch trống theo thời gian thực.`
            }</p>
          </section>

          <section class="pay-card">
            <div class="pay-card-title"><i class="fa-solid fa-calendar-check"></i> Lịch trống hôm nay</div>
            ${
              slotItems.length
                ? `<div class="dt-slots">
                    ${slotItems
                      .map(
                        (s) => `<span class="dt-slot${s.state === 'free' ? '' : ` is-${s.state}`}">${timeLabel(s.hour)} – ${timeLabel(
                          s.hour + 1,
                        )}<small>${
                          s.state === 'past'
                            ? 'Đã quá giờ đặt'
                            : s.state === 'taken'
                              ? 'Đã có người đặt'
                              : 'Còn trống'
                        }</small></span>`,
                      )
                      .join('')}
                  </div>
                  ${
                    freeCount
                      ? `<p class="dt-slot-note"><i class="fa-solid fa-circle-info"></i> Hôm nay còn ${freeCount} khung giờ trống (ngày ${todayStr()}). Chọn "Đặt sân" để giữ chỗ.</p>`
                      : `<p class="dt-slot-empty"><i class="fa-solid fa-calendar-xmark"></i> ${
                          open
                            ? 'Hôm nay đã kín lịch hoặc mọi khung giờ còn lại đã qua giờ đặt. Chọn "Đặt sân" để xem lịch trống các ngày khác.'
                            : 'Sân đang đóng cửa và hôm nay không còn khung giờ trống.'
                        }</p>`
                  }`
                : `<p class="dt-slot-empty"><i class="fa-solid fa-calendar-xmark"></i> ${
                    open ? 'Hôm nay đã kín lịch hoặc các khung giờ còn lại đã qua.' : 'Sân đang đóng cửa, vui lòng quay lại trong giờ mở cửa.'
                  }</p>`
            }
          </section>

          ${servicesSectionHtml()}

          <section class="pay-card">
            <div class="pay-card-title"><i class="fa-solid fa-map-location-dot"></i> Vị trí trên bản đồ</div>
            <div id="dtMap" class="dt-map" aria-label="Bản đồ ${esc(field.name)}"></div>
            <div class="dt-map-actions">
              <span class="dt-map-addr"><i class="fa-solid fa-location-dot"></i> ${esc(field.addr || 'Chưa cập nhật địa chỉ')}</span>
              ${
                mapReady
                  ? `<a class="btn-map" target="_blank" rel="noopener noreferrer"
                       href="https://www.google.com/maps/dir/?api=1&destination=${field.lat},${field.lng}">
                       <i class="fa-solid fa-diamond-turn-right"></i> Chỉ đường</a>`
                  : ''
              }
            </div>
          </section>

          <section class="pay-card">
            <div class="pay-card-title"><i class="fa-solid fa-star"></i> Đánh giá của khách hàng</div>
            ${
              reviews.length
                ? `<ul class="dt-reviews">${reviews.map(reviewItemHtml).join('')}</ul>`
                : `<p class="dt-note"><i class="fa-regular fa-comment-dots"></i> Chưa có đánh giá nào cho sân này. Hãy là người đầu tiên cho điểm sau khi đặt sân.</p>`
            }
          </section>
        </div>

        <aside class="dt-side">
          <div class="pay-card dt-book-card">
            <div class="dt-price">${esc(formatPriceShort(field.price))}<small> ${esc(field.per)}</small></div>
            <div class="dt-price-full">${esc(formatPriceFull(field.price))} / 1 tiếng</div>
            <div class="dt-book-rows">
              <div><i class="fa-regular fa-clock"></i> ${timeLabel(field.hours.open)} – ${timeLabel(field.hours.close)} hằng ngày</div>
              <div><i class="fa-solid fa-layer-group"></i> ${field.courts} sân · ${esc(typeLabel(field.type))}</div>
              <div><i class="fa-solid fa-shield-halved"></i> Thanh toán tại sân, hoàn tiền theo chính sách</div>
            </div>
            <button type="button" class="btn-book btn-book-full" id="dtBookCta">
              <i class="fa-solid fa-calendar-check"></i> Đặt sân ngay
            </button>
            <a class="btn-book btn-book-ghost btn-book-full" href="../#san-noi-bat">
              <i class="fa-solid fa-list"></i> Xem tất cả sân
            </a>
          </div>

          ${relatedHtml(field)}
        </aside>
      </div>
    </article>`

  initServices(field)
  initMap(field, mapReady)
}

function initMap(field, ready) {
  const el = document.getElementById('dtMap')
  if (!el) return
  if (!ready || typeof L === 'undefined') {
    el.classList.add('dt-map-fallback')
    el.innerHTML =
      '<div class="dt-map-msg"><i class="fa-solid fa-map-location-dot"></i> Sân chưa có tọa độ trên bản đồ.</div>'
    return
  }
  const map = L.map(el, { scrollWheelZoom: false }).setView([field.lat, field.lng], 16)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  }).addTo(map)
  L.marker([field.lat, field.lng])
    .addTo(map)
    .bindPopup(`<div class="map-popup"><strong>${esc(field.name)}</strong><span>${esc(field.addr)}</span></div>`)
    .openPopup()
}

function renderNotFound() {
  const root = document.getElementById('detailRoot')
  if (!root) return
  root.innerHTML = `
    <div class="empty-state-4sv">
      <div class="empty-icon-4sv"><i class="fa-solid fa-magnifying-glass"></i></div>
      <h3>Không tìm thấy sân</h3>
      <p>Sân bạn cần xem không tồn tại hoặc đã ngừng hoạt động.</p>
      <a class="btn btn-light-dark" href="../#san-noi-bat"><i class="fa-solid fa-arrow-left"></i> Quay lại danh sách sân</a>
    </div>`
}

function applySettings() {
  const s = SV.settings()
  if (s.siteName) document.querySelectorAll('[data-site-name]').forEach((el) => (el.textContent = s.siteName))
  document.documentElement.style.setProperty('--primary', s.primaryColor || '#16a34a')
  document.documentElement.style.setProperty('--4sv-primary', s.primaryColor || '#16a34a')
  document.documentElement.classList.toggle('dark', !!s.darkMode)
  document.body.classList.toggle('dark-mode', !!s.darkMode)
  document.querySelectorAll('img[data-site-logo]').forEach((el) => {
    el.hidden = !s.logo
    if (s.logo) el.src = s.logo
  })
}

function initNav() {
  const toggle = document.getElementById('navToggle')
  const menu = document.getElementById('navMenu')
  toggle?.addEventListener('click', () => {
    const isOpen = menu?.classList.contains('open')
    menu?.classList.toggle('open', !isOpen)
    toggle.setAttribute('aria-expanded', String(!isOpen))
    toggle.innerHTML = isOpen
      ? '<i class="fa-solid fa-bars"></i>'
      : '<i class="fa-solid fa-xmark"></i>'
  })
}

function init() {
  const y = document.getElementById('year')
  if (y) y.textContent = String(new Date().getFullYear())

  applySettings()
  initNav()
  syncAuthNav({ accountUrl: './tai-khoan.html' })

  const id = new URLSearchParams(location.search).get('id')
  const field = id ? findField(id) : null

  if (!field) {
    renderNotFound()
    return
  }

  renderField(field)

  // Admin sửa sân ở tab khác thì trang chi tiết vẽ lại theo.
  SV.on((key) => {
    if (key !== 'fields' && key !== '*') return
    const updated = findField(field.id)
    if (updated) renderField(updated)
    else renderNotFound()
  })
}

document.addEventListener('DOMContentLoaded', init)
