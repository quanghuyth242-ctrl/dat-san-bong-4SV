import './style.css'
import { syncAuthNav } from './auth-nav.js'
import { REPEAT_LABEL, repeatDates, repeatCountOf, repeatCountOk, makeSeriesId } from './repeat.js'

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

// Dịch vụ đi kèm khi đặt sân (giá mỗi buổi) — trùng danh sách với trang chủ.
const SERVICES = [
  { id: 'nuoc-suoi', name: 'Nước suối', price: 10000, unit: 'chai', icon: 'fa-bottle-water' },
  { id: 'nuoc-tang-luc', name: 'Nước tăng lực', price: 15000, unit: 'chai', icon: 'fa-bolt' },
  { id: 'thue-bong', name: 'Thuê bóng thi đấu', price: 50000, unit: 'quả', icon: 'fa-futbol' },
  { id: 'ao-bib', name: 'Áo bib', price: 20000, unit: 'bộ', icon: 'fa-shirt' },
  { id: 'trong-tai', name: 'Trọng tài', price: 200000, unit: 'trận', icon: 'fa-user-tie', max: 1 },
  { id: 'var', name: 'VAR (trợ lý video)', price: 300000, unit: 'trận', icon: 'fa-video', max: 1 },
]

const pickedServices = {}

function serviceTotalPerSession() {
  return SERVICES.reduce((sum, s) => sum + s.price * (pickedServices[s.id] || 0), 0)
}

function servicesSectionHtml() {
  return `
    <section class="pay-card">
      <div class="pay-card-title"><i class="fa-solid fa-cart-plus"></i> Dịch vụ đi kèm</div>
      <p class="dt-note"><i class="fa-solid fa-circle-info"></i> Tuỳ chọn, giá tính cho mỗi buổi. Dịch vụ đã chọn sẽ điền sẵn vào form đặt sân khi bạn bấm "Đặt sân ngay".</p>
      <div class="service-list" id="dtServiceList">
        ${SERVICES.map((s) => {
          const max = s.max ?? 99
          return `
          <div class="service-item" data-id="${s.id}">
            <i class="fa-solid ${s.icon} svc-icon"></i>
            <div class="svc-info">
              <div class="svc-name">${esc(s.name)}</div>
              <div class="svc-price">${s.price.toLocaleString('vi-VN')}đ / ${esc(s.unit)}</div>
            </div>
            <div class="s-qty">
              ${
                s.max === 1
                  ? `<button type="button" class="qty-check" data-act="toggle" data-id="${s.id}" aria-pressed="false" aria-label="Chọn ${esc(s.name)}"><i class="fa-solid fa-check"></i></button>`
                  : `<button type="button" class="qty-btn" data-act="dec" data-id="${s.id}" aria-label="Giảm">−</button>
              <span class="qty-val" data-qty="${s.id}">0</span>
              <button type="button" class="qty-btn" data-act="inc" data-id="${s.id}" aria-label="Tăng">+</button>`
              }
            </div>
          </div>`
        }).join('')}
      </div>
      <p class="dt-slot-note" id="dtSvcNote"><i class="fa-solid fa-circle-info"></i> Chưa chọn dịch vụ nào.</p>
    </section>`
}

function initServices(field) {
  const list = document.getElementById('dtServiceList')
  const note = document.getElementById('dtSvcNote')
  const cta = document.getElementById('dtBookCta')

  const sync = () => {
    const total = serviceTotalPerSession()
    const count = SERVICES.filter((s) => pickedServices[s.id] > 0).length
    if (note) {
      note.innerHTML =
        total > 0
          ? `<i class="fa-solid fa-cart-plus"></i> Đã chọn ${count} dịch vụ · Tiền dịch vụ mỗi buổi: <b>${total.toLocaleString('vi-VN')}đ</b> (cộng chung với tiền sân ở form đặt sân).`
          : `<i class="fa-solid fa-circle-info"></i> Chưa chọn dịch vụ nào — bạn vẫn đặt sân không kèm dịch vụ.`
    }
  }

  // "Đặt sân ngay" mở modal đặt trực tiếp ngay tại đây, dịch vụ đã chọn ở trên
  // được điền sẵn vào form.
  cta?.addEventListener('click', () => openBooking(field))

  list?.addEventListener('click', (e) => {
    const btn = e.target.closest('.qty-btn, .qty-check')
    if (!btn) return
    const id = btn.dataset.id
    const act = btn.dataset.act
    const svc = SERVICES.find((x) => x.id === id)
    if (!svc) return
    const max = svc.max ?? 99
    const cur = pickedServices[id] || 0
    const next = Math.max(
      0,
      Math.min(max, act === 'toggle' ? (cur > 0 ? 0 : 1) : act === 'inc' ? cur + 1 : cur - 1)
    )
    if (next === 0) delete pickedServices[id]
    else pickedServices[id] = next

    const valEl = list.querySelector(`[data-qty="${id}"]`)
    if (valEl) valEl.textContent = String(next)
    const item = btn.closest('.service-item')
    item?.classList.toggle('active', next > 0)
    if (btn.classList.contains('qty-check')) btn.setAttribute('aria-pressed', String(next > 0))
    item?.querySelector('.qty-btn[data-act="inc"]')?.toggleAttribute('disabled', next >= max)
    sync()
  })

  sync()
}

// ==================== MODAL ĐẶT SÂN TRỰC TIÊP ====================
// Bấm "Đặt sân ngay" là mở form ngay tại trang chi tiết, không chuyển trang.
// Form giống hệt trang chủ: lưới khung giờ chọn trực tiếp (giống "Lịch trống
// hôm nay" phía trong), dịch vụ/voucher/tổng tiền tính như cũ.

const bookState = { field: null, duration: 1, services: {}, repeat: 'none', repeatCount: 1 }

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

function shakeField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.classList.remove('shake')
  void el.offsetWidth
  el.classList.add('shake')
}

function buildTimeOptions(venue, date, duration) {
  const out = []
  for (let h = venue.hours.open; h < venue.hours.close; h += 1) {
    if (h + duration > venue.hours.close) continue
    if (isPastSlot(date, h, h + duration, venue.hours.close)) continue
    if (SV.isSlotTaken(venue.id, date, h, duration)) continue
    out.push(`<option value="${h}">${timeLabel(h)} – ${timeLabel(h + duration)}</option>`)
  }
  return out.join('')
}

function bookServiceCost() {
  return SERVICES.reduce((sum, s) => sum + s.price * (bookState.services[s.id] || 0), 0)
}

function bookSelectedServices() {
  return SERVICES.filter((s) => (bookState.services[s.id] || 0) > 0).map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    unit: s.unit,
    qty: bookState.services[s.id],
  }))
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

function openBooking(field) {
  bookState.field = field
  bookState.duration = 1
  bookState.repeat = 'none'
  bookState.repeatCount = 1
  // Dịch vụ người dùng chọn ở mục "Dịch vụ đi kèm" điền sẵn vào form.
  bookState.services = { ...pickedServices }

  const user = window.SV?.currentUser ? window.SV.currentUser() : null
  const defaultName = user ? user.name || '' : ''
  const defaultPhone = user ? user.phone || '' : ''

  const body = document.getElementById('bookBody')
  if (body) {
    body.innerHTML = `
      <div class="bk-info">
        <img src="${esc(field.img)}" alt="${esc(field.name)}" />
        <div>
          <div class="bk-name">${esc(field.name)}</div>
          <div class="bk-sub">${esc(typeLabel(field.type))} · ${esc(formatPriceShort(field.price))}${esc(field.per)} · ${timeLabel(field.hours.open)} – ${timeLabel(field.hours.close)}</div>
        </div>
      </div>
      <form id="bookForm" novalidate>
        <div class="bk-grid">
          <div class="bk-field" id="f-date">
            <label for="bkDate">Ngày <span style="color:#dc2626">*</span></label>
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
          <div class="bk-field full" id="f-time">
            <label for="bkTime">Khung giờ <span style="color:#dc2626">*</span></label>
            <select id="bkTime" required style="display: none;"></select>
            <div class="bk-slot-grid" id="bkTimeSlotGrid"></div>
            <span class="bk-err">Khung giờ này không còn trống hoặc nằm ngoài giờ mở cửa.</span>
          </div>
          <div class="bk-field" id="f-repeat">
            <label for="bkRepeat">Đặt định kỳ</label>
            <select id="bkRepeat">
              ${Object.entries(REPEAT_LABEL)
                .map(([value, text]) => `<option value="${value}"${value === 'none' ? ' selected' : ''}>${text}</option>`)
                .join('')}
            </select>
          </div>
          <div class="bk-field" id="f-repeatCount" style="display:none">
            <label for="bkRepeatCount">Số buổi</label>
            <input type="number" id="bkRepeatCount" min="1" max="52" value="1" />
            <span class="bk-err">Số buổi phải từ 1 đến 52.</span>
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
          <div class="bk-field full" id="f-services">
            <label>Dịch vụ đi kèm <span class="bk-hint">(tuỳ chọn · ✓ chọn 1 · +/− chọn số lượng)</span></label>
            <div class="service-list" id="serviceList">
              ${SERVICES.map((s) => {
                const q = bookState.services[s.id] || 0
                const max = s.max ?? 99
                return `
                <div class="service-item ${q > 0 ? 'active' : ''}" data-id="${s.id}">
                  <i class="fa-solid ${s.icon} svc-icon"></i>
                  <div class="svc-info">
                    <div class="svc-name">${esc(s.name)}</div>
                    <div class="svc-price">${s.price.toLocaleString('vi-VN')}đ / ${esc(s.unit)}</div>
                  </div>
                  <div class="s-qty">
                    ${
                      s.max === 1
                        ? `<button type="button" class="qty-check" data-act="toggle" data-id="${s.id}" aria-pressed="${q > 0}" aria-label="Chọn ${esc(s.name)}"><i class="fa-solid fa-check"></i></button>`
                        : `<button type="button" class="qty-btn" data-act="dec" data-id="${s.id}" aria-label="Giảm">−</button>
                    <span class="qty-val" id="qty-${s.id}">${q}</span>
                    <button type="button" class="qty-btn" data-act="inc" data-id="${s.id}" ${q >= max ? 'disabled' : ''} aria-label="Tăng">+</button>`
                    }
                  </div>
                </div>`
              }).join('')}
            </div>
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
      sel.value = ''
      renderBkTimeSlots()
      return
    }
    const prev = sel.value
    const html = buildTimeOptions(bookState.field || field, date, bookState.duration)
    sel.innerHTML = html || '<option value="">-- Đã kín lịch --</option>'
    if (prev && [...sel.options].some((o) => o.value === prev)) {
      sel.value = prev
    } else if (sel.options.length) {
      sel.selectedIndex = 0
    }
    renderBkTimeSlots()
  }

  /** Lưới khung giờ — giống "Lịch trống hôm nay": bấm chọn, select ẩn giữ giá trị. */
  function renderBkTimeSlots() {
    const grid = document.getElementById('bkTimeSlotGrid')
    const sel = document.getElementById('bkTime')
    if (!grid || !sel) return
    const date = dateInput.value
    const v = bookState.field || field
    const duration = bookState.duration
    if (!date) {
      grid.innerHTML = ''
      return
    }
    let html = ''
    for (let h = v.hours.open; h < v.hours.close; h++) {
      if (h + duration > v.hours.close) continue
      const isPast = isPastSlot(date, h, h + duration, v.hours.close)
      const isTaken = !isPast && SV.isSlotTaken(v.id, date, h, duration)
      const selected = !isPast && !isTaken && sel.value !== '' && parseFloat(sel.value) === h
      const cls = isPast ? 'is-past' : isTaken ? 'is-taken' : selected ? 'is-selected' : ''
      const sub = isPast ? 'Đã quá giờ đặt' : isTaken ? 'Đã có người đặt' : selected ? 'Đã chọn' : 'Còn trống'
      html += `<button type="button" class="bk-slot ${cls}" data-hour="${h}" ${
        isPast || isTaken ? 'disabled' : ''
      }>${timeLabel(h)} – ${timeLabel(h + duration)}<small>${sub}</small></button>`
    }
    grid.innerHTML =
      html ||
      `<span class="bk-slot-empty"><i class="fa-solid fa-calendar-xmark"></i> Không còn khung giờ trống trong ngày</span>`
  }

  /** Hiện/ẩn ô "Số buổi" theo lựa chọn định kỳ và ghi vào bookState. */
  const syncRepeatUI = () => {
    const repeat = document.getElementById('bkRepeat')?.value || 'none'
    bookState.repeat = repeat
    bookState.repeatCount = repeatCountOf(repeat, document.getElementById('bkRepeatCount')?.value)
    const wrap = document.getElementById('f-repeatCount')
    if (wrap) wrap.style.display = repeat === 'none' ? 'none' : ''
  }

  const updateTotal = () => {
    syncRepeatUI()
    bookState.duration = parseFloat(document.getElementById('bkDuration').value) || 1
    const current = bookState.field || field
    const courtSub = Math.round((Number(current.price) || 0) * bookState.duration)
    const servicePer = bookServiceCost()
    const subtotal = courtSub + servicePer

    const code = (document.getElementById('bkVoucher')?.value || '').trim().toUpperCase()
    const voucher = code && window.SV?.previewVoucher ? window.SV.previewVoucher(code, subtotal) : null
    const usable = !!(voucher && voucher.ok)

    document.getElementById('f-voucher')?.classList.toggle('invalid', !!code && !usable)

    const count = bookState.repeatCount
    const total = (usable ? subtotal - voucher.discount : subtotal) * count
    const parts = []
    if (servicePer > 0) parts.push(`sân ${courtSub.toLocaleString('vi-VN')}đ + DV ${servicePer.toLocaleString('vi-VN')}đ`)
    if (usable) parts.push(`-${voucher.discount.toLocaleString('vi-VN')}đ`)
    if (count > 1) parts.push(`${count} buổi`)

    const el = document.getElementById('bkTotal')
    el.innerHTML = parts.length
      ? `${total.toLocaleString('vi-VN')}đ <small style="opacity:.75">(${parts.join(' · ')})</small>`
      : `${total.toLocaleString('vi-VN')}đ`
    refresh()
  }

  document.getElementById('serviceList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.qty-btn, .qty-check')
    if (!btn) return
    const id = btn.dataset.id
    const act = btn.dataset.act
    const svc = SERVICES.find((x) => x.id === id)
    if (!svc) return
    const cur = bookState.services[id] || 0
    const max = svc.max ?? 99
    const delta = act === 'inc' ? 1 : act === 'dec' ? -1 : 0
    const next = Math.max(0, Math.min(max, act === 'toggle' ? (cur > 0 ? 0 : 1) : cur + delta))
    if (next === 0) delete bookState.services[id]
    else bookState.services[id] = next
    const valEl = document.getElementById('qty-' + id)
    if (valEl) valEl.textContent = next
    const item = btn.closest('.service-item')
    item?.classList.toggle('active', next > 0)
    if (btn.classList.contains('qty-check')) btn.setAttribute('aria-pressed', String(next > 0))
    item?.querySelector('.qty-btn[data-act="inc"]')?.toggleAttribute('disabled', next >= max)
    updateTotal()
  })

  dateInput.addEventListener('change', refresh)
  document.getElementById('bkTimeSlotGrid')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.bk-slot')
    if (!chip || chip.disabled) return
    const t = document.getElementById('bkTime')
    t.value = chip.dataset.hour
    t.dispatchEvent(new Event('change'))
    document.getElementById('f-time')?.classList.remove('invalid')
    document.getElementById('f-time')?.classList.remove('shake')
    renderBkTimeSlots()
  })
  document.getElementById('bkDuration').addEventListener('change', updateTotal)
  document.getElementById('bkRepeat')?.addEventListener('change', updateTotal)
  document.getElementById('bkRepeatCount')?.addEventListener('input', updateTotal)
  document.getElementById('bkVoucher').addEventListener('input', updateTotal)
  document.getElementById('bookForm').querySelectorAll('input, select').forEach((el) => {
    if (el.id === 'bkVoucher') return
    const clearErr = () => {
      const fieldEl = el.closest('.bk-field')
      fieldEl?.classList.remove('invalid')
      fieldEl?.classList.remove('shake')
    }
    el.addEventListener('input', clearErr)
    el.addEventListener('change', clearErr)
  })

  document.getElementById('bookForm').addEventListener('submit', (e) => {
    e.preventDefault()
    submitBooking(field)
  })

  updateTotal()
  renderBkTimeSlots()
  openModal('bookModal')
}

function submitBooking(field) {
  const set = (name, ok) => document.getElementById('f-' + name)?.classList.toggle('invalid', !ok)

  const dateInput = document.getElementById('bkDate')
  const timeInput = document.getElementById('bkTime')
  const nameInput = document.getElementById('bkName')
  const phoneInput = document.getElementById('bkPhone')

  const date = dateInput ? dateInput.value : ''
  const startHour = parseFloat(timeInput ? timeInput.value : NaN)
  const duration = bookState.duration
  const name = nameInput ? nameInput.value.trim() : ''
  const phone = phoneInput ? phoneInput.value.trim().replace(/[\s.-]/g, '') : ''
  const repeat = document.getElementById('bkRepeat')?.value || 'none'
  const repeatRaw = document.getElementById('bkRepeatCount')?.value ?? '1'
  const count = repeatCountOf(repeat, repeatRaw)

  const dateOk = !!date && date >= todayStr()
  let timeOk = Number.isFinite(startHour) && dateOk
  if (timeOk) {
    timeOk =
      startHour >= field.hours.open &&
      startHour + duration <= field.hours.close &&
      !isPastSlot(date, startHour, startHour + duration, field.hours.close) &&
      !SV.isSlotTaken(field.id, date, startHour, duration)
  }
  const nameOk = name.length >= 2
  const phoneOk = /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone)
  const repeatOk = repeatCountOk(repeat, repeatRaw)

  set('date', dateOk)
  set('time', timeOk)
  set('name', nameOk)
  set('phone', phoneOk)
  set('repeatCount', repeatOk)

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
  if (!repeatOk) {
    document.getElementById('bkRepeatCount')?.focus()
    shakeField('f-repeatCount')
    toast('Số buổi đặt định kỳ phải từ 1 đến 52', 'error')
    return
  }

  const btn = document.getElementById('btnConfirmBook')
  const resetBtn = () => {
    if (btn) {
      btn.disabled = false
      btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Xác nhận đặt sân'
    }
  }

  try {
    const bookFn = window.SV?.createBooking || window.SV?.addBooking
    if (!bookFn) {
      toast('Hệ thống dữ liệu chưa sẵn sàng. Vui lòng tải lại trang.', 'error')
      resetBtn()
      return
    }
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...'
    }

    const currentUser = window.SV?.currentUser ? window.SV.currentUser() : null

    const servicePer = bookServiceCost()
    const services = bookSelectedServices()
    const courtTotal = Math.round((Number(field.price) || 0) * duration)
    const voucherCode = (document.getElementById('bkVoucher')?.value || '').trim().toUpperCase()
    const seriesId = repeat === 'none' ? '' : makeSeriesId()

    // Đặt định kỳ: tạo từng buổi, bỏ qua buổi đã có người đặt hoặc đã qua giờ.
    const dates = repeatDates(date, repeat, count)
    const created = []
    const skipped = []
    let lastError = ''

    dates.forEach((d) => {
      const free =
        startHour >= field.hours.open &&
        startHour + duration <= field.hours.close &&
        !isPastSlot(d, startHour, startHour + duration, field.hours.close) &&
        !SV.isSlotTaken(field.id, d, startHour, duration)
      if (!free) {
        skipped.push(d)
        return
      }
      const result = bookFn({
        courtId: SV.courtKey(field.id),
        courtName: field.name,
        type: field.type || '',
        date: d,
        startHour,
        endHour: startHour + duration,
        duration,
        courtTotal,
        serviceTotal: servicePer,
        services,
        total: courtTotal + servicePer,
        voucherCode,
        repeat,
        repeatCount: count,
        seriesId,
        userId: currentUser?.id || '',
        userName: name,
        customer: { name, phone, email: currentUser?.email || '' },
        status: 'pending',
      })
      if (result && result.ok) created.push(result.booking)
      else {
        if (result?.error) lastError = result.error
        skipped.push(d)
      }
    })

    if (!created.length) {
      toast(
        lastError || 'Tất cả khung giờ đã chọn đều đã có người đặt. Vui lòng chọn lại.',
        'error'
      )
      resetBtn()
      return
    }

    const booking = created[0]
    const lastBooking = created[created.length - 1]
    const totalAll = created.reduce((sum, b) => sum + (Number(b.total) || 0), 0)
    const subtotalAll = created.reduce((sum, b) => sum + (Number(b.subtotal) || 0), 0)
    const payUrl = `./thanh-toan.html?ma=${encodeURIComponent(booking.id)}`
    const serviceLine = services.length
      ? `<div><dt>Dịch vụ</dt><dd>${services.map((s) => `${esc(s.name)} ×${s.qty}`).join(', ')}</dd></div>
         <div><dt>Tiền dịch vụ</dt><dd>${servicePer.toLocaleString('vi-VN')}đ${
           created.length > 1 ? ` × ${created.length} buổi` : ''
         }</dd></div>`
      : ''
    const repeatLine =
      repeat === 'none'
        ? ''
        : `<div><dt>Hình thức</dt><dd>${REPEAT_LABEL[repeat]} · ${created.length} buổi</dd></div>`
    const dateLine =
      created.length > 1
        ? `<div><dt>Ngày</dt><dd>${esc(booking.date)} → ${esc(lastBooking.date)}</dd></div>`
        : `<div><dt>Ngày</dt><dd>${esc(booking.date)}</dd></div>`
    const skipNote = skipped.length
      ? `<p style="margin:10px 0 0;font-size:.76rem;color:#64748b;text-align:left"><i class="fa-solid fa-circle-info"></i> Đã bỏ qua ${skipped.length} buổi trùng lịch hoặc đã qua giờ.</p>`
      : ''
    const multiNote =
      created.length > 1
        ? `<p style="margin:8px 0 0;font-size:.76rem;color:#64748b;text-align:left"><i class="fa-solid fa-circle-info"></i> Buổi đầu được mở trang thanh toán, các buổi còn lại được giữ chỗ và thanh toán trực tiếp tại sân.</p>`
        : ''
    const body = document.getElementById('bookBody')
    if (body) {
      body.innerHTML = `
        <div class="bk-success">
          <div class="bk-success-icon"><i class="fa-solid fa-check"></i></div>
          <h3>Đặt sân thành công!</h3>
          <p>Mã đơn <b>${esc(booking.id)}</b>${
            created.length > 1 ? ` (+${created.length - 1} buổi)` : ''
          } · Đang mở trang thanh toán...</p>
          <dl class="bk-summary">
            <div><dt>Sân</dt><dd>${esc(field.name)}</dd></div>
            ${field.type ? `<div><dt>Loại sân</dt><dd>${esc(typeLabel(field.type))}</dd></div>` : ''}
            ${dateLine}
            <div><dt>Giờ</dt><dd>${timeLabel(startHour)} – ${timeLabel(startHour + duration)}</dd></div>
            <div><dt>Thời lượng</dt><dd>${duration} giờ</dd></div>
            ${repeatLine}
            ${serviceLine}
            <div><dt>Tiền sân</dt><dd>${(courtTotal * created.length).toLocaleString('vi-VN')}đ${
              created.length > 1 ? ` × ${created.length} buổi` : ''
            }</dd></div>
            ${
              booking.discount > 0
                ? `<div><dt>Tạm tính</dt><dd style="text-decoration:line-through">${subtotalAll.toLocaleString('vi-VN')}đ</dd></div>
                   <div><dt>Giảm giá (${esc(booking.voucherCode)})</dt><dd style="color:#16a34a">-${(
                      subtotalAll - totalAll
                    ).toLocaleString('vi-VN')}đ</dd></div>
                   <div><dt>Tổng tiền</dt><dd><b>${totalAll.toLocaleString('vi-VN')}đ</b></dd></div>`
                : `<div><dt>Tổng tiền</dt><dd>${totalAll.toLocaleString('vi-VN')}đ</dd></div>`
            }
            <div><dt>Liên hệ</dt><dd>${esc(name)} · ${esc(phone)}</dd></div>
          </dl>
          ${skipNote}
          ${multiNote}
          <div class="bk-success-actions">
            <button type="button" class="btn-book btn-book-full" id="bkPayNow"><i class="fa-solid fa-credit-card"></i> Thanh toán ngay</button>
            <button type="button" class="btn-book btn-book-full btn-book-ghost" id="bkLater">Để thanh toán sau</button>
          </div>
        </div>
      `
      const timer = setTimeout(() => {
        window.location.href = payUrl
      }, 1500)
      document.getElementById('bkPayNow')?.addEventListener('click', () => {
        clearTimeout(timer)
        window.location.href = payUrl
      })
      document.getElementById('bkLater')?.addEventListener('click', () => {
        clearTimeout(timer)
        closeModal('bookModal')
        toast('Đơn đã được giữ. Bạn có thể thanh toán sau trong trang Tài khoản.')
      })
    }
    toast(
      `Đặt sân thành công · ${booking.id}${
        created.length > 1 ? ` · ${created.length} buổi ${REPEAT_LABEL[repeat].toLowerCase()}` : ''
      }`
    )
  } catch (err) {
    console.error('Lỗi khi đặt sân:', err)
    resetBtn()
    toast('Đã có lỗi xảy ra khi đặt sân: ' + (err.message || 'vui lòng thử lại'), 'error')
  }
}

function initBookingModal() {
  document.querySelectorAll('.modal-overlay').forEach((ov) => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeModal(ov.id)
    })
  })
  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')?.id))
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach((m) => closeModal(m.id))
    }
  })
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
  initBookingModal()
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
