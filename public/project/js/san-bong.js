
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
    courts: f.courts,
    hours: { open: f.hours.open, close: f.hours.close },
    lat: f.lat,
    lng: f.lng,
    desc: f.desc || `${f.name} - ${f.type} tại ${f.address}.`,
    img: f.img,
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
        <div class="san-card-img">
          <img src="${esc(c.img)}" alt="${esc(c.name)}" loading="lazy" onerror="this.src='${DEFAULT_IMG}'"/>
          <span class="san-badge badge-status ${c.status}">
            <i class="fa-solid ${c.status === 'trong' ? 'fa-circle-check' : c.status === 'da-dat' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}"></i>
            ${STATUS_LABEL[c.status]}
          </span>
          <span class="san-badge badge-type type"><i class="fa-solid fa-futbol"></i> ${TYPE_LABEL[c.type]}</span>
        </div>
        <div class="san-card-body">
          <h3 class="san-name">${esc(c.name)}</h3>
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

// Dịch vụ đi kèm khi đặt sân (giá tính cho mỗi buổi)
const SERVICES = [
  { id: 'nuoc-suoi', name: 'Nước suối', price: 10000, unit: 'chai', icon: 'fa-bottle-water' },
  { id: 'nuoc-tang-luc', name: 'Nước tăng lực', price: 15000, unit: 'chai', icon: 'fa-bolt' },
  { id: 'thue-bong', name: 'Thuê bóng thi đấu', price: 50000, unit: 'quả', icon: 'fa-futbol' },
  { id: 'ao-bib', name: 'Áo bib', price: 20000, unit: 'bộ', icon: 'fa-shirt' },
  { id: 'trong-tai', name: 'Trọng tài', price: 200000, unit: 'trận', icon: 'fa-user-tie', max: 1 },
  { id: 'var', name: 'VAR (trợ lý video)', price: 300000, unit: 'trận', icon: 'fa-video', max: 1 },
];

function getService(id) {
  return SERVICES.find((s) => s.id === id) || null;
}

/** Danh sách dịch vụ đã chọn (qty > 0) kèm giá mỗi buổi. */
function selectedServices() {
  return SERVICES.map((s) => ({ ...s, qty: state.booking.services?.[s.id] || 0 })).filter(
    (s) => s.qty > 0
  );
}

/** Tổng tiền dịch vụ cho 1 buổi. */
function serviceCostPerSession() {
  return selectedServices().reduce((sum, s) => sum + s.price * s.qty, 0);
}

const REPEAT_LABEL = {
  none: 'Không lặp lại',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
};

function toDateStr(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** Cộng tháng và tự kẹp ngày về cuối tháng khác (31/1 + 1 tháng = 28/2). */
function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return toDateStr(d);
}

/** Danh sách ngày cho đặt lịch định kỳ theo tuần/tháng/quý/năm. */
function repeatDates(startDate, type, count) {
  const total = Math.max(1, Math.min(52, Number(count) || 1));
  const out = [];
  for (let i = 0; i < total; i += 1) {
    if (type === 'weekly') out.push(addDays(startDate, i * 7));
    else if (type === 'monthly') out.push(addMonths(startDate, i));
    else if (type === 'quarterly') out.push(addMonths(startDate, i * 3));
    else if (type === 'yearly') out.push(addMonths(startDate, i * 12));
    else out.push(startDate);
  }
  return out;
}

/** Hiện/ẩn ô số buổi theo lựa chọn định kỳ. */
function updateRepeatUI() {
  const repeat = $('#repeatSelect')?.value || 'none';
  const wrap = $('#f-repeatCount');
  if (wrap) wrap.style.display = repeat === 'none' ? 'none' : 'flex';
}

function openBook(court) {
  state.activeCourt = court;
  state.booking = { date: '', time: '', duration: 1, repeat: 'none', repeatCount: 1, services: {} };
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
  if ($('#repeatSelect')) {
    $('#repeatSelect').value = 'none';
    $('#repeatCount').value = '1';
    updateRepeatUI();
  }

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
  const repeat = $('#repeatSelect')?.value || 'none';
  const count =
    repeat === 'none'
      ? 1
      : Math.max(1, Math.min(52, parseInt($('#repeatCount')?.value, 10) || 1));
  const courtSub = Math.round((Number(court.price) || 0) * duration);
  const servicePer = serviceCostPerSession();
  const subtotal = courtSub + servicePer;
  state.booking.duration = duration;
  state.booking.repeat = repeat;
  state.booking.repeatCount = count;
  state.booking.subtotal = subtotal;

  // Ô mã chỉ tồn tại khi form đặt sân đang mở.
  const voucherInput = $('#voucherInput');
  if (!voucherInput) {
    $('#totalAmount').innerHTML = formatPrice(subtotal * count);
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

  const perSession = subtotal - state.booking.discount;
  const total = perSession * count;
  const parts = [`${formatPrice(courtSub)} × ${count} buổi`];
  if (servicePer > 0) parts.push(`+ DV ${formatPrice(servicePer)}`);
  if (state.booking.discount > 0) parts.push(`-${formatPrice(state.booking.discount)}`);
  $('#totalAmount').innerHTML =
    `${formatPrice(total)}${count > 1 ? ` <small>(${count} buổi)</small>` : ''}` +
    `<span class="t-detail">${parts.join(' ')}</span>`;
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

  // Số buổi đặt định kỳ (chỉ khi chọn lặp lại)
  const repeatVal = $('#repeatSelect')?.value || 'none';
  let repeatOk = true;
  if (repeatVal !== 'none') {
    const cnt = parseInt($('#repeatCount')?.value, 10);
    repeatOk = Number.isFinite(cnt) && cnt >= 1 && cnt <= 52;
  }
  set('repeatCount', repeatOk);

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

  if (!repeatOk) {
    $('#repeatCount')?.focus();
    showToast('Lỗi nhập liệu', 'Số buổi đặt định kỳ phải từ 1 đến 52');
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
  const startDate = $('#dateInput').value;
  const startHour = parseFloat($('#timeSelect').value);
  const duration = state.booking.duration;
  const repeat = $('#repeatSelect')?.value || 'none';
  const count =
    repeat === 'none'
      ? 1
      : Math.max(1, Math.min(52, parseInt($('#repeatCount')?.value, 10) || 1));
  const dates = repeatDates(startDate, repeat, count);
  const time = `${timeLabel(startHour)} – ${timeLabel(startHour + duration)}`;

  const bookFn = window.SV?.createBooking || window.SV?.addBooking;
  if (!bookFn) {
    showToast('Lỗi hệ thống', 'Dữ liệu chưa sẵn sàng, vui lòng thử lại');
    return;
  }

  const currentUser = window.SV?.currentUser ? window.SV.currentUser() : null;
  const customer = {
    name: $('#nameInput').value.trim(),
    phone: $('#phoneInput').value.trim(),
    email: $('#emailInput').value.trim(),
  };

  const services = selectedServices().map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    unit: s.unit,
    qty: s.qty,
  }));
  const servicePer = serviceCostPerSession();
  const courtTotal = Math.round((Number(court.price) || 0) * duration);

  // Đặt định kỳ: tạo từng buổi, bỏ qua buổi đã có người đặt hoặc đã qua.
  const created = [];
  const skipped = [];
  let lastError = '';
  dates.forEach((date) => {
    if (isPastSlot(date, startHour) || isSlotTaken(court.id, date, startHour, duration)) {
      skipped.push(date);
      return;
    }
    const result = bookFn({
      courtId: court.id,
      courtName: court.name,
      type: court.type || '',
      date,
      startHour,
      endHour: startHour + duration,
      duration,
      courtTotal,
      serviceTotal: servicePer,
      services,
      total: courtTotal + servicePer,
      voucherCode: state.booking.voucherCode || '',
      repeat,
      repeatCount: repeat === 'none' ? 1 : count,
      userId: currentUser?.id || '',
      userName: customer.name,
      customer,
      status: 'pending',
    });
    if (result && result.ok) created.push(result.booking);
    else {
      if (result?.error) lastError = result.error;
      skipped.push(date);
    }
  });

  if (!created.length) {
    $('#bookBody').innerHTML = `
      <div class="success-wrap">
        <div class="success-icon" style="background:#fee2e2;color:#dc2626"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Đặt sân không thành công</h3>
        <p>${lastError || 'Tất cả khung giờ đã chọn đều đã có người đặt. Vui lòng chọn lại.'}</p>
        <button type="button" class="btn-again" id="bookAgainBtn"><i class="fa-solid fa-rotate-left"></i> Chọn giờ khác</button>
      </div>`;
    $('#bookAgainBtn').addEventListener('click', () => openBook(court));
    return;
  }

  const firstBooking = created[0];
  const payId = firstBooking.id;
  const total = created.reduce((sum, b) => sum + (Number(b.total) || 0), 0);
  const dateRange =
    created.length > 1
      ? `${created[0].date} → ${created[created.length - 1].date}`
      : startDate;
  const repeatLine =
    repeat === 'none'
      ? ''
      : `<div><span>Hình thức</span><b>${REPEAT_LABEL[repeat]} · ${created.length} buổi</b></div>`;
  const serviceLine = services.length
    ? `<div><span>Dịch vụ đi kèm</span><b>${services
        .map((s) => `${s.name} ×${s.qty}`)
        .join(', ')}</b></div>
       <div><span>Tiền dịch vụ</span><b>${formatPrice(servicePer)}${
        created.length > 1 ? ` × ${created.length} buổi` : ''
      }</b></div>`
    : '';

  $('#bookBody').innerHTML = `
    <div class="success-wrap">
      <div class="success-icon"><i class="fa-solid fa-check"></i></div>
      <h3>Đặt sân thành công!</h3>
      <p>Mã đơn <b>${firstBooking.id}</b>${
        created.length > 1 ? ` (+${created.length - 1} buổi)` : ''
      } · Đang mở trang thanh toán...</p>
      <div class="success-summary">
        <div><span>Sân</span><b>${court.name}</b></div>
        <div><span>Ngày</span><b>${dateRange}</b></div>
        <div><span>Giờ</span><b>${time}</b></div>
        <div><span>Thời lượng</span><b>${duration} giờ</b></div>
        ${repeatLine}
        <div><span>Số buổi</span><b>${created.length}${
          skipped.length ? ` (bỏ ${skipped.length} buổi trùng)` : ''
        }</b></div>
        ${serviceLine}
        ${
          firstBooking.discount > 0
            ? `<div><span>Tạm tính</span><b style="text-decoration:line-through">${formatPrice(firstBooking.subtotal)}${created.length > 1 ? ` × ${created.length}` : ''}</b></div>
               <div><span>Giảm giá (${firstBooking.voucherCode})</span><b style="color:#16a34a">-${formatPrice(firstBooking.discount)}${created.length > 1 ? ` × ${created.length}` : ''}</b></div>`
            : ''
        }
        <div><span>Tổng tiền</span><b>${formatPrice(total)}</b></div>
      </div>
      <div class="success-summary">
        <div><span>Họ tên</span><b>${customer.name}</b></div>
        <div><span>Số điện thoại</span><b>${customer.phone}</b></div>
        <div><span>Email</span><b>${customer.email}</b></div>
      </div>
      <div class="success-actions">
        <a class="btn-pay" id="payNowBtn" href="../../src/thanh-toan.html?ma=${encodeURIComponent(payId)}"><i class="fa-solid fa-credit-card"></i> Thanh toán ngay</a>
        <button type="button" class="btn-again" id="bookAgainBtn"><i class="fa-solid fa-plus"></i> Đặt sân khác</button>
      </div>
    </div>
  `;

  // Đặt thành công -> chuyển sang trang thanh toán sau vài giây, khách vẫn
  // có thể bấm nút để đi ngay hoặc ở lại đặt sân khác.
  const payTimer = setTimeout(() => {
    window.location.href = `../../src/thanh-toan.html?ma=${encodeURIComponent(payId)}`;
  }, 1500);

  document.getElementById('payNowBtn').addEventListener('click', () => clearTimeout(payTimer));

  $('#bookAgainBtn').addEventListener('click', () => {
    clearTimeout(payTimer);
    openBook(court);
  });

  renderGrid();
  showToast(
    'Đặt sân thành công',
    `${court.name} · ${created.length} buổi · ${time}`
  );
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
        <div class="form-field" id="f-repeat">
          <label><i class="fa-solid fa-repeat"></i> Đặt định kỳ</label>
          <select id="repeatSelect">
            <option value="none">Không lặp lại</option>
            <option value="weekly">Hàng tuần</option>
            <option value="monthly">Hàng tháng</option>
            <option value="quarterly">Hàng quý</option>
            <option value="yearly">Hàng năm</option>
          </select>
        </div>
        <div class="form-field" id="f-repeatCount" style="display:none">
          <label><i class="fa-solid fa-hashtag"></i> Số buổi</label>
          <input type="number" id="repeatCount" min="1" max="52" value="1" />
          <span class="error-msg">Số buổi phải từ 1 đến 52.</span>
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
        <div class="form-field full" id="f-services">
          <label><i class="fa-solid fa-cart-plus"></i> Dịch vụ đi kèm <span class="label-hint">(tuỳ chọn · ✓ chọn 1 · +/− chọn số lượng)</span></label>
          <div class="service-list" id="serviceList">
            ${SERVICES.map(
              (s) => `
              <div class="service-item" data-id="${s.id}">
                <i class="fa-solid ${s.icon} svc-icon"></i>
                <div class="svc-info">
                  <div class="svc-name">${s.name}</div>
                  <div class="svc-price">${formatPrice(s.price)} / ${s.unit}</div>
                </div>
                <div class="s-qty">
                  ${
                    s.max === 1
                      ? `<button type="button" class="qty-check" data-act="toggle" data-id="${s.id}" aria-pressed="false" aria-label="Chọn ${s.name}"><i class="fa-solid fa-check"></i></button>`
                      : `<button type="button" class="qty-btn" data-act="dec" data-id="${s.id}" aria-label="Giảm">−</button>
                  <span class="qty-val" id="qty-${s.id}">0</span>
                  <button type="button" class="qty-btn" data-act="inc" data-id="${s.id}" aria-label="Tăng">+</button>`
                  }
                </div>
              </div>`
            ).join('')}
          </div>
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
  $('#repeatSelect').addEventListener('change', () => {
    updateRepeatUI();
    updateTotal();
  });
  $('#repeatCount').addEventListener('input', updateTotal);

  // Dịch vụ đi kèm: ± số lượng, hoặc ✓ toggle cho loại max 1 (trọng tài/VAR)
  $('#serviceList').addEventListener('click', (e) => {
    const btn = e.target.closest('.qty-btn, .qty-check');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    const cur = state.booking.services[id] || 0;
    const max = getService(id)?.max ?? 99;
    const delta = act === 'inc' ? 1 : act === 'dec' ? -1 : 0;
    const next = Math.max(
      0,
      Math.min(max, act === 'toggle' ? (cur > 0 ? 0 : 1) : cur + delta)
    );
    if (next === 0) delete state.booking.services[id];
    else state.booking.services[id] = next;
    const valEl = $('#qty-' + id);
    if (valEl) valEl.textContent = next;
    const item = btn.closest('.service-item');
    item?.classList.toggle('active', next > 0);
    if (btn.classList.contains('qty-check')) {
      btn.setAttribute('aria-pressed', String(next > 0));
    }
    item?.querySelector('.qty-btn[data-act="inc"]')?.toggleAttribute('disabled', next >= max);
    updateTotal();
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

  // Link "Đặt sân" trên header: mở form của sân còn trống đầu tiên
  $('#navBook')?.addEventListener('click', (e) => {
    e.preventDefault();
    const first = SAN_DATA.find((c) => c.status === 'trong');
    if (first) openBook(first);
    else showToast('Hiện tại đã kín sân', 'Vui lòng quay lại sau');
  });

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
  const outBtn = document.getElementById('listUserLogout');
  if (!nameEl || !outBtn) return;

  function render() {
    const user = SV.currentUser();
    document.querySelectorAll('[data-auth="login"]').forEach((el) => {
      el.hidden = !!user;
    });
    document.querySelectorAll('[data-auth="user"]').forEach((el) => {
      el.hidden = !user;
    });
    if (user) nameEl.textContent = user.name || user.email || 'Tài khoản';
  }

  outBtn.addEventListener('click', () => {
    SV.signOut();
    render();
  });

  SV.on((key) => {
    if (key === 'auth' || key === 'users' || key === '*') render();
  });

  render();
}

document.addEventListener('DOMContentLoaded', init);
