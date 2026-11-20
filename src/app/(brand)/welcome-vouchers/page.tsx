'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertIcon,
  BoxCubeIcon,
  CheckCircleIcon,
  ShootingStarIcon,
  TimeIcon,
} from '@/icons';
import { apiClient } from '@/services/apiClient';

interface WelcomeVoucherConfig {
  brandId: number;
  isConfigured: boolean;
  version: string;
  enabled: boolean;
  voucherCount: number;
  rewardType: number;
  amount: number | null;
  percentageBasisPoints: number | null;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  productId: number | null;
  validityDays: number;
  note: string | null;
  updatedAt?: string;
}

interface ProductOption {
  id: number;
  productName: string;
  code: string;
}

const endpoint = '/brand/welcome-voucher';

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

function describeWelcomeOffer(config: WelcomeVoucherConfig) {
  if (!config.enabled) return 'Đang tắt phát voucher chào mừng';
  const count = config.voucherCount || 1;
  switch (config.rewardType) {
    case 1: {
      const pct = config.percentageBasisPoints ? config.percentageBasisPoints / 100 : 0;
      const cap =
        config.maxDiscountAmount && config.maxDiscountAmount > 0
          ? ` (tối đa ${config.maxDiscountAmount.toLocaleString('vi-VN')} đ)`
          : '';
      return `${count} voucher giảm ${pct}%${cap}`;
    }
    case 4:
      return `${count} voucher 1 ly miễn phí${config.productId ? ` (#${config.productId})` : ''}`;
    default: {
      const amt = config.amount ? `${config.amount.toLocaleString('vi-VN')} đ` : 'chưa nhập số tiền';
      return `${count} voucher giảm ${amt}`;
    }
  }
}

export default function WelcomeVouchersPage() {
  const [config, setConfig] = useState<WelcomeVoucherConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await apiClient<{ data: WelcomeVoucherConfig }>(endpoint);
      setConfig(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải cấu hình voucher chào mừng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!config || saving) return;
    setSaving(true);
    try {
      const payload: WelcomeVoucherConfig = config.enabled
        ? config
        : {
            ...config,
            voucherCount:
              config.voucherCount >= 1 && config.voucherCount <= 20 ? config.voucherCount : 5,
            validityDays:
              config.validityDays >= 1 && config.validityDays <= 3650 ? config.validityDays : 90,
          };
      const result = await apiClient<{ data: WelcomeVoucherConfig }>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setConfig(result.data);
      toast.success('Đã lưu cấu hình voucher chào mừng.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 text-gray-800 md:p-6 dark:text-gray-100">
      {/* Page Header */}
      <header className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
            <ShootingStarIcon className="h-6 w-6 shrink-0" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-title-sm dark:text-white">
                Voucher chào mừng tài khoản mới
              </h1>
              {config && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    !config.isConfigured
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                      : config.enabled
                        ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {!config.isConfigured
                    ? 'Đang dùng mặc định hệ thống'
                    : config.enabled
                      ? 'Đang bật'
                      : 'Đang tắt'}
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Tự động cấp bộ voucher chào mừng vào Ví ưu đãi cho mọi khách hàng mới đăng ký tài
              khoản hoặc ghi danh thành viên lần đầu.
            </p>
          </div>
        </div>

        {config && (
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/referral-program"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cấu hình Giới thiệu bạn bè
            </Link>
            <button
              type="submit"
              form="welcome-voucher-form"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
            </button>
          </div>
        )}
      </header>

      {/* Loading State */}
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
          <div className="h-72 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900" />
        </div>
      )}

      {/* Error State */}
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
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-error-200 bg-white px-4 font-medium text-error-600 transition hover:bg-error-50 dark:border-error-500/30 dark:bg-gray-900 dark:text-error-400"
          >
            Tải lại
          </button>
        </div>
      )}

      {/* Loaded Form */}
      {!loading && !error && config && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Gói quà chào mừng
                </div>
                <div className="mt-0.5 truncate text-lg font-bold text-gray-900 dark:text-white">
                  {describeWelcomeOffer(config)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
                <BoxCubeIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Điều kiện đơn tối thiểu
                </div>
                <div className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                  {config.rewardType === 4 || !config.minOrderAmount
                    ? 'Không yêu cầu'
                    : `${config.minOrderAmount.toLocaleString('vi-VN')} đ`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                <TimeIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Thời hạn hiệu lực
                </div>
                <div className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">
                  {config.validityDays} ngày kể từ lúc đăng ký
                </div>
              </div>
            </div>
          </div>

          <form id="welcome-voucher-form" onSubmit={save} className="space-y-6">
            <fieldset disabled={saving} className="space-y-6">
              <section className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      Thiết lập gói Voucher chào mừng
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Áp dụng cho khách hàng tạo tài khoản mới qua Email/SĐT, Google hoặc kích hoạt
                      thẻ thành viên lần đầu tiên tại thương hiệu.
                    </p>
                  </div>

                  <ToggleSwitch
                    ariaLabel="Bật phát voucher chào mừng cho tài khoản mới"
                    checked={config.enabled}
                    onChange={(enabled) => setConfig({ ...config, enabled })}
                  />
                </div>

                {config.enabled ? (
                  <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="welcome-count" className={labelClass}>
                          Số lượng voucher phát cho mỗi tài khoản mới (1–20)
                        </label>
                        <input
                          id="welcome-count"
                          type="number"
                          required
                          min={1}
                          max={20}
                          className={fieldClass}
                          value={config.voucherCount || ''}
                          onChange={(event) =>
                            setConfig({
                              ...config,
                              voucherCount: Number(event.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label htmlFor="welcome-reward-type" className={labelClass}>
                          Loại ưu đãi
                        </label>
                        <select
                          id="welcome-reward-type"
                          aria-label="Loại ưu đãi voucher chào mừng"
                          className={fieldClass}
                          value={config.rewardType}
                          onChange={(event) => {
                            const nextType = Number(event.target.value);
                            setConfig({
                              ...config,
                              rewardType: nextType,
                              amount: nextType === 2 ? (config.amount ?? 10000) : null,
                              percentageBasisPoints:
                                nextType === 1 ? (config.percentageBasisPoints ?? 1000) : null,
                              maxDiscountAmount:
                                nextType === 1 ? config.maxDiscountAmount : null,
                              minOrderAmount:
                                nextType === 4 ? null : (config.minOrderAmount ?? 30000),
                              productId: nextType === 4 ? config.productId : null,
                            });
                          }}
                        >
                          <option value={1}>Voucher giảm %</option>
                          <option value={2}>Voucher giảm tiền</option>
                          <option value={4}>Một ly miễn phí</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {config.rewardType === 4 ? (
                        <div>
                          <label className={labelClass}>Món thưởng miễn phí</label>
                          <ProductPicker
                            value={config.productId}
                            onChange={(productId) => setConfig({ ...config, productId })}
                          />
                        </div>
                      ) : config.rewardType === 1 ? (
                        <>
                          <div>
                            <label htmlFor="welcome-percent" className={labelClass}>
                              Phần trăm giảm (%)
                            </label>
                            <input
                              id="welcome-percent"
                              type="number"
                              required
                              min={0.01}
                              max={100}
                              step={0.01}
                              placeholder="Ví dụ: 15"
                              className={fieldClass}
                              value={
                                config.percentageBasisPoints == null
                                  ? ''
                                  : config.percentageBasisPoints / 100
                              }
                              onChange={(event) =>
                                setConfig({
                                  ...config,
                                  percentageBasisPoints:
                                    event.target.value === ''
                                      ? null
                                      : Math.round(Number(event.target.value) * 100),
                                })
                              }
                            />
                          </div>
                          <div>
                            <label htmlFor="welcome-max-discount" className={labelClass}>
                              Mức giảm tối đa (đ)
                            </label>
                            <input
                              id="welcome-max-discount"
                              type="number"
                              min={1}
                              placeholder="Không giới hạn"
                              className={fieldClass}
                              value={config.maxDiscountAmount ?? ''}
                              onChange={(event) =>
                                setConfig({
                                  ...config,
                                  maxDiscountAmount:
                                    event.target.value === '' ? null : Number(event.target.value),
                                })
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label htmlFor="welcome-amount" className={labelClass}>
                            Số tiền giảm mỗi voucher (đ)
                          </label>
                          <input
                            id="welcome-amount"
                            type="number"
                            required
                            min={1}
                            placeholder="Ví dụ: 10000"
                            className={fieldClass}
                            value={config.amount ?? ''}
                            onChange={(event) =>
                              setConfig({
                                ...config,
                                amount:
                                  event.target.value === '' ? null : Number(event.target.value),
                              })
                            }
                          />
                        </div>
                      )}

                      {config.rewardType !== 4 && (
                        <div>
                          <label htmlFor="welcome-min-order" className={labelClass}>
                            Giá trị đơn hàng tối thiểu (đ)
                          </label>
                          <input
                            id="welcome-min-order"
                            type="number"
                            min={0}
                            placeholder="0"
                            className={fieldClass}
                            value={config.minOrderAmount ?? ''}
                            onChange={(event) =>
                              setConfig({
                                ...config,
                                minOrderAmount:
                                  event.target.value === '' ? null : Number(event.target.value),
                              })
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="welcome-validity" className={labelClass}>
                          Hạn sử dụng (ngày)
                        </label>
                        <input
                          id="welcome-validity"
                          type="number"
                          required
                          min={1}
                          max={3650}
                          className={fieldClass}
                          value={config.validityDays || ''}
                          onChange={(event) =>
                            setConfig({
                              ...config,
                              validityDays: Number(event.target.value),
                            })
                          }
                        />
                      </div>

                      <div>
                        <label htmlFor="welcome-note" className={labelClass}>
                          Ghi chú hiển thị trên voucher
                        </label>
                        <input
                          id="welcome-note"
                          maxLength={500}
                          placeholder="Ví dụ: Ưu đãi chào mừng thành viên mới"
                          className={fieldClass}
                          value={config.note ?? ''}
                          onChange={(event) =>
                            setConfig({
                              ...config,
                              note: event.target.value || null,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-5 text-sm text-gray-500 dark:text-gray-400">
                    Tính năng tự động tặng voucher chào mừng cho tài khoản mới hiện đang tắt. Bật
                    công tắc phía trên và bấm &quot;Lưu cấu hình&quot; để kích hoạt lại.
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-800/30">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Lưu ý: Nếu tài khoản mới đồng thời nhập mã giới thiệu hợp lệ, khách sẽ nhận gói
                    Voucher chào mừng này cùng với quà Người được mời (nếu chương trình giới thiệu
                    đang bật).
                  </p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
                  </button>
                </div>
              </section>
            </fieldset>
          </form>
        </>
      )}
    </div>
  );
}
