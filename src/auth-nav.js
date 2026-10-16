import { getUser, clearUser } from './session.js'

const AUTH_LINKS =
  '[data-auth-only], .nav-actions a[href*="auth.html#login"], .nav-actions a[href*="auth.html#register"]'

export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
}

export function toast(msg, type = 'success') {
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

/** Link tới trang đăng nhập, lấy theo href sẵn có trong navbar để đúng với mỗi trang. */
function authPageUrl() {
  const link = document.querySelector('.nav-actions a[href*="auth.html#login"]')
  return link ? link.getAttribute('href') : '/src/auth.html#login'
}

/**
 * Chưa đăng nhập: hiện nút Đăng nhập / Đăng ký.
 * Đã đăng nhập: ẩn 2 nút đó, thay bằng menu tài khoản.
 */
export function syncAuthNav({ accountUrl = '/src/tai-khoan.html' } = {}) {
  const user = getUser()
  const loggedIn = Boolean(user)
  const authUrl = authPageUrl()

  document.querySelectorAll(AUTH_LINKS).forEach((link) => {
    link.style.display = loggedIn ? 'none' : ''
  })

  const actions = document.querySelector('.nav-actions')
  if (!actions) return

  let chip = actions.querySelector('.nav-user')

  if (!loggedIn) {
    chip?.remove()
    return
  }

  if (!chip) {
    chip = document.createElement('div')
    chip.className = 'nav-user dropdown'
    chip.innerHTML =
      '<button type="button" class="dropdown-toggle nav-user-btn"></button>' +
      '<div class="dropdown-menu nav-user-menu"></div>'
    chip.querySelector('.dropdown-toggle').addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const isOpen = chip.classList.contains('open')
      document.querySelectorAll('.dropdown.open').forEach((dd) => {
        if (dd !== chip) dd.classList.remove('open')
      })
      if (!isOpen) chip.classList.add('open')
    })
    document.addEventListener('click', (e) => {
      if (chip.isConnected && !e.target.closest('.nav-user')) chip.classList.remove('open')
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') chip.classList.remove('open')
    })
    chip.querySelector('.nav-user-menu').addEventListener('click', (e) => {
      if (e.target.closest('[data-logout]')) {
        clearUser()
        toast('Đã đăng xuất')
        window.location.href = authUrl.split('#')[0]
        return
      }
      if (e.target.closest('[data-account]')) {
        window.location.href = accountUrl
        return
      }
      if (e.target.closest('[data-switch]')) {
        clearUser()
        window.location.href = authUrl
      }
    })
    actions.insertBefore(chip, actions.firstChild)
  }

  const name = escapeHtml(user.name)
  chip.querySelector('.dropdown-toggle').innerHTML =
    `<i class="fa-solid fa-circle-user"></i> ${name}`
  chip.querySelector('.nav-user-menu').innerHTML =
    `<div class="nav-user-info"><strong>${name}</strong><span>${escapeHtml(user.email)}</span></div>` +
    `<a class="dropdown-item" href="#" data-account>Tài khoản của tôi</a>` +
    `<a class="dropdown-item" href="#" data-switch>Đổi tài khoản</a>` +
    '<button type="button" class="dropdown-item" data-logout>Đăng xuất</button>'
}