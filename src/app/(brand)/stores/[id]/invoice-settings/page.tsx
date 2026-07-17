'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { invoiceApi } from '@/services/invoiceApiClient';
import { updateStoreInvoiceSettings, StoreInvoiceSettings } from '@/services/invoiceApi';
import { useAuthStore } from '@/store/authStore';

export default function StoreInvoiceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = String(params.id);
  const { user } = useAuthStore();

  // Guard: only Administrator can access
  useEffect(() => {
    if (user && user.role !== 'Administrator') {
      router.push('/sales-dashboard');
    }
  }, [user, router]);

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isExportInvoice, setIsExportInvoice] = useState(true);
  const [exportMode, setExportMode] = useState<number>(1);
  const [paymentMethodExportConfig, setPaymentMethodExportConfig] = useState<string>('');
  const [isTimeRestricted, setIsTimeRestricted] = useState(false);
  const [exportTimeFrom, setExportTimeFrom] = useState<string>('06:00');
  const [exportTimeTo, setExportTimeTo] = useState<string>('22:00');

  useEffect(() => {
    if (storeId && user?.role === 'Administrator') {
      fetchStore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, user]);

  const fetchStore = async () => {
    try {
      const res = await invoiceApi.get(`/stores/${storeId}`);
      if (res && res.data) {
        const s = res.data;
        setStore(s);
        setIsExportInvoice(s.isExportInvoice !== false);
        setExportMode(s.exportMode ?? 1);
        setPaymentMethodExportConfig(s.paymentMethodExportConfig ?? '');
        setIsTimeRestricted(s.isTimeRestricted ?? false);
        setExportTimeFrom(s.exportTimeFrom ? s.exportTimeFrom.substring(0, 5) : '06:00');
        setExportTimeTo(s.exportTimeTo ? s.exportTimeTo.substring(0, 5) : '22:00');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thông tin cửa hàng từ hệ thống invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: StoreInvoiceSettings = {
        isExportInvoice: isExportInvoice,
        exportMode: exportMode,
        paymentMethodExportConfig: paymentMethodExportConfig || null,
        isTimeRestricted: isTimeRestricted,
        exportTimeFrom: isTimeRestricted ? exportTimeFrom + ':00' : null,
        exportTimeTo: isTimeRestricted ? exportTimeTo + ':00' : null,
      };
      const res = await updateStoreInvoiceSettings(storeId, payload);
      const status = res?.status ?? res?.data?.status;
      if (status === 200 || status === 204) {
        toast.success('Cập nhật cấu hình xuất hóa đơn thành công');
        await fetchStore();
      } else {
        toast.error(res?.data?.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể cập nhật cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'Administrator') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Truy cập bị từ chối</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Bạn không có quyền truy cập trang này.</p>
          <button
            onClick={() => router.push('/sales-dashboard')}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cấu hình xuất hóa đơn</h1>
        </div>
      </div>

      {loading ? (
        <p className="dark:text-gray-400">Loading...</p>
      ) : store ? (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 space-y-6 text-sm">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-indigo-600"></div>

          <div className="flex items-center justify-between border-b pb-4 mb-4 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{store.name}</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Mã cửa hàng: {store.storeCode || store.code} | ID: {store.storeId || store.id}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Export toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/20 rounded-lg">
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Xuất hóa đơn điện tử</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Bật để cửa hàng tự động xuất hóa đơn điện tử qua VNPay. Tắt nếu cửa hàng không cần xuất hóa đơn.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isExportInvoice}
                  onChange={(e) => setIsExportInvoice(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Export mode */}
            <div className={`p-4 rounded-lg border ${isExportInvoice ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/20 opacity-60'}`}>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Chế độ xuất hóa đơn</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    exportMode === 1
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    value={1}
                    checked={exportMode === 1}
                    onChange={() => setExportMode(1)}
                    disabled={!isExportInvoice}
                    className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Xuất gộp (Merged)</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Gộp nhiều đơn hàng thành 1 hóa đơn (tối đa 10 đơn/batch). Giảm số lượng hóa đơn phát hành.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    exportMode === 0
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportMode"
                    value={0}
                    checked={exportMode === 0}
                    onChange={() => setExportMode(0)}
                    disabled={!isExportInvoice}
                    className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Xuất từng bill (Individual)</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Mỗi đơn hàng tạo 1 hóa đơn riêng biệt. Phù hợp khi khách thường xuyên yêu cầu xuất hóa đơn.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment method filter */}
            <div className={`p-4 rounded-lg border ${isExportInvoice ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/20 opacity-60'}`}>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Phương thức thanh toán được xuất hóa đơn</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Chọn các phương thức thanh toán cần xuất hóa đơn. Bỏ chọn tất cả = xuất tất cả.
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { type: 1, label: 'Tiền mặt' },
                  { type: 2, label: 'Chuyển khoản' },
                  { type: 3, label: 'Grab Food' },
                  { type: 4, label: 'Shopee Food' },
                  { type: 5, label: 'QR Code' },
                ].map(pm => {
                  const selected = paymentMethodExportConfig.split(',').map(Number).includes(pm.type);
                  return (
                    <label
                      key={pm.type}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!isExportInvoice}
                        onChange={() => {
                          const types = paymentMethodExportConfig
                            ? paymentMethodExportConfig.split(',').map(Number)
                            : [];
                          const newTypes = selected
                            ? types.filter(t => t !== pm.type)
                            : [...types, pm.type];
                          setPaymentMethodExportConfig(newTypes.join(','));
                        }}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      {pm.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Time range */}
            <div className={`p-4 rounded-lg border ${isExportInvoice ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/20 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">Giới hạn khung giờ xuất hóa đơn</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Bật để chỉ xuất hóa đơn trong khoảng thời gian nhất định trong ngày.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTimeRestricted}
                    onChange={(e) => setIsTimeRestricted(e.target.checked)}
                    disabled={!isExportInvoice}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              {isTimeRestricted && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Từ</label>
                    <input
                      type="time"
                      value={exportTimeFrom}
                      onChange={(e) => setExportTimeFrom(e.target.value)}
                      disabled={!isExportInvoice}
                      className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Đến</label>
                    <input
                      type="time"
                      value={exportTimeTo}
                      onChange={(e) => setExportTimeTo(e.target.value)}
                      disabled={!isExportInvoice}
                      className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* QR explanation */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Hướng dẫn in QR trên bill</div>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <p>Mặc định, mỗi bill in ra sẽ có QR code dẫn tới link điền thông tin xuất hóa đơn.</p>
                <p>Khách có <strong>4 giờ</strong> để điền thông tin. Sau 4 giờ, hệ thống sẽ tự động xuất hóa đơn theo chế độ đã chọn ở trên.</p>
                <p>Nếu khách chủ động yêu cầu xuất hóa đơn qua QR, hệ thống sẽ xuất ngay lập tức.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-red-500">Store not found</p>
      )}
    </div>
  );
}
