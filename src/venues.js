/**
 * Dữ liệu sân dùng chung cho trang chủ, trang tài khoản và trợ lý đặt sân.
 * Nguồn duy nhất: nếu admin đã đăng sân thì lấy từ localStorage, không thì dùng bộ mặc định.
 */

// 4SV.vn chỉ phục vụ sân bóng đá: mọi sân đều thuộc 1 trong 3 kích thước sân chuẩn.
export const FIELD_TYPES = ['Sân 5', 'Sân 7', 'Sân 11']

export const FIELD_IMAGES = [
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&q=75',
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=75',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&q=75',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&q=75',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=75',
  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&q=75',
  'https://images.unsplash.com/photo-1579952363873-27f3bfad9c0d?w=400&q=75',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=400&q=75',
]

export const DEFAULT_VENUES = [
  { id: 1, name: 'Sân Bóng Thành Công', type: 'Sân 5', addr: '18 Thành Công, Ba Đình, Hà Nội', price: '300k', per: '/tiếng', courts: 3, hours: { open: 6, close: 22 }, lat: 21.0465, lng: 105.8069, img: FIELD_IMAGES[0], icon: '⚽' },
  { id: 2, name: 'Sân Cỏ Nhân Tạo Cầu Giấy', type: 'Sân 7', addr: '68 Cầu Giấy, Cầu Giấy, Hà Nội', price: '450k', per: '/tiếng', courts: 2, hours: { open: 6, close: 23 }, lat: 21.0409, lng: 105.7822, img: FIELD_IMAGES[1], icon: '⚽' },
  { id: 3, name: 'Sân Bóng Mỹ Đình', type: 'Sân 7', addr: 'Lê Đức Thọ, Nam Từ Liêm, Hà Nội', price: '500k', per: '/tiếng', courts: 4, hours: { open: 5, close: 22 }, lat: 21.0285, lng: 105.78, img: FIELD_IMAGES[2], icon: '⚽' },
  { id: 4, name: 'Sân Bóng Thảo Điền', type: 'Sân 5', addr: '28 Thảo Điền, Thủ Đức, TP. Hồ Chí Minh', price: '350k', per: '/tiếng', courts: 3, hours: { open: 6, close: 23 }, lat: 10.7769, lng: 106.7009, img: FIELD_IMAGES[3], icon: '⚽' },
  { id: 5, name: 'Sân Bóng Tây Hồ', type: 'Sân 11', addr: 'Ngõ 431 Âu Cơ, Tây Hồ, Hà Nội', price: '700k', per: '/tiếng', courts: 1, hours: { open: 7, close: 22 }, lat: 21.066, lng: 105.85, img: FIELD_IMAGES[4], icon: '⚽' },
  { id: 6, name: 'Sân Bóng Hoàng Hoa Thám', type: 'Sân 5', addr: '290 Hoàng Hoa Thám, Ba Đình, Hà Nội', price: '280k', per: '/tiếng', courts: 2, hours: { open: 6, close: 22 }, lat: 21.033, lng: 105.839, img: FIELD_IMAGES[5], icon: '⚽' },
  { id: 7, name: 'Sân Bóng Đầm Hồng', type: 'Sân 7', addr: 'KĐT Đầm Hồng, Thanh Xuân, Hà Nội', price: '400k', per: '/tiếng', courts: 5, hours: { open: 6, close: 21 }, lat: 20.988, lng: 105.813, img: FIELD_IMAGES[6], icon: '⚽' },
  { id: 8, name: 'Sân Bóng Cầu Giang', type: 'Sân 7', addr: '12 Cầu Giang, Hải Châu, Đà Nẵng', price: '320k', per: '/tiếng', courts: 2, hours: { open: 6, close: 22 }, lat: 16.0621, lng: 108.2043, img: FIELD_IMAGES[7], icon: '⚽' },
]

/** "300000" -> "300k", "1500000" -> "1.5tr" */
export function formatPriceShort(price) {
  if (price >= 1000000) return (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1) + 'tr'
  return Math.round(price / 1000) + 'k'
}

export function loadVenuesFromAdmin() {
  try {
    const stored = localStorage.getItem('admin_fields')
    if (!stored) return null
    const fields = JSON.parse(stored)
    if (!Array.isArray(fields) || fields.length === 0) return null

    // Chỉ lấy sân đang hoạt động
    const activeFields = fields.filter(f => f.status === 'active')
    if (activeFields.length === 0) return null

    return activeFields.map((f, idx) => ({
      id: f.id || idx + 1,
      name: f.name,
      type: FIELD_TYPES.includes(f.type) ? f.type : FIELD_TYPES[0],
      addr: f.address,
      price: formatPriceShort(f.price),
      per: '/tiếng',
      courts: 1,
      hours: { open: 6, close: 22 },
      lat: 21.0285,
      lng: 105.8542,
      img: FIELD_IMAGES[idx % FIELD_IMAGES.length],
      icon: '⚽',
    }))
  } catch (e) {
    console.warn('Lỗi đọc dữ liệu admin:', e)
    return null
  }
}

export function loadVenues() {
  return loadVenuesFromAdmin() || DEFAULT_VENUES
}

/** Giá mỗi tiếng dạng số để so sánh ("300k" -> 300000). */
export function priceValue(venue) {
  return (parseInt(String(venue.price).replace(/\D/g, ''), 10) || 0) * 1000
}