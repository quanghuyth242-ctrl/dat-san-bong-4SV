// Helper cho đặt sân định kỳ (tuần / tháng / quý / năm) dùng chung cho các trang.

export const REPEAT_LABEL = {
  none: 'Không lặp lại',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
}

export function toDateStr(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

/** Cộng tháng và tự kẹp ngày về cuối tháng khác (31/1 + 1 tháng = 28/2). */
export function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return toDateStr(d)
}

/** Danh sách ngày cho đặt lịch định kỳ theo tuần/tháng/quý/năm (tối đa 52 buổi). */
export function repeatDates(startDate, type, count) {
  if (!type || type === 'none') return [startDate]
  const total = Math.max(1, Math.min(52, Number(count) || 1))
  const out = []
  for (let i = 0; i < total; i += 1) {
    if (type === 'weekly') out.push(addDays(startDate, i * 7))
    else if (type === 'monthly') out.push(addMonths(startDate, i))
    else if (type === 'quarterly') out.push(addMonths(startDate, i * 3))
    else if (type === 'yearly') out.push(addMonths(startDate, i * 12))
    else out.push(startDate)
  }
  return out
}

/** Số buổi hợp lệ: không lặp lại thì 1, có lặp lại thì clamp về 1..52. */
export function repeatCountOf(type, raw) {
  if (!type || type === 'none') return 1
  return Math.max(1, Math.min(52, parseInt(raw, 10) || 1))
}

/** Số buổi người dùng nhập có hợp lệ không (dùng cho validate form). */
export function repeatCountOk(type, raw) {
  if (!type || type === 'none') return true
  const cnt = parseInt(raw, 10)
  return Number.isFinite(cnt) && cnt >= 1 && cnt <= 52
}

/** Mã nhóm định kỳ để nối các buổi của cùng một lần đặt. */
export function makeSeriesId() {
  return 'LK' + Date.now().toString(36).toUpperCase()
}
