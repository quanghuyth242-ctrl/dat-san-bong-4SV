import './style.css'

const VENUES = [
  { id: 1, name: 'Sân Bóng Đá Thành Công', sport: 'Bóng đá', addr: '18 Thành Công, Ba Đình, Hà Nội', price: '300k', per: '/tiếng', courts: 3, img: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&q=75', icon: '⚽' },
  { id: 2, name: 'Tennis Club Cầu Giấy', sport: 'Tennis', addr: '68 Cầu Giấy, Hà Nội', price: '250k', per: '/tiếng', courts: 4, img: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&q=75', icon: '🎾' },
  { id: 3, name: 'Nhà Thi Đấu Cầu Lông Mỹ Đình', sport: 'Cầu lông', addr: 'Lê Đức Thọ, Nam Từ Liêm, Hà Nội', price: '120k', per: '/tiếng', courts: 6, img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&q=75', icon: '🏸' },
  { id: 4, name: 'Pickleball Arena Q.1', sport: 'Pickleball', addr: '28 Thảo Điền, Thủ Đức, TP.HCM', price: '180k', per: '/tiếng', courts: 2, img: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=400&q=75', icon: '🏓' },
  { id: 5, name: 'Sân Bóng Rổ Tây Hồ', sport: 'Bóng rổ', addr: 'Ngõ 431 Âu Cơ, Tây Hồ, Hà Nội', price: '200k', per: '/tiếng', courts: 2, img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=75', icon: '🏀' },
  { id: 6, name: 'Sân Bóng Chuyền Hoàng Hoa Thám', sport: 'Bóng chuyền', addr: '290 Hoàng Hoa Thám, Ba Đình, Hà Nội', price: '150k', per: '/tiếng', courts: 2, img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&q=75', icon: '🏐' },
  { id: 7, name: 'Bóng Đá Mini Đầm Hồng', sport: 'Bóng đá', addr: 'KĐT Đầm Hồng, Thanh Xuân, Hà Nội', price: '400k', per: '/tiếng', courts: 5, img: 'https://images.unsplash.com/photo-1579952363873-27f3bfad9c0d?w=400&q=75', icon: '⚽' },
  { id: 8, name: 'Ace Pickleball Club', sport: 'Pickleball', addr: 'Pullman Hanoi, Cát Linh, Đống Đa, Hà Nội', price: '220k', per: '/tiếng', courts: 2, img: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400&q=75', icon: '🏓' },
]

const PROVINCES = ['Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ','Bình Dương','Đồng Nai','Khánh Hòa','Nghệ An','Thanh Hóa','Huế','Quảng Ninh','Bà Rịa - Vũng Tàu','Lâm Đồng','Kiên Giang','Bắc Ninh','Hải Dương','Hưng Yên','Nam Định','Thái Nguyên','Quảng Nam','Bình Định','Gia Lai','Đắk Lắk','Long An','Tiền Giang','Vĩnh Long','An Giang','Bình Thuận','Ninh Thuận','Phú Yên','Quảng Ngãi','Bình Phước','Tây Ninh']

// ---- helpers ----
function toast(msg) {
  const t = document.createElement('div')
  t.className = 'toast-4sv'
  t.textContent = msg
  document.body.appendChild(t)
  requestAnimationFrame(() => t.classList.add('show'))
  setTimeout(() => {
    t.classList.remove('show')
    setTimeout(() => t.remove(), 250)
  }, 2500)
}

function renderVenues(list) {
  const grid = document.getElementById('featuredGrid')
  if (!grid) return
  grid.innerHTML = list.map(v => `
    <div class="court-card">
      <div class="court-img-wrap">
        <img src="${v.img}" alt="${v.name}" loading="lazy">
        <span class="court-badge">${v.icon} ${v.sport}</span>
      </div>
      <div class="court-body">
        <div class="court-name">${v.name}</div>
        <div class="court-addr"><i class="fa-solid fa-location-dot"></i><span>${v.addr}</span></div>
        <div class="court-meta">
          <div class="court-price">${v.price} <small>${v.per}</small></div>
          <div style="font-size:.82rem;color:var(--grey-600)">${v.courts} sân</div>
        </div>
        <a href="#" class="btn-book" data-book="${v.id}">Xem chi tiết</a>
      </div>
    </div>
  `).join('')
  grid.querySelectorAll('[data-book]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      const venue = list.find(x => String(x.id) === a.dataset.book) || VENUES.find(x => String(x.id) === a.dataset.book)
      toast(`Đã chọn: ${venue ? venue.name : 'sân'}`)
    })
  })
}

function renderNearby(list) {
  const ul = document.getElementById('nearbyList')
  const count = document.getElementById('mapCount')
  if (count) count.textContent = String(list.length)
  if (!ul) return
  ul.innerHTML = list.slice(0, 4).map(v => `
    <li>
      <img class="nearby-thumb" src="${v.img}" alt="">
      <div>
        <div class="nearby-name">${v.name}</div>
        <div class="nearby-addr">${v.addr}</div>
      </div>
      <span style="margin-left:auto;font-size:.78rem;font-weight:700;color:var(--green-primary)">${v.price}</span>
    </li>
  `).join('')
}

function renderProvinces(sportKey) {
  const grid = document.getElementById('provinceGrid')
  if (!grid) return
  const labels = { 'bong-da': 'Bóng đá', tennis: 'Tennis', 'cau-long': 'Cầu lông', pickleball: 'Pickleball', 'bong-ro': 'Bóng rổ', 'bong-chuyen': 'Bóng chuyền' }
  const label = labels[sportKey] || 'Bóng đá'
  grid.innerHTML = PROVINCES.map(p => {
    const n = Math.floor(Math.random() * 40) + 8
    return `<a href="#" class="province-card" data-province="${p}"><span><span class="province-name">${p}</span><span class="province-count" style="display:block">${n} sân ${label}</span></span><i class="fa-solid fa-chevron-right"></i></a>`
  }).join('')
  grid.querySelectorAll('.province-card').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      toast(`Tìm sân ${label} tại ${a.dataset.province}`)
    })
  })
}

function handleSearch(e) {
  e.preventDefault()
  const loc = document.getElementById('qLocation').value.trim().toLowerCase()
  const sport = document.getElementById('qSport').value
  let filtered = VENUES.filter(v => {
    const okLoc = !loc || v.addr.toLowerCase().includes(loc) || v.name.toLowerCase().includes(loc)
    const okSport = !sport || v.sport === sport
    return okLoc && okSport
  })
  if (filtered.length === 0) {
    toast('Không tìm thấy sân phù hợp, hiển thị tất cả')
    filtered = VENUES
  } else {
    toast(`Tìm thấy ${filtered.length} sân phù hợp`)
  }
  renderVenues(filtered)
  renderNearby(filtered)
  document.getElementById('san-noi-bat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// expose for backward compat if HTML still uses inline handlers
window.handleSearch = handleSearch
window.locateMe = () => toast('Đang lấy vị trí của bạn...')
window.subscribe = (e) => {
  e.preventDefault()
  toast('Đăng ký thành công! Voucher đã gửi qua email.')
  e.target.reset()
  return false
}

document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year')
  if (y) y.textContent = String(new Date().getFullYear())

  renderVenues(VENUES)
  renderNearby(VENUES)
  renderProvinces('bong-da')

  // nếu là trang Vite mặc định với #app thì không chạy tiếp
  const searchForm = document.getElementById('searchForm')
  if (searchForm) searchForm.addEventListener('submit', handleSearch)

  const btnLocate = document.getElementById('btnLocate')
  if (btnLocate) btnLocate.addEventListener('click', () => toast('Đang lấy vị trí của bạn...'))

  const footerForm = document.getElementById('footerForm')
  if (footerForm) footerForm.addEventListener('submit', e => {
    e.preventDefault()
    toast('Đăng ký thành công! Voucher đã gửi qua email.')
    e.target.reset()
  })

  // sport-card filter
  document.querySelectorAll('.sport-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault()
      const s = card.getAttribute('data-sport')
      document.querySelectorAll('.sport-card').forEach(c => c.classList.remove('active'))
      card.classList.add('active')
      if (!s) {
        renderVenues(VENUES)
        renderNearby(VENUES)
        toast('Hiển thị tất cả sân')
      } else {
        const f = VENUES.filter(v => v.sport === s)
        if (f.length === 0) {
          toast(`Chưa có sân ${s} nổi bật`)
          renderVenues(VENUES)
          renderNearby(VENUES)
        } else {
          toast(`${f.length} sân ${s}`)
          renderVenues(f)
          renderNearby(f)
        }
      }
      document.getElementById('san-noi-bat')?.scrollIntoView({ behavior: 'smooth' })
    })
  })

  // province tabs
  document.querySelectorAll('.sport-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sport-tab').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      renderProvinces(btn.getAttribute('data-sport'))
    })
  })

  // mobile nav toggle
  const navToggle = document.getElementById('navToggle')
  const navMenu = document.getElementById('navMenu')
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.contains('open')
      navMenu.classList.toggle('open', !isOpen)
      navToggle.setAttribute('aria-expanded', String(!isOpen))
      navToggle.innerHTML = isOpen ? '<i class="fa-solid fa-bars"></i>' : '<i class="fa-solid fa-xmark"></i>'
    })
  }

  // dropdown
  const dropdowns = document.querySelectorAll('.dropdown')
  dropdowns.forEach(dd => {
    const toggle = dd.querySelector('.dropdown-toggle')
    if (!toggle) return
    toggle.addEventListener('click', e => {
      e.preventDefault()
      const isOpen = dd.classList.contains('open')
      closeAllDd()
      if (!isOpen) dd.classList.add('open')
    })
  })

  document.addEventListener('click', e => {
    if (!e.target.closest('.dropdown')) closeAllDd()
    if (navMenu && navToggle && !e.target.closest('#navMenu') && !e.target.closest('#navToggle')) {
      navMenu.classList.remove('open')
      navToggle.setAttribute('aria-expanded', 'false')
      navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>'
    }
  })

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAllDd()
      if (navMenu) {
        navMenu.classList.remove('open')
        navToggle?.setAttribute('aria-expanded', 'false')
        if (navToggle) navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>'
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault()
      window.location.href = 'project/pages/dashboard.html'
    }
  })

  function closeAllDd() {
    dropdowns.forEach(dd => dd.classList.remove('open'))
  }
})
