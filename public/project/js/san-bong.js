// ============================= DỮ LIỆU SÂN BÓNG MẶC ĐỊNH =============================
const DEFAULT_SAN_DATA = [
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

// ============================= ĐỌC DỮ LIỆU TỪ ADMIN (localStorage) =============================
const SAN_IMAGES = [
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80&auto=format&fit=crop',
];

function parseTypeNumber(typeStr) {
  // "Sân 5" -> "5", "Sân 7" -> "7", "Sân 11" -> "11"
  const match = typeStr && typeStr.match(/\d+/);
  return match ? match[0] : '5';
}

function loadSanDataFromAdmin() {
  try {
    const stored = localStorage.getItem('admin_fields');
    if (!stored) return null;
    const fields = JSON.parse(stored);
    if (!Array.isArray(fields) || fields.length === 0) return null;

    return fields.map((f, idx) => ({
      id: f.id || 'san-' + (idx + 1),
      name: f.name,
      address: f.address,
      type: parseTypeNumber(f.type),
      price: f.price,
      status: f.status === 'active' ? 'trong' : 'bao-tri',
      hours: { open: 6, close: 22 },
      desc: `${f.name} - ${f.type} tại ${f.address}. Sân chất lượng cao, hệ thống đèn chiếu sáng hiện đại.`,
      img: SAN_IMAGES[idx % SAN_IMAGES.length],
    }));
  } catch (e) {
    console.warn('Lỗi đọc dữ liệu admin:', e);
    return null;
  }
}

// Ưu tiên dữ liệu từ admin (localStorage), nếu không có thì dùng dữ liệu mặc định
const SAN_DATA = loadSanDataFromAdmin() || DEFAULT_SAN_DATA;

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
const BOOKING_KEY = '4sv_bookings';

function loadBookings() {
  try {
    const raw = localStorage.getItem(BOOKING_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn('Lỗi đọc đơn đặt:', e);
    return [];
  }
}

function saveBookings(list) {
  try {
    localStorage.setItem(BOOKING_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Lỗi lưu đơn đặt:', e);
  }
}

let bookingSeq = 0;
function addBooking(booking) {
  const list = loadBookings();
  booking.id = 'BD' + (Date.now() + bookingSeq++);
  list.push(booking);
  saveBookings(list);
  return booking;
}

/**
 * Slot đã bị chiếm: giờ bắt đầu -> giờ kết thúc (số thập phân).
 * duration có thể 1.5 nên giữ dạng số thập phân, ví dụ 17.5 = 17:30.
 * Đơn đã hủy không tính là chiếm sân.
 */
function isSlotTaken(courtId, date, startHour, duration) {
  const endHour = startHour + duration;
  return loadBookings().some(
    (b) =>
      b.status !== 'cancelled' &&
      b.courtId === courtId &&
      b.date === date &&
      startHour < b.endHour &&
      endHour > b.startHour
  );
}

function isPastSlot(date, startHour) {
  if (date !== todayStr()) return false;
  const now = new Date();
  return startHour < now.getHours() + now.getMinutes() / 60;
}

// ============================= STATE =============================
const state = {
  search: '',
  type: 'all',
  prices: new Set(),
  onlyAvailable: false,
  sort: 'default',
  activeCourt: null,
  booking: { date: '', time: '', duration: 1, repeat: 'none', repeatCount: 1, services: {} },
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
const REPEAT_LABEL = {
  none: 'Không lặp lại',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
};

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

/** Cộng tháng và tự kẹp ngày về cuối tháng đích (31/1 + 1 tháng = 28/2). */
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

/**
 * Trạng thái từng khung giờ bắt đầu cho ngày + thời lượng hiện tại.
 * Giữ lại cả khung đã bị đặt để người dùng thấy, nhưng không cho chọn.
 */
function slotList(court, date, duration) {
  const list = [];
  for (let h = court.hours.open; h < court.hours.close; h += 1) {
    const bookedHour = isSlotTaken(court.id, date, h, 1);
    list.push({
      hour: h,
      end: h + duration,
      past: isPastSlot(date, h),
      bookedHour,
      overlaps: !bookedHour && isSlotTaken(court.id, date, h, duration),
    });
  }
  return list;
}

/** Vẽ lưới khung giờ: còn trống / đã đặt / trùng giờ / đã qua. */
function renderSlots(court, date, duration) {
  const grid = $('#slotGrid');
  if (!grid) return;

  if (!date) {
    grid.innerHTML = '<p class="slot-empty">Chọn ngày để xem khung giờ trống.</p>';
    return;
  }

  const slots = slotList(court, date, duration);
  if (!slots.length) {
    grid.innerHTML = '<p class="slot-empty">Sân không có khung giờ nào.</p>';
    return;
  }

  grid.innerHTML = slots
    .map((s) => {
      const selected = Number(state.booking.time) === s.hour ? ' selected' : '';
      let mod = 'free';
      let note = 'Còn trống';
      if (s.past) {
        mod = 'past';
        note = 'Đã qua';
      } else if (s.bookedHour) {
        mod = 'booked';
        note = 'Đã đặt';
      } else if (s.overlaps) {
        mod = 'blocked';
        note = 'Trùng giờ';
      }
      return `<button type="button" class="slot slot-${mod}${selected}" data-hour="${s.hour}">
        <span class="slot-time">${timeLabel(s.hour)}</span>
        <span class="slot-note">${note}</span>
      </button>`;
    })
    .join('');
}

/** Bấm vào khung giờ: chọn được nếu trống, còn lại thì thông báo lý do. */
function bindSlotGrid(court) {
  const grid = $('#slotGrid');
  if (!grid) return;
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.slot');
    if (!btn) return;
    const hour = parseFloat(btn.dataset.hour);
    const date = $('#dateInput').value;
    const duration = parseFloat($('#durationSelect').value) || 1;
    const end = hour + duration;

    if (btn.classList.contains('slot-past')) {
      showToast('Khung giờ đã qua', `${timeLabel(hour)} đã qua, vui lòng chọn khung giờ khác.`);
      return;
    }
    if (btn.classList.contains('slot-booked')) {
      showToast(
        'Khung giờ đã có người đặt',
        `${timeLabel(hour)} – ${timeLabel(hour + 1)} đã được đặt. Vui lòng chọn khung giờ khác.`
      );
      return;
    }
    if (btn.classList.contains('slot-blocked')) {
      showToast(
        'Khung giờ trùng lịch đã đặt',
        `Khung ${timeLabel(hour)} – ${timeLabel(end)} trùng với lịch đã có người đặt. Vui lòng chọn khung khác.`
      );
      return;
    }

    state.booking.time = hour;
    $('#f-time')?.classList.remove('invalid');
    renderSlots(court, date, duration);
  });
}

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
  dateInput.value = todayStr();
  state.booking.date = todayStr();
  $('#durationSelect').value = '1';
  $('#repeatSelect').value = 'none';
  $('#repeatCount').value = '1';
  updateRepeatUI();

  const duration = 1;
  renderSlots(court, state.booking.date, duration);
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
  const repeat = $('#repeatSelect').value || 'none';
  const count = repeat === 'none' ? 1 : Math.max(1, Math.min(52, parseInt($('#repeatCount').value, 10) || 1));
  const sessions = count;
  const courtPer = court.price * duration;
  const servicePer = serviceCostPerSession();
  const total = (courtPer + servicePer) * sessions;
  state.booking.duration = duration;
  state.booking.repeat = repeat;
  state.booking.repeatCount = count;

  const amount = $('#totalAmount');
  const parts = [`${formatPrice(courtPer)} × ${sessions}`];
  if (servicePer > 0) parts.push(`+ DV ${formatPrice(servicePer)}`);
  if (repeat !== 'none' && sessions > 1) {
    amount.innerHTML = `${formatPrice(total)} <small>(${sessions} buổi)</small><span class="t-detail">${parts.join(' ')}</span>`;
  } else {
    amount.innerHTML = `${formatPrice(total)}<span class="t-detail">${parts.join(' ')}</span>`;
  }
}

function validateBooking() {
  const set = (field, ok) => {
    $('#f-' + field)?.classList.toggle('invalid', !ok);
  };

  const court = state.activeCourt;
  if (!court) return false;

  // Ngày
  let ok = true;
  const dateVal = $('#dateInput').value;
  const dateOk = !!dateVal && dateVal >= todayStr();
  set('date', dateOk);
  if (!dateOk) ok = false;

  // Giờ: chưa qua và chưa bị đặt (cho phép kéo dài quá giờ đóng cửa)
  const timeVal = Number(state.booking.time);
  const duration = parseFloat($('#durationSelect').value) || 1;
  let timeOk = Number.isFinite(timeVal) && timeVal !== 0 && !!dateVal;
  if (timeOk) {
    if (timeVal < court.hours.open) {
      timeOk = false;
    } else if (isPastSlot(dateVal, timeVal)) {
      timeOk = false;
    } else if (isSlotTaken(court.id, dateVal, timeVal, duration)) {
      timeOk = false;
    }
  }
  set('time', timeOk);
  if (!timeOk) ok = false;

  // Lịch định kỳ: số buổi hợp lệ và không vượt quá tương lai quá xa
  const repeat = $('#repeatSelect').value || 'none';
  if (repeat !== 'none') {
    const count = parseInt($('#repeatCount').value, 10);
    const countOk = Number.isFinite(count) && count >= 1 && count <= 52;
    set('repeatCount', countOk);
    if (!countOk) ok = false;
  }

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
  const startDate = $('#dateInput').value;
  const startHour = Number(state.booking.time);
  const duration = state.booking.duration;
  const repeat = $('#repeatSelect').value || 'none';
  const count = repeat === 'none' ? 1 : Math.max(1, Math.min(52, parseInt($('#repeatCount').value, 10) || 1));
  const dates = repeatDates(startDate, repeat, count);
  const time = `${timeLabel(startHour)} – ${timeLabel(startHour + duration)}`;

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
  const courtTotal = court.price * duration;
  const bookingTotal = courtTotal + servicePer;

  const created = [];
  const skipped = [];
  dates.forEach((date) => {
    // Bỏ qua buổi bị trùng (đã có người đặt hoặc đã qua) thay vì chặn toàn bộ
    if (isPastSlot(date, startHour) || isSlotTaken(court.id, date, startHour, duration)) {
      skipped.push(date);
      return;
    }
    created.push(
      addBooking({
        courtId: court.id,
        courtName: court.name,
        date,
        startHour,
        endHour: startHour + duration,
        duration,
        courtTotal,
        serviceTotal: servicePer,
        services,
        total: bookingTotal,
        repeat: repeat,
        customer,
        status: 'pending',
      })
    );
  });

  if (!created.length) {
    showToast('Không thể đặt sân', 'Tất cả khung giờ đã chọn đều đã có người đặt. Vui lòng chọn lại.');
    return;
  }

  const total = bookingTotal * created.length;
  const firstId = created[0].id;
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
      <p>Mã đơn <b>${firstId}</b>${created.length > 1 ? ` (+${created.length - 1} buổi)` : ''} · Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.</p>
      <div class="success-summary">
        <div><span>Sân</span><b>${court.name}</b></div>
        <div><span>Ngày</span><b>${created.length > 1 ? `${dates[0]} → ${dates[dates.length - 1]}` : startDate}</b></div>
        <div><span>Giờ</span><b>${time}</b></div>
        <div><span>Thời lượng</span><b>${duration} giờ</b></div>
        ${repeatLine}
        <div><span>Số buổi</span><b>${created.length}${skipped.length ? ` (bỏ ${skipped.length} buổi trùng)` : ''}</b></div>
        ${serviceLine}
        <div><span>Tổng tiền</span><b>${formatPrice(total)}</b></div>
      </div>
      <div class="success-summary">
        <div><span>Họ tên</span><b>${customer.name}</b></div>
        <div><span>Số điện thoại</span><b>${customer.phone}</b></div>
        <div><span>Email</span><b>${customer.email}</b></div>
      </div>
      <button type="button" class="btn-again" id="bookAgainBtn"><i class="fa-solid fa-plus"></i> Đặt sân khác</button>
    </div>
  `;

  $('#bookAgainBtn').addEventListener('click', () => {
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
        <div class="form-field" id="f-duration">
          <label><i class="fa-solid fa-hourglass-half"></i> Thời lượng</label>
          <select id="durationSelect">
            <option value="1">1 giờ</option>
            <option value="1.5">1,5 giờ</option>
            <option value="2">2 giờ</option>
            <option value="3">3 giờ</option>
          </select>
        </div>
        <div class="form-field full" id="f-time">
          <label><i class="fa-regular fa-clock"></i> Chọn khung giờ</label>
          <div class="slot-legend">
            <span class="legend-item"><i class="dot dot-free"></i> Còn trống</span>
            <span class="legend-item"><i class="dot dot-booked"></i> Đã có người đặt</span>
            <span class="legend-item"><i class="dot dot-blocked"></i> Trùng giờ</span>
            <span class="legend-item"><i class="dot dot-past"></i> Đã qua</span>
          </div>
          <div class="slot-grid" id="slotGrid"></div>
          <span class="error-msg">Vui lòng chọn một khung giờ còn trống.</span>
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
    state.booking.time = '';
    renderSlots(court, e.target.value, parseFloat($('#durationSelect').value) || 1);
  });
  $('#durationSelect').addEventListener('change', () => {
    state.booking.time = '';
    updateTotal();
    renderSlots(court, $('#dateInput').value, parseFloat($('#durationSelect').value) || 1);
  });
  $('#repeatSelect').addEventListener('change', () => {
    updateRepeatUI();
    updateTotal();
  });
  $('#repeatCount').addEventListener('input', updateTotal);

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
    } else if (act === 'inc') {
      btn.toggleAttribute('disabled', next >= max);
    }
    updateTotal();
  });

  bindSlotGrid(court);

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

  renderGrid();
}

document.addEventListener('DOMContentLoaded', init);