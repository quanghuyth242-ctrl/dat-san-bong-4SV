
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

// ============================= STORE ĐƠN ĐẶT =============================
/**
 * Đơn đặt nằm trong store dùng chung nên đơn tạo ở trang chủ cũng hiện và bị
 * chặn trùng ở đây, và admin đổi trạng thái thì các trang khác cập nhật theo.
 */
function loadBookings() {
  return SV.bookings();
}

/**
 * Slot đã bị chiếm: giờ bắt đầu -> giờ kết thúc (số thập phân).
 * duration có thể 1.5 nên giữ dạng số thập phân, ví dụ 17.5 = 17:30.
 */
function isSlotTaken(courtId, date, startHour, duration) {
  return SV.isSlotTaken(courtId, date, startHour, startHour + duration);
}

function isCourtFullyBooked(courtId, date) {
  return loadBookings().some((b) => b.courtId === courtId && b.date === date);
}

function isPastSlot(date, startHour) {
  if (date !== todayStr()) return false;
  const now = new Date();
  return startHour < now.getHours() + now.getMinutes() / 60;
}

/** Khung giờ còn khả dụng = trong giờ mở cửa, chưa qua, chưa bị đặt, đủ sức chứa duration. */
function availableHours(court, date) {
  const out = [];
  for (let h = court.hours.open; h <= court.hours.close - 1; h += 0.5) {
    if (h < court.hours.open) continue;
    if (isPastSlot(date, h)) continue;
    out.push(h);
  }
  return out;
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
      <article class="san-card" data-id="${esc(c.id)}">
        <a href="chi-tiet-san.html?id=${encodeURIComponent(c.id)}" class="san-card-img" style="display:block;text-decoration:none;">
          <img src="${esc(c.img)}" alt="${esc(c.name)}" loading="lazy" onerror="this.src='${DEFAULT_IMG}'"/>
          <span class="san-badge badge-status ${c.status}">
            <i class="fa-solid ${c.status === 'trong' ? 'fa-circle-check' : c.status === 'da-dat' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}"></i>
            ${STATUS_LABEL[c.status]}
          </span>
          <span class="san-badge badge-type type"><i class="fa-solid fa-futbol"></i> ${TYPE_LABEL[c.type]}</span>
        </a>
        <div class="san-card-body">
          <h3 class="san-name">
            <a href="chi-tiet-san.html?id=${encodeURIComponent(c.id)}" style="color:inherit;text-decoration:none;">
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
            <a href="chi-tiet-san.html?id=${encodeURIComponent(c.id)}" class="btn-card btn-outline">
              <i class="fa-solid fa-eye"></i> Xem chi tiết
            </a>
            <a href="chi-tiet-san.html?id=${encodeURIComponent(c.id)}&book=1" class="btn-card btn-solid ${c.status !== 'trong' ? 'disabled' : ''}">
              ${c.status === 'trong' ? '<i class="fa-solid fa-calendar-check"></i> Đặt sân' : '<i class="fa-solid fa-ban"></i> Không nhận đặt'}
            </a>
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
      <img src="${esc(court.img)}" alt="${esc(court.name)}" onerror="this.src='${DEFAULT_IMG}'"/>
      <div class="overlay">
        <h2>${esc(court.name)}</h2>
      </div>
    </div>
    <div class="detail-rows">
      <div class="detail-item">
        <i class="fa-solid fa-location-dot"></i>
        <div><div class="lbl">Địa chỉ</div><div class="val">${esc(court.address)}</div></div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-layer-group"></i>
        <div><div class="lbl">Số sân</div><div class="val">${court.courts} sân</div></div>
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
      <p class="detail-desc">${esc(court.desc)}</p>
    </div>
    <button type="button" class="btn-book detail-book" data-open-book="${court.id}" ${court.status !== 'trong' ? 'disabled' : ''}>
      ${court.status === 'trong' ? '<i class="fa-solid fa-calendar-check"></i> Đặt sân ngay' : 'Sân hiện ' + (court.status === 'da-dat' ? 'đã được đặt' : 'đang bảo trì')}
    </button>
  `;
  openModal($('#detailModal'));
}

// ---------- ĐẶT SÂN ----------
/**
 * Khung giờ khả dụng cho một ngày + duration.
 * Bỏ khung nào đã qua, đã có đơn, hoặc không đủ sức chứa duration.
 */
function buildTimeOptions(court, date, duration) {
  const opts = [];
  for (let h = court.hours.open; h < court.hours.close; h += 1) {
    if (h + duration > court.hours.close) continue;
    if (isPastSlot(date, h)) continue;
    if (isSlotTaken(court.id, date, h, duration)) continue;
    opts.push(
      `<option value="${h}">${timeLabel(h)} – ${timeLabel(h + duration)}</option>`
    );
  }
  return opts.join('');
}

function refreshTimeOptions() {
  const court = state.activeCourt;
  const sel = $('#timeSelect');
  if (!court || !sel) return;

  const date = $('#dateInput').value;
  if (!date) {
    sel.innerHTML = '<option value="">-- Chọn ngày trước --</option>';
    sel.value = '';
    return;
  }

  const duration = parseFloat($('#durationSelect').value) || 1;
  const prev = sel.value;
  sel.innerHTML = buildTimeOptions(court, date, duration);

  if (prev && sel.querySelector(`option[value="${prev}"]`)) sel.value = prev;
  if (!sel.value) sel.selectedIndex = 0;

  if (!sel.options.length) {
    sel.innerHTML = `<option value="">-- ${
      isCourtFullyBooked(court.id, date) ? 'Đã kín lịch' : 'Không còn khung giờ trống'
    } --</option>`;
    sel.value = '';
  }
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

  const dateInput = $('#dateInput');
  dateInput.min = todayStr();
  $('#dateInput').value = todayStr();
  state.booking.date = todayStr();
  $('#durationSelect').value = '1';

  refreshTimeOptions();
  updateTotal();
  openModal($('#bookModal'));
}

function todayStr() {
  return SV.todayStr();
}

function updateTotal() {
  const court = state.activeCourt;
  if (!court) return;
  const duration = parseFloat($('#durationSelect').value) || 1;
  const subtotal = Math.round(court.price * duration);
  state.booking.duration = duration;
  state.booking.subtotal = subtotal;

  // Ô mã chỉ tồn tại khi form đặt sân đang mở.
  const voucherInput = $('#voucherInput');
  if (!voucherInput) {
    $('#totalAmount').innerHTML = formatPrice(subtotal);
    state.booking.voucherCode = '';
    state.booking.discount = 0;
    return;
  }

  const code = voucherInput.value.trim().toUpperCase();
  const voucher = code ? SV.previewVoucher(code, subtotal) : null;
  const usable = !!(voucher && voucher.ok);
  state.booking.voucherCode = usable ? code : '';
  state.booking.discount = usable ? voucher.discount : 0;

  // Báo lỗi ngay khi gõ, không bắt phải bấm mới thấy.
  $('#f-voucher').classList.toggle('invalid', !!code && !usable);
  const total = subtotal - state.booking.discount;
  $('#totalAmount').innerHTML =
    state.booking.discount > 0
      ? `${formatPrice(total)} <small>(-${formatPrice(state.booking.discount)})</small>`
      : formatPrice(total);
}

function validateBooking() {
  const set = (field, ok) => {
    $('#f-' + field)?.classList.toggle('invalid', !ok);
  };

  const court = state.activeCourt;
  if (!court) return false;

  // Ngày
  const dateVal = $('#dateInput').value;
  const dateOk = !!dateVal && dateVal >= todayStr();
  set('date', dateOk);

  // Giờ: phải còn trong giờ mở cửa, chưa qua và chưa bị đặt
  const timeVal = parseFloat($('#timeSelect').value);
  const duration = parseFloat($('#durationSelect').value) || 1;
  let timeOk = Number.isFinite(timeVal) && !!dateVal;
  if (timeOk) {
    if (timeVal < court.hours.open || timeVal + duration > court.hours.close) {
      timeOk = false;
    } else if (isPastSlot(dateVal, timeVal)) {
      timeOk = false;
    } else if (isSlotTaken(court.id, dateVal, timeVal, duration)) {
      timeOk = false;
    }
  }
  set('time', timeOk);

  // Họ tên
  const nameVal = $('#nameInput').value.trim();
  const nameOk = nameVal.length >= 2;
  set('name', nameOk);

  // SĐT
  const phoneVal = $('#phoneInput').value.trim().replace(/[\s.-]/g, '');
  const phoneOk = /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phoneVal);
  set('phone', phoneOk);

  // Email (nếu nhập thì phải đúng cú pháp, hoặc để trống)
  const emailVal = $('#emailInput').value.trim();
  const emailOk = !emailVal || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
  set('email', emailOk);

  if (!nameOk) {
    $('#nameInput')?.focus();
    showToast('Lỗi nhập liệu', 'Vui lòng nhập họ tên của bạn (tối thiểu 2 ký tự)');
    return false;
  }
  if (!phoneOk) {
    $('#phoneInput')?.focus();
    showToast('Lỗi nhập liệu', 'Vui lòng nhập số điện thoại hợp lệ (10 số, VD: 0912345678)');
    return false;
  }
  if (!dateOk) {
    $('#dateInput')?.focus();
    showToast('Lỗi nhập liệu', 'Vui lòng chọn ngày đặt hợp lệ (không chọn ngày quá khứ)');
    return false;
  }
  if (!timeOk) {
    $('#timeSelect')?.focus();
    showToast('Lỗi khung giờ', 'Khung giờ này không còn trống hoặc nằm ngoài giờ mở cửa');
    return false;
  }
  if (!emailOk) {
    $('#emailInput')?.focus();
    showToast('Lỗi email', 'Địa chỉ email không đúng định dạng');
    return false;
  }

  return true;
}

function showSuccess() {
  const court = state.activeCourt;
  const date = $('#dateInput').value;
  const startHour = parseFloat($('#timeSelect').value);
  const duration = state.booking.duration;
  const time = `${timeLabel(startHour)} – ${timeLabel(startHour + duration)}`;

  const bookFn = window.SV?.createBooking || window.SV?.addBooking;
  if (!bookFn) {
    showToast('Lỗi hệ thống', 'Dữ liệu chưa sẵn sàng, vui lòng thử lại');
    return;
  }

  const currentUser = window.SV?.currentUser ? window.SV.currentUser() : null;

  const result = bookFn({
    courtId: court.id,
    courtName: court.name,
    date,
    startHour,
    endHour: startHour + duration,
    duration,
    total: court.price * duration,
    voucherCode: state.booking.voucherCode || '',
    userId: currentUser?.id || '',
    userName: $('#nameInput').value.trim(),
    customer: {
      name: $('#nameInput').value.trim(),
      phone: $('#phoneInput').value.trim(),
      email: $('#emailInput').value.trim(),
    },
    status: 'pending',
  });
  const booking = result && result.ok ? result.booking : null;

  if (!booking) {
    $('#bookBody').innerHTML = `
      <div class="success-wrap">
        <div class="success-icon" style="background:#fee2e2;color:#dc2626"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Đặt sân không thành công</h3>
        <p>${result?.error || 'Vui lòng thử lại.'}</p>
        <button type="button" class="btn-again" id="bookAgainBtn"><i class="fa-solid fa-rotate-left"></i> Chọn giờ khác</button>
      </div>`;
    $('#bookAgainBtn').addEventListener('click', () => openBook(court));
    return;
  }

  $('#bookBody').innerHTML = `
    <div class="success-wrap">
      <div class="success-icon"><i class="fa-solid fa-check"></i></div>
      <h3>Đặt sân thành công!</h3>
      <p>Mã đơn <b>${booking.id}</b> · Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.</p>
      <div class="success-summary">
        <div><span>Sân</span><b>${court.name}</b></div>
        <div><span>Ngày</span><b>${date}</b></div>
        <div><span>Giờ</span><b>${time}</b></div>
        <div><span>Thời lượng</span><b>${duration} giờ</b></div>
        ${
          booking.discount > 0
            ? `<div><span>Tạm tính</span><b style="text-decoration:line-through">${formatPrice(booking.subtotal)}</b></div>
               <div><span>Giảm giá (${booking.voucherCode})</span><b style="color:#16a34a">-${formatPrice(booking.discount)}</b></div>
               <div><span>Tổng tiền</span><b>${formatPrice(booking.total)}</b></div>`
            : `<div><span>Tổng tiền</span><b>${formatPrice(booking.total)}</b></div>`
        }
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

  renderGrid();
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
          <span class="error-msg">Khung giờ này không còn trống hoặc nằm ngoài giờ mở cửa. Vui lòng chọn khung khác.</span>
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
        <div class="form-field full" id="f-voucher">
          <label><i class="fa-solid fa-ticket"></i> Mã giảm giá (nếu có)</label>
          <input type="text" id="voucherInput" placeholder="VD: WELCOME4SV" autocomplete="off" />
          <span class="error-msg">Mã giảm giá không dùng được với đơn này.</span>
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
    refreshTimeOptions();
  });
  $('#timeSelect').addEventListener('change', (e) => {
    state.booking.time = e.target.value;
  });
  $('#durationSelect').addEventListener('change', () => {
    updateTotal();
    refreshTimeOptions();
  });
  $('#voucherInput').addEventListener('input', updateTotal);

  // Gỡ trạng thái lỗi ngay khi user sửa, không bắt submit lại mới hết đỏ
  $('#bookForm').querySelectorAll('input, select').forEach((el) => {
    const clearError = () => {
      const field = el.closest('.form-field');
      if (field) field.classList.remove('invalid');
    };
    el.addEventListener('input', clearError);
    el.addEventListener('change', clearError);
  });

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

  // Link "Đặt sân" trên header: chuyển tới trang đặt sân của sân còn trống đầu tiên
  $('#navBook')?.addEventListener('click', (e) => {
    e.preventDefault();
    const first = SAN_DATA.find((c) => c.status === 'trong') || SAN_DATA[0];
    if (first) {
      window.location.href = `chi-tiet-san.html?id=${encodeURIComponent(first.id)}&book=1`;
    } else {
      showToast('Hiện tại đã kín sân', 'Vui lòng quay lại sau');
    }
  });

  // Grid delegation
  $('#sanGrid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const court = SAN_DATA.find((c) => c.id === btn.dataset.id);
    if (!court) return;
    if (btn.dataset.action === 'detail') {
      window.location.href = `chi-tiet-san.html?id=${encodeURIComponent(court.id)}`;
    } else if (btn.dataset.action === 'book') {
      window.location.href = `chi-tiet-san.html?id=${encodeURIComponent(court.id)}&book=1`;
    }
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

  // Admin sửa sân / đổi trạng thái đơn ở tab khác thì trang này cập nhật theo.
  SV.on((key) => {
    if (key !== 'fields' && key !== 'bookings' && key !== '*') return;
    SAN_DATA = buildSanData();
    renderGrid();
    if (state.activeCourt) {
      // Sân đang mở có thể đã bị admin khoá, đóng lại để khỏi đặt nhầm.
      const still = SAN_DATA.find((c) => c.id === state.activeCourt.id);
      if (!still || still.status !== 'trong') {
        closeModal($('#bookModal'));
        closeModal($('#detailModal'));
        state.activeCourt = null;
      } else {
        // Giá / giờ mở cửa có thể vừa đổi: lấy bản mới và vẽ lại khung giờ
        // vì số khung trống đã thay đổi theo đơn vừa được đặt hoặc huỷ.
        state.activeCourt = still;
        if ($('#bookModal')?.classList.contains('open')) refreshTimeOptions();
      }
    }
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

// ============================= FAG LEAGUE COURT DETAIL & BOOKING =============================

function sportIcon(s) {
  if (s === 'Cầu lông') return 'fa-table-tennis-paddle-ball';
  if (s === 'Pickleball') return 'fa-baseball';
  return 'fa-futbol';
}

function friendlyDateStr(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const dt = new Date(y, m - 1, d);
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return `${days[dt.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function renderPriceTable(court) {
  const tbody = $('#priceTableBody');
  if (!tbody) return;
  const sports = (court.sports && court.sports.length > 0) ? court.sports : [court.sport || 'Bóng đá'];
  const rows = [];
  const baseP = court.price || 300000;

  if (sports.includes('Bóng đá')) {
    rows.push({
      sport: 'Bóng đá',
      time: '06:00 – 16:00',
      sub: 'Khung giờ sáng & chiều',
      icon: 'sun',
      price: Math.round(baseP * 0.85),
    });
    rows.push({
      sport: 'Bóng đá',
      time: '16:00 – 18:30',
      sub: 'Khung giờ chiều tan tầm',
      icon: 'sun',
      price: Math.round(baseP * 1.0),
    });
    rows.push({
      sport: 'Bóng đá',
      time: '18:30 – 21:00',
      sub: 'Giờ vàng cao điểm (Đèn LED)',
      icon: 'moon',
      price: Math.round(baseP * 1.35),
    });
    rows.push({
      sport: 'Bóng đá',
      time: '21:00 – 23:00',
      sub: 'Khung giờ đêm muộn',
      icon: 'moon',
      price: Math.round(baseP * 0.9),
    });
  }

  if (sports.includes('Cầu lông')) {
    rows.push({
      sport: 'Cầu lông',
      time: '06:00 – 17:00',
      sub: 'Khung giờ tiêu chuẩn',
      icon: 'sun',
      price: 180000,
    });
    rows.push({
      sport: 'Cầu lông',
      time: '17:00 – 22:00',
      sub: 'Khung giờ cao điểm',
      icon: 'moon',
      price: 240000,
    });
  }

  if (sports.includes('Pickleball')) {
    rows.push({
      sport: 'Pickleball',
      time: '06:00 – 17:00',
      sub: 'Khung giờ tiêu chuẩn',
      icon: 'sun',
      price: 200000,
    });
    rows.push({
      sport: 'Pickleball',
      time: '17:00 – 22:00',
      sub: 'Khung giờ cao điểm',
      icon: 'moon',
      price: 260000,
    });
  }

  tbody.innerHTML = rows
    .map(
      (r) => `
      <tr>
        <td>
          <span class="badge-sport-chip" style="font-size:13px;padding:4px 10px;">
            <i class="fa-solid ${sportIcon(r.sport)}" style="color:var(--primary);"></i> ${esc(r.sport)}
          </span>
        </td>
        <td>
          <div style="display:flex;flex-direction:column;gap:2px;">
            <span class="slot-tag-chip ${r.icon}">
              <i class="fa-solid fa-${r.icon}"></i> ${r.time}
            </span>
            <small style="color:var(--text-muted);font-size:12px;">${r.sub}</small>
          </div>
        </td>
        <td class="price-col">${formatPrice(r.price)} / giờ</td>
      </tr>`
    )
    .join('');
}

function initCourtDetail() {
  initAuthNav();
  if ($('#year')) $('#year').textContent = new Date().getFullYear();

  const params = new URLSearchParams(window.location.search);
  const courtId = params.get('id') || 'SAN001';
  let allCourts = buildSanData();
  let court = allCourts.find((c) => c.id === courtId);
  if (!court) {
    const rawF = SV.field(courtId);
    if (rawF) {
      court = {
        id: rawF.id,
        name: rawF.name,
        address: rawF.address,
        type: SV.pitchNumber(rawF.type),
        price: rawF.price,
        status: rawF.status === 'active' ? 'trong' : 'bao-tri',
        courts: rawF.courts || 4,
        hours: { open: rawF.hours?.open ?? 6, close: rawF.hours?.close ?? 23 },
        lat: rawF.lat,
        lng: rawF.lng,
        desc: rawF.desc || `${rawF.name} là sân thể thao tiêu chuẩn tại ${rawF.address}.`,
        img: rawF.img || DEFAULT_IMG,
        rating: rawF.rating || 4.9,
        reviewCount: rawF.reviewCount || 160,
        sports: Array.isArray(rawF.sports) && rawF.sports.length > 0 ? rawF.sports : [rawF.sport || 'Bóng đá'],
        badge: rawF.badge || 'Chuẩn thi đấu',
      };
    } else {
      court = allCourts[0];
    }
  }

  const detailState = {
    court,
    selectedSport: (court.sports && court.sports.length > 0) ? court.sports[0] : 'Bóng đá',
    selectedDate: SV.todayStr(),
    selectedSlot: null,
    voucherCode: '',
    discount: 0,
    activeImgIndex: 0,
    images: [
      court.img || DEFAULT_IMG,
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
      'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80',
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80',
    ],
  };

  // Breadcrumb & Court Head Info
  if ($('#bcCourtName')) $('#bcCourtName').textContent = court.name;
  if ($('#courtTitle')) $('#courtTitle').textContent = court.name;
  document.title = `${court.name} - Chi tiết sân & Đặt sân | 4SV.vn`;

  if ($('#courtRatingText')) $('#courtRatingText').textContent = (court.rating || 4.9).toFixed(1);
  if ($('#courtReviewCount')) $('#courtReviewCount').textContent = `(${court.reviewCount || 150} đánh giá)`;

  const statusChip = $('#courtStatusChip');
  if (statusChip) {
    if (court.status === 'trong') {
      statusChip.className = 'badge-status-chip is-open';
      statusChip.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đang mở cửa';
    } else {
      statusChip.className = 'badge-status-chip';
      statusChip.style.background = '#fef2f2';
      statusChip.style.color = '#dc2626';
      statusChip.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Tạm bảo trì';
    }
  }

  if ($('#courtSportChip')) {
    $('#courtSportChip').innerHTML = `<i class="fa-solid fa-award"></i> ${court.badge || `${court.sports.length} môn thể thao`}`;
  }
  if ($('#courtAddress')) $('#courtAddress').textContent = court.address;
  if ($('#courtDistance')) {
    const kmNum = ((parseInt(court.id.replace(/\D/g, '') || '1', 10) % 5) * 0.7 + 1.2).toFixed(1);
    $('#courtDistance').textContent = `Cách trung tâm ~${kmNum} km`;
  }
  if ($('#courtCourtsCount')) {
    $('#courtCourtsCount').textContent = `${court.courts || 4} sân mini (Sân ${court.type})`;
  }

  // Share & Fav buttons
  $('#btnShareCourt')?.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Đã sao chép liên kết', 'Bạn có thể gửi liên kết cho bạn bè để cùng đặt sân');
      });
    } else {
      showToast('Chia sẻ sân', window.location.href);
    }
  });

  $('#btnFavCourt')?.addEventListener('click', function () {
    const isFav = this.classList.toggle('active');
    const icon = this.querySelector('i');
    if (isFav) {
      icon.className = 'fa-solid fa-heart';
      icon.style.color = '#ef4444';
      showToast('Đã lưu yêu thích', `Đã thêm ${court.name} vào danh sách sân yêu thích`);
    } else {
      icon.className = 'fa-regular fa-heart';
      icon.style.color = '';
      showToast('Đã bỏ yêu thích', `Đã xóa ${court.name} khỏi danh sách`);
    }
  });

  // Gallery
  const mainImg = $('#galleryMainImg');
  const counterEl = $('#galleryCounter span');
  const thumbsEl = $('#galleryThumbs');
  const badgeEl = $('#galleryBadge');

  if (badgeEl) badgeEl.innerHTML = `<i class="fa-solid fa-futbol"></i> Sân ${court.type} người`;

  function renderGallery() {
    if (mainImg) mainImg.src = detailState.images[detailState.activeImgIndex];
    if (counterEl) counterEl.textContent = `${detailState.activeImgIndex + 1} / ${detailState.images.length}`;
    if (thumbsEl) {
      thumbsEl.innerHTML = detailState.images
        .map(
          (src, idx) => `
          <div class="gallery-thumb-item ${idx === detailState.activeImgIndex ? 'active' : ''}" data-idx="${idx}">
            <img src="${src}" alt="Ảnh sân ${idx + 1}" />
          </div>`
        )
        .join('');
    }
  }
  renderGallery();

  $('#galleryPrev')?.addEventListener('click', () => {
    detailState.activeImgIndex =
      (detailState.activeImgIndex - 1 + detailState.images.length) % detailState.images.length;
    renderGallery();
  });
  $('#galleryNext')?.addEventListener('click', () => {
    detailState.activeImgIndex =
      (detailState.activeImgIndex + 1) % detailState.images.length;
    renderGallery();
  });
  thumbsEl?.addEventListener('click', (e) => {
    const thumb = e.target.closest('.gallery-thumb-item');
    if (!thumb) return;
    detailState.activeImgIndex = parseInt(thumb.dataset.idx, 10);
    renderGallery();
  });

  // Tabs Navigation
  let leafletMapInstance = null;
  $$('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const tabTarget = btn.dataset.tab;
      $$('.tab-pane').forEach((p) => {
        p.classList.remove('active');
        p.hidden = true;
      });

      if (tabTarget === 'price') {
        const pane = $('#tabPrice');
        if (pane) {
          pane.hidden = false;
          pane.classList.add('active');
        }
      } else if (tabTarget === 'location') {
        const pane = $('#tabLocation');
        if (pane) {
          pane.hidden = false;
          pane.classList.add('active');
          setTimeout(() => {
            if (leafletMapInstance) leafletMapInstance.invalidateSize();
          }, 150);
        }
      } else if (tabTarget === 'info') {
        const pane = $('#tabInfo');
        if (pane) {
          pane.hidden = false;
          pane.classList.add('active');
        }
      }
    });
  });

  // Render Tab 1: Price Table
  renderPriceTable(court);

  // Render Tab 2: Location & Map
  if ($('#courtLocationGuide')) {
    $('#courtLocationGuide').textContent = `${court.name} nằm tại ${court.address}. Mặt tiền thoáng rộng, có bảo vệ trông giữ ô tô và xe máy 24/7.`;
  }
  if ($('#btnGmaps')) {
    $('#btnGmaps').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(court.name + ' ' + court.address)}`;
  }

  if (window.L && $('#courtMap')) {
    const lat = court.lat || 21.0285;
    const lng = court.lng || 105.8542;
    try {
      leafletMapInstance = L.map('courtMap').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors | 4SV.vn',
      }).addTo(leafletMapInstance);
      L.marker([lat, lng])
        .addTo(leafletMapInstance)
        .bindPopup(`<b>${esc(court.name)}</b><br/><span style="font-size:12px">${esc(court.address)}</span>`)
        .openPopup();
    } catch (err) {
      console.warn('Leaflet map error:', err);
    }
  }

  // Render Tab 3: Description
  if ($('#courtDesc')) {
    $('#courtDesc').textContent =
      court.desc ||
      `${court.name} là tổ hợp thể thao chuyên nghiệp tại ${court.address}, đạt chuẩn thi đấu giao hữu và phong trào. Mặt sân cỏ nhân tạo cao cấp thế hệ mới, hệ thống 16 đèn LED chống chói và tiện ích dịch vụ đầy đủ phục vụ các giải đấu.`;
  }

  // Right-hand Booking Card
  // 1. Sport Pills
  const sportPillsContainer = $('#sportPills');
  if (sportPillsContainer) {
    sportPillsContainer.innerHTML = court.sports
      .map(
        (s, idx) => `
        <button type="button" class="sport-pill ${idx === 0 ? 'active' : ''}" data-sport="${esc(s)}">
          <i class="fa-solid ${sportIcon(s)}"></i> ${esc(s)}
        </button>`
      )
      .join('');

    sportPillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.sport-pill');
      if (!btn) return;
      $$('.sport-pill', sportPillsContainer).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      detailState.selectedSport = btn.dataset.sport;
      detailState.selectedSlot = null;
      renderTimeSlots();
      updateSummary();
    });
  }

  // 2. Date Selection
  const dateInput = $('#bkDateInput');
  if (dateInput) {
    dateInput.min = SV.todayStr();
    dateInput.value = SV.todayStr();
    detailState.selectedDate = SV.todayStr();

    const friendlyDateEl = $('#friendlyDateText');
    if (friendlyDateEl) friendlyDateEl.textContent = friendlyDateStr(detailState.selectedDate);

    dateInput.addEventListener('change', (e) => {
      if (!e.target.value || e.target.value < SV.todayStr()) {
        dateInput.value = SV.todayStr();
      }
      detailState.selectedDate = dateInput.value;
      if (friendlyDateEl) friendlyDateEl.textContent = friendlyDateStr(detailState.selectedDate);
      detailState.selectedSlot = null;
      renderTimeSlots();
      updateSummary();
    });
  }

  $$('.date-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.date-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const dayType = chip.dataset.day;
      const d = new Date();
      if (dayType === '0') {
        // Today
      } else if (dayType === '1') {
        d.setDate(d.getDate() + 1);
      } else if (dayType === 'weekend') {
        const currDay = d.getDay();
        const addDays = currDay === 6 ? 1 : currDay === 0 ? 0 : 6 - currDay;
        d.setDate(d.getDate() + addDays);
      }
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      if (dateInput) dateInput.value = dateStr;
      detailState.selectedDate = dateStr;
      if ($('#friendlyDateText')) $('#friendlyDateText').textContent = friendlyDateStr(dateStr);
      detailState.selectedSlot = null;
      renderTimeSlots();
      updateSummary();
    });
  });

  // 3. Time Slots Generation
  function generateSlots(courtObj, sport) {
    const slots = [];
    const openH = courtObj.hours ? courtObj.hours.open : 6;
    const closeH = courtObj.hours ? courtObj.hours.close : 23;
    const baseP = courtObj.price || 300000;

    const templates = [
      { start: 6, dur: 1.5, mult: 0.85 },
      { start: 7.5, dur: 1.5, mult: 0.85 },
      { start: 9, dur: 1.5, mult: 0.85 },
      { start: 14.5, dur: 1.5, mult: 0.9 },
      { start: 16, dur: 1.5, mult: 1.0 },
      { start: 17.5, dur: 1.5, mult: 1.35 },
      { start: 19, dur: 1.5, mult: 1.35 },
      { start: 20.5, dur: 1.5, mult: 1.25 },
      { start: 22, dur: 1, mult: 0.9 },
    ];

    templates.forEach((t) => {
      if (t.start >= openH && t.start + t.dur <= closeH) {
        let price = Math.round(baseP * t.mult);
        if (sport === 'Cầu lông') price = 220000;
        else if (sport === 'Pickleball') price = 250000;
        slots.push({
          startHour: t.start,
          duration: t.dur,
          endHour: t.start + t.dur,
          label: `${timeLabel(t.start)} – ${timeLabel(t.start + t.dur)}`,
          price: price,
        });
      }
    });

    return slots;
  }

  function renderTimeSlots() {
    const grid = $('#timeSlotsGrid');
    const emptyMsg = $('#slotEmptyMsg');
    if (!grid) return;

    const slots = generateSlots(detailState.court, detailState.selectedSport);
    const date = detailState.selectedDate;

    let availableCount = 0;
    grid.innerHTML = slots
      .map((slot) => {
        const isPast = isPastSlot(date, slot.startHour);
        const isTaken = SV.isSlotTaken(detailState.court.id, date, slot.startHour, slot.duration);
        const isSelected =
          detailState.selectedSlot &&
          detailState.selectedSlot.startHour === slot.startHour;
        const disabled = isPast || isTaken;
        if (!disabled) availableCount++;

        return `
          <button type="button" class="time-slot-btn ${disabled ? 'disabled' : ''} ${isSelected ? 'active' : ''}"
                  data-start="${slot.startHour}"
                  data-duration="${slot.duration}"
                  data-price="${slot.price}"
                  data-label="${slot.label}"
                  ${disabled ? 'disabled' : ''}>
            <strong>${slot.label}</strong>
            <span>${isTaken ? 'Đã đặt' : isPast ? 'Quá giờ' : formatPrice(slot.price)}</span>
          </button>
        `;
      })
      .join('');

    if (emptyMsg) emptyMsg.style.display = availableCount === 0 ? 'block' : 'none';
  }

  $('#timeSlotsGrid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.time-slot-btn');
    if (!btn || btn.disabled || btn.classList.contains('disabled')) return;
    $$('.time-slot-btn', $('#timeSlotsGrid')).forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    detailState.selectedSlot = {
      startHour: parseFloat(btn.dataset.start),
      duration: parseFloat(btn.dataset.duration),
      price: parseInt(btn.dataset.price, 10),
      label: btn.dataset.label,
    };
    updateSummary();
  });

  // 4. Voucher Check
  $('#btnApplyVoucher')?.addEventListener('click', () => {
    const code = $('#bkVoucherCode')?.value.trim().toUpperCase() || '';
    const msgEl = $('#voucherMsg');
    if (!msgEl) return;

    if (!code) {
      msgEl.className = 'voucher-status-msg err';
      msgEl.textContent = 'Vui lòng nhập mã giảm giá!';
      return;
    }
    const subtotal = detailState.selectedSlot ? detailState.selectedSlot.price : detailState.court.price;
    const check = SV.previewVoucher(code, subtotal);
    if (check.ok) {
      detailState.voucherCode = code;
      detailState.discount = check.discount;
      msgEl.className = 'voucher-status-msg ok';
      msgEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Áp dụng thành công! Giảm ${formatPrice(check.discount)}`;
      updateSummary();
    } else {
      detailState.voucherCode = '';
      detailState.discount = 0;
      msgEl.className = 'voucher-status-msg err';
      msgEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${check.error || 'Mã không hợp lệ hoặc đã hết lượt'}`;
      updateSummary();
    }
  });

  function updateSummary() {
    if ($('#sumCourtName')) $('#sumCourtName').textContent = detailState.court.name;
    if ($('#sumPlayDate')) $('#sumPlayDate').textContent = friendlyDateStr(detailState.selectedDate);
    if ($('#sumSport')) $('#sumSport').textContent = detailState.selectedSport;
    if (detailState.selectedSlot) {
      if ($('#sumTimeSlot')) $('#sumTimeSlot').textContent = detailState.selectedSlot.label;
      const subtotal = detailState.selectedSlot.price;
      const finalTotal = Math.max(0, subtotal - detailState.discount);
      if ($('#sumTotalPrice')) {
        $('#sumTotalPrice').innerHTML = detailState.discount > 0
          ? `<span style="font-size:13px;color:#94a3b8;text-decoration:line-through;margin-right:6px;">${formatPrice(subtotal)}</span> ${formatPrice(finalTotal)}`
          : formatPrice(subtotal);
      }
    } else {
      if ($('#sumTimeSlot')) $('#sumTimeSlot').textContent = '— (Chưa chọn)';
      if ($('#sumTotalPrice')) $('#sumTotalPrice').textContent = '0 đ';
    }
  }

  renderTimeSlots();
  updateSummary();

  // 5. Submit Booking Form -> Open Confirmation Modal
  $('#fagBookForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!detailState.selectedSlot) {
      showToast('Chưa chọn giờ', 'Vui lòng chọn một khung giờ thi đấu còn trống!');
      $('#timeSlotsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if ($('#cfCourt')) $('#cfCourt').textContent = detailState.court.name;
    if ($('#cfDate')) $('#cfDate').textContent = friendlyDateStr(detailState.selectedDate);
    if ($('#cfTime')) $('#cfTime').textContent = detailState.selectedSlot.label;
    if ($('#cfSport')) $('#cfSport').textContent = detailState.selectedSport;
    const finalTotal = Math.max(0, detailState.selectedSlot.price - detailState.discount);
    if ($('#cfTotal')) $('#cfTotal').textContent = formatPrice(finalTotal);

    const user = SV.currentUser();
    if (user) {
      if ($('#cfName')) $('#cfName').value = user.name || '';
      if ($('#cfPhone')) $('#cfPhone').value = user.phone || '';
      if ($('#cfEmail')) $('#cfEmail').value = user.email || '';
    }

    openModal($('#confirmModal'));
  });

  $('#btnCancelConfirm')?.addEventListener('click', () => {
    closeModal($('#confirmModal'));
  });

  // 6. Confirm Modal Form Submit -> Save to Store
  $('#cfCustomerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#cfName')?.value.trim() || '';
    const phone = $('#cfPhone')?.value.trim() || '';
    const email = $('#cfEmail')?.value.trim() || '';
    const note = $('#cfNote')?.value.trim() || '';

    if (name.length < 2) {
      showToast('Lỗi nhập liệu', 'Vui lòng nhập họ và tên của bạn');
      $('#cfName')?.focus();
      return;
    }
    if (!/^0\d{9}$/.test(phone)) {
      showToast('Lỗi số điện thoại', 'Vui lòng nhập số điện thoại hợp lệ (10 số, VD: 0912345678)');
      $('#cfPhone')?.focus();
      return;
    }

    const startH = detailState.selectedSlot.startHour;
    const dur = detailState.selectedSlot.duration;
    const finalTotal = Math.max(0, detailState.selectedSlot.price - detailState.discount);

    if (SV.isSlotTaken(detailState.court.id, detailState.selectedDate, startH, dur)) {
      showToast('Trùng lịch', 'Khung giờ này vừa có người đặt trước, vui lòng chọn giờ khác!');
      closeModal($('#confirmModal'));
      renderTimeSlots();
      return;
    }

    const user = SV.currentUser();
    const res = SV.addBooking({
      courtId: detailState.court.id,
      courtName: detailState.court.name,
      date: detailState.selectedDate,
      startHour: startH,
      endHour: startH + dur,
      duration: dur,
      total: finalTotal,
      voucherCode: detailState.voucherCode,
      userId: user?.id || '',
      userName: name,
      customer: {
        name,
        phone,
        email,
        note,
      },
      status: 'pending',
    });

    if (res && res.ok) {
      closeModal($('#confirmModal'));

      if ($('#succBookingId')) $('#succBookingId').textContent = res.booking.id;
      if ($('#succDetailsBox')) {
        $('#succDetailsBox').innerHTML = `
          <div class="succ-row"><span>Sân thể thao</span><strong>${esc(detailState.court.name)}</strong></div>
          <div class="succ-row"><span>Môn thi đấu</span><strong>${esc(detailState.selectedSport)}</strong></div>
          <div class="succ-row"><span>Ngày chơi</span><strong>${friendlyDateStr(detailState.selectedDate)}</strong></div>
          <div class="succ-row"><span>Khung giờ</span><strong style="color:var(--primary);">${detailState.selectedSlot.label}</strong></div>
          <div class="succ-row"><span>Người đặt</span><strong>${esc(name)} (${esc(phone)})</strong></div>
          <div class="succ-row"><span>Tổng thanh toán</span><strong style="color:var(--primary); font-size:1.15rem;">${formatPrice(res.booking.total)}</strong></div>
        `;
      }
      openModal($('#successModal'));

      detailState.selectedSlot = null;
      renderTimeSlots();
      updateSummary();
      showToast('Đặt sân thành công!', `Mã đơn: ${res.booking.id} · Cảm ơn bạn!`);
    } else {
      showToast('Không thành công', res?.error || 'Vui lòng kiểm tra lại');
    }
  });

  // Modal Closers
  $$('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeModal(btn.closest('.modal-overlay'));
    });
  });
  $$('.modal-overlay').forEach((ov) => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeModal(ov);
    });
  });

  if (params.get('book') === '1') {
    setTimeout(() => {
      $('#fagBookForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  }

  $('#toastClose')?.addEventListener('click', () => {
    $('#toast')?.classList.remove('show');
  });

  SV.on((key) => {
    if (key === 'bookings' || key === 'fields' || key === '*') {
      renderTimeSlots();
      updateSummary();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('courtDetailApp')) {
    initCourtDetail();
  } else if (document.getElementById('sanGrid')) {
    init();
  }
});

