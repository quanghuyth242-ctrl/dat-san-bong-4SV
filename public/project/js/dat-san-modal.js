/**
 * Form đặt sân DÙNG CHUNG cho trang chủ (index.html), trang đặt sân
 * (project/pages/danh-sach-san.html) và trang chi tiết (src/chi-tiet.html).
 *
 * Nạp sau store.js, trước script trang:
 *   <script src="/project/js/dat-san-modal.js"></script>
 *
 * API:
 *   DatSanModal.open(venue, {
 *     services: { 'nuoc-suoi': 2 },   // dịch vụ điền sẵn
 *     date: 'YYYY-MM-DD', hour: 18, duration: 1.5,
 *     repeat: 'weekly', repeatCount: 8,   // repeatCount = số tuần/tháng/năm
 *     days: [1, 5],                       // thứ (0..6) hoặc ngày (1..31) lặp
 *     hours: [18, 20],                    // nhiều khung giờ cùng lúc
 *     payUrl: (id) => '/src/thanh-toan.html?ma=' + id,
 *     onClose: fn, onSuccess: fn,
 *   })
 *   DatSanModal.close() / DatSanModal.isOpen() / DatSanModal.SERVICES
 *
 * Form tự nạp CSS (class .bk-*) nên giống hệt nhau trên cả 3 trang, kể cả
 * trang danh sách vốn chỉ có san-bong.css. Đặt xong phát sự kiện
 * "dat-san:success" để trang nghe và render lại danh sách.
 */
;(function (global) {
  'use strict'

  var DEFAULT_OPEN = 6
  var DEFAULT_CLOSE = 22
  var PITCH_TYPE_LABEL = { 5: 'Sân 5', 7: 'Sân 7', 11: 'Sân 11' }
  var PAY_PAGE = '/src/thanh-toan.html'

  // Dịch vụ đi kèm khi đặt sân (giá mỗi buổi) — danh sách gốc của cả hệ thống.
  var SERVICES = [
    { id: 'nuoc-suoi', name: 'Nước suối', price: 10000, unit: 'chai', icon: 'fa-bottle-water' },
    { id: 'nuoc-tang-luc', name: 'Nước tăng lực', price: 15000, unit: 'chai', icon: 'fa-bolt' },
    { id: 'thue-bong', name: 'Thuê bóng thi đấu', price: 50000, unit: 'quả', icon: 'fa-futbol' },
    { id: 'ao-bib', name: 'Áo bib', price: 20000, unit: 'bộ', icon: 'fa-shirt' },
    { id: 'trong-tai', name: 'Trọng tài', price: 200000, unit: 'trận', icon: 'fa-user-tie', max: 1 },
    { id: 'var', name: 'VAR (trợ lý video)', price: 300000, unit: 'trận', icon: 'fa-video', max: 1 },
  ]

  var REPEAT_LABEL = { none: 'Không lặp lại', weekly: 'Hàng tuần', monthly: 'Hàng tháng', quarterly: 'Hàng quý', yearly: 'Hàng năm' }

  // Kiểu đặt định kỳ người dùng được chọn trên form (quý đã bỏ).
  var REPEAT_TYPES = ['none', 'weekly', 'monthly', 'yearly']

  var state = { venue: null, duration: 1, services: {}, opts: null, ready: false, repeatDays: [], hours: [], daysCustom: false }
  var payTimer = null

  // ---------------------------- TIỆN ÍCH ----------------------------

  function $(id) {
    return document.getElementById(id)
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(
      /[&<>"']/g,
      function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      },
    )
  }

  function toHour(value, fallback) {
    var n = typeof value === 'number' ? value : parseFloat(String(value == null ? '' : value).replace(',', '.'))
    return isFinite(n) && n >= 0 && n <= 24 ? n : fallback
  }

  /** "300k" / 300000 / "1.2tr" -> số đồng. Cùng khuôn với trang chủ. */
  function toPriceNumber(value) {
    if (typeof value === 'number') return isFinite(value) ? Math.round(value) : 0
    var s = String(value == null ? '' : value).trim().toLowerCase().replace(/\s/g, '')
    if (!s) return 0
    var hasTr = /tr/.test(s)
    var hasK = !hasTr && /k/.test(s)
    var digits = s.replace(/[^\d.,]/g, '')
    if (hasTr || hasK) {
      var sep = Math.max(digits.lastIndexOf('.'), digits.lastIndexOf(','))
      var head = sep >= 0 ? digits.slice(0, sep).replace(/[.,]/g, '') : digits
      var tail = sep >= 0 ? digits.slice(sep + 1) : ''
      digits = tail ? head + '.' + tail : head
    } else {
      digits = digits.replace(/[.,]/g, '')
    }
    var n = parseFloat(digits)
    if (!isFinite(n)) return 0
    return Math.round(n * (hasTr ? 1e6 : hasK ? 1e3 : 1))
  }

  function formatPriceShort(price) {
    var n = toPriceNumber(price)
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1).replace('.', ',') + 'tr'
    if (n >= 1000) return Math.round(n / 1000) + 'k'
    return n.toLocaleString('vi-VN') + 'đ'
  }

  function formatPriceFull(price) {
    return toPriceNumber(price).toLocaleString('vi-VN') + 'đ'
  }

  function pitchNumber(value) {
    if (global.SV && typeof SV.pitchNumber === 'function') return String(SV.pitchNumber(value) || '7')
    var match = String(value == null ? '' : value).match(/\d+/)
    var n = match && match[0]
    return n === '5' || n === '11' ? n : '7'
  }

  function typeLabel(type) {
    return PITCH_TYPE_LABEL[type] || 'Sân 7'
  }

  function timeLabel(h) {
    var hh = Math.floor(h)
    var mm = Math.round((h - hh) * 60)
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')
  }

  function todayStr() {
    var d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }

  /**
   * Khung giờ đã qua giờ đặt chưa.
   * - Khung thường: quá ngay khi đã qua giờ BẮT ĐẦU.
   * - Khung cuối trong ngày (kết thúc đúng giờ đóng cửa): vẫn đặt được cho tới tận giờ đóng cửa.
   */
  function isPastSlot(date, hour, endHour, closeHour) {
    if (date !== todayStr() || hour == null) return false
    var now = new Date()
    var nowH = now.getHours() + now.getMinutes() / 60
    if (isFinite(endHour) && isFinite(closeHour) && endHour >= closeHour) {
      return nowH >= closeHour
    }
    return hour < nowH
  }

  function isSlotTaken(venueId, date, startHour, duration) {
    return !!(global.SV && SV.isSlotTaken && SV.isSlotTaken(venueId, date, startHour, duration))
  }

  /** Sân lấy từ SV.fields() hoặc object đã chuẩn hoá của trang — đều dùng được. */
  function normalizeVenue(raw) {
    var open = toHour(raw && raw.hours && raw.hours.open, DEFAULT_OPEN)
    var close = toHour(raw && raw.hours && raw.hours.close, DEFAULT_CLOSE)
    var type = pitchNumber(raw && raw.type)
    return {
      id: String((raw && raw.id) || ''),
      name: String((raw && raw.name) || 'Sân chưa đặt tên'),
      type: PITCH_TYPE_LABEL[type] ? type : '7',
      addr: String((raw && (raw.addr || raw.address)) || ''),
      price: toPriceNumber(raw && raw.price),
      hours: { open: open, close: close > open ? close : open + 1 },
      img: String((raw && raw.img) || ''),
    }
  }

  function repeatHelper(name, fallback) {
    if (global.SV && SV.repeat && SV.repeat[name]) return SV.repeat[name]
    return fallback
  }

  function currentRepeat() {
    var v = $('bkRepeat') ? $('bkRepeat').value : 'none'
    return REPEAT_TYPES.indexOf(v) >= 0 ? v : 'none'
  }

  function maxPeriods() {
    var v = repeatHelper('MAX_PERIODS', null)
    return typeof v === 'number' && isFinite(v) ? v : 52
  }

  function maxSessions() {
    var v = repeatHelper('MAX_SESSIONS', null)
    return typeof v === 'number' && isFinite(v) ? v : 100
  }

  function periodLabel(type) {
    var map = repeatHelper('PERIOD_LABEL', null)
    return (map && map[type]) || 'Số buổi'
  }

  function daysLabel(type) {
    var map = repeatHelper('DAYS_LABEL', null)
    return (map && map[type]) || 'Ngày lặp'
  }

  var WEEKDAY_LABEL = { 0: 'Chủ nhật', 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7' }

  function weekdayLabel(v) {
    var week = repeatHelper('WEEK', null)
    if (week) {
      for (var i = 0; i < week.length; i += 1) if (week[i].v === v) return week[i].l
    }
    return WEEKDAY_LABEL[v] || String(v)
  }

  /** Danh sách ô chọn: thứ (0..6) cho hàng tuần, ngày (1..31) cho tháng/quý/năm. */
  function repeatDayOptions(type) {
    if (type === 'weekly') {
      var week = repeatHelper('WEEK', null)
      var base = week || Object.keys(WEEKDAY_LABEL).map(function (k) {
        return { v: Number(k), l: WEEKDAY_LABEL[k] }
      })
      return base.map(function (o) {
        return { v: o.v, l: o.l }
      })
    }
    var out = []
    for (var d = 1; d <= 31; d += 1) out.push({ v: d, l: String(d) })
    return out
  }

  function normalizeRepeatDays(startDate, type, raw) {
    var fn = repeatHelper('normalizeDays', null)
    if (fn) return fn(startDate, type, raw)
    return (raw || []).slice()
  }

  function daysSummary(type, days) {
    var list = (days || []).slice()
    if (type === 'weekly') return list.map(weekdayLabel).join(', ')
    return list
      .sort(function (a, b) {
        return a - b
      })
      .join(', ')
  }

  function repeatDatesOf(startDate, type, opts) {
    var fn = repeatHelper('dates', null)
    if (fn) return fn(startDate, type, opts)
    if (!type || type === 'none') return [startDate]
    return startDate ? [startDate] : []
  }

  function repeatSessionsOf(startDate, type, opts) {
    var fn = repeatHelper('sessions', null)
    if (fn) return fn(startDate, type, opts)
    opts = opts || {}
    var hours = (opts.hours || [])
      .map(Number)
      .filter(function (h) {
        return isFinite(h)
      })
    var out = []
    repeatDatesOf(startDate, type, opts).forEach(function (d) {
      hours.forEach(function (h) {
        out.push({ date: d, hour: h })
      })
    })
    return out
  }

  function repeatCountOf(type, raw) {
    var fn = repeatHelper('countOf', null)
    if (fn) return fn(type, raw)
    if (!type || type === 'none') return 1
    return Math.max(1, Math.min(52, parseInt(raw, 10) || 1))
  }

  function repeatCountOk(type, raw) {
    var fn = repeatHelper('countOk', null)
    if (fn) return fn(type, raw)
    if (!type || type === 'none') return true
    var cnt = parseInt(raw, 10)
    return isFinite(cnt) && cnt >= 1 && cnt <= 52
  }

  function makeSeriesId() {
    var fn = repeatHelper('seriesId', null)
    if (fn) return fn()
    return 'LK' + Date.now().toString(36).toUpperCase()
  }

  function repeatLabel(type) {
    return REPEAT_LABEL[type] || REPEAT_LABEL.none
  }

  // ---------------------------- CSS DÙNG CHO FORM ----------------------------

  var CSS = [
    '.modal-overlay.ds4sv-overlay{position:fixed;inset:0;background:rgba(17,24,39,.55);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;padding:20px;z-index:2000}',
    '.modal-overlay.ds4sv-overlay.open{display:flex}',
    '.ds4sv-overlay .modal{background:#fff;border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.25)}',
    '.ds4sv-overlay .modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #f1f5f9;position:sticky;top:0;background:#fff;border-radius:16px 16px 0 0;z-index:1}',
    '.ds4sv-overlay .modal-head h3{font-size:1.05rem;font-weight:800;color:#0f172a;display:flex;align-items:center;gap:8px;margin:0}',
    '.ds4sv-overlay .modal-head h3 i{color:var(--green-primary,#16a34a)}',
    '.ds4sv-overlay .modal-close{background:none;border:none;font-size:1.1rem;color:#94a3b8;cursor:pointer;padding:4px}',
    '.ds4sv-overlay .modal-close:hover{color:#0f172a}',
    '.ds4sv-overlay .modal-body{padding:20px 22px 24px}',
    '.ds4sv-overlay .bk-info{display:flex;gap:12px;align-items:center;padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid #f1f5f9}',
    '.ds4sv-overlay .bk-info img{width:68px;height:68px;border-radius:12px;object-fit:cover;flex-shrink:0}',
    '.ds4sv-overlay .bk-name{font-weight:800;color:#0f172a;line-height:1.3}',
    '.ds4sv-overlay .bk-sub{font-size:.78rem;color:#64748b;margin-top:4px}',
    '.ds4sv-overlay .bk-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
    '.ds4sv-overlay .bk-field{display:flex;flex-direction:column;gap:6px}',
    '.ds4sv-overlay .bk-field label{font-size:.76rem;font-weight:600;color:#475569}',
    '.ds4sv-overlay .bk-field input,.ds4sv-overlay .bk-field select{border-radius:10px;border:1px solid #e2e8f0;padding:10px 12px;font-size:.86rem;background:#f8fafc;outline:none;color:#1e293b;width:100%}',
    '.ds4sv-overlay .bk-field input:focus,.ds4sv-overlay .bk-field select:focus{border-color:var(--green-primary,#16a34a);box-shadow:0 0 0 3px rgba(22,163,74,.12);background:#fff}',
    '.ds4sv-overlay .bk-err{font-size:.72rem;color:#dc2626;display:none;font-weight:500}',
    '.ds4sv-overlay .bk-field.invalid input,.ds4sv-overlay .bk-field.invalid select{border-color:#dc2626;background:#fef2f2;box-shadow:0 0 0 3px rgba(220,38,38,.12)}',
    '.ds4sv-overlay .bk-field.invalid .bk-err{display:block}',
    '@keyframes ds4svShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}',
    '.ds4sv-overlay .bk-field.shake input,.ds4sv-overlay .bk-field.shake select{animation:ds4svShake .35s ease-in-out}',
    '.ds4sv-overlay .bk-field.full{grid-column:1 / -1}',
    '.ds4sv-overlay .bk-hint{font-weight:500;color:#94a3b8;font-size:.68rem}',
    '.ds4sv-overlay .bk-total{font-weight:800;font-size:1.05rem;color:var(--green-primary,#16a34a);background:#f0fdf4;border-radius:10px;padding:9px 12px}',
    '.ds4sv-overlay .bk-total small{display:block;font-size:.7rem;font-weight:600;color:#64748b;margin-top:2px}',
    '.ds4sv-overlay .bk-slot-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}',
    '.ds4sv-overlay .bk-slot{display:flex;flex-direction:column;align-items:center;gap:2px;border:1.5px solid var(--green-primary,#16a34a);background:#f0fdf4;color:var(--green-dark,#166534);border-radius:10px;padding:7px 12px;font-size:.8rem;font-weight:700;font-family:inherit;line-height:1.25;cursor:pointer;transition:all .15s ease}',
    '.ds4sv-overlay .bk-slot small{font-size:.68rem;font-weight:700;opacity:.75}',
    '.ds4sv-overlay .bk-slot:hover:not(:disabled):not(.is-selected){background:#dcfce7}',
    '.ds4sv-overlay .bk-slot.is-taken{border-color:#fca5a5;background:#fef2f2;color:#b91c1c;cursor:not-allowed}',
    '.ds4sv-overlay .bk-slot.is-past{border-color:#e5e7eb;background:#f9fafb;color:#9ca3af;cursor:not-allowed}',
    '.ds4sv-overlay .bk-slot.is-selected{background:var(--green-primary,#16a34a);border-color:var(--green-primary,#16a34a);color:#fff;box-shadow:0 4px 10px rgba(22,163,74,.3)}',
    '.ds4sv-overlay .bk-slot.is-selected small{opacity:.9}',
    '.ds4sv-overlay .bk-slot:disabled{cursor:not-allowed}',
    '.ds4sv-overlay .bk-slot-empty{display:inline-flex;align-items:center;gap:7px;font-size:.84rem;color:#64748b}',
    '.ds4sv-overlay .bk-chip-group{display:flex;flex-wrap:wrap;gap:7px}',
    '.ds4sv-overlay .bk-chip{min-width:36px;text-align:center;border:1.5px solid var(--green-primary,#16a34a);background:#fff;color:var(--green-dark,#166534);border-radius:999px;padding:7px 12px;font-size:.78rem;font-weight:700;font-family:inherit;line-height:1.2;cursor:pointer;transition:all .15s ease}',
    '.ds4sv-overlay .bk-chip:hover{background:#dcfce7}',
    '.ds4sv-overlay .bk-chip.is-selected{background:var(--green-primary,#16a34a);border-color:var(--green-primary,#16a34a);color:#fff;box-shadow:0 3px 8px rgba(22,163,74,.28)}',
    '.ds4sv-overlay .bk-field.shake .bk-chip-group{animation:ds4svShake .35s ease-in-out}',
    '.ds4sv-overlay .service-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.ds4sv-overlay .service-item{display:flex;align-items:center;gap:10px;border:1.5px solid #e2e8f0;border-radius:10px;padding:9px 10px;background:#fff;transition:border-color .15s,background .15s}',
    '.ds4sv-overlay .service-item.active{border-color:var(--green-primary,#16a34a);background:#f0fdf4}',
    '.ds4sv-overlay .service-item .svc-icon{color:var(--green-primary,#16a34a);font-size:16px;width:18px;text-align:center}',
    '.ds4sv-overlay .service-item .svc-info{flex:1;min-width:0}',
    '.ds4sv-overlay .service-item .svc-name{font-size:.8rem;font-weight:700;color:#0f172a}',
    '.ds4sv-overlay .service-item .svc-price{font-size:.72rem;color:#64748b}',
    '.ds4sv-overlay .service-item .s-qty{display:flex;align-items:center;gap:6px}',
    '.ds4sv-overlay .qty-btn{width:26px;height:26px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:#166534;font-size:16px;font-weight:800;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}',
    '.ds4sv-overlay .qty-btn:hover{border-color:var(--green-primary,#16a34a);background:#f0fdf4}',
    '.ds4sv-overlay .qty-btn:disabled{opacity:.35;cursor:not-allowed}',
    '.ds4sv-overlay .qty-check{width:30px;height:30px;border-radius:9px;border:1.5px solid #e2e8f0;background:#fff;color:transparent;font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}',
    '.ds4sv-overlay .qty-check:hover{border-color:var(--green-primary,#16a34a)}',
    ".ds4sv-overlay .qty-check[aria-pressed='true']{border-color:var(--green-primary,#16a34a);background:var(--green-primary,#16a34a);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12)}",
    '.ds4sv-overlay .qty-val{min-width:18px;text-align:center;font-weight:700;font-size:.86rem}',
    '.ds4sv-overlay .btn-book{margin-top:12px;width:100%;background:#0f172a;color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;font-size:.84rem;transition:.18s;text-align:center;display:block;cursor:pointer;font-family:inherit}',
    '.ds4sv-overlay .btn-book:hover{background:var(--green-primary,#16a34a)}',
    '.ds4sv-overlay .btn-book:disabled{opacity:.7;cursor:not-allowed;pointer-events:none}',
    '.ds4sv-overlay .btn-book:active{transform:scale(.98)}',
    '.ds4sv-overlay .btn-book-full{margin-top:18px}',
    '.ds4sv-overlay .btn-book-ghost{background:#fff;color:#334155;border:1px solid #e2e8f0}',
    '.ds4sv-overlay .btn-book-ghost:hover{background:#f1f5f9;color:#0f172a}',
    '.ds4sv-overlay .bk-success{text-align:center;padding:8px 0}',
    '.ds4sv-overlay .bk-success-icon{width:58px;height:58px;border-radius:50%;background:#f0fdf4;color:#166534;display:inline-flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:14px}',
    '.ds4sv-overlay .bk-success h3{font-size:1.1rem;font-weight:800;color:#0f172a;margin:0 0 6px}',
    '.ds4sv-overlay .bk-success p{color:#64748b;font-size:.86rem;margin:0 0 18px}',
    '.ds4sv-overlay .bk-summary{text-align:left;border:1px solid #f1f5f9;border-radius:12px;padding:6px 14px;margin:0}',
    '.ds4sv-overlay .bk-summary>div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:.84rem}',
    '.ds4sv-overlay .bk-summary>div:last-child{border-bottom:none}',
    '.ds4sv-overlay .bk-summary dt{color:#64748b;margin:0}',
    '.ds4sv-overlay .bk-summary dd{font-weight:700;color:#0f172a;margin:0;text-align:right}',
    '.ds4sv-overlay .bk-success-actions{display:grid;gap:10px}',
    '.toast-4sv{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#0f172a;color:#fff;padding:12px 22px;border-radius:12px;font-size:.86rem;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.3);opacity:0;pointer-events:none;transition:.25s ease;z-index:10000;text-align:center;max-width:90vw}',
    '.toast-4sv.show{opacity:1;transform:translateX(-50%) translateY(0)}',
    '.toast-4sv.toast-error{background:#dc2626;box-shadow:0 10px 30px rgba(220,38,38,.45)}',
    '@media (max-width: 480px){.ds4sv-overlay .service-list{grid-template-columns:1fr}}',
  ].join('')

  function injectCss() {
    if (document.getElementById('dat-san-modal-style')) return
    var style = document.createElement('style')
    style.id = 'dat-san-modal-style'
    style.textContent = CSS
    document.head.appendChild(style)
  }

  /** Trang nào thiếu sẵn markup modal thì tự tạo — không phụ thuộc HTML của trang. */
  function ensureModal() {
    if ($('bookModal')) return $('bookModal')
    var ov = document.createElement('div')
    ov.className = 'modal-overlay ds4sv-overlay'
    ov.id = 'bookModal'
    ov.setAttribute('role', 'dialog')
    ov.setAttribute('aria-modal', 'true')
    ov.setAttribute('aria-label', 'Đặt sân')
    ov.innerHTML =
      '<div class="modal"><div class="modal-head">' +
      '<h3><i class="fa-solid fa-calendar-check"></i> Đặt sân</h3>' +
      '<button type="button" class="modal-close" aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button>' +
      '</div><div class="modal-body" id="bookBody"></div></div>'
    document.body.appendChild(ov)
    return ov
  }

  // ---------------------------- TOAST ----------------------------

  function toast(msg, type) {
    var t = document.createElement('div')
    t.className = 'toast-4sv' + (type === 'error' ? ' toast-error' : '')
    t.textContent = msg
    document.body.appendChild(t)
    requestAnimationFrame(function () {
      t.classList.add('show')
    })
    setTimeout(function () {
      t.classList.remove('show')
      setTimeout(function () {
        t.remove()
      }, 250)
    }, type === 'error' ? 4000 : 2500)
  }

  function shakeField(fieldId) {
    var el = $(fieldId)
    if (!el) return
    el.classList.remove('shake')
    void el.offsetWidth
    el.classList.add('shake')
  }

  // ---------------------------- MỞ / ĐÓNG ----------------------------

  function isOpen() {
    var m = $('bookModal')
    return !!(m && m.classList.contains('open'))
  }

  function close() {
    if (payTimer) {
      clearTimeout(payTimer)
      payTimer = null
    }
    var m = $('bookModal')
    if (m) m.classList.remove('open')
    document.body.style.overflow = ''
    var cb = state.opts && state.opts.onClose
    state.venue = null
    state.opts = null
    if (typeof cb === 'function') cb()
  }

  function openModal() {
    var m = ensureModal()
    m.classList.add('open')
    document.body.style.overflow = 'hidden'
    var first = m.querySelector('input, select, button')
    if (first) first.focus()
  }

  // ---------------------------- DỊCH VỤ ----------------------------

  function serviceCostPerSession() {
    return SERVICES.reduce(function (sum, s) {
      return sum + s.price * (state.services[s.id] || 0)
    }, 0)
  }

  function pickedServices() {
    return SERVICES.filter(function (s) {
      return (state.services[s.id] || 0) > 0
    }).map(function (s) {
      return { id: s.id, name: s.name, price: s.price, unit: s.unit, qty: state.services[s.id] }
    })
  }

  function serviceItemsHtml(bag) {
    return SERVICES.map(function (s) {
      var q = bag[s.id] || 0
      var max = s.max || 99
      return (
        '<div class="service-item' + (q > 0 ? ' active' : '') + '" data-id="' + s.id + '">' +
        '<i class="fa-solid ' + s.icon + ' svc-icon"></i>' +
        '<div class="svc-info">' +
        '<div class="svc-name">' + esc(s.name) + '</div>' +
        '<div class="svc-price">' + s.price.toLocaleString('vi-VN') + 'đ / ' + esc(s.unit) + '</div>' +
        '</div>' +
        '<div class="s-qty">' +
        (s.max === 1
          ? '<button type="button" class="qty-check" data-act="toggle" data-id="' + s.id + '" aria-pressed="' + (q > 0) + '" aria-label="Chọn ' + esc(s.name) + '"><i class="fa-solid fa-check"></i></button>'
          : '<button type="button" class="qty-btn" data-act="dec" data-id="' + s.id + '" aria-label="Giảm">−</button>' +
            '<span class="qty-val" id="qty-' + s.id + '">' + q + '</span>' +
            '<button type="button" class="qty-btn" data-act="inc" data-id="' + s.id + '"' + (q >= max ? ' disabled' : '') + ' aria-label="Tăng">+</button>') +
        '</div></div>'
      )
    }).join('')
  }

  // ---------------------------- LƯỚI KHUNG GIỜ ----------------------------

  /** Ngày lặp theo cấu hình hiện tại: định kỳ thì nhiều ngày, không thì đúng ngày chọn. */
  function repeatDatesList() {
    var date = $('bkDate') ? $('bkDate').value : ''
    if (!date) return []
    var repeat = currentRepeat()
    if (repeat === 'none') return [date]
    var periods = repeatCountOf(repeat, $('bkRepeatCount') ? $('bkRepeatCount').value : '1')
    return repeatDatesOf(date, repeat, { days: state.repeatDays, count: periods })
  }

  /**
   * Trạng thái từng khung giờ trên TẤT CẢ ngày lặp: giờ còn trống ít nhất một
   * ngày vẫn chọn được (buổi trùng lịch sẽ tự bỏ qua khi đặt).
   */
  function slotAvailability(duration) {
    var v = state.venue
    var dates = repeatDatesList()
    var map = {}
    if (!v || !dates.length) return { dates: dates, map: map }
    for (var h = v.hours.open; h < v.hours.close; h += 1) {
      if (h + duration > v.hours.close) continue
      var free = 0
      var taken = 0
      var past = 0
      for (var i = 0; i < dates.length; i += 1) {
        if (isPastSlot(dates[i], h, h + duration, v.hours.close)) past += 1
        else if (isSlotTaken(v.id, dates[i], h, duration)) taken += 1
        else free += 1
      }
      map[h] = { free: free, taken: taken, past: past, total: dates.length }
    }
    return { dates: dates, map: map }
  }

  function renderTimeSlots(availability) {
    var grid = $('bkTimeSlotGrid')
    var sel = $('bkTime')
    if (!grid || !sel) return
    var v = state.venue
    var duration = state.duration
    var av = availability || slotAvailability(duration)
    if (!av.dates.length || !v) {
      grid.innerHTML = ''
      return
    }
    var html = ''
    for (var h = v.hours.open; h < v.hours.close; h++) {
      var a = av.map[h]
      if (!a) continue
      var selected = state.hours.indexOf(h) >= 0
      var cls = selected ? ' is-selected' : a.free === 0 ? (a.past >= a.total ? ' is-past' : ' is-taken') : ''
      var sub = selected
        ? 'Đã chọn'
        : a.free === 0
          ? a.past >= a.total
            ? 'Đã quá giờ đặt'
            : 'Đã có người đặt'
          : a.total > 1
            ? 'Trống ' + a.free + '/' + a.total + ' buổi'
            : 'Còn trống'
      html +=
        '<button type="button" class="bk-slot' + cls + '" data-hour="' + h + '"' +
        (!selected && a.free === 0 ? ' disabled' : '') +
        '>' + timeLabel(h) + ' – ' + timeLabel(h + duration) + '<small>' + sub + '</small></button>'
    }
    grid.innerHTML =
      html || '<span class="bk-slot-empty"><i class="fa-solid fa-calendar-xmark"></i> Không còn khung giờ trống trong ngày</span>'
  }

  function refreshTimeOptions() {
    var sel = $('bkTime')
    if (!sel) return
    var av = slotAvailability(state.duration)
    if (!av.dates.length) {
      sel.innerHTML = '<option value="">-- Chọn ngày trước --</option>'
      sel.value = ''
      renderTimeSlots()
      return
    }
    var options = ''
    Object.keys(av.map)
      .map(Number)
      .sort(function (a, b) {
        return a - b
      })
      .forEach(function (h) {
        if (av.map[h].free <= 0) return
        options += '<option value="' + h + '">' + timeLabel(h) + ' – ' + timeLabel(h + state.duration) + '</option>'
      })
    sel.innerHTML = options || '<option value="">-- Đã kín lịch --</option>'
    var keep = ''
    for (var i = 0; i < state.hours.length && !keep; i += 1) {
      var want = String(state.hours[i])
      if (
        [].some.call(sel.options, function (o) {
          return o.value === want
        })
      ) {
        keep = want
      }
    }
    if (keep) sel.value = keep
    else if (state.hours.length) sel.value = ''
    else if (sel.options.length) sel.selectedIndex = 0
    renderTimeSlots(av)
  }

  // ---------------------------- TỔNG TIỀN ----------------------------

  function syncRepeatUI() {
    var repeat = currentRepeat()
    var isNone = repeat === 'none'
    var fCount = $('f-repeatCount')
    var fDays = $('f-repeatDays')
    if (fCount) fCount.style.display = isNone ? 'none' : ''
    if (fDays) fDays.style.display = isNone ? 'none' : ''
    var cLabel = $('repeatCountLabel')
    if (cLabel) cLabel.textContent = isNone ? 'Số buổi' : periodLabel(repeat)
    var dLabel = $('repeatDaysLabel')
    if (dLabel) dLabel.textContent = daysLabel(repeat)
    var cErr = fCount && fCount.querySelector('.bk-err')
    if (cErr && !isNone) cErr.textContent = periodLabel(repeat) + ' phải từ 1 đến ' + maxPeriods() + '.'
    var dErr = fDays && fDays.querySelector('.bk-err')
    if (dErr && !isNone) {
      dErr.textContent = 'Vui lòng chọn ít nhất một ' + (repeat === 'weekly' ? 'thứ' : 'ngày') + '.'
    }
    var tErr = $('f-time') && $('f-time').querySelector('.bk-err')
    if (tErr) {
      tErr.textContent = isNone
        ? 'Khung giờ này không còn trống hoặc nằm ngoài giờ mở cửa.'
        : 'Vui lòng chọn ít nhất một khung giờ trong giờ hoạt động của sân.'
    }
    var tHint = $('bkTimeHint')
    if (tHint) tHint.style.display = isNone ? 'none' : ''
    return repeat
  }

  /** Vẽ nhóm ô chọn thứ / ngày lặp theo kiểu đặt định kỳ hiện tại. */
  function renderRepeatDays() {
    var grid = $('repeatDaysGrid')
    if (!grid) return
    var repeat = currentRepeat()
    if (repeat === 'none') {
      grid.innerHTML = ''
      return
    }
    grid.innerHTML = repeatDayOptions(repeat)
      .map(function (o) {
        var on = state.repeatDays.indexOf(o.v) >= 0
        return (
          '<button type="button" class="bk-chip' + (on ? ' is-selected' : '') + '" data-day="' + o.v +
          '" aria-pressed="' + on + '">' + esc(o.l) + '</button>'
        )
      })
      .join('')
  }

  /** Chọn sẵn ngày lặp theo ngày bắt đầu (chưa tay người dùng sửa). */
  function seedRepeatDays() {
    var repeat = currentRepeat()
    if (repeat === 'none') return
    var date = $('bkDate') ? $('bkDate').value : ''
    state.repeatDays = date ? normalizeRepeatDays(date, repeat, []) : []
    state.daysCustom = false
    renderRepeatDays()
  }

  /** Số buổi dùng để hiển thị tổng tiền (chưa chọn giờ vẫn tạm tính 1 giờ). */
  function plannedCount() {
    var repeat = currentRepeat()
    if (repeat === 'none') return 1
    var date = $('bkDate') ? $('bkDate').value : ''
    if (!date) return 1
    var periods = repeatCountOf(repeat, $('bkRepeatCount') ? $('bkRepeatCount').value : '1')
    var dates = repeatDatesOf(date, repeat, { days: state.repeatDays, count: periods })
    return dates.length * Math.max(1, state.hours.length)
  }

  /** Lỗi hiển thị cho ô số lần lặp / tổng số buổi. */
  function countErrorText(repeat, periodsValid, count) {
    if (!periodsValid) return periodLabel(repeat) + ' phải từ 1 đến ' + maxPeriods() + '.'
    return 'Tổng số buổi tối đa ' + maxSessions() + ' buổi (số ngày × khung giờ; hiện tại ' + count + ').'
  }

  function updateTotal() {
    var repeat = syncRepeatUI()
    state.duration = parseFloat($('bkDuration') ? $('bkDuration').value : 1) || 1
    var courtSub = Math.round((Number(state.venue.price) || 0) * state.duration)
    var servicePer = serviceCostPerSession()
    var subtotal = courtSub + servicePer

    var code = ($('bkVoucher') && $('bkVoucher').value ? $('bkVoucher').value : '').trim().toUpperCase()
    var voucher = code && global.SV && SV.previewVoucher ? SV.previewVoucher(code, subtotal) : null
    var usable = !!(voucher && voucher.ok)
    var fv = $('f-voucher')
    if (fv) fv.classList.toggle('invalid', !!code && !usable)

    var count = plannedCount()
    var total = (usable ? subtotal - voucher.discount : subtotal) * count
    var parts = []
    if (servicePer > 0) parts.push('sân ' + courtSub.toLocaleString('vi-VN') + 'đ + DV ' + servicePer.toLocaleString('vi-VN') + 'đ')
    if (usable) parts.push('-' + voucher.discount.toLocaleString('vi-VN') + 'đ')
    if (count > 1) parts.push(count + ' buổi')

    var el = $('bkTotal')
    if (el) {
      el.innerHTML = parts.length
        ? total.toLocaleString('vi-VN') + 'đ <small style="opacity:.75">(' + parts.join(' · ') + ')</small>'
        : total.toLocaleString('vi-VN') + 'đ'
    }
    var hint = $('repeatCountHint')
    if (hint) hint.textContent = repeat === 'none' || count <= 1 ? '' : 'Tổng ' + count + ' buổi'

    var fCount = $('f-repeatCount')
    if (fCount) {
      var periodsRaw = $('bkRepeatCount') ? $('bkRepeatCount').value : '1'
      var periodsValid = repeatCountOk(repeat, periodsRaw)
      var bad = repeat !== 'none' && (!periodsValid || count > maxSessions())
      fCount.classList.toggle('invalid', bad)
      var cErr = fCount.querySelector('.bk-err')
      if (cErr && repeat !== 'none') cErr.textContent = countErrorText(repeat, periodsValid, count)
    }

    refreshTimeOptions()
  }

  // ---------------------------- FORM ----------------------------

  function formHtml(venue) {
    var user = global.SV && SV.currentUser ? SV.currentUser() : null
    var defaultName = user ? user.name || '' : ''
    var defaultPhone = user ? user.phone || '' : ''
    return (
      '<div class="bk-info">' +
      '<img src="' + esc(venue.img) + '" alt="' + esc(venue.name) + '" onerror="this.style.display=\'none\'" />' +
      '<div>' +
      '<div class="bk-name">' + esc(venue.name) + '</div>' +
      '<div class="bk-sub">' + esc(typeLabel(venue.type)) + ' · ' + esc(formatPriceShort(venue.price)) + '/tiếng · ' +
      timeLabel(venue.hours.open) + ' – ' + timeLabel(venue.hours.close) + '</div>' +
      '</div></div>' +
      '<form id="bookForm" novalidate>' +
      '<div class="bk-grid">' +
      '<div class="bk-field" id="f-date">' +
      '<label for="bkDate">Ngày <span style="color:#dc2626">*</span></label>' +
      '<input type="date" id="bkDate" required />' +
      '<span class="bk-err">Vui lòng chọn ngày không ở quá khứ.</span>' +
      '</div>' +
      '<div class="bk-field" id="f-duration">' +
      '<label for="bkDuration">Thời lượng</label>' +
      '<select id="bkDuration">' +
      '<option value="1">1 giờ</option><option value="1.5">1,5 giờ</option>' +
      '<option value="2">2 giờ</option><option value="3">3 giờ</option>' +
      '</select></div>' +
      '<div class="bk-field" id="f-repeat">' +
      '<label for="bkRepeat">Đặt định kỳ</label>' +
      '<select id="bkRepeat">' +
      REPEAT_TYPES.map(function (value) {
        return '<option value="' + value + '">' + esc(repeatLabel(value)) + '</option>'
      }).join('') +
      '</select></div>' +
      '<div class="bk-field" id="f-repeatCount" style="display:none">' +
      '<label for="bkRepeatCount"><span id="repeatCountLabel">Số buổi</span></label>' +
      '<input type="number" id="bkRepeatCount" min="1" max="52" value="1" />' +
      '<span class="bk-hint" id="repeatCountHint"></span>' +
      '<span class="bk-err">Số buổi phải từ 1 đến 52.</span>' +
      '</div>' +
      '<div class="bk-field full" id="f-repeatDays" style="display:none">' +
      '<label id="repeatDaysLabel">Thứ trong tuần</label>' +
      '<div class="bk-chip-group" id="repeatDaysGrid"></div>' +
      '<span class="bk-err">Vui lòng chọn ít nhất một ngày lặp.</span>' +
      '</div>' +
      '<div class="bk-field full" id="f-time">' +
      '<label for="bkTime">Khung giờ <span style="color:#dc2626">*</span></label>' +
      '<select id="bkTime" required style="display: none;"></select>' +
      '<div class="bk-slot-grid" id="bkTimeSlotGrid"></div>' +
      '<span class="bk-hint" id="bkTimeHint" style="display:none">Chọn được nhiều khung giờ · buổi trùng lịch hoặc đã qua giờ sẽ tự bỏ qua.</span>' +
      '<span class="bk-err">Khung giờ này không còn trống hoặc nằm ngoài giờ mở cửa.</span>' +
      '</div>' +
      '<div class="bk-field" id="f-name">' +
      '<label for="bkName">Họ tên <span style="color:#dc2626">*</span></label>' +
      '<input type="text" id="bkName" placeholder="VD: Nguyễn Văn A" autocomplete="name" value="' + esc(defaultName) + '" required />' +
      '<span class="bk-err">Vui lòng nhập họ tên (tối thiểu 2 ký tự).</span>' +
      '</div>' +
      '<div class="bk-field" id="f-phone">' +
      '<label for="bkPhone">Số điện thoại <span style="color:#dc2626">*</span></label>' +
      '<input type="tel" id="bkPhone" placeholder="VD: 0912345678" autocomplete="tel" value="' + esc(defaultPhone) + '" required />' +
      '<span class="bk-err">Số điện thoại không hợp lệ (VD: 0912345678).</span>' +
      '</div>' +
      '<div class="bk-field full" id="f-services">' +
      '<label>Dịch vụ đi kèm <span class="bk-hint">(tuỳ chọn · ✓ chọn 1 · +/− chọn số lượng)</span></label>' +
      '<div class="service-list" id="serviceList">' + serviceItemsHtml(state.services) + '</div>' +
      '</div>' +
      '<div class="bk-field" id="f-voucher">' +
      '<label for="bkVoucher">Mã giảm giá (nếu có)</label>' +
      '<input type="text" id="bkVoucher" placeholder="VD: WELCOME4SV" autocomplete="off" />' +
      '<span class="bk-err">Mã giảm giá không dùng được với đơn này.</span>' +
      '</div>' +
      '<div class="bk-field" id="f-total">' +
      '<label>Tổng tiền</label><div class="bk-total" id="bkTotal">0đ</div>' +
      '</div></div>' +
      '<button type="submit" class="btn-book btn-book-full" id="btnConfirmBook"><i class="fa-solid fa-check-circle"></i> Xác nhận đặt sân</button>' +
      '</form>'
    )
  }

  // ---------------------------- SUBMIT ----------------------------

  function submitBooking() {
    var venue = state.venue
    var set = function (name, ok) {
      var el = $('f-' + name)
      if (el) el.classList.toggle('invalid', !ok)
    }

    var date = $('bkDate') ? $('bkDate').value : ''
    var duration = state.duration
    var name = $('bkName') ? $('bkName').value.trim() : ''
    var phone = $('bkPhone') ? $('bkPhone').value.trim().replace(/[\s.-]/g, '') : ''
    var repeat = currentRepeat()
    var repeatRaw = $('bkRepeatCount') ? $('bkRepeatCount').value : '1'
    var periodsOk = repeatCountOk(repeat, repeatRaw)
    var periods = repeatCountOf(repeat, repeatRaw)
    var hours = state.hours.slice()
    var dates = date ? repeatDatesOf(date, repeat, { days: state.repeatDays, count: periods }) : []
    var sessions = date ? repeatSessionsOf(date, repeat, { days: state.repeatDays, hours: hours, count: periods }) : []
    var count = repeat === 'none' ? 1 : dates.length * Math.max(1, hours.length)

    var dateOk = !!date && date >= todayStr()
    var hoursOk =
      hours.length > 0 &&
      hours.every(function (h) {
        return h >= venue.hours.open && h + duration <= venue.hours.close
      })
    var timeOk = dateOk && hoursOk
    if (timeOk && repeat === 'none') {
      timeOk =
        !isPastSlot(date, hours[0], hours[0] + duration, venue.hours.close) &&
        !isSlotTaken(venue.id, date, hours[0], duration)
    }
    var nameOk = name.length >= 2
    var phoneOk = /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone)
    var daysOk = repeat === 'none' || state.repeatDays.length > 0
    var countOk = repeat === 'none' ? true : periodsOk && daysOk && count >= 1 && count <= maxSessions()

    var countErr = $('f-repeatCount') && $('f-repeatCount').querySelector('.bk-err')
    if (countErr && repeat !== 'none') countErr.textContent = countErrorText(repeat, periodsOk, count)

    set('date', dateOk)
    set('time', timeOk)
    set('name', nameOk)
    set('phone', phoneOk)
    set('repeatCount', countOk)
    set('repeatDays', daysOk)

    if (!nameOk) {
      if ($('bkName')) $('bkName').focus()
      shakeField('f-name')
      toast('Vui lòng nhập họ và tên của bạn (tối thiểu 2 ký tự)', 'error')
      return
    }
    if (!phoneOk) {
      if ($('bkPhone')) $('bkPhone').focus()
      shakeField('f-phone')
      toast('Vui lòng nhập số điện thoại hợp lệ (10 số, VD: 0912345678)', 'error')
      return
    }
    if (!dateOk) {
      if ($('bkDate')) $('bkDate').focus()
      shakeField('f-date')
      toast('Vui lòng chọn ngày đặt hợp lệ (không chọn ngày quá khứ)', 'error')
      return
    }
    if (!timeOk) {
      if ($('bkTime')) $('bkTime').focus()
      shakeField('f-time')
      toast(
        repeat === 'none'
          ? 'Khung giờ này đã có người đặt hoặc nằm ngoài giờ hoạt động'
          : 'Vui lòng chọn ít nhất một khung giờ trong giờ hoạt động của sân',
        'error',
      )
      return
    }
    if (!daysOk) {
      shakeField('f-repeatDays')
      toast('Vui lòng chọn ít nhất một ' + (repeat === 'weekly' ? 'thứ' : 'ngày') + ' trong tuần/tháng', 'error')
      return
    }
    if (!countOk) {
      if ($('bkRepeatCount')) $('bkRepeatCount').focus()
      shakeField('f-repeatCount')
      toast(
        !periodsOk
          ? periodLabel(repeat) + ' đặt định kỳ phải từ 1 đến ' + maxPeriods()
          : 'Tổng số buổi đặt định kỳ tối đa ' + maxSessions() + ' buổi. Vui lòng giảm số lần lặp hoặc bớt ngày/giờ.',
        'error',
      )
      return
    }

    var btn = $('btnConfirmBook')
    var resetBtn = function () {
      if (btn) {
        btn.disabled = false
        btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Xác nhận đặt sân'
      }
    }

    try {
      var bookFn = SV && (SV.createBooking || SV.addBooking)
      if (!bookFn) {
        toast('Hệ thống dữ liệu chưa sẵn sàng. Vui lòng tải lại trang.', 'error')
        resetBtn()
        return
      }
      if (btn) {
        btn.disabled = true
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...'
      }

      var currentUser = SV && SV.currentUser ? SV.currentUser() : null
      var servicePer = serviceCostPerSession()
      var services = pickedServices()
      var courtTotal = Math.round((Number(venue.price) || 0) * duration)
      var voucherCode = ($('bkVoucher') && $('bkVoucher').value ? $('bkVoucher').value : '').trim().toUpperCase()
      var seriesId = repeat === 'none' ? '' : makeSeriesId()

      // Đặt định kỳ: tạo từng buổi (ngày × khung giờ), bỏ qua buổi trùng hoặc đã qua giờ.
      var created = []
      var skipped = []
      var lastError = ''

      sessions.forEach(function (s) {
        var free =
          s.hour >= venue.hours.open &&
          s.hour + duration <= venue.hours.close &&
          !isPastSlot(s.date, s.hour, s.hour + duration, venue.hours.close) &&
          !isSlotTaken(venue.id, s.date, s.hour, duration)
        if (!free) {
          skipped.push(s.date)
          return
        }
        var result = bookFn({
          courtId: SV.courtKey ? SV.courtKey(venue.id) : venue.id,
          courtName: venue.name,
          type: venue.type || '',
          date: s.date,
          startHour: s.hour,
          endHour: s.hour + duration,
          duration: duration,
          courtTotal: courtTotal,
          serviceTotal: servicePer,
          services: services,
          total: courtTotal + servicePer,
          voucherCode: voucherCode,
          repeat: repeat,
          repeatCount: count,
          seriesId: seriesId,
          userId: (currentUser && currentUser.id) || '',
          userName: name,
          customer: { name: name, phone: phone, email: (currentUser && currentUser.email) || '' },
          status: 'pending',
        })
        if (result && result.ok) created.push(result.booking)
        else {
          if (result && result.error) lastError = result.error
          skipped.push(s.date)
        }
      })

      if (!created.length) {
        toast(lastError || 'Tất cả khung giờ đã chọn đều đã có người đặt. Vui lòng chọn lại.', 'error')
        resetBtn()
        return
      }

      showSuccess(venue, {
        created: created,
        skipped: skipped,
        startHour: sessions[0].hour,
        hours: hours,
        days: state.repeatDays.slice(),
        duration: duration,
        repeat: repeat,
        count: count,
        name: name,
        phone: phone,
        courtTotal: courtTotal,
        servicePer: servicePer,
        services: services,
      })
    } catch (err) {
      console.error('Lỗi khi đặt sân:', err)
      resetBtn()
      toast('Đã có lỗi xảy ra khi đặt sân: ' + (err.message || 'vui lòng thử lại'), 'error')
    }
  }

  function payUrlFor(bookingId) {
    var opts = state.opts || {}
    if (typeof opts.payUrl === 'function') return opts.payUrl(bookingId)
    return PAY_PAGE + '?ma=' + encodeURIComponent(bookingId)
  }

  function showSuccess(venue, info) {
    var created = info.created
    var skipped = info.skipped
    var booking = created[0]
    var lastBooking = created[created.length - 1]
    var totalAll = created.reduce(function (sum, b) {
      return sum + (Number(b.total) || 0)
    }, 0)
    var subtotalAll = created.reduce(function (sum, b) {
      return sum + (Number(b.subtotal) || 0)
    }, 0)
    var payUrl = payUrlFor(booking.id)

    var serviceLine = info.services.length
      ? '<div><dt>Dịch vụ</dt><dd>' +
        info.services.map(function (s) {
          return esc(s.name) + ' ×' + s.qty
        }).join(', ') +
        '</dd></div><div><dt>Tiền dịch vụ</dt><dd>' +
        info.servicePer.toLocaleString('vi-VN') +
        'đ' +
        (created.length > 1 ? ' × ' + created.length + ' buổi' : '') +
        '</dd></div>'
      : ''
    var repeatLine =
      info.repeat === 'none'
        ? ''
        : '<div><dt>Hình thức</dt><dd>' + esc(repeatLabel(info.repeat)) + ' · ' + created.length + ' buổi</dd></div>'
    var hours = (info.hours && info.hours.length ? info.hours : [info.startHour])
      .map(Number)
      .filter(function (h) {
        return isFinite(h)
      })
      .sort(function (a, b) {
        return a - b
      })
    var hoursText = hours.length
      ? hours.length === 1
        ? timeLabel(hours[0]) + ' – ' + timeLabel(hours[0] + info.duration)
        : hours
            .slice(0, 4)
            .map(function (h) {
              return timeLabel(h)
            })
            .join(', ') + (hours.length > 4 ? ' … +' + (hours.length - 4) + ' khung giờ' : '')
      : timeLabel(info.startHour) + ' – ' + timeLabel(info.startHour + info.duration)
    var daysText =
      info.repeat === 'none' || !info.days || !info.days.length
        ? ''
        : daysSummary(info.repeat, info.days)
    var daysLine = daysText
      ? '<div><dt>' +
        (info.repeat === 'weekly' ? 'Thứ lặp' : 'Ngày lặp') +
        '</dt><dd>' +
        esc(daysText) +
        '</dd></div>'
      : ''
    var dateLine =
      created.length > 1
        ? '<div><dt>Ngày</dt><dd>' + esc(booking.date) + ' → ' + esc(lastBooking.date) + '</dd></div>'
        : '<div><dt>Ngày</dt><dd>' + esc(booking.date) + '</dd></div>'
    var skipNote = skipped.length
      ? '<p style="margin:10px 0 0;font-size:.76rem;color:#64748b;text-align:left"><i class="fa-solid fa-circle-info"></i> Đã bỏ qua ' +
        skipped.length +
        ' buổi trùng lịch hoặc đã qua giờ.</p>'
      : ''
    var multiNote =
      created.length > 1
        ? '<p style="margin:8px 0 0;font-size:.76rem;color:#64748b;text-align:left"><i class="fa-solid fa-circle-info"></i> Buổi đầu được mở trang thanh toán, các buổi còn lại được giữ chỗ và thanh toán trực tiếp tại sân.</p>'
        : ''

    var body = $('bookBody')
    if (body) {
      body.innerHTML =
        '<div class="bk-success">' +
        '<div class="bk-success-icon"><i class="fa-solid fa-check"></i></div>' +
        '<h3>Đặt sân thành công!</h3>' +
        '<p>Mã đơn <b>' + esc(booking.id) + '</b>' +
        (created.length > 1 ? ' (+' + (created.length - 1) + ' buổi)' : '') +
        ' · Đang mở trang thanh toán...</p>' +
        '<dl class="bk-summary">' +
        '<div><dt>Sân</dt><dd>' + esc(venue.name) + '</dd></div>' +
        (venue.type ? '<div><dt>Loại sân</dt><dd>' + esc(typeLabel(venue.type)) + '</dd></div>' : '') +
        dateLine +
        '<div><dt>Giờ</dt><dd>' + hoursText + '</dd></div>' +
        '<div><dt>Thời lượng</dt><dd>' + info.duration + ' giờ</dd></div>' +
        daysLine +
        repeatLine +
        serviceLine +
        '<div><dt>Tiền sân</dt><dd>' +
        (info.courtTotal * created.length).toLocaleString('vi-VN') +
        'đ' +
        (created.length > 1 ? ' × ' + created.length + ' buổi' : '') +
        '</dd></div>' +
        (booking.discount > 0
          ? '<div><dt>Tạm tính</dt><dd style="text-decoration:line-through">' +
            subtotalAll.toLocaleString('vi-VN') +
            'đ</dd></div><div><dt>Giảm giá (' +
            esc(booking.voucherCode) +
            ')</dt><dd style="color:#16a34a">-' +
            (subtotalAll - totalAll).toLocaleString('vi-VN') +
            'đ</dd></div><div><dt>Tổng tiền</dt><dd><b>' +
            totalAll.toLocaleString('vi-VN') +
            'đ</b></dd></div>'
          : '<div><dt>Tổng tiền</dt><dd>' + totalAll.toLocaleString('vi-VN') + 'đ</dd></div>') +
        '<div><dt>Liên hệ</dt><dd>' + esc(info.name) + ' · ' + esc(info.phone) + '</dd></div>' +
        '</dl>' +
        skipNote +
        multiNote +
        '<div class="bk-success-actions">' +
        '<button type="button" class="btn-book btn-book-full" id="bkPayNow"><i class="fa-solid fa-credit-card"></i> Thanh toán ngay</button>' +
        '<button type="button" class="btn-book btn-book-full btn-book-ghost" id="bkLater">Để thanh toán sau</button>' +
        '</div></div>'

      if (payTimer) clearTimeout(payTimer)
      payTimer = setTimeout(function () {
        window.location.href = payUrl
      }, 1500)
      $('bkPayNow') &&
        $('bkPayNow').addEventListener('click', function () {
          clearTimeout(payTimer)
          payTimer = null
          window.location.href = payUrl
        })
      $('bkLater') &&
        $('bkLater').addEventListener('click', function () {
          close()
          toast('Đơn đã được giữ. Bạn có thể thanh toán sau trong trang Tài khoản.')
        })
    }

    try {
      document.dispatchEvent(
        new CustomEvent('dat-san:success', {
          detail: { booking: booking, created: created, skipped: skipped, venue: venue },
        }),
      )
    } catch (e) {}

    var done = state.opts && state.opts.onSuccess
    if (typeof done === 'function') done({ booking: booking, created: created, skipped: skipped })

    toast(
      'Đặt sân thành công · ' +
        booking.id +
        (created.length > 1 ? ' · ' + created.length + ' buổi ' + repeatLabel(info.repeat).toLowerCase() : ''),
    )
  }

  // ---------------------------- GẮN SỰ KIỆN ----------------------------

  function bindFormEvents() {
    var form = $('bookForm')
    // Gắn trước các handler nghiệp vụ để dọn lỗi cũ chạy trước khi tính lại.
    form.querySelectorAll('input, select').forEach(function (el) {
      if (el.id === 'bkVoucher') return
      var clearErr = function () {
        var fieldEl = el.closest('.bk-field')
        if (fieldEl) {
          fieldEl.classList.remove('invalid')
          fieldEl.classList.remove('shake')
        }
      }
      el.addEventListener('input', clearErr)
      el.addEventListener('change', clearErr)
    })

    var dateInput = $('bkDate')
    dateInput.addEventListener('change', function () {
      if (currentRepeat() !== 'none' && !state.daysCustom) seedRepeatDays()
      updateTotal()
    })

    $('bkTimeSlotGrid').addEventListener('click', function (e) {
      var chip = e.target.closest('.bk-slot')
      if (!chip || chip.disabled) return
      var h = parseFloat(chip.dataset.hour)
      if (!isFinite(h)) return
      if (currentRepeat() === 'none') {
        state.hours = [h]
      } else {
        var idx = state.hours.indexOf(h)
        if (idx >= 0) {
          if (state.hours.length === 1) {
            toast('Cần chọn ít nhất một khung giờ', 'error')
            return
          }
          state.hours.splice(idx, 1)
        } else {
          state.hours.push(h)
          state.hours.sort(function (a, b) {
            return a - b
          })
        }
      }
      var t = $('bkTime')
      if (t) t.value = state.hours.length ? String(state.hours[0]) : ''
      var f = $('f-time')
      if (f) {
        f.classList.remove('invalid')
        f.classList.remove('shake')
      }
      updateTotal()
    })

    $('repeatDaysGrid').addEventListener('click', function (e) {
      var chip = e.target.closest('.bk-chip')
      if (!chip) return
      var repeat = currentRepeat()
      if (repeat === 'none') return
      var v = parseInt(chip.dataset.day, 10)
      if (!isFinite(v)) return
      var next = state.repeatDays.slice()
      var idx = next.indexOf(v)
      if (idx >= 0) next.splice(idx, 1)
      else next.push(v)
      if (!next.length) {
        toast('Vui lòng chọn ít nhất một ' + (repeat === 'weekly' ? 'thứ' : 'ngày'), 'error')
        return
      }
      var date = $('bkDate') ? $('bkDate').value : ''
      state.repeatDays = normalizeRepeatDays(date, repeat, next)
      state.daysCustom = true
      renderRepeatDays()
      updateTotal()
    })

    $('bkDuration').addEventListener('change', updateTotal)
    $('bkRepeat').addEventListener('change', function () {
      syncRepeatUI()
      if (currentRepeat() === 'none') state.hours = state.hours.slice(0, 1)
      else seedRepeatDays()
      updateTotal()
    })
    $('bkRepeatCount').addEventListener('input', updateTotal)
    $('bkVoucher').addEventListener('input', updateTotal)

    $('serviceList').addEventListener('click', function (e) {
      var btn = e.target.closest('.qty-btn, .qty-check')
      if (!btn) return
      var id = btn.dataset.id
      var act = btn.dataset.act
      var svc = null
      for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].id === id) svc = SERVICES[i]
      if (!svc) return
      var cur = state.services[id] || 0
      var max = svc.max || 99
      var next = Math.max(0, Math.min(max, act === 'toggle' ? (cur > 0 ? 0 : 1) : act === 'inc' ? cur + 1 : cur - 1))
      if (next === 0) delete state.services[id]
      else state.services[id] = next
      var valEl = $('qty-' + id)
      if (valEl) valEl.textContent = next
      var item = btn.closest('.service-item')
      if (item) item.classList.toggle('active', next > 0)
      if (btn.classList.contains('qty-check')) btn.setAttribute('aria-pressed', String(next > 0))
      var inc = item && item.querySelector('.qty-btn[data-act="inc"]')
      if (inc) inc.toggleAttribute('disabled', next >= max)
      updateTotal()
    })

    form.addEventListener('submit', function (e) {
      e.preventDefault()
      submitBooking()
    })
  }

  /** Admin xoá/khóa sân hoặc tab khác đặt mất khung giờ đang mở -> cập nhật lại form. */
  function onStoreChange(key) {
    if (key !== 'fields' && key !== 'bookings' && key !== '*') return
    if (!isOpen() || !state.venue) return
    if (key === 'fields' || key === '*') {
      var list = SV.fields ? SV.fields() : []
      var found = null
      for (var i = 0; i < list.length; i++) {
        var raw = list[i]
        if (raw.status && raw.status !== 'active') continue
        if (SV.courtKey ? SV.courtKey(raw.id) === SV.courtKey(state.venue.id) : String(raw.id) === state.venue.id) {
          found = raw
          break
        }
      }
      if (!found) {
        close()
        toast('Sân này vừa bị ngừng hoạt động, vui lòng chọn sân khác.', 'error')
        return
      }
      state.venue = normalizeVenue(found)
    }
    // Đơn vừa đặt/huỷ ở tab khác, hoặc giá/giờ vừa đổi: vẽ lại lưới + tổng.
    if ($('bookForm')) updateTotal()
  }

  var inited = false
  function initOnce() {
    if (inited) return
    inited = true
    injectCss()
    var ov = ensureModal()
    // Trang nào đã có sẵn #bookModal cũng gắn class để CSS dùng chung áp dụng.
    ov.classList.add('ds4sv-overlay')
    ov.addEventListener('click', function (e) {
      if (e.target === ov) close()
    })
    var closeBtn = ov.querySelector('.modal-close')
    if (closeBtn) closeBtn.addEventListener('click', close)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) close()
    })
    if (global.SV && SV.on) SV.on(onStoreChange)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnce)
  } else {
    initOnce()
  }

  global.DatSanModal = {
    open: function (venue, opts) {
      initOnce()
      opts = opts || {}
      if (payTimer) {
        clearTimeout(payTimer)
        payTimer = null
      }
      state.venue = normalizeVenue(venue)
      state.opts = opts
      state.duration = 1
      state.services = {}
      state.hours = []
      state.repeatDays = []
      state.daysCustom = false
      Object.keys(opts.services || {}).forEach(function (id) {
        var svc = null
        for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].id === id) svc = SERVICES[i]
        var n = Math.floor(Number(opts.services[id]))
        if (svc && n > 0) state.services[id] = Math.min(svc.max || 99, n)
      })

      var body = $('bookBody') || ensureModal().querySelector('#bookBody')
      body.innerHTML = formHtml(state.venue)
      bindFormEvents()

      var dateInput = $('bkDate')
      dateInput.min = todayStr()
      dateInput.value = opts.date && opts.date >= todayStr() ? opts.date : todayStr()

      if (opts.duration && [1, 1.5, 2, 3].indexOf(Number(opts.duration)) >= 0) {
        state.duration = Number(opts.duration)
        $('bkDuration').value = String(opts.duration)
      }
      if (opts.repeat && REPEAT_TYPES.indexOf(opts.repeat) >= 0 && $('bkRepeat')) $('bkRepeat').value = opts.repeat
      if (opts.repeatCount && $('bkRepeatCount')) $('bkRepeatCount').value = String(opts.repeatCount)

      var repeat = syncRepeatUI()
      if (repeat !== 'none') {
        seedRepeatDays()
        if (opts.days && opts.days.length) {
          state.repeatDays = normalizeRepeatDays(dateInput.value, repeat, opts.days)
          state.daysCustom = true
          renderRepeatDays()
        }
      }

      updateTotal()

      var sel = $('bkTime')
      var presetHours = Array.isArray(opts.hours)
        ? opts.hours
            .map(Number)
            .filter(function (h) {
              return isFinite(h)
            })
        : []
      if (!presetHours.length && opts.hour != null) {
        var available = [].map
          .call(sel.options, function (o) {
            return Number(o.value)
          })
          .filter(isFinite)
        if (available.length) {
          presetHours = [
            available.reduce(function (a, b) {
              return Math.abs(b - opts.hour) < Math.abs(a - opts.hour) ? b : a
            }),
          ]
        }
      }
      if (presetHours.length) {
        state.hours = presetHours.sort(function (a, b) {
          return a - b
        })
        sel.value = String(state.hours[0])
        updateTotal()
      }
      renderTimeSlots()
      openModal()
    },
    close: function () {
      initOnce()
      close()
    },
    isOpen: isOpen,
    SERVICES: SERVICES,
    PAY_PAGE: PAY_PAGE,
  }
})(window)
