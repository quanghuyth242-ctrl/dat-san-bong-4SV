// ============================= DỮ LIỆU SÂN BÓNG =============================
const SAN_DATA = [
  {
    id: 'san-1',
    name: 'Sân Bóng Galaxy Turf',
    address: '296 Lý Thường Kiệt, P.14, Q.10, TP.HCM',
    type: '7',
    price: 800000,
    status: 'trong',
    hours: { open: 6, close: 22 },
    desc: 'Sân cỏ nhân tạo chất lượng cao, hệ thống đèn chiếu sáng hiện đại, có phòng thay đồ và khu vực nghỉ ngơi. Vị trí trung tâm thuận tiện di chuyển.',
    img: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'san-2',
    name: 'Sân Bóng An Phú',
    address: '32 Lê Đức Thọ, P.6, Q.Gò Vấp, TP.HCM',
    type: '5',
    price: 500000,
    status: 'trong',
    hours: { open: 5, close: 23 },
    desc: 'Sân 5 người mặt cỏ đẹp, không gian thoáng mát, có khu vực giải khát và WiFi miễn phí. Phù hợp cho đội bóng phong trào.',
    img: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'san-3',
    name: 'Sân Bóng Minh Khai',
    address: '85 Trần Hưng Đạo, P.Phạm Đình Hổ, Q.Hai Bà Trưng, Hà Nội',
    type: '5',
    price: 450000,
    status: 'da-dat',
    hours: { open: 6, close: 22 },
    desc: 'Sân 5 người trong khu đô thị trung tâm, cỏ nhập khẩu an toàn, đèn LED tiết kiệm điện. Có chỗ gửi xe máy miễn phí.',
    img: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'san-4',
    name: 'Sân Bóng TP. Thủ Đức',
    address: '12 Võ Văn Ngân, P.Bình Thọ, TP.Thủ Đức, TP.HCM',
    type: '7',
    price: 700000,
    status: 'trong',
    hours: { open: 5, close: 23 },
    desc: 'Sân 7 người rộng rãi, hệ thống thoát nước tốt sau mưa. Có căng tin phục vụ đồ uống và đồ ăn nhanh.',
    img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'san-5',
    name: 'Sân Bóng Hòa Lạc 11',
    address: 'Khu CNC Hòa Lạc, H.Thạch Thất, Hà Nội',
    type: '11',
    price: 1500000,
    status: 'bao-tri',
    hours: { open: 7, close: 21 },
    desc: 'Sân 11 người tiêu chuẩn thi đấu, cỏ tự nhiên kết hợp nhân tạo. Có khán đài và phòng VIP cho đội bóng chuyên nghiệp.',
    img: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'san-6',
    name: 'Sân Bóng Eco Dream',
    address: '140 Cộng Hòa, P.13, Q.Tân Bình, TP.HCM',
    type: '7',
    price: 900000,
    status: 'trong',
    hours: { open: 6, close: 24 },
    desc: 'Sân 7 người cao cấp, mái che mưa, đèn Proview sáng rõ. Trang bị hệ thống camera quay lại trận đấu theo yêu cầu.',
    img: 'https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'san-7',
    name: 'Sân Bóng Phú Nhuận Star',
    address: '99 Trường Sa, P.13, Q.Phú Nhuận, TP.HCM',
    type: '5',
    price: 600000,
    status: 'trong',
    hours: { open: 5, close: 23 },
    desc: 'Sân 5 người được trang bị lưới chắn bóng cao, cỏ êm giảm chấn thương. Khu vực chờ mát mẻ.',
    img: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'san-8',
    name: 'Sân Bóng Biên Hòa FC',
    address: '45 Đồng Khởi, P.Tam Hiệp, TP.Biên Hòa, Đồng Nai',
    type: '11',
    price: 1800000,
    status: 'da-dat',
    hours: { open: 7, close: 22 },
    desc: 'Sân 11 người quy mô lớn, phục vụ giải đấu khu vực. Có phòng y tế, bãi đỗ xe ô tô và khu thể thao phụ trợ.',
    img: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'san-9',
    name: 'Sân Bóng Bình Dương Arena',
    address: '7 Nguyễn Đình Chiểu, P.Phú Cường, TP.Thủ Dầu Một, Bình Dương',
    type: '5',
    price: 350000,
    status: 'trong',
    hours: { open: 5, close: 22 },
    desc: 'Sân 5 người giá rẻ, phù hợp học sinh sinh viên. Giờ sáng có chương trình ưu đãi giảm 20%.',
    img: 'https://images.unsplash.com/photo-1552318965-6e6be7484ada?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 'san-10',
    name: 'Sân Bóng Đà Nẵng Sport',
    address: '88 Nguyễn Hữu Thọ, P.Hòa Cường Bắc, Q.Hải Châu, Đà Nẵng',
    type: '7',
    price: 850000,
    status: 'trong',
    hours: { open: 6, close: 22 },
    desc: 'Sân 7 người ngay ven sông Hàn, khung cảnh thoáng đãng. Có dịch vụ cho thuê giày đá bóng và dụng cụ.',
    img: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80&auto=format&fit=crop',
  },
];

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
  return String(hour).padStart(2, '0') + ':00';
}

function diffPriceRange(v) {
  return v < 500000 ? 'p1' : v <= 1000000 ? 'p2' : 'p3';
}

// ============================= STATE =============================
const state = {
  search: '',
  type: 'all',
  prices: new Set(),
  onlyAvailable: false,
  sort: 'default',
  activeCourt: null,
  booking: { date: '', time: '', duration: 1 },
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
      <article class="san-card" data-id="${c.id}">
        <div class="san-card-img">
          <img src="${c.img}" alt="${c.name}" loading="lazy"/>
          <span class="san-badge badge-status ${c.status}">
            <i class="fa-solid ${c.status === 'trong' ? 'fa-circle-check' : c.status === 'da-dat' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}"></i>
            ${STATUS_LABEL[c.status]}
          </span>
          <span class="san-badge badge-type type"><i class="fa-solid fa-futbol"></i> ${TYPE_LABEL[c.type]}</span>
        </div>
        <div class="san-card-body">
          <h3 class="san-name">${c.name}</h3>
          <p class="san-address"><i class="fa-solid fa-location-dot"></i>${c.address}</p>
          <div class="san-meta">
            <span class="meta-item"><i class="fa-regular fa-clock"></i> ${timeLabel(c.hours.open)} – ${timeLabel(c.hours.close)}</span>
          </div>
          <div class="san-price">
            <b>${formatPrice(c.price)}</b>
            <span>/ giờ</span>
          </div>
          <div class="san-card-actions">
            <button type="button" class="btn-card btn-outline" data-action="detail" data-id="${c.id}">
              <i class="fa-solid fa-eye"></i> Xem chi tiết
            </button>
            <button type="button" class="btn-card btn-solid" data-action="book" data-id="${c.id}" ${c.status !== 'trong' ? 'disabled' : ''}>
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

// ============================= MODAL =============================
function openModal(modalEl) {
  modalEl.classList.add('open');
  document.body.style.overflow = 'hidden';
  const focusable = $('input, select, button', modalEl);
  if (focusable) focusable.focus();
}

function closeModal(modalEl) {
  modalEl.classList.remove('open');
  document.body.style.overflow = '';
}

// ---------- CHI TIẾT ----------
function openDetail(court) {
  const body = $('#detailBody');
  body.innerHTML = `
    <div class="detail-hero">
      <img src="${court.img}" alt="${court.name}"/>
      <div class="overlay">
        <h2>${court.name}</h2>
      </div>
    </div>
    <div class="detail-rows">
      <div class="detail-item">
        <i class="fa-solid fa-location-dot"></i>
        <div><div class="lbl">Địa chỉ</div><div class="val">${court.address}</div></div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-futbol"></i>
        <div><div class="lbl">Loại sân</div><div class="val">${TYPE_LABEL[court.type]}</div></div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-hand-holding-dollar"></i>
        <div><div class="lbl">Giá thuê</div><div class="val">${formatPrice(court.price)} / giờ</div></div>
      </div>
      <div class="detail-item">
        <i class="fa-regular fa-clock"></i>
        <div><div class="lbl">Giờ hoạt động</div><div class="val">${timeLabel(court.hours.open)} – ${timeLabel(court.hours.close)}</div></div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-circle-info"></i>
        <div><div class="lbl">Trạng thái</div><div class="val">${STATUS_LABEL[court.status]}</div></div>
      </div>
    </div>
    <div class="detail-section">
      <h4><i class="fa-solid fa-align-left"></i> Mô tả sân</h4>
      <p class="detail-desc">${court.desc}</p>
    </div>
    <button type="button" class="btn-book detail-book" data-open-book="${court.id}" ${court.status !== 'trong' ? 'disabled' : ''}>
      ${court.status === 'trong' ? '<i class="fa-solid fa-calendar-check"></i> Đặt sân ngay' : 'Sân hiện ' + (court.status === 'da-dat' ? 'đã được đặt' : 'đang bảo trì')}
    </button>
  `;
  openModal($('#detailModal'));
}

// ---------- ĐẶT SÂN ----------
function buildTimeOptions(court) {
  const opts = [];
  for (let h = court.hours.open; h <= court.hours.close - 1; h++) {
    opts.push(`<option value="${h}">${timeLabel(h)} – ${timeLabel(h + 1)}</option>`);
  }
  return opts.join('');
}

function openBook(court) {
  state.activeCourt = court;
  state.booking = { date: '', time: '', duration: 1 };
  renderBookForm(court);

  const info = $('#bookInfo');
  info.innerHTML = `
    <img src="${court.img}" alt="${court.name}"/>
    <div>
      <div class="b-name">${court.name}</div>
      <div class="b-sub">${TYPE_LABEL[court.type]} · ${formatPrice(court.price)}/giờ · ${timeLabel(court.hours.open)} – ${timeLabel(court.hours.close)}</div>
    </div>
  `;

  $('#dateInput').min = todayStr();
  $('#timeSelect').innerHTML = buildTimeOptions(court);
  $('#durationSelect').value = '1';

  updateTotal();
  openModal($('#bookModal'));
}

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function updateTotal() {
  const court = state.activeCourt;
  if (!court) return;
  const duration = parseFloat($('#durationSelect').value) || 1;
  const total = court.price * duration;
  $('#totalAmount').textContent = formatPrice(total);
  state.booking.duration = duration;
}

function validateBooking() {
  const set = (field, ok) => {
    $('#f-' + field).classList.toggle('invalid', !ok);
  };

  const court = state.activeCourt;
  if (!court) return false;

  // Ngày
  let ok = true;
  const dateVal = $('#dateInput').value;
  const dateOk = !!dateVal && dateVal >= todayStr();
  set('date', dateOk);
  if (!dateOk) ok = false;

  // Giờ
  const timeOk = !!$('#timeSelect').value;
  set('time', timeOk);
  if (!timeOk) ok = false;

  // Họ tên
  const nameVal = $('#nameInput').value.trim();
  const nameOk = nameVal.length >= 2;
  set('name', nameOk);
  if (!nameOk) ok = false;

  // SĐT
  const phoneVal = $('#phoneInput').value.trim().replace(/[\s.-]/g, '');
  const phoneOk = /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phoneVal);
  set('phone', phoneOk);
  if (!phoneOk) ok = false;

  // Email
  const emailVal = $('#emailInput').value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
  set('email', emailOk);
  if (!emailOk) ok = false;

  return ok;
}

function showSuccess() {
  const court = state.activeCourt;
  const date = $('#dateInput').value;
  const time = $('#timeSelect option:checked').textContent;
  const duration = state.booking.duration;

  $('#bookBody').innerHTML = `
    <div class="success-wrap">
      <div class="success-icon"><i class="fa-solid fa-check"></i></div>
      <h3>Đặt sân thành công!</h3>
      <p>Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.</p>
      <div class="success-summary">
        <div><span>Sân</span><b>${court.name}</b></div>
        <div><span>Ngày</span><b>${date}</b></div>
        <div><span>Giờ</span><b>${time}</b></div>
        <div><span>Thời lượng</span><b>${duration} giờ</b></div>
        <div><span>Tổng tiền</span><b>${formatPrice(court.price * duration)}</b></div>
      </div>
      <div class="success-summary">
        <div><span>Họ tên</span><b>${$('#nameInput').value.trim()}</b></div>
        <div><span>Số điện thoại</span><b>${$('#phoneInput').value.trim()}</b></div>
        <div><span>Email</span><b>${$('#emailInput').value.trim()}</b></div>
      </div>
      <button type="button" class="btn-again" id="bookAgainBtn"><i class="fa-solid fa-plus"></i> Đặt sân khác</button>
    </div>
  `;

  $('#bookAgainBtn').addEventListener('click', () => {
    openBook(court);
  });

  showToast('Đặt sân thành công', `${court.name} · ${date} · ${time}`);
}

function renderBookForm(court) {
  $('#bookBody').innerHTML = `
    <div class="booking-info" id="bookInfo"></div>
    <form id="bookForm" novalidate>
      <div class="form-grid">
        <div class="form-field" id="f-date">
          <label><i class="fa-solid fa-calendar-days"></i> Chọn ngày</label>
          <input type="date" id="dateInput" required />
          <span class="error-msg">Vui lòng chọn ngày hợp lệ (không ở quá khứ).</span>
        </div>
        <div class="form-field" id="f-time">
          <label><i class="fa-regular fa-clock"></i> Chọn giờ</label>
          <select id="timeSelect" required></select>
          <span class="error-msg">Vui lòng chọn khung giờ.</span>
        </div>
        <div class="form-field" id="f-duration">
          <label><i class="fa-solid fa-hourglass-half"></i> Thời lượng</label>
          <select id="durationSelect">
            <option value="1">1 giờ</option>
            <option value="1.5">1,5 giờ</option>
            <option value="2">2 giờ</option>
            <option value="3">3 giờ</option>
          </select>
        </div>
        <div class="form-field full" id="f-name">
          <label><i class="fa-solid fa-user"></i> Họ tên</label>
          <input type="text" id="nameInput" placeholder="VD: Nguyễn Văn A" autocomplete="name" required />
          <span class="error-msg">Vui lòng nhập họ tên (tối thiểu 2 ký tự).</span>
        </div>
        <div class="form-field" id="f-phone">
          <label><i class="fa-solid fa-phone"></i> Số điện thoại</label>
          <input type="tel" id="phoneInput" placeholder="VD: 0912345678" autocomplete="tel" required />
          <span class="error-msg">Số điện thoại không hợp lệ (VD: 0912345678).</span>
        </div>
        <div class="form-field" id="f-email">
          <label><i class="fa-solid fa-envelope"></i> Email</label>
          <input type="email" id="emailInput" placeholder="VD: an@email.com" autocomplete="email" required />
          <span class="error-msg">Email không hợp lệ.</span>
        </div>
        <div class="total-box">
          <div class="t-lbl"><i class="fa-solid fa-calculator"></i> Tổng tiền</div>
          <div class="t-amount" id="totalAmount">0đ</div>
        </div>
        <button type="submit" class="btn-book"><i class="fa-solid fa-check-circle"></i> Xác nhận đặt sân</button>
      </div>
    </form>
  `;

  $('#dateInput').min = todayStr();
  $('#dateInput').addEventListener('change', (e) => {
    state.booking.date = e.target.value;
  });
  $('#timeSelect').addEventListener('change', (e) => {
    state.booking.time = e.target.value;
  });
  $('#durationSelect').addEventListener('change', () => updateTotal());

  $('#bookForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateBooking()) {
      showSuccess();
    } else {
      const firstInvalid = $('#bookForm .form-field.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
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

  // Grid delegation
  $('#sanGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const court = SAN_DATA.find((c) => c.id === btn.dataset.id);
    if (!court) return;
    if (btn.dataset.action === 'detail') openDetail(court);
    else if (btn.dataset.action === 'book' && court.status === 'trong') openBook(court);
  });

  // Detail modal body delegation (nút đặt sân trong chi tiết)
  $('#detailBody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-open-book]');
    if (!btn) return;
    const court = SAN_DATA.find((c) => c.id === btn.dataset.openBook);
    if (!court || court.status !== 'trong') return;
    closeModal($('#detailModal'));
    openBook(court);
  });

  // Close modals
  $$('.modal-close').forEach((btn) =>
    btn.addEventListener('click', () =>
      closeModal(btn.closest('.modal-overlay'))
    )
  );
  $$('.modal-overlay').forEach((ov) =>
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeModal(ov);
    })
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape')
      $$('.modal-overlay.open').forEach((ov) => closeModal(ov));
  });

  // Toast close
  $('#toastClose').addEventListener('click', () =>
    $('#toast').classList.remove('show')
  );

  renderGrid();
}

document.addEventListener('DOMContentLoaded', init);