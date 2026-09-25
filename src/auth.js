import './style.css'
import { renderHeader, renderFooter, setupNav } from './layout.js'

const USERS_KEY = 'dsbd_users'
const SESSION_KEY = 'dsbd_session'

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || []
  } catch {
    return []
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, name: user.name }))
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

function logo() {
  return `
  <svg class="logo-icon" viewBox="0 0 32 32" aria-hidden="true" role="presentation">
    <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M16 2v12M16 30V18M2 16h12M30 16H18" stroke="currentColor" stroke-width="2"/>
    <path d="M6 6l7 7M19 19l7 7M26 6l-7 7M13 19l-7 7" stroke="currentColor" stroke-width="2"/>
  </svg>`
}

const session = getSession()

document.querySelector('#app').innerHTML = `
  ${renderHeader('dang-nhap.html')}

  <main class="auth-main">
    <div class="auth-card">
      <div class="auth-hero">
        ${logo()}
        <h1>Đặt Sân Bóng Đá</h1>
        <p class="auth-hero-desc">
          Đăng nhập để quản lý lịch đặt sân, theo dõi giờ chơi yêu thích và đặt
          sân nhanh hơn mỗi lần ra sân.
        </p>
        <ul class="auth-points">
          <li>Đặt sân trong 2 phút</li>
          <li>Quản lý lịch đặt của bạn</li>
          <li>Ưu đãi dành riêng cho thành viên</li>
        </ul>
        <p class="auth-brand">Trải nghiệm bóng đá chuẩn chuyên nghiệp</p>
      </div>

      <div class="auth-panel">
        <div class="auth-tabs" role="tablist" aria-label="Đăng nhập hoặc đăng ký">
          <button type="button" class="auth-tab active" id="tabLogin" role="tab"
            aria-selected="true" aria-controls="panelLogin">Đăng nhập</button>
          <button type="button" class="auth-tab" id="tabRegister" role="tab"
            aria-selected="false" aria-controls="panelRegister">Đăng ký</button>
        </div>

        <section class="auth-form-wrap active" id="panelLogin" role="tabpanel" aria-labelledby="tabLogin">
          <p class="auth-title">Chào mừng trở lại</p>
          <p class="auth-sub">Đăng nhập để tiếp tục đặt sân của bạn.</p>
          <form id="loginForm" class="auth-form" novalidate>
            <label>
              Email
              <input type="email" name="email" required placeholder="ban@email.com" autocomplete="email" />
            </label>
            <label>
              Mật khẩu
              <input type="password" name="password" required placeholder="••••••••" autocomplete="current-password" />
            </label>
            <div class="auth-row">
              <label class="auth-check">
                <input type="checkbox" name="remember" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" class="auth-link" id="forgotLink">Quên mật khẩu?</a>
            </div>
            <button type="submit" class="btn btn-auth btn-block">Đăng nhập</button>
            <p id="loginMessage" class="auth-message" role="status"></p>
          </form>
        </section>

        <section class="auth-form-wrap" id="panelRegister" role="tabpanel" aria-labelledby="tabRegister" hidden>
          <p class="auth-title">Tạo tài khoản mới</p>
          <p class="auth-sub">Miễn phí tham gia - bắt đầu đặt sân ngay.</p>
          <form id="registerForm" class="auth-form" novalidate>
            <label>
              Họ và tên
              <input type="text" name="name" required placeholder="Nguyễn Văn A" autocomplete="name" />
            </label>
            <label>
              Email
              <input type="email" name="email" required placeholder="ban@email.com" autocomplete="email" />
            </label>
            <label>
              Số điện thoại
              <input type="tel" name="phone" required placeholder="0123 456 789" autocomplete="tel" />
            </label>
            <label>
              Mật khẩu
              <input type="password" name="password" required minlength="6" placeholder="Ít nhất 6 ký tự" autocomplete="new-password" />
            </label>
            <label>
              Nhập lại mật khẩu
              <input type="password" name="confirm" required minlength="6" placeholder="Nhập lại mật khẩu" autocomplete="new-password" />
            </label>
            <label class="auth-check">
              <input type="checkbox" name="terms" required />
              <span>Tôi đồng ý với <a href="#" class="auth-link">điều khoản sử dụng</a></span>
            </label>
            <button type="submit" class="btn btn-auth btn-block">Đăng ký tài khoản</button>
            <p id="registerMessage" class="auth-message" role="status"></p>
          </form>
        </section>
      </div>
    </div>
  </main>

  ${renderFooter()}
`

setupNav()

const tabs = {
  login: document.querySelector('#tabLogin'),
  register: document.querySelector('#tabRegister'),
}
const panels = {
  login: document.querySelector('#panelLogin'),
  register: document.querySelector('#panelRegister'),
}

function switchTab(name) {
  const isLogin = name === 'login'
  tabs.login.classList.toggle('active', isLogin)
  tabs.register.classList.toggle('active', !isLogin)
  tabs.login.setAttribute('aria-selected', String(isLogin))
  tabs.register.setAttribute('aria-selected', String(!isLogin))
  panels.login.hidden = !isLogin
  panels.register.hidden = isLogin
  panels.login.classList.toggle('active', isLogin)
  panels.register.classList.toggle('active', !isLogin)
}

tabs.login.addEventListener('click', () => switchTab('login'))
tabs.register.addEventListener('click', () => switchTab('register'))

document.querySelector('#forgotLink').addEventListener('click', (e) => {
  e.preventDefault()
  switchTab('register')
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^(0|\+84)[0-9]{9,10}$/

function setMessage(el, text, ok) {
  el.textContent = text
  el.classList.toggle('ok', ok)
  el.classList.toggle('error', !ok)
}

const loginForm = document.querySelector('#loginForm')
loginForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const msg = document.querySelector('#loginMessage')
  const formData = new FormData(loginForm)
  const email = formData.get('email').trim().toLowerCase()
  const password = formData.get('password')

  if (!loginForm.checkValidity()) {
    loginForm.reportValidity()
    return
  }

  const user = getUsers().find((u) => u.email === email && u.password === password)
  if (!user) {
    setMessage(msg, 'Email hoặc mật khẩu không đúng.', false)
    return
  }

  setSession(user)
  setMessage(msg, 'Đăng nhập thành công! Đang chuyển đến trang chủ...', true)
  setTimeout(() => {
    window.location.href = 'index.html'
  }, 900)
})

const registerForm = document.querySelector('#registerForm')
registerForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const msg = document.querySelector('#registerMessage')
  const formData = new FormData(registerForm)
  const name = formData.get('name').trim()
  const email = formData.get('email').trim().toLowerCase()
  const phone = formData.get('phone').trim()
  const password = formData.get('password')
  const confirm = formData.get('confirm')
  const terms = formData.get('terms')

  if (!registerForm.checkValidity()) {
    registerForm.reportValidity()
    return
  }
  if (!name) {
    setMessage(msg, 'Vui lòng nhập họ và tên.', false)
    return
  }
  if (!emailRegex.test(email)) {
    setMessage(msg, 'Email không hợp lệ.', false)
    return
  }
  if (!phoneRegex.test(phone)) {
    setMessage(msg, 'Số điện thoại không hợp lệ.', false)
    return
  }
  if (password.length < 6) {
    setMessage(msg, 'Mật khẩu phải có ít nhất 6 ký tự.', false)
    return
  }
  if (password !== confirm) {
    setMessage(msg, 'Mật khẩu nhập lại không khớp.', false)
    return
  }
  if (!terms) {
    setMessage(msg, 'Vui lòng đồng ý với điều khoản sử dụng.', false)
    return
  }

  const users = getUsers()
  if (users.some((u) => u.email === email)) {
    setMessage(msg, 'Email này đã được đăng ký. Vui lòng đăng nhập.', false)
    return
  }

  users.push({ name, email, phone, password })
  saveUsers(users)
  setMessage(msg, 'Đăng ký thành công! Vui lòng đăng nhập.', true)
  registerForm.reset()
  setTimeout(() => switchTab('login'), 900)
})

if (session && panels.login) {
  setMessage(
    document.querySelector('#loginMessage'),
    `Xin chào ${session.name}! Bạn đã đăng nhập.`,
    true
  )
}