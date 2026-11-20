'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertIcon,
  CheckCircleIcon,
  GroupIcon,
  PlusIcon,
  ShootingStarIcon,
  TrashBinIcon,
  UserIcon,
} from '@/icons';
import { apiClient } from '@/services/apiClient';

interface Milestone {
  id?: number;
  condition: number;
  threshold: number;
  rewardType: number;
  amount: number | null;
  percentageBasisPoints: number | null;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  note: string | null;
  productId: number | null;
  validityDays: number;
  active: boolean;
  hasGrants?: boolean;
}

interface Program {
  version: string;
  registrationEnabled: boolean;
  firstOrderEnabled: boolean;
  refereeRewardEnabled: boolean;
  refereeRewardType: number | null;
  refereeAmount: number | null;
  refereePercentageBasisPoints: number | null;
  refereeMaxDiscountAmount: number | null;
  refereeMinOrderAmount: number | null;
  refereeProductId: number | null;
  refereeValidityDays: number | null;
  refereeNote: string | null;
  milestones: Milestone[];
}

interface ProductOption {
  id: number;
  productName: string;
  code: string;
}

interface TopReferrerItem {
  referrerCustomerId: number;
  code: string;
  customerName: string;
  customerPhone: string;
  totalInvited: number;
  registeredCount: number;
  qualifiedCount: number;
  disqualifiedCount: number;
  grantsCount: number;
}

interface ReferralStats {
  totalReferrals: number;
  registeredCount: number;
  qualifiedFirstOrderCount: number;
  pendingFirstOrderCount: number;
  disqualifiedCount: number;
  refereeVouchersIssued: number;
  refereeVouchersRedeemed: number;
  totalGrantsIssued: number;
  grantsRedeemed: number;
  topReferrers: TopReferrerItem[];
}

interface ReferralRow {
  id: number;
  referrerCustomerId: number;
  referrerCode: string;
  referrerName: string;
  referrerPhone: string;
  refereeCustomerId: number;
  refereeName: string;
  refereePhone: string;
  registeredAt: string;
  status: 'Registered' | 'CompletedFirstOrder' | 'Disqualified' | string;
  qualifiedOrderId: number | null;
  qualifiedAt: string | null;
  disqualifiedAt: string | null;
  refereeVoucherCode: string | null;
  refereeVoucherStatus: string | null;
}

interface GrantRow {
  id: number;
  milestoneId: number;
  condition: number;
  threshold: number;
  referrerCustomerId: number;
  referrerCode: string;
  referrerName: string;
  referrerPhone: string;
  voucherCode: string;
  voucherStatus: string;
  issuedAt: string;
  expiresAt: string | null;
  redeemedAt: string | null;
  rewardType: number | null;
  amount: number | null;
  percentageBasisPoints: number | null;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  productId: number | null;
  productName: string | null;
  note: string | null;
}

interface PagedResult<T> {
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

const endpoint = '/brand/referral-program';

const fieldClass =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-theme-xs transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500';

const labelClass = 'mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300';

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        aria-label={ariaLabel}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40 peer-checked:bg-brand-500 dark:bg-gray-700" />
      <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-xs transition-transform peer-checked:translate-x-5" />
    </label>
  );
}

function ProductPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<ProductOption[]>([]);
  const [selected, setSelected] = useState<ProductOption | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({
        name: query.trim(),
        status: 'true',
        size: '20',
      });
      try {
        const result = await apiClient<{ data: { items: ProductOption[] } }>(
          `/products?${params}`
        );
        if (active) setItems(result.data.items);
      } catch {
        if (active) setError('Không thể tải danh sách món.');
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!value) return;
    let active = true;
    apiClient<{ data: ProductOption }>(`/products/${value}`)
      .then(({ data }) => {
        if (active) setSelected(data);
      })
      .catch(() => {
        if (active) setSelected(null);
      });
    return () => {
      active = false;
    };
  }, [value]);

  return (
    <div className="space-y-2">
      <input
        aria-label="Tìm món thưởng"
        placeholder="Tìm theo tên món hoặc mã…"
        className={fieldClass}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setItems([]);
          setError('');
        }}
      />
      <select
        aria-label="Món thưởng"
        className={fieldClass}
        required
        value={value ?? ''}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        <option value="" disabled>
          Chọn món thưởng
        </option>
        {value && !items.some((item) => item.id === value) && (
          <option value={value}>
            {selected?.id === value ? selected.productName : `Sản phẩm #${value}`}
          </option>
        )}
        {items.map((item) => (
          <option value={item.id} key={item.id}>
            {item.productName} ({item.code})
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-xs text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
    </div>
  );
}

function formatCurrencySummary(value: number | null) {
  if (value == null || value <= 0) return 'Chưa nhập giá trị';
  return `${value.toLocaleString('vi-VN')} đ`;
}

function describeRefereeReward(program: Program) {
  if (!program.refereeRewardEnabled) return 'Đang tắt';
  switch (program.refereeRewardType ?? 2) {
    case 1:
      return program.refereePercentageBasisPoints
        ? `Giảm ${program.refereePercentageBasisPoints / 100}%`
        : 'Voucher giảm %';
    case 4:
      return program.refereeProductId ? `1 ly miễn phí (#${program.refereeProductId})` : '1 ly miễn phí';
    default:
      return `Giảm ${formatCurrencySummary(program.refereeAmount)}`;
  }
}

function formatGrantReward(grant: GrantRow) {
  if (grant.rewardType === 4) {
    return `1 ly miễn phí: ${grant.productName ?? (grant.productId ? `#${grant.productId}` : '')}`;
  }
  if (grant.rewardType === 1) {
    const pct = grant.percentageBasisPoints ? grant.percentageBasisPoints / 100 : 0;
    const cap =
      grant.maxDiscountAmount && grant.maxDiscountAmount > 0
        ? ` (tối đa ${grant.maxDiscountAmount.toLocaleString('vi-VN')} đ)`
        : '';
    return `Giảm ${pct}%${cap}`;
  }
  if (grant.rewardType === 2 && grant.amount != null) {
    return `Giảm ${grant.amount.toLocaleString('vi-VN')} đ`;
  }
  return 'Voucher thưởng';
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

export default function ReferralProgramPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'analytics'>('config');
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Analytics tab state
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<PagedResult<ReferralRow> | null>(null);
  const [grants, setGrants] = useState<PagedResult<GrantRow> | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [referralPage, setReferralPage] = useState(1);
  const [referralStatus, setReferralStatus] = useState('');
  const [referralKeyword, setReferralKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [grantPage, setGrantPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(referralKeyword.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [referralKeyword]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient<{ data: Program }>(endpoint);
      setProgram(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chương trình.');
    } finally {
      setLoading(false);
    }
  }

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const refParams = new URLSearchParams({
        page: String(referralPage),
        size: '15',
      });
      if (referralStatus) refParams.set('status', referralStatus);
      if (debouncedKeyword) refParams.set('keyword', debouncedKeyword);

      const grantParams = new URLSearchParams({
        page: String(grantPage),
        size: '10',
      });

      const [statsRes, referralsRes, grantsRes] = await Promise.all([
        apiClient<{ data: ReferralStats }>(`${endpoint}/stats?top=10`),
        apiClient<{ data: PagedResult<ReferralRow> }>(`${endpoint}/referrals?${refParams}`),
        apiClient<{ data: PagedResult<GrantRow> }>(`${endpoint}/grants?${grantParams}`),
      ]);
      setStats(statsRes.data);
      setReferrals(referralsRes.data);
      setGrants(grantsRes.data);
    } catch (err) {
      setAnalyticsError(
        err instanceof Error ? err.message : 'Không thể tải dữ liệu thống kê giới thiệu.'
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, [referralPage, referralStatus, debouncedKeyword, grantPage]);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      void loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  function updateMilestone(index: number, patch: Partial<Milestone>) {
    setProgram((current) =>
      current && {
        ...current,
        milestones: current.milestones.map((item, row) =>
          row === index ? { ...item, ...patch } : item
        ),
      }
    );
  }

  function addMilestone() {
    setProgram((current) =>
      current && {
        ...current,
        milestones: [
          ...current.milestones,
          {
            condition: 1,
            threshold: 1,
            rewardType: 2,
            amount: null,
            productId: null,
            validityDays: 30,
            active: true,
            percentageBasisPoints: null,
            maxDiscountAmount: null,
            minOrderAmount: null,
            note: null,
            hasGrants: false,
          },
        ],
      }
    );
  }

  async function removeMilestone(index: number, item: Milestone) {
    if (!program) return;
    if (item.hasGrants) {
      toast.error('Mốc thưởng này đã từng phát quà. Hãy tắt công tắc Áp dụng thay vì xóa.');
      return;
    }

    if (!item.id) {
      setProgram({
        ...program,
        milestones: program.milestones.filter((_, row) => row !== index),
      });
      return;
    }

    setDeletingId(item.id);
    try {
      const result = await apiClient<{ data: Program }>(`${endpoint}/milestones/${item.id}`, {
        method: 'DELETE',
      });
      setProgram(result.data);
      toast.success('Đã xóa mốc thưởng.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa mốc thưởng.');
    } finally {
      setDeletingId(null);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!program || saving) return;
    setSaving(true);
    try {
      const result = await apiClient<{ data: Program }>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(program),
      });
      setProgram(result.data);
      toast.success('Đã lưu chương trình giới thiệu.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  }

  const activeConditionsCount = program
    ? Number(program.registrationEnabled) + Number(program.firstOrderEnabled)
    : 0;
  const activeMilestonesCount = program
    ? program.milestones.filter((m) => m.active).length
    : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-gray-800 md:p-6 dark:text-gray-100">
      {/* Page Header */}
      <header className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
            <GroupIcon className="h-6 w-6 shrink-0" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-title-sm dark:text-white">
              Giới thiệu bạn bè
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Cấu hình điều kiện ghi nhận lượt mời, quà chào mừng cho người được mời, các mốc thưởng
              cho người giới thiệu và theo dõi hiệu quả chiến dịch.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Switcher */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'config'
                  ? 'bg-white text-brand-600 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Cấu hình chương trình
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'analytics'
                  ? 'bg-white text-brand-600 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Theo dõi &amp; Thống kê
            </button>
          </div>

          <Link
            href="/welcome-vouchers"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Voucher chào mừng
          </Link>

          {program && activeTab === 'config' && (
            <button
              type="submit"
              form="referral-program-form"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
            </button>
          )}
        </div>
      </header>

      {/* TAB 1: CONFIGURATION */}
      {activeTab === 'config' && (
        <>
          {loading && (
            <div role="status" aria-label="Đang tải…" className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                  />
                ))}
              </div>
              <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
              <div className="h-72 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-600 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              <div className="flex items-center gap-2.5">
                <AlertIcon className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-error-200 bg-white px-4 font-medium text-error-600 transition hover:bg-error-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500/40 dark:border-error-500/30 dark:bg-gray-900 dark:text-error-400 dark:hover:bg-error-500/10"
              >
                Tải lại
              </button>
            </div>
          )}

          {!loading && !error && program && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                    <CheckCircleIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Điều kiện ghi nhận
                    </div>
                    <div className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                      {activeConditionsCount}/2 đang bật
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Quà người được mời
                    </div>
                    <div className="mt-0.5 truncate text-lg font-bold text-gray-900 dark:text-white">
                      {describeRefereeReward(program)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                    <ShootingStarIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Mốc thưởng người mời
                    </div>
                    <div className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                      {activeMilestonesCount}/{program.milestones.length} mốc áp dụng
                    </div>
                  </div>
                </div>
              </div>

              <form id="referral-program-form" onSubmit={save} className="space-y-6">
                <fieldset disabled={saving} className="space-y-6">
                  {/* Section 1: Tracking Rules */}
                  <section className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        Điều kiện ghi nhận lượt giới thiệu
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Chọn cách hệ thống tính lượt giới thiệu hợp lệ để tích lũy đạt mốc cho người
                        mời.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                      <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Tính lượt đăng ký bằng mã
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            Tính ngay một lượt khi bạn bè tạo tài khoản mới hoặc nhập mã giới thiệu
                            thành công.
                          </p>
                        </div>
                        <ToggleSwitch
                          ariaLabel="Tính lượt đăng ký bằng mã"
                          checked={program.registrationEnabled}
                          onChange={(checked) =>
                            setProgram({ ...program, registrationEnabled: checked })
                          }
                        />
                      </div>

                      <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Tính lượt hoàn tất đơn đầu tiên
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            Ghi nhận thêm lượt khi người được mời thanh toán thành công đơn hàng đầu
                            tiên.
                          </p>
                        </div>
                        <ToggleSwitch
                          ariaLabel="Tính lượt hoàn tất đơn đầu tiên"
                          checked={program.firstOrderEnabled}
                          onChange={(checked) =>
                            setProgram({ ...program, firstOrderEnabled: checked })
                          }
                        />
                      </div>
                    </div>
                  </section>

                  {/* Section 2: Referee Reward */}
                  <section className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Quà tặng cho Người được mời
                          </h2>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              program.refereeRewardEnabled
                                ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {program.refereeRewardEnabled ? 'Đang bật' : 'Đang tắt'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Tặng quà cho Người được mời ngay khi đăng ký / nhập mã thành công (mỗi tài
                          khoản áp dụng 1 lần).
                        </p>
                      </div>

                      <ToggleSwitch
                        ariaLabel="Tặng quà cho Người được mời ngay khi đăng ký / nhập mã thành công"
                        checked={program.refereeRewardEnabled ?? false}
                        onChange={(checked) =>
                          setProgram({
                            ...program,
                            refereeRewardEnabled: checked,
                            refereeRewardType: checked ? (program.refereeRewardType ?? 2) : null,
                            refereeValidityDays: checked
                              ? (program.refereeValidityDays ?? 30)
                              : null,
                          })
                        }
                      />
                    </div>

                    {program.refereeRewardEnabled ? (
                      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label htmlFor="referee-reward-type" className={labelClass}>
                            Loại quà
                          </label>
                          <select
                            id="referee-reward-type"
                            aria-label="Loại quà người được mời"
                            className={fieldClass}
                            value={program.refereeRewardType ?? 2}
                            onChange={(event) =>
                              setProgram({
                                ...program,
                                refereeRewardType: Number(event.target.value),
                                refereeAmount: null,
                                refereePercentageBasisPoints: null,
                                refereeMaxDiscountAmount: null,
                                refereeMinOrderAmount: null,
                                refereeProductId: null,
                              })
                            }
                          >
                            <option value={1}>Voucher giảm %</option>
                            <option value={2}>Voucher giảm tiền</option>
                            <option value={4}>Một ly miễn phí</option>
                          </select>
                        </div>

                        <div className="space-y-3">
                          {(program.refereeRewardType ?? 2) === 4 ? (
                            <div>
                              <label className={labelClass}>Món thưởng miễn phí</label>
                              <ProductPicker
                                value={program.refereeProductId}
                                onChange={(refereeProductId) =>
                                  setProgram({ ...program, refereeProductId })
                                }
                              />
                            </div>
                          ) : (program.refereeRewardType ?? 2) === 1 ? (
                            <>
                              <div>
                                <label htmlFor="referee-percent" className={labelClass}>
                                  Phần trăm giảm (%)
                                </label>
                                <input
                                  id="referee-percent"
                                  className={fieldClass}
                                  type="number"
                                  required
                                  min={0.01}
                                  max={100}
                                  step={0.01}
                                  placeholder="Ví dụ: 20"
                                  value={
                                    program.refereePercentageBasisPoints == null
                                      ? ''
                                      : program.refereePercentageBasisPoints / 100
                                  }
                                  onChange={(event) =>
                                    setProgram({
                                      ...program,
                                      refereePercentageBasisPoints:
                                        event.target.value === ''
                                          ? null
                                          : Math.round(Number(event.target.value) * 100),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label htmlFor="referee-max-discount" className={labelClass}>
                                  Mức giảm tối đa (đ)
                                </label>
                                <input
                                  id="referee-max-discount"
                                  className={fieldClass}
                                  type="number"
                                  min={1}
                                  placeholder="Không giới hạn"
                                  value={program.refereeMaxDiscountAmount ?? ''}
                                  onChange={(event) =>
                                    setProgram({
                                      ...program,
                                      refereeMaxDiscountAmount:
                                        event.target.value === ''
                                          ? null
                                          : Number(event.target.value),
                                    })
                                  }
                                />
                              </div>
                            </>
                          ) : (
                            <div>
                              <label htmlFor="referee-amount" className={labelClass}>
                                Số tiền giảm (đ)
                              </label>
                              <input
                                id="referee-amount"
                                className={fieldClass}
                                type="number"
                                required
                                min={1}
                                placeholder="Ví dụ: 20000"
                                value={program.refereeAmount ?? ''}
                                onChange={(event) =>
                                  setProgram({
                                    ...program,
                                    refereeAmount:
                                      event.target.value === '' ? null : Number(event.target.value),
                                  })
                                }
                              />
                            </div>
                          )}

                          {(program.refereeRewardType ?? 2) !== 4 && (
                            <div>
                              <label htmlFor="referee-min-order" className={labelClass}>
                                Giá trị đơn tối thiểu (đ)
                              </label>
                              <input
                                id="referee-min-order"
                                className={fieldClass}
                                type="number"
                                min={0}
                                placeholder="0"
                                value={program.refereeMinOrderAmount ?? ''}
                                onChange={(event) =>
                                  setProgram({
                                    ...program,
                                    refereeMinOrderAmount:
                                      event.target.value === '' ? null : Number(event.target.value),
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label htmlFor="referee-validity" className={labelClass}>
                              Hạn dùng (ngày)
                            </label>
                            <input
                              id="referee-validity"
                              className={fieldClass}
                              type="number"
                              required
                              min={1}
                              max={3650}
                              value={program.refereeValidityDays ?? 30}
                              onChange={(event) =>
                                setProgram({
                                  ...program,
                                  refereeValidityDays: Number(event.target.value),
                                })
                              }
                            />
                          </div>
                          <div>
                            <label htmlFor="referee-note" className={labelClass}>
                              Ghi chú hiển thị trên voucher
                            </label>
                            <input
                              id="referee-note"
                              className={fieldClass}
                              maxLength={500}
                              placeholder="Ví dụ: Quà chào mừng thành viên mới"
                              value={program.refereeNote ?? ''}
                              onChange={(event) =>
                                setProgram({ ...program, refereeNote: event.target.value || null })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                        Đang tắt quà tặng dành riêng cho người được mời. Bật công tắc phía trên để
                        cấu hình voucher chào mừng.
                      </div>
                    )}
                  </section>

                  {/* Section 3: Referrer Milestones */}
                  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                      <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                          Mốc thưởng Người giới thiệu
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Thiết lập quà tặng tương ứng khi người giới thiệu đạt các mốc số lượng bạn
                          bè.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={addMilestone}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <PlusIcon className="h-4 w-4 shrink-0" />
                        Thêm mốc
                      </button>
                    </div>

                    {program.milestones.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                          <ShootingStarIcon className="h-6 w-6" />
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                          Chưa có mốc thưởng nào
                        </h3>
                        <p className="mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400">
                          Thêm mốc thưởng để tự động gửi voucher hoặc ly miễn phí cho người giới
                          thiệu khi đạt chỉ tiêu bạn bè.
                        </p>
                        <button
                          type="button"
                          onClick={addMilestone}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Thêm mốc đầu tiên
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                          <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                            <tr>
                              <th className="px-4 py-3.5">Điều kiện</th>
                              <th className="w-28 px-4 py-3.5">Số bạn</th>
                              <th className="px-4 py-3.5">Loại quà</th>
                              <th className="min-w-[300px] px-4 py-3.5">Chi tiết phần thưởng</th>
                              <th className="w-32 px-4 py-3.5">Hạn (ngày)</th>
                              <th className="w-24 px-4 py-3.5 text-center">Áp dụng</th>
                              <th className="w-20 px-4 py-3.5 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {program.milestones.map((item, index) => (
                              <tr
                                key={item.id ?? `new-${index}`}
                                className={`transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30 ${
                                  item.active ? '' : 'opacity-65'
                                }`}
                              >
                                <td className="min-w-[165px] px-4 py-4 align-top">
                                  <select
                                    aria-label="Điều kiện"
                                    className={fieldClass}
                                    disabled={item.hasGrants}
                                    value={item.condition}
                                    onChange={(event) =>
                                      updateMilestone(index, {
                                        condition: Number(event.target.value),
                                      })
                                    }
                                  >
                                    <option value={1}>Đăng ký</option>
                                    <option value={2}>Đơn đầu tiên</option>
                                  </select>
                                  {item.hasGrants && (
                                    <span className="mt-1 block text-[11px] text-gray-400">
                                      Đã phát thưởng (khóa mốc)
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-4 align-top">
                                  <input
                                    aria-label="Số bạn"
                                    className={fieldClass}
                                    type="number"
                                    required
                                    min={1}
                                    disabled={item.hasGrants}
                                    value={item.threshold || ''}
                                    onChange={(event) =>
                                      updateMilestone(index, {
                                        threshold: Number(event.target.value),
                                      })
                                    }
                                  />
                                </td>

                                <td className="min-w-[180px] px-4 py-4 align-top">
                                  <select
                                    aria-label="Loại quà"
                                    className={fieldClass}
                                    value={item.rewardType}
                                    onChange={(event) =>
                                      updateMilestone(index, {
                                        rewardType: Number(event.target.value),
                                        amount: null,
                                        percentageBasisPoints: null,
                                        maxDiscountAmount: null,
                                        minOrderAmount: null,
                                        productId: null,
                                      })
                                    }
                                  >
                                    <option value={1}>Voucher giảm %</option>
                                    <option value={2}>Voucher giảm tiền</option>
                                    <option value={4}>Một ly miễn phí</option>
                                  </select>
                                </td>

                                <td className="px-4 py-4 align-top">
                                  <div className="space-y-3">
                                    {item.rewardType === 4 ? (
                                      <ProductPicker
                                        value={item.productId}
                                        onChange={(productId) =>
                                          updateMilestone(index, { productId })
                                        }
                                      />
                                    ) : item.rewardType === 1 ? (
                                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                          <label className={labelClass}>Phần trăm giảm (%)</label>
                                          <input
                                            className={fieldClass}
                                            type="number"
                                            required
                                            min={0.01}
                                            max={100}
                                            step={0.01}
                                            placeholder="Ví dụ: 15"
                                            value={
                                              item.percentageBasisPoints == null
                                                ? ''
                                                : item.percentageBasisPoints / 100
                                            }
                                            onChange={(event) =>
                                              updateMilestone(index, {
                                                percentageBasisPoints:
                                                  event.target.value === ''
                                                    ? null
                                                    : Math.round(Number(event.target.value) * 100),
                                              })
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className={labelClass}>Mức giảm tối đa (đ)</label>
                                          <input
                                            className={fieldClass}
                                            type="number"
                                            min={1}
                                            placeholder="Không giới hạn"
                                            value={item.maxDiscountAmount ?? ''}
                                            onChange={(event) =>
                                              updateMilestone(index, {
                                                maxDiscountAmount:
                                                  event.target.value === ''
                                                    ? null
                                                    : Number(event.target.value),
                                              })
                                            }
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <label className={labelClass}>Số tiền giảm (đ)</label>
                                        <input
                                          className={fieldClass}
                                          type="number"
                                          required
                                          min={1}
                                          placeholder="Ví dụ: 25000"
                                          value={item.amount ?? ''}
                                          onChange={(event) =>
                                            updateMilestone(index, {
                                              amount:
                                                event.target.value === ''
                                                  ? null
                                                  : Number(event.target.value),
                                            })
                                          }
                                        />
                                      </div>
                                    )}

                                    <div
                                      className={`grid grid-cols-1 gap-3 ${
                                        item.rewardType !== 4 ? 'sm:grid-cols-2' : ''
                                      }`}
                                    >
                                      {item.rewardType !== 4 && (
                                        <div>
                                          <label className={labelClass}>
                                            Giá trị đơn tối thiểu (đ)
                                          </label>
                                          <input
                                            className={fieldClass}
                                            type="number"
                                            min={0}
                                            placeholder="0"
                                            value={item.minOrderAmount ?? ''}
                                            onChange={(event) =>
                                              updateMilestone(index, {
                                                minOrderAmount:
                                                  event.target.value === ''
                                                    ? null
                                                    : Number(event.target.value),
                                              })
                                            }
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <label className={labelClass}>Ghi chú</label>
                                        <input
                                          className={fieldClass}
                                          maxLength={500}
                                          placeholder="Mô tả ngắn…"
                                          value={item.note ?? ''}
                                          onChange={(event) =>
                                            updateMilestone(index, {
                                              note: event.target.value || null,
                                            })
                                          }
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-4 align-top">
                                  <input
                                    aria-label="Hạn dùng"
                                    className={fieldClass}
                                    type="number"
                                    required
                                    min={1}
                                    max={3650}
                                    value={item.validityDays || ''}
                                    onChange={(event) =>
                                      updateMilestone(index, {
                                        validityDays: Number(event.target.value),
                                      })
                                    }
                                  />
                                </td>

                                <td className="px-4 py-5 text-center align-top">
                                  <ToggleSwitch
                                    ariaLabel="Áp dụng mốc"
                                    checked={item.active}
                                    onChange={(checked) =>
                                      updateMilestone(index, { active: checked })
                                    }
                                  />
                                </td>

                                <td className="px-4 py-4 text-center align-top">
                                  <button
                                    type="button"
                                    aria-label="Xóa mốc thưởng"
                                    disabled={
                                      Boolean(item.hasGrants) ||
                                      (item.id != null && deletingId === item.id)
                                    }
                                    title={
                                      item.hasGrants
                                        ? 'Mốc đã phát thưởng, hãy tắt Áp dụng thay vì xóa'
                                        : 'Xóa mốc thưởng'
                                    }
                                    onClick={() => void removeMilestone(index, item)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-error-500 transition hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-35 dark:text-error-400 dark:hover:bg-error-500/10"
                                  >
                                    <TrashBinIcon className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-800/30">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mốc chưa từng phát thưởng có thể xóa hẳn; mốc đã phát thưởng được khóa ngưỡng
                        và chỉ có thể tắt công tắc Áp dụng.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={addMilestone}
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Thêm mốc
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
                        </button>
                      </div>
                    </div>
                  </section>
                </fieldset>
              </form>
            </>
          )}
        </>
      )}

      {/* TAB 2: ANALYTICS & TRACKING */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analyticsError && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-600 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              <div className="flex items-center gap-2.5">
                <AlertIcon className="h-5 w-5 shrink-0" />
                <span>{analyticsError}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadAnalytics()}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-error-200 bg-white px-4 font-medium text-error-600 transition hover:bg-error-50 dark:border-error-500/30 dark:bg-gray-900 dark:text-error-400"
              >
                Tải lại
              </button>
            </div>
          )}

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Tổng lượt giới thiệu
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalReferrals ?? 0}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tính đăng ký: {stats?.registeredCount ?? 0} • Đang chờ đơn đầu:{' '}
                {stats?.pendingFirstOrderCount ?? 0}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Hoàn tất đơn đầu tiên
              </div>
              <div className="mt-1 text-2xl font-bold text-success-600 dark:text-success-400">
                {stats?.qualifiedFirstOrderCount ?? 0}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tỷ lệ chuyển đổi:{' '}
                {stats && stats.totalReferrals > 0
                  ? `${Math.round((stats.qualifiedFirstOrderCount / stats.totalReferrals) * 100)}%`
                  : '0%'}{' '}
                • Hủy: {stats?.disqualifiedCount ?? 0}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Quà Người được mời
              </div>
              <div className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">
                {stats?.refereeVouchersRedeemed ?? 0} / {stats?.refereeVouchersIssued ?? 0}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Đã sử dụng / Tổng voucher đã phát
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Quà mốc Người giới thiệu
              </div>
              <div className="mt-1 text-2xl font-bold text-warning-600 dark:text-warning-400">
                {stats?.grantsRedeemed ?? 0} / {stats?.totalGrantsIssued ?? 0}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Đã sử dụng / Tổng mốc đã phát
              </div>
            </div>
          </div>

          {/* Top Referrers */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Top khách hàng giới thiệu tích cực
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Xếp hạng theo số lượng bạn bè hoàn tất đơn đầu tiên và tổng lượt đăng ký.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3.5">Khách hàng</th>
                    <th className="px-4 py-3.5">Mã giới thiệu</th>
                    <th className="px-4 py-3.5 text-right">Tổng lượt mời</th>
                    <th className="px-4 py-3.5 text-right">Hoàn tất đơn đầu</th>
                    <th className="px-6 py-3.5 text-right">Mốc quà đã nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {!stats || stats.topReferrers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        {analyticsLoading ? 'Đang tải dữ liệu…' : 'Chưa có lượt giới thiệu nào.'}
                      </td>
                    </tr>
                  ) : (
                    stats.topReferrers.map((row) => (
                      <tr key={row.referrerCustomerId}>
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {row.customerName}
                          </div>
                          {row.customerPhone && (
                            <div className="text-xs text-gray-500">{row.customerPhone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                          {row.code}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold">{row.totalInvited}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-success-600 dark:text-success-400">
                          {row.qualifiedCount}
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold">{row.grantsCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Referral History Table */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Lịch sử lượt giới thiệu
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Theo dõi chi tiết người mời, người được mời, trạng thái đơn đầu và voucher chào
                  mừng.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Tìm tên, SĐT, mã REF…"
                  value={referralKeyword}
                  onChange={(event) => {
                    setReferralKeyword(event.target.value);
                    setReferralPage(1);
                  }}
                  className="h-9 w-52 rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <select
                  aria-label="Lọc trạng thái giới thiệu"
                  value={referralStatus}
                  onChange={(event) => {
                    setReferralStatus(event.target.value);
                    setReferralPage(1);
                  }}
                  className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Registered">Đã đăng ký (chờ đơn đầu)</option>
                  <option value="CompletedFirstOrder">Đã hoàn tất đơn đầu</option>
                  <option value="Disqualified">Đơn bị hủy / Không hợp lệ</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3.5">Người giới thiệu</th>
                    <th className="px-4 py-3.5">Người được mời</th>
                    <th className="px-4 py-3.5">Thời gian nhập mã</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5">Voucher người được mời</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {!referrals || referrals.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        {analyticsLoading
                          ? 'Đang tải danh sách…'
                          : 'Không có lượt giới thiệu nào khớp bộ lọc.'}
                      </td>
                    </tr>
                  ) : (
                    referrals.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.referrerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.referrerCode}
                            {item.referrerPhone ? ` • ${item.referrerPhone}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.refereeName}
                          </div>
                          {item.refereePhone && (
                            <div className="text-xs text-gray-500">{item.refereePhone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-gray-400">
                          {formatDateTime(item.registeredAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              item.status === 'CompletedFirstOrder'
                                ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                                : item.status === 'Disqualified'
                                  ? 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
                                  : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                            }`}
                          >
                            {item.status === 'CompletedFirstOrder'
                              ? 'Đã xong đơn đầu'
                              : item.status === 'Disqualified'
                                ? 'Đơn hủy / Không hợp lệ'
                                : 'Đã đăng ký'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs">
                          {item.refereeVoucherCode ? (
                            <div>
                              <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
                                {item.refereeVoucherCode}
                              </span>
                              <span className="ml-2 text-gray-500">
                                ({item.refereeVoucherStatus})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {referrals && referrals.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-xs text-gray-500 dark:border-gray-800">
                <span>
                  Trang {referrals.page}/{referrals.totalPages} ({referrals.totalItems} lượt)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={referrals.page <= 1}
                    onClick={() => setReferralPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium disabled:opacity-40 dark:border-gray-700"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={referrals.page >= referrals.totalPages}
                    onClick={() => setReferralPage((p) => p + 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium disabled:opacity-40 dark:border-gray-700"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Milestone Grants Table */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Lịch sử voucher mốc đã phát cho Người giới thiệu
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Hiển thị chính xác phần thưởng đã snapshot vào voucher tại thời điểm khách đạt mốc.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3.5">Người nhận</th>
                    <th className="px-4 py-3.5">Mốc đạt</th>
                    <th className="px-4 py-3.5">Phần thưởng (Snapshot)</th>
                    <th className="px-4 py-3.5">Mã voucher</th>
                    <th className="px-6 py-3.5">Trạng thái &amp; Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {!grants || grants.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        {analyticsLoading
                          ? 'Đang tải lịch sử…'
                          : 'Chưa có voucher mốc nào được phát.'}
                      </td>
                    </tr>
                  ) : (
                    grants.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-3.5">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.referrerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.referrerCode}
                            {item.referrerPhone ? ` • ${item.referrerPhone}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium">
                          {item.condition === 1 ? 'Đăng ký' : 'Đơn đầu tiên'}: {item.threshold} bạn
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-gray-900 dark:text-white">
                          {formatGrantReward(item)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs">{item.voucherCode}</td>
                        <td className="px-6 py-3.5 text-xs text-gray-500">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {item.voucherStatus}
                          </span>{' '}
                          • Cấp: {formatDateTime(item.issuedAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {grants && grants.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-xs text-gray-500 dark:border-gray-800">
                <span>
                  Trang {grants.page}/{grants.totalPages} ({grants.totalItems} voucher)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={grants.page <= 1}
                    onClick={() => setGrantPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium disabled:opacity-40 dark:border-gray-700"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={grants.page >= grants.totalPages}
                    onClick={() => setGrantPage((p) => p + 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium disabled:opacity-40 dark:border-gray-700"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
