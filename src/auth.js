const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

const OTP_DEMO = '123456'
const RESEND_SECONDS = 60
const REDIRECT_MS = 3000
const KEYS = {
  users: '4sv_auth_users',
  remember: '4sv_auth_remember',
  session: '4sv_auth_session',
}
const DEMO_USER = {
  name: 'Nguyễn Minh Tuấn',
  email: 'demo@4sv.vn',
  phone: '0912345678',
  password: '123456',
  role: 'player',
}

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage bị chặn - bỏ qua */
    }
  },
  del(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* storage bị chặn - bỏ qua */
    }
  },
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

/* ---------- CHUYỂN MÀN HÌNH ---------- */
function setMode(next, { updateHash = true, focus = true } = {}) {
  mode = next
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== next
  })

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
    showSuccess(
      'Tạo tài khoản thành công!',
      `Voucher giảm 20% đã gửi tới ${otpTarget}. Chào mừng bạn đến với 4SV.vn.`,
      '/',
    )
    return
  }
  setMode('newpass')
}

/* ---------- THÀNH CÔNG ---------- */
function showSuccess(title, desc, redirectTo) {
  $('[data-success-title]').textContent = title
  $('[data-success-desc]').textContent = desc
  setMode('success', { focus: false })
  clearTimeout(redirectTimer)
  if (redirectTo) {
    redirectTimer = setTimeout(() => {
      window.location.href = redirectTo
    }, REDIRECT_MS)
  }
}

/* ---------- NGƯỜI DÙNG (demo localStorage) ---------- */
function getUsers() {
  const users = store.get(KEYS.users, [])
  return Array.isArray(users) ? users : []
}

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
    const remember = $('#loginRemember').checked
    store.set(remember ? KEYS.remember : KEYS.session, {
      email: user.email,
      name: user.name,
      role: user.role,
      at: Date.now(),
    })
    showSuccess(
      `Xin chào, ${user.name}!`,
      'Bạn đã đăng nhập thành công. Chúc bạn có những trận đấu thật chất!',
      '/',
    )
  })

  forms.register.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!validateForm(forms.register)) return
    const email = $('#regEmail').value.trim()
    const users = getUsers()
    if (users.some((u) => String(u.email || '').toLowerCase() === email.toLowerCase())) {
      setFieldState($('#regEmail'), 'Email này đã được đăng ký trước đó')
      return
    }
    await fakeRequest(forms.register)
    users.push({
      name: $('#regName').value.trim(),
      email,
      phone: digits($('#regPhone').value),
      password: $('#regPassword').value,
      role: $('input[name="role"]:checked').value,
      createdAt: new Date().toISOString(),
    })
    store.set(KEYS.users, users)
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
    const users = getUsers()
    const user = users.find(
      (u) => String(u.email || '').toLowerCase() === email.toLowerCase(),
    )
    if (user) {
      user.password = password
      store.set(KEYS.users, users)
    }
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

  if (!getUsers().length) store.set(KEYS.users, [{ ...DEMO_USER }])

  const remembered = store.get(KEYS.remember, null)
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

  const hash = location.hash.slice(1)
  setMode(hash === 'register' ? 'register' : 'login', { updateHash: false })
}

document.addEventListener('DOMContentLoaded', init)
