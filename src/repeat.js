/**
 * Helper cho đặt sân định kỳ (tuần / tháng / quý / năm).
 * Bản gốc nằm trong store chung (SV.repeat) để form đặt sân dùng chung ở
 * trang chủ / trang đặt sân / trang chi tiết và các trang tài khoản, admin
 * đều đọc đúng một nguồn. File này chỉ re-export cho các module ESM.
 */
const R = window.SV.repeat // store.js được nạp trước module này trên mọi trang

export const REPEAT_LABEL = R.LABEL
export const toDateStr = R.toDateStr
export const addDays = R.addDays
export const addMonths = R.addMonths
export const repeatDates = R.dates
export const repeatCountOf = R.countOf
export const repeatCountOk = R.countOk
export const makeSeriesId = R.seriesId
