import { REPEAT_LABEL } from './repeat.js'

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

const OTP_DEMO = '123456'
const RESEND_SECONDS = 60
const REDIRECT_MS = 3000
// Cả tài khoản lẫn phiên đăng nhập đều do store chung quản lý
// (public/project/js/store.js): đăng ký ở đây thì trang quản trị thấy ngay,
// đăng nhập xong thì header mọi trang đổi sang ô tài khoản.
const DEMO_USER = {
  name: 'Nguyễn Minh Tuấn',
  email: 'demo@4sv.vn',
  phone: '0912345678',
  password: '123456',
  role: 'player',
}

function toast(message) {
  const el = document.createElement('div')
  el.className = 'toast-4sv'
  el.textContent = message
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 250)
  }, 2600)
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim())
const isPhone = (v) => /^0?\d{9,10}$/.test(v.replace(/[\s.]/g, ''))
const digits = (v) => String(v || '').replace(/\D/g, '')

const RULES = {
  identity: (v) => {
    if (!v.trim()) return 'Vui lòng nhập email hoặc số điện thoại'
    if (!isEmail(v) && !isPhone(v))
      return 'Email hoặc số điện thoại chưa đúng định dạng'
    return ''
  },
  password: (v) => {
    if (!v) return 'Vui lòng nhập mật khẩu'
    if (v.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự'
    return ''
  },
  name: (v) => {
    if (!v.trim()) return 'Vui lòng nhập họ và tên'
    if (v.trim().length < 2) return 'Họ tên quá ngắn'
    if (/\d/.test(v)) return 'Họ tên không được chứa chữ số'
    return ''
  },
  email: (v) => {
    if (!v.trim()) return 'Vui lòng nhập email'
    if (!isEmail(v)) return 'Email chưa đúng định dạng'
    return ''
  },
  phone: (v) => {
    if (!v.trim()) return 'Vui lòng nhập số điện thoại'
    if (!isPhone(v)) return 'Số điện thoại phải có 9-10 chữ số'
    return ''
  },
}

const tabs = $('#authTabs')
const panels = $$('[data-panel]')
const forms = {
  login: $('#loginForm'),
  register: $('#registerForm'),
  forgot: $('#forgotForm'),
  otp: $('#otpForm'),
  newpass: $('#newPassForm'),
}
const otpBoxes = $$('[data-otp] input')
const otpError = $('[data-error-for="otp"]')
const resendBtn = $('[data-otp-resend]')

let mode = 'login'
let otpContext = 'register'
let otpTarget = ''
let resendTimer = null
let redirectTimer = null
// Tài khoản vừa tạo ở form Đăng ký: giữ lại để bước OTP xong là đăng nhập luôn.
let registeredUser = null

/**
 * Đường về trang chủ tính theo vị trí trang đăng nhập (đang ở /src/auth.html),
 * nên chạy đúng cả khi dev server, khi build sang dist lẫn khi mở file trực tiếp.
 */
function homeUrl() {
  try {
    return new URL('../index.html', location.href).href
  } catch {
    return '../index.html'
  }
}

/* ---------- CHUYỂN MÀN HÌNH ---------- */
function setMode(next, { updateHash = true, focus = true } = {}) {
  mode = next
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== next
  })

  // Panel tài khoản rộng hơn (2 cột) nên mở rộng thẻ và ẩn hẳn cột quảng cáo
  // bên trái để không chiếm chỗ.
  const card = $('.auth-card')
  if (card) card.classList.toggle('auth-card--wide', next === 'profile')
  const page = $('.auth-page')
  if (page) page.classList.toggle('auth-page--account', next === 'profile')

  const isTabMode = next === 'login' || next === 'register'
  tabs.hidden = !isTabMode
  tabs.dataset.active = isTabMode ? next : tabs.dataset.active
  $$('.auth-tab', tabs).forEach((tab) => {
    const active = tab.dataset.mode === next
    tab.classList.toggle('active', active)
    tab.setAttribute('aria-selected', String(active))
  })

  if (updateHash && isTabMode && location.hash.slice(1) !== next) {
    history.replaceState(null, '', `#${next}`)
  }
  if (focus) {
    const first = $(`[data-panel="${next}"] [data-rule]`)
    if (first) setTimeout(() => first.focus(), 60)
  }
}

/** Chỉ mở được panel tài khoản khi đã đăng nhập; chưa thì đưa về đăng nhập. */
function goProfile() {
  if (!SV.currentUser()) {
    toast('Vui lòng đăng nhập để xem tài khoản của bạn')
    setMode('login')
    return
  }
  openProfile()
  setMode('profile')
}

/* ---------- HIỂN THỊ LỖI ---------- */
function setFieldState(input, message) {
  const field = input.closest('.auth-field')
  const error = $(`[data-error-for="${input.id}"]`)
  field.classList.toggle('invalid', Boolean(message))
  field.classList.toggle('valid', !message && input.value.trim() !== '')
  if (!error) return
  error.innerHTML = message
    ? `<i class="fa-solid fa-circle-exclamation"></i> ${message}`
    : ''
  error.hidden = !message
  input.setAttribute('aria-invalid', String(Boolean(message)))
}

function validateField(input) {
  const rule = RULES[input.dataset.rule]
  const message = rule ? rule(input.value) : ''
  setFieldState(input, message)
  return !message
}

function validateForm(form) {
  const inputs = $$('[data-rule]', form)
  let firstBad = null
  let ok = true
  inputs.forEach((input) => {
    if (!validateField(input) && !firstBad) {
      firstBad = input
      ok = false
    }
  })

  const confirm = $('[data-rule="confirm"]', form)
  if (confirm && ok) {
    const source = document.getElementById(confirm.dataset.pair)
    if (source && confirm.value !== source.value) {
      setFieldState(confirm, 'Mật khẩu xác nhận chưa khớp')
      firstBad = confirm
      ok = false
    }
  }

  const terms = $('#regTerms')
  if (terms && form === forms.register && !terms.checked) {
    $('#termsLabel').classList.add('invalid')
    toast('Bạn cần đồng ý với điều khoản sử dụng')
    if (!firstBad) firstBad = terms
    ok = false
  }

  if (firstBad) firstBad.focus()
  return ok
}

/* ---------- ĐỘ MẠNH MẬT KHẨU ---------- */
const METER_TEXT = [
  'Nên gồm chữ, số và ký tự đặc biệt',
  'Yếu - nên có chữ hoa, chữ số và ký tự đặc biệt',
  'Trung bình - thêm ký tự đặc biệt để an toàn hơn',
  'Mạnh - mật khẩu khá tốt',
  'Rất mạnh - an toàn tuyệt đối',
]

function scorePassword(value) {
  if (!value) return 0
  let score = 0
  if (value.length >= 6) score += 1
  if (value.length >= 10) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  return score
}

function updateMeter(input) {
  const field = input.closest('.auth-field')
  const meter = $('[data-meter]', field)
  const text = $('[data-meter-text]', field)
  if (!meter || !text) return
  const score = scorePassword(input.value)
  meter.dataset.level = String(score)
  text.textContent = METER_TEXT[score]
  text.style.color =
    score >= 4 ? 'var(--green-primary)' : score >= 2 ? '#b45309' : '#dc2626'
}

/* ---------- NÚT / TRẠNG THÁI ---------- */
function setLoading(form, loading) {
  const button = $('button[type="submit"]', form)
  if (!button) return
  button.classList.toggle('loading', loading)
  button.classList.toggle('auth-submit--loading', loading)
  button.disabled = loading
}

function fakeRequest(form, delay = 900) {
  return new Promise((resolve) => {
    setLoading(form, true)
    setTimeout(() => {
      setLoading(form, false)
      resolve()
    }, delay)
  })
}

/* ---------- OTP ---------- */
function readOtp() {
  return otpBoxes.map((box) => box.value).join('')
}

function resetOtp() {
  otpBoxes.forEach((box) => (box.value = ''))
  $('[data-otp]').classList.remove('is-filled')
  otpError.hidden = true
}

function startResendCountdown() {
  let left = RESEND_SECONDS
  resendBtn.disabled = true
  resendBtn.textContent = `Gửi lại mã (${left}s)`
  clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    left -= 1
    if (left <= 0) {
      clearInterval(resendTimer)
      resendBtn.disabled = false
      resendBtn.textContent = 'Gửi lại mã'
      return
    }
    resendBtn.textContent = `Gửi lại mã (${left}s)`
  }, 1000)
}

function showOtp(context, target) {
  otpContext = context
  otpTarget = target
  $('[data-otp-target]').textContent = target
  resetOtp()
  setMode('otp')
  startResendCountdown()
  setTimeout(() => otpBoxes[0].focus(), 80)
}

function submitOtp() {
  const code = readOtp()
  if (code.length < 6) {
    otpError.innerHTML =
      '<i class="fa-solid fa-circle-exclamation"></i> Vui lòng nhập đủ 6 số mã xác thực'
    otpError.hidden = false
    otpBoxes[code.length].focus()
    return
  }
  if (code !== OTP_DEMO) {
    otpError.innerHTML =
      '<i class="fa-solid fa-circle-exclamation"></i> Mã xác thực không đúng, thử lại (demo: 123456)'
    otpError.hidden = false
    otpBoxes[0].focus()
    otpBoxes[0].select()
    return
  }
  otpError.hidden = true
  clearInterval(resendTimer)
  resendBtn.disabled = false
  resendBtn.textContent = 'Gửi lại mã'

  if (otpContext === 'register') {
    // Đăng ký xong thì tự đăng nhập luôn: người dùng bấm "Vào trang chủ" là
    // vào dùng được ngay, không phải nhập lại email/mật khẩu một lần nữa.
    const user = registeredUser || findUser(otpTarget)
    registeredUser = null
    if (user) SV.signIn(user, true)
    showSuccess(
      'Tạo tài khoản thành công!',
      `Voucher giảm 20% đã gửi tới ${otpTarget}. Chào mừng bạn đến với 4SV.vn.`,
      homeUrl(),
      { showLoginBack: false },
    )
    return
  }
  setMode('newpass')
}

/* ---------- THÀNH CÔNG ---------- */
function showSuccess(title, desc, redirectTo, { showLoginBack = true } = {}) {
  $('[data-success-title]').textContent = title
  $('[data-success-desc]').textContent = desc

  // Nút "Về trang đăng nhập" chỉ có ích khi chưa đăng nhập; sau khi đăng ký
  // xong đã tự đăng nhập rồi nên ẩn đi, chỉ giữ nút "Vào trang chủ".
  const backBtn = $('[data-success-back]')
  if (backBtn) {
    backBtn.hidden = !showLoginBack
    backBtn.style.display = showLoginBack ? '' : 'none'
    backBtn
      .closest('.auth-btn-row')
      ?.classList.toggle('auth-btn-row--single', !showLoginBack)
  }
  const homeBtn = $('[data-success-home]')
  if (homeBtn && redirectTo) homeBtn.setAttribute('href', redirectTo)

  setMode('success', { focus: false })
  clearTimeout(redirectTimer)
  if (redirectTo) {
    redirectTimer = setTimeout(() => {
      window.location.href = redirectTo
    }, REDIRECT_MS)
  }
}

/* ---------- NGƯỜI DÙNG (lấy từ store dùng chung) ---------- */
function getUsers() {
  return SV.users()
}

/**
 * Chỉ nhận email hoặc số điện thoại. SV.findUser() còn khớp cả tên để tiện
 * tìm kiếm ở trang quản trị, nhưng đăng nhập thì không nên cho đăng nhập
 * bằng tên vì hai người có thể trùng tên.
 */
function findUser(identity) {
  const key = identity.trim().toLowerCase()
  const phone = digits(identity)
  return (
    getUsers().find(
      (u) =>
        String(u.email || '').toLowerCase() === key ||
        (phone && digits(u.phone) === phone),
    ) || null
  )
}

/* ---------- KHỞI TẠO ---------- */
function initTabs() {
  $$('.auth-tab', tabs).forEach((tab) => {
    tab.addEventListener('click', () => {
      setMode(tab.dataset.mode)
    })
  })

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-go]')
    if (!trigger) return
    const target = trigger.dataset.go
    if (target === 'back-otp') {
      setMode(otpContext === 'register' ? 'register' : 'forgot')
      return
    }
    if (target === 'login') {
      clearTimeout(redirectTimer)
      setMode('login')
      return
    }
    if (target === 'profile') {
      goProfile()
      return
    }
    setMode(target)
  })
}

function initFields() {
  $$('[data-rule]').forEach((input) => {
    input.addEventListener('blur', () => validateField(input))
    input.addEventListener('input', () => {
      if (input.closest('.auth-field').classList.contains('invalid')) {
        validateField(input)
      }
      const clearBtn = $(`[data-clear="${input.id}"]`)
      if (clearBtn) clearBtn.hidden = input.value === ''
      if (input.hasAttribute('data-meter-for')) updateMeter(input)
    })
  })

  document.addEventListener('click', (e) => {
    const clearBtn = e.target.closest('[data-clear]')
    if (clearBtn) {
      const input = document.getElementById(clearBtn.dataset.clear)
      input.value = ''
      clearBtn.hidden = true
      setFieldState(input, '')
      if (input.hasAttribute('data-meter-for')) updateMeter(input)
      input.focus()
      return
    }

    const toggle = e.target.closest('[data-toggle-pass]')
    if (toggle) {
      const input = document.getElementById(toggle.dataset.togglePass)
      const show = input.type === 'password'
      input.type = show ? 'text' : 'password'
      toggle.classList.toggle('is-on', show)
      toggle.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')
      input.focus()
      return
    }

    const noop = e.target.closest('[data-noop]')
    if (noop) {
      e.preventDefault()
      toast('Nội dung điều khoản đang được cập nhật')
    }
  })
}

function initOtpInputs() {
  otpBoxes.forEach((box, index) => {
    box.addEventListener('input', () => {
      box.value = digits(box.value).slice(-1)
      const code = readOtp()
      $('[data-otp]').classList.toggle('is-filled', code.length === 6)
      if (box.value && index < otpBoxes.length - 1) otpBoxes[index + 1].focus()
      if (code.length === 6) forms.otp.requestSubmit()
    })

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) otpBoxes[index - 1].focus()
      if (e.key === 'ArrowLeft' && index > 0) otpBoxes[index - 1].focus()
      if (e.key === 'ArrowRight' && index < otpBoxes.length - 1) otpBoxes[index + 1].focus()
    })

    box.addEventListener('paste', (e) => {
      e.preventDefault()
      const pasted = digits(e.clipboardData.getData('text')).slice(0, 6)
      otpBoxes.forEach((b, i) => (b.value = pasted[i] || ''))
      $('[data-otp]').classList.toggle('is-filled', pasted.length === 6)
      const next = Math.min(pasted.length, otpBoxes.length - 1)
      otpBoxes[next].focus()
      if (pasted.length === 6) forms.otp.requestSubmit()
    })
  })

  resendBtn.addEventListener('click', () => {
    if (resendBtn.disabled) return
    startResendCountdown()
    resetOtp()
    toast(`Đã gửi lại mã xác thực tới ${otpTarget}`)
    otpBoxes[0].focus()
  })
}

function initForms() {
  const filled = $('[data-fill-demo]')
  if (filled) {
    filled.addEventListener('click', () => {
      $('#loginIdentity').value = DEMO_USER.email
      $('#loginPassword').value = DEMO_USER.password
      setFieldState($('#loginIdentity'), '')
      setFieldState($('#loginPassword'), '')
      toast('Đã điền tài khoản demo, nhấn Đăng nhập')
    })
  }

  $$('[data-social]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toast(`Đăng nhập bằng ${btn.dataset.social} đang được phát triển`)
    })
  })

  forms.login.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!validateForm(forms.login)) return
    await fakeRequest(forms.login)
    const identity = $('#loginIdentity').value.trim()
    const password = $('#loginPassword').value
    const user = findUser(identity)
    if (user && user.password !== password) {
      setFieldState($('#loginPassword'), 'Mật khẩu không đúng, vui lòng thử lại')
      return
    }
    if (!user) {
      setFieldState(
        $('#loginIdentity'),
        'Tài khoản chưa tồn tại, vui lòng đăng ký mới',
      )
      return
    }
    // Admin khoá tài khoản ở trang quản trị thì không cho đăng nhập.
    if (user.status === 'locked') {
      setFieldState(
        $('#loginIdentity'),
        'Tài khoản đã bị khoá, vui lòng liên hệ quản trị viên',
      )
      return
    }
    const remember = $('#loginRemember').checked
    // Phiên do store quản lý để mọi trang đều thấy đăng nhập, không tự đọc
    // localStorage ở đây nữa.
    SV.signIn(user, remember)
    showSuccess(
      `Xin chào, ${user.name}!`,
      'Bạn đã đăng nhập thành công. Chúc bạn có những trận đấu thật chất!',
      homeUrl(),
    )
  })

  forms.register.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!validateForm(forms.register)) return
    const email = $('#regEmail').value.trim()
    const phone = digits($('#regPhone').value)
    // Báo trùng ngay khi gõ, không đợi qua bước OTP mới biết.
    const takenBy = SV.users().find(
      (u) =>
        String(u.email || '').toLowerCase() === email.toLowerCase() ||
        (phone && digits(u.phone) === phone),
    )
    if (takenBy) {
      setFieldState(
        takenBy.email && takenBy.email.toLowerCase() === email.toLowerCase()
          ? $('#regEmail')
          : $('#regPhone'),
        'Thông tin này đã được đăng ký trước đó',
      )
      return
    }
    await fakeRequest(forms.register)
    const result = SV.addUser({
      name: $('#regName').value.trim(),
      email,
      phone,
      password: $('#regPassword').value,
      role: $('input[name="role"]:checked').value,
    })
    if (!result.ok) {
      setFieldState($('#regEmail'), result.error || 'Không tạo được tài khoản')
      return
    }
    // Giữ lại tài khoản vừa tạo để bước OTP xác thực xong đăng nhập thẳng.
    registeredUser = result.user
    showOtp('register', email)
  })

  forms.forgot.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!validateForm(forms.forgot)) return
    const email = $('#forgotEmail').value.trim()
    await fakeRequest(forms.forgot)
    showOtp('reset', email)
  })

  forms.otp.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (readOtp().length < 6) {
      submitOtp()
      return
    }
    await fakeRequest(forms.otp, 700)
    submitOtp()
  })

  forms.newpass.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!validateForm(forms.newpass)) return
    const password = $('#newPassword').value
    const email = $('#forgotEmail').value.trim()
    await fakeRequest(forms.newpass)
    const user = findUser(email)
    if (user) SV.updateUser(user.id, { password })
    forms.newpass.reset()
    $('#newPassword').dispatchEvent(new Event('input'))
    toast('Đặt mật khẩu mới thành công, hãy đăng nhập lại')
    $('#loginIdentity').value = email
    setMode('login')
  })
}

function init() {
  const year = $('#year')
  if (year) year.textContent = String(new Date().getFullYear())

  // Tài khoản demo do store cung cấp sẵn, không tự tạo ở đây để tránh hai nơi
  // cùng ghi một danh sách và sinh ra bản ghi trùng.
  const demo = findUser(DEMO_USER.email)
  if (!demo) SV.addUser({ ...DEMO_USER })

  // Ô nhập tài khoản điền sẵn email đã "ghi nhớ" để bấm 1 phát là vào.
  const remembered = SV.remembered()
  if (remembered) {
    $('#loginRemember').checked = true
    $('#loginIdentity').value = remembered.email || ''
    const clearBtn = $('[data-clear="loginIdentity"]')
    if (clearBtn) clearBtn.hidden = !remembered.email
  }

  initTabs()
  initFields()
  initOtpInputs()
  initForms()
  initProfile({ toast })

  const hash = location.hash.slice(1)
  if (hash === 'profile') {
    if (SV.currentUser()) {
      openProfile()
      setMode('profile', { updateHash: false })
    } else {
      setMode('login', { updateHash: false })
      toast('Vui lòng đăng nhập để xem tài khoản của bạn')
    }
    return
  }
  setMode(hash === 'register' ? 'register' : 'login', { updateHash: false })
}

document.addEventListener('DOMContentLoaded', init)

/* ==================== TÀI KHOẢN CỦA TÔI (trước là src/profile.js) ====================
 * Panel "Tài khoản của tôi" trong src/auth.html: thông tin cá nhân + lịch sử
 * đặt sân. Mọi đọc/ghi đều đi qua store chung (SV) nên người dùng sửa ở đây
 * thì trang quản trị và trang chủ thấy ngay, không phải đăng nhập lại.
 */

const STATUS = {
  pending: { text: 'Chờ xử lý', cls: 'is-pending', icon: 'fa-hourglass-half' },
  confirmed: { text: 'Đã xác nhận', cls: 'is-confirmed', icon: 'fa-circle-check' },
  completed: { text: 'Đã hoàn thành', cls: 'is-completed', icon: 'fa-flag-checkered' },
  cancelled: { text: 'Đã huỷ', cls: 'is-cancelled', icon: 'fa-circle-xmark' },
}

const ROLE = {
  player: 'Người chơi',
  owner: 'Chủ sân',
  admin: 'Quản trị viên',
}

const ROLE_ICON = {
  player: 'fa-person-running',
  owner: 'fa-helmet-safety',
  admin: 'fa-user-shield',
}

/** Trạng thái cho phép người dùng tự huỷ (đơn đã hoàn thành thì giữ lại). */
const CANCELLED_BY_USER = ['pending', 'confirmed']

/** Số đơn mỗi trang ở khu vực lịch sử đặt sân. */
const PAGE_SIZE = 3

const state = {
  user: null,
  bookings: [],
  filter: 'all',
  search: '',
  page: 1,
}
let notify = () => {}

const esc = (v) => SV.escape(v)

function todayStr() {
  return SV.todayStr()
}

function isUpcoming(b) {
  if (b.status === 'cancelled' || b.status === 'completed' || !b.date) return false
  if (b.date > todayStr()) return true
  if (b.date < todayStr()) return false
  return Number(b.startHour || 0) >= new Date().getHours()
}

/**
 * Đơn đã thanh toán: chỉ tính theo cờ do trang thanh-toan.html ghi vào
 * (paid/paymentStatus). Đơn "để thanh toán sau" giữ nguyên Chưa thanh toán
 * cho tới khi người dùng thực sự đóng tiền, kể cả sau khi buổi đá hoàn thành.
 */
function isPaid(b) {
  return b.paid === true || b.paymentStatus === 'paid'
}

/** Trạng thái thanh toán hiển thị trên đơn: đã đóng, chưa đóng, chờ duyệt, trả tại quầy, hoàn tiền. */
const PAYMENT_STATUS = {
  paid: { text: 'Đã thanh toán', cls: 'is-paid', icon: 'fa-circle-check' },
  unpaid: { text: 'Chưa thanh toán', cls: 'is-unpaid', icon: 'fa-clock' },
  awaiting_payment: { text: 'Chờ xác nhận CK', cls: 'is-at-venue', icon: 'fa-clock' },
  pay_later: { text: 'Thanh toán sau', cls: 'is-at-venue', icon: 'fa-calendar-clock' },
  at_venue: { text: 'Trả tại quầy', cls: 'is-at-venue', icon: 'fa-shop' },
  refunded: { text: 'Đã hoàn tiền', cls: 'is-refunded', icon: 'fa-arrow-rotate-left' },
}

/** Mã phương thức do trang thanh toán lưu, đổi sang tên người dùng đọc được. */
const PAYMENT_METHODS = {
  momo: 'Ví MoMo',
  zalopay: 'Ví ZaloPay',
  vnpay: 'VNPay',
  bank: 'Chuyển khoản ngân hàng',
  bank_transfer: 'Chuyển khoản ngân hàng',
  cash: 'Tiền mặt tại quầy',
  at_court: 'Tại sân',
  pay_later: 'Để thanh toán sau',
}

function paymentState(b) {
  if (b.paymentStatus === 'refunded') return PAYMENT_STATUS.refunded
  if (isPaid(b)) return PAYMENT_STATUS.paid
  return PAYMENT_STATUS[b.paymentStatus] || PAYMENT_STATUS.unpaid
}

/** Dòng mô tả dưới mã đơn: phương thức + thời điểm thanh toán, hoặc thời điểm hoàn tiền. */
function paymentNote(b) {
  if (b.paymentStatus === 'refunded') {
    return b.refundAt ? `Hoàn tiền ${b.refundAt}` : 'Đã hoàn tiền'
  }
  if (!isPaid(b) || !b.paidAt) return ''
  const method = PAYMENT_METHODS[b.paymentMethod] || 'Ví điện tử'
  return `${method} · ${b.paidAt}`
}

function timeLabel(hour) {
  return SV.hourToHHMM(hour)
}

function formatDate(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value || ''
}

function createdLabel(value) {
  if (!value) return '—'
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(value)
}

/** Đơn của riêng người đang đăng nhập: ưu tiên userId, đơn cũ chỉ có SĐT thì khớp SĐT. */
function myBookings(user) {
  if (!user) return []
  const email = String(user.email || '').trim().toLowerCase()
  const phone = digits(user.phone)
  return SV.bookings().filter((b) => {
    if (user.id && b.userId && b.userId === user.id) return true
    const bEmail = String(b.customer?.email || '').trim().toLowerCase()
    if (email && bEmail) return bEmail === email
    if (phone && digits(b.customer?.phone)) return digits(b.customer.phone) === phone
    return false
  })
}

function sortBookings(list, upcomingFirst) {
  const dir = upcomingFirst ? 1 : -1
  return list.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -dir : dir
    return (Number(a.startHour) - Number(b.startHour)) * dir
  })
}

function statsHtml(list) {
  const total = list.length
  const upcoming = list.filter(isUpcoming).length
  const done = list.filter((b) => b.status === 'completed').length
  const spent = list
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.total) || 0), 0)
  return `
    <div class="acc-stat">
      <i class="fa-solid fa-receipt"></i>
      <b>${total}</b><span>Tổng đơn</span>
    </div>
    <div class="acc-stat is-upcoming">
      <i class="fa-solid fa-bolt"></i>
      <b>${upcoming}</b><span>Sắp diễn ra</span>
    </div>
    <div class="acc-stat is-done">
      <i class="fa-solid fa-circle-check"></i>
      <b>${done}</b><span>Hoàn thành</span>
    </div>
    <div class="acc-stat is-money">
      <i class="fa-solid fa-wallet"></i>
      <b>${spent.toLocaleString('vi-VN')}<small>đ</small></b><span>Tổng chi tiêu</span>
    </div>
  `
}

function matchesFilter(b, filter) {
  if (filter === 'all') return true
  if (filter === 'upcoming') return isUpcoming(b)
  if (filter === 'processing') return b.status === 'pending'
  if (filter === 'done') return b.status === 'completed'
  if (filter === 'incomplete') return b.status === 'pending' || b.status === 'confirmed'
  if (filter === 'cancelled') return b.status === 'cancelled'
  if (filter === 'paid') return isPaid(b)
  if (filter === 'unpaid') return !isPaid(b) && b.status !== 'cancelled'
  return b.status === filter
}

function matchesSearch(b, keyword) {
  if (!keyword) return true
  const hay = [
    b.fieldName,
    b.courtName,
    b.fieldId,
    b.id,
    b.customer?.name,
    b.voucherCode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(keyword)
}

/** Nhãn "Đặt định kỳ · Hàng tuần · 12 buổi" — rỗng với đơn đặt thường. */
function repeatLine(b) {
  const repeat = String(b.repeat || 'none')
  if (repeat === 'none') return ''
  const count = Number(b.repeatCount) || 1
  const label = REPEAT_LABEL[repeat] || repeat
  return `<span><i class="fa-solid fa-repeat"></i> ${esc(label)}${count > 1 ? ` · ${count} buổi` : ''}</span>`
}

function cardHtml(b) {
  const st = STATUS[b.status] || STATUS.pending
  const start = Number(b.startHour) || 0
  const end = Number(b.endHour) > start ? Number(b.endHour) : start + (Number(b.duration) || 1)
  const duration = Math.max(1, Math.round((end - start) * 10) / 10)
  const canCancel = CANCELLED_BY_USER.includes(b.status)
  const paid = isPaid(b)
  const pay = paymentState(b)
  const payNote = paymentNote(b)
  // Đơn để thanh toán sau (hoặc chọn trả tại quầy) vẫn đóng tiền online được.
  const canPay = Boolean(b.id) && b.status !== 'cancelled' && !paid && b.paymentStatus !== 'refunded'
  const discount = Number(b.discount) || 0
  const total = Number(b.total) || 0
  const contact = [b.customer?.name, b.customer?.phone].filter(Boolean).join(' · ')
  const rebook = `../index.html#tim-san`

  return `
    <article class="acc-item">
      <div class="acc-item-main">
        <div class="acc-item-head">
          <h4 class="acc-item-name">${esc(b.fieldName || b.courtName || 'Sân bóng đá')}</h4>
          <span class="acc-badge ${st.cls}">
            <i class="fa-solid ${st.icon}"></i> ${st.text}
          </span>
        </div>
        <div class="acc-item-meta">
          <span><i class="fa-regular fa-calendar"></i> ${esc(formatDate(b.date))}</span>
          <span><i class="fa-regular fa-clock"></i> ${esc(timeLabel(start))} – ${esc(timeLabel(end))}</span>
          <span><i class="fa-solid fa-hourglass-half"></i> ${duration} giờ</span>
          <span><i class="fa-solid fa-location-dot"></i> ${esc(b.fieldId || b.courtId || '—')}</span>
          ${repeatLine(b)}
        </div>
        <div class="acc-item-code">
          Mã đơn <b>${esc(b.id)}</b>${contact ? ` · ${esc(contact)}` : ''}
          ${b.voucherCode ? ` · Voucher <b>${esc(b.voucherCode)}</b>` : ''}
        </div>
        ${payNote ? `<div class="acc-item-paynote"><i class="fa-solid fa-receipt"></i> ${esc(payNote)}</div>` : ''}
      </div>
      <div class="acc-item-side">
        <div class="acc-item-price">
          ${total.toLocaleString('vi-VN')}đ
          ${discount > 0 ? `<small>-${discount.toLocaleString('vi-VN')}đ</small>` : ''}
        </div>
        <span class="acc-item-pay ${pay.cls}">
          <i class="fa-solid ${pay.icon}"></i> ${pay.text}
        </span>
        <div class="acc-item-actions">
          ${
            canPay
              ? `<a class="acc-pay" href="thanh-toan.html?ma=${encodeURIComponent(b.id)}">
                   <i class="fa-solid fa-wallet"></i> ${
                     b.paymentStatus === 'at_venue' ? 'Thanh toán online' : 'Thanh toán ngay'
                   }
                 </a>`
              : ''
          }
          ${
            canCancel
              ? `<button type="button" class="acc-cancel" data-cancel="${esc(b.id)}">
                   <i class="fa-solid fa-xmark"></i> Huỷ
                 </button>`
              : ''
          }
          <a class="acc-rebook" href="${rebook}">
            <i class="fa-solid fa-rotate-right"></i> Đặt lại
          </a>
        </div>
      </div>
    </article>
  `
}

function emptyHtml(title, sub) {
  return `
    <div class="acc-empty">
      <i class="fa-solid fa-calendar-xmark"></i>
      <p class="acc-empty-title">${esc(title)}</p>
      <p class="acc-empty-sub">${esc(sub)}</p>
      <a class="btn-book" href="../index.html#tim-san">
        <i class="fa-solid fa-futbol"></i> Đặt sân ngay
      </a>
    </div>
  `
}

function filteredBookings() {
  return state.bookings
    .filter((b) => matchesFilter(b, state.filter))
    .filter((b) => matchesSearch(b, state.search))
}

function pagerHtml(page, pageCount) {
  if (pageCount <= 1) return ''
  const buttons = []
  buttons.push(`
    <button type="button" class="acc-page" data-page="${page - 1}" ${
      page <= 1 ? 'disabled' : ''
    } aria-label="Trang trước">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `)
  for (let i = 1; i <= pageCount; i += 1) {
    buttons.push(`
      <button type="button" class="acc-page ${i === page ? 'is-active' : ''}" data-page="${i}">
        ${i}
      </button>
    `)
  }
  buttons.push(`
    <button type="button" class="acc-page" data-page="${page + 1}" ${
      page >= pageCount ? 'disabled' : ''
    } aria-label="Trang sau">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `)
  return buttons.join('')
}

function renderHistory() {
  const box = $('#accHistory')
  if (!box) return
  const pager = $('#accPager')

  const list = filteredBookings()
  if (list.length === 0) {
    if (state.bookings.length === 0) {
      box.innerHTML = emptyHtml(
        'Chưa có đơn đặt sân nào',
        'Đặt sân ở trang chủ, đơn sẽ hiện ở đây kèm trạng thái và mã đơn.',
      )
    } else {
      box.innerHTML = emptyHtml(
        'Không có đơn nào phù hợp',
        'Thử đổi bộ lọc hoặc từ khoá tìm kiếm khác nhé.',
      )
    }
    if (pager) pager.innerHTML = ''
    return
  }

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  state.page = Math.min(Math.max(1, state.page), pageCount)

  const upcomingFirst = state.filter === 'upcoming'
  const sorted = sortBookings(list, upcomingFirst)
  const startIdx = (state.page - 1) * PAGE_SIZE
  box.innerHTML = sorted.slice(startIdx, startIdx + PAGE_SIZE).map(cardHtml).join('')

  if (pager) pager.innerHTML = pagerHtml(state.page, pageCount)
}

function renderStats() {
  const box = $('#accStats')
  if (box) box.innerHTML = statsHtml(state.bookings)
}

function renderProfile() {
  const user = state.user
  if (!user) return

  const label = user.name || user.email || 'Tài khoản'
  const title = $('#accTitle')
  const mail = $('#accMail')
  if (title) title.textContent = label
  if (mail) mail.textContent = user.email || 'Chưa cập nhật email'

  const avatar = $('#accAvatar')
  if (avatar) {
    // Không có avatar thì lấy chữ cái đầu, không gọi mạng bên ngoài.
    const initial = label.trim().charAt(0).toUpperCase() || '4'
    avatar.src = user.avatar || `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#16a34a"/><text x="48" y="62" font-family="sans-serif" font-size="42" fill="#fff" text-anchor="middle">${initial}</text></svg>`,
    )}`
    avatar.alt = label
  }

  const nameInput = $('#accName')
  const phoneInput = $('#accPhone')
  if (nameInput && nameInput.value !== (user.name || '')) nameInput.value = user.name || ''
  if (phoneInput && phoneInput.value !== (user.phone || '')) phoneInput.value = user.phone || ''

  const email = $('#accEmail')
  const role = $('#accRole')
  const created = $('#accCreated')
  if (email) email.value = user.email || ''
  if (role) {
    const key = user.role || 'player'
    role.innerHTML = `<i class="fa-solid ${ROLE_ICON[key] || ROLE_ICON.player}"></i> ${
      ROLE[key] || ROLE.player
    }`
  }
  if (created) {
    created.innerHTML = `<i class="fa-regular fa-calendar-check"></i> ${esc(createdLabel(user.createdAt))}`
  }
}

/** Nạp lại từ store: dùng khi mở panel và khi store báo có thay đổi. */
function refresh() {
  state.user = SV.currentUser()
  if (!state.user) return false
  state.bookings = myBookings(state.user)
  renderProfile()
  renderStats()
  renderHistory()
  return true
}

/* ---------- VALIDATION ---------- */
function setFieldError(input, message) {
  const field = input.closest('.acc-field')
  const error = $(`[data-error-for="${input.id}"]`)
  if (field) {
    field.classList.toggle('is-invalid', Boolean(message))
    field.classList.toggle('is-valid', !message && input.value.trim() !== '')
  }
  if (error) {
    error.innerHTML = message ? `<i class="fa-solid fa-circle-exclamation"></i> ${message}` : ''
    error.hidden = !message
  }
  input.setAttribute('aria-invalid', String(Boolean(message)))
}

function validateProfileForm() {
  const nameInput = $('#accName')
  const phoneInput = $('#accPhone')
  let firstBad = null

  const name = nameInput.value.trim()
  if (name.length < 2) {
    setFieldError(nameInput, 'Họ tên phải có ít nhất 2 ký tự')
    if (!firstBad) firstBad = nameInput
  } else if (/\d/.test(name)) {
    setFieldError(nameInput, 'Họ tên không được chứa chữ số')
    if (!firstBad) firstBad = nameInput
  } else {
    setFieldError(nameInput, '')
  }

  const phone = digits(phoneInput.value)
  if (!/^0?\d{9,10}$/.test(phone)) {
    setFieldError(phoneInput, 'Số điện thoại phải có 9-10 chữ số')
    if (!firstBad) firstBad = phoneInput
  } else {
    setFieldError(phoneInput, '')
  }

  if (firstBad) firstBad.focus()
  return !firstBad
}

function saveProfile() {
  if (!state.user) return
  if (!validateProfileForm()) return

  const name = $('#accName').value.trim()
  const phone = digits($('#accPhone').value)

  // SĐT là cách nhận diện thứ hai nên phải trùng với tài khoản khác thì báo.
  const taken = SV.users().find((u) => u.id !== state.user.id && digits(u.phone) === phone)
  if (taken) {
    setFieldError($('#accPhone'), 'Số điện thoại này đã thuộc tài khoản khác')
    return
  }

  const result = SV.updateUser(state.user.id, { name, phone })
  if (!result.ok) {
    notify(result.error || 'Không lưu được thông tin')
    return
  }
  // Tên trong header và phiên đăng nhập lấy từ users(), nên chỉ cần ghi là cả hai
  // trang tự đổi theo.
  refresh()
  notify('Đã cập nhật thông tin cá nhân')
}

function cancelBooking(id) {
  const booking = SV.booking(id)
  if (!booking) {
    notify('Không tìm thấy đơn')
    return
  }
  if (!CANCELLED_BY_USER.includes(booking.status)) {
    notify('Chỉ huỷ được đơn đang chờ xử lý hoặc đã xác nhận')
    return
  }
  const result = SV.setBookingStatus(id, 'cancelled')
  if (!result.ok) {
    notify(result.error || 'Không huỷ được đơn')
    return
  }
  refresh()
  notify(`Đã huỷ đơn ${id}`)
}

/**
 * Gắn panel vào trang. `toast` được truyền từ auth.js để hai màn hình dùng
 * chung một kiểu thông báo.
 */
function initProfile({ toast } = {}) {
  notify = typeof toast === 'function' ? toast : () => {}
  const panel = $('#panelProfile')
  if (!panel) return

  const form = $('#profileForm')
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      saveProfile()
    })

    $$('.acc-input', form).forEach((input) => {
      input.addEventListener('input', () => {
        if (input.closest('.acc-field')?.classList.contains('is-invalid')) {
          setFieldError(input, '')
        }
      })
      input.addEventListener('blur', () => {
        if (input.id === 'accName' || input.id === 'accPhone') validateProfileForm()
      })
    })
  }

  const logout = $('#accLogout')
  if (logout) logout.addEventListener('click', () => {
    SV.signOut()
    location.href = 'auth.html#login'
  })

  const filters = $('#accFilters')
  if (filters) filters.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]')
    if (!chip) return
    state.filter = chip.dataset.filter
    state.page = 1
    $$('[data-filter]', filters).forEach((el) => el.classList.toggle('is-active', el === chip))
    renderHistory()
  })

  const search = $('#accSearch')
  if (search) {
    let debounce = null
    search.addEventListener('input', () => {
      clearTimeout(debounce)
      debounce = setTimeout(() => {
        state.search = search.value.trim().toLowerCase()
        state.page = 1
        renderHistory()
      }, 160)
    })
  }

  const history = $('#accHistory')
  if (history) history.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]')
    if (btn) cancelBooking(btn.dataset.cancel)
  })

  const pager = $('#accPager')
  if (pager) pager.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-page]')
    if (!btn || btn.disabled) return
    state.page = Number(btn.dataset.page)
    renderHistory()
    $('#accHistory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })

  // Admin đổi trạng thái đơn ở tab khác thì lịch sử tự làm mới.
  SV.on(() => {
    if (!panel.hidden) refresh()
  })
}

/** Được auth.js gọi mỗi khi chuyển sang panel tài khoản. */
function openProfile() {
  state.filter = 'all'
  state.search = ''
  state.page = 1
  const search = $('#accSearch')
  if (search) search.value = ''
  const filters = $('#accFilters')
  if (filters) {
    $$('[data-filter]', filters).forEach((el) =>
      el.classList.toggle('is-active', el.dataset.filter === 'all'),
    )
  }
  return refresh()
}

function hasProfilePanel() {
  return Boolean($('#panelProfile'))
}
