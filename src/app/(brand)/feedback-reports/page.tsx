'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getFeedbackReports,
  FeedbackReportSummary,
  CustomerReviewItem,
} from '@/services/feedback';
import { getStores, Store } from '@/services/stores';
import { useAuthStore } from '@/store/authStore';
import {
  ShootingStarIcon,
  PieChartIcon,
  TaskIcon,
  DollarLineIcon,
} from '@/icons';

export default function FeedbackReportsPage() {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<FeedbackReportSummary | null>(null);

  // Filters State
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Review Detail Modal
  const [selectedReview, setSelectedReview] = useState<CustomerReviewItem | null>(null);

  useEffect(() => {
    fetchStoresList();
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStoresList = async () => {
    try {
      const brandId = user?.brandId ? Number(user.brandId) : undefined;
      const res = await getStores(1, 100, brandId);
      const list = res?.data?.items || res?.data || [];
      setStores(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('Failed to load stores:', err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await getFeedbackReports({
        storeId: selectedStoreId,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setReportData(res?.data ?? null);
    } catch (err: any) {
      console.error('Failed to load feedback reports:', err);
      toast.error(err.message || 'Không thể tải báo cáo đánh giá');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex text-amber-400 text-sm">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={s <= score ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800 dark:text-gray-100">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Báo Cáo Đánh Giá & Phản Hồi Khách Hàng (CSAT)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi mức độ hài lòng của khách hàng và danh sách phản hồi theo từng cửa hàng
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <form onSubmit={handleApplyFilter} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm flex flex-wrap items-end gap-3 text-xs">
        <div className="flex-1 min-w-[200px]">
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
            Cửa hàng
          </label>
          <select
            value={selectedStoreId || ''}
            onChange={(e) => setSelectedStoreId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-brand-500 focus:outline-none"
          >
            <option value="">Tất cả cửa hàng trong Brand</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[150px]">
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="w-[150px]">
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 text-xs font-bold shadow transition active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Đang lọc...' : 'Áp Dụng Lọc'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedStoreId(undefined);
              setFromDate('');
              setToDate('');
              setTimeout(fetchReports, 50);
            }}
            className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Đặt lại
          </button>
        </div>
      </form>

      {/* 4 BENTO SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: CSAT SCORE */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-amber-500/10 via-white to-white dark:via-gray-900 dark:to-gray-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Điểm CSAT Trung Bình
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <ShootingStarIcon className="size-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-gray-100">
              {reportData?.averageRating ?? 5.0}
            </span>
            <span className="text-sm text-gray-400">/ 5.0 ★</span>
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            {renderStars(Math.round(reportData?.averageRating ?? 5))}
            <span className="ml-1">Đánh giá chung</span>
          </div>
        </div>

        {/* CARD 2: TOTAL REVIEWS */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-500/10 via-white to-white dark:via-gray-900 dark:to-gray-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tổng Lượt Đánh Giá
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <TaskIcon className="size-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-gray-100">
            {reportData?.totalReviews ?? 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Phản hồi thực tế từ khách hàng
          </div>
        </div>

        {/* CARD 3: SATISFACTION RATE */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-emerald-500/10 via-white to-white dark:via-gray-900 dark:to-gray-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tỷ Lệ Hài Lòng
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <PieChartIcon className="size-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {reportData?.satisfactionRate ?? 100}%
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            {reportData?.positiveReviewCount ?? 0} lượt đánh giá tích cực (4-5★)
          </div>
        </div>

        {/* CARD 4: VOUCHERS ISSUED */}
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-500/10 via-white to-white dark:via-gray-900 dark:to-gray-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Voucher 20% Đã Cấp
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <DollarLineIcon className="size-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {reportData?.totalVouchersIssued ?? 0}
          </div>
          <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
            Mã ưu đãi toàn bill đã phát hành
          </div>
        </div>
      </div>

      {/* STORE SUMMARIES TABLE */}
      {reportData?.storeSummaries && reportData.storeSummaries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Tổng Hợp Điểm CSAT Theo Cửa Hàng
          </h2>

          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Cửa hàng</th>
                    <th className="px-4 py-3 text-center">Số lượt đánh giá</th>
                    <th className="px-4 py-3 text-center">Điểm CSAT</th>
                    <th className="px-4 py-3 text-center">Tỷ lệ hài lòng</th>
                    <th className="px-4 py-3 text-center">Voucher 20% đã phát</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {reportData.storeSummaries.map((s) => (
                    <tr key={s.storeId} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                        {s.storeName}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {s.totalReviews}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
                          ★ {s.averageRating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">
                        {s.satisfactionRate}%
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-purple-600">
                        {s.voucherCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECENT REVIEWS DETAIL LIST */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
          Danh Sách Phản Hồi Chi Tiết Gần Đây
        </h2>

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 w-36">Thời gian</th>
                  <th className="px-4 py-3">Cửa hàng</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3 text-center">Đánh giá</th>
                  <th className="px-4 py-3">Mã Voucher</th>
                  <th className="px-4 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Đang tải danh sách phản hồi...
                    </td>
                  </tr>
                ) : !reportData?.recentReviews || reportData.recentReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Chưa có phản hồi nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  reportData.recentReviews.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                      <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                        {new Date(r.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        {r.storeName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{r.customerPhone}</div>
                        {r.customerName && <div className="text-[11px] text-gray-400">{r.customerName}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                          ★ {r.ratingScore}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.voucherCode ? (
                          <span className="font-mono font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                            {r.voucherCode}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReview(r)}
                          className="rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 transition"
                        >
                          Xem câu trả lời
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* REVIEW DETAILS MODAL */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Chi Tiết Phản Hồi #{selectedReview.id}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedReview.storeName} • {new Date(selectedReview.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* CUSTOMER & RATING HEADER */}
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Khách hàng</div>
                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {selectedReview.customerPhone} {selectedReview.customerName ? `(${selectedReview.customerName})` : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Đánh giá chung</div>
                <div className="flex items-center gap-1 justify-end font-bold text-base text-amber-500">
                  ★ {selectedReview.ratingScore} / 5
                </div>
              </div>
            </div>

            {/* ANSWERS LIST */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Câu Trả Lời Khảo Sát
              </h4>

              {(() => {
                let parsedAnswers: any[] = [];
                try {
                  parsedAnswers = JSON.parse(selectedReview.answersJson);
                } catch {
                  parsedAnswers = [];
                }

                if (!Array.isArray(parsedAnswers) || parsedAnswers.length === 0) {
                  return <p className="text-xs text-gray-400 italic">Không có câu trả lời chi tiết.</p>;
                }

                return (
                  <div className="space-y-2.5">
                    {parsedAnswers.map((ans, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-900/50 space-y-1">
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {idx + 1}. {ans.questionTitle || `Câu hỏi ${ans.questionId}`}
                        </div>
                        <div className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                          {Array.isArray(ans.answer) ? ans.answer.join(', ') : (ans.answer || '--')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* VOUCHER ISSUED */}
            {selectedReview.voucherCode && (
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 dark:border-purple-900/40 dark:bg-purple-950/30 p-3 flex items-center justify-between">
                <div className="text-xs text-purple-900 dark:text-purple-300">
                  <span className="font-bold">🎁 Voucher 20% đã phát hành:</span>
                </div>
                <span className="font-mono font-bold text-sm text-purple-700 dark:text-purple-300">
                  {selectedReview.voucherCode}
                </span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="rounded-xl bg-gray-100 dark:bg-gray-800 px-5 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
