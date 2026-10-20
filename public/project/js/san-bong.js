
// ============================= DỮ LIỆU SÂN TỪ STORE DÙNG CHUNG =============================
/**
 * Trang này không còn giữ danh sách sân riêng mà đọc chung với trang chủ và
 * trang quản trị, nên sửa sân ở admin là thấy ngay ở đây. Toạ độ, số sân, giờ
 * mở cửa và ảnh đều lấy đúng như admin đã nhập thay vì tự đoán giá trị.
 */
function buildSanData() {
  return SV.fields().map((f) => ({
    id: f.id,
    name: f.name,
    address: f.address,
    type: SV.pitchNumber(f.type),
    price: f.price,
    status: f.status === 'active' ? 'trong' : 'bao-tri',
    courts: f.courts || 4,
    hours: { open: f.hours ? f.hours.open : 6, close: f.hours ? f.hours.close : 23 },
    lat: f.lat,
    lng: f.lng,
    desc: f.desc || `${f.name} là sân thể thao chất lượng cao tại ${f.address}.`,
    img: f.img || DEFAULT_IMG,
    rating: f.rating || 4.9,
    reviewCount: f.reviewCount || 150,
    sport: f.sport || 'Bóng đá',
    sports: (Array.isArray(f.sports) && f.sports.length > 0) ? f.sports : [f.sport || 'Bóng đá'],
    badge: f.badge || 'Chuẩn thi đấu',
  }));
}

/** Ảnh dự phòng khi admin nhập URL ảnh hỏng hoặc sân chưa có ảnh. */
const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80&auto=format&fit=crop';

/** Thoát ký tự HTML: tên/địa chỉ sân do admin nhập có thể chứa markup. */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

let SAN_DATA = buildSanData();

// ============================= TIỆN ÍCH =============================
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

function formatPrice(n) {
  return n.toLocaleString('vi-VN') + 'đ';
}

const TYPE_LABEL = { 5: 'Sân 5', 7: 'Sân 7', 11: 'Sân 11' };
const STATUS_LABEL = {
  trong: 'Còn trống',
  'da-dat': 'Đã đặt',
  'bao-tri': 'Bảo trì',
};

function timeLabel(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function diffPriceRange(v) {
  return v < 500000 ? 'p1' : v <= 1000000 ? 'p2' : 'p3';
}

// Đơn đặt giờ do form dùng chung (dat-san-modal.js) ghi thẳng vào store chung,
// trang này chỉ dựng lại lưới khi có thay đổi (SV.on / dat-san:success).
// ============================= STATE =============================
const state = {
  search: '',
  type: 'all',
  prices: new Set(),
  onlyAvailable: false,
  sort: 'default',
};

// ============================= RENDER LIST =============================
function getFiltered() {
  let list = SAN_DATA.slice();

  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
    );
  }

  if (state.type !== 'all') list = list.filter((c) => c.type === state.type);

  if (state.prices.size > 0)
    list = list.filter((c) => state.prices.has(diffPriceRange(c.price)));

  if (state.onlyAvailable) list = list.filter((c) => c.status === 'trong');

  switch (state.sort) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      break;
  }

  return list;
}

function renderGrid() {
  const list = getFiltered();
  const grid = $('#sanGrid');
  const count = $('#resultCount');

  count.textContent = list.length;

  if (!list.length) {
    grid.innerHTML = '';
    $('#emptyState').style.display = 'block';
    return;
  }

  $('#emptyState').style.display = 'none';

  grid.innerHTML = list
    .map(
      (c) => `
      <article class="san-card" data-id="${esc(c.id)}">
        <a href="../../src/chi-tiet.html?id=${encodeURIComponent(c.id)}" class="san-card-img" style="display:block;text-decoration:none;">
          <img src="${esc(c.img)}" alt="${esc(c.name)}" loading="lazy" onerror="this.src='${DEFAULT_IMG}'"/>
          <span class="san-badge badge-status ${c.status}">
            <i class="fa-solid ${c.status === 'trong' ? 'fa-circle-check' : c.status === 'da-dat' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}"></i>
            ${STATUS_LABEL[c.status]}
          </span>
          <span class="san-badge badge-type type"><i class="fa-solid fa-futbol"></i> ${TYPE_LABEL[c.type]}</span>
        </a>
        <div class="san-card-body">
          <h3 class="san-name">
            <a href="../../src/chi-tiet.html?id=${encodeURIComponent(c.id)}" style="color:inherit;text-decoration:none;">
              ${esc(c.name)}
            </a>
          </h3>
          <p class="san-address"><i class="fa-solid fa-location-dot"></i>${esc(c.address)}</p>
          <div class="san-meta">
            <span class="meta-item"><i class="fa-regular fa-clock"></i> ${timeLabel(c.hours.open)} – ${timeLabel(c.hours.close)}</span>
            ${c.courts > 1 ? `<span class="meta-item"><i class="fa-solid fa-layer-group"></i> ${c.courts} sân</span>` : ''}
          </div>
          <div class="san-price">
            <b>${formatPrice(c.price)}</b>
            <span>/ giờ</span>
          </div>
          <div class="san-card-actions">
            <a href="../../src/chi-tiet.html?id=${encodeURIComponent(c.id)}" class="btn-card btn-outline">
              <i class="fa-solid fa-eye"></i> Xem chi tiết
            </a>
            <button type="button" class="btn-card btn-solid ${c.status !== 'trong' ? 'disabled' : ''}" data-open-book="${esc(c.id)}" ${c.status !== 'trong' ? 'disabled' : ''}>
              ${c.status === 'trong' ? '<i class="fa-solid fa-calendar-check"></i> Đặt sân' : '<i class="fa-solid fa-ban"></i> Không nhận đặt'}
            </button>
          </div>
        </div>
      </article>`
    )
    .join('');
}

// ============================= FILTER CONTROLS =============================
function onTypeChange() {
  const checked = $('#formType .chip input:checked');
  state.type = checked ? checked.value : 'all';
  renderGrid();
}

function onPriceChange() {
  state.prices = new Set(
    $$('#formPrice .chip input:checked').map((i) => i.value)
  );
  renderGrid();
}

function resetFilters() {
  state.search = '';
  state.type = 'all';
  state.prices.clear();
  state.onlyAvailable = false;
  state.sort = 'default';

  $('#searchInput').value = '';
  $('#onlyAvailable').checked = false;
  $$('#formType .chip input').forEach((i) => (i.checked = false));
  $$('#formPrice .chip input').forEach((i) => (i.checked = false));
  $('#sortSelect').value = 'default';
  renderGrid();
}


// ============================= ĐẶT SÂN (DÙNG CHUNG) =============================
/**
 * Form đặt sân nằm ở /project/js/dat-san-modal.js — cùng form với trang chủ
 * và trang chi tiết (không ô Email, tổng tiền + voucher + dịch vụ, kết quả
 * "Thanh toán ngay / Để thanh toán sau"). Trang này chỉ mở modal; khi có đơn
 * mới, dat-san:success + SV.on sẽ dựng lại lưới khung giờ.
 */
function openBook(court) {
  DatSanModal.open(court);
}

// ---------- TOAST ----------
let toastTimer;
function showToast(title, sub) {
  $('#toastTitle').textContent = title;
  $('#toastSub').textContent = sub;
  const toast = $('#toast');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
}

// ============================= EVENT BINDINGS =============================
function init() {
  if ($('#year')) $('#year').textContent = new Date().getFullYear();

  // Search
  $('#searchInput').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderGrid();
  });
  $('#searchForm').addEventListener('submit', (e) => e.preventDefault());

  // Type filter
  $('#formType').addEventListener('change', onTypeChange);
  // Price filter
  $('#formPrice').addEventListener('change', onPriceChange);
  // Only available
  $('#onlyAvailable').addEventListener('change', (e) => {
    state.onlyAvailable = e.target.checked;
    renderGrid();
  });
  // Sort
  $('#sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderGrid();
  });
  // Reset
  $('#resetBtn').addEventListener('click', resetFilters);

  // Link "Đặt sân" trên header: mở modal đặt sân ngay tại đây cho sân còn trống
  $('#navBook')?.addEventListener('click', (e) => {
    e.preventDefault();
    const first = SAN_DATA.find((c) => c.status === 'trong');
    if (first) {
      openBook(first);
    } else {
      showToast('Hiện tại đã kín sân', 'Vui lòng quay lại sau');
    }
  });

  // Grid delegation
  $('#sanGrid')?.addEventListener('click', (e) => {
    // Nút "Đặt sân" trên thẻ: mở modal đặt trực tiếp, không qua trang chi tiết
    const bookBtn = e.target.closest('[data-open-book]');
    if (bookBtn) {
      if (bookBtn.disabled) return;
      const bookCourt = SAN_DATA.find((c) => c.id === bookBtn.dataset.openBook);
      if (!bookCourt) return;
      if (bookCourt.status !== 'trong') {
        showToast('Không nhận đặt', 'Sân này hiện đã kín lịch, vui lòng chọn sân khác');
        return;
      }
      openBook(bookCourt);
      return;
    }
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const court = SAN_DATA.find((c) => c.id === btn.dataset.id);
    if (!court) return;
    if (btn.dataset.action === 'detail') {
      window.location.href = `../../src/chi-tiet.html?id=${encodeURIComponent(court.id)}`;
    } else if (btn.dataset.action === 'book') {
      if (court.status === 'trong') openBook(court);
      else showToast('Không nhận đặt', 'Sân này hiện đã kín lịch, vui lòng chọn sân khác');
    }
  });

  // Toast close
  $('#toastClose').addEventListener('click', () =>
    $('#toast').classList.remove('show')
  );

  // Form đặt sân dùng chung vừa đặt xong -> dựng lại lưới để ô đã đặt đổi màu.
  window.addEventListener('dat-san:success', () => {
    SAN_DATA = buildSanData();
    renderGrid();
  });

  // Admin sửa sân / đổi trạng thái đơn ở tab khác thì trang này cập nhật theo.
  // (Form đang mở do DatSanModal tự lắng SV.on để tự cập nhật/dựng form.)
  SV.on((key) => {
    if (key !== 'fields' && key !== 'bookings' && key !== '*') return;
    SAN_DATA = buildSanData();
    renderGrid();
  });

  renderGrid();
  initAuthNav();
}

/** Đã đăng nhập thì nút "Đăng nhập" đổi thành tên + nút đăng xuất. */
function initAuthNav() {
  const nameEl = document.getElementById('listUserName');
  const avatarEl = document.getElementById('listUserAvatar');
  const outBtn = document.getElementById('listUserLogout');
  if (!nameEl || !outBtn) return;

  function render() {
    const user = SV.currentUser();
    document.querySelectorAll('[data-auth="login"]').forEach((el) => {
      el.hidden = !!user;
      el.style.display = user ? 'none' : '';
    });
    document.querySelectorAll('[data-auth="user"]').forEach((el) => {
      el.hidden = !user;
      el.style.display = user ? 'inline-flex' : 'none';
    });
    if (user) {
      nameEl.textContent = user.name || user.email || 'Tài khoản';
      if (avatarEl) {
        if (user.avatar) {
          avatarEl.src = user.avatar;
          avatarEl.style.display = 'inline-block';
        } else {
          avatarEl.style.display = 'none';
        }
      }
    }
  }

  outBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản 4SV.com?')) {
      SV.signOut();
      render();
    }
  });

  SV.on((key) => {
    if (key === 'auth' || key === 'users' || key === '*') render();
  });

  window.addEventListener('storage', () => {
    render();
  });

  render();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sanGrid')) {
    init();
  }
});

