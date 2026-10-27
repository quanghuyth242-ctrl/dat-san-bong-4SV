import './style.css'
import './info-pages.css'
import { getUser, syncAuthNav, toast } from './auth-nav.js'

/**
 * Trang liên hệ 4SV.vn.
 *
 * Biểu mẫu không gửi lên server (dự án chạy hoàn toàn phía trình duyệt), nên
 * yêu cầu được lưu vào localStorage để không mất khi tải lại trang. Mã yêu cầu
 * hiển thị cho người dùng sau khi gửi thành công.
 */

const CONTACT_KEY = '4sv_contact_messages'
const MAX_SAVED = 50

const TOPIC_LABEL = {
  'dat-san': 'Đặt sân / thanh toán',
  'tai-khoan': 'Tài khoản & đăng nhập',
  'chu-san': 'Hợp tác chủ sân',
  'gop-y': 'Góp ý sản phẩm',
  khac: 'Vấn đề khác',
}

// ================================ TIỆN ÍCH ================================

function readMessages() {
  try {
    const raw = localStorage.getItem(CONTACT_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function saveMessage(message) {
  const list = readMessages()
  list.unshift(message)
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(list.slice(0, MAX_SAVED)))
    return true
  } catch {
    // Bộ nhớ trình duyệt đầy hoặc bị chặn: vẫn coi như đã ghi nhận để người
    // dùng không phải gửi lại, nhưng báo cho họ biết nếu cần lưu mã.
    return false
  }
}

function makeRef() {
  const d = new Date()
  const stamp =
    String(d.getFullYear()).slice(-2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LH${stamp}-${rand}`
}

function normalizePhone(value) {
  return String(value ?? '').replace(/[\s.\-()]/g, '')
}

// ================================ FORM ================================

const form = document.getElementById('contactForm')

const fields = {
  name: { input: document.getElementById('cName') },
  phone: { input: document.getElementById('cPhone') },
  email: { input: document.getElementById('cEmail') },
  topic: { input: document.getElementById('cTopic') },
  message: { input: document.getElementById('cMessage') },
  consent: { input: document.getElementById('cConsent') },
}

function fieldError(name) {
  return document.querySelector(`[data-err-for="${name}"]`)
}

function setError(name, message) {
  const target = fields[name]?.input
  const box = fieldError(name)
  if (box) box.textContent = message || ''

  if (!target) return
  const wrapper = name === 'consent' ? target.closest('.contact-check') : target.closest('.contact-field')
  wrapper?.classList.toggle('invalid', Boolean(message))
}

function clearError(name) {
  setError(name, '')
}

function validate() {
  const values = {
    name: fields.name.input?.value.trim() || '',
    phone: fields.phone.input?.value.trim() || '',
    email: fields.email.input?.value.trim() || '',
    topic: fields.topic.input?.value || '',
    message: fields.message.input?.value.trim() || '',
    consent: Boolean(fields.consent.input?.checked),
  }

  const errors = {}

  if (values.name.length < 2) {
    errors.name = 'Vui lòng nhập họ tên (ít nhất 2 ký tự).'
  } else if (values.name.length > 80) {
    errors.name = 'Họ tên quá dài, vui lòng nhập ngắn gọn hơn.'
  }

  const phone = normalizePhone(values.phone)
  if (!phone) {
    errors.phone = 'Vui lòng nhập số điện thoại để 4SV liên hệ lại.'
  } else if (!/^(?:\+?84|0)\d{9,10}$/.test(phone)) {
    errors.phone = 'Số điện thoại chưa đúng, ví dụ: 0912 345 678.'
  }

  if (!values.email) {
    errors.email = 'Vui lòng nhập email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) {
    errors.email = 'Email chưa đúng định dạng.'
  }

  if (!values.topic || !TOPIC_LABEL[values.topic]) {
    errors.topic = 'Vui lòng chọn chủ đề cần hỗ trợ.'
  }

  if (values.message.length < 10) {
    errors.message = 'Vui lòng mô tả chi tiết hơn (ít nhất 10 ký tự).'
  }

  if (!values.consent) {
    errors.consent = 'Bạn cần đồng ý để 4SV có thể phản hồi lại.'
  }

  Object.keys(fields).forEach((name) => setError(name, errors[name]))
  return { ok: Object.keys(errors).length === 0, values: { ...values, phone } }
}

function showSuccess(ref) {
  const wrap = document.getElementById('contactFormWrap')
  const formEl = document.getElementById('contactForm')
  const success = document.getElementById('contactSuccess')
  const refEl = document.getElementById('contactRef')

  if (refEl) refEl.textContent = ref
  if (wrap) wrap.hidden = true
  if (formEl) formEl.hidden = true
  if (success) {
    success.hidden = false
    success.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function resetFormView() {
  const wrap = document.getElementById('contactFormWrap')
  const formEl = document.getElementById('contactForm')
  const success = document.getElementById('contactSuccess')

  if (wrap) wrap.hidden = false
  if (formEl) {
    formEl.hidden = false
    formEl.reset()
  }
  if (success) success.hidden = true

  const count = document.getElementById('cMessageCount')
  if (count) count.textContent = '0'

  Object.keys(fields).forEach(clearError)
  fields.name.input?.focus()
}

function initForm() {
  if (!form) return

  // Điền sẵn thông tin nếu người dùng đã đăng nhập (không ghi đè nội dung đã gõ).
  const user =
    (window.SV && typeof SV.currentUser === 'function' && SV.currentUser()) || getUser()
  if (user) {
    if (fields.name.input && !fields.name.input.value) fields.name.input.value = user.name || ''
    if (fields.email.input && !fields.email.input.value) fields.email.input.value = user.email || ''
    if (fields.phone.input && !fields.phone.input.value) fields.phone.input.value = user.phone || ''
  }

  Object.entries(fields).forEach(([name, field]) => {
    field.input?.addEventListener('input', () => {
      if (fieldError(name)?.textContent) clearError(name)
    })
    field.input?.addEventListener('change', () => clearError(name))
  })

  const message = document.getElementById('cMessage')
  const count = document.getElementById('cMessageCount')
  message?.addEventListener('input', () => {
    if (count) count.textContent = String(message.value.length)
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const { ok, values } = validate()

    if (!ok) {
      const firstInvalid = form.querySelector(
        '.contact-field.invalid input, .contact-field.invalid select, .contact-field.invalid textarea, .contact-check.invalid input',
      )
      firstInvalid?.focus({ preventScroll: true })
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const ref = makeRef()
    const saved = saveMessage({
      id: ref,
      name: values.name,
      email: values.email,
      phone: values.phone,
      topic: values.topic,
      topicLabel: TOPIC_LABEL[values.topic],
      message: values.message,
      createdAt: new Date().toISOString(),
      status: 'new',
      page: 'lien-he',
    })

    showSuccess(ref)
    if (saved) {
      toast('Đã gửi tin nhắn tới 4SV.vn')
    } else {
      toast('Đã ghi nhận yêu cầu. Vui lòng lưu lại mã yêu cầu.', 'error')
    }
  })

  document.getElementById('contactAgain')?.addEventListener('click', resetFormView)
}

// ================================ BẢN ĐỒ ================================

const OFFICE = { lat: 21.0167, lng: 105.8155 }

function initMap() {
  const el = document.getElementById('contactMap')
  if (!el) return

  if (typeof L === 'undefined') {
    el.classList.add('contact-map-fallback')
    el.innerHTML = '<div><i class="fa-solid fa-map-location-dot"></i> Không tải được bản đồ.</div>'
    return
  }

  const map = L.map(el, { scrollWheelZoom: false }).setView([OFFICE.lat, OFFICE.lng], 15)
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles &copy; Esri', maxZoom: 19 },
  ).addTo(map)

  // Dùng divIcon thay marker mặc định: bộ ảnh Leaflet đi kèm thiếu marker-shadow.png
  // nên marker mặc định bị vỡ ảnh, đồng thời pin này khớp với bản đồ ở trang chủ.
  const icon = L.divIcon({
    className: '',
    html: '<div class="map-pin"><i class="fa-solid fa-futbol"></i></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  })

  L.marker([OFFICE.lat, OFFICE.lng], { icon })
    .addTo(map)
    .bindPopup(
      '<div class="map-popup"><strong>4SV.vn</strong><span>88 Láng Hạ, Đống Đa, Hà Nội</span></div>',
    )
    .openPopup()
}

// ================================ CÀI ĐẶT / NAV ================================

function applySettings() {
  if (!window.SV || typeof SV.settings !== 'function') return
  const s = SV.settings()
  if (s.siteName) {
    document.querySelectorAll('[data-site-name]').forEach((el) => {
      el.textContent = s.siteName
    })
    document.title = `Liên hệ · ${s.siteName}`
  }
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
  if (!toggle || !menu) return

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open')
    menu.classList.toggle('open', !isOpen)
    toggle.setAttribute('aria-expanded', String(!isOpen))
    toggle.innerHTML = isOpen
      ? '<i class="fa-solid fa-bars"></i>'
      : '<i class="fa-solid fa-xmark"></i>'
  })

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#navMenu') && !e.target.closest('#navToggle')) {
      menu.classList.remove('open')
      toggle.setAttribute('aria-expanded', 'false')
      toggle.innerHTML = '<i class="fa-solid fa-bars"></i>'
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    menu.classList.remove('open')
    toggle.setAttribute('aria-expanded', 'false')
    toggle.innerHTML = '<i class="fa-solid fa-bars"></i>'
  })
}

function init() {
  const year = document.getElementById('year')
  if (year) year.textContent = String(new Date().getFullYear())

  applySettings()
  initNav()
  syncAuthNav({ accountUrl: './tai-khoan.html' })
  initForm()
  initMap()

  if (window.SV && typeof SV.on === 'function') {
    SV.on((key) => {
      if (key === 'settings' || key === '*') applySettings()
    })
  }
}

document.addEventListener('DOMContentLoaded', init)
