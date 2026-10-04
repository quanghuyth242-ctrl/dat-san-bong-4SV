/**
 * Chuẩn hoá tiếng Việt dùng chung cho bộ lọc trang chủ và trợ lý đặt sân,
 * để người dùng gõ "q.10", "TP.HCM" hay "Cầu Giấy" đều ra cùng một kết quả.
 */

/** Bỏ dấu + lowercase. "Hồ Chí Minh" -> "ho chi minh", "Đà Nẵng" -> "da nang". */
export function deaccent(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/** Chuẩn hoá để so khớp: bỏ dấu, hạ chữ thường, gộp khoảng trắng, bỏ dấu phẩy/chấm. */
export function norm(str) {
  return deaccent(str)
    .toLowerCase()
    .replace(/[,;.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Cách viết tắt thường gặp -> dạng đầy đủ. Áp dụng cho cả dữ liệu lẫn từ khoá người dùng.
// Lưu ý: norm() đã đổi dấu chấm thành khoảng trắng, nên "TP.HCM" tới đây là "tp hcm".
const ABBREVIATIONS = [
  [/\btp\s*ho\s*chi\s*minh\b|\btp\s*hcm\b|\btphcm\b|\bho\s*chi\s*minh\b/g, 'tp ho chi minh'],
  [/\btp\s*ha\s*noi\b|\btp\s*hn\b|\bthanh\s*pho\b|\bha\s*noi\b/g, 'ha noi'],
  [/\bq\.?\s*(\d{1,2})\b/g, 'quan $1'],
  [/\bquan\s*(\d{1,2})\b/g, 'quan $1'],
  [/\bp\.?\s*(\d{1,2})\b/g, 'phuong $1'],
  [/\bphuong\s*(\d{1,2})\b/g, 'phuong $1'],
  [/\bkdt\b|\bkhu\s*do\s*thi\b/g, 'khu do thi'],
  [/\btt\b|\btp\s*tay\s*son\b/g, 'tay son'],
  [/\bq\.?\s*go\b/g, 'go vap'],
  [/\btd\b|\btp\s*thu\s*duc\b/g, 'thu duc'],
  [/\bq\.?\s*bn\b/g, 'binh duong'],
  [/\bq\.?\s*dn\b/g, 'dong nai'],
]

/** Mở rộng viết tắt để "q.10" và "quận 10" không khác nhau. */
export function expand(str) {
  let out = norm(str)
  for (const [re, to] of ABBREVIATIONS) out = out.replace(re, to)
  return out
}

/** Toàn bộ chữ của một sân, đã chuẩn hoá, để tìm theo địa điểm. */
export function venueHaystack(venue) {
  const t = venue.type || ''
  return expand(`${venue.name} ${venue.addr} ${venue.sport || ''} ${t} san ${t.replace('Sân ', '')}`)
}