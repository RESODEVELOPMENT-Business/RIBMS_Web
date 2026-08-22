'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getAdminFeedbackQuestions,
  createOrUpdateFeedbackQuestion,
  deleteFeedbackQuestion,
  getFeedbackConfig,
  updateFeedbackConfig,
  FeedbackQuestion,
  FeedbackRewardConfig,
} from '@/services/feedback';
import { getStores, Store } from '@/services/stores';
import { useAuthStore } from '@/store/authStore';

export default function FeedbackSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'questions' | 'qr' | 'reward'>('questions');

  // Question Management State
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FeedbackQuestion | null>(null);

  // Question Modal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<number>(2); // 1: StarRating, 2: SingleChoice, 3: MultiChoice, 4: FreeText
  const [formOptions, setFormOptions] = useState<string[]>(['Rất tốt', 'Bình thường', 'Cần cải thiện']);
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formIsRequired, setFormIsRequired] = useState<boolean>(true);
  const [formActive, setFormActive] = useState<boolean>(true);

  // Reward Config State
  const [rewardConfig, setRewardConfig] = useState<FeedbackRewardConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Reward Form Fields
  const [rewardEnabled, setRewardEnabled] = useState(true);
  const [rewardType, setRewardType] = useState<number>(1); // 1: %, 2: Amount, 3: Points, 4: Custom
  const [rewardDiscountRate, setRewardDiscountRate] = useState<number>(20);
  const [rewardDiscountAmount, setRewardDiscountAmount] = useState<number>(30000);
  const [rewardMinOrderAmount, setRewardMinOrderAmount] = useState<string>('');
  const [rewardMaxDiscountAmount, setRewardMaxDiscountAmount] = useState<string>('');
  const [rewardExpirationDays, setRewardExpirationDays] = useState<number>(30);
  const [rewardCooldownDays, setRewardCooldownDays] = useState<number>(30);
  const [rewardVoucherPrefix, setRewardVoucherPrefix] = useState<string>('DG');
  const [rewardTitle, setRewardTitle] = useState<string>('');
  const [rewardDescription, setRewardDescription] = useState<string>('');

  // Store QR State
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchRewardConfig();
    fetchStoresList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRewardConfig = async () => {
    setLoadingConfig(true);
    try {
      const brandId = user?.brandId ? Number(user.brandId) : undefined;
      const res = await getFeedbackConfig(brandId);
      const data: FeedbackRewardConfig = res?.data;
      if (data) {
        setRewardConfig(data);
        setRewardEnabled(data.isRewardEnabled ?? true);
        setRewardType(data.rewardType ?? 1);
        setRewardDiscountRate(data.discountRate ?? 20);
        setRewardDiscountAmount(data.discountAmount ?? 30000);
        setRewardMinOrderAmount(data.minOrderAmount ? data.minOrderAmount.toString() : '');
        setRewardMaxDiscountAmount(data.maxDiscountAmount ? data.maxDiscountAmount.toString() : '');
        setRewardExpirationDays(data.expirationDays ?? 30);
        setRewardCooldownDays(data.cooldownDays ?? 30);
        setRewardVoucherPrefix(data.voucherCodePrefix || 'DG');
        setRewardTitle(data.customRewardTitle || '');
        setRewardDescription(data.customRewardDescription || '');
      }
    } catch (err: any) {
      console.error('Failed to load feedback reward config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveRewardConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const brandId = user?.brandId ? Number(user.brandId) : 1;
      const payload: Partial<FeedbackRewardConfig> = {
        brandId,
        isRewardEnabled: rewardEnabled,
        rewardType,
        discountRate: Number(rewardDiscountRate) || 0,
        discountAmount: Number(rewardDiscountAmount) || 0,
        minOrderAmount: rewardMinOrderAmount ? Number(rewardMinOrderAmount) : null,
        maxDiscountAmount: rewardMaxDiscountAmount ? Number(rewardMaxDiscountAmount) : null,
        expirationDays: Number(rewardExpirationDays) || 30,
        cooldownDays: Number(rewardCooldownDays) >= 0 ? Number(rewardCooldownDays) : 30,
        voucherCodePrefix: rewardVoucherPrefix.trim().toUpperCase() || 'DG',
        customRewardTitle: rewardTitle.trim() || null,
        customRewardDescription: rewardDescription.trim() || null,
      };

      await updateFeedbackConfig(payload);
      toast.success('Lưu cấu hình quà tặng đánh giá thành công!');
      fetchRewardConfig();
    } catch (err: any) {
      console.error('Failed to save reward config:', err);
      toast.error(err.message || 'Lưu cấu hình thất bại');
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await getAdminFeedbackQuestions();
      setQuestions(res?.data ?? []);
    } catch (err: any) {
      console.error('Failed to load feedback questions:', err);
      toast.error(err.message || 'Không thể tải danh sách câu hỏi');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchStoresList = async () => {
    setLoadingStores(true);
    try {
      const brandId = user?.brandId ? Number(user.brandId) : undefined;
      const res = await getStores(1, 100, brandId);
      const list = res?.data?.items || res?.data || [];
      setStores(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoadingStores(false);
    }
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    setFormTitle('');
    setFormType(2);
    setFormOptions(['Rất tốt', 'Bình thường', 'Cần cải thiện']);
    setFormSortOrder((questions.length + 1) * 10);
    setFormIsRequired(true);
    setFormActive(true);
    setModalOpen(true);
  };

  const openEditModal = (q: FeedbackQuestion) => {
    setEditingQuestion(q);
    setFormTitle(q.title);
    setFormType(q.questionType);
    if (q.optionsJson) {
      try {
        setFormOptions(JSON.parse(q.optionsJson));
      } catch {
        setFormOptions([]);
      }
    } else {
      setFormOptions([]);
    }
    setFormSortOrder(q.sortOrder);
    setFormIsRequired(q.isRequired);
    setFormActive(q.active);
    setModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề câu hỏi');
      return;
    }

    setSavingQuestion(true);
    try {
      const payload: Partial<FeedbackQuestion> = {
        id: editingQuestion ? editingQuestion.id : undefined,
        title: formTitle.trim(),
        questionType: formType,
        optionsJson: formType === 2 || formType === 3 ? JSON.stringify(formOptions.filter(o => o.trim() !== '')) : null,
        sortOrder: formSortOrder,
        isRequired: formIsRequired,
        active: formActive,
      };

      await createOrUpdateFeedbackQuestion(payload);
      toast.success(editingQuestion ? 'Cập nhật câu hỏi thành công' : 'Thêm câu hỏi mới thành công');
      setModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      console.error('Failed to save question:', err);
      toast.error(err.message || 'Lưu câu hỏi thất bại');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) return;

    try {
      await deleteFeedbackQuestion(id);
      toast.success('Đã xóa câu hỏi');
      fetchQuestions();
    } catch (err: any) {
      console.error('Failed to delete question:', err);
      toast.error(err.message || 'Xóa câu hỏi thất bại');
    }
  };

  const getQuestionTypeBadge = (type: number) => {
    switch (type) {
      case 1:
        return <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">⭐ Đánh giá sao (1-5)</span>;
      case 2:
        return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">🔘 Trắc nghiệm 1 lựa chọn</span>;
      case 3:
        return <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10">☑️ Trắc nghiệm nhiều lựa chọn</span>;
      case 4:
        return <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">📝 Ý kiến tự do (Text)</span>;
      default:
        return null;
    }
  };

  const brandId = user?.brandId ? Number(user.brandId) : 1;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Thiết Lập Đánh Giá & Mã QR Khách Hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Cấu hình bộ câu hỏi khảo sát chung cho toàn Brand và tạo mã QR in để bàn cho từng Cửa hàng
          </p>
        </div>

        {/* TABS */}
        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'questions'
                ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            📋 Bộ Câu Hỏi ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reward')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'reward'
                ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            🎁 Cấu Hình Quà Tặng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-gray-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            📱 Mã QR Cửa Hàng ({stores.length})
          </button>
        </div>
      </div>

      {/* REWARD INFO BANNER */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{rewardEnabled ? '🎁' : '⏸️'}</span>
          <div>
            <div className="text-sm font-bold text-amber-900 dark:text-amber-300">
              {rewardEnabled
                ? (rewardTitle || (rewardType === 1
                    ? `Chiến Dịch Tặng Voucher Giảm ${rewardDiscountRate}% Toàn Bill`
                    : rewardType === 2
                    ? `Chiến Dịch Tặng Voucher Giảm ${rewardDiscountAmount.toLocaleString('vi-VN')} ₫`
                    : rewardType === 3
                    ? 'Chiến Dịch Tặng Điểm Thẻ Thành Viên'
                    : 'Quà Tặng Tri Ân Khách Hàng'))
                : 'Tính Năng Tặng Quà Sau Đánh Giá Đang Tắt'}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-400">
              {rewardEnabled
                ? `Khách hàng sau khi đánh giá sẽ nhận phần quà (chống spam mỗi SĐT nhận 1 lần/${rewardCooldownDays} ngày). Bạn có thể tùy biến tại tab "Cấu Hình Quà Tặng".`
                : 'Khách hàng gửi đánh giá sẽ được ghi nhận ý kiến nhưng không cấp mã ưu đãi.'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('reward')}
          className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition"
        >
          Cấu hình ngay ⚙️
        </button>
      </div>

      {/* TAB 1: QUESTIONS MANAGEMENT */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Danh Sách Câu Hỏi Khảo Sát
            </h2>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-brand-500/20 transition active:scale-95"
            >
              + Thêm Câu Hỏi Mới
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3.5 w-16 text-center">Thứ tự</th>
                    <th className="px-4 py-3.5">Tiêu đề câu hỏi</th>
                    <th className="px-4 py-3.5">Loại câu hỏi</th>
                    <th className="px-4 py-3.5">Lựa chọn (Options)</th>
                    <th className="px-4 py-3.5 w-28 text-center">Bắt buộc</th>
                    <th className="px-4 py-3.5 w-28 text-center">Trạng thái</th>
                    <th className="px-4 py-3.5 w-28 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {loadingQuestions ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        Đang tải danh sách câu hỏi...
                      </td>
                    </tr>
                  ) : questions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        Chưa có câu hỏi nào. Nhấn &quot;+ Thêm Câu Hỏi Mới&quot; để thiết lập bộ câu hỏi cho Brand.
                      </td>
                    </tr>
                  ) : (
                    questions.map((q) => {
                      let options: string[] = [];
                      if (q.optionsJson) {
                        try {
                          options = JSON.parse(q.optionsJson);
                        } catch {
                          options = [];
                        }
                      }

                      return (
                        <tr key={q.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                          <td className="px-4 py-3 text-center font-mono text-gray-500 font-bold">
                            {q.sortOrder}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                            {q.title}
                          </td>
                          <td className="px-4 py-3">
                            {getQuestionTypeBadge(q.questionType)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {options.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {options.map((opt, i) => (
                                  <span key={i} className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px]">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {q.isRequired ? (
                              <span className="text-emerald-600 font-bold">Có</span>
                            ) : (
                              <span className="text-gray-400">Không</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {q.active ? (
                              <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                Đang hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                Tạm ẩn
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(q)}
                              className="text-brand-600 hover:text-brand-800 font-semibold"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: REWARD CONFIGURATION */}
      {activeTab === 'reward' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Cấu Hình Quà Tặng & Ưu Đãi Đánh Giá
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Thiết lập quà tặng tri ân tự động gửi tới khách hàng sau khi gửi phản hồi trải nghiệm
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* FORM CONFIG (7 COLS) */}
            <form
              onSubmit={handleSaveRewardConfig}
              className="lg:col-span-7 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-5"
            >
              {/* TOGGLE ENABLE */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Bật Tính Năng Tặng Quà Tự Động
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Khách gửi đánh giá thành công sẽ nhận được phần quà theo cấu hình bên dưới
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rewardEnabled}
                    onChange={(e) => setRewardEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {rewardEnabled && (
                <div className="space-y-4 text-xs">
                  {/* REWARD TYPE SELECTOR */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Loại quà tặng <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRewardType(1)}
                        className={`p-3 rounded-2xl border text-left transition ${
                          rewardType === 1
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-bold ring-2 ring-brand-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="text-base mb-1">🎟️ Giảm Theo %</div>
                        <div className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                          Voucher giảm theo % toàn bill (vd: Giảm 20%)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRewardType(2)}
                        className={`p-3 rounded-2xl border text-left transition ${
                          rewardType === 2
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-bold ring-2 ring-brand-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="text-base mb-1">💵 Giảm Tiền Mặt</div>
                        <div className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                          Voucher giảm số tiền cố định (vd: 30.000 ₫, 50.000 ₫)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRewardType(3)}
                        className={`p-3 rounded-2xl border text-left transition ${
                          rewardType === 3
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-bold ring-2 ring-brand-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="text-base mb-1">⭐ Tặng Điểm Thẻ</div>
                        <div className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                          Cộng điểm loyalty trực tiếp vào tài khoản
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRewardType(4)}
                        className={`p-3 rounded-2xl border text-left transition ${
                          rewardType === 4
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 font-bold ring-2 ring-brand-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="text-base mb-1">🎁 Quà Tại Quầy</div>
                        <div className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                          Lời cảm ơn / hướng dẫn nhận quà trực tiếp từ thu ngân
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* VALUE INPUTS */}
                  {rewardType === 1 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Phần trăm giảm giá (%) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={rewardDiscountRate}
                            onChange={(e) => setRewardDiscountRate(Number(e.target.value))}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none pr-8"
                          />
                          <span className="absolute right-3 top-2.5 text-gray-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Giảm tối đa (VNĐ) <span className="text-gray-400 font-normal">(tùy chọn)</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Ví dụ: 50000"
                          value={rewardMaxDiscountAmount}
                          onChange={(e) => setRewardMaxDiscountAmount(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {rewardType === 2 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Số tiền giảm (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1000"
                          step="1000"
                          required
                          value={rewardDiscountAmount}
                          onChange={(e) => setRewardDiscountAmount(Number(e.target.value))}
                          placeholder="Ví dụ: 30000"
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                          Đơn tối thiểu (VNĐ) <span className="text-gray-400 font-normal">(tùy chọn)</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Ví dụ: 80000"
                          value={rewardMinOrderAmount}
                          onChange={(e) => setRewardMinOrderAmount(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {rewardType === 3 && (
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Số điểm loyalty tặng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={rewardDiscountAmount}
                        onChange={(e) => setRewardDiscountAmount(Number(e.target.value))}
                        placeholder="Ví dụ: 50"
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* CODE PREFIX & EXPIRY & COOLDOWN */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Tiền tố mã Voucher
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        value={rewardVoucherPrefix}
                        onChange={(e) => setRewardVoucherPrefix(e.target.value.toUpperCase())}
                        placeholder="DG"
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-mono uppercase focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Hạn dùng (ngày)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={rewardExpirationDays}
                        onChange={(e) => setRewardExpirationDays(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1" title="Số ngày tối thiểu giữa 2 lần nhận quà của cùng 1 SĐT">
                        Chống spam (ngày) 🛡️
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={rewardCooldownDays}
                        onChange={(e) => setRewardCooldownDays(Number(e.target.value))}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* CUSTOM TITLE & DESCRIPTION */}
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Tiêu đề hiển thị cho khách <span className="text-gray-400 font-normal">(để trống sẽ dùng mặc định)</span>
                    </label>
                    <input
                      type="text"
                      value={rewardTitle}
                      onChange={(e) => setRewardTitle(e.target.value)}
                      placeholder={
                        rewardType === 1
                          ? `Voucher giảm ${rewardDiscountRate}% toàn bill`
                          : rewardType === 2
                          ? `Voucher giảm ${rewardDiscountAmount.toLocaleString('vi-VN')} ₫ toàn bill`
                          : rewardType === 3
                          ? `Tặng ${rewardDiscountAmount} điểm thành viên`
                          : 'Quà tặng tri ân tại quầy'
                      }
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Mô tả / Điều kiện áp dụng
                    </label>
                    <textarea
                      rows={2}
                      value={rewardDescription}
                      onChange={(e) => setRewardDescription(e.target.value)}
                      placeholder="Ví dụ: Áp dụng cho lần mua hàng tiếp theo tại tất cả các cửa hàng thuộc hệ thống."
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingConfig || loadingConfig}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 text-xs font-bold shadow-md shadow-brand-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {savingConfig ? 'Đang lưu cấu hình...' : '💾 Lưu Cấu Hình Quà Tặng'}
                </button>
              </div>
            </form>

            {/* LIVE PREVIEW (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  👁️ Xem trước giao diện khách hàng nhận quà
                </span>
              </div>

              {rewardEnabled ? (
                <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 size-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs">
                      {rewardType === 1 ? '🎟️ VOUCHER GIẢM GIÁ' : rewardType === 2 ? '💵 VOUCHER TIỀN MẶT' : rewardType === 3 ? '⭐ ĐIỂM THÀNH VIÊN' : '🎁 QUÀ TẶNG TẠI QUẦY'}
                    </span>
                    <span className="text-xs font-medium text-white/80">
                      HSD: {rewardExpirationDays} ngày
                    </span>
                  </div>

                  <div>
                    <h4 className="text-2xl font-black tracking-tight">
                      {rewardTitle || (rewardType === 1
                        ? `Giảm ${rewardDiscountRate}% Toàn Bill`
                        : rewardType === 2
                        ? `Giảm ${rewardDiscountAmount.toLocaleString('vi-VN')} ₫`
                        : rewardType === 3
                        ? `+${rewardDiscountAmount} Điểm Tích Lũy`
                        : 'Quà Tặng Tri Ân')}
                    </h4>
                    <p className="text-xs text-white/90 mt-1">
                      {rewardDescription || 'Áp dụng cho lần mua tiếp theo tại tất cả các cửa hàng.'}
                    </p>
                  </div>

                  {rewardType !== 4 && (
                    <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-white/70 font-semibold uppercase">Mã ưu đãi của bạn</div>
                        <div className="font-mono text-base font-black tracking-wider text-amber-100">
                          {rewardVoucherPrefix || 'DG'}{rewardType === 1 ? rewardDiscountRate : ''}-XXXXXX
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-white text-orange-600 font-bold shadow-sm">
                        Sao chép
                      </span>
                    </div>
                  )}

                  <div className="text-[11px] text-white/75 pt-1 border-t border-white/15 flex justify-between items-center">
                    <span>🛡️ Chống spam: 1 lần/{rewardCooldownDays} ngày</span>
                    <span>Tự động liên kết thẻ App</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-8 text-center space-y-3 text-gray-500">
                  <div className="text-3xl">⏸️</div>
                  <div className="font-bold text-sm text-gray-700 dark:text-gray-300">Tính năng tặng quà đang tắt</div>
                  <div className="text-xs max-w-xs mx-auto">Khách hàng sẽ chỉ nhìn thấy lời cảm ơn sau khi gửi đánh giá, hệ thống không sinh mã voucher.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORE QR CODES */}
      {activeTab === 'qr' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Danh Sách Mã QR Đánh Giá Theo Cửa Hàng
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                In và dán mã QR tại từng bàn hoặc trên hóa đơn để khách hàng quét đánh giá
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loadingStores ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                Đang tải danh sách cửa hàng...
              </div>
            ) : stores.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                Không tìm thấy cửa hàng nào trong Brand.
              </div>
            ) : (
              stores.map((store) => {
                const feedbackUrl = `${origin}/feedback?brandId=${brandId}&storeId=${store.id}`;
                const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(feedbackUrl)}`;

                return (
                  <div
                    key={store.id}
                    className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4 text-center hover:shadow-md transition"
                  >
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
                      <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                        {store.name}
                      </h3>
                      {store.address && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          📍 {store.address}
                        </p>
                      )}
                    </div>

                    {/* QR CODE PREVIEW */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl inline-block shadow-inner border border-gray-200 dark:border-gray-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeImgUrl}
                        alt={`QR Code ${store.name}`}
                        className="size-40 rounded-lg mx-auto bg-white p-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-mono text-gray-500 truncate px-2 bg-gray-50 dark:bg-gray-800 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                        {feedbackUrl}
                      </div>

                      <div className="flex gap-2 justify-center pt-1">
                        <a
                          href={feedbackUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          Xem Trang
                        </a>
                        <a
                          href={qrCodeImgUrl}
                          download={`QR_DanhGia_${store.name.replace(/\s+/g, '_')}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 text-xs font-bold shadow transition active:scale-95"
                        >
                          Tải File QR In
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT QUESTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Khảo Sát Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Tiêu đề câu hỏi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Thái độ phục vụ của nhân viên thế nào?"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Loại câu hỏi
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                >
                  <option value={1}>⭐ Đánh giá sao (1 - 5)</option>
                  <option value={2}>🔘 Trắc nghiệm chọn 1 đáp án</option>
                  <option value={3}>☑️ Trắc nghiệm chọn nhiều đáp án</option>
                  <option value={4}>📝 Nhập văn bản tự do</option>
                </select>
              </div>

              {(formType === 2 || formType === 3) && (
                <div className="space-y-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300">
                    Danh sách các lựa chọn (Options)
                  </label>
                  {formOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...formOptions];
                          updated[idx] = e.target.value;
                          setFormOptions(updated);
                        }}
                        placeholder={`Lựa chọn ${idx + 1}`}
                        className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs focus:border-brand-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setFormOptions(formOptions.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 px-2 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormOptions([...formOptions, ''])}
                    className="text-xs text-brand-600 hover:text-brand-700 font-bold"
                  >
                    + Thêm lựa chọn
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-center space-y-2 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsRequired}
                      onChange={(e) => setFormIsRequired(e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-bold text-gray-700 dark:text-gray-300">Bắt buộc trả lời</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-bold text-gray-700 dark:text-gray-300">Kích hoạt hiển thị</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 text-xs font-bold shadow transition active:scale-95 disabled:opacity-50"
                >
                  {savingQuestion ? 'Đang lưu...' : 'Lưu Câu Hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
