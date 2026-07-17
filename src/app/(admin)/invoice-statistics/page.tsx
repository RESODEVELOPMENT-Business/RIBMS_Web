'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getInvoiceStatistics, InvoiceStatisticsDto } from '@/services/invoiceApi';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function InvoiceStatisticsPage() {
  const [stats, setStats] = useState<InvoiceStatisticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const res = await getInvoiceStatistics(fromDate, toDate);
      setStats(res?.data || null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Tổng tiền đã xuất HĐ', value: stats ? formatCurrency(stats.totalInvoicedAmount) : '-', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Tổng tiền chưa xuất HĐ', value: stats ? formatCurrency(stats.totalUninvoicedAmount) : '-', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Tổng đơn hàng', value: stats?.totalOrders ?? '-', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Tổng HĐ đã tạo', value: stats?.totalInvoices ?? '-', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { label: 'HĐ thành công', value: stats?.successInvoices ?? '-', color: 'bg-green-50 text-green-700 border-green-200' },
    { label: 'HĐ thất bại', value: stats?.failedInvoices ?? '-', color: 'bg-red-50 text-red-700 border-red-200' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Thống kê hệ thống hóa đơn</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Từ</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Đến</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            onClick={fetchStatistics}
            disabled={loading}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className={`rounded-lg border p-4 ${card.color}`}>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {loading && !stats ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* By Brand */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Thống kê theo Brand</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Brand</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Số đơn hàng</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Số HĐ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tổng tiền HĐ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.byBrand.map((b) => (
                    <tr key={b.brandId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">{b.brandName}</td>
                      <td className="px-4 py-3 text-sm text-right dark:text-gray-300">{b.orderCount.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-sm text-right dark:text-gray-300">{b.invoiceCount.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium dark:text-gray-200">{formatCurrency(b.invoicedAmount)}</td>
                    </tr>
                  ))}
                  {stats.byBrand.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Day */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Thống kê theo ngày</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Ngày</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Số đơn</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Số HĐ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tổng tiền HĐ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.byDay.map((d) => (
                    <tr key={d.date} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm dark:text-gray-300">{formatDate(d.date)}</td>
                      <td className="px-4 py-3 text-sm text-right dark:text-gray-300">{d.orderCount.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-sm text-right dark:text-gray-300">{d.invoiceCount.toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium dark:text-gray-200">{formatCurrency(d.invoicedAmount)}</td>
                    </tr>
                  ))}
                  {stats.byDay.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chi tiết theo Store */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Chi tiết theo cửa hàng</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Cửa hàng</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tổng bill</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Doanh số</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Đã xuất</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Chưa xuất</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Đã xuất</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Chưa xuất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.topStores.map((s) => {
                    const isExpanded = expandedStore === s.storeCode;
                    return (
                      <React.Fragment key={s.storeCode}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium dark:text-gray-200">{s.storeName}</div>
                            <div className="text-xs text-gray-500 font-mono">{s.storeCode}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right dark:text-gray-300">{s.totalOrders.toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium dark:text-gray-200">{formatCurrency(s.totalSales)}</td>
                          <td className="px-4 py-3 text-sm text-right text-emerald-600 font-medium">{formatCurrency(s.invoicedAmount)}</td>
                          <td className="px-4 py-3 text-sm text-right text-amber-600 font-medium">{formatCurrency(s.uninvoicedAmount)}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {s.exportedOrderCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {s.unexportedOrderCount > 0 ? (
                              <button
                                onClick={() => setExpandedStore(isExpanded ? null : s.storeCode)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                              >
                                {s.unexportedOrderCount}
                                <svg className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">0</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && s.unexportedOrderCodes && s.unexportedOrderCodes.length > 0 && (
                          <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                            <td colSpan={7} className="px-4 py-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Mã đơn chưa xuất hóa đơn:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {s.unexportedOrderCodes.map((code, i) => (
                                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                    {code}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {stats.topStores.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
