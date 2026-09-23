const pages = [
  { href: 'index.html', label: 'Trang chủ' },
  { href: 'gioi-thieu.html', label: 'Giới thiệu' },
]

function logo() {
  return `
  <svg class="logo-icon" viewBox="0 0 32 32" aria-hidden="true" role="presentation">
    <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M16 2v12M16 30V18M2 16h12M30 16H18" stroke="currentColor" stroke-width="2"/>
    <path d="M6 6l7 7M19 19l7 7M26 6l-7 7M13 19l-7 7" stroke="currentColor" stroke-width="2"/>
  </svg>`
}

export function renderHeader(active) {
  const links = pages
    .map(
      (p) =>
        `<a href="${p.href}" class="nav-link${p.href === active ? ' active' : ''}">${p.label}</a>`
    )
    .join('')

  return `
  <header class="site-header">
    <div class="container header-inner">
      <a href="index.html" class="logo" aria-label="Đặt Sân Bóng Đá">
        ${logo()}
        <span>Đặt Sân Bóng Đá</span>
      </a>
      <nav class="site-nav" id="siteNav" aria-label="Điều hướng chính">
        ${links}
        <a href="index.html#book" class="btn btn-primary btn-sm">Đặt sân ngay</a>
      </nav>
      <button class="nav-toggle" id="navToggle" type="button" aria-label="Mở menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>`
}

export function renderFooter() {
  return `
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <a href="index.html" class="logo">${logo()}<span>Đặt Sân Bóng Đá</span></a>
        <p>Nền tảng đặt sân bóng uy tín, giúp bạn tìm và đặt sân nhanh chóng trong 2 phút.</p>
      </div>
      <div class="footer-col">
        <h3>Khám phá</h3>
        <a href="index.html">Trang chủ</a>
        <a href="gioi-thieu.html">Giới thiệu</a>
        <a href="index.html#san">Các loại sân</a>
        <a href="index.html#book">Đặt sân</a>
      </div>
      <div class="footer-col">
        <h3>Liên hệ</h3>
        <a href="mailto:hotro@datsanbongda.vn">hotro@datsanbongda.vn</a>
        <a href="tel:+84123456789">0123 456 789</a>
        <span>123 Nguyễn Trãi, TP. Hồ Chí Minh</span>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container">© 2026 Đặt Sân Bóng Đá. Bảo lưu mọi quyền.</div>
    </div>
  </footer>`
}

export function setupNav() {
  const toggle = document.querySelector('#navToggle')
  const nav = document.querySelector('#siteNav')
  if (!toggle || !nav) return

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open')
    toggle.setAttribute('aria-expanded', String(open))
  })
}