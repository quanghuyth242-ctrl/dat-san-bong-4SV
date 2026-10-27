import './style.css'
import './info-pages.css'
import { syncAuthNav } from './auth-nav.js'

/**
 * Trang giới thiệu 4SV.vn.
 * Số liệu hiển thị lấy từ store chung (SV.fields()) để không lệch với trang chủ
 * và trang quản trị. Toàn bộ nội dung giới thiệu nằm trong gioi-thieu.html.
 */

/** Số liệu thật của các cơ sở đang mở đặt sân. */
function datasetStats() {
  if (!window.SV || typeof SV.fields !== 'function') {
    return { venues: 0, courts: 0, types: 0 }
  }
  const fields = SV.fields().filter((f) => f.status === 'active')
  const types = new Set(fields.map((f) => String(f.type ?? '').match(/\d+/)?.[0] || '7'))
  return {
    venues: fields.length,
    courts: fields.reduce((sum, f) => sum + Math.max(1, parseInt(f.courts, 10) || 1), 0),
    types: types.size,
  }
}

function applyStats() {
  const stats = datasetStats()
  document.querySelectorAll('[data-about-stat]').forEach((el) => {
    const key = el.getAttribute('data-about-stat')
    if (key in stats) el.textContent = String(stats[key])
  })
}

function applySettings() {
  if (!window.SV || typeof SV.settings !== 'function') return
  const s = SV.settings()
  if (s.siteName) {
    document.querySelectorAll('[data-site-name]').forEach((el) => {
      el.textContent = s.siteName
    })
    document.title = `Giới thiệu · ${s.siteName}`
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
  applyStats()
  initNav()
  syncAuthNav({ accountUrl: './tai-khoan.html' })

  // Admin sửa sân / giao diện ở tab khác thì số liệu ở đây đổi theo.
  if (window.SV && typeof SV.on === 'function') {
    SV.on((key) => {
      if (key === 'settings' || key === '*') applySettings()
      if (key === 'fields' || key === '*') applyStats()
    })
  }
}

document.addEventListener('DOMContentLoaded', init)
