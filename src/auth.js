/* ==========================================================================
   4SV.vn AUTH LOGIC - COMPLETE & DYNAMIC AUTHENTICATION SYSTEM
   ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

const OTP_DEMO = '123456'
const REDIRECT_MS = 900

const DEMO_USER = {
  name: 'Nguyễn Minh Tuấn',
  email: 'demo@4sv.vn',
  phone: '0912345678',
  password: '123456',
  role: 'player',
}

function toast(message, type = 'success') {
  const existing = document.querySelector('.toast-4sv')
  if (existing) existing.remove()

  const el = document.createElement('div')
  el.className = 'toast-4sv' + (type === 'error' ? ' toast-error' : '')
  const icon = type === 'error'
    ? '<i class="fa-solid fa-circle-exclamation"></i>'
    : '<i class="fa-solid fa-circle-check"></i>'
  el.innerHTML = `${icon}<span>${message}</span>`
  document.body.appendChild(el)

  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 320)
  }, 2800)
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || '').trim())
const isPhone = (v) => /^0?\d{9,10}$/.test(String(v || '').replace(/[\s.-]/g, ''))
const digits = (v) => String(v || '').replace(/\D/g, '')

let mode = 'login'
let otpContext = 'register'
let otpTarget = ''

/* ---------- NÚT LOADING SPINNER ---------- */
function setButtonLoading(btn, isLoading, loadingText = 'Đang xử lý...') {
  if (!btn) return
  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML
    btn.classList.add('is-loading')
    btn.disabled = true
    btn.innerHTML = `<span class="btn-spinner"></span> ${loadingText}`
  } else {
    btn.classList.remove('is-loading')
    btn.disabled = false
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText
    }
  }
}

/* ---------- CHUYỂN MÀN HÌNH MƯỢT MÀ ---------- */
function setMode(next, { updateHash = true } = {}) {
  mode = next

  // Ẩn tất cả panel, hiển thị panel mục tiêu kèm hiệu ứng animation
  const panels = $$('[data-panel]')
  panels.forEach((panel) => {
    const isTarget = panel.dataset.panel === next
    panel.hidden = !isTarget
    if (isTarget) {
      panel.classList.remove('panel-entering')
      void panel.offsetWidth // trigger reflow
      panel.classList.add('panel-entering')
    }
  })

  // Cập nhật Header Action CTA & Showcase Panel Text
  const headerNote = $('#headerSwitchNote')
  const headerCta = $('#headerSwitchCta')
  const showcaseBadge = $('#showcaseBadge')
  const showcaseTitle = $('#showcaseTitle')
  const showcaseDesc = $('#showcaseDesc')

  if (next === 'profile') {
    const cur = window.SV?.currentUser()
    if (!cur) {
      sessionStorage.setItem('auth_redirect_profile', '1')
      toast('Vui lòng đăng nhập để xem thông tin tài khoản!', 'error')
      setMode('login')
      return
    }
    $('.split-container')?.classList.add('is-profile-view')
    document.title = 'Tài Khoản Của Tôi - 4SV.com'
    if (headerNote) headerNote.textContent = 'Đang đăng nhập'
    if (headerCta) {
      headerCta.textContent = 'Về trang chủ'
      headerCta.href = '../index.html'
    }
    renderProfile()
  } else {
    $('.split-container')?.classList.remove('is-profile-view')
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
        showcaseTitle.innerHTML = 'Tạo tài khoản thành viên <span>chỉ trong 1 phút</span>'
      }
      if (showcaseDesc) {
        showcaseDesc.textContent = 'Trải nghiệm trọn vẹn nền tảng đặt sân thể thao thông minh, lưu lịch sử đặt sân và nhận ưu đãi độc quyền 4SV.vn.'
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
    } else if (next === 'forgot') {
      document.title = 'Quên Mật Khẩu - 4SV.vn'
      if (headerNote) headerNote.textContent = 'Nhớ mật khẩu?'
      if (headerCta) {
        headerCta.textContent = 'Đăng nhập ngay'
        headerCta.href = '#login'
      }
    } else if (next === 'otp') {
      document.title = 'Xác Thực OTP - 4SV.vn'
    } else if (next === 'newpass') {
      document.title = 'Mật Khẩu Mới - 4SV.vn'
    }
  }

  // Làm sạch query params (nếu người dùng vô tình bấm submit thường trước đó)
  if (updateHash && ['login', 'register', 'forgot', 'otp', 'newpass', 'profile'].includes(next)) {
    const cleanUrl = window.location.pathname + `#${next}`
    window.history.replaceState(null, '', cleanUrl)
  }
}

/* ---------- PASSWORD STRENGTH CHECKER ---------- */
function calcStrength(pass) {
  if (!pass) return { score: 0, text: 'Nhập mật khẩu để kiểm tra độ mạnh', color: '#94a3b8' }

  let score = 0
  if (pass.length >= 6) score += 25
  if (pass.length >= 8) score += 25
  if (/[0-9]/.test(pass)) score += 25
  if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 25

  if (score <= 25) {
    return {
      score,
      text: 'Mật khẩu Yếu (Nên có ít nhất 8 ký tự và gồm cả số)',
      color: '#ef4444'
    }
  } else if (score <= 75) {
    return {
      score,
      text: 'Mật khẩu Trung Bình (Thêm ký tự đặc biệt hoặc chữ hoa)',
      color: '#f59e0b'
    }
  } else {
    return {
      score: 100,
      text: 'Mật khẩu Rất Mạnh! An toàn tuyệt đối',
      color: '#10b981'
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

/* ---------- TOGGLE HIỆN / ẨN MẬT KHẨU ---------- */
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

/* ---------- CHUYỂN TAB ĐĂNG NHẬP (Tài Khoản / Mã QR) ---------- */
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
        if (qrTab) {
          qrTab.style.display = 'block'
          qrTab.classList.remove('panel-entering')
          void qrTab.offsetWidth
          qrTab.classList.add('panel-entering')
        }
      } else {
        if (accTab) {
          accTab.style.display = 'block'
          accTab.classList.remove('panel-entering')
          void accTab.offsetWidth
          accTab.classList.add('panel-entering')
        }
        if (qrTab) qrTab.style.display = 'none'
      }
    })
  })
}

/* ---------- XỬ LÝ NHẬP MÃ OTP THÔNG MINH ---------- */
function bindOtp() {
  const boxes = $$('[data-otp] input')
  const form = $('#otpForm')
  const resend = $('#btnResendOtp')
  const quickOtpBtn = $('#btnFillDemoOtp')

  boxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
      box.value = digits(box.value).slice(-1)
      if (box.value && i < boxes.length - 1) {
        boxes[i + 1].focus()
      }
      const code = boxes.map((b) => b.value).join('')
      if (code.length === 6) {
        form?.requestSubmit()
      }
    })

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].focus()
      }
    })

    // Hỗ trợ paste trọn bộ 6 số
    box.addEventListener('paste', (e) => {
      e.preventDefault()
      const text = digits(e.clipboardData.getData('text')).slice(0, 6)
      if (!text) return
      text.split('').forEach((ch, idx) => {
        if (boxes[idx]) boxes[idx].value = ch
      })
      if (text.length >= 6) {
        form?.requestSubmit()
      } else if (boxes[text.length]) {
        boxes[text.length].focus()
      }
    })
  })

  // Nút điền nhanh mã OTP demo
  quickOtpBtn?.addEventListener('click', () => {
    '123456'.split('').forEach((ch, idx) => {
      if (boxes[idx]) boxes[idx].value = ch
    })
    toast('Đã tự động điền mã OTP demo: 123456')
    setTimeout(() => {
      form?.requestSubmit()
    }, 300)
  })

  resend?.addEventListener('click', () => {
    boxes.forEach((b) => (b.value = ''))
    boxes[0]?.focus()
    toast(`Đã gửi lại mã xác thực tới ${otpTarget || 'bạn'} (Mã demo: 123456)`)
  })
}

/* ---------- TÌM TÀI KHOẢN TRONG STORE ---------- */
function findUser(identity) {
  if (!identity) return null
  if (window.SV?.findUser) {
    const hit = window.SV.findUser(identity)
    if (hit) return hit
  }
  const key = String(identity).trim().toLowerCase()
  const phone = digits(identity)
  const isDemo = key === 'demo@4sv.vn' || key === 'demo@4sv.com'
  const users = window.SV?.users() || []
  return (
    users.find(
      (u) =>
        String(u.email || '').toLowerCase() === key ||
        (isDemo && (String(u.email || '').toLowerCase() === 'demo@4sv.vn' || String(u.email || '').toLowerCase() === 'demo@4sv.com')) ||
        String(u.name || '').toLowerCase() === key ||
        (phone && phone.length >= 9 && digits(u.phone) === phone)
    ) || null
  )
}

function setError(id, msg) {
  const el = $(`[data-error-for="${id}"]`)
  if (el) el.textContent = msg || ''
  const input = document.getElementById(id)
  if (input) {
    const grp = input.closest('.form-group')
    if (grp) {
      grp.classList.toggle('has-error', Boolean(msg))
    }
  }
}

/* ---------- TRANG PROFILE CÁ NHÂN (TÀI KHOẢN CỦA TÔI) ---------- */
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&q=80',
]

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'

function formatDateVN(dateStr) {
  if (!dateStr) return 'Chưa cập nhật'
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return dateStr
}

function formatPriceVN(val) {
  const n = parseInt(val, 10) || 0
  return n.toLocaleString('vi-VN') + 'đ'
}

let profileInitialized = false
let currentHistoryFilter = 'all'

function renderProfile() {
  const user = window.SV?.currentUser()
  if (!user) {
    setMode('login')
    return
  }

  // 1. Hero banner
  const avatarEl = $('#pfAvatar')
  if (avatarEl) avatarEl.src = user.avatar || DEFAULT_AVATAR
  if ($('#pfHeroName')) $('#pfHeroName').textContent = user.name || 'Người dùng'
  if ($('#pfHeroUsernameTag')) $('#pfHeroUsernameTag').textContent = '@' + (user.username || (user.email ? user.email.split('@')[0] : 'user'))
  if ($('#pfHeroIdTag')) $('#pfHeroIdTag').textContent = 'Mã ND: ' + (user.id || 'ND001')
  if ($('#pfHeroRole')) {
    $('#pfHeroRole').innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${user.role === 'admin' ? 'Quản trị viên' : (user.role === 'owner' ? 'Chủ cụm sân' : 'Thành viên 4SV')}`
  }
  if ($('#pfHeroJoined')) {
    $('#pfHeroJoined').innerHTML = `<i class="fa-regular fa-calendar-check"></i> Tham gia: ${formatDateVN(user.createdAt)}`
  }
  const heroStatus = $('#pfHeroStatus')
  if (heroStatus) {
    if (user.status === 'locked') {
      heroStatus.className = 'pf-chip is-locked'
      heroStatus.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Bị khóa'
    } else {
      heroStatus.className = 'pf-chip is-active'
      heroStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đang hoạt động'
    }
  }

  // 2. Tab 1: Overview
  if ($('#ovName')) $('#ovName').textContent = user.name || '—'
  if ($('#ovUsername')) $('#ovUsername').textContent = user.username || (user.email ? user.email.split('@')[0] : '—')
  if ($('#ovEmail')) $('#ovEmail').textContent = user.email || 'Chưa cập nhật'
  if ($('#ovPhone')) $('#ovPhone').textContent = user.phone || 'Chưa cập nhật'
  if ($('#ovDob')) $('#ovDob').textContent = formatDateVN(user.dob)
  if ($('#ovGender')) $('#ovGender').textContent = user.gender || 'Nam'
  if ($('#ovUserId')) $('#ovUserId').textContent = user.id || 'ND001'
  if ($('#ovCreatedAt')) $('#ovCreatedAt').textContent = formatDateVN(user.createdAt)
  const ovStatus = $('#ovStatus')
  if (ovStatus) {
    ovStatus.textContent = user.status === 'locked' ? 'Bị khóa' : 'Đang hoạt động'
    ovStatus.className = user.status === 'locked' ? 'pf-chip is-locked' : 'pf-chip is-active'
  }
  if ($('#ovRole')) {
    $('#ovRole').textContent = user.role === 'admin' ? 'Quản trị viên hệ thống' : (user.role === 'owner' ? 'Chủ sân đối tác' : 'Người chơi (Thành viên 4SV)')
  }

  // 3. Tab 2: Lịch sử đặt sân
  renderBookingsHistory(user)

  // 4. Tab 3: Điền form Chỉnh sửa thông tin
  populateEditForm(user)

  // 5. Khởi tạo các sự kiện của trang Profile
  if (!profileInitialized) {
    bindProfileEvents()
    profileInitialized = true
  }
}

function renderBookingsHistory(user) {
  const allBookings = window.SV?.bookings() || []
  const userBookings = allBookings.filter((b) => {
    if (user.id && b.userId === user.id) return true
    if (user.name && b.userName === user.name) return true
    if (user.phone && (b.customer?.phone === user.phone || b.phone === user.phone)) return true
    if (user.email && (b.customer?.email?.toLowerCase() === user.email.toLowerCase() || b.email?.toLowerCase() === user.email.toLowerCase())) return true
    return false
  })

  // Cập nhật số liệu đếm
  const countAll = userBookings.length
  const countPending = userBookings.filter((b) => b.status === 'pending').length
  const countConfirmed = userBookings.filter((b) => b.status === 'confirmed').length
  const countCompleted = userBookings.filter((b) => b.status === 'completed').length
  const countCancelled = userBookings.filter((b) => b.status === 'cancelled').length

  if ($('#pfBookingCountBadge')) $('#pfBookingCountBadge').textContent = String(countAll)
  if ($('#ovTotalBookings')) $('#ovTotalBookings').textContent = `${countAll} đơn`
  if ($('#countAll')) $('#countAll').textContent = String(countAll)
  if ($('#countPending')) $('#countPending').textContent = String(countPending)
  if ($('#countConfirmed')) $('#countConfirmed').textContent = String(countConfirmed)
  if ($('#countCompleted')) $('#countCompleted').textContent = String(countCompleted)
  if ($('#countCancelled')) $('#countCancelled').textContent = String(countCancelled)

  // Lọc theo chip đang chọn
  let displayed = userBookings
  if (currentHistoryFilter !== 'all') {
    displayed = userBookings.filter((b) => b.status === currentHistoryFilter)
  }

  const container = $('#pfBookingsList')
  if (!container) return

  if (!displayed.length) {
    container.innerHTML = `
      <div class="pf-empty-history">
        <i class="fa-solid fa-calendar-xmark"></i>
        <h4>Không tìm thấy đơn đặt sân nào</h4>
        <p>Bạn chưa có lịch đặt sân ${currentHistoryFilter !== 'all' ? 'ở trạng thái này' : ''}. Đặt sân ngay để tận hưởng trải nghiệm thể thao tuyệt vời!</p>
        <a href="../project/pages/danh-sach-san.html" class="pf-btn-new-book" style="margin-top: 14px; display: inline-flex;">
          <i class="fa-solid fa-futbol"></i> Tìm và đặt sân ngay
        </a>
      </div>
    `
    return
  }

  const STATUS_MAP = {
    pending: { label: 'Chờ xác nhận', icon: 'fa-hourglass-half' },
    confirmed: { label: 'Đã xác nhận', icon: 'fa-circle-check' },
    completed: { label: 'Đã hoàn thành', icon: 'fa-award' },
    cancelled: { label: 'Đã hủy', icon: 'fa-ban' },
  }

  container.innerHTML = displayed
    .map((b) => {
      const courtName = b.fieldName || b.courtName || 'Sân bóng đá tiêu chuẩn'
      const timeStr = b.startTime && b.endTime
        ? `${b.startTime} – ${b.endTime}`
        : `${b.startHour || 17}:00 – ${b.endHour || 18}:30`
      const dateStr = formatDateVN(b.date)
      const st = STATUS_MAP[b.status] || STATUS_MAP.pending

      return `
        <article class="pf-booking-item" data-booking-id="${b.id}">
          <div class="pf-bk-left">
            <div class="pf-bk-title-row">
              <span class="pf-bk-court-name">${courtName}</span>
              <span class="pf-bk-id-tag">Mã: ${b.id}</span>
            </div>
            <div class="pf-bk-meta-row">
              <span class="pf-bk-meta-item"><i class="fa-solid fa-calendar-days"></i> ${dateStr}</span>
              <span class="pf-bk-meta-item"><i class="fa-regular fa-clock"></i> ${timeStr} (${b.duration || 1.5}h)</span>
              ${b.voucherCode ? `<span class="pf-bk-meta-item" style="color:#16a34a"><i class="fa-solid fa-ticket"></i> Mã: ${b.voucherCode}</span>` : ''}
            </div>
          </div>
          <div class="pf-bk-right">
            <span class="pf-status-badge is-${b.status || 'pending'}">
              <i class="fa-solid ${st.icon}"></i> ${st.label}
            </span>
            <span class="pf-bk-price">${formatPriceVN(b.total)}</span>
            ${b.status === 'pending' ? `
              <button type="button" class="pf-btn-cancel-booking" data-cancel-id="${b.id}">
                <i class="fa-solid fa-xmark"></i> Hủy đơn
              </button>
            ` : ''}
          </div>
        </article>
      `
    })
    .join('')
}

function populateEditForm(user) {
  if ($('#editName')) $('#editName').value = user.name || ''
  if ($('#editUsername')) $('#editUsername').value = user.username || (user.email ? user.email.split('@')[0] : '')
  if ($('#editEmail')) $('#editEmail').value = user.email || ''
  if ($('#editPhone')) $('#editPhone').value = user.phone || ''
  if ($('#editDob')) $('#editDob').value = user.dob || '2000-01-01'
  if ($('#editGender')) $('#editGender').value = user.gender || 'Nam'
  if ($('#editAvatarUrl')) $('#editAvatarUrl').value = user.avatar || ''
  if ($('#editAvatarPreview')) $('#editAvatarPreview').src = user.avatar || DEFAULT_AVATAR

  // Render Preset avatar buttons
  const presetContainer = $('#avatarPresets')
  if (presetContainer) {
    presetContainer.innerHTML = PRESET_AVATARS.map((url) => `
      <img src="${url}" class="pf-preset-thumb ${url === user.avatar ? 'active' : ''}" data-avatar-url="${url}" alt="Mẫu avatar" />
    `).join('')
  }
}

function bindProfileEvents() {
  // 1. Chuyển đổi tab trong Dashboard
  $$('.pf-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.ptab
      switchProfileTab(target)
    })
  })

  // Nút nhanh "Chỉnh sửa" từ Overview
  $('#btnQuickEditProfile')?.addEventListener('click', () => {
    switchProfileTab('edit')
  })
  $('#btnCancelEdit')?.addEventListener('click', () => {
    switchProfileTab('overview')
  })
  $('#btnTriggerAvatarModal')?.addEventListener('click', () => {
    switchProfileTab('edit')
    $('#editAvatarUrl')?.focus()
  })

  // 2. Click preset avatar
  $('#avatarPresets')?.addEventListener('click', (e) => {
    const thumb = e.target.closest('.pf-preset-thumb')
    if (!thumb) return
    $$('.pf-preset-thumb', $('#avatarPresets')).forEach((t) => t.classList.remove('active'))
    thumb.classList.add('active')
    const url = thumb.dataset.avatarUrl
    if ($('#editAvatarUrl')) $('#editAvatarUrl').value = url
    if ($('#editAvatarPreview')) $('#editAvatarPreview').src = url
  })

  $('#editAvatarUrl')?.addEventListener('input', (e) => {
    const url = e.target.value.trim()
    if (url && $('#editAvatarPreview')) {
      $('#editAvatarPreview').src = url
    }
  })

  // 3. Bộ lọc trạng thái lịch sử đặt sân
  $('#bookingFilterChips')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.pf-chip-btn')
    if (!btn) return
    $$('.pf-chip-btn', $('#bookingFilterChips')).forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    currentHistoryFilter = btn.dataset.filter || 'all'
    const user = window.SV?.currentUser()
    if (user) renderBookingsHistory(user)
  })

  // 4. Hủy đơn đặt sân (nếu pending)
  $('#pfBookingsList')?.addEventListener('click', (e) => {
    const cancelBtn = e.target.closest('[data-cancel-id]')
    if (!cancelBtn) return
    const bookingId = cancelBtn.dataset.cancelId
    if (confirm(`Bạn có chắc chắn muốn hủy đơn đặt sân mã ${bookingId} không?`)) {
      const res = window.SV?.setBookingStatus(bookingId, 'cancelled')
      if (res && res.ok) {
        toast(`Đã hủy đơn ${bookingId} thành công`)
        const user = window.SV?.currentUser()
        if (user) renderBookingsHistory(user)
      } else {
        toast(res?.error || 'Không thể hủy đơn này!', 'error')
      }
    }
  })

  // 5. Submit Form Chỉnh Sửa Thông Tin
  $('#editProfileForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    setError('editName', '')
    setError('editUsername', '')
    setError('editEmail', '')
    setError('editPhone', '')

    const name = $('#editName')?.value?.trim() || ''
    const username = $('#editUsername')?.value?.trim() || ''
    const email = $('#editEmail')?.value?.trim() || ''
    const phone = digits($('#editPhone')?.value || '')
    const dob = $('#editDob')?.value || ''
    const gender = $('#editGender')?.value || 'Nam'
    const avatar = $('#editAvatarUrl')?.value?.trim() || $('#editAvatarPreview')?.src || DEFAULT_AVATAR

    if (name.length < 2) {
      setError('editName', 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự)')
      $('#editName')?.focus()
      return
    }
    if (username.length < 3) {
      setError('editUsername', 'Tên đăng nhập phải có ít nhất 3 ký tự')
      $('#editUsername')?.focus()
      return
    }
    if (!isEmail(email)) {
      setError('editEmail', 'Email không đúng định dạng')
      $('#editEmail')?.focus()
      return
    }
    if (phone.length < 9 || phone.length > 11) {
      setError('editPhone', 'Số điện thoại không hợp lệ (9 - 11 chữ số)')
      $('#editPhone')?.focus()
      return
    }

    const user = window.SV?.currentUser()
    if (!user) return

    // Kiểm tra trùng email, phone hoặc username với tài khoản khác
    const users = window.SV?.users() || []
    const isConflict = users.some((u) => {
      if (u.id === user.id) return false
      if (u.email && u.email.toLowerCase() === email.toLowerCase()) return true
      if (u.phone && digits(u.phone) === phone) return true
      if (u.username && u.username.toLowerCase() === username.toLowerCase()) return true
      return false
    })

    if (isConflict) {
      setError('editEmail', 'Email, số điện thoại hoặc tên đăng nhập này đã được sử dụng bởi thành viên khác!')
      return
    }

    const saveBtn = $('#btnSaveProfile')
    setButtonLoading(saveBtn, true, 'Đang lưu thay đổi...')

    setTimeout(() => {
      const updateRes = window.SV?.updateUser(user.id, {
        name,
        username,
        email,
        phone,
        dob,
        gender,
        avatar,
      })

      setButtonLoading(saveBtn, false)
      if (updateRes && updateRes.ok) {
        toast('Cập nhật thông tin cá nhân thành công!')
        renderProfile()
        switchProfileTab('overview')
      } else {
        toast(updateRes?.error || 'Có lỗi xảy ra khi lưu!', 'error')
      }
    }, 450)
  })

  // 6. Submit Form Đổi Mật Khẩu
  $('#changePassForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    setError('pfCurrPass', '')
    setError('pfNewPass', '')
    setError('pfConfirmPass', '')

    const currPass = $('#pfCurrPass')?.value || ''
    const newPass = $('#pfNewPass')?.value || ''
    const confirmPass = $('#pfConfirmPass')?.value || ''
    const submitBtn = $('#btnUpdatePass')

    const user = window.SV?.currentUser()
    if (!user) return

    const originalUser = window.SV?.user(user.id) || user

    if (!currPass) {
      setError('pfCurrPass', 'Vui lòng nhập mật khẩu hiện tại của bạn')
      $('#pfCurrPass')?.focus()
      return
    }

    if (originalUser.password && originalUser.password !== currPass) {
      setError('pfCurrPass', 'Mật khẩu hiện tại không chính xác!')
      $('#pfCurrPass')?.focus()
      return
    }

    if (newPass.length < 6) {
      setError('pfNewPass', 'Mật khẩu mới phải có tối thiểu 6 ký tự')
      $('#pfNewPass')?.focus()
      return
    }

    if (newPass === currPass) {
      setError('pfNewPass', 'Mật khẩu mới không được trùng với mật khẩu hiện tại!')
      $('#pfNewPass')?.focus()
      return
    }

    if (newPass !== confirmPass) {
      setError('pfConfirmPass', 'Mật khẩu xác nhận không trùng khớp!')
      $('#pfConfirmPass')?.focus()
      return
    }

    setButtonLoading(submitBtn, true, 'Đang cập nhật mật khẩu...')

    setTimeout(() => {
      const res = window.SV?.updateUser(user.id, { password: newPass })
      setButtonLoading(submitBtn, false)
      if (res && res.ok) {
        toast('Đổi mật khẩu thành công! Tài khoản của bạn đã được bảo vệ.')
        $('#changePassForm').reset()
        if ($('#pfStrengthBar')) $('#pfStrengthBar').style.width = '0%'
        if ($('#pfStrengthLabel')) $('#pfStrengthLabel').textContent = 'Nhập mật khẩu để kiểm tra độ mạnh'
        switchProfileTab('overview')
      } else {
        toast(res?.error || 'Lỗi khi đổi mật khẩu!', 'error')
      }
    }, 450)
  })

  // Thanh đo độ mạnh mật khẩu mới trong Profile
  $('#pfNewPass')?.addEventListener('input', (e) => {
    const val = e.target.value
    const bar = $('#pfStrengthBar')
    const label = $('#pfStrengthLabel')
    const st = calcStrength(val)
    if (bar) {
      bar.style.width = `${st.score}%`
      bar.style.backgroundColor = st.color
    }
    if (label) {
      label.textContent = st.text
      label.style.color = st.color
    }
  })

  // 7. Modal Đăng Xuất Xác Nhận
  $('#btnPfLogout')?.addEventListener('click', () => {
    const modal = $('#pfLogoutModal')
    if (modal) modal.hidden = false
  })
  $('#btnCancelLogoutModal')?.addEventListener('click', () => {
    const modal = $('#pfLogoutModal')
    if (modal) modal.hidden = true
  })
  $('#btnConfirmLogoutModal')?.addEventListener('click', () => {
    const modal = $('#pfLogoutModal')
    if (modal) modal.hidden = true
    window.SV?.signOut()
    toast('Đã đăng xuất tài khoản thành công!')
    setTimeout(() => {
      setMode('login')
    }, 350)
  })
  $('#pfLogoutModal')?.addEventListener('click', (e) => {
    if (e.target === $('#pfLogoutModal')) {
      $('#pfLogoutModal').hidden = true
    }
  })
}

function switchProfileTab(targetTab) {
  $$('.pf-tab-btn').forEach((btn) => {
    const isActive = btn.dataset.ptab === targetTab
    btn.classList.toggle('active', isActive)
    btn.setAttribute('aria-selected', String(isActive))
  })

  const tabPanes = {
    overview: $('#ptabOverview'),
    history: $('#ptabHistory'),
    edit: $('#ptabEdit'),
    password: $('#ptabPassword'),
  }

  Object.entries(tabPanes).forEach(([key, pane]) => {
    if (pane) {
      const isCurrent = key === targetTab
      pane.hidden = !isCurrent
      pane.classList.toggle('active', isCurrent)
    }
  })
}

/* ---------- XỬ LÝ SUBMIT CÁC FORM ---------- */
function bindForms() {
  // Nút dùng thử Demo
  $('#btnQuickDemo')?.addEventListener('click', () => {
    const idInput = $('#loginIdentity')
    const passInput = $('#loginPass')
    if (idInput && passInput) {
      idInput.value = 'demo@4sv.vn'
      passInput.value = '123456'
      idInput.focus()
      toast('Đã điền thông tin tài khoản Demo!')
      setTimeout(() => {
        $('#loginForm')?.requestSubmit()
      }, 350)
    }
  })

  // 1. ĐĂNG NHẬP
  $('#loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    setError('loginIdentity', '')
    setError('loginPass', '')

    const identity = $('#loginIdentity')?.value?.trim() || ''
    const password = $('#loginPass')?.value || ''
    const submitBtn = $('#loginForm .btn-submit')

    if (!identity) {
      setError('loginIdentity', 'Vui lòng nhập email, số điện thoại hoặc họ tên')
      $('#loginIdentity')?.focus()
      return
    }
    if (!password) {
      setError('loginPass', 'Vui lòng nhập mật khẩu')
      $('#loginPass')?.focus()
      return
    }

    setButtonLoading(submitBtn, true, 'Đang xác thực...')

    setTimeout(() => {
      const user = findUser(identity)
      if (!user) {
        setButtonLoading(submitBtn, false)
        setError('loginIdentity', 'Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc Đăng ký mới!')
        $('#loginIdentity')?.focus()
        return
      }

      if (user.password !== password) {
        setButtonLoading(submitBtn, false)
        setError('loginPass', 'Mật khẩu không chính xác, vui lòng thử lại!')
        $('#loginPass')?.focus()
        return
      }

      if (user.status === 'locked') {
        setButtonLoading(submitBtn, false)
        setError('loginIdentity', 'Tài khoản này đã bị khóa. Vui lòng liên hệ ban quản trị!')
        return
      }

      const remember = $('#loginRemember')?.checked
      window.SV?.signIn(user, remember)
      toast(`Đăng nhập thành công! Xin chào ${user.name}`)

      const returnProfile = window.location.hash === '#profile' || sessionStorage.getItem('auth_redirect_profile')
      sessionStorage.removeItem('auth_redirect_profile')

      setTimeout(() => {
        if (returnProfile) {
          setMode('profile')
        } else {
          window.location.href = '../index.html'
        }
      }, REDIRECT_MS)
    }, 450)
  })

  // 2. ĐĂNG KÝ
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
    const submitBtn = $('#registerForm .btn-submit')

    if (!name || name.length < 2) {
      setError('regName', 'Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự)')
      $('#regName')?.focus()
      return
    }
    if (!isEmail(email)) {
      setError('regEmail', 'Email không đúng định dạng (ví dụ: ten@gmail.com)')
      $('#regEmail')?.focus()
      return
    }
    if (!phone || phone.length < 9 || phone.length > 11) {
      setError('regPhone', 'Số điện thoại phải từ 9 đến 11 số')
      $('#regPhone')?.focus()
      return
    }
    if (!pass || pass.length < 6) {
      setError('regPass', 'Mật khẩu phải có ít nhất 6 ký tự')
      $('#regPass')?.focus()
      return
    }

    setButtonLoading(submitBtn, true, 'Đang tạo tài khoản...')

    setTimeout(() => {
      const taken = window.SV?.users().find(
        (u) =>
          String(u.email || '').toLowerCase() === email.toLowerCase() ||
          (phone && digits(u.phone) === phone)
      )
      if (taken) {
        setButtonLoading(submitBtn, false)
        setError('regEmail', 'Email hoặc số điện thoại này đã được đăng ký trước đó!')
        $('#regEmail')?.focus()
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
        setButtonLoading(submitBtn, false)
        setError('regEmail', result?.error || 'Không thể tạo tài khoản, vui lòng thử lại!')
        return
      }

      setButtonLoading(submitBtn, false)
      otpContext = 'register'
      otpTarget = email
      $('#otpSubtitle').textContent = `Nhập mã xác thực gửi tới ${email} (Mã demo: 123456)`
      setMode('otp')
      toast('Mã OTP xác thực đã được gửi! (Mã demo: 123456)')
    }, 450)
  })

  // 3. QUÊN MẬT KHẨU
  $('#forgotForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    setError('forgotIdentity', '')
    const id = $('#forgotIdentity')?.value?.trim() || ''
    const submitBtn = $('#forgotForm .btn-submit')

    if (!id) {
      setError('forgotIdentity', 'Vui lòng nhập email hoặc số điện thoại')
      $('#forgotIdentity')?.focus()
      return
    }

    setButtonLoading(submitBtn, true, 'Đang kiểm tra...')

    setTimeout(() => {
      const user = findUser(id)
      if (!user) {
        setButtonLoading(submitBtn, false)
        setError('forgotIdentity', 'Không tìm thấy tài khoản với thông tin này!')
        return
      }

      setButtonLoading(submitBtn, false)
      otpContext = 'forgot'
      otpTarget = user.email || user.phone
      $('#otpSubtitle').textContent = `Nhập mã xác thực gửi tới ${otpTarget} (Mã demo: 123456)`
      setMode('otp')
      toast('Mã OTP xác thực đã được gửi! (Mã demo: 123456)')
    }, 400)
  })

  // 4. XÁC THỰC OTP
  $('#otpForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const boxes = $$('[data-otp] input')
    const code = boxes.map((b) => b.value).join('')
    const err = $('[data-error-for="otp"]')
    const submitBtn = $('#otpForm .btn-submit')

    if (code.length < 6) {
      if (err) err.textContent = 'Vui lòng nhập đủ 6 chữ số mã OTP'
      return
    }

    setButtonLoading(submitBtn, true, 'Đang xác minh OTP...')

    setTimeout(() => {
      if (code !== OTP_DEMO) {
        setButtonLoading(submitBtn, false)
        if (err) err.textContent = 'Mã OTP không chính xác! Vui lòng nhập mã demo: 123456'
        const otpGrp = $('.otp-inputs')
        if (otpGrp) {
          otpGrp.classList.add('has-shake')
          setTimeout(() => otpGrp.classList.remove('has-shake'), 500)
        }
        return
      }

      setButtonLoading(submitBtn, false)
      if (err) err.textContent = ''
      toast('Xác thực OTP thành công!')

      if (otpContext === 'register') {
        const u = findUser(otpTarget)
        if (u) window.SV?.signIn(u, true)
        toast('Đăng ký thành công! Đang chuyển về Trang chủ...')
        setTimeout(() => {
          window.location.href = '../index.html'
        }, REDIRECT_MS)
      } else {
        setMode('newpass')
      }
    }, 400)
  })

  // 5. MẬT KHẨU MỚI
  $('#newPassForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    setError('newPassInput', '')
    setError('newPassConfirm', '')
    const p1 = $('#newPassInput')?.value || ''
    const p2 = $('#newPassConfirm')?.value || ''
    const submitBtn = $('#newPassForm .btn-submit')

    if (p1.length < 6) {
      setError('newPassInput', 'Mật khẩu mới phải có ít nhất 6 ký tự')
      $('#newPassInput')?.focus()
      return
    }
    if (p1 !== p2) {
      setError('newPassConfirm', 'Mật khẩu xác nhận không trùng khớp!')
      $('#newPassConfirm')?.focus()
      return
    }

    setButtonLoading(submitBtn, true, 'Đang lưu mật khẩu...')

    setTimeout(() => {
      const u = findUser(otpTarget)
      if (u) {
        window.SV?.updateUser(u.id, { password: p1 })
      }
      setButtonLoading(submitBtn, false)
      toast('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
      setMode('login')
    }, 450)
  })

  // Social OAuth buttons
  $$('[data-oauth]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.oauth === 'facebook' ? 'Facebook' : 'Google'
      toast(`Đang kết nối đăng nhập qua ${provider}...`)
      // Chờ nhẹ rồi mô phỏng đăng nhập nhanh bằng demo user
      setTimeout(() => {
        const demo = findUser(DEMO_USER.email) || DEMO_USER
        window.SV?.signIn(demo, true)
        const returnProfile = window.location.hash === '#profile' || sessionStorage.getItem('auth_redirect_profile')
        sessionStorage.removeItem('auth_redirect_profile')
        setTimeout(() => {
          if (returnProfile) {
            setMode('profile')
          } else {
            window.location.href = '../index.html'
          }
        }, REDIRECT_MS)
      }, 700)
    })
  })
}

/* ---------- ROUTING & LIÊN KẾT TRANG ---------- */
function initRouting() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '').trim()
    if (['login', 'register', 'forgot', 'otp', 'newpass', 'profile'].includes(hash)) {
      setMode(hash, { updateHash: false })
    }
  })

  // Đón nhận click link nội bộ (#register, #login, v.v.)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]')
    if (!a) return
    const target = a.getAttribute('href').replace('#', '').trim()
    if (['login', 'register', 'forgot', 'otp', 'newpass', 'profile'].includes(target)) {
      e.preventDefault()
      setMode(target)
    }
  })

  const hash = window.location.hash.replace('#', '').trim()
  if (hash && ['login', 'register', 'forgot', 'otp', 'newpass', 'profile'].includes(hash)) {
    setMode(hash, { updateHash: false })
  } else {
    // Nếu đã đăng nhập thì mở profile, nếu chưa thì mở login
    const cur = window.SV?.currentUser()
    setMode(cur ? 'profile' : 'login', { updateHash: false })
  }
}

/* ---------- KHỞI TẠO HỆ THỐNG ---------- */
function bootAuth() {
  // Đảm bảo demo user có sẵn trong store để test
  if (window.SV) {
    const demo = findUser(DEMO_USER.email)
    if (!demo) {
      window.SV.addUser({ ...DEMO_USER })
    }
  }

  bindLoginTabs()
  bindEyeToggles()
  bindPasswordStrength()
  bindOtp()
  bindForms()
  initRouting()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAuth)
} else {
  bootAuth()
}
