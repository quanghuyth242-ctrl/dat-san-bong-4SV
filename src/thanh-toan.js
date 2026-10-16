/**
 * Trang thanh toán đơn đặt sân.
 *
 * Đơn được tạo ở trang chủ (kể cả khi đặt qua khung chat) rồi chuyển sang đây
 * với tham số ?ma=<mã đơn>. Dữ liệu nằm trong localStorage qua store.js nên
 * trang chạy được mà không cần máy chủ.
 *
 * Thanh toán là mô phỏng ở phía trình duyệt: chọn phương thức -> xác nhận ->
 * ghi cờ paid/paymentStatus vào đơn, để trang Tài khoản và trang quản trị đọc
 * lại đúng trạng thái "Đã thanh toán".
 */

const SV = window.SV

const HOME_URL = '../'
const ACCOUNT_URL = 'tai-khoan.html'

/** Các phương thức thanh toán trang này hỗ trợ. */
const METHODS = [
  {
    id: 'momo',
    name: 'Ví MoMo',
    icon: 'fa-solid fa-wallet',
    color: '#d82d8b',
    note: 'Mở ứng dụng MoMo, quét mã QR rồi xác nhận thanh toán.',
    cta: 'Tôi đã thanh toán',
  },
  {
    id: 'zalopay',
    name: 'Ví ZaloPay',
    icon: 'fa-solid fa-bolt',
    color: '#0068ff',
    note: 'Mở ứng dụng ZaloPay, quét mã QR để thanh toán.',
    cta: 'Tôi đã thanh toán',
  },
  {
    id: 'vnpay',
    name: 'VNPay (QR / thẻ)',
    icon: 'fa-solid fa-qrcode',
    color: '#0f5ea8',
    note: 'Quét mã QR VNPay hoặc trả bằng thẻ ATM/Visa/Master.',
    cta: 'Tôi đã thanh toán',
  },
  {
    id: 'bank',
    name: 'Chuyển khoản ngân hàng',
    icon: 'fa-solid fa-building-columns',
    color: '#0e7490',
    note: 'Chuyển đúng số tiền, nội dung là mã đơn để chủ sân đối soát.',
    cta: 'Tôi đã chuyển khoản',
  },
  {
    id: 'cash',
    name: 'Tiền mặt tại quầy',
    icon: 'fa-solid fa-money-bill-wave',
    color: '#16a34a',
    note: 'Thanh toán trực tiếp khi tới sân. Đơn được giữ trong 30 phút trước giờ đá.',
    cta: 'Giữ đơn, thanh toán tại quầy',
  },
]

// ================================ TIỆN ÍCH ================================

const esc = (value) => (SV?.escape ? SV.escape(value) : String(value ?? ''))

function money(value) {
  return (Number(value) || 0).toLocaleString('vi-VN') + 'đ'
}

function formatDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso || '—')
}

function timeLabel(hour) {
  const h = Number(hour)
  if (!Number.isFinite(h)) return ''
  if (SV?.hourToHHMM) return SV.hourToHHMM(h)
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
}

/** Mã đơn lấy từ URL: ?ma=, ?id=, ?don=, ?code= đều chấp nhận. */
function orderId() {
  const q = new URLSearchParams(location.search)
  return (q.get('ma') || q.get('id') || q.get('don') || q.get('code') || '').trim()
}

function methodById(id) {
  return METHODS.find((m) => m.id === id) || null
}

function isPaid(b) {
  return b.paid === true || b.paymentStatus === 'paid'
}

function isAtVenue(b) {
  return b.paymentStatus === 'at_venue'
}

// ================================ LƯU TRẠNG THÁI ================================

/**
 * Ghi trạng thái thanh toán vào đơn. SV.saveBookings() chuẩn hoá lại danh sách,
 * nên các cờ paid/paymentStatus phải nằm trong normBooking (store.js) mới không bị mất.
 */
function savePayment(id, patch) {
  const list = SV.bookings()
  const index = list.findIndex((b) => String(b.id) === String(id))
  if (index === -1) return null
  list[index] = { ...list[index], ...patch }
  SV.saveBookings(list)
  return list[index]
}

// ================================ VẼ ================================

const root = () => document.getElementById('payRoot')

function card(title, icon, inner, extraClass = '') {
  return `
    <section class="pay-card ${extraClass}">
      <h2 class="pay-card-title"><i class="${icon}"></i> ${title}</h2>
      ${inner}
    </section>`
}

/** Tóm tắt đơn: sân, thời gian, khách hàng và tiền. */
function summaryHtml(b, { showContact = true } = {}) {
  const rows = [
    ['Mã đơn', `<b>${esc(b.id)}</b>`],
    ['Sân', esc(b.fieldName || b.courtName || 'Sân bóng đá')],
    ['Ngày', formatDate(b.date)],
    ['Giờ', `${timeLabel(b.startHour)} – ${timeLabel(b.endHour)}`],
    ['Thời lượng', `${b.duration} giờ`],
  ]
  if (showContact) {
    rows.push(['Khách hàng', esc(b.customer?.name || b.userName || '—')])
    if (b.customer?.phone) rows.push(['Số điện thoại', esc(b.customer.phone)])
  }
  if (b.discount > 0) {
    rows.push(['Tạm tính', money(b.subtotal)])
    rows.push([
      `Giảm giá (${esc(b.voucherCode)})`,
      `<span class="pay-minus">-${money(b.discount)}</span>`,
    ])
  }
  rows.push(['Tổng tiền', `<b class="pay-amount">${money(b.total)}</b>`])

  return `<dl class="pay-rows">${rows
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
    .join('')}</dl>`
}

/** Khối mã QR trang trí (dữ liệu thật do ví điện tử cung cấp). */
function qrBox(method, amount) {
  return `
    <div class="pay-qr">
      <div class="pay-qr-code" aria-hidden="true"></div>
      <div class="pay-qr-meta">
        <b>${esc(method.name)}</b>
        <span>Số tiền <b>${money(amount)}</b></span>
        <span>Nội dung chuyển khoản: <b id="payMemo">${esc(orderId())}</b></span>
      </div>
    </div>`
}

function methodsHtml(b) {
  const items = METHODS.map((m) => `
    <button type="button" class="pay-method" data-method="${m.id}">
      <i class="${m.icon}" style="color:${m.color}"></i>
      <span>${esc(m.name)}</span>
      <i class="fa-solid fa-circle-check pay-method-ok"></i>
    </button>`).join('')

  return `
    ${card('Phương thức thanh toán', 'fa-solid fa-wallet', `
      <div class="pay-methods" id="payMethods">${items}</div>
      <div class="pay-detail" id="payDetail">
        <p class="pay-detail-hint"><i class="fa-solid fa-circle-info"></i> Chọn một phương thức để xem hướng dẫn thanh toán.</p>
      </div>
    `)}
  `
}

function formHtml(b) {
  return `
    <div class="pay-grid">
      ${card('Thông tin đơn hàng', 'fa-solid fa-receipt', summaryHtml(b))}
      <div class="pay-col">
        ${methodsHtml(b)}
        <div class="pay-actions">
          <button type="button" class="btn-book pay-btn-main" id="payNow">
            <i class="fa-solid fa-lock"></i> Thanh toán ${money(b.total)}
          </button>
          <button type="button" class="btn-book btn-book-ghost pay-btn-main" id="payLater">Để thanh toán sau</button>
        </div>
        <p class="pay-note">
          <i class="fa-solid fa-shield-halved"></i>
          Đơn được giữ trong lúc bạn thanh toán. Nếu cần hỗ trợ, liên hệ chủ sân qua số điện thoại đặt sân.
        </p>
      </div>
    </div>`
}

function paidHtml(b, method) {
  return `
    <section class="pay-card pay-done">
      <div class="pay-done-icon"><i class="fa-solid fa-check"></i></div>
      <h2>Thanh toán thành công!</h2>
      <p>
        Đơn <b>${esc(b.id)}</b> đã được thanh toán bằng
        <b>${esc(method ? method.name : b.paymentMethod || 'ví điện tử')}</b>${
          b.paidAt ? ` <span class="pay-muted">· ${esc(b.paidAt)}</span>` : ''
        }.
      </p>
      ${summaryHtml(b, { showContact: false })}
      <div class="pay-actions pay-actions-center">
        <a class="btn-book pay-btn-main" href="${HOME_URL}"><i class="fa-solid fa-house"></i> Về trang chủ</a>
        <a class="btn-book btn-book-ghost pay-btn-main" href="${ACCOUNT_URL}"><i class="fa-solid fa-receipt"></i> Xem đơn của tôi</a>
      </div>
    </section>`
}

function atVenueHtml(b) {
  return `
    <section class="pay-card pay-done">
      <div class="pay-done-icon pay-done-icon-wait"><i class="fa-solid fa-clock"></i></div>
      <h2>Đơn đã được giữ</h2>
      <p>
        Bạn chọn thanh toán <b>tại quầy</b>. Mang mã đơn <b>${esc(b.id)}</b> khi tới sân để thanh toán
        <b>${money(b.total)}</b>.
      </p>
      ${summaryHtml(b, { showContact: false })}
      <div class="pay-actions pay-actions-center">
        <a class="btn-book pay-btn-main" href="${HOME_URL}"><i class="fa-solid fa-house"></i> Về trang chủ</a>
        <button type="button" class="btn-book btn-book-ghost pay-btn-main" id="payAgain">Thanh toán online</button>
      </div>
    </section>`
}

/**
 * Khách chọn "Để thanh toán sau": đơn giữ nguyên trạng thái Chưa thanh toán,
 * trang hướng dẫn cách đóng tiền sau từ trang Tài khoản trước giờ đá.
 */
function deferredHtml(b) {
  return `
    <section class="pay-card pay-done">
      <div class="pay-done-icon pay-done-icon-wait"><i class="fa-solid fa-clock"></i></div>
      <h2>Đơn đã được giữ, bạn có thể thanh toán sau</h2>
      <p>
        Đơn <b>${esc(b.id)}</b> đang ở trạng thái <b>Chưa thanh toán</b>. Bạn đóng tiền sau được,
        miễn là trước giờ đá: vào <b>Tài khoản</b> → mục <b>Chưa thanh toán</b> rồi bấm
        <b>Thanh toán ngay</b>.
      </p>
      ${summaryHtml(b, { showContact: false })}
      <div class="pay-actions pay-actions-center">
        <a class="btn-book pay-btn-main" href="${HOME_URL}"><i class="fa-solid fa-house"></i> Về trang chủ</a>
        <a class="btn-book btn-book-ghost pay-btn-main" href="${ACCOUNT_URL}"><i class="fa-solid fa-receipt"></i> Xem đơn của tôi</a>
      </div>
    </section>`
}

function missingHtml() {
  return `
    <section class="pay-card pay-done">
      <div class="pay-done-icon pay-done-icon-wait"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h2>Không tìm thấy đơn hàng</h2>
      <p>Đơn không tồn tại hoặc đã bị xoá. Bạn có thể quay về trang chủ để đặt sân mới.</p>
      <div class="pay-actions pay-actions-center">
        <a class="btn-book pay-btn-main" href="${HOME_URL}"><i class="fa-solid fa-house"></i> Về trang chủ</a>
        <a class="btn-book btn-book-ghost pay-btn-main" href="${HOME_URL}#tim-san"><i class="fa-solid fa-magnifying-glass"></i> Tìm sân</a>
      </div>
    </section>`
}

// ================================ TRẠNG THÁI TRANG ================================

let selectedMethod = null
let currentId = orderId()

function render() {
  const el = root()
  if (!el) return

  if (!SV) {
    el.innerHTML = missingHtml()
    return
  }

  const b = currentId ? SV.booking(currentId) : null
  if (!b) {
    el.innerHTML = missingHtml()
    return
  }

  // Đơn đã thanh toán từ trước (F5, mở lại link) -> hiện thẳng thành công.
  if (isPaid(b)) {
    el.innerHTML = paidHtml(b, methodById(b.paymentMethod))
    return
  }
  if (isAtVenue(b)) {
    el.innerHTML = atVenueHtml(b)
    document.getElementById('payAgain')?.addEventListener('click', () => {
      savePayment(b.id, { paymentStatus: 'unpaid', paymentMethod: '' })
      render()
    })
    return
  }

  el.innerHTML = formHtml(b)
  bindForm(b)
}

function bindForm(b) {
  const detail = document.getElementById('payDetail')

  document.getElementById('payMethods')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-method]')
    if (!btn) return
    selectedMethod = btn.dataset.method
    document.querySelectorAll('.pay-method').forEach((m) => {
      m.classList.toggle('is-active', m.dataset.method === selectedMethod)
    })
    const method = methodById(selectedMethod)
    if (detail && method) {
      const qr = method.id === 'cash' ? '' : qrBox(method, b.total)
      detail.innerHTML = `
        <p class="pay-detail-note"><i class="fa-solid fa-circle-info"></i> ${esc(method.note)}</p>
        ${qr}
      `
    }
  })

  document.getElementById('payNow')?.addEventListener('click', () => {
    if (!selectedMethod) {
      if (detail) {
        detail.innerHTML =
          '<p class="pay-detail-hint is-warn"><i class="fa-solid fa-triangle-exclamation"></i> Bạn chưa chọn phương thức thanh toán.</p>'
      }
      document.getElementById('payMethods')?.classList.add('shake')
      setTimeout(() => document.getElementById('payMethods')?.classList.remove('shake'), 500)
      return
    }
    confirmPayment(b, methodById(selectedMethod))
  })

  // Để thanh toán sau: không đổi trạng thái đơn (vốn là Chưa thanh toán),
  // chỉ chuyển sang màn hướng dẫn để khách biết đóng tiền ở đâu.
  document.getElementById('payLater')?.addEventListener('click', () => {
    const el = root()
    if (el) el.innerHTML = deferredHtml(b)
  })
}

/** Xác nhận thanh toán: hiện màn xử lý rồi ghi trạng thái cho đơn. */
function confirmPayment(b, method) {
  if (!method) return
  const el = root()
  el.innerHTML = `
    <section class="pay-card pay-loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <b>Đang xác nhận giao dịch...</b>
      <span>${esc(method.name)} · ${money(b.total)}</span>
    </section>`

  setTimeout(() => {
    const stamp = new Date().toLocaleString('vi-VN')
    if (method.id === 'cash') {
      savePayment(b.id, { paymentStatus: 'at_venue', paymentMethod: 'cash', paid: false, paidAt: '' })
    } else {
      savePayment(b.id, {
        paid: true,
        paymentStatus: 'paid',
        paymentMethod: method.id,
        paidAt: stamp,
      })
    }
    render()
  }, 1300)
}

// ================================ KHỞI TẠO ================================

document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year')
  if (year) year.textContent = String(new Date().getFullYear())
  render()
})
