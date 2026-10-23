/**
 * Helper cho đặt sân định kỳ (tuần / tháng / quý / năm).
 * Bản gốc nằm trong store chung (SV.repeat) để form đặt sân dùng chung ở
 * trang chủ / trang đặt sân / trang chi tiết và các trang tài khoản, admin
 * đều đọc đúng một nguồn. File này chỉ re-export cho các module ESM.
 */
const R = window.SV.repeat // store.js được nạp trước module này trên mọi trang

export const REPEAT_LABEL = R.LABEL
export const PERIOD_LABEL = R.PERIOD_LABEL
export const DAYS_LABEL = R.DAYS_LABEL
export const WEEK = R.WEEK
export const MAX_PERIODS = R.MAX_PERIODS
export const MAX_SESSIONS = R.MAX_SESSIONS
export const toDateStr = R.toDateStr
export const addDays = R.addDays
export const addMonths = R.addMonths
export const weekdayOf = R.weekdayOf
export const dayOfMonthOf = R.dayOfMonthOf
export const normalizeRepeatDays = R.normalizeDays
export const repeatDates = R.dates
export const repeatSessions = R.sessions
export const repeatCountOf = R.countOf
export const repeatCountOk = R.countOk
export const makeSeriesId = R.seriesId
