/**
 * Helpers để làm việc với ngày theo múi giờ Việt Nam (UTC+7).
 *
 * Lý do: `new Date().toISOString()` trả về giờ UTC. Nếu browser của người dùng
 * không nằm ở UTC+7, việc format ngày bằng `toISOString().split('T')[0]` sẽ lệch
 * 1 ngày so với ngày thực tế tại VN — dẫn đến sai lệch thống kê theo ngày khi gửi
 * lên backend (backend lưu/so sánh theo giờ VN).
 *
 * `toVietnamDateStr` chuyển bất kỳ Date (theo múi giờ local nào) về đúng ngày dương
 * lịch tại Việt Nam, bất kể timezone của client.
 */

const VIETNAM_UTC_OFFSET_MINUTES = 7 * 60;

/**
 * Trả về chuỗi YYYY-MM-DD tương ứng với ngày tại Việt Nam (UTC+7) của `date`.
 */
export function toVietnamDateStr(date: Date): string {
  // Dời `date` sang múi giờ VN:
  // offsetLocal = getTimezoneOffset() (phút, dương nếu local chậm hơn UTC).
  // delta = VIETNAM_UTC_OFFSET_MINUTES + offsetLocal  → số phút cần cộng để ra giờ VN.
  const deltaMinutes = VIETNAM_UTC_OFFSET_MINUTES + date.getTimezoneOffset();
  const vn = new Date(date.getTime() + deltaMinutes * 60_000);
  const y = vn.getUTCFullYear();
  const m = `${vn.getUTCMonth() + 1}`.padStart(2, '0');
  const d = `${vn.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Trả về Date (local) tương ứng với 00:00:00 của ngày VN của `date`.
 * Dùng để tính toán các mốc đầu/cuối tuần, đầu/cuối tháng theo ngày VN.
 */
export function startOfVietnamDay(date: Date): Date {
  const vnDateStr = toVietnamDateStr(date);
  const [y, m, d] = vnDateStr.split('-').map(Number);
  // Tạo Date tại local tương ứng với midnight của ngày VN đó.
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Ngày hôm nay tại Việt Nam (định dạng YYYY-MM-DD).
 */
export function vietnamTodayStr(): string {
  return toVietnamDateStr(new Date());
}
