'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/modal';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { useAuthStore } from '@/store/authStore';
import {
  BrandLoyaltyPointReward,
  BrandLoyaltyPointRewardPayload,
  createPointReward,
  deletePointReward,
  getPointRewards,
  updatePointReward,
} from '@/services/pointRewards';
import {
  CheckLineIcon,
  CloseLineIcon,
  DollarLineIcon,
  GridIcon,
  PencilIcon,
  PlusIcon,
  ShootingStarIcon,
  TableIcon,
  TrashBinIcon,
  BoxCubeIcon,
  TaskIcon,
} from '@/icons';

type RewardFormState = {
  name: string;
  description: string;
  costInPoints: string;
  rewardType: number; // 1 = Percentage, 2 = Amount
  discountAmount: string;
  discountRate: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  validityDays: string;
  sortOrder: string;
  active: boolean;
};

const emptyForm: RewardFormState = {
  name: '',
  description: '',
  costInPoints: '10',
  rewardType: 2, // Amount by default
  discountAmount: '10000',
  discountRate: '10',
  maxDiscountAmount: '50000',
  minOrderAmount: '0',
  validityDays: '30',
  sortOrder: '0',
  active: true,
};

const formatVND = (value?: number | string | null) => {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '0 ₫';
  return `${new Intl.NumberFormat('vi-VN').format(num)} ₫`;
};

export default function PointRewardsPage() {
  const { user } = useAuthStore();
  const brandId = user?.brandId ? Number(user.brandId) : undefined;

  const [rewards, setRewards] = useState<BrandLoyaltyPointReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<BrandLoyaltyPointReward | null>(null);
  const [formState, setFormState] = useState<RewardFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPointRewards(brandId);
      if (response?.data) {
        setRewards(response.data);
      }
    } catch (error: any) {
      toast.error('Lỗi khi tải danh sách gói đổi điểm', {
        description: error?.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleOpenCreate = () => {
    setEditingReward(null);
    setFormState({
      ...emptyForm,
      sortOrder: String(rewards.length),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (reward: BrandLoyaltyPointReward) => {
    setEditingReward(reward);
    setFormState({
      name: reward.name,
      description: reward.description || '',
      costInPoints: String(reward.costInPoints),
      rewardType: reward.rewardType || 2,
      discountAmount: String(reward.discountAmount || 0),
      discountRate: String(reward.discountRate || 0),
      maxDiscountAmount: String(reward.maxDiscountAmount || 0),
      minOrderAmount: String(reward.minOrderAmount || 0),
      validityDays: String(reward.validityDays || 30),
      sortOrder: String(reward.sortOrder || 0),
      active: reward.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      toast.error('Tên phần thưởng không được để trống');
      return;
    }

    const cost = Number(formState.costInPoints);
    if (Number.isNaN(cost) || cost <= 0) {
      toast.error('Số điểm đổi phải lớn hơn 0');
      return;
    }

    const payload: BrandLoyaltyPointRewardPayload = {
      brandId,
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      costInPoints: cost,
      rewardType: Number(formState.rewardType),
      discountAmount: formState.rewardType === 2 ? Number(formState.discountAmount || 0) : undefined,
      discountRate: formState.rewardType === 1 ? Number(formState.discountRate || 0) : undefined,
      maxDiscountAmount: formState.rewardType === 1 && formState.maxDiscountAmount ? Number(formState.maxDiscountAmount) : undefined,
      minOrderAmount: Number(formState.minOrderAmount || 0),
      validityDays: Number(formState.validityDays || 30),
      sortOrder: Number(formState.sortOrder || 0),
      active: formState.active,
    };

    try {
      setSubmitting(true);
      if (editingReward) {
        await updatePointReward(editingReward.id, payload);
        toast.success('Cập nhật gói đổi thưởng thành công!');
      } else {
        await createPointReward(payload);
        toast.success('Tạo gói đổi thưởng mới thành công!');
      }
      setIsModalOpen(false);
      fetchRewards();
    } catch (error: any) {
      toast.error('Thao tác thất bại', {
        description: error?.message || 'Vui lòng kiểm tra lại thông tin',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (reward: BrandLoyaltyPointReward) => {
    try {
      setBusyId(reward.id);
      const payload: BrandLoyaltyPointRewardPayload = {
        brandId: reward.brandId,
        name: reward.name,
        description: reward.description,
        costInPoints: reward.costInPoints,
        rewardType: reward.rewardType,
        discountAmount: reward.discountAmount,
        discountRate: reward.discountRate,
        maxDiscountAmount: reward.maxDiscountAmount,
        minOrderAmount: reward.minOrderAmount,
        validityDays: reward.validityDays,
        sortOrder: reward.sortOrder,
        active: !reward.active,
      };
      await updatePointReward(reward.id, payload);
      toast.success(reward.active ? 'Đã tạm dừng gói đổi thưởng' : 'Đã kích hoạt gói đổi thưởng');
      fetchRewards();
    } catch (error: any) {
      toast.error('Lỗi khi đổi trạng thái', {
        description: error?.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (reward: BrandLoyaltyPointReward) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa gói đổi thưởng "${reward.name}" không?`)) {
      return;
    }
    try {
      setBusyId(reward.id);
      await deletePointReward(reward.id);
      toast.success('Xóa gói đổi thưởng thành công');
      fetchRewards();
    } catch (error: any) {
      toast.error('Lỗi khi xóa gói đổi thưởng', {
        description: error?.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setBusyId(null);
    }
  };

  // Stats Summary
  const stats = useMemo(() => {
    const activeCount = rewards.filter((r) => r.active).length;
    const costs = rewards.map((r) => r.costInPoints);
    const minCost = costs.length > 0 ? Math.min(...costs) : 0;
    const maxCost = costs.length > 0 ? Math.max(...costs) : 0;
    return {
      total: rewards.length,
      active: activeCount,
      minCost,
      maxCost,
    };
  }, [rewards]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShootingStarIcon className="w-6 h-6 text-amber-500" />
            Đổi Thưởng Bằng Điểm (Point Rewards)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý các gói voucher và quà tặng khách hàng có thể dùng điểm tích lũy để đổi trên ứng dụng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <GridIcon className="w-4 h-4" />
              Thẻ
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              Bảng
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm gói đổi thưởng
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BoxCubeIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng số gói đổi điểm</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckLineIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Đang hoạt động</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShootingStarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Mức điểm yêu cầu</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.total > 0 ? `${stats.minCost} - ${stats.maxCost} ⭐` : '0 ⭐'}
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Content */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <SkeletonTable rows={4} columns={6} />
        </div>
      ) : rewards.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-100 dark:border-gray-700 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center mx-auto">
            <ShootingStarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chưa có gói đổi thưởng nào</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Hãy tạo các gói đổi điểm để khách hàng có thể dùng điểm tích lũy đổi lấy voucher ưu đãi hấp dẫn.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
          >
            <PlusIcon className="w-4 h-4" />
            Tạo gói đổi thưởng đầu tiên
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl border ${
                reward.active
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-dashed border-gray-300 dark:border-gray-600 opacity-75'
              } p-6 shadow-sm flex flex-col justify-between transition hover:shadow-md relative overflow-hidden`}
            >
              <div className="space-y-4">
                {/* Top Row: Cost Badge & Active status */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold text-sm">
                    <ShootingStarIcon className="w-4 h-4 text-amber-500" />
                    {reward.costInPoints} Điểm
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      reward.active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {reward.active ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đang chạy
                      </>
                    ) : (
                      'Tạm dừng'
                    )}
                  </span>
                </div>

                {/* Reward Name & Description */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{reward.name}</h3>
                  {reward.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{reward.description}</p>
                  )}
                </div>

                {/* Benefit Details Box */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Mức giảm:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {reward.rewardType === 1
                        ? `Giảm ${reward.discountRate}% ${reward.maxDiscountAmount ? `(Tối đa ${formatVND(reward.maxDiscountAmount)})` : ''}`
                        : `Giảm ${formatVND(reward.discountAmount)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Đơn tối thiểu:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {reward.minOrderAmount > 0 ? formatVND(reward.minOrderAmount) : 'Không giới hạn'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Hạn sử dụng:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{reward.validityDays} ngày</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                <button
                  disabled={busyId === reward.id}
                  onClick={() => handleToggleActive(reward)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    reward.active
                      ? 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                  }`}
                >
                  {reward.active ? 'Tạm dừng' : 'Kích hoạt'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(reward)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                    title="Chỉnh sửa"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    disabled={busyId === reward.id}
                    onClick={() => handleDelete(reward)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Xóa"
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4">Tên phần thưởng</th>
                  <th className="px-6 py-4">Chi phí đổi</th>
                  <th className="px-6 py-4">Giá trị giảm</th>
                  <th className="px-6 py-4">Đơn tối thiểu</th>
                  <th className="px-6 py-4">Hạn dùng</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{reward.name}</div>
                      {reward.description && <div className="text-xs text-gray-400 mt-0.5">{reward.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold">
                        <ShootingStarIcon className="w-3.5 h-3.5 text-amber-500" />
                        {reward.costInPoints} điểm
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">
                      {reward.rewardType === 1
                        ? `Giảm ${reward.discountRate}% ${reward.maxDiscountAmount ? `(Tối đa ${formatVND(reward.maxDiscountAmount)})` : ''}`
                        : `Giảm ${formatVND(reward.discountAmount)}`}
                    </td>
                    <td className="px-6 py-4">
                      {reward.minOrderAmount > 0 ? formatVND(reward.minOrderAmount) : 'Không giới hạn'}
                    </td>
                    <td className="px-6 py-4">{reward.validityDays} ngày</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          reward.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {reward.active ? 'Đang chạy' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(reward)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                          title="Sửa"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          disabled={busyId === reward.id}
                          onClick={() => handleDelete(reward)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Xóa"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-2xl w-full p-6 bg-white dark:bg-gray-800 rounded-3xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShootingStarIcon className="w-5 h-5 text-amber-500" />
            {editingReward ? 'Chỉnh Sửa Gói Đổi Thưởng' : 'Tạo Gói Đổi Thưởng Mới'}
          </h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <CloseLineIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              1. Thông tin phần thưởng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tên phần thưởng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Voucher giảm 20.000đ"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Số điểm cần đổi (⭐) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="VD: 20"
                  value={formState.costInPoints}
                  onChange={(e) => setFormState({ ...formState, costInPoints: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                rows={2}
                placeholder="VD: Đổi 20 điểm nhận ngay voucher giảm 20.000đ áp dụng cho mọi thức uống..."
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Section 2: Discount & Rules */}
          <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              2. Giá trị Voucher nhận được
            </h3>

            {/* Reward Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormState({ ...formState, rewardType: 2 })}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  formState.rewardType === 2
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <DollarLineIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-bold">Số tiền cố định (VNĐ)</div>
                  <div className="text-xs text-gray-400 font-normal">Trừ trực tiếp số tiền</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormState({ ...formState, rewardType: 1 })}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  formState.rewardType === 1
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <TaskIcon className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-sm font-bold">Phần trăm (%)</div>
                  <div className="text-xs text-gray-400 font-normal">Giảm theo tỷ lệ % đơn hàng</div>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formState.rewardType === 2 ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Số tiền giảm (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    placeholder="VD: 20000"
                    value={formState.discountAmount}
                    onChange={(e) => setFormState({ ...formState, discountAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                  <span className="text-xs text-blue-600 font-medium mt-1 block">
                    {formatVND(formState.discountAmount)}
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Tỷ lệ giảm (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      placeholder="VD: 15"
                      value={formState.discountRate}
                      onChange={(e) => setFormState({ ...formState, discountRate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="VD: 50000"
                      value={formState.maxDiscountAmount}
                      onChange={(e) => setFormState({ ...formState, maxDiscountAmount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-xs text-gray-400 mt-1 block">
                      {formatVND(formState.maxDiscountAmount)}
                    </span>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Đơn hàng tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="VD: 0 (áp dụng mọi đơn)"
                  value={formState.minOrderAmount}
                  onChange={(e) => setFormState({ ...formState, minOrderAmount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs text-gray-400 mt-1 block">
                  {formatVND(formState.minOrderAmount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Hạn sử dụng sau khi đổi (Số ngày)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="VD: 30"
                  value={formState.validityDays}
                  onChange={(e) => setFormState({ ...formState, validityDays: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Status & Sort */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.active}
                onChange={(e) => setFormState({ ...formState, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Kích hoạt gói đổi thưởng này
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
              >
                {submitting ? 'Đang lưu...' : editingReward ? 'Lưu thay đổi' : 'Tạo gói đổi thưởng'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
