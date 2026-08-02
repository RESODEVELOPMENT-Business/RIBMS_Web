'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/services/apiClient';
import { deleteStore } from '@/services/stores';
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
  const [loading, setLoading] = useState(true);  // ── Active Tab state for View/Edit modes ──
  const [activeTab, setActiveTab] = useState<'general' | 'config' | 'features'>('general');

  // ── Store edit info state ──
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  
  // Basic Information
  const [editName, setEditName] = useState('');
  const [editShortName, setEditShortName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFax, setEditFax] = useState('');
  const [editStoreCode, setEditStoreCode] = useState('');

  // Location
  const [editLat, setEditLat] = useState('');
  const [editLon, setEditLon] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editWard, setEditWard] = useState('');

  // Status & Operating Configuration
  const [editIsAvailable, setEditIsAvailable] = useState(true);
  const [editActive, setEditActive] = useState(true);
  const [editType, setEditType] = useState(1);
  const [editGroupId, setEditGroupId] = useState<number | ''>('');
  const [editRoomRentMode, setEditRoomRentMode] = useState<number | ''>('');
  const [editOpenTime, setEditOpenTime] = useState('');
  const [editCloseTime, setEditCloseTime] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editDefaultAdminPassword, setEditDefaultAdminPassword] = useState('');
  const [editPosId, setEditPosId] = useState<number | ''>('');
  const [editStoreConfig, setEditStoreConfig] = useState('');
  const [editDefaultDashBoard, setEditDefaultDashBoard] = useState('');
  const [editPaymentTypeApply, setEditPaymentTypeApply] = useState<number | ''>('');
  const [editModeStore, setEditModeStore] = useState<number | ''>('');
  const [editAttendanceStoreFilter, setEditAttendanceStoreFilter] = useState<number | ''>('');
  const [editStoreFeatureFilter, setEditStoreFeatureFilter] = useState('');

  // Feature Flags
  const [editHasProducts, setEditHasProducts] = useState(true);
  const [editHasNews, setEditHasNews] = useState(true);
  const [editHasImageCollections, setEditHasImageCollections] = useState(true);
  const [editHasMultipleLanguage, setEditHasMultipleLanguage] = useState(false);
  const [editHasWebPages, setEditHasWebPages] = useState(true);
  const [editHasCustomerFeedbacks, setEditHasCustomerFeedbacks] = useState(true);
  const [editHasOrder, setEditHasOrder] = useState(true);
  const [editHasBlogEditCollections, setEditHasBlogEditCollections] = useState(false);
  const [editRunReport, setEditRunReport] = useState(true);

  const [infoSaving, setInfoSaving] = useState(false);

  // ── Cost state ──
  const [costs, setCosts] = useState<Cost[]>([]);
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [costsLoading, setCostsLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [costPage, setCostPage] = useState(1);
  const [costTotalPages, setCostTotalPages] = useState(1);
  const [costTotalItems, setCostTotalItems] = useState(0);
  const costSize = 20;

  // form state for a new cost
  const [newCatId, setNewCatId] = useState<number | ''>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');

  const startEditInfo = () => {
    if (!store) return;
    setEditName(store.name || '');
    setEditShortName(store.shortName || '');
    setEditAddress(store.address || '');
    setEditPhone(store.phone || '');
    setEditEmail(store.email || '');
    setEditFax(store.fax || '');
    setEditStoreCode(store.storeCode || '');

    setEditLat(store.lat || '');
    setEditLon(store.lon || '');
    setEditProvince(store.province || '');
    setEditDistrict(store.district || '');
    setEditWard(store.ward || '');

    setEditIsAvailable(store.isAvailable !== false);
    setEditActive(store.active !== false);
    setEditType(store.type ?? 1);
    setEditGroupId(store.groupId ?? '');
    setEditRoomRentMode(store.roomRentMode ?? '');
    
    // Format OpenTime & CloseTime if they are datetime strings
    setEditOpenTime(store.openTime ? store.openTime.split('T')[1]?.substring(0, 5) || store.openTime : '');
    setEditCloseTime(store.closeTime ? store.closeTime.split('T')[1]?.substring(0, 5) || store.closeTime : '');
    
    setEditLogoUrl(store.logoUrl || '');
    setEditDefaultAdminPassword(store.defaultAdminPassword || '');
    setEditPosId(store.posId ?? '');
    setEditStoreConfig(store.storeConfig || '');
    setEditDefaultDashBoard(store.defaultDashBoard || '');
    setEditPaymentTypeApply(store.paymentTypeApply ?? '');
    setEditModeStore(store.modeStore ?? '');
    setEditAttendanceStoreFilter(store.attendanceStoreFilter ?? '');
    setEditStoreFeatureFilter(store.storeFeatureFilter || '');

    setEditHasProducts(store.hasProducts !== false);
    setEditHasNews(store.hasNews !== false);
    setEditHasImageCollections(store.hasImageCollections !== false);
    setEditHasMultipleLanguage(!!store.hasMultipleLanguage);
    setEditHasWebPages(store.hasWebPages !== false);
    setEditHasCustomerFeedbacks(store.hasCustomerFeedbacks !== false);
    setEditHasOrder(store.hasOrder !== false);
    setEditHasBlogEditCollections(!!store.hasBlogEditCollections);
    setEditRunReport(store.runReport !== false);

    setIsEditingInfo(true);
  };

  const handleSaveInfo = async () => {
    if (!editName.trim()) {
      toast.error('Tên cửa hàng không được để trống');
      return;
    }
    if (!editAddress.trim()) {
      toast.error('Địa chỉ không được để trống');
      return;
    }
    setInfoSaving(true);

    let openTimeVal: string | null = null;
    if (editOpenTime) {
      openTimeVal = editOpenTime.includes('T') ? editOpenTime : `1970-01-01T${editOpenTime}:00`;
    }

    let closeTimeVal: string | null = null;
    if (editCloseTime) {
      closeTimeVal = editCloseTime.includes('T') ? editCloseTime : `1970-01-01T${editCloseTime}:00`;
    }

    try {
      const payload = {
        name: editName,
        shortName: editShortName || null,
        address: editAddress,
        phone: editPhone || null,
        email: editEmail || null,
        fax: editFax || null,
        storeCode: editStoreCode || null,
        lat: editLat || null,
        lon: editLon || null,
        province: editProvince || null,
        district: editDistrict || null,
        ward: editWard || null,
        isAvailable: editIsAvailable,
        active: editActive,
        type: editType,
        groupId: editGroupId === '' ? null : Number(editGroupId),
        roomRentMode: editRoomRentMode === '' ? null : Number(editRoomRentMode),
        openTime: openTimeVal,
        closeTime: closeTimeVal,
        hasProducts: editHasProducts,
        hasNews: editHasNews,
        hasImageCollections: editHasImageCollections,
        hasMultipleLanguage: editHasMultipleLanguage,
        hasWebPages: editHasWebPages,
        hasCustomerFeedbacks: editHasCustomerFeedbacks,
        hasOrder: editHasOrder,
        hasBlogEditCollections: editHasBlogEditCollections,
        defaultAdminPassword: editDefaultAdminPassword || null,
        logoUrl: editLogoUrl || null,
        posId: editPosId === '' ? null : Number(editPosId),
        storeConfig: editStoreConfig || null,
        defaultDashBoard: editDefaultDashBoard || null,
        paymentTypeApply: editPaymentTypeApply === '' ? null : Number(editPaymentTypeApply),
        modeStore: editModeStore === '' ? null : Number(editModeStore),
        runReport: editRunReport,
        attendanceStoreFilter: editAttendanceStoreFilter === '' ? null : Number(editAttendanceStoreFilter),
        storeFeatureFilter: editStoreFeatureFilter || null
      };

      const res = await api.put(`/stores/${storeId}`, payload);
      
      const status = res?.status ?? res?.data?.status;
      if (status === 200) {
        toast.success('Cập nhật thông tin cửa hàng thành công');
        setIsEditingInfo(false);
        await fetchData();
      } else {
        toast.error(res?.data?.message || 'Có lỗi xảy ra khi cập nhật');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Không thể cập nhật thông tin');
    } finally {
      setInfoSaving(false);
    }
  };
  useEffect(() => {
    if (storeId) {
      fetchData();
      fetchCostData(costPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, costPage]);

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

  const fetchCostData = async (page = costPage) => {
    setCostsLoading(true);
    try {
      const [costRes, catRes] = await Promise.all([
        getCostsByStore(storeId, page, costSize),
        getCostCategories(),
      ]);
      const payload = costRes?.data ?? costRes;
      setCosts(unwrapItems<Cost>(costRes));
      setCostTotalPages(payload?.totalPages ?? payload?.totalPages ?? 1);
      setCostTotalItems(payload?.total ?? payload?.total ?? costs.length);
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

  const handleStoreDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa cửa hàng này? Hành động này sẽ vô hiệu hóa cửa hàng.')) return;
    try {
      const storeId = store?.storeId || store?.id || params?.id;
      if (!storeId) { toast.error('Không tìm thấy ID cửa hàng'); return; }
      await deleteStore(storeId);
      toast.success('Đã xóa cửa hàng');
      router.push('/stores');
    } catch (err: any) {
      toast.error(err?.message || 'Xóa cửa hàng thất bại');
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Store Detail</h1>
        </div>
        {store && !isEditingInfo && (
          <div className="flex items-center gap-3">
            <button
              onClick={startEditInfo}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Chỉnh sửa thông tin
            </button>
            <button
              onClick={handleStoreDelete}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow hover:shadow-md"
            >
              Xóa cửa hàng
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="dark:text-gray-400">Loading...</p>
      ) : store ? (
        isEditingInfo ? (
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 space-y-4 text-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-indigo-600"></div>
            
            <div className="flex items-center justify-between border-b pb-2 mb-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Chỉnh sửa thông tin cửa hàng</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">ID: {store.storeId || store.id}</div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b dark:border-gray-700 mb-6 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`pb-2.5 px-4 font-semibold text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'general'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Thông tin chung & Vị trí
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`pb-2.5 px-4 font-semibold text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'config'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Vận hành & Cấu hình
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={`pb-2.5 px-4 font-semibold text-sm transition-all duration-200 border-b-2 ${
                  activeTab === 'features'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Tính năng & Báo cáo
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider mb-2">Thông tin liên hệ</h4>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tên cửa hàng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    placeholder="Tên cửa hàng"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tên viết tắt</label>
                  <input
                    type="text"
                    value={editShortName}
                    onChange={(e) => setEditShortName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mã cửa hàng (Store Code)</label>
                  <input
                    type="text"
                    value={editStoreCode}
                    onChange={(e) => setEditStoreCode(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Fax</label>
                  <input
                    type="text"
                    value={editFax}
                    onChange={(e) => setEditFax(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Địa chỉ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider mb-2">Vị trí địa lý</h4>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    value={editProvince}
                    onChange={(e) => setEditProvince(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Quận / Huyện</label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Phường / Xã</label>
                  <input
                    type="text"
                    value={editWard}
                    onChange={(e) => setEditWard(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Vĩ độ (Lat)</label>
                    <input
                      type="text"
                      value={editLat}
                      onChange={(e) => setEditLat(e.target.value)}
                      placeholder="Latitude"
                      className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Kinh độ (Lon)</label>
                    <input
                      type="text"
                      value={editLon}
                      onChange={(e) => setEditLon(e.target.value)}
                      placeholder="Longitude"
                      className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider mb-2">Thông số vận hành</h4>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Loại cửa hàng (Type)</label>
                  <input
                    type="number"
                    value={editType}
                    onChange={(e) => setEditType(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mã nhóm (Group ID)</label>
                  <input
                    type="number"
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">POS ID</label>
                  <input
                    type="number"
                    value={editPosId}
                    onChange={(e) => setEditPosId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Chế độ thuê phòng (Room Rent Mode)</label>
                  <input
                    type="number"
                    value={editRoomRentMode}
                    onChange={(e) => setEditRoomRentMode(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Giờ mở cửa (Open Time)</label>
                  <input
                    type="time"
                    value={editOpenTime}
                    onChange={(e) => setEditOpenTime(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Giờ đóng cửa (Close Time)</label>
                  <input
                    type="time"
                    value={editCloseTime}
                    onChange={(e) => setEditCloseTime(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider mb-2">Cấu hình & Giao diện</h4>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={editLogoUrl}
                    onChange={(e) => setEditLogoUrl(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mật khẩu Admin mặc định</label>
                  <input
                    type="text"
                    value={editDefaultAdminPassword}
                    onChange={(e) => setEditDefaultAdminPassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Dashboard mặc định</label>
                  <input
                    type="text"
                    value={editDefaultDashBoard}
                    onChange={(e) => setEditDefaultDashBoard(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Áp dụng thanh toán (Payment Type Apply)</label>
                  <input
                    type="number"
                    value={editPaymentTypeApply}
                    onChange={(e) => setEditPaymentTypeApply(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Chế độ cửa hàng (Mode Store)</label>
                  <input
                    type="number"
                    value={editModeStore}
                    onChange={(e) => setEditModeStore(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Lọc điểm danh (Attendance Filter)</label>
                  <input
                    type="number"
                    value={editAttendanceStoreFilter}
                    onChange={(e) => setEditAttendanceStoreFilter(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Cấu hình cửa hàng (JSON Config)</label>
                  <textarea
                    rows={2}
                    value={editStoreConfig}
                    onChange={(e) => setEditStoreConfig(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all font-mono text-xs"
                    placeholder="{}"
                  />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider mb-2">Trạng thái</h4>
                </div>
                <div className="flex gap-6 items-center">
                  <label className="flex items-center gap-2 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsAvailable}
                      onChange={(e) => setEditIsAvailable(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Có sẵn (Is Available)</span>
                  </label>
                  <label className="flex items-center gap-2 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Kích hoạt hoạt động (Active)</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider mb-3">Tính năng cửa hàng</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg">
                    <label className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={editHasProducts}
                        onChange={(e) => setEditHasProducts(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Products</div>
                        <div className="text-xs text-gray-400">Hiển thị và kinh doanh sản phẩm</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={editHasNews}
                        onChange={(e) => setEditHasNews(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Has News</div>
                        <div className="text-xs text-gray-400">Kênh tin tức, thông báo</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={editHasImageCollections}
                        onChange={(e) => setEditHasImageCollections(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Image Collections</div>
                        <div className="text-xs text-gray-400">Album ảnh & bộ sưu tập ảnh</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={editHasMultipleLanguage}
                        onChange={(e) => setEditHasMultipleLanguage(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Multiple Language</div>
                        <div className="text-xs text-gray-400">Hỗ trợ đa ngôn ngữ</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={editHasWebPages}
                        onChange={(e) => setEditHasWebPages(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Web Pages</div>
                        <div className="text-xs text-gray-400">Hệ thống trang web tĩnh</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={editHasCustomerFeedbacks}
                        onChange={(e) => setEditHasCustomerFeedbacks(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Customer Feedbacks</div>
                        <div className="text-xs text-gray-400">Nhận đánh giá & phản hồi từ khách hàng</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={editHasOrder}
                        onChange={(e) => setEditHasOrder(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Order</div>
                        <div className="text-xs text-gray-400">Cho phép đặt hàng trực tuyến</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 select-none cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={editHasBlogEditCollections}
                        onChange={(e) => setEditHasBlogEditCollections(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Blog Edit Collections</div>
                        <div className="text-xs text-gray-400">Cho phép quản lý bài viết blog</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border-t dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider mb-3">Báo cáo & Bộ lọc</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 select-none cursor-pointer p-2 bg-gray-50 dark:bg-gray-700/20 rounded-lg">
                      <input
                        type="checkbox"
                        checked={editRunReport}
                        onChange={(e) => setEditRunReport(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Run Report</div>
                        <div className="text-xs text-gray-400">Tự động chạy báo cáo định kỳ</div>
                      </div>
                    </label>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Lọc tính năng cửa hàng (Feature Filter)</label>
                      <input
                        type="text"
                        value={editStoreFeatureFilter}
                        onChange={(e) => setEditStoreFeatureFilter(e.target.value)}
                        placeholder="VD: filter_product, filter_payment"
                        className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-6">
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                disabled={infoSaving}
                className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveInfo}
                disabled={infoSaving}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {infoSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 space-y-4 text-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            {/* Header info in View Mode */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b dark:border-gray-700 mb-4 gap-3">
              <div className="flex items-center gap-3">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt="Store Logo" className="h-10 w-10 rounded-full object-cover border dark:border-gray-600" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                    {store.name?.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-white leading-tight">{store.name}</h3>
                  <div className="text-xs text-gray-400">ID: {store.storeId || store.id} | Brand ID: {store.brandId}</div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${store.isAvailable !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {store.isAvailable !== false ? 'Available' : 'Unavailable'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${store.active ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/35 dark:text-indigo-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/35 dark:text-rose-300'}`}>
                  {store.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Tab Navigation in View Mode */}
            <div className="flex border-b dark:border-gray-700 mb-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`pb-2 px-4 font-semibold text-xs transition-all duration-200 border-b-2 ${
                  activeTab === 'general'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                Thông tin & Vị trí
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`pb-2 px-4 font-semibold text-xs transition-all duration-200 border-b-2 ${
                  activeTab === 'config'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                Cấu hình vận hành
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={`pb-2 px-4 font-semibold text-xs transition-all duration-200 border-b-2 ${
                  activeTab === 'features'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                Tính năng & Báo cáo
              </button>
            </div>

            {/* Tab Contents in View Mode */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Store Name:</span> <span className="ml-2 dark:text-white font-semibold">{store.name}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Short Name:</span> <span className="ml-2 dark:text-white">{store.shortName || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Store Code:</span> <span className="ml-2 dark:text-white font-mono">{store.storeCode || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Email:</span> <span className="ml-2 dark:text-white">{store.email || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Phone:</span> <span className="ml-2 dark:text-white">{store.phone || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Fax:</span> <span className="ml-2 dark:text-white">{store.fax || 'N/A'}</span></p>
                <p className="md:col-span-2"><span className="text-gray-500 dark:text-gray-400 font-medium">Address:</span> <span className="ml-2 dark:text-white">{store.address || 'N/A'}</span></p>
                
                <div className="md:col-span-2 border-t dark:border-gray-700/50 pt-2 mt-2">
                  <h4 className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-2">Vị trí địa lý</h4>
                </div>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Province:</span> <span className="ml-2 dark:text-white">{store.province || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">District:</span> <span className="ml-2 dark:text-white">{store.district || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Ward:</span> <span className="ml-2 dark:text-white">{store.ward || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">GPS Lat/Lon:</span> <span className="ml-2 dark:text-white font-mono">{store.lat && store.lon ? `${store.lat}, ${store.lon}` : 'N/A'}</span></p>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Type:</span> <span className="ml-2 dark:text-white">{store.type}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Group ID:</span> <span className="ml-2 dark:text-white">{store.groupId || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">POS ID:</span> <span className="ml-2 dark:text-white">{store.posId || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Room Rent Mode:</span> <span className="ml-2 dark:text-white">{store.roomRentMode || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Operating Hours:</span> <span className="ml-2 dark:text-white font-mono">{store.openTime ? store.openTime.split('T')[1]?.substring(0, 5) || store.openTime : '--:--'} - {store.closeTime ? store.closeTime.split('T')[1]?.substring(0, 5) || store.closeTime : '--:--'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Default Password:</span> <span className="ml-2 dark:text-white font-mono">{store.defaultAdminPassword || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Dashboard:</span> <span className="ml-2 dark:text-white">{store.defaultDashBoard || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Payment Type Apply:</span> <span className="ml-2 dark:text-white">{store.paymentTypeApply || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Mode Store:</span> <span className="ml-2 dark:text-white">{store.modeStore || 'N/A'}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400 font-medium">Attendance Filter:</span> <span className="ml-2 dark:text-white">{store.attendanceStoreFilter || 'N/A'}</span></p>
                <p className="md:col-span-2"><span className="text-gray-500 dark:text-gray-400 font-medium">Logo URL:</span> <span className="ml-2 dark:text-white font-mono break-all text-xs">{store.logoUrl || 'N/A'}</span></p>
                <div className="md:col-span-2 mt-2">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Store Config:</span>
                  <pre className="mt-1 p-2 bg-gray-50 dark:bg-gray-700/30 rounded border dark:border-gray-700 text-xs font-mono overflow-x-auto text-gray-700 dark:text-gray-300">{store.storeConfig || '{}'}</pre>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-3">Tính năng kích hoạt</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Has Products', val: store.hasProducts },
                      { label: 'Has News', val: store.hasNews },
                      { label: 'Has Image Collections', val: store.hasImageCollections },
                      { label: 'Has Multiple Language', val: store.hasMultipleLanguage },
                      { label: 'Has Web Pages', val: store.hasWebPages },
                      { label: 'Has Customer Feedbacks', val: store.hasCustomerFeedbacks },
                      { label: 'Has Order', val: store.hasOrder },
                      { label: 'Has Blog Edit Collections', val: store.hasBlogEditCollections },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center gap-2 p-2 rounded border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/25">
                        <span className={`h-2.5 w-2.5 rounded-full ${f.val !== false ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t dark:border-gray-700/50 pt-3 mt-3">
                  <h4 className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-2">Báo cáo & Bộ lọc</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 rounded border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/25">
                      <span className={`h-2.5 w-2.5 rounded-full ${store.runReport !== false ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Run Report</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Feature Filter:</span>
                      <span className="ml-2 dark:text-white font-mono text-xs">{store.storeFeatureFilter || 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
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
                  {costTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-2 border-t dark:border-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Tổng số: <b>{costTotalItems}</b> khoản chi phí
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCostPage(p => Math.max(1, p - 1))}
                          disabled={costPage <= 1}
                          className="px-3 py-1 text-xs border rounded-md disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
                        >
                          Trang trước
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Trang <b>{costPage}</b> / <b>{costTotalPages}</b>
                        </span>
                        <button
                          onClick={() => setCostPage(p => Math.min(costTotalPages, p + 1))}
                          disabled={costPage >= costTotalPages}
                          className="px-3 py-1 text-xs border rounded-md disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
                        >
                          Trang sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
