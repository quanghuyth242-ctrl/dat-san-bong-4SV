const DEFAULT_FIELDS = [
  { id: 'SAN001', name: 'Sân Thống Nhất 1', address: '138 Đào Duy Từ, Q.10, TP.HCM', type: 'Sân 5', price: 300000, status: 'active' },
  { id: 'SAN002', name: 'Sân Thống Nhất 2', address: '138 Đào Duy Từ, Q.10, TP.HCM', type: 'Sân 7', price: 500000, status: 'active' },
  { id: 'SAN003', name: 'Sân Phú Thọ A', address: '1 Lữ Gia, Q.11, TP.HCM', type: 'Sân 5', price: 280000, status: 'active' },
  { id: 'SAN004', name: 'Sân Phú Thọ B', address: '1 Lữ Gia, Q.11, TP.HCM', type: 'Sân 7', price: 480000, status: 'inactive' },
  { id: 'SAN005', name: 'Sân Tao Đàn', address: 'Công viên Tao Đàn, Q.1, TP.HCM', type: 'Sân 11', price: 800000, status: 'active' },
  { id: 'SAN006', name: 'Sân Kỳ Hòa', address: '2 Sư Vạn Hạnh, Q.10, TP.HCM', type: 'Sân 5', price: 320000, status: 'active' },
  { id: 'SAN007', name: 'Sân Rạch Miễu', address: '15 Rạch Miễu, Phú Nhuận, TP.HCM', type: 'Sân 7', price: 450000, status: 'active' },
  { id: 'SAN008', name: 'Sân Hoa Lư', address: '2 Đinh Tiên Hoàng, Q.1, TP.HCM', type: 'Sân 11', price: 900000, status: 'inactive' },
];

const DEFAULT_USERS = [
  { id: 'ND001', name: 'Nguyễn Văn An', email: 'nguyenvanan@gmail.com', phone: '0901234567', bookings: 5, status: 'active' },
  { id: 'ND002', name: 'Trần Thị Bình', email: 'tranthibinh@gmail.com', phone: '0912345678', bookings: 3, status: 'active' },
  { id: 'ND003', name: 'Lê Hoàng Cường', email: 'lehoangcuong@gmail.com', phone: '0923456789', bookings: 8, status: 'active' },
  { id: 'ND004', name: 'Phạm Minh Đức', email: 'phamminhduc@gmail.com', phone: '0934567890', bookings: 2, status: 'locked' },
  { id: 'ND005', name: 'Hoàng Thị Linh', email: 'hoangthilinh@gmail.com', phone: '0945678901', bookings: 6, status: 'active' },
  { id: 'ND006', name: 'Võ Thanh Hải', email: 'vothanhhai@gmail.com', phone: '0956789012', bookings: 1, status: 'active' },
  { id: 'ND007', name: 'Đặng Quốc Bảo', email: 'dangquocbao@gmail.com', phone: '0967890123', bookings: 4, status: 'active' },
  { id: 'ND008', name: 'Bùi Thị Mai', email: 'buithimai@gmail.com', phone: '0978901234', bookings: 0, status: 'locked' },
];

const DEFAULT_BOOKINGS = [
  { id: 'DD001', userId: 'ND001', userName: 'Nguyễn Văn An', fieldId: 'SAN001', fieldName: 'Sân Thống Nhất 1', date: '2026-09-25', startTime: '17:00', endTime: '18:30', total: 450000, status: 'confirmed' },
  { id: 'DD002', userId: 'ND002', userName: 'Trần Thị Bình', fieldId: 'SAN003', fieldName: 'Sân Phú Thọ A', date: '2026-09-25', startTime: '18:00', endTime: '19:30', total: 420000, status: 'completed' },
  { id: 'DD003', userId: 'ND003', userName: 'Lê Hoàng Cường', fieldId: 'SAN005', fieldName: 'Sân Tao Đàn', date: '2026-09-26', startTime: '06:00', endTime: '08:00', total: 1600000, status: 'pending' },
  { id: 'DD004', userId: 'ND001', userName: 'Nguyễn Văn An', fieldId: 'SAN002', fieldName: 'Sân Thống Nhất 2', date: '2026-09-26', startTime: '19:00', endTime: '20:30', total: 750000, status: 'pending' },
  { id: 'DD005', userId: 'ND005', userName: 'Hoàng Thị Linh', fieldId: 'SAN006', fieldName: 'Sân Kỳ Hòa', date: '2026-09-26', startTime: '17:30', endTime: '19:00', total: 480000, status: 'pending' },
  { id: 'DD006', userId: 'ND007', userName: 'Đặng Quốc Bảo', fieldId: 'SAN007', fieldName: 'Sân Rạch Miễu', date: '2026-09-27', startTime: '18:00', endTime: '19:30', total: 675000, status: 'confirmed' },
  { id: 'DD007', userId: 'ND003', userName: 'Lê Hoàng Cường', fieldId: 'SAN001', fieldName: 'Sân Thống Nhất 1', date: '2026-09-24', startTime: '07:00', endTime: '08:30', total: 450000, status: 'completed' },
  { id: 'DD008', userId: 'ND006', userName: 'Võ Thanh Hải', fieldId: 'SAN002', fieldName: 'Sân Thống Nhất 2', date: '2026-09-23', startTime: '19:00', endTime: '20:30', total: 750000, status: 'cancelled' },
  { id: 'DD009', userId: 'ND005', userName: 'Hoàng Thị Linh', fieldId: 'SAN003', fieldName: 'Sân Phú Thọ A', date: '2026-09-27', startTime: '16:00', endTime: '17:30', total: 420000, status: 'pending' },
  { id: 'DD010', userId: 'ND002', userName: 'Trần Thị Bình', fieldId: 'SAN005', fieldName: 'Sân Tao Đàn', date: '2026-09-28', startTime: '08:00', endTime: '10:00', total: 1600000, status: 'confirmed' },
];

const DEFAULT_SETTINGS = {
  siteName: 'QUẢN LÝ ĐẶT SÂN BÓNG ĐÁ',
  primaryColor: '#2563eb',
  darkMode: false,
  logo: ''
};

const DataManager = {
  _getKey(key) {
    return 'admin_' + key;
  },

  load(key, defaultData) {
    try {
      const stored = localStorage.getItem(this._getKey(key));
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu:', e);
    }
    this.save(key, defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  },

  save(key, data) {
    try {
      localStorage.setItem(this._getKey(key), JSON.stringify(data));
    } catch (e) {
      console.warn('Lỗi lưu dữ liệu:', e);
    }
  },

  getFields() { return this.load('fields', DEFAULT_FIELDS); },
  saveFields(data) { this.save('fields', data); },

  getUsers() { return this.load('users', DEFAULT_USERS); },
  saveUsers(data) { this.save('users', data); },

  getBookings() { return this.load('bookings', DEFAULT_BOOKINGS); },
  saveBookings(data) { this.save('bookings', data); },

  getSettings() { return this.load('settings', DEFAULT_SETTINGS); },
  saveSettings(data) { this.save('settings', data); },

  getNextId(prefix, items) {
    let maxNum = 0;
    items.forEach(item => {
      const num = parseInt(item.id.replace(prefix, ''), 10);
      if (num > maxNum) maxNum = num;
    });
    return prefix + String(maxNum + 1).padStart(3, '0');
  }
};

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
  toast.innerHTML = `<span>${icons[type] || '●'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
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

  overlay.querySelector('#confirmCancel').onclick = () => overlay.remove();
  overlay.querySelector('#confirmOk').onclick = () => {
    overlay.remove();
    onConfirm();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
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
      cancelled: { text: 'Đã hủy', cls: 'badge-danger' }
    },
    user: {
      active: { text: 'Hoạt động', cls: 'badge-success' },
      locked: { text: 'Khóa', cls: 'badge-danger' }
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
  document.getElementById('statFields').textContent = fields.length;
  document.getElementById('statBookings').textContent = bookings.length;
  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statPending').textContent = pendingCount;
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
  fieldsData = DataManager.getFields();
  renderFields(fieldsData);
  document.getElementById('searchField')?.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = fieldsData.filter(f =>
      f.id.toLowerCase().includes(keyword) ||
      f.name.toLowerCase().includes(keyword) ||
      f.address.toLowerCase().includes(keyword) ||
      f.type.toLowerCase().includes(keyword)
    );
    renderFields(filtered);
  });
  document.getElementById('btnAddField')?.addEventListener('click', () => {
    document.getElementById('fieldModalTitle').textContent = 'Thêm sân bóng';
    document.getElementById('fieldForm').reset();
    document.getElementById('fieldId').value = '';
    document.getElementById('fieldCode').value = DataManager.getNextId('SAN', fieldsData);
    document.getElementById('fieldCode').readOnly = true;
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
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">⚽</div><div class="empty-text">Không tìm thấy sân bóng nào</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(f => `
    <tr>
      <td><strong>${f.id}</strong></td>
      <td>${f.name}</td>
      <td>${f.address}</td>
      <td>${f.type}</td>
      <td>${formatCurrency(f.price)}</td>
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

  openModal('fieldModal');
}

function saveField() {
  const id = document.getElementById('fieldId').value;
  const fieldData = {
    id: document.getElementById('fieldCode').value,
    name: document.getElementById('fieldName').value.trim(),
    address: document.getElementById('fieldAddress').value.trim(),
    type: document.getElementById('fieldType').value,
    price: parseInt(document.getElementById('fieldPrice').value, 10),
    status: document.getElementById('fieldStatus').value
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
  bookingsData = DataManager.getBookings();
  renderBookings(bookingsData);
  document.getElementById('searchBooking')?.addEventListener('input', filterBookings);
  document.getElementById('filterBookingStatus')?.addEventListener('change', filterBookings);
}

function filterBookings() {
  const keyword = (document.getElementById('searchBooking')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('filterBookingStatus')?.value || '';

  let filtered = bookingsData;

  if (keyword) {
    filtered = filtered.filter(b =>
      b.id.toLowerCase().includes(keyword) ||
      b.userName.toLowerCase().includes(keyword) ||
      b.fieldName.toLowerCase().includes(keyword)
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
      <div class="detail-row"><div class="detail-label">Tổng tiền:</div><div class="detail-value"><strong>${formatCurrency(b.total)}</strong></div></div>
      <div class="detail-row"><div class="detail-label">Trạng thái:</div><div class="detail-value">${getStatusBadge(b.status, 'booking')}</div></div>
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

  bookingsData[idx].status = newStatus;
  DataManager.saveBookings(bookingsData);
  filterBookings();
  showToast(message, toastType);
}

let usersData = [];

function initUsers() {
  usersData = DataManager.getUsers();
  renderUsers(usersData);
  document.getElementById('searchUser')?.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filtered = usersData.filter(u =>
      u.id.toLowerCase().includes(keyword) ||
      u.name.toLowerCase().includes(keyword) ||
      u.email.toLowerCase().includes(keyword) ||
      u.phone.includes(keyword)
    );
    renderUsers(filtered);
  });
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
        <td>${u.bookings}</td>
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
      <div class="detail-row"><div class="detail-label">Số đơn đã đặt:</div><div class="detail-value">${u.bookings}</div></div>
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
    usersData[idx].status = newStatus;
    DataManager.saveUsers(usersData);
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

  if (siteNameInput) siteNameInput.value = settings.siteName;
  if (primaryColorInput) {
    primaryColorInput.value = settings.primaryColor;
    if (colorValueSpan) colorValueSpan.textContent = settings.primaryColor;
  }
  if (darkModeToggle) darkModeToggle.checked = settings.darkMode;

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

function saveSettings() {
  const settings = DataManager.getSettings();

  settings.siteName = document.getElementById('settingSiteName')?.value.trim() || settings.siteName;
  settings.primaryColor = document.getElementById('settingPrimaryColor')?.value || settings.primaryColor;
  settings.darkMode = document.getElementById('settingDarkMode')?.checked || false;
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

  document.getElementById('pendingCount').textContent = pending.length;

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

  document.getElementById('lockedCount').textContent = locked.length;

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

  document.getElementById('inactiveFieldCount').textContent = inactive.length;

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

document.addEventListener('DOMContentLoaded', () => {
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
    case 'users':
      initUsers();
      break;
    case 'settings':
      initSettings();
      break;
    case 'processing':
      initProcessing();
      break;
  }
});