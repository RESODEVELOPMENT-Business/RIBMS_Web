/**
 * Helpers để làm việc với ngày theo múi giờ Việt Nam (UTC+7).
 *
 * `toVietnamDateStr` chuyển bất kỳ Date (theo múi giờ local nào) về đúng ngày dương
 * lịch tại Việt Nam (YYYY-MM-DD), bất kể timezone của client.
 */

/**
 * Trả về chuỗi YYYY-MM-DD tương ứng với ngày tại Việt Nam (UTC+7) của `date`.
 */
export function toVietnamDateStr(date: Date): string {
  // Dùng Intl.DateTimeFormat với múi giờ Asia/Ho_Chi_Minh (UTC+7)
  // en-CA locale trả về định dạng YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
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

export type DatePresetType =
  | 'today'
  | 'yesterday'
  | '3-days'
  | '7-days'
  | '30-days'
  | 'week'
  | 'week-past'
  | 'month'
  | 'month-past';

export interface DatePreset {
  label: string;
  type: DatePresetType;
}

export const COMMON_PRESETS: DatePreset[] = [
  { label: 'Hôm nay', type: 'today' },
  { label: 'Hôm qua', type: 'yesterday' },
  { label: '3 ngày qua', type: '3-days' },
  { label: 'Tuần này', type: 'week' },
  { label: 'Tuần trước', type: 'week-past' },
  { label: 'Tháng này', type: 'month' },
  { label: 'Tháng trước', type: 'month-past' },
  { label: '7 ngày qua', type: '7-days' },
  { label: '30 ngày qua', type: '30-days' },
];

export function getPresetDateRange(type: DatePresetType): { fromDate: string; toDate: string } {
  const vnToday = startOfVietnamDay(new Date());
  const toStr = toVietnamDateStr(vnToday);

  const startOfWeek = (d: Date) => {
    const day = d.getDay(); // 0=CN .. 6=T7
    const diff = day === 0 ? 6 : day - 1;
    const mon = new Date(d);
    mon.setDate(d.getDate() - diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  };

  switch (type) {
    case 'today':
      return { fromDate: toStr, toDate: toStr };
    case 'yesterday': {
      const yesterday = new Date(vnToday);
      yesterday.setDate(vnToday.getDate() - 1);
      const yStr = toVietnamDateStr(yesterday);
      return { fromDate: yStr, toDate: yStr };
    }
    case '3-days': {
      const start = new Date(vnToday);
      start.setDate(vnToday.getDate() - 2);
      return { fromDate: toVietnamDateStr(start), toDate: toStr };
    }
    case '7-days': {
      const start = new Date(vnToday);
      start.setDate(vnToday.getDate() - 6);
      return { fromDate: toVietnamDateStr(start), toDate: toStr };
    }
    case '30-days': {
      const start = new Date(vnToday);
      start.setDate(vnToday.getDate() - 29);
      return { fromDate: toVietnamDateStr(start), toDate: toStr };
    }
    case 'week': {
      const mon = startOfWeek(vnToday);
      return { fromDate: toVietnamDateStr(mon), toDate: toStr };
    }
    case 'week-past': {
      const mon = startOfWeek(vnToday);
      mon.setDate(mon.getDate() - 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { fromDate: toVietnamDateStr(mon), toDate: toVietnamDateStr(sun) };
    }
    case 'month': {
      const first = new Date(vnToday.getFullYear(), vnToday.getMonth(), 1);
      return { fromDate: toVietnamDateStr(first), toDate: toStr };
    }
    case 'month-past': {
      const first = new Date(vnToday.getFullYear(), vnToday.getMonth() - 1, 1);
      const last = new Date(vnToday.getFullYear(), vnToday.getMonth(), 0);
      return { fromDate: toVietnamDateStr(first), toDate: toVietnamDateStr(last) };
    }
    default:
      return { fromDate: toStr, toDate: toStr };
  }
}

