/**
 * Băm mật khẩu SHA-256 để lưu vào localStorage.
 * Lưu ý: đây chỉ là rào cản ở phía trình duyệt,
 * không thay thế việc xác thực phía máy chủ.
 */
async function hashPassword(password) {
  const data = new TextEncoder().encode('4sv-admin-pw:' + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Mọi dữ liệu của trang quản trị nằm trong store dùng chung (public/project/js/store.js)
 * để trang chủ, trang danh sách sân và trang đăng nhập thấy cùng một dữ liệu:
 * sửa sân ở đây thì trang chủ hiện ngay, đăng ký ở trang chủ thì xuất hiện ở đây,
 * đổi trạng thái đơn ở đây thì trang chủ cũng đổi theo.
 */
const DataManager = {
  getFields() { return SV.fields(); },
  saveFields(data) { SV.saveFields(data); },

  getUsers() { return SV.users(); },
  saveUsers(data) { SV.saveUsers(data); },

  getBookings() { return SV.bookings(); },
  saveBookings(data) { SV.saveBookings(data); },

  getSettings() { return SV.settings(); },
  saveSettings(data) { SV.saveSettings(data); },

  getReviews() { return SV.reviews(); },
  saveReviews(data) { SV.saveReviews(data); },

  getVouchers() { return SV.vouchers(); },
  saveVouchers(data) { SV.saveVouchers(data); },

  getNextId(prefix, items) {
    return SV.nextId(prefix, items);
  },
};

// ==========================================
// ANIMATION HELPERS
// ==========================================
function animateCounter(element, start, end, duration = 750, formatFn = null) {
  if (!element) return;
  const startNum = Number(start) || 0;
  const endNum = Number(end) || 0;
  if (isNaN(endNum)) {
    element.textContent = end;
    return;
  }
  const isFloat = String(end).includes('.');
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = startNum + (endNum - startNum) * easeProgress;

    if (formatFn) {
      element.textContent = formatFn(currentVal);
    } else if (isFloat) {
      element.textContent = currentVal.toFixed(1);
    } else {
      element.textContent = Math.round(currentVal);
    }

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      if (formatFn) {
        element.textContent = formatFn(endNum);
      } else if (isFloat) {
        element.textContent = endNum.toFixed(1);
      } else {
        element.textContent = endNum;
      }
    }
  }

  requestAnimationFrame(step);
}

// Global button click ripple effect
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const circle = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - radius}px`;
  circle.style.top = `${e.clientY - rect.top - radius}px`;
  circle.className = 'btn-ripple';
  const existingRipple = btn.querySelector('.btn-ripple');
  if (existingRipple) existingRipple.remove();
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
});

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    danger: '✕',
    warning: '⚠'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span style="font-weight: 700; font-size: 1.15em;">${icons[type] || '●'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%) scale(0.9)';
    toast.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => toast.remove(), 350);
  }, 2500);
}

function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay active';
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <div class="confirm-icon">⚠️</div>
      <div class="confirm-title">${title}</div>
      <div class="confirm-message">${message}</div>
      <div class="confirm-actions">
        <button class="btn btn-outline" id="confirmCancel">Hủy</button>
        <button class="btn btn-danger" id="confirmOk">Xác nhận</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeConfirm = () => {
    const dialog = overlay.querySelector('.confirm-dialog');
    if (dialog) {
      dialog.style.transform = 'scale(0.85) translateY(16px)';
      dialog.style.opacity = '0';
      dialog.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.25s ease';
    setTimeout(() => overlay.remove(), 250);
  };

  overlay.querySelector('#confirmCancel').onclick = closeConfirm;
  overlay.querySelector('#confirmOk').onclick = () => {
    closeConfirm();
    onConfirm();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeConfirm();
  });
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('active');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

function getStatusBadge(status, type) {
  const map = {
    field: {
      active: { text: 'Đang hoạt động', cls: 'badge-success' },
      inactive: { text: 'Tạm ngưng', cls: 'badge-danger' }
    },
    booking: {
      pending: { text: 'Chờ xử lý', cls: 'badge-warning' },
      confirmed: { text: 'Đã xác nhận', cls: 'badge-info' },
      completed: { text: 'Đã hoàn thành', cls: 'badge-success' },
      cancelled: { text: 'Đã hủy', cls: 'badge-danger' },
      refunded: { text: 'Đã hoàn tiền', cls: 'badge-danger' }
    },
    payment: {
      paid: { text: 'Đã thanh toán', cls: 'badge-success' },
      awaiting_payment: { text: 'Chờ xác nhận CK', cls: 'badge-warning' },
      unpaid: { text: 'Chưa thanh toán (Tại sân)', cls: 'badge-secondary' },
      refunded: { text: 'Đã hoàn tiền', cls: 'badge-danger' }
    },
    paymentMethod: {
      bank_transfer: { text: 'MBBank (QR)', cls: 'badge-info' },
      at_court: { text: 'Tại sân', cls: 'badge-secondary' }
    },
    user: {
      active: { text: 'Hoạt động', cls: 'badge-success' },
      locked: { text: 'Khóa', cls: 'badge-danger' }
    },
    review: {
      visible: { text: 'Hiển thị', cls: 'badge-success' },
      hidden: { text: 'Đã ẩn', cls: 'badge-danger' }
    },
    voucher: {
      active: { text: 'Hoạt động', cls: 'badge-success' },
      expired: { text: 'Hết hạn', cls: 'badge-warning' },
      disabled: { text: 'Đã tắt', cls: 'badge-danger' }
    }
  };

  const info = map[type]?.[status] || { text: status, cls: 'badge-secondary' };
  return `<span class="badge ${info.cls}">${info.text}</span>`;
}

function initLayout() {
  const toggleBtn = document.querySelector('.btn-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('active');
    });
  });
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('active');
    });
  });
  applySettings();

  const navUl = document.querySelector('.sidebar-nav ul');
  if (navUl && !document.getElementById('adminLogoutItem')) {
    const li = document.createElement('li');
    li.id = 'adminLogoutItem';
    li.className = 'nav-item';
    li.style.marginTop = 'auto';
    li.style.paddingTop = '16px';
    li.style.borderTop = '1px solid var(--border)';
    li.innerHTML = `
      <a href="#" class="nav-link" style="color: #ef4444;">
        <span class="nav-icon">🔒</span>
        <span>Khóa / Đăng xuất</span>
      </a>
    `;
    li.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('admin_authenticated');
      location.reload();
    });
    navUl.appendChild(li);
  }
}

function applySettings() {
  const settings = DataManager.getSettings();
  if (settings.darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  if (settings.primaryColor) {
    document.documentElement.style.setProperty('--primary', settings.primaryColor);
    const hex = settings.primaryColor;
    document.documentElement.style.setProperty('--primary-dark', darkenColor(hex, 15));
  }
  const brandText = document.querySelector('.brand-text');
  if (brandText && settings.siteName) {
    brandText.textContent = settings.siteName;
  }
}

function darkenColor(hex, percent) {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.max(0, Math.floor(r * (1 - percent / 100)));
  g = Math.max(0, Math.floor(g * (1 - percent / 100)));
  b = Math.max(0, Math.floor(b * (1 - percent / 100)));
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function initDashboard() {
  const fields = DataManager.getFields();
  const bookings = DataManager.getBookings();
  const users = DataManager.getUsers();

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  animateCounter(document.getElementById('statFields'), 0, fields.length, 750);
  animateCounter(document.getElementById('statBookings'), 0, bookings.length, 750);
  animateCounter(document.getElementById('statUsers'), 0, users.length, 750);
  animateCounter(document.getElementById('statPending'), 0, pendingCount, 750);
  const tbody = document.getElementById('recentBookingsBody');
  if (tbody) {
    const recent = [...bookings].reverse().slice(0, 5);
    tbody.innerHTML = recent.map(b => `
      <tr>
        <td><strong>${b.id}</strong></td>
        <td>${b.userName}</td>
        <td>${b.fieldName}</td>
        <td>${b.date}</td>
        <td>${b.startTime} - ${b.endTime}</td>
        <td>${formatCurrency(b.total)}</td>
        <td>${getStatusBadge(b.status, 'booking')}</td>
      </tr>
    `).join('');
  }
}

let fieldsData = [];

function initFields() {
  bindFieldListeners();
  refreshFields();
}

/** Vẽ lại danh sách sân từ dữ liệu mới nhất, giữ nguyên từ khoá đang tìm. */
function refreshFields() {
  fieldsData = DataManager.getFields();
  const keyword = (document.getElementById('searchField')?.value || '').toLowerCase();
  const filtered = keyword
    ? fieldsData.filter(f =>
        f.id.toLowerCase().includes(keyword) ||
        f.name.toLowerCase().includes(keyword) ||
        f.address.toLowerCase().includes(keyword) ||
        f.type.toLowerCase().includes(keyword)
      )
    : fieldsData;
  renderFields(filtered);
}

function bindFieldListeners() {
  document.getElementById('searchField')?.addEventListener('input', refreshFields);
  document.getElementById('btnAddField')?.addEventListener('click', () => {
    document.getElementById('fieldModalTitle').textContent = 'Thêm sân bóng';
    document.getElementById('fieldForm').reset();
    document.getElementById('fieldId').value = '';
    document.getElementById('fieldCode').value = DataManager.getNextId('SAN', fieldsData);
    document.getElementById('fieldCode').readOnly = true;
    document.getElementById('fieldCourts').value = 1;
    document.getElementById('fieldOpen').value = 6;
    document.getElementById('fieldClose').value = 22;
    openModal('fieldModal');
  });
  document.getElementById('fieldForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveField();
  });
}

function renderFields(data) {
  const tbody = document.getElementById('fieldsTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚽</div><div class="empty-text">Không tìm thấy sân bóng nào</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(f => `
    <tr>
      <td><strong>${f.id}</strong></td>
      <td>${f.name}</td>
      <td>${f.address}</td>
      <td>${f.type}</td>
      <td>${formatCurrency(f.price)}</td>
      <td>${f.lat != null && f.lng != null ? `<span title="Có toạ độ">📍 ${f.lat}, ${f.lng}</span>` : '<span title="Chưa có toạ độ">Chưa có</span>'}</td>
      <td>${getStatusBadge(f.status, 'field')}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-outline" onclick="editField('${f.id}')" title="Sửa">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteField('${f.id}')" title="Xóa">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function editField(id) {
  const field = fieldsData.find(f => f.id === id);
  if (!field) return;

  document.getElementById('fieldModalTitle').textContent = 'Sửa sân bóng';
  document.getElementById('fieldId').value = field.id;
  document.getElementById('fieldCode').value = field.id;
  document.getElementById('fieldCode').readOnly = true;
  document.getElementById('fieldName').value = field.name;
  document.getElementById('fieldAddress').value = field.address;
  document.getElementById('fieldType').value = field.type;
  document.getElementById('fieldPrice').value = field.price;
  document.getElementById('fieldStatus').value = field.status;
  document.getElementById('fieldCourts').value = field.courts || 1;
  document.getElementById('fieldOpen').value = field.hours?.open ?? 6;
  document.getElementById('fieldClose').value = field.hours?.close ?? 22;
  document.getElementById('fieldLat').value = field.lat ?? '';
  document.getElementById('fieldLng').value = field.lng ?? '';
  document.getElementById('fieldImg').value = field.img || '';
  document.getElementById('fieldDesc').value = field.desc || '';

  openModal('fieldModal');
}

function saveField() {
  const id = document.getElementById('fieldId').value;
  const openHour = parseFloat(document.getElementById('fieldOpen').value);
  const closeHour = parseFloat(document.getElementById('fieldClose').value);
  // Giữ nguyên các trường không nằm trong form (ví dụ ảnh mặc định đã gán) để
  // sửa một chữ không làm mất dữ liệu cũ.
  const current = id ? fieldsData.find(f => f.id === id) : {};
  const img = document.getElementById('fieldImg').value.trim();
  const fieldData = {
    id: document.getElementById('fieldCode').value,
    name: document.getElementById('fieldName').value.trim(),
    address: document.getElementById('fieldAddress').value.trim(),
    type: document.getElementById('fieldType').value,
    price: parseInt(document.getElementById('fieldPrice').value, 10),
    status: document.getElementById('fieldStatus').value,
    courts: parseInt(document.getElementById('fieldCourts').value, 10) || 1,
    hours: {
      open: Number.isFinite(openHour) ? openHour : 6,
      close: Number.isFinite(closeHour) && closeHour > openHour ? closeHour : openHour + 1,
    },
    lat: document.getElementById('fieldLat').value.trim(),
    lng: document.getElementById('fieldLng').value.trim(),
    img: img || current.img || '',
    desc: document.getElementById('fieldDesc').value.trim(),
  };

  if (!fieldData.name || !fieldData.address || !fieldData.price) {
    showToast('Vui lòng điền đầy đủ thông tin!', 'warning');
    return;
  }

  if (id) {
    const idx = fieldsData.findIndex(f => f.id === id);
    if (idx !== -1) {
      fieldsData[idx] = fieldData;
      showToast('Cập nhật sân bóng thành công!');
    }
  } else {
    fieldsData.push(fieldData);
    showToast('Thêm sân bóng thành công!');
  }

  DataManager.saveFields(fieldsData);
  renderFields(fieldsData);
  closeModal('fieldModal');
}

function deleteField(id) {
  const field = fieldsData.find(f => f.id === id);
  if (!field) return;

  showConfirm('Xóa sân bóng', `Bạn có chắc muốn xóa "${field.name}"?`, () => {
    fieldsData = fieldsData.filter(f => f.id !== id);
    DataManager.saveFields(fieldsData);
    renderFields(fieldsData);
    showToast('Đã xóa sân bóng!', 'danger');
  });
}

let bookingsData = [];

function initBookings() {
  bindBookingListeners();
  filterBookings();
}

function bindBookingListeners() {
  document.getElementById('searchBooking')?.addEventListener('input', filterBookings);
  document.getElementById('filterBookingStatus')?.addEventListener('change', filterBookings);
}

/** Vẽ lại danh sách từ dữ liệu mới nhất, giữ nguyên bộ lọc đang dùng. */
function filterBookings() {
  bookingsData = DataManager.getBookings();
  const keyword = (document.getElementById('searchBooking')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('filterBookingStatus')?.value || '';

  let filtered = bookingsData;

  if (keyword) {
    filtered = filtered.filter(b =>
      String(b.id || '').toLowerCase().includes(keyword) ||
      String(b.userName || '').toLowerCase().includes(keyword) ||
      String(b.fieldName || '').toLowerCase().includes(keyword)
    );
  }

  if (statusFilter) {
    filtered = filtered.filter(b => b.status === statusFilter);
  }

  renderBookings(filtered);
}

function renderBookings(data) {
  const tbody = document.getElementById('bookingsTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Không tìm thấy đơn đặt nào</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(b => {
    let actions = `<button class="btn btn-sm btn-outline" onclick="viewBooking('${b.id}')" title="Xem">👁️</button>`;

    if (b.status === 'pending') {
      actions += ` <button class="btn btn-sm btn-success" onclick="confirmBooking('${b.id}')" title="Xác nhận">✓</button>`;
      actions += ` <button class="btn btn-sm btn-danger" onclick="cancelBooking('${b.id}')" title="Hủy">✕</button>`;
    }
    if (b.status === 'confirmed') {
      actions += ` <button class="btn btn-sm btn-primary" onclick="completeBooking('${b.id}')" title="Hoàn thành">✓✓</button>`;
      actions += ` <button class="btn btn-sm btn-danger" onclick="cancelBooking('${b.id}')" title="Hủy">✕</button>`;
    }

    return `
      <tr>
        <td><strong>${b.id}</strong></td>
        <td>${b.userName}</td>
        <td>${b.fieldName}</td>
        <td>${b.date}</td>
        <td>${b.startTime}</td>
        <td>${b.endTime}</td>
        <td>${formatCurrency(b.total)}</td>
        <td>
          <div style="display:flex; flex-direction:column; gap:3px;">
            ${getStatusBadge(b.paymentMethod || 'at_court', 'paymentMethod')}
            ${getStatusBadge(b.paymentStatus || 'unpaid', 'payment')}
          </div>
        </td>
        <td>${getStatusBadge(b.status, 'booking')}</td>
        <td><div class="action-btns">${actions}</div></td>
      </tr>
    `;
  }).join('');
}

function viewBooking(id) {
  const b = bookingsData.find(x => x.id === id);
  if (!b) return;

  const body = document.getElementById('bookingDetailBody');
  if (body) {
    body.innerHTML = `
      <div class="detail-row"><div class="detail-label">Mã đơn:</div><div class="detail-value"><strong>${b.id}</strong></div></div>
      <div class="detail-row"><div class="detail-label">Người đặt:</div><div class="detail-value">${b.userName}</div></div>
      <div class="detail-row"><div class="detail-label">Sân:</div><div class="detail-value">${b.fieldName}</div></div>
      <div class="detail-row"><div class="detail-label">Ngày đặt:</div><div class="detail-value">${b.date}</div></div>
      <div class="detail-row"><div class="detail-label">Thời gian:</div><div class="detail-value">${b.startTime} - ${b.endTime}</div></div>
      ${
        b.discount > 0
          ? `<div class="detail-row"><div class="detail-label">Tạm tính:</div><div class="detail-value">${formatCurrency(b.subtotal || b.total + b.discount)}</div></div>
             <div class="detail-row"><div class="detail-label">Mã giảm giá:</div><div class="detail-value">${b.voucherCode} (-${formatCurrency(b.discount)})</div></div>`
          : ''
      }
      <div class="detail-row"><div class="detail-label">Tổng tiền:</div><div class="detail-value"><strong>${formatCurrency(b.total)}</strong></div></div>
      <div class="detail-row"><div class="detail-label">Liên hệ:</div><div class="detail-value">${b.customer?.phone || '—'}</div></div>
      <div class="detail-row"><div class="detail-label">Hình thức TT:</div><div class="detail-value">${getStatusBadge(b.paymentMethod || 'at_court', 'paymentMethod')}</div></div>
      <div class="detail-row"><div class="detail-label">Trạng thái TT:</div><div class="detail-value">${getStatusBadge(b.paymentStatus || 'unpaid', 'payment')}</div></div>
      <div class="detail-row"><div class="detail-label">Trạng thái đơn:</div><div class="detail-value">${getStatusBadge(b.status, 'booking')}</div></div>
      ${
        b.paymentStatus === 'refunded'
          ? `<div class="detail-row"><div class="detail-label">Số tiền đã hoàn:</div><div class="detail-value" style="color:#ef4444; font-weight:700;">${formatCurrency(b.refundAmount || b.total)}</div></div>
             <div class="detail-row"><div class="detail-label">Lý do hoàn:</div><div class="detail-value">${b.refundReason || 'Khách hủy đơn'}</div></div>
             ${b.refundNote ? `<div class="detail-row"><div class="detail-label">Ghi chú hoàn:</div><div class="detail-value">${b.refundNote}</div></div>` : ''}`
          : ''
      }
    `;
  }
  openModal('bookingDetailModal');
}

function confirmBooking(id) {
  updateBookingStatus(id, 'confirmed', 'Xác nhận đơn đặt sân thành công!');
}

function completeBooking(id) {
  updateBookingStatus(id, 'completed', 'Đơn đặt sân đã hoàn thành!');
}

function cancelBooking(id) {
  const b = bookingsData.find(x => x.id === id);
  if (!b) return;

  showConfirm('Hủy đơn đặt', `Bạn có chắc muốn hủy đơn "${b.id}"?`, () => {
    updateBookingStatus(id, 'cancelled', 'Đã hủy đơn đặt sân!', 'danger');
  });
}

function updateBookingStatus(id, newStatus, message, toastType = 'success') {
  const idx = bookingsData.findIndex(b => b.id === id);
  if (idx === -1) return;

  // Ghi qua store để trang chủ và trang danh sách sân thấy trạng thái mới ngay,
  // và khung giờ bị hủy thì mở lại cho người khác đặt.
  const result = SV.setBookingStatus(id, newStatus);
  if (!result.ok) {
    showToast(result.error || 'Không đổi được trạng thái đơn', 'danger');
    return;
  }
  bookingsData[idx].status = result.booking.status;
  filterBookings();
  showToast(message, toastType);
}

let usersData = [];

function initUsers() {
  usersData = DataManager.getUsers();
  renderUsers(usersData);
  document.getElementById('searchUser')?.addEventListener('input', filterUsers);
}

/** Vẽ lại từ dữ liệu mới nhất, giữ nguyên từ khoá đang tìm. */
function filterUsers() {
  usersData = DataManager.getUsers();
  const keyword = (document.getElementById('searchUser')?.value || '').toLowerCase();
  if (!keyword) {
    renderUsers(usersData);
    return;
  }
  const filtered = usersData.filter(u =>
    u.id.toLowerCase().includes(keyword) ||
    u.name.toLowerCase().includes(keyword) ||
    u.email.toLowerCase().includes(keyword) ||
    u.phone.includes(keyword)
  );
  renderUsers(filtered);
}

function renderUsers(data) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👤</div><div class="empty-text">Không tìm thấy người dùng nào</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(u => {
    const lockBtn = u.status === 'active'
      ? `<button class="btn btn-sm btn-warning" onclick="toggleUserStatus('${u.id}')" title="Khóa">🔒</button>`
      : `<button class="btn btn-sm btn-success" onclick="toggleUserStatus('${u.id}')" title="Mở khóa">🔓</button>`;

    return `
      <tr>
        <td><strong>${u.id}</strong></td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${u.bookings || 0}</td>
        <td>${getStatusBadge(u.status, 'user')}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-sm btn-outline" onclick="viewUser('${u.id}')" title="Xem">👁️</button>
            ${lockBtn}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function viewUser(id) {
  const u = usersData.find(x => x.id === id);
  if (!u) return;

  const body = document.getElementById('userDetailBody');
  if (body) {
    body.innerHTML = `
      <div class="detail-row"><div class="detail-label">ID:</div><div class="detail-value"><strong>${u.id}</strong></div></div>
      <div class="detail-row"><div class="detail-label">Họ tên:</div><div class="detail-value">${u.name}</div></div>
      <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${u.email}</div></div>
      <div class="detail-row"><div class="detail-label">Số điện thoại:</div><div class="detail-value">${u.phone}</div></div>
      <div class="detail-row"><div class="detail-label">Số đơn đã đặt:</div><div class="detail-value">${u.bookings || 0}</div></div>
      <div class="detail-row"><div class="detail-label">Trạng thái:</div><div class="detail-value">${getStatusBadge(u.status, 'user')}</div></div>
    `;
  }
  openModal('userDetailModal');
}

function toggleUserStatus(id) {
  const idx = usersData.findIndex(u => u.id === id);
  if (idx === -1) return;

  const user = usersData[idx];
  const newStatus = user.status === 'active' ? 'locked' : 'active';
  const action = newStatus === 'locked' ? 'Khóa' : 'Mở khóa';

  showConfirm(`${action} người dùng`, `Bạn có chắc muốn ${action.toLowerCase()} "${user.name}"?`, () => {
    // Ghi qua store để trang đăng nhập chặn/mở tài khoản ngay ở lần đăng nhập kế tiếp.
    const result = SV.setUserStatus(user.id, newStatus);
    if (!result.ok) {
      showToast(result.error || 'Không đổi được trạng thái', 'danger');
      return;
    }
    usersData[idx].status = result.user.status;
    renderUsers(usersData);
    showToast(`Đã ${action.toLowerCase()} người dùng "${user.name}"!`, newStatus === 'locked' ? 'warning' : 'success');
  });
}

function initSettings() {
  const settings = DataManager.getSettings();

  const siteNameInput = document.getElementById('settingSiteName');
  const primaryColorInput = document.getElementById('settingPrimaryColor');
  const colorValueSpan = document.getElementById('colorValue');
  const darkModeToggle = document.getElementById('settingDarkMode');
  const logoInput = document.getElementById('settingLogo');
  const logoPreview = document.getElementById('logoPreview');

  const adminUsernameInput = document.getElementById('settingAdminUsername');
  const adminPasswordInput = document.getElementById('settingAdminPassword');

  if (siteNameInput) siteNameInput.value = settings.siteName;
  if (primaryColorInput) {
    primaryColorInput.value = settings.primaryColor;
    if (colorValueSpan) colorValueSpan.textContent = settings.primaryColor;
  }
  if (darkModeToggle) darkModeToggle.checked = settings.darkMode;
  if (adminUsernameInput) adminUsernameInput.value = settings.adminUsername || 'admin';
  if (adminPasswordInput) adminPasswordInput.value = '';

  if (settings.logo && logoPreview) {
    logoPreview.innerHTML = `<img src="${settings.logo}" alt="Logo">`;
  }
  primaryColorInput?.addEventListener('input', (e) => {
    if (colorValueSpan) colorValueSpan.textContent = e.target.value;
  });
  logoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (logoPreview) {
        logoPreview.innerHTML = `<img src="${ev.target.result}" alt="Logo">`;
      }
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings();
  });
}

async function saveSettings() {
  const settings = DataManager.getSettings();

  settings.siteName = document.getElementById('settingSiteName')?.value.trim() || settings.siteName;
  settings.primaryColor = document.getElementById('settingPrimaryColor')?.value || settings.primaryColor;
  settings.darkMode = document.getElementById('settingDarkMode')?.checked || false;
  const newUsername = document.getElementById('settingAdminUsername')?.value.trim();
  const newPassword = document.getElementById('settingAdminPassword')?.value.trim();
  if (newUsername) {
    settings.adminUsername = newUsername;
  }
  if (newPassword) {
    if (newPassword.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự.', 'danger');
      return;
    }
    settings.adminPassword = await hashPassword(newPassword);
  }
  const logoImg = document.querySelector('#logoPreview img');
  if (logoImg) {
    settings.logo = logoImg.src;
  }

  DataManager.saveSettings(settings);
  applySettings();
  showToast('Đã lưu cài đặt giao diện!');
}

function initProcessing() {
  renderPendingBookings();
  renderLockedUsers();
  renderInactiveFields();
}

function renderPendingBookings() {
  const bookings = DataManager.getBookings();
  const pending = bookings.filter(b => b.status === 'pending');

  animateCounter(document.getElementById('pendingCount'), 0, pending.length, 600);

  const tbody = document.getElementById('pendingBookingsBody');
  if (!tbody) return;

  if (pending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-text">Không có đơn chờ xử lý</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = pending.map(b => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td>${b.userName}</td>
      <td>${b.fieldName}</td>
      <td>${b.date}</td>
      <td>${b.startTime} - ${b.endTime}</td>
      <td>${formatCurrency(b.total)}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-success" onclick="processConfirmBooking('${b.id}')" title="Xác nhận">✓ Xác nhận</button>
          <button class="btn btn-sm btn-danger" onclick="processCancelBooking('${b.id}')" title="Hủy">✕ Hủy</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderLockedUsers() {
  const users = DataManager.getUsers();
  const locked = users.filter(u => u.status === 'locked');

  animateCounter(document.getElementById('lockedCount'), 0, locked.length, 600);

  const tbody = document.getElementById('lockedUsersBody');
  if (!tbody) return;

  if (locked.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-text">Không có người dùng bị khóa</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = locked.map(u => `
    <tr>
      <td><strong>${u.id}</strong></td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td>
        <button class="btn btn-sm btn-success" onclick="processUnlockUser('${u.id}')">🔓 Mở khóa</button>
      </td>
    </tr>
  `).join('');
}

function renderInactiveFields() {
  const fields = DataManager.getFields();
  const inactive = fields.filter(f => f.status === 'inactive');

  animateCounter(document.getElementById('inactiveFieldCount'), 0, inactive.length, 600);

  const tbody = document.getElementById('inactiveFieldsBody');
  if (!tbody) return;

  if (inactive.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-text">Không có sân tạm ngưng</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = inactive.map(f => `
    <tr>
      <td><strong>${f.id}</strong></td>
      <td>${f.name}</td>
      <td>${f.address}</td>
      <td>${f.type}</td>
      <td>
        <button class="btn btn-sm btn-success" onclick="processActivateField('${f.id}')">✓ Kích hoạt</button>
      </td>
    </tr>
  `).join('');
}

function processConfirmBooking(id) {
  const bookings = DataManager.getBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return;

  bookings[idx].status = 'confirmed';
  DataManager.saveBookings(bookings);
  renderPendingBookings();
  showToast('Đã xác nhận đơn đặt sân!');
}

function processCancelBooking(id) {
  const bookings = DataManager.getBookings();
  const b = bookings.find(x => x.id === id);
  if (!b) return;

  showConfirm('Hủy đơn đặt', `Bạn có chắc muốn hủy đơn "${b.id}"?`, () => {
    const idx = bookings.findIndex(x => x.id === id);
    bookings[idx].status = 'cancelled';
    DataManager.saveBookings(bookings);
    renderPendingBookings();
    showToast('Đã hủy đơn đặt sân!', 'danger');
  });
}

function processUnlockUser(id) {
  const users = DataManager.getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return;

  users[idx].status = 'active';
  DataManager.saveUsers(users);
  renderLockedUsers();
  showToast('Đã mở khóa người dùng!');
}

function processActivateField(id) {
  const fields = DataManager.getFields();
  const idx = fields.findIndex(f => f.id === id);
  if (idx === -1) return;

  fields[idx].status = 'active';
  DataManager.saveFields(fields);
  renderInactiveFields();
  showToast('Đã kích hoạt sân bóng!');
}

// ==========================================
// QUẢN LÝ THANH TOÁN & HOÀN TIỀN
// ==========================================
let paymentsData = [];
let currentRefundBookingId = null;

function initPayments() {
  paymentsData = DataManager.getBookings();
  renderPaymentStats();
  filterPayments();

  document.getElementById('searchPayment')?.addEventListener('input', filterPayments);
  document.getElementById('filterPaymentMethod')?.addEventListener('change', filterPayments);
  document.getElementById('filterPaymentStatus')?.addEventListener('change', filterPayments);
  document.getElementById('btnRefreshPayments')?.addEventListener('click', () => {
    paymentsData = DataManager.getBookings();
    renderPaymentStats();
    filterPayments();
    showToast('Đã làm mới danh sách thanh toán!');
  });

  document.getElementById('btnConfirmRefund')?.addEventListener('click', executeRefund);
}

function renderPaymentStats() {
  const all = DataManager.getBookings();

  // 1. Thực thu (paid)
  const paidBookings = all.filter(b => b.paymentStatus === 'paid');
  const paidRevenue = paidBookings.reduce((sum, b) => sum + (Number(b.total) || 0), 0);

  // 2. Chờ xác nhận chuyển khoản (awaiting_payment)
  const pendingBookings = all.filter(b => b.paymentStatus === 'awaiting_payment');
  const pendingRevenue = pendingBookings.reduce((sum, b) => sum + (Number(b.total) || 0), 0);

  // 3. Chưa thanh toán tại sân (unpaid)
  const unpaidBookings = all.filter(b => b.paymentStatus === 'unpaid');
  const unpaidRevenue = unpaidBookings.reduce((sum, b) => sum + (Number(b.total) || 0), 0);

  // 4. Đã hoàn tiền (refunded)
  const refundedBookings = all.filter(b => b.paymentStatus === 'refunded');
  const refundedRevenue = refundedBookings.reduce((sum, b) => sum + (Number(b.refundAmount || b.total) || 0), 0);

  const elPaidRev = document.getElementById('statPaidRevenue');
  const elPaidCnt = document.getElementById('statPaidCount');
  if (elPaidRev) elPaidRev.textContent = formatCurrency(paidRevenue);
  if (elPaidCnt) elPaidCnt.textContent = `${paidBookings.length} đơn`;

  const elPendingRev = document.getElementById('statPendingRevenue');
  const elPendingCnt = document.getElementById('statPendingCount');
  if (elPendingRev) elPendingRev.textContent = formatCurrency(pendingRevenue);
  if (elPendingCnt) elPendingCnt.textContent = `${pendingBookings.length} đơn cần duyệt`;

  const elUnpaidRev = document.getElementById('statUnpaidRevenue');
  const elUnpaidCnt = document.getElementById('statUnpaidCount');
  if (elUnpaidRev) elUnpaidRev.textContent = formatCurrency(unpaidRevenue);
  if (elUnpaidCnt) elUnpaidCnt.textContent = `${unpaidBookings.length} đơn tại sân`;

  const elRefundedRev = document.getElementById('statRefundedRevenue');
  const elRefundedCnt = document.getElementById('statRefundedCount');
  if (elRefundedRev) elRefundedRev.textContent = formatCurrency(refundedRevenue);
  if (elRefundedCnt) elRefundedCnt.textContent = `${refundedBookings.length} đơn đã hoàn`;
}

function filterPayments() {
  paymentsData = DataManager.getBookings();
  const keyword = (document.getElementById('searchPayment')?.value || '').toLowerCase().trim();
  const methodFilter = document.getElementById('filterPaymentMethod')?.value;
  const statusFilter = document.getElementById('filterPaymentStatus')?.value;

  let filtered = paymentsData.slice();

  if (keyword) {
    filtered = filtered.filter(b =>
      String(b.id || '').toLowerCase().includes(keyword) ||
      String(b.userName || '').toLowerCase().includes(keyword) ||
      String(b.customer?.phone || '').includes(keyword) ||
      String(b.fieldName || '').toLowerCase().includes(keyword)
    );
  }

  if (methodFilter) {
    filtered = filtered.filter(b => b.paymentMethod === methodFilter);
  }

  if (statusFilter) {
    filtered = filtered.filter(b => b.paymentStatus === statusFilter);
  }

  filtered.sort((a, b) => (b.id > a.id ? 1 : -1));

  const totalEl = document.getElementById('paymentTotalRecords');
  if (totalEl) totalEl.textContent = filtered.length;

  renderPaymentsTable(filtered);
}

function renderPaymentsTable(data) {
  const tbody = document.getElementById('paymentsTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">💳</div><div class="empty-text">Không tìm thấy giao dịch thanh toán nào</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(b => {
    let actions = `<button class="btn btn-sm btn-outline" onclick="viewPaymentDetail('${b.id}')" title="Xem chi tiết giao dịch">👁️</button>`;

    if (b.paymentStatus === 'awaiting_payment') {
      actions += ` <button class="btn btn-sm btn-success" onclick="confirmPaymentReceived('${b.id}')" title="Xác nhận đã nhận tiền chuyển khoản">✓ Duyệt tiền</button>`;
    } else if (b.paymentStatus === 'unpaid') {
      actions += ` <button class="btn btn-sm btn-primary" onclick="confirmPaymentReceived('${b.id}')" title="Xác nhận thu tiền tại sân">💵 Thu tiền</button>`;
    }

    if (b.paymentStatus === 'paid') {
      actions += ` <button class="btn btn-sm btn-warning" onclick="openRefundModal('${b.id}')" title="Hoàn tiền cho khách">↩️ Hoàn tiền</button>`;
    } else if (b.paymentStatus === 'refunded') {
      actions += ` <button class="btn btn-sm btn-outline" style="color: #ef4444; border-color: #fca5a5;" onclick="viewPaymentDetail('${b.id}')" title="Xem phiếu hoàn tiền">↩️ Đã hoàn</button>`;
    }

    const phoneStr = b.customer?.phone ? `<br><small style="color:#64748b;">📞 ${b.customer.phone}</small>` : '';

    return `
      <tr>
        <td><strong>${b.id}</strong></td>
        <td>
          <div style="font-weight: 600;">${b.userName}</div>
          ${phoneStr}
        </td>
        <td>
          <div style="font-weight: 500;">${b.fieldName}</div>
          <small style="color: #64748b;">📅 ${b.date} &bull; ⏰ ${b.startTime} - ${b.endTime}</small>
        </td>
        <td>
          <div style="font-weight: 700; color: #1e293b;">${formatCurrency(b.total)}</div>
          ${b.discount > 0 ? `<small style="color: #16a34a;">Giảm ${formatCurrency(b.discount)}</small>` : ''}
        </td>
        <td>${getStatusBadge(b.paymentMethod || 'at_court', 'paymentMethod')}</td>
        <td>${getStatusBadge(b.paymentStatus || 'unpaid', 'payment')}</td>
        <td>${getStatusBadge(b.status, 'booking')}</td>
        <td><div class="action-btns">${actions}</div></td>
      </tr>
    `;
  }).join('');
}

function confirmPaymentReceived(id) {
  const b = DataManager.getBookings().find(x => x.id === id);
  if (!b) return;

  const isBank = b.paymentMethod === 'bank_transfer';
  const methodText = isBank ? 'chuyển khoản MBBank' : 'tiền mặt tại sân';

  showConfirm(
    'Xác nhận nhận tiền',
    `Xác nhận đơn "${b.id}" (${formatCurrency(b.total)}) đã thanh toán thành công qua ${methodText}?`,
    () => {
      SV.setPaymentStatus(id, 'paid');
      if (b.status === 'pending') {
        SV.setBookingStatus(id, 'confirmed');
      }
      paymentsData = DataManager.getBookings();
      renderPaymentStats();
      filterPayments();
      showToast(`Đã ghi nhận thanh toán thành công cho đơn ${b.id}!`);
    }
  );
}

function openRefundModal(id) {
  const b = DataManager.getBookings().find(x => x.id === id);
  if (!b) return;

  currentRefundBookingId = id;
  const idEl = document.getElementById('refundBookingId');
  if (idEl) idEl.textContent = b.id;
  
  const nameEl = document.getElementById('refundCustomerName');
  if (nameEl) nameEl.textContent = b.userName + (b.customer?.phone ? ` (${b.customer.phone})` : '');

  const courtEl = document.getElementById('refundCourtInfo');
  if (courtEl) courtEl.textContent = `${b.fieldName} | ${b.date} (${b.startTime} - ${b.endTime})`;

  const paidEl = document.getElementById('refundPaidAmount');
  if (paidEl) paidEl.textContent = formatCurrency(b.total);
  
  const amountInput = document.getElementById('refundAmountInput');
  if (amountInput) {
    amountInput.value = b.total;
    amountInput.max = b.total;
  }
  
  const reasonSelect = document.getElementById('refundReasonSelect');
  if (reasonSelect) reasonSelect.selectedIndex = 0;

  const noteInput = document.getElementById('refundNoteInput');
  if (noteInput) noteInput.value = '';

  openModal('refundModal');
}

function executeRefund() {
  if (!currentRefundBookingId) return;
  const id = currentRefundBookingId;
  const b = DataManager.getBookings().find(x => x.id === id);
  if (!b) return;

  const amount = Number(document.getElementById('refundAmountInput')?.value) || b.total;
  const reason = document.getElementById('refundReasonSelect')?.value || 'Khách yêu cầu hủy đơn hợp lệ (báo trước quy định)';
  const note = document.getElementById('refundNoteInput')?.value.trim() || '';

  const updateData = {
    paymentStatus: 'refunded',
    status: 'cancelled',
    refundAmount: amount,
    refundReason: reason,
    refundNote: note,
    refundedAt: new Date().toLocaleString('vi-VN')
  };

  if (typeof SV.updateBooking === 'function') {
    SV.updateBooking(id, updateData);
  } else {
    SV.setPaymentStatus(id, 'refunded', updateData);
    SV.setBookingStatus(id, 'cancelled');
  }

  closeModal('refundModal');
  paymentsData = DataManager.getBookings();
  renderPaymentStats();
  filterPayments();
  showToast(`Đã hoàn tiền ${formatCurrency(amount)} cho đơn ${id} và mở lại sân thành công!`);
}

function viewPaymentDetail(id) {
  const b = DataManager.getBookings().find(x => x.id === id);
  if (!b) return;

  const body = document.getElementById('paymentDetailBody');
  if (body) {
    const isMB = b.paymentMethod === 'bank_transfer';
    body.innerHTML = `
      <div style="background: #f8fafc; border-radius: 8px; padding: 12px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px; color: #64748b;">Mã giao dịch / Đơn đặt:</span>
          <span style="font-size: 16px; font-weight: 700; color: #1e293b;">${b.id}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span style="font-size: 14px; color: #64748b;">Số tiền giao dịch:</span>
          <span style="font-size: 18px; font-weight: 800; color: #0284c7;">${formatCurrency(b.total)}</span>
        </div>
      </div>

      <div class="detail-row"><div class="detail-label">Khách hàng:</div><div class="detail-value"><strong>${b.userName}</strong></div></div>
      <div class="detail-row"><div class="detail-label">Số điện thoại:</div><div class="detail-value">${b.customer?.phone || '—'}</div></div>
      <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${b.customer?.email || '—'}</div></div>
      <div class="detail-row"><div class="detail-label">Sân bóng:</div><div class="detail-value">${b.fieldName}</div></div>
      <div class="detail-row"><div class="detail-label">Ngày đá:</div><div class="detail-value">${b.date}</div></div>
      <div class="detail-row"><div class="detail-label">Khung giờ:</div><div class="detail-value">${b.startTime} - ${b.endTime} (${b.duration}h)</div></div>
      
      <hr style="margin: 12px 0; border: none; border-top: 1px dashed #e2e8f0;">

      <div class="detail-row"><div class="detail-label">Hình thức:</div><div class="detail-value">${getStatusBadge(b.paymentMethod || 'at_court', 'paymentMethod')}</div></div>
      ${isMB ? `
        <div class="detail-row"><div class="detail-label">Ngân hàng nhận:</div><div class="detail-value">MBBank (Ngân hàng Quân Đội)</div></div>
        <div class="detail-row"><div class="detail-label">Số tài khoản:</div><div class="detail-value"><strong>207987</strong></div></div>
        <div class="detail-row"><div class="detail-label">Chủ tài khoản:</div><div class="detail-value"><strong>LE THANH LONG</strong></div></div>
        <div class="detail-row"><div class="detail-label">Nội dung CK:</div><div class="detail-value" style="font-family: monospace; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">DATSAN ${b.id} ${b.customer?.phone || ''}</div></div>
      ` : `
        <div class="detail-row"><div class="detail-label">Địa điểm thu:</div><div class="detail-value">Trực tiếp tại quầy lễ tân sân bóng</div></div>
      `}

      <div class="detail-row"><div class="detail-label">Trạng thái TT:</div><div class="detail-value">${getStatusBadge(b.paymentStatus || 'unpaid', 'payment')}</div></div>
      <div class="detail-row"><div class="detail-label">Trạng thái đơn:</div><div class="detail-value">${getStatusBadge(b.status, 'booking')}</div></div>

      ${b.paymentStatus === 'refunded' ? `
        <div style="margin-top: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
          <div style="font-weight: 700; color: #dc2626; margin-bottom: 6px;">↩️ THÔNG TIN HOÀN TIỀN</div>
          <div class="detail-row"><div class="detail-label">Số tiền đã hoàn:</div><div class="detail-value" style="color:#dc2626; font-weight:700;">${formatCurrency(b.refundAmount || b.total)}</div></div>
          <div class="detail-row"><div class="detail-label">Thời gian hoàn:</div><div class="detail-value">${b.refundedAt || '—'}</div></div>
          <div class="detail-row"><div class="detail-label">Lý do hoàn tiền:</div><div class="detail-value">${b.refundReason || 'Khách yêu cầu hủy đơn'}</div></div>
          ${b.refundNote ? `<div class="detail-row"><div class="detail-label">Ghi chú đối soát:</div><div class="detail-value">${b.refundNote}</div></div>` : ''}
          <div style="margin-top: 6px; font-size: 12px; color: #16a34a;">✓ Khung giờ sân đã được giải phóng trên hệ thống.</div>
        </div>
      ` : ''}
    `;
  }
  openModal('paymentDetailModal');
}

// ==========================================
// QUẢN LÝ ĐÁNH GIÁ & BÌNH LUẬN
// ==========================================
function initReviews() {
  bindReviewListeners();
  renderTable();
}

function bindReviewListeners() {
  document.getElementById('reviewSearchInput')?.addEventListener('input', renderTable);
  document.getElementById('reviewRatingFilter')?.addEventListener('change', renderTable);
  document.getElementById('reviewStatusFilter')?.addEventListener('change', renderTable);

  const replyForm = document.getElementById('replyForm');
  if (replyForm) {
    replyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('replyReviewId').value;
      const replyText = document.getElementById('replyContentInput').value.trim();

      const result = SV.updateReview(id, { reply: replyText, replyAt: new Date().toISOString().slice(0, 10) });
      if (!result.ok) {
        showToast(result.error || 'Không lưu được phản hồi', 'danger');
        return;
      }
      closeModal('replyModal');
      renderTable();
      showToast('Đã gửi phản hồi bình luận!');
    });
  }

  window.openReplyModal = function(id) {
    const reviews = DataManager.getReviews();
    const r = reviews.find(x => x.id === id);
    if (!r) return;

    document.getElementById('replyReviewId').value = r.id;
    document.getElementById('modalCustomerName').textContent = r.userName;
    document.getElementById('modalFieldName').textContent = r.fieldName;
    document.getElementById('modalReviewContent').textContent = `"${r.comment}"`;
    document.getElementById('replyContentInput').value = r.reply || '';

    openModal('replyModal');
  };

  window.toggleReviewStatus = function(id) {
    // Ghi qua store để trang chủ ẩn/hiện đánh giá ngay ở lần hiển thị kế tiếp.
    const review = DataManager.getReviews().find(r => r.id === id);
    if (!review) return;
    const next = review.status === 'visible' ? 'hidden' : 'visible';
    const result = SV.updateReview(id, { status: next });
    if (!result.ok) {
      showToast(result.error || 'Không đổi được trạng thái', 'danger');
      return;
    }
    renderTable();
    showToast(next === 'visible' ? 'Đã hiển thị bình luận!' : 'Đã ẩn bình luận!');
  };

  window.deleteReview = function(id) {
    showConfirm('Xóa bình luận', 'Bạn có chắc chắn muốn xóa bình luận này không?', () => {
      const reviews = DataManager.getReviews().filter(r => r.id !== id);
      DataManager.saveReviews(reviews);
      renderTable();
      showToast('Đã xóa bình luận!', 'danger');
    });
  };
}

/** Vẽ lại bảng đánh giá từ dữ liệu mới nhất, giữ nguyên bộ lọc đang dùng. */
function renderTable() {
  const tableBody = document.getElementById('reviewsTableBody');
  if (!tableBody) return;
  const searchInput = document.getElementById('reviewSearchInput');
  const ratingFilter = document.getElementById('reviewRatingFilter');
  const statusFilter = document.getElementById('reviewStatusFilter');

  const reviews = DataManager.getReviews();
  renderStats(reviews);

  const q = searchInput?.value.trim().toLowerCase() || '';
  const rVal = ratingFilter?.value || '';
  const sVal = statusFilter?.value || '';

  const filtered = reviews.filter(r => {
    const matchSearch = r.userName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q) || r.fieldName.toLowerCase().includes(q);
    let matchRating = true;
    if (rVal === '5') matchRating = r.rating === 5;
    else if (rVal === '4') matchRating = r.rating === 4;
    else if (rVal === '3') matchRating = r.rating === 3;
    else if (rVal === 'low') matchRating = r.rating <= 2;

    let matchStatus = true;
    if (sVal) matchStatus = r.status === sVal;

    return matchSearch && matchRating && matchStatus;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--gray-500); padding: 24px;">Không tìm thấy bình luận nào.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const replyBadge = r.reply ? `<span class="badge badge-info" style="font-weight: normal; font-style: italic;">"${r.reply}"</span>` : `<span style="color: var(--gray-400); font-size: 13px;">Chưa phản hồi</span>`;
    const toggleActionText = r.status === 'visible' ? 'Ẩn' : 'Hiện';
    const toggleActionClass = r.status === 'visible' ? 'btn-outline' : 'btn-success';

    return `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${r.userAvatar || 'https://i.pravatar.cc/80'}" alt="${r.userName}" style="width: 28px; height: 28px; border-radius: 50%;">
            <span>${r.userName}</span>
          </div>
        </td>
        <td>${r.fieldName}</td>
        <td><span class="review-stars" style="color: #f59e0b; font-weight: 600;">${stars}</span></td>
        <td style="max-width: 280px; word-wrap: break-word;">${r.comment}</td>
        <td>${r.date}</td>
        <td>${getStatusBadge(r.status, 'review')}</td>
        <td style="max-width: 220px;">${replyBadge}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-primary btn-sm" onclick="openReplyModal('${r.id}')" style="padding: 4px 10px; font-size: 12px; height: auto;">Phản hồi</button>
            <button class="btn ${toggleActionClass} btn-sm" onclick="toggleReviewStatus('${r.id}')" style="padding: 4px 10px; font-size: 12px; height: auto;">${toggleActionText}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteReview('${r.id}')" style="padding: 4px 10px; font-size: 12px; height: auto;">Xóa</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/** Thống kê đánh giá: dùng chung hàm vẽ bảng để hai chỗ không lệch nhau. */
function renderStats(reviews) {
  const total = reviews.length;
  const avg = total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : '0.0';
  const pending = reviews.filter(r => !r.reply || !r.reply.trim()).length;
  const hidden = reviews.filter(r => r.status === 'hidden').length;

  const elTotal = document.getElementById('statTotalReviews');
  const elAvg = document.getElementById('statAvgRating');
  const elPending = document.getElementById('statPendingReply');
  const elHidden = document.getElementById('statHiddenReviews');

  if (elTotal) animateCounter(elTotal, 0, total, 750);
  if (elAvg) animateCounter(elAvg, 0, parseFloat(avg), 750, val => `${val.toFixed(1)}★`);
  if (elPending) animateCounter(elPending, 0, pending, 750);
  if (elHidden) animateCounter(elHidden, 0, hidden, 750);
}

// ==========================================
// QUẢN LÝ MÃ GIẢM GIÁ (VOUCHERS)
// ==========================================
function initVouchers() {
  bindVoucherListeners();
  renderVoucherTable();
}

function renderVoucherTable() {
  const tableBody = document.getElementById('vouchersTableBody');
  if (!tableBody) return;
  const searchInput = document.getElementById('voucherSearchInput');
  const statusFilter = document.getElementById('voucherStatusFilter');

  renderVoucherStats(DataManager.getVouchers());

  const q = searchInput?.value.trim().toLowerCase() || '';
  const sVal = statusFilter?.value || '';

  const filtered = DataManager.getVouchers().filter(v => {
    const matchSearch = v.code.toLowerCase().includes(q);
    const matchStatus = sVal ? v.status === sVal : true;
    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--gray-500); padding: 24px;">Không tìm thấy mã giảm giá nào.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(v => {
    const typeText = v.discountType === 'percent' ? 'Phần trăm (%)' : 'Cố định (VNĐ)';
    const valueText = v.discountType === 'percent' ? `${v.discountValue}%` : formatCurrency(v.discountValue);
    const minOrderText = v.minOrder > 0 ? formatCurrency(v.minOrder) : 'Không có';
    const maxDiscountText = v.maxDiscount > 0 ? formatCurrency(v.maxDiscount) : 'Không giới hạn';
    const usageText = `${v.usedCount || 0} / ${v.usageLimit}`;
    const toggleText = v.status === 'active' ? 'Tắt' : 'Bật';
    const toggleClass = v.status === 'active' ? 'btn-outline' : 'btn-success';

    return `
      <tr>
        <td><strong style="color: var(--primary); font-size: 15px; letter-spacing: 0.5px; background: var(--gray-100); padding: 2px 8px; border-radius: 4px;">${v.code}</strong></td>
        <td>${typeText}</td>
        <td><strong style="color: var(--success);">${valueText}</strong></td>
        <td>${minOrderText}</td>
        <td>${maxDiscountText}</td>
        <td>${usageText}</td>
        <td>${v.expiryDate}</td>
        <td>${getStatusBadge(v.status, 'voucher')}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-primary btn-sm" onclick="editVoucher('${v.id}')" style="padding: 4px 10px; font-size: 12px; height: auto;">Sửa</button>
            <button class="btn ${toggleClass} btn-sm" onclick="toggleVoucherStatus('${v.id}')" style="padding: 4px 10px; font-size: 12px; height: auto;">${toggleText}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteVoucher('${v.id}')" style="padding: 4px 10px; font-size: 12px; height: auto;">Xóa</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderVoucherStats(vouchers) {
  const total = vouchers.length;
  const active = vouchers.filter(v => v.status === 'active').length;
  const totalUsed = vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0);
  const expired = vouchers.filter(v => v.status === 'expired').length;

  const elTotal = document.getElementById('statTotalVouchers');
  const elActive = document.getElementById('statActiveVouchers');
  const elUsed = document.getElementById('statUsedVouchers');
  const elExpired = document.getElementById('statExpiredVouchers');

  if (elTotal) animateCounter(elTotal, 0, total, 750);
  if (elActive) animateCounter(elActive, 0, active, 750);
  if (elUsed) animateCounter(elUsed, 0, totalUsed, 750);
  if (elExpired) animateCounter(elExpired, 0, expired, 750);
}

/** Đặt trạng thái voucher từ cả radio (giao diện) lẫn select ẩn (nơi đọc khi lưu). */
function setVoucherStatus(status) {
  document.getElementById('voucherStatus').value = status;
  const radio = document.querySelector(`input[name="voucherStatusRadio"][value="${status}"]`);
  if (radio) radio.checked = true;
}

function bindVoucherListeners() {
  const searchInput = document.getElementById('voucherSearchInput');
  const statusFilter = document.getElementById('voucherStatusFilter');
  const btnOpenAdd = document.getElementById('btnOpenAddVoucher');
  const voucherForm = document.getElementById('voucherForm');

  if (searchInput) searchInput.addEventListener('input', renderVoucherTable);
  if (statusFilter) statusFilter.addEventListener('change', renderVoucherTable);

  if (btnOpenAdd) {
    btnOpenAdd.addEventListener('click', () => {
      document.getElementById('voucherForm').reset();
      document.getElementById('voucherEditId').value = '';
      document.getElementById('voucherModalTitle').textContent = 'Thêm mã giảm giá mới';
      // select trạng thái đã bị ẩn sau khi đổi sang radio, nên reset thủ công
      setVoucherStatus('active');
      openModal('voucherModal');
    });
  }

  // Radio là giao diện, select ẩn là nơi lưu giá trị - hai cái phải luôn khớp.
  document.querySelectorAll('input[name="voucherStatusRadio"]').forEach((radio) => {
    radio.addEventListener('change', () => setVoucherStatus(radio.value));
  });

  if (voucherForm) {
    voucherForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('voucherEditId').value;
      const code = document.getElementById('voucherCode').value.trim().toUpperCase();
      const discountType = document.getElementById('voucherType').value;
      const discountValue = Number(document.getElementById('voucherValue').value);
      const minOrder = Number(document.getElementById('voucherMinOrder').value || 0);
      const maxDiscount = Number(document.getElementById('voucherMaxDiscount').value || 0);
      const usageLimit = Number(document.getElementById('voucherLimit').value);
      const expiryDate = document.getElementById('voucherExpiry').value;
      const statusRadio = document.querySelector('input[name="voucherStatusRadio"]:checked');
      const status = statusRadio ? statusRadio.value : document.getElementById('voucherStatus').value;

      let vouchers = DataManager.getVouchers();

      if (editId) {
        const idx = vouchers.findIndex(v => v.id === editId);
        if (idx !== -1) {
          vouchers[idx] = {
            ...vouchers[idx],
            code,
            discountType,
            discountValue,
            minOrder,
            maxDiscount,
            usageLimit,
            expiryDate,
            status
          };
          showToast('Đã cập nhật mã giảm giá!');
        }
      } else {
        if (vouchers.some(v => v.code === code)) {
          showToast('Mã khuyến mãi này đã tồn tại!', 'danger');
          return;
        }

        const newVoucher = {
          id: DataManager.getNextId('MAG', vouchers),
          code,
          discountType,
          discountValue,
          minOrder,
          maxDiscount,
          usageLimit,
          usedCount: 0,
          expiryDate,
          status
        };
        vouchers.unshift(newVoucher);
        showToast('Đã thêm mã giảm giá mới!');
      }

      DataManager.saveVouchers(vouchers);
      closeModal('voucherModal');
      renderVoucherTable();
    });
  }

  window.editVoucher = function(id) {
    const vouchers = DataManager.getVouchers();
    const v = vouchers.find(x => x.id === id);
    if (!v) return;

    document.getElementById('voucherEditId').value = v.id;
    document.getElementById('voucherCode').value = v.code;
    document.getElementById('voucherType').value = v.discountType;
    document.getElementById('voucherValue').value = v.discountValue;
    document.getElementById('voucherMinOrder').value = v.minOrder || '';
    document.getElementById('voucherMaxDiscount').value = v.maxDiscount || '';
    document.getElementById('voucherLimit').value = v.usageLimit;
    document.getElementById('voucherExpiry').value = v.expiryDate;
    setVoucherStatus(v.status);

    document.getElementById('voucherModalTitle').textContent = 'Sửa mã giảm giá';
    openModal('voucherModal');
  };

  window.toggleVoucherStatus = function(id) {
    const vouchers = DataManager.getVouchers();
    const idx = vouchers.findIndex(v => v.id === id);
    if (idx !== -1) {
      vouchers[idx].status = vouchers[idx].status === 'active' ? 'disabled' : 'active';
      DataManager.saveVouchers(vouchers);
      renderVoucherTable();
      showToast(vouchers[idx].status === 'active' ? 'Đã bật mã giảm giá!' : 'Đã tắt mã giảm giá!');
    }
  };

  window.deleteVoucher = function(id) {
    showConfirm('Xóa mã giảm giá', 'Bạn có chắc muốn xóa mã giảm giá này không?', () => {
      let vouchers = DataManager.getVouchers();
      vouchers = vouchers.filter(v => v.id !== id);
      DataManager.saveVouchers(vouchers);
      renderVoucherTable();
      showToast('Đã xóa mã giảm giá!', 'danger');
    });
  };
}

function checkAdminAuth(onSuccess) {
  if (sessionStorage.getItem('admin_authenticated') === 'true') {
    if (typeof onSuccess === 'function') onSuccess();
    return;
  }

  // Tự động cấp quyền nếu tài khoản hiện tại là Admin hoặc tên Long
  const cur = (window.SV && typeof SV.currentUser === 'function') ? SV.currentUser() : null;
  if (cur && (cur.role === 'admin' || String(cur.username || '').toLowerCase() === 'long' || String(cur.name || '').toLowerCase().includes('long'))) {
    sessionStorage.setItem('admin_authenticated', 'true');
    if (typeof onSuccess === 'function') onSuccess();
    return;
  }

  const existingOverlay = document.getElementById('adminAuthOverlay');
  if (existingOverlay) return;

  const unlock = () => {
    sessionStorage.setItem('admin_authenticated', 'true');
    overlay.remove();
    if (typeof onSuccess === 'function') onSuccess();
    showToast('Đăng nhập Admin thành công!');
  };

  const overlay = document.createElement('div');
  overlay.id = 'adminAuthOverlay';
  overlay.className = 'admin-auth-overlay';
  const authCard = document.createElement('div');
  authCard.className = 'admin-auth-card';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'admin-auth-icon';
  iconDiv.textContent = '🔒';
  authCard.appendChild(iconDiv);

  const titleEl = document.createElement('h2');
  titleEl.className = 'admin-auth-title';
  titleEl.textContent = 'ĐĂNG NHẬP QUẢN TRỊ';
  authCard.appendChild(titleEl);

  const descEl = document.createElement('p');
  descEl.className = 'admin-auth-desc';
  descEl.textContent = 'Khu vực dành riêng cho Quản trị viên. Nghiêm cấm người ngoài truy cập!';
  authCard.appendChild(descEl);

  const formEl = document.createElement('form');
  formEl.className = 'admin-auth-form';
  formEl.id = 'adminAuthForm';

  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.id = 'adminAuthUsername';
  usernameInput.className = 'admin-auth-input';
  usernameInput.placeholder = 'Tên đăng nhập';
  usernameInput.autocomplete = 'username';
  formEl.appendChild(usernameInput);

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'adminAuthPassword';
  passwordInput.className = 'admin-auth-input';
  passwordInput.placeholder = 'Mật khẩu';
  passwordInput.autocomplete = 'current-password';
  formEl.appendChild(passwordInput);

  const btnEl = document.createElement('button');
  btnEl.type = 'submit';
  btnEl.className = 'admin-auth-btn';
  btnEl.textContent = 'Đăng nhập';
  formEl.appendChild(btnEl);

  const hintEl = document.createElement('div');
  hintEl.className = 'admin-auth-hint';
  hintEl.style.cssText = 'margin-top: 14px; font-size: 12px; color: #475569; background: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px 14px; border-radius: 8px; text-align: center; line-height: 1.6;';
  hintEl.innerHTML = '💡 <strong>Gợi ý đăng nhập Quản trị:</strong><br>Tài khoản: <strong style="color:#0284c7;">Long</strong> hoặc <strong style="color:#0284c7;">admin</strong><br>Mật khẩu: <strong style="color:#0284c7;">123456</strong> hoặc <strong style="color:#0284c7;">admin123</strong>';
  formEl.appendChild(hintEl);

  authCard.appendChild(formEl);

  const errorDiv = document.createElement('div');
  errorDiv.className = 'admin-auth-error';
  errorDiv.id = 'adminAuthError';
  authCard.appendChild(errorDiv);

  const backLink = document.createElement('a');
  backLink.href = '../../index.html';
  backLink.className = 'admin-auth-back';
  backLink.textContent = '← Quay lại Trang chủ';
  authCard.appendChild(backLink);

  overlay.appendChild(authCard);
  document.body.appendChild(overlay);

  const form = document.getElementById('adminAuthForm');
  const usernameEl = document.getElementById('adminAuthUsername');
  const passwordEl = document.getElementById('adminAuthPassword');
  const errorEl = document.getElementById('adminAuthError');

  usernameEl.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameEl.value.trim();
    const password = passwordEl.value.trim();
    const fail = (msg) => {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      passwordEl.value = '';
      passwordEl.focus();
    };

    if (!username || !password) {
      return fail('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
    }

    const uLower = username.toLowerCase();
    const settings = DataManager.getSettings();
    const savedUsername = (settings.adminUsername || 'admin').toLowerCase();
    const savedPasswordHash = (settings.adminPassword || '').trim();

    const allUsers = (window.SV && typeof SV.users === 'function') ? SV.users() : [];
    const foundUser = allUsers.find(u =>
      String(u.username || '').toLowerCase() === uLower ||
      String(u.email || '').toLowerCase() === uLower ||
      String(u.phone || '').trim() === username
    );

    const isAllowedAdmin = (
      uLower === 'admin' ||
      uLower === 'long' ||
      uLower === 'lethanhlong' ||
      uLower === savedUsername ||
      (foundUser && (foundUser.role === 'admin' || String(foundUser.username || '').toLowerCase() === 'long'))
    );

    if (!isAllowedAdmin) {
      return fail('Tên đăng nhập hoặc mật khẩu không đúng!');
    }

    // Kiểm tra mật khẩu:
    // Chấp nhận các mật khẩu phổ biến / mặc định
    const acceptedPws = ['admin123', '123456', 'long', 'Long', 'admin', 'Admin'];
    let matched = false;
    if (acceptedPws.includes(password)) {
      matched = true;
    } else if (foundUser && foundUser.password && foundUser.password === password) {
      matched = true;
    } else if (!savedPasswordHash) {
      matched = (password === 'admin123' || password === '123456');
    } else {
      try {
        matched = (await hashPassword(password)) === savedPasswordHash;
      } catch (err) {
        matched = false;
      }
    }

    if (matched) return unlock();
    fail('Tên đăng nhập hoặc mật khẩu không đúng!');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth(() => {
    initLayout();
    const page = document.body.dataset.page;

    switch (page) {
      case 'dashboard':
        initDashboard();
        break;
      case 'fields':
        initFields();
        break;
      case 'bookings':
        initBookings();
        break;
      case 'payments':
        initPayments();
        break;
      case 'users':
        initUsers();
        break;
      case 'reviews':
        initReviews();
        break;
      case 'vouchers':
        initVouchers();
        break;
      case 'settings':
        initSettings();
        break;
      case 'processing':
        initProcessing();
        break;
    }

    applySettings();

    // Trang khác (trang chủ, trang đăng nhập, tab admin khác) sửa dữ liệu thì
    // trang này vẽ lại để bảng và thống kê không bị cũ.
    const REFRESH = {
      dashboard: initDashboard,
      fields: refreshFields,
      bookings: filterBookings,
      payments: initPayments,
      users: filterUsers,
      reviews: renderTable,
      vouchers: renderVoucherTable,
      processing: initProcessing,
    };
    SV.on((key) => {
      if (key === 'settings' || key === '*') {
        applySettings();
      }
      if (key === 'users' || key === '*') usersData = DataManager.getUsers();
      if (key === 'bookings' || key === '*') {
        bookingsData = DataManager.getBookings();
        paymentsData = DataManager.getBookings();
      }
      if (key === 'fields' || key === '*') fieldsData = DataManager.getFields();
      if (key === 'settings') return;
      REFRESH[page]?.();
    });
  });
});
