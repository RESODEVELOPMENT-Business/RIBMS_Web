'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/services/apiClient';
import {
  Cost,
  CostCategory,
  getCostsByStore,
  getCostCategories,
  createCost,
  updateCost,
  deleteCost,
  createCostCategory,
  DEFAULT_COST_CATEGORIES,
} from '@/services/costs';

const formatVND = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const unwrapItems = <T,>(payload: any): T[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.Items)) {
    return data.Items;
  }

  return [];
};

export default function StoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storeId = Number(params.id);

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ── Cost state ──
  const [costs, setCosts] = useState<Cost[]>([]);
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [costsLoading, setCostsLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // form state for a new cost
  const [newCatId, setNewCatId] = useState<number | ''>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');

  useEffect(() => {
    if (storeId) {
      fetchData();
      fetchCostData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/stores/${storeId}`);
      if (res && res.data) {
        setStore(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCostData = async () => {
    setCostsLoading(true);
    try {
      const [costRes, catRes] = await Promise.all([
        getCostsByStore(storeId),
        getCostCategories(),
      ]);
      setCosts(unwrapItems<Cost>(costRes));
      setCategories(unwrapItems<CostCategory>(catRes));
    } catch (err) {
      console.error('Failed to load costs:', err);
    } finally {
      setCostsLoading(false);
    }
  };

  const catTypeLabel = (type: number | null | undefined) =>
    type === 1 ? '% doanh thu' : 'VND';

  const handleSeedDefaults = async () => {
    if (categories.length > 0) {
      toast.info('Đã có danh mục chi phí, không cần khởi tạo lại');
      return;
    }
    setSeeding(true);
    try {
      for (const c of DEFAULT_COST_CATEGORIES) {
        await createCostCategory(c);
      }
      toast.success('Đã khởi tạo danh mục chi phí mặc định');
      await fetchCostData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể khởi tạo danh mục');
    } finally {
      setSeeding(false);
    }
  };

  const handleAddCost = async () => {
    if (!newCatId) {
      toast.error('Vui lòng chọn danh mục chi phí');
      return;
    }
    const amount = Number(newAmount);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    setSaving(true);
    try {
      await createCost({
        storeId,
        catId: Number(newCatId),
        amount,
        costDescription: newDesc || undefined,
      });
      toast.success('Đã thêm chi phí');
      setNewCatId('');
      setNewAmount('');
      setNewDesc('');
      await fetchCostData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể thêm chi phí');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cost: Cost) => {
    setEditingId(cost.costId);
    setEditAmount(String(cost.amount));
    setEditDesc(cost.costDescription || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setEditDesc('');
  };

  const handleSaveEdit = async (id: number) => {
    const amount = Number(editAmount);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    try {
      await updateCost(id, { amount, costDescription: editDesc });
      toast.success('Đã cập nhật chi phí');
      cancelEdit();
      await fetchCostData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể cập nhật');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa khoản chi phí này?')) return;
    try {
      await deleteCost(id);
      toast.success('Đã xóa chi phí');
      await fetchCostData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể xóa');
    }
  };

  const selectedCat = Array.isArray(categories) 
  ? categories.find((c) => c.catId === Number(newCatId)) 
  : undefined;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Store Detail</h1>
      </div>

      {loading ? (
        <p className="dark:text-gray-400">Loading...</p>
      ) : store ? (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 space-y-4 text-sm">
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Store ID:</span> <span className="ml-2 dark:text-white">{store.storeId || store.id}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Brand ID:</span> <span className="ml-2 dark:text-white">{store.brandId}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Store Name:</span> <span className="ml-2 dark:text-white">{store.name}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Short Name:</span> <span className="ml-2 dark:text-white">{store.shortName || 'N/A'}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Address:</span> <span className="ml-2 dark:text-white">{store.address || 'N/A'}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Phone:</span> <span className="ml-2 dark:text-white">{store.phone || 'N/A'}</span></p>
          <p><span className="text-gray-500 dark:text-gray-400 font-medium">Status:</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${store.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {store.active ? 'Active' : 'Inactive'}
            </span>
          </p>
        </div>
      ) : (
        <p className="text-red-500">Store not found</p>
      )}

      {/* ── Chi phí hàng tháng ── */}
      {store && (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Chi phí hàng tháng</h2>
            {categories.length === 0 && (
              <button
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="px-3 py-1.5 text-xs rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {seeding ? 'Đang khởi tạo...' : 'Khởi tạo danh mục mặc định'}
              </button>
            )}
          </div>

          {costsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải chi phí...</p>
          ) : (
            <>
              {/* Form thêm chi phí */}
              {categories.length > 0 && (
                <div className="flex flex-col md:flex-row gap-2 mb-4 items-stretch md:items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Danh mục</label>
                    <select
                      value={newCatId}
                      onChange={(e) => setNewCatId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.catId} value={c.catId}>
                          {c.catName} ({catTypeLabel(c.type)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-40">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {selectedCat?.type === 1 ? 'Giá trị (%)' : 'Số tiền (VND)'}
                    </label>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder={selectedCat?.type === 1 ? 'vd 30' : 'vd 18000000'}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ghi chú</label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={handleAddCost}
                    disabled={saving}
                    className="px-4 py-1.5 text-sm rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 whitespace-nowrap"
                  >
                    {saving ? 'Đang lưu...' : 'Thêm'}
                  </button>
                </div>
              )}

              {/* Bảng chi phí */}
              {costs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {categories.length === 0
                    ? 'Chưa có danh mục chi phí. Nhấn "Khởi tạo danh mục mặc định" để bắt đầu.'
                    : 'Chưa có khoản chi phí nào cho cửa hàng này.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                        <th className="py-2 pr-2">Danh mục</th>
                        <th className="py-2 pr-2">Loại</th>
                        <th className="py-2 pr-2 text-right">Giá trị</th>
                        <th className="py-2 pr-2">Ghi chú</th>
                        <th className="py-2 pr-2 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costs.map((cost) => {
                        const isPercent = cost.catType === 1;
                        const isEditing = editingId === cost.costId;
                        return (
                          <tr key={cost.costId} className="border-b dark:border-gray-700 text-gray-800 dark:text-gray-100">
                            <td className="py-2 pr-2">{cost.catName}</td>
                            <td className="py-2 pr-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${isPercent ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                {catTypeLabel(cost.catType)}
                              </span>
                            </td>
                            <td className="py-2 pr-2 text-right">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  className="w-28 border rounded px-1.5 py-1 text-sm text-right dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              ) : isPercent ? (
                                `${cost.amount}%`
                              ) : (
                                formatVND(cost.amount)
                              )}
                            </td>
                            <td className="py-2 pr-2">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  className="w-full border rounded px-1.5 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              ) : (
                                cost.costDescription || ''
                              )}
                            </td>
                            <td className="py-2 pr-2 text-right whitespace-nowrap">
                              {isEditing ? (
                                <>
                                  <button onClick={() => handleSaveEdit(cost.costId)} className="text-green-600 hover:underline mr-2">Lưu</button>
                                  <button onClick={cancelEdit} className="text-gray-500 hover:underline">Hủy</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(cost)} className="text-brand-500 hover:underline mr-2">Sửa</button>
                                  <button onClick={() => handleDelete(cost.costId)} className="text-red-500 hover:underline">Xóa</button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
