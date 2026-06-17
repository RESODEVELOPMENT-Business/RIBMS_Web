'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getInvoiceBrands, getInvoiceStoresByBrandCode, updateStoreInvoiceSettings, triggerSyncBrandsAndStores, InvoiceBrandDto, InvoiceStoreDto } from '@/services/invoiceApi';

export default function InvoiceStoreManagementPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<InvoiceBrandDto[]>([]);
  const [selectedBrandCode, setSelectedBrandCode] = useState<string>('');
  const [stores, setStores] = useState<InvoiceStoreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStoreId, setSavingStoreId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrandCode) {
      fetchInvoiceStores(selectedBrandCode);
    }
  }, [selectedBrandCode]);

  const fetchBrands = async () => {
    try {
      const res = await getInvoiceBrands();
      const items = res?.data || [];
      setBrands(items);
      if (items.length > 0) {
        setSelectedBrandCode(items[0].code);
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách brand từ hệ thống invoice');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceStores = async (brandCode: string) => {
    setLoading(true);
    try {
      const res = await getInvoiceStoresByBrandCode(brandCode);
      const items = res?.data || [];
      setStores(items);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách store');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExport = async (storeId: string, currentValue: boolean) => {
    setSavingStoreId(storeId);
    try {
      const store = stores.find(s => s.id === storeId);
      await updateStoreInvoiceSettings(storeId, {
        isExportInvoice: !currentValue,
        exportMode: store?.exportMode ?? 1,
      });
      toast.success('Cập nhật trạng thái xuất hóa đơn thành công');
      await fetchInvoiceStores(selectedBrandCode);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setSavingStoreId(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await triggerSyncBrandsAndStores();
      if (res?.data?.success) {
        toast.success(`Đã kích hoạt đồng bộ brands và stores (Job ID: ${res.data.jobId})`);
      } else {
        toast.error('Kích hoạt đồng bộ thất bại');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Kích hoạt đồng bộ thất bại');
    } finally {
      setSyncing(false);
    }
  };

  const handleChangeMode = async (storeId: string, newMode: number) => {
    setSavingStoreId(storeId);
    try {
      const store = stores.find(s => s.id === storeId);
      await updateStoreInvoiceSettings(storeId, {
        isExportInvoice: store?.isExportInvoice ?? true,
        exportMode: newMode,
      });
      toast.success('Cập nhật chế độ xuất hóa đơn thành công');
      await fetchInvoiceStores(selectedBrandCode);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setSavingStoreId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý xuất hóa đơn</h1>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {syncing ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Đang đồng bộ...
            </span>
          ) : (
            'Đồng bộ Brands & Stores'
          )}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chọn Brand
        </label>
        <select
          value={selectedBrandCode}
          onChange={(e) => setSelectedBrandCode(e.target.value)}
          className="w-full md:w-64 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          {brands.map((b) => (
            <option key={b.id} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Danh sách cửa hàng</h2>
          
          {stores.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              Không có cửa hàng nào được sync với hệ thống invoice.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Mã cửa hàng</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Tên</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Organization</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Xuất HĐ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Chế độ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stores.map((s) => {
                    const isSaving = savingStoreId === s.id;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono dark:text-gray-300">{s.code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium dark:text-gray-200">{s.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{s.organizationName || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={s.isExportInvoice}
                              onChange={() => handleToggleExport(s.id, s.isExportInvoice)}
                              disabled={isSaving}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-gray-600 peer-checked:bg-indigo-600"></div>
                          </label>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <select
                            value={s.exportMode}
                            onChange={(e) => handleChangeMode(s.id, Number(e.target.value))}
                            disabled={isSaving || !s.isExportInvoice}
                            className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            <option value={1}>Gộp (Merged)</option>
                            <option value={0}>Từng bill (Individual)</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => router.push(`/stores/${s.id}/invoice-settings`)}
                            className="text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
