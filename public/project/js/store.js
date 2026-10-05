/**
 * Store dùng chung cho MỌI trang: trang chủ, đăng nhập, danh sách sân và toàn bộ
 * trang quản trị. Trước đây mỗi trang tự đọc một key riêng (`admin_fields`,
 * `4sv_auth_users`, `4sv_bookings`...) nên sửa sân ở admin không hiện ở trang
 * chủ, đăng ký ở trang chủ không có trong danh sách người dùng của admin.
 *
 * Nay tất cả đọc/ghi cùng một key trong localStorage qua đây, và có báo cho tab
 * khác (sự kiện `storage`) để các trang mở song song tự cập nhật.
 *
 * Nạp bằng thẻ <script> cổ điển vì các trang trong public/ không đi qua bước
 * build của Vite, không thể import ES module lẫn nhau.
 */
(function (global) {
  'use strict'

  var NS = '4sv'

  var KEYS = {
    fields: NS + '_fields',
    users: NS + '_users',
    bookings: NS + '_bookings',
    reviews: NS + '_reviews',
    vouchers: NS + '_vouchers',
    settings: NS + '_settings',
  }

  /** Phiên đăng nhập: "ghi nhớ" sống lâu, còn lại hết hạn khi đóng trình duyệt. */
  var AUTH_KEYS = {
    remember: NS + '_auth_remember',
    session: NS + '_auth_session',
  }

  /** Mốc cũ của từng trang; chỉ đọc một lần rồi xoá để không còn hai nguồn. */
  var LEGACY = {
    fields: ['admin_fields'],
    users: ['admin_users', NS + '_auth_users'],
    bookings: ['admin_bookings'],
    reviews: ['admin_reviews'],
    vouchers: ['admin_vouchers'],
    settings: ['admin_settings'],
  }

  var MIGRATED_FLAG = NS + '_store_v1'
  // Màu thương hiệu mặc định của trang chủ, admin đổi ở trang Giao diện.
  var BRANDING_FLAG = NS + '_branding_v2'
  var LEGACY_PRIMARY = ['#2563eb', '#1d4ed8']
  // Tên website mặc định của bản admin cũ, giờ ghi đè logo/footer ở trang chủ.
  var LEGACY_SITE_NAME = ['QUẢN LÝ ĐẶT SÂN', 'QUẢN LÝ ĐẶT SÂN BÓNG', 'QUẢN LÝ ĐẶT SÂN BÓNG ĐÁ']
  var PREFIX = { field: 'SAN', user: 'ND', booking: 'DD', review: 'DG', voucher: 'MAG' }
  var PAD = { field: 3, user: 3, booking: 3, review: 3, voucher: 3 }

  var FIELD_IMAGES = [
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579952363873-27f3bfad9c0d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&q=80&auto=format&fit=crop',
  ]

  // ================================ TIỆN ÍCH ================================

  function clone(value) {
    return value === undefined ? value : JSON.parse(JSON.stringify(value))
  }

  function readJSON(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key)
      if (!raw) return fallback
      var parsed = JSON.parse(raw)
      return parsed === null || parsed === undefined ? fallback : parsed
    } catch (e) {
      console.warn('[SV] Lỗi đọc mốc', key, e)
      return fallback
    }
  }

  function writeJSON(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.warn('[SV] Không ghi được mốc', key, e)
      return false
    }
  }

  function removeKey(key) {
    try {
      global.localStorage.removeItem(key)
      return true
    } catch (e) {
      console.warn('[SV] Không xoá được mốc', key, e)
      return false
    }
  }

  function toInt(value, fallback) {
    var n = parseInt(value, 10)
    return Number.isFinite(n) ? n : fallback
  }

  function toHour(value, fallback) {
    var n = typeof value === 'number' ? value : parseFloat(String(value == null ? '' : value))
    return Number.isFinite(n) && n >= 0 && n <= 24 ? n : fallback
  }

  function toCoord(value) {
    var n = typeof value === 'number' ? value : parseFloat(String(value == null ? '' : value))
    return Number.isFinite(n) ? n : null
  }

  /** "300k" -> 300000, "1.2tr" -> 1200000, "300.000đ" -> 300000. */
  function toPrice(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0
    var s = String(value == null ? '' : value).trim().toLowerCase().replace(/\s/g, '')
    if (!s) return 0
    var hasTr = /tr/.test(s)
    var hasK = !hasTr && /k/.test(s)
    var digits = s.replace(/[^\d.,]/g, '')
    if (hasTr || hasK) {
      var sep = Math.max(digits.lastIndexOf('.'), digits.lastIndexOf(','))
      var head = sep >= 0 ? digits.slice(0, sep).replace(/[.,]/g, '') : digits
      var tail = sep >= 0 ? digits.slice(sep + 1) : ''
      digits = tail ? head + '.' + tail : head
    } else {
      digits = digits.replace(/[.,]/g, '')
    }
    var n = parseFloat(digits)
    if (!Number.isFinite(n)) return 0
    return Math.round(n * (hasTr ? 1e6 : hasK ? 1e3 : 1))
  }

  function pad(value, size) {
    return String(value).padStart(size, '0')
  }

  /** "Sân 7", "7", 7 -> 'Sân 7'. Mọi trang dùng chung nhãn này cho loại sân. */
  function pitchLabel(value) {
    var match = String(value == null ? '' : value).match(/\d+/)
    var n = match ? match[0] : '7'
    return 'Sân ' + (n === '11' ? '11' : n)
  }

  /** Khoá so khớp sân: 'demo-3', 'san-3', 'SAN003' đều về 'SAN003'. */
  function courtKey(id) {
    var raw = String(id == null ? '' : id).trim()
    if (!raw) return ''
    var digits = raw.replace(new RegExp('^' + PREFIX.field + '-', 'i'), '').replace(/\D+/g, '')
    return digits ? PREFIX.field + pad(Number(digits), PAD.field) : raw
  }

  function normalizeId(raw, kind) {
    var value = String(raw == null ? '' : raw).trim()
    if (!value) return ''
    if (kind === 'field') return courtKey(value)
    var digits = value.replace(/\D+/g, '')
    if (!digits) return value
    return PREFIX[kind] + pad(Number(digits), PAD[kind])
  }

  /** Khoá so khớp người dùng: email không phân biệt hoa thường, sĩ chỉ lấy số. */
  function userKeys(user) {
    var keys = []
    var email = String((user && user.email) || '').trim().toLowerCase()
    if (email) keys.push('e:' + email)
    var phone = String((user && user.phone) || '').replace(/\D/g, '')
    if (phone) keys.push('p:' + phone)
    return keys
  }

  function sameUser(a, b) {
    var ka = userKeys(a)
    var kb = userKeys(b)
    return ka.some(function (key) {
      return kb.indexOf(key) !== -1
    })
  }

  function nextId(kind, items) {
    var max = 0
    ;(items || []).forEach(function (item) {
      var value = normalizeId(item && item.id, kind)
      var n = parseInt(String(value).replace(/\D+/g, ''), 10)
      if (Number.isFinite(n) && n > max) max = n
    })
    return PREFIX[kind] + pad(max + 1, PAD[kind])
  }

  function hourToHHMM(hour) {
    var h = Math.floor(hour)
    var m = Math.round((hour - h) * 60)
    if (m === 60) {
      h += 1
      m = 0
    }
    return pad(h, 2) + ':' + pad(m, 2)
  }

  function todayStr() {
    var d = new Date()
    return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2)
  }

  // ================================ CHUẨN HOÁ ================================

  function normField(raw, idx) {
    raw = raw || {}
    var open = toHour(raw.hours ? raw.hours.open : raw.openHour, 6)
    var close = toHour(raw.hours ? raw.hours.close : raw.closeHour, 22)
    return {
      id: normalizeId(raw.id, 'field') || PREFIX.field + pad((idx || 0) + 1, PAD.field),
      name: String(raw.name || 'Sân chưa đặt tên'),
      type: pitchLabel(raw.type),
      address: String(raw.address || raw.addr || ''),
      price: toPrice(raw.price),
      courts: Math.max(1, toInt(raw.courts, 1)),
      hours: { open: open, close: close > open ? close : open + 1 },
      lat: toCoord(raw.lat),
      lng: toCoord(raw.lng),
      img: raw.img || FIELD_IMAGES[(idx || 0) % FIELD_IMAGES.length],
      desc: String(raw.desc || ''),
      status: raw.status === 'inactive' || raw.status === 'maintenance' ? 'inactive' : 'active',
    }
  }

  function normUser(raw, idx) {
    raw = raw || {}
    var created = raw.createdAt || todayStr()
    return {
      id: normalizeId(raw.id, 'user') || PREFIX.user + pad((idx || 0) + 1, PAD.user),
      name: String(raw.name || 'Người dùng'),
      email: String(raw.email || '').trim().toLowerCase(),
      phone: String(raw.phone || '').replace(/\D/g, ''),
      password: String(raw.password || ''),
      role: raw.role === 'admin' ? 'admin' : 'player',
      // Admin khoá tài khoản thì trang đăng nhập phải chặn luôn, nên trạng
      // thái nằm trong bản ghi dùng chung chứ không phải cờ riêng của admin.
      status: raw.status === 'locked' ? 'locked' : 'active',
      createdAt: created,
    }
  }

  function normBooking(raw, idx) {
    raw = raw || {}
    var courtId = courtKey(raw.courtId || raw.fieldId)
    // Đơn trang chủ lưu giờ số thập phân (17.5 = 17:30) còn đơn mẫu của admin lưu
    // chuỗi 'HH:MM', nên đọc được cả hai để mọi trang thấy cùng một lịch.
    var duration = parseFloat(raw.duration)
    var startHour = toHour(raw.startHour != null ? raw.startHour : parseHHMM(raw.startTime), 17)
    var endHour = toHour(
      raw.endHour != null ? raw.endHour : parseHHMM(raw.endTime),
      startHour + (Number.isFinite(duration) && duration > 0 ? duration : 1)
    )
    var customer = raw.customer || {}
    return {
      id: normalizeId(raw.id, 'booking') || PREFIX.booking + pad((idx || 0) + 1, PAD.booking),
      userId: normalizeId(raw.userId, 'user'),
      userName: String(raw.userName || customer.name || raw.userId || ''),
      fieldId: courtId,
      fieldName: String(raw.fieldName || raw.courtName || ''),
      date: String(raw.date || todayStr()),
      startHour: startHour,
      endHour: endHour,
      duration:
        Number.isFinite(duration) && duration > 0 ? duration : Math.max(1, endHour - startHour),
      startTime: hourToHHMM(startHour),
      endTime: hourToHHMM(endHour),
      total: toPrice(raw.total),
      discount: toPrice(raw.discount),
      voucherCode: String(raw.voucherCode || ''),
      customer: {
        name: String(customer.name || raw.userName || ''),
        phone: String(customer.phone || '').replace(/\D/g, ''),
        email: String(customer.email || '').trim().toLowerCase(),
      },
      status: raw.status || 'pending',
      createdAt: raw.createdAt || todayStr(),
      _source: raw._source || 'public',
    }
  }

  function parseHHMM(value) {
    var match = String(value == null ? '' : value).match(/(\d{1,2}):(\d{2})/)
    if (!match) return null
    return parseInt(match[1], 10) + parseInt(match[2], 10) / 60
  }

  function normReview(raw, idx) {
    raw = raw || {}
    return {
      id: normalizeId(raw.id, 'review') || PREFIX.review + pad((idx || 0) + 1, PAD.review),
      userName: String(raw.userName || 'Khách hàng'),
      userAvatar: String(raw.userAvatar || ''),
      fieldName: String(raw.fieldName || ''),
      rating: Math.min(5, Math.max(1, toInt(raw.rating, 5))),
      comment: String(raw.comment || ''),
      date: String(raw.date || todayStr()),
      // Chỉ đánh giá `visible` mới lên trang chủ; admin ẩn/xoá là trang chủ
      // biến mất ngay ở lần vẽ kế tiếp.
      status: raw.status === 'hidden' ? 'hidden' : 'visible',
      reply: String(raw.reply || ''),
      replyAt: raw.replyAt || '',
    }
  }

  function normVoucher(raw, idx) {
    raw = raw || {}
    return {
      id: normalizeId(raw.id, 'voucher') || PREFIX.voucher + pad((idx || 0) + 1, PAD.voucher),
      code: String(raw.code || '').trim().toUpperCase(),
      discountType: raw.discountType === 'fixed' ? 'fixed' : 'percent',
      discountValue: toPrice(raw.discountValue),
      minOrder: toPrice(raw.minOrder),
      maxDiscount: toPrice(raw.maxDiscount),
      usageLimit: toInt(raw.usageLimit, 0),
      usedCount: toInt(raw.usedCount, 0),
      expiryDate: String(raw.expiryDate || ''),
      status: raw.status === 'expired' ? 'expired' : 'active',
    }
  }

  function normSettings(raw) {
    raw = raw || {}
    return {
      siteName: String(raw.siteName || '4SV.vn'),
      primaryColor: String(raw.primaryColor || '#16a34a'),
      darkMode: Boolean(raw.darkMode),
      logo: String(raw.logo || ''),
      adminUsername: String(raw.adminUsername || 'admin'),
      adminPassword: String(raw.adminPassword || ''),
    }
  }

  var NORMALIZE = {
    fields: normField,
    users: normUser,
    bookings: normBooking,
    reviews: normReview,
    vouchers: normVoucher,
  }

  /** Các loại nào cần bảo đảm mã không trùng. */
  var DEDUPE = { fields: 'field', users: 'user', reviews: 'review', vouchers: 'voucher' }

  /** nextId() nhận cả mã ('SAN', không phân biệt hoa thường) lẫn tên loại ('field'). */
  var KIND_BY_CODE = {
    SAN: 'field',
    FIELD: 'field',
    ND: 'user',
    USER: 'user',
    DD: 'booking',
    BOOKING: 'booking',
    DG: 'review',
    REVIEW: 'review',
    MAG: 'voucher',
    VOUCHER: 'voucher',
  }

  // ================================ DỮ LIỆU MẶC ĐỊNH ================================

  var DEFAULT_FIELDS = [
    { id: 'SAN001', name: 'Sân Bóng Đá Thành Công', type: 'Sân 5', address: '18 Thành Công, Ba Đình, Hà Nội', price: 300000, courts: 3, hours: { open: 6, close: 22 }, lat: 21.0465, lng: 105.8069, status: 'active' },
    { id: 'SAN002', name: 'Sân Bóng Cầu Giấy', type: 'Sân 7', address: '68 Cầu Giấy, Cầu Giấy, Hà Nội', price: 500000, courts: 2, hours: { open: 6, close: 23 }, lat: 21.0409, lng: 105.7822, status: 'active' },
    { id: 'SAN003', name: 'Sân Bóng Đá Minh Khai', type: 'Sân 5', address: '85 Trần Hưng Đạo, Hai Bà Trưng, Hà Nội', price: 350000, courts: 4, hours: { open: 5, close: 22 }, lat: 21.0285, lng: 105.78, status: 'active' },
    { id: 'SAN004', name: 'Sân Bóng Tây Hồ 11 Người', type: 'Sân 11', address: 'Ngõ 431 Âu Cơ, Tây Hồ, Hà Nội', price: 900000, courts: 1, hours: { open: 7, close: 22 }, lat: 21.066, lng: 105.85, status: 'active' },
    { id: 'SAN005', name: 'Sân Bóng Đá Hoàng Mai', type: 'Sân 7', address: 'Đường Tân Mai, Hoàng Mai, Hà Nội', price: 550000, courts: 3, hours: { open: 6, close: 22 }, lat: 20.9955, lng: 105.845, status: 'active' },
    { id: 'SAN006', name: 'Sân Bóng Đá Ba Đình', type: 'Sân 7', address: '120 Xuân La, Ba Đình, Hà Nội', price: 480000, courts: 2, hours: { open: 6, close: 23 }, lat: 21.052, lng: 105.8, status: 'active' },
    { id: 'SAN007', name: 'Sân Bóng Đá Long Biên', type: 'Sân 5', address: '92 Nguyễn Văn Cừ, Long Biên, Hà Nội', price: 280000, courts: 5, hours: { open: 6, close: 21 }, lat: 21.0384, lng: 105.86, status: 'active' },
    { id: 'SAN008', name: 'Sân Bóng Đá Nam Từ Liêm', type: 'Sân 11', address: 'Đường Lê Đức Thọ, Nam Từ Liêm, Hà Nội', price: 1200000, courts: 2, hours: { open: 7, close: 22 }, lat: 21.019, lng: 105.78, status: 'active' },
  ]

  // Số điện thoại phải là duy nhất: tài khoản demo đã giữ 0912345678 nên
  // các tài khoản mẫu còn lại dùng dải số khác để đăng nhập không bị nhập nhằng.
  var DEFAULT_USERS = [
    { id: 'ND001', name: 'Nguyễn Minh Tuấn', email: 'demo@4sv.vn', phone: '0912345678', password: '123456', role: 'player', status: 'active', createdAt: '2026-01-05' },
    { id: 'ND002', name: 'Nguyễn Văn An', email: 'nguyenvanan@gmail.com', phone: '0901234567', status: 'active', createdAt: '2026-02-11' },
    { id: 'ND003', name: 'Trần Thị Bình', email: 'tranthibinh@gmail.com', phone: '0912345679', status: 'active', createdAt: '2026-03-02' },
    { id: 'ND004', name: 'Lê Hoàng Cường', email: 'lehoangcuong@gmail.com', phone: '0923456789', status: 'active', createdAt: '2026-03-19' },
    { id: 'ND005', name: 'Phạm Minh Đức', email: 'phamminhduc@gmail.com', phone: '0934567890', status: 'locked', createdAt: '2026-04-07' },
    { id: 'ND006', name: 'Hoàng Thị Linh', email: 'hoangthilin@gmail.com', phone: '0945678901', status: 'active', createdAt: '2026-05-23' },
    { id: 'ND007', name: 'Võ Thanh Hải', email: 'vothanhhai@gmail.com', phone: '0956789012', status: 'active', createdAt: '2026-06-14' },
    { id: 'ND008', name: 'Đặng Quốc Bảo', email: 'dangquocbao@gmail.com', phone: '0967890123', status: 'active', createdAt: '2026-07-30' },
  ]

  var DEFAULT_BOOKINGS = [
    { id: 'DD001', userId: 'ND002', userName: 'Nguyễn Văn An', fieldId: 'SAN001', fieldName: 'Sân Bóng Đá Thành Công', date: '2026-10-05', startTime: '17:00', endTime: '18:30', total: 450000, status: 'confirmed' },
    { id: 'DD002', userId: 'ND003', userName: 'Trần Thị Bình', fieldId: 'SAN003', fieldName: 'Sân Bóng Đá Minh Khai', date: '2026-10-05', startTime: '18:00', endTime: '19:30', total: 525000, status: 'pending' },
    { id: 'DD003', userId: 'ND004', userName: 'Lê Hoàng Cường', fieldId: 'SAN004', fieldName: 'Sân Bóng Tây Hồ 11 Người', date: '2026-10-06', startTime: '06:00', endTime: '08:00', total: 1800000, status: 'pending' },
    { id: 'DD004', userId: 'ND002', userName: 'Nguyễn Văn An', fieldId: 'SAN002', fieldName: 'Sân Bóng Cầu Giấy', date: '2026-10-06', startTime: '19:00', endTime: '20:30', total: 750000, status: 'confirmed' },
    { id: 'DD005', userId: 'ND006', userName: 'Hoàng Thị Linh', fieldId: 'SAN005', fieldName: 'Sân Bóng Đá Hoàng Mai', date: '2026-10-07', startTime: '17:30', endTime: '19:00', total: 825000, status: 'pending' },
    { id: 'DD006', userId: 'ND008', userName: 'Đặng Quốc Bảo', fieldId: 'SAN007', fieldName: 'Sân Bóng Đá Long Biên', date: '2026-10-07', startTime: '18:00', endTime: '19:30', total: 420000, status: 'completed' },
  ]

  var DEFAULT_REVIEWS = [
    { id: 'DG001', userName: 'Nguyễn Văn An', userAvatar: 'https://i.pravatar.cc/80?img=12', fieldName: 'Sân Bóng Đá Thành Công', rating: 5, comment: 'Sân cỏ đẹp, hệ thống đèn chiếu sáng rất tốt. Phục vụ chu đáo!', date: '2026-10-04', status: 'visible', reply: 'Cảm ơn bạn An đã ủng hộ sân!' },
    { id: 'DG002', userName: 'Trần Thị Bình', userAvatar: 'https://i.pravatar.cc/80?img=5', fieldName: 'Sân Bóng Đá Minh Khai', rating: 4, comment: 'Chất lượng mặt sân ổn, tuy nhiên bãi xe hơi chật lúc cao điểm.', date: '2026-10-03', status: 'visible', reply: '' },
    { id: 'DG003', userName: 'Lê Hoàng Cường', userAvatar: 'https://i.pravatar.cc/80?img=33', fieldName: 'Sân Bóng Tây Hồ 11 Người', rating: 5, comment: 'Sân rộng thoáng, bóng nảy chuẩn, có sẵn nước uống miễn phí.', date: '2026-10-02', status: 'visible', reply: 'Cảm ơn bạn Cường, hẹn gặp lại bạn lần sau!' },
    { id: 'DG004', userName: 'Phạm Minh Đức', userAvatar: 'https://i.pravatar.cc/80?img=60', fieldName: 'Sân Bóng Cầu Giấy', rating: 2, comment: 'Thái độ nhân viên bảo vệ không thân thiện.', date: '2026-10-01', status: 'hidden', reply: 'BQL đã làm việc lại với bảo vệ. Chân thành xin lỗi bạn.' },
    { id: 'DG005', userName: 'Hoàng Thị Linh', userAvatar: 'https://i.pravatar.cc/80?img=47', fieldName: 'Sân Bóng Đá Hoàng Mai', rating: 5, comment: 'Đặt sân qua 4SV nhanh chóng tiện lợi. 10/10 điểm!', date: '2026-09-30', status: 'visible', reply: '' },
  ]

  var DEFAULT_VOUCHERS = [
    { id: 'MAG001', code: 'WELCOME4SV', discountType: 'percent', discountValue: 20, minOrder: 200000, maxDiscount: 100000, usageLimit: 100, usedCount: 38, expiryDate: '2026-12-31', status: 'active' },
    { id: 'MAG002', code: 'GIAM50K', discountType: 'fixed', discountValue: 50000, minOrder: 300000, maxDiscount: 50000, usageLimit: 50, usedCount: 50, expiryDate: '2026-10-15', status: 'expired' },
    { id: 'MAG003', code: 'CUOITUAN', discountType: 'percent', discountValue: 15, minOrder: 400000, maxDiscount: 150000, usageLimit: 200, usedCount: 82, expiryDate: '2026-11-30', status: 'active' },
    { id: 'MAG004', code: 'SAN5DEM', discountType: 'fixed', discountValue: 30000, minOrder: 250000, maxDiscount: 30000, usageLimit: 30, usedCount: 12, expiryDate: '2026-10-31', status: 'active' },
  ]

  var DEFAULT_SETTINGS = {
    siteName: '4SV.vn',
    primaryColor: '#16a34a',
    darkMode: false,
    logo: '',
    adminUsername: 'admin',
    adminPassword: '',
  }

  var DEFAULTS = {
    fields: DEFAULT_FIELDS,
    users: DEFAULT_USERS,
    bookings: DEFAULT_BOOKINGS,
    reviews: DEFAULT_REVIEWS,
    vouchers: DEFAULT_VOUCHERS,
    settings: DEFAULT_SETTINGS,
  }

  // ================================ SỰ KIỆN ================================

  var listeners = []

  function emit(collection, origin) {
    listeners.slice().forEach(function (fn) {
      try {
        fn(collection, origin)
      } catch (e) {
        console.warn('[SV] Lỗi ở listener', e)
      }
    })
  }

  // Nút "ghi đè" từ store cộng với sự kiện `storage` của trình duyệt là đủ để
  // mọi tab đang mở cùng nhìn thấy một dữ liệu.
  global.addEventListener('storage', function (e) {
    if (!e.key) {
      cache = {}
      emit('*', 'storage')
      return
    }
    var collection = Object.keys(KEYS).filter(function (name) {
      return KEYS[name] === e.key
    })[0]
    if (collection) {
      cache[collection] = null
      emit(collection, 'storage')
      return
    }
    // Đăng nhập ở tab này thì tab khác cũng phải đổi nút "Đăng nhập".
    if (e.key === AUTH_KEYS.session || e.key === AUTH_KEYS.remember) {
      emit('auth', 'storage')
    }
  })

  var cache = {}

  function collection(name) {
    if (cache[name]) return cache[name]
    var normalize = NORMALIZE[name]
    var raw = readJSON(KEYS[name], null)
    var list = Array.isArray(raw) ? raw.map(normalize) : []
    cache[name] = list
    return list
  }

  /**
   * Bảo đảm mã không trùng. Người đăng ký trên web không có mã, nên khi gộp với
   * danh sách của admin (đã có ND001, ND002...) mã sinh theo thứ tự sẽ đụng
   * mã đang tồn tại; bản ghi trùng được cấp mã mới thay vì ghi đè lên nhau.
   */
  function dedupeIds(list, kind) {
    var used = []
    return list.map(function (item) {
      if (item.id && used.indexOf(item.id) === -1) {
        used.push(item.id)
        return item
      }
      // nextId() nhận danh sách bản ghi, nên bọc mã đã dùng lại thành { id }.
      var id = nextId(
        kind,
        used.map(function (usedId) {
          return { id: usedId }
        })
      )
      used.push(id)
      return Object.assign({}, item, { id: id })
    })
  }

  function store(name, list) {
    var normalized = (list || []).map(NORMALIZE[name])
    if (DEDUPE[name]) normalized = dedupeIds(normalized, DEDUPE[name])
    if (!writeJSON(KEYS[name], normalized)) return collection(name)
    cache[name] = normalized
    emit(name, 'write')
    return normalized
  }

  // ================================ GỘP DỮ LIỆU CŨ ================================

  /**
   * Gộp các mốc cũ của từng trang về key chung, chạy một lần rồi xoá mốc cũ.
   * Không đụng tới dữ liệu người dùng đã có: mốc đã có thì giữ nguyên, chỉ bù
   * thêm phần còn thiếu (ví dụ admin tạo sân mới thì trang chủ phải thấy ngay).
   */
  function migrate() {
    try {
      if (global.localStorage.getItem(MIGRATED_FLAG)) return
    } catch (e) {
      return
    }

    Object.keys(LEGACY).forEach(function (name) {
      // Đọc mốc cũ trước: nếu key chung chưa có mà mốc cũ có thì lấy mốc cũ,
      // tuyệt đối không ghi đè bằng dữ liệu mặc định khi người dùng đã nhập.
      var legacyList = null
      LEGACY[name].forEach(function (legacyKey) {
        if (legacyList) return
        var value = readJSON(legacyKey, null)
        if (Array.isArray(value) && value.length) legacyList = value
      })

      var current = readJSON(KEYS[name], null)
      var hasCurrent = Array.isArray(current) ? current.length > 0 : current != null

      if (name === 'users') {
        migrateUsers(hasCurrent ? current : [], legacyList)
      } else if (name === 'bookings') {
        migrateBookings(hasCurrent ? current : [], legacyList)
      } else if (name === 'settings') {
        // Mốc cũ của cài đặt là object nên không lọc được cùng cách với mảng.
        var legacySettings = null
        LEGACY[name].forEach(function (legacyKey) {
          if (legacySettings) return
          var value = readJSON(legacyKey, null)
          if (value && typeof value === 'object' && !Array.isArray(value)) legacySettings = value
        })
        if (!hasCurrent) writeJSON(KEYS[name], normSettings(legacySettings || DEFAULT_SETTINGS))
      } else if (!hasCurrent) {
        store(name, legacyList || DEFAULTS[name])
      }

      LEGACY[name].forEach(function (legacyKey) {
        try {
          global.localStorage.removeItem(legacyKey)
        } catch (e) {
          /* bỏ qua */
        }
      })
    })

    try {
      global.localStorage.setItem(MIGRATED_FLAG, String(Date.now()))
    } catch (e) {
      /* bỏ qua */
    }
    cache = {}
  }

  /**
   * Bản admin cũ để sẵn tên website "QUẢN LÝ ĐẶT SÂN BÓNG ĐÁ" và ô chọn màu
   * ở xanh dương #2563eb (màu của trang admin). Bấm "Lưu" một lần là trang
   * chủ in ra tên đó và đổi hết màu nhấn sang xanh dương - đều không phải ý
   * chủ sân nên ghi về mặc định của trang chủ. Chạy một lần rồi thôi để sau này
   * họ tự đặt tên, chọn màu tuỳ ý.
   */
  function resetLegacyBranding() {
    try {
      if (global.localStorage.getItem(BRANDING_FLAG)) return

      var current = readJSON(KEYS.settings, null)
      var next = current || Object.assign({}, DEFAULT_SETTINGS)
      var color = String(next.primaryColor || '').toLowerCase()
      var name = String(next.siteName || '').toUpperCase().replace(/\s+/g, ' ').trim()

      if (LEGACY_PRIMARY.indexOf(color) !== -1) next.primaryColor = DEFAULT_SETTINGS.primaryColor
      if (LEGACY_SITE_NAME.indexOf(name) !== -1) next.siteName = DEFAULT_SETTINGS.siteName
      if (next !== current) writeJSON(KEYS.settings, normSettings(next))

      global.localStorage.setItem(BRANDING_FLAG, String(Date.now()))
    } catch (e) {
      /* bỏ qua */
    }
  }

  /** Hợp nhất danh sách người dùng của admin và của trang đăng nhập theo email/số. */
  function migrateUsers(current, legacyList) {
    var merged = (Array.isArray(current) ? current : []).slice()
    var sources = []
    if (Array.isArray(legacyList)) sources.push(legacyList)
    LEGACY.users.forEach(function (legacyKey) {
      var legacy = readJSON(legacyKey, null)
      if (Array.isArray(legacy) && legacy.length) sources.push(legacy)
    })
    sources.forEach(function (source) {
      source.forEach(function (entry) {
        var found = merged.filter(function (item) {
          return sameUser(item, entry)
        })[0]
        if (found) {
          // Bản ghép: giữ mật khẩu và trạng thái khoá nếu bản ghi mới có.
          if (!found.password && entry.password) found.password = entry.password
          if (!found.email && entry.email) found.email = entry.email
          if (!found.phone && entry.phone) found.phone = entry.phone
          if (entry.status === 'locked') found.status = 'locked'
          return
        }
        merged.push(entry)
      })
    })
    if (!merged.length) merged = DEFAULTS.users.slice()
    store('users', merged)
  }

  /**
   * Trước đây admin giữ đơn riêng ở `admin_bookings` và chỉ "vá" trạng thái của
   * đơn trang chủ qua đường vòng. Nay gộp thẳng thành một danh sách nên đổi
   * trạng thái ở đâu cũng thấy ngay ở trang kia.
   */
  function migrateBookings(current, legacyList) {
    var merged = (Array.isArray(current) ? current : []).slice()
    var sources = []
    if (Array.isArray(legacyList)) sources.push(legacyList)
    var legacy = readJSON(LEGACY.bookings[0], null)
    if (Array.isArray(legacy) && legacy.length) sources.push(legacy)
    sources.forEach(function (source) {
      source.forEach(function (entry) {
        var exists = merged.some(function (item) {
          return String(item.id) === String(entry.id)
        })
        if (!exists) merged.push(entry)
      })
    })
    if (!merged.length) merged = DEFAULTS.bookings.slice()
    store('bookings', merged)
  }

  // ================================ API ================================

  var SV = {
    KEYS: KEYS,
    LEGACY: LEGACY,
    DEFAULTS: DEFAULTS,
    FIELD_IMAGES: FIELD_IMAGES,

    migrate: migrate,

    /** Tiện ích dùng lại ở các trang. */
    courtKey: courtKey,
    pitchLabel: pitchLabel,
    pitchNumber: function (value) {
      var match = String(value == null ? '' : value).match(/\d+/)
      return match ? match[0] : '7'
    },
    toPrice: toPrice,
    formatPrice: function (value) {
      return toPrice(value).toLocaleString('vi-VN') + 'đ'
    },
    todayStr: todayStr,
    hourToHHMM: hourToHHMM,
    nextId: function (code, items) {
      var key = String(code == null ? '' : code).trim().toUpperCase()
      return nextId(KIND_BY_CODE[key] || 'field', items)
    },
    escape: function (value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      })
    },

    /** Đăng ký theo dõi thay đổi. Trả về hàm để huỷ đăng ký. */
    on: function (fn) {
      listeners.push(fn)
      return function () {
        var idx = listeners.indexOf(fn)
        if (idx !== -1) listeners.splice(idx, 1)
      }
    },
    emit: emit,

    // ------------------------------ Sân ------------------------------
    // Getter trả về BẢN SAO: đổi phần tử trả v��� không được âm thầm làm đổi dữ
    // liệu đang lưu, muốn ghi phải đi qua saveX() để chuẩn hoá và báo sự kiện.
    fields: function () {
      return clone(collection('fields'))
    },
    activeFields: function () {
      return collection('fields')
        .filter(function (f) {
          return f.status === 'active'
        })
        .map(clone)
    },
    field: function (id) {
      var key = courtKey(id)
      return clone(
        collection('fields').filter(function (f) {
          return f.id === key
        })[0]
      )
    },
    saveFields: function (list) {
      return clone(store('fields', list))
    },

    // ---------------------------- Người dùng ----------------------------
    /** Kèm số đơn tính từ danh sách đơn nên admin không phải tự đếm. */
    users: function () {
      var bookings = collection('bookings')
      return collection('users').map(function (user) {
        var keys = userKeys(user)
        var count = bookings.filter(function (b) {
          if (user.id && b.userId === user.id) return true
          return userKeys(b.customer).some(function (key) {
            return keys.indexOf(key) !== -1
          })
        }).length
        return Object.assign({}, user, { bookings: count })
      })
    },
    user: function (id) {
      return SV.users().filter(function (u) {
        return u.id === normalizeId(id, 'user')
      })[0]
    },
    /** Tìm theo email hoặc số điện thoại, dùng cho cả đăng nhập lẫn admin. */
    findUser: function (identity) {
      var key = String(identity || '').trim().toLowerCase()
      var phone = String(identity || '').replace(/\D/g, '')
      return SV.users().filter(function (u) {
        return (
          (u.email && u.email.toLowerCase() === key) ||
          (phone && u.phone === phone) ||
          (u.name && u.name.toLowerCase() === key)
        )
      })[0]
    },
    addUser: function (data) {
      var list = collection('users').slice()
      var user = normUser(Object.assign({ id: nextId('user', list) }, data), list.length)
      if (userKeys(user).some(function (key) {
        return list.some(function (item) {
          return userKeys(item).indexOf(key) !== -1
        })
      })) {
        return { ok: false, error: 'Email hoặc số điện thoại đã tồn tại' }
      }
      list.push(user)
      store('users', list)
      return { ok: true, user: user }
    },
    updateUser: function (id, patch) {
      var key = normalizeId(id, 'user')
      var list = collection('users').slice()
      var idx = list.findIndex(function (u) {
        return u.id === key
      })
      if (idx === -1) return { ok: false, error: 'Không tìm thấy người dùng' }
      list[idx] = normUser(Object.assign({}, list[idx], patch), idx)
      store('users', list)
      return { ok: true, user: list[idx] }
    },
    /** Khoá/mở khoá: trang đăng nhập đọc cùng trạng thái nên bị chặn ngay. */
    setUserStatus: function (id, status) {
      return SV.updateUser(id, { status: status === 'locked' ? 'locked' : 'active' })
    },
    saveUsers: function (list) {
      return store('users', list)
    },

    // ---------------------------- Phiên đăng nhập -----------------------------
    // Phiên chỉ nhớ email + thời điểm, không sao chép cả user: tên/avatar/trạng
    // thái luôn đọc ở users() nên admin sửa hay khoá tài khoản thì mọi trang
    // thấy ngay, không phải đăng nhập lại.
    signIn: function (user, remember) {
      var payload = { email: user.email, name: user.name, role: user.role, at: Date.now() }
      // Chỉ giữ một kiểu phiên: tick "ghi nhớ" thì xoá phiên tạm và ngược lại.
      removeKey(remember ? AUTH_KEYS.session : AUTH_KEYS.remember)
      writeJSON(remember ? AUTH_KEYS.remember : AUTH_KEYS.session, payload)
      emit('auth', 'write')
      return payload
    },
    signOut: function () {
      removeKey(AUTH_KEYS.session)
      removeKey(AUTH_KEYS.remember)
      emit('auth', 'write')
    },
    /** Thông tin phiên đang lưu (kể cả khi tài khoản đã bị xoá/khoá). */
    session: function () {
      return readJSON(AUTH_KEYS.session, null) || readJSON(AUTH_KEYS.remember, null)
    },
    /** Riêng phiên "ghi nhớ" để trang đăng nhập tick lại đúng ô này. */
    remembered: function () {
      return readJSON(AUTH_KEYS.remember, null)
    },
    /** Tài khoản đang đăng nhập, hoặc null. Tài khoản bị khoá thì huỷ phiên. */
    currentUser: function () {
      var s = SV.session()
      if (!s || !s.email) return null
      var user = SV.findUser(s.email)
      if (!user) {
        SV.signOut()
        return null
      }
      if (user.status === 'locked') {
        SV.signOut()
        return null
      }
      return user
    },

    // ----------------------------- Đơn đặt -----------------------------
    bookings: function () {
      return clone(collection('bookings'))
    },
    booking: function (id) {
      return clone(
        collection('bookings').filter(function (b) {
          return b.id === String(id)
        })[0]
      )
    },
    addBooking: function (data) {
      var list = collection('bookings').slice()
      var input = Object.assign({}, data)

      // Ô mã giảm giá là tuỳ chọn: không nhập hoặc mã không dùng được thì đơn vẫn
      // tạo bình thường, chỉ không giảm tiền.
      var code = String(input.voucherCode || '').trim().toUpperCase()
      input.subtotal = toPrice(input.total)
      input.discount = 0
      input.total = input.subtotal
      if (code) {
        var preview = SV.previewVoucher(code, input.subtotal)
        if (preview.ok) {
          input.voucherCode = preview.voucher.code
          input.discount = preview.discount
          input.total = preview.total
        } else {
          input.voucherCode = ''
        }
      } else {
        input.voucherCode = ''
      }

      var booking = normBooking(Object.assign({ id: nextId('booking', list) }, input), list.length)
      if (SV.isSlotTaken(booking.fieldId, booking.date, booking.startHour, booking.duration, booking.id)) {
        return { ok: false, error: 'Khung giờ này vừa có người đặt, vui lòng chọn giờ khác' }
      }
      list.push(booking)
      store('bookings', list)
      // Chỉ trừ lượt dùng sau khi đơn đã ghi thành công.
      if (booking.voucherCode) SV.redeemVoucher(booking.voucherCode)
      return { ok: true, booking: booking }
    },
    createBooking: function (data) {
      return SV.addBooking(data)
    },
    courtKey: courtKey,
    saveBookings: function (list) {
      return store('bookings', list)
    },
    setBookingStatus: function (id, status) {
      var list = collection('bookings').slice()
      var idx = list.findIndex(function (b) {
        return b.id === String(id)
      })
      if (idx === -1) return { ok: false, error: 'Không tìm thấy đơn' }
      list[idx].status = status
      store('bookings', list)
      return { ok: true, booking: list[idx] }
    },
    /** Slot đã bị chiếm: giờ bắt đầu -> giờ kết thúc (số thập phân). Đơn đã huỷ không còn chiếm slot. */
    isSlotTaken: function (fieldId, date, startHour, duration, ignoreId) {
      var key = courtKey(fieldId)
      var endHour = startHour + duration
      return collection('bookings').some(function (b) {
        return (
          b.id !== String(ignoreId) &&
          b.status !== 'cancelled' &&
          courtKey(b.fieldId) === key &&
          b.date === date &&
          startHour < b.endHour &&
          endHour > b.startHour
        )
      })
    },

    // ---------------------------- Đánh giá -----------------------------
    reviews: function () {
      return clone(collection('reviews'))
    },
    visibleReviews: function () {
      return collection('reviews')
        .filter(function (r) {
          return r.status === 'visible'
        })
        .map(clone)
    },
    addReview: function (data) {
      var list = collection('reviews').slice()
      var review = normReview(Object.assign({ id: nextId('review', list) }, data), list.length)
      list.push(review)
      store('reviews', list)
      return { ok: true, review: review }
    },
    updateReview: function (id, patch) {
      var list = collection('reviews').slice()
      var idx = list.findIndex(function (r) {
        return r.id === String(id)
      })
      if (idx === -1) return { ok: false, error: 'Không tìm thấy đánh giá' }
      list[idx] = Object.assign({}, list[idx], patch)
      store('reviews', list)
      return { ok: true, review: list[idx] }
    },
    saveReviews: function (list) {
      return store('reviews', list)
    },

    // ----------------------------- Voucher -----------------------------
    vouchers: function () {
      return clone(collection('vouchers'))
    },
    saveVouchers: function (list) {
      return store('vouchers', list)
    },
    /** Kiểm tra một mã có dùng được không, chưa trừ lượt dùng. */
    findVoucher: function (code) {
      var key = String(code || '').trim().toUpperCase()
      if (!key) return { ok: false, error: 'Chưa nhập mã giảm giá' }
      var voucher = collection('vouchers').filter(function (v) {
        return v.code === key
      })[0]
      if (!voucher) return { ok: false, error: 'Mã giảm giá không tồn tại' }
      if (voucher.status !== 'active') return { ok: false, error: 'Mã giảm giá đã hết hạn hoặc tạm khoá' }
      if (voucher.expiryDate && voucher.expiryDate < todayStr()) {
        return { ok: false, error: 'Mã giảm giá đã hết hạn' }
      }
      if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
        return { ok: false, error: 'Mã giảm giá đã hết lượt sử dụng' }
      }
      return { ok: true, voucher: voucher }
    },
    /**
     * Tính tiền giảm cho một mã. Hàm này KHÔNG tự trừ lượt dùng: gọi
     * `redeemVoucher` sau khi đơn đặt thành công mới tăng usedCount, tránh việc
     * dùng mã đi không đặt được sân cũng mất lượt.
     */
    previewVoucher: function (code, total) {
      var found = SV.findVoucher(code)
      if (!found.ok) return found
      var voucher = found.voucher
      var amount = toPrice(total)
      if (amount < voucher.minOrder) {
        return {
          ok: false,
          error: 'Đơn tối thiểu ' + voucher.minOrder.toLocaleString('vi-VN') + 'đ để dùng mã này',
        }
      }
      var discount =
        voucher.discountType === 'percent'
          ? Math.round((amount * voucher.discountValue) / 100)
          : voucher.discountValue
      if (voucher.maxDiscount > 0 && voucher.discountType === 'percent') {
        discount = Math.min(discount, voucher.maxDiscount)
      }
      discount = Math.min(discount, amount)
      return { ok: true, voucher: voucher, discount: discount, total: amount - discount }
    },
    redeemVoucher: function (code) {
      var found = SV.findVoucher(code)
      if (!found.ok) return found
      var list = collection('vouchers').slice()
      var idx = list.findIndex(function (v) {
        return v.code === found.voucher.code
      })
      if (idx === -1) return { ok: false, error: 'Mã giảm giá không tồn tại' }
      list[idx].usedCount += 1
      store('vouchers', list)
      return { ok: true, voucher: list[idx] }
    },

    // ---------------------------- Cài đặt -----------------------------
    settings: function () {
      return normSettings(readJSON(KEYS.settings, DEFAULT_SETTINGS))
    },
    saveSettings: function (patch) {
      var next = normSettings(Object.assign({}, SV.settings(), patch || {}))
      writeJSON(KEYS.settings, next)
      emit('settings', 'write')
      return next
    },
  }

  migrate()
  resetLegacyBranding()
  global.SV = SV
})(window)