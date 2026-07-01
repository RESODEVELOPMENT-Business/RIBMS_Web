'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DatePicker from '@/components/form/date-picker';
import {
  getInvoiceBrands,
  getInvoiceStoresByBrandCode,
  getInvoices,
  InvoiceBrandDto,
  InvoiceStoreDto,
  InvoiceDto,
  PaginatedList
} from '@/services/invoiceApi';

// Helper to format VND Currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Helper to format Date string
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Helper to render Status badge
function getStatusBadge(status: number) {
  let text = 'Không xác định';
  let classes = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

  switch (status) {
    case 0:
      text = 'Bản nháp';
      classes = 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
      break;
    case 1:
      text = 'Thành công';
      classes = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400';
      break;
    case 2:
      text = 'Đã gửi';
      classes = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      break;
    case 3:
      text = 'Chờ duyệt';
      classes = 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
      break;
    case 4:
      text = 'Hoàn tất';
      classes = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      break;
    case 5:
      text = 'Thất bại';
      classes = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400';
      break;
    case 6:
      text = 'Đang xử lý';
      classes = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      break;
    case 7:
      text = 'Chờ gửi lại';
      classes = 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
      break;
    case 8:
      text = 'Đã thay thế';
      classes = 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
      {text}
    </span>
  );
}

const PRESETS = [
  { label: 'Hôm nay', days: 0 },
  { label: 'Hôm qua', days: 1, type: 'yesterday' },
  { label: '3 ngày qua', days: 3 },
  { label: '7 ngày qua', days: 7 },
  { label: '30 ngày qua', days: 30 },
];

export default function InvoicesPage() {
  const [invoicesData, setInvoicesData] = useState<PaginatedList<InvoiceDto> | null>(null);
  const [brands, setBrands] = useState<InvoiceBrandDto[]>([]);
  const [selectedBrandCode, setSelectedBrandCode] = useState<string>('');
  const [stores, setStores] = useState<InvoiceStoreDto[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  // Filters
  const [searchKey, setSearchKey] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Pagination & Loading
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  // Load Brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Load Stores when Brand changes
  useEffect(() => {
    if (selectedBrandCode) {
      fetchStores(selectedBrandCode);
    } else {
      setStores([]);
      setSelectedStoreId('');
    }
  }, [selectedBrandCode]);

  // Load Invoices when filters or pagination changes
  useEffect(() => {
    fetchInvoices();
  }, [page, pageSize, selectedStoreId, statusFilter, fromDate, toDate]);

  const fetchBrands = async () => {
    try {
      const res = await getInvoiceBrands();
      setBrands(res?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách thương hiệu');
    }
  };

  const fetchStores = async (brandCode: string) => {
    try {
      const res = await getInvoiceStoresByBrandCode(brandCode);
      setStores(res?.data || []);
      setSelectedStoreId(''); // Reset store filter on brand change
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách cửa hàng');
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await getInvoices({
        pageNumber: page,
        pageSize: pageSize,
        storeId: selectedStoreId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status: statusFilter !== 'all' ? Number(statusFilter) : undefined,
        searchKey: searchKey || undefined
      });
      setInvoicesData(res?.data || null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to page 1 on new search
    fetchInvoices();
  };

  const handleResetFilters = () => {
    setSearchKey('');
    setStatusFilter('all');
    
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 7);
    setFromDate(start.toISOString().split('T')[0]);
    setToDate(today.toISOString().split('T')[0]);

    setSelectedBrandCode('');
    setStores([]);
    setSelectedStoreId('');
    setPage(1);
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    const today = new Date();
    if (preset.type === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yStr = yesterday.toISOString().split('T')[0];
      setFromDate(yStr);
      setToDate(yStr);
    } else {
      const start = new Date();
      start.setDate(today.getDate() - preset.days);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(today.toISOString().split('T')[0]);
    }
    setPage(1);
  };

  const copyToClipboard = (text: string, typeName: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${typeName}: ${text}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Lịch sử hóa đơn đã xuất</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Xem và quản lý tất cả hóa đơn đã gửi sang đối tác phát hành.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow border border-gray-100 dark:bg-gray-800 dark:border-gray-700 p-6 space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Keyword Search */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Mã HĐ, Bill, Cửa hàng, MST..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Brand Selection */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Thương hiệu</label>
            <select
              value={selectedBrandCode}
              onChange={(e) => setSelectedBrandCode(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map((b) => (
                <option key={b.id} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Store Selection */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Cửa hàng</label>
            <select
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                setPage(1);
              }}
              disabled={!selectedBrandCode}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">Tất cả cửa hàng</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Status Selection */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="0">Bản nháp</option>
              <option value="1">Thành công (Success)</option>
              <option value="2">Đã gửi (Sent)</option>
              <option value="3">Chờ duyệt (PendingApproval)</option>
              <option value="4">Hoàn tất (Completed)</option>
              <option value="5">Thất bại (Failed)</option>
              <option value="6">Đang xử lý (Pending)</option>
              <option value="7">Chờ gửi lại (RetryPending)</option>
              <option value="8">Đã thay thế (Replaced)</option>
            </select>
          </div>

          {/* Date Range Picker */}
          <div className="flex flex-col space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Khoảng thời gian</label>
            <DatePicker
              id="invoice-date-range"
              mode="range"
              defaultDate={fromDate && toDate ? `${fromDate} to ${toDate}` : undefined}
              onChange={(selectedDates: Date[], dateStr: string) => {
                if (dateStr.includes(' to ') || selectedDates.length >= 2) {
                  const parts = dateStr.split(' to ');
                  const from = parts[0];
                  const to = parts[1] || parts[0];
                  if (from) {
                    setFromDate(from);
                    setToDate(to || from);
                    setPage(1);
                  }
                }
              }}
              placeholder="Chọn khoảng thời gian (Từ ngày - Đến ngày)"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2 md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm py-2 px-4 transition-colors font-medium disabled:opacity-50"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg text-sm py-2 px-4 transition-colors font-medium"
            >
              Làm mới bộ lọc
            </button>
          </div>
        </form>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Đang tải danh sách hóa đơn...</p>
          </div>
        ) : !invoicesData || invoicesData.items.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Không tìm thấy hóa đơn nào</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Hãy thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Mã hóa đơn</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Thông tin xuất</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Cửa hàng</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Khách hàng / MST</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Thành tiền</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Trạng thái</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {invoicesData.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors dark:hover:bg-gray-700/50">
                      {/* Invoice Code */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{item.invoiceCode}</span>
                          <button
                            onClick={() => copyToClipboard(item.invoiceCode, 'mã hóa đơn')}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Sao chép mã hóa đơn"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                        {item.lookupCode && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                            <span>Mã tra cứu:</span>
                            <span className="font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1 rounded">{item.lookupCode}</span>
                            <button
                              onClick={() => copyToClipboard(item.lookupCode || '', 'mã tra cứu')}
                              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            >
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Bill Code */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {item.billCode}
                        </div>
                        <div className="text-xs text-gray-400">
                          Mã order POS
                        </div>
                      </td>

                      {/* Store */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.storeName}</div>
                        <div className="text-xs text-gray-500 font-mono dark:text-gray-400">{item.storeCode}</div>
                      </td>

                      {/* Buyer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.buyerName ? (
                          <>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.buyerName}</div>
                            {item.buyerTaxCode && (
                              <div className="text-xs text-gray-500 font-mono dark:text-gray-400">MST: {item.buyerTaxCode}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Khách vãng lai</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalAmountAfterTax)}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">Thuế: {formatCurrency(item.totalTaxAmount)}</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(item.createdDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="bg-gray-50/50 dark:bg-gray-700/30 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Hiển thị trang <span className="text-gray-700 dark:text-white font-bold">{invoicesData.pageNumber}</span> trên <span className="text-gray-700 dark:text-white font-bold">{invoicesData.totalPages}</span> ({invoicesData.totalCount.toLocaleString('vi-VN')} hóa đơn)
              </div>
              <div className="flex items-center gap-3">
                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <span>Mỗi trang:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Page Buttons */}
                <div className="inline-flex rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={!invoicesData.hasPreviousPage}
                    className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-700"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(p + 1, invoicesData.totalPages))}
                    disabled={!invoicesData.hasNextPage}
                    className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 text-xs border-l border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-700"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
