
/* 

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

const OTP_DEMO = '123456'
const RESEND_SECONDS = 60
const REDIRECT_MS = 2000

const DEMO_USER = {
  name: 'Nguyễn Minh Tuấn',
  email: 'demo@4sv.vn',
  phone: '0912345678',
  password: '123456',
  role: 'player',
}

function toast(message, type = 'success') {
  const el = document.createElement('div')
  el.className = 'toast-4sv' + (type === 'error' ? ' toast-error' : '')
  el.textContent = message
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 250)
  }, 2600)
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim())
const isPhone = (v) => /^0?\d{9,10}$/.test(v.replace(/[\s.-]/g, ''))
const digits = (v) => String(v || '').replace(/\D/g, '')

let mode = 'login'
let otpContext = 'register'
let otpTarget = ''
let resendTimer = null
let redirectTimer = null

/* ---------- CHUYỂN MÀN HÌNH ---------- */
function setMode(next, { updateHash = true } = {}) {
  mode = next
  const panels = $$('[data-panel]')
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== next
  })


  // Cập nhật Header Action CTA & Showcase Panel Text
  const headerNote = $('#headerSwitchNote')
  const headerCta = $('#headerSwitchCta')
  const showcaseBadge = $('#showcaseBadge')
  const showcaseTitle = $('#showcaseTitle')
  const showcaseDesc = $('#showcaseDesc')


  if (next === 'register') {
    document.title = 'Đăng Ký Tài Khoản - 4SV.vn'
    if (headerNote) headerNote.textContent = 'Đã có tài khoản?'
    if (headerCta) {
      headerCta.textContent = 'Đăng nhập ngay'
      headerCta.href = '#login'
    }
    if (showcaseBadge) {
      showcaseBadge.innerHTML = '<span>🚀 Khởi Tạo Hệ Thống Thể Thao All-In-One</span>'
    }
    if (showcaseTitle) {
      showcaseTitle.innerHTML = 'Tạo tài khoản quản trị <span>chỉ trong 1 phút</span>'
    }
    if (showcaseDesc) {
      showcaseDesc.textContent = 'Trải nghiệm đầy đủ ba bộ công cụ quản lý giải đấu, quản lý đội thể thao và vận hành cụm sân hoàn toàn miễn phí trên nền tảng 4SV.vn.'
    }
  } else if (next === 'login') {
    document.title = 'Đăng Nhập - 4SV.vn'
    if (headerNote) headerNote.textContent = 'Chưa có tài khoản?'
    if (headerCta) {
      headerCta.textContent = 'Đăng ký ngay'
      headerCta.href = '#register'
    }
    if (showcaseBadge) {
      showcaseBadge.innerHTML = '<span>🏆 4SV.vn All-In-One Sports Platform</span>'
    }
    if (showcaseTitle) {
      showcaseTitle.innerHTML = 'Nền tảng quản lý <span>Giải đấu, Đội bóng &amp; Cụm sân</span>'
    }
    if (showcaseDesc) {
      showcaseDesc.textContent = 'Giải pháp chuyển đổi số thể thao toàn diện — đồng bộ dữ liệu tức thì giữa ban tổ chức giải đấu, ban quản lý đội thể thao và chủ cụm sân trên một hệ thống duy nhất.'
    }
  } else if (next === 'profile') {
    document.title = 'Tài Khoản Của Tôi - 4SV.vn'
    if (headerNote) headerNote.textContent = 'Xin chào'
    if (headerCta) {
      headerCta.textContent = 'Về trang chủ'
      headerCta.href = '../index.html'
    }
    renderProfile()
  }

  if (updateHash && ['login', 'register', 'forgot', 'profile'].includes(next)) {
    history.replaceState(null, '', `#${next}`)
  }
}


/* ---------- PASSWORD STRENGTH (FAGLEAGUE REPLICA) ---------- */
function calcStrength(pass) {
  if (!pass) return { score: 0, text: 'Nhập mật khẩu để kiểm tra độ mạnh', color: '#94a3b8' }


  let score = 0
  if (pass.length >= 6) score += 25
  if (pass.length >= 10) score += 25
  if (/[0-9]/.test(pass)) score += 25
  if (/[^A-Za-z0-9]/.test(pass)) score += 25

  if (score <= 25) {
    return {
      score,
      text: 'Mật khẩu Yếu (Nên dài trên 8 ký tự và bao gồm số)',
      color: '#ef4444'
    }
  } else if (score <= 75) {
    return {
      score,
      text: 'Mật khẩu Trung Bình (Thêm ký tự đặc biệt để an toàn hơn)',
      color: '#d97706'
    }
  } else {
    return {
      score: 100,
      text: 'Mật khẩu Rất Mạnh! Bạn có thể yên tâm sử dụng',
      color: '#059669'
    }
  }
}

function bindPasswordStrength() {
  const input = $('#regPass')
  const fill = $('#strengthBarFill')
  const text = $('#strengthText')
  if (!input || !fill || !text) return

  input.addEventListener('input', () => {
    const { score, text: t, color } = calcStrength(input.value)
    fill.style.width = score + '%'
    fill.style.backgroundColor = color
    text.textContent = t
    text.style.color = color
  })
}

/* ---------- TOGGLE EYE PASSWORDS ---------- */
function bindEyeToggles() {
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle-pass]')
    if (!toggle) return
    const id = toggle.dataset.togglePass
    const input = document.getElementById(id)
    if (!input) return
    const isPass = input.type === 'password'
    input.type = isPass ? 'text' : 'password'
    toggle.innerHTML = isPass
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
  })
}

/* ---------- LOGIN TAB SWITCHER (Tài Khoản / QR) ---------- */
function bindLoginTabs() {
  const tabs = $$('#loginAuthTabs .auth-tab-btn')
  const accTab = $('#accountTab')
  const qrTab = $('#qrTab')
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')
      const which = tab.dataset.tab
      if (which === 'qr') {
        if (accTab) accTab.style.display = 'none'
        if (qrTab) qrTab.style.display = 'block'
      } else {
        if (accTab) accTab.style.display = 'block'
        if (qrTab) qrTab.style.display = 'none'
      }
    })
  })
}

/* ---------- OTP INPUTS ---------- */
function bindOtp() {
  const boxes = $$('[data-otp] input')
  const form = $('#otpForm')
  const error = $('[data-error-for="otp"]')
  const resend = $('#btnResendOtp')

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = digits(box.value).slice(-1)
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus()
      const code = boxes.map((b) => b.value).join('')
      if (code.length === 6) form?.requestSubmit()
    })
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) boxes[i - 1].focus()
    })
  })

  resend?.addEventListener('click', () => {
    boxes.forEach((b) => (b.value = ''))
    boxes[0]?.focus()
    toast(`Đã gửi lại mã xác thực tới ${otpTarget}`)
  })
}

/* ---------- USERS STORE INTERFACE ---------- */
function findUser(identity) {
  const key = identity.trim().toLowerCase()
  const phone = digits(identity)
  return (
    window.SV?.users().find(
      (u) =>
        String(u.email || '').toLowerCase() === key ||
        (phone && digits(u.phone) === phone)
    ) || null
  )
}


function setError(id, msg) {
  const el = $(`[data-error-for="${id}"]`)
  if (el) el.textContent = msg || ''
  const input = document.getElementById(id)
  if (input) {
    input.closest('.form-group')?.classList.toggle('has-error', !!msg)
  }

}

/* ---------- PROFILE VIEW ---------- */
function renderProfile() {
  const user = window.SV?.currentUser()
  if (!user) {
    setMode('login')
    return
  }
  const nameEl = $('#pfName')
  const emailEl = $('#pfEmail')
  const roleEl = $('#pfRole')
  const listEl = $('#pfBookingsList')

  if (nameEl) nameEl.textContent = user.name || 'Tài khoản'
  if (emailEl) emailEl.textContent = user.email || user.phone || ''
  if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Quản trị viên' : (user.role === 'owner' ? 'Chủ sân' : 'Người chơi')

  const bookings = window.SV?.bookings() || []
  const my = bookings.filter((b) => b.userId === user.id || b.userName === user.name)

  if (listEl) {
    if (!my.length) {
      listEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Chưa có lịch đặt sân nào.</p>'
    } else {
      listEl.innerHTML = my.slice(0, 5).map((b) => `
        <div class="history-item">
          <div class="history-item-head">
            <strong>${b.courtName || 'Sân thể thao'}</strong>
            <span class="history-status is-${b.status || 'pending'}">${b.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xử lý'}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-sub);">
            <span><i class="fa-solid fa-calendar-days"></i> ${b.date || ''} (${b.startHour}:00 - ${b.endHour || b.startHour + 1}:00)</span> ·
            <strong style="color: var(--fag-red);">${(b.total || 0).toLocaleString('vi-VN')}đ</strong>
          </div>
        </div>
      `).join('')
    }
  }

  $('#btnPfLogout')?.addEventListener('click', () => {
    window.SV?.signOut()
    toast('Đã đăng xuất thành công')
    setTimeout(() => {
      window.location.href = '../index.html'
    }, 500)
  })
}

/* ---------- FORMS SUBMISSION ---------- */
function bindForms() {
  // Login Form
  $('#loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    setError('loginIdentity', '')
    setError('loginPass', '')

    const identity = $('#loginIdentity')?.value?.trim() || ''
    const password = $('#loginPass')?.value || ''

    if (!identity) {
      setError('loginIdentity', 'Vui lòng nhập email hoặc số điện thoại')
      return
    }
    if (!password) {
      setError('loginPass', 'Vui lòng nhập mật khẩu')
      return
    }

    const user = findUser(identity)
    if (!user) {
      setError('loginIdentity', 'Tài khoản chưa tồn tại, vui lòng đăng ký mới')
      return
    }
    if (user.password !== password) {
      setError('loginPass', 'Mật khẩu không chính xác, vui lòng thử lại')
      return
    }
    if (user.status === 'locked') {
      setError('loginIdentity', 'Tài khoản đã bị khoá, vui lòng liên hệ quản trị viên')
      return
    }

    const remember = $('#loginRemember')?.checked
    window.SV?.signIn(user, remember)
    toast(`Xin chào, ${user.name}! Đăng nhập thành công.`)

    setTimeout(() => {
      window.location.href = '../index.html'
    }, 900)
  })

  // Register Form
  $('#registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    setError('regName', '')
    setError('regEmail', '')
    setError('regPhone', '')
    setError('regPass', '')

    const name = $('#regName')?.value?.trim() || ''
    const email = $('#regEmail')?.value?.trim() || ''
    const phone = digits($('#regPhone')?.value || '')
    const pass = $('#regPass')?.value || ''

    if (!name || name.length < 2) {
      setError('regName', 'Vui lòng nhập họ tên đầy đủ (tối thiểu 2 ký tự)')
      return
    }
    if (!isEmail(email)) {
      setError('regEmail', 'Email không đúng định dạng')
      return
    }
    if (!phone || phone.length < 9) {
      setError('regPhone', 'Số điện thoại phải có 9 - 10 chữ số')
      return
    }
    if (!pass || pass.length < 6) {
      setError('regPass', 'Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    const taken = window.SV?.users().find(
      (u) =>
        String(u.email || '').toLowerCase() === email.toLowerCase() ||
        (phone && digits(u.phone) === phone)
    )
    if (taken) {
      setError('regEmail', 'Email hoặc số điện thoại này đã được đăng ký trước đó')
      return
    }

    const result = window.SV?.addUser({
      name,
      email,
      phone,
      password: pass,
      role: 'player',
    })

    if (!result?.ok) {
      setError('regEmail', result?.error || 'Không tạo được tài khoản')
      return
    }

    otpTarget = email
    $('#otpSubtitle').textContent = `Nhập mã 6 chữ số gửi đến ${email} (Mã demo: 123456)`
    setMode('otp')
    toast('Mã OTP đã được gửi (Mã demo: 123456)')
  })

  // Forgot Form
  $('#forgotForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    setError('forgotIdentity', '')
    const id = $('#forgotIdentity')?.value?.trim() || ''
    if (!id) {
      setError('forgotIdentity', 'Vui lòng nhập email hoặc số điện thoại')
      return
    }
    const user = findUser(id)
    if (!user) {
      setError('forgotIdentity', 'Không tìm thấy tài khoản với thông tin này')
      return
    }
    otpTarget = user.email || user.phone
    $('#otpSubtitle').textContent = `Nhập mã xác thực gửi tới ${otpTarget} (Mã demo: 123456)`
    setMode('otp')
    toast('Mã OTP đã gửi (demo: 123456)')
  })

  // OTP Form
  $('#otpForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const boxes = $$('[data-otp] input')
    const code = boxes.map((b) => b.value).join('')
    const err = $('[data-error-for="otp"]')
    if (code !== OTP_DEMO) {
      if (err) err.textContent = 'Mã OTP không đúng, vui lòng thử lại (mã demo: 123456)'
      return
    }
    if (err) err.textContent = ''
    toast('Xác thực OTP thành công!')

    if (otpContext === 'register') {
      const u = findUser(otpTarget)
      if (u) window.SV?.signIn(u, true)
      setTimeout(() => {
        window.location.href = '../index.html'
      }, 1000)
    } else {
      setMode('newpass')
    }
  })

  // New Pass Form
  $('#newPassForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    setError('newPassInput', '')
    setError('newPassConfirm', '')
    const p1 = $('#newPassInput')?.value || ''
    const p2 = $('#newPassConfirm')?.value || ''
    if (p1.length < 6) {
      setError('newPassInput', 'Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (p1 !== p2) {
      setError('newPassConfirm', 'Mật khẩu xác nhận không khớp')
      return
    }
    const u = findUser(otpTarget)
    if (u) window.SV?.updateUser(u.id, { password: p1 })
    toast('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
    setMode('login')
  })

  // Social OAuth buttons
  $$('[data-oauth]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toast(`Đăng nhập bằng ${btn.dataset.oauth.toUpperCase()} đang được kết nối`)
    })
  })
}

/* ---------- ROUTING HASH ---------- */
function initRouting() {
  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1)
    if (['login', 'register', 'forgot', 'otp', 'newpass', 'profile'].includes(hash)) {
      setMode(hash, { updateHash: false })
    }
  })

  const initial = location.hash.slice(1)
  if (initial && ['login', 'register', 'forgot', 'otp', 'newpass', 'profile'].includes(initial)) {
    setMode(initial, { updateHash: false })
  } else {
    // Nếu đã đăng nhập, vào profile; nếu chưa thì vào login
    const cur = window.SV?.currentUser()
    setMode(cur ? 'profile' : 'login', { updateHash: false })
  }


}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Đảm bảo demo user có trong store
  const demo = findUser(DEMO_USER.email)
  if (!demo) window.SV?.addUser({ ...DEMO_USER })

  bindLoginTabs()
  bindEyeToggles()
  bindPasswordStrength()
  bindOtp()
  bindForms()
  initRouting()
})
