'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { apiClient } from '@/services/apiClient';
import { formatCurrency } from '@/utils/currency';

interface TrialProduct {
  productId: number;
  productName: string;
  code: string;
  price: number;
  createTime: string | null;
  isDisplayed: boolean;
}

interface TrialProductPage {
  items: TrialProduct[];
  page: number;
  total: number;
  totalPages: number;
}

export default function ProductTrialsPage() {
  const [result, setResult] = useState<TrialProductPage | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');
  const keyword = query.trim();

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({ q: keyword, page: String(page), size: String(size) });
      try {
        const { data } = await apiClient<{ data: TrialProductPage }>(`/brand/product-trials?${params}`);
        if (active) setResult(data);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Không thể tải sản phẩm.');
      } finally {
        if (active) setLoading(false);
      }
    }, keyword ? 250 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [keyword, page, size, revision]);

  function startLoad() {
    setLoading(true);
    setLoadError('');
  }

  async function toggle(product: TrialProduct) {
    if (savingId !== null) return;
    setSavingId(product.productId);
    try {
      await apiClient('/brand/product-trials/launch', {
        method: 'POST',
        body: JSON.stringify({ productId: product.productId, isDisplayed: !product.isDisplayed }),
      });
      startLoad();
      setRevision((previous) => previous + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật sản phẩm.');
    } finally {
      setSavingId(null);
    }
  }

  const columns: ColumnDef<TrialProduct>[] = [
    { accessorKey: 'code', header: 'Mã sản phẩm' },
    { accessorKey: 'productName', header: 'Sản phẩm' },
    { accessorKey: 'price', header: 'Giá bán', cell: ({ row }) => formatCurrency(row.original.price) },
    {
      accessorKey: 'createTime',
      header: 'Ngày tạo',
      cell: ({ row }) => row.original.createTime?.slice(0, 10).split('-').reverse().join('/') ?? '—',
    },
    {
      id: 'isDisplayed',
      header: 'Hiển thị',
      cell: ({ row: { original: product } }) => (
        <button
          type="button"
          role="switch"
          aria-label={`Hiển thị dùng thử: ${product.productName || product.code}`}
          aria-checked={product.isDisplayed}
          disabled={savingId !== null}
          onClick={() => void toggle(product)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${
            product.isDisplayed ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
            product.isDisplayed ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dùng thử sản phẩm</h1>
      <input
        type="search"
        aria-label="Tìm sản phẩm theo tên hoặc mã"
        placeholder="Tìm sản phẩm theo tên hoặc mã"
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          if (next.trim() !== keyword) {
            startLoad();
            setPage(1);
          }
          setQuery(next);
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 sm:max-w-sm"
      />
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? <SkeletonTable columns={5} rows={8} /> : loadError ? (
          <p role="alert" className="text-sm text-red-600">{loadError}</p>
        ) : (
          <DataTable
            columns={columns}
            data={result?.items ?? []}
            paginationMode="server"
            currentPage={result?.page ?? page}
            totalPages={result?.totalPages ?? 1}
            totalItems={result?.total ?? 0}
            pageSize={size}
            onPageChange={(next) => {
              if (next !== page) {
                startLoad();
                setPage(next);
              }
            }}
            onPageSizeChange={(next) => {
              if (next !== size) {
                startLoad();
                setSize(next);
                setPage(1);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
