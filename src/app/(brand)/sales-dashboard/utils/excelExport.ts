'use client';

import * as XLSX from 'xlsx';

export interface ExcelSheet {
  /** Sheet name (max 31 chars, no special chars). */
  name: string;
  /** Array of objects — keys become column headers. */
  rows: Array<Record<string, any>>;
  /**
   * Optional column widths (in chars). When omitted, widths are auto-derived
   * from the data so the resulting file looks readable straight from the box.
   */
  columnWidths?: number[];
  /**
   * Columns whose VND values should be formatted with thousands separators.
   * Match by exact header text. If omitted, headers ending with "(VND)" are
   * auto-formatted as currency.
   */
  vndColumns?: string[];
  /**
   * Columns whose values should be formatted as percent. Match by exact header.
   * If omitted, headers ending with "(%)" are auto-formatted.
   */
  percentColumns?: string[];
}

/**
 * Export one or more sheets to an .xlsx file with sane defaults:
 *   - VND columns get the "#,##0" format (millions readable at a glance)
 *   - "(%)"" columns get the "0.00\"%\"" format
 *   - Header row is bold + frozen at top
 *   - Column widths auto-size to the longest cell in each column
 */
export function exportSheetsToExcel(filename: string, sheets: ExcelSheet[]) {
  if (sheets.length === 0) return;

  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    decorateSheet(ws, sheet);
    const safeName = sanitizeSheetName(sheet.name);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const safe = filename.replace(/[\\\/:*?"<>|]/g, '-');
  XLSX.writeFile(wb, `${safe}_${stamp}.xlsx`, { cellStyles: true });
}

function decorateSheet(ws: XLSX.WorkSheet, sheet: ExcelSheet) {
  if (sheet.rows.length === 0) return;

  const range = XLSX.utils.decode_range(ws['!ref']!);
  const headers = Object.keys(sheet.rows[0]);
  const vndHeaders = new Set(
    sheet.vndColumns ?? headers.filter((h) => /\(VND\)$/i.test(h)),
  );
  const pctHeaders = new Set(
    sheet.percentColumns ?? headers.filter((h) => /\(%\)$/.test(h)),
  );

  // Apply number formats and freeze header row
  for (let c = range.s.c; c <= range.e.c; c++) {
    const header = headers[c];
    const isVnd = vndHeaders.has(header);
    const isPct = pctHeaders.has(header);
    if (!isVnd && !isPct) continue;
    const fmt = isVnd ? '#,##0' : '0.00"%"';
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n';
        cell.z = fmt;
      }
    }
  }

  // Header styling (bold) — relies on cellStyles=true on writeFile
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '00A651' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Column widths
  if (sheet.columnWidths) {
    ws['!cols'] = sheet.columnWidths.map((w) => ({ wch: w }));
  } else {
    ws['!cols'] = headers.map((h, idx) => {
      let max = h.length;
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c: range.s.c + idx });
        const cell = ws[addr];
        if (!cell) continue;
        const text = cell.w ?? String(cell.v ?? '');
        if (text.length > max) max = text.length;
      }
      // clamp
      return { wch: Math.min(Math.max(max + 2, 10), 40) };
    });
  }
}

function sanitizeSheetName(name: string): string {
  return name.replace(/[\\\/:?*\[\]]/g, ' ').slice(0, 31);
}

export function buildScopeHeaderRows(opts: {
  reportName: string;
  storeName?: string;
  fromDate?: string;
  toDate?: string;
  extra?: Record<string, string>;
}): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [
    { Trường: 'Báo cáo', 'Giá trị': opts.reportName },
    { Trường: 'Phạm vi', 'Giá trị': opts.storeName ?? 'Toàn hệ thống' },
    {
      Trường: 'Khoảng thời gian',
      'Giá trị':
        opts.fromDate && opts.toDate
          ? `${opts.fromDate} → ${opts.toDate}`
          : '—',
    },
    { Trường: 'Xuất lúc', 'Giá trị': new Date().toLocaleString('vi-VN') },
  ];
  if (opts.extra) {
    for (const [k, v] of Object.entries(opts.extra)) {
      rows.push({ Trường: k, 'Giá trị': v });
    }
  }
  return rows;
}
