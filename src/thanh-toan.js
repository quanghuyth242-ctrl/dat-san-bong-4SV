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

import { syncAuthNav } from './auth-nav.js'

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
  {
    id: 'later',
    name: 'Để thanh toán sau',
    icon: 'fa-solid fa-calendar-clock',
    color: '#f59e0b',
    note: 'Giữ đơn trước, trả tiền sau trong trang Tài khoản hoặc tại quầy trước giờ đá.',
    cta: 'Giữ đơn, thanh toán sau',
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
  return b.paymentStatus === 'at_venue' || b.paymentStatus === 'unpaid'
}

function isAwaitingPayment(b) {
  return b.paymentStatus === 'awaiting_payment'
}

/** Khách chọn "Để thanh toán sau": đơn được giữ, tiền thu sau. */
function isPayLater(b) {
  return b.paymentStatus === 'pay_later'
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
          <button type="button" class="btn-book btn-book-ghost pay-btn-main" id="payLater">
            <i class="fa-solid fa-calendar-clock"></i> Để thanh toán sau
          </button>
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
        <button type="button" class="btn-book btn-book-ghost pay-btn-main" id="payAgain">Chọn phương thức khác</button>
      </div>
    </section>`
}

/** Màn xác nhận khi khách chọn "Để thanh toán sau": đơn được giữ, hẹn trả tiền sau. */
function payLaterHtml(b) {
  return `
    <section class="pay-card pay-done">
      <div class="pay-done-icon pay-done-icon-wait"><i class="fa-solid fa-calendar-clock"></i></div>
      <h2>Đơn được giữ – Thanh toán sau</h2>
      <p>
        Đơn <b>${esc(b.id)}</b> đã được giữ cho bạn. Bạn có thể thanh toán <b>${money(b.total)}</b>
        sau trong trang <b>Tài khoản</b>, hoặc tại quầy của sân trước giờ đá
        <b>${formatDate(b.date)} · ${timeLabel(b.startHour)}</b>.
      </p>
      ${summaryHtml(b, { showContact: false })}
      <div class="pay-actions pay-actions-center">
        <button type="button" class="btn-book pay-btn-main" id="payNowLater">
          <i class="fa-solid fa-credit-card"></i> Thanh toán ngay
        </button>
        <a class="btn-book btn-book-ghost pay-btn-main" href="${ACCOUNT_URL}">
          <i class="fa-solid fa-wallet"></i> Vào Tài khoản để trả tiền
        </a>
        <a class="btn-book btn-book-ghost pay-btn-main" href="${HOME_URL}"><i class="fa-solid fa-house"></i> Về trang chủ</a>
      </div>
    </section>`
}

function awaitingPaymentHtml(b) {
  const bankConfig = window.SV?.bankConfig ? window.SV.bankConfig() : {}
  const bankName = bankConfig.bankName || 'MB (Ngân hàng TMCP Quân Đội - MBBank)'
  const accountNumber = bankConfig.accountNumber || '207987'
  const accountHolder = bankConfig.accountHolder || 'LE THANH LONG'
  const qrImage = bankConfig.qrImage || '/project/images/qr-bank.png'

  return `
    <section class="pay-card pay-done">
      <div class="pay-done-icon pay-done-icon-wait"><i class="fa-solid fa-clock"></i></div>
      <h2>Chờ xác nhận thanh toán</h2>
      <p>
        Bạn đã chọn chuyển khoản. Vui lòng chuyển đúng <b>${money(b.total)}</b>
        với nội dung <b>DATSAN ${esc(b.id)}</b>. Admin sẽ xác nhận trong thời gian sớm nhất.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0;">
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
          <img src="${esc(qrImage)}" alt="QR chuyển khoản" style="width:120px;height:120px;object-fit:contain;border-radius:8px;border:1px solid #e2e8f0;" onerror="this.style.display='none'">
          <div>
            <div style="font-weight:700;margin-bottom:6px;">🏦 ${esc(bankName)}</div>
            <div style="margin-bottom:4px;">Số TK: <strong>${esc(accountNumber)}</strong></div>
            <div style="margin-bottom:4px;">Chủ TK: <strong>${esc(accountHolder)}</strong></div>
            <div style="margin-bottom:4px;">Số tiền: <strong style="color:#dc2626;">${money(b.total)}</strong></div>
            <div>Nội dung: <strong style="background:#e0f2fe;padding:2px 6px;border-radius:4px;font-family:monospace;">DATSAN ${esc(b.id)}</strong></div>
          </div>
        </div>
      </div>
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
/**
 * Màn hình đang mở ('paid', 'awaiting', 'at_venue', 'pay_later', 'select').
 * Cần biết mình đang ở màn nào để khi admin ghi nhận tiền ở tab quản trị thì
 * màn "Chờ xác nhận thanh toán" tự chuyển sang màn thành công.
 */
let currentScreen = ''

function render() {
  const el = root()
  if (!el) return

  if (!SV) {
    currentScreen = 'missing'
    el.innerHTML = missingHtml()
    return
  }

  const b = currentId ? SV.booking(currentId) : null
  if (!b) {
    currentScreen = 'missing'
    el.innerHTML = missingHtml()
    return
  }

  // Đơn đã thanh toán từ trước (F5, mở lại link) -> hiện thẳng thành công.
  if (isPaid(b)) {
    currentScreen = 'paid'
    el.innerHTML = paidHtml(b, methodById(b.paymentMethod))
    return
  }
  // Đơn chờ xác nhận chuyển khoản
  if (isAwaitingPayment(b)) {
    currentScreen = 'awaiting'
    el.innerHTML = awaitingPaymentHtml(b)
    return
  }
  // Đơn chọn thanh toán tại sân
  if (isAtVenue(b)) {
    currentScreen = 'at_venue'
    el.innerHTML = atVenueHtml(b)
    document.getElementById('payAgain')?.addEventListener('click', () => {
      savePayment(b.id, { paymentStatus: 'pending', paymentMethod: '' })
      render()
    })
    return
  }
  // Đơn khách chọn "Để thanh toán sau"
  if (isPayLater(b)) {
    currentScreen = 'pay_later'
    el.innerHTML = payLaterHtml(b)
    document.getElementById('payNowLater')?.addEventListener('click', () => {
      savePayment(b.id, { paymentStatus: 'pending', paymentMethod: '' })
      render()
    })
    return
  }

  // Vẽ lại form: bỏ chọn phương thức cũ để nút Thanh toán không giữ trạng thái
  // từ màn hình trước (vd: khách chọn "Thanh toán sau" rồi quay lại chọn khác).
  selectedMethod = null
  currentScreen = 'select'
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
      const qr = method.id === 'cash' || method.id === 'later' ? '' : qrBox(method, b.total)
      detail.innerHTML = `
        <p class="pay-detail-note"><i class="fa-solid fa-circle-info"></i> ${esc(method.note)}</p>
        ${qr}
      `
    }
    // Hai lựa chọn giữ đơn (tại quầy / thanh toán sau) đổi nhãn nút chính cho đúng.
    const payNow = document.getElementById('payNow')
    if (payNow) {
      payNow.innerHTML =
        method.id === 'later' || method.id === 'cash'
          ? `<i class="fa-solid fa-lock"></i> ${esc(method.cta)}`
          : `<i class="fa-solid fa-lock"></i> Thanh toán ${money(b.total)}`
    }
  })

  // Nút phụ "Để thanh toán sau": ghi trạng thái pay_later rồi chuyển màn xác nhận.
  // (Nhánh origin/AI từng gắn thêm 1 listener nữa cho nút này -> 2 handler chạy song
  // song làm màn hình bị ghi đè, đã gộp về một nơi duy nhất.)
  document.getElementById('payLater')?.addEventListener('click', () => {
    confirmPayment(b, methodById('later'))
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
}

/** Xác nhận thanh toán: hiện màn xử lý rồi ghi trạng thái cho đơn. */
function confirmPayment(b, method) {
  if (!method) return
  const el = root()
  el.innerHTML = `
    <section class="pay-card pay-loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <b>${method.id === 'later' ? 'Đang giữ đơn cho bạn...' : 'Đang xác nhận giao dịch...'}</b>
      <span>${esc(method.name)} · ${money(b.total)}</span>
    </section>`

  setTimeout(() => {
    const stamp = new Date().toLocaleString('vi-VN')
    if (method.id === 'later') {
      // Thanh toán sau: giữ đơn, khách trả tiền ở trang Tài khoản hoặc tại quầy
      savePayment(b.id, {
        paymentStatus: 'pay_later',
        paymentMethod: 'pay_later',
        paid: false,
        paidAt: '',
      })
    } else if (method.id === 'cash') {
      // Thanh toán tại sân: giữ đơn, chờ thu tiền tại quầy
      savePayment(b.id, {
        paymentStatus: 'unpaid',
        paymentMethod: 'at_court',
        paid: false,
        paidAt: ''
      })
    } else if (method.id === 'bank') {
      // Chuyển khoản ngân hàng: chờ Admin xác nhận đã nhận tiền
      savePayment(b.id, {
        paymentStatus: 'awaiting_payment',
        paymentMethod: 'bank_transfer',
        paid: false,
        paidAt: ''
      })
    } else {
      // Ví điện tử (momo/zalopay/vnpay): không có API xác minh thực tế,
      // lưu thành awaiting_payment để Admin xác nhận thủ công.
      savePayment(b.id, {
        paymentStatus: 'awaiting_payment',
        paymentMethod: 'bank_transfer',
        paid: false,
        paidAt: ''
      })
    }
    render()
  }, 1300)
}

// ================================ CẬP NHẬT KHI ADMIN XÁC NHẬN ================================

/**
 * Admin bấm "Xác nhận thu tiền" ở tab quản trị thì đơn chuyển sang Đã thanh toán
 * và store báo cho các tab đang mở (SV.on). Trang đang đứng ở màn "Chờ xác nhận
 * thanh toán" phải tự đổi sang màn thành công, nếu không khách sẽ mãi thấy dòng
 * "Admin sẽ xác nhận trong thời gian sớm nhất" cho tới khi tự bấm F5.
 */
function watchPayment() {
  if (!SV || typeof SV.on !== 'function') return
  SV.on((key, origin) => {
    // Chỉ nghe thay đổi từ tab khác; ghi ở tab này đã tự render() rồi.
    if (key !== 'bookings' || origin !== 'storage') return
    // Đang ở màn hình đang chọn phương thức thì giữ nguyên lựa chọn của khách.
    if (currentScreen === 'paid' || currentScreen === 'missing' || currentScreen === 'select') return
    const fresh = currentId ? SV.booking(currentId) : null
    if (fresh && isPaid(fresh)) render()
  })
}

// ================================ KHỞI TẠO ================================

document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year')
  if (year) year.textContent = String(new Date().getFullYear())
  // Đã đăng nhập rồi thì header không còn hiện "Đăng nhập/Đăng ký".
  syncAuthNav({ accountUrl: ACCOUNT_URL })
  render()
  watchPayment()
})
