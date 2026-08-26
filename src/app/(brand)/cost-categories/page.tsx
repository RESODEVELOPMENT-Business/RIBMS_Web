'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  CostCategory,
  CostCategoryType,
  createCostCategory,
  deleteCostCategory,
  getCostCategories,
  updateCostCategory,
} from '@/services/costs';

const unwrapItems = <T,>(payload: any): T[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;

  return [];
};

const typeLabel = (type: CostCategoryType | null | undefined) => (type === 1 ? '% doanh thu' : 'VND');

export default function CostCategoriesPage() {
  const [data, setData] = useState<CostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CostCategoryType>(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<CostCategoryType>(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const brandId = useAuthStore.getState().user?.brandId;
      const res = await getCostCategories(page, size, brandId || undefined);
      setData(unwrapItems<CostCategory>(res));
      const payload = res?.data ?? res;
      setTotalPages(payload?.totalPages || 1);
      setTotalItems(payload?.total || unwrapItems<CostCategory>(res).length || 0);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh mục chi phí');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, size]);

  const startEdit = (item: CostCategory) => {
    setEditingId(item.catId);
    setEditName(item.catName);
    setEditType((item.type ?? 0) as CostCategoryType);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditType(0);
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setCreating(true);
    try {
      await createCostCategory({ catName: newName.trim(), type: newType });
      toast.success('Đã tạo danh mục chi phí');
      setNewName('');
      setNewType(0);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể tạo danh mục chi phí');
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (id: number) => {
    if (!editName.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setSavingId(id);
    try {
      await updateCostCategory(id, { catName: editName.trim(), type: editType });
      toast.success('Đã cập nhật danh mục chi phí');
      cancelEdit();
      await fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể cập nhật danh mục chi phí');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa danh mục chi phí này?')) return;

    try {
      await deleteCostCategory(id);
      toast.success('Đã xóa danh mục chi phí');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể xóa danh mục chi phí');
    }
  };

  const columns = useMemo<ColumnDef<CostCategory>[]>(() => [
    {
      accessorKey: 'catId',
      header: 'ID',
    },
    {
      accessorKey: 'catName',
      header: 'Tên danh mục',
      cell: ({ row }) => {
        const item = row.original;
        return editingId === item.catId ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full max-w-md border rounded-md px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        ) : (
          <span className="font-medium text-gray-800 dark:text-white">{item.catName}</span>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Loại',
      cell: ({ row }) => {
        const item = row.original;
        return editingId === item.catId ? (
          <select
            value={editType}
            onChange={(e) => setEditType(Number(e.target.value) as CostCategoryType)}
            className="border rounded-md px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value={0}>VND</option>
            <option value={1}>% doanh thu</option>
          </select>
        ) : (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.type === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
            {typeLabel(item.type)}
          </span>
        );
      },
    },
    {
      accessorKey: 'active',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const isActive = !!row.original.active;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const item = row.original;
        const isEditing = editingId === item.catId;

        if (isEditing) {
          return (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleSave(item.catId)}
                disabled={savingId === item.catId}
                className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
              >
                {savingId === item.catId ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 font-medium">
                Hủy
              </button>
            </div>
          );
        }

        return (
          <div className="flex justify-end gap-3">
            <Link href={`/cost-categories/${item.catId}`} className="text-gray-600 hover:text-gray-800 font-medium">
              Chi tiết
            </Link>
            <button onClick={() => startEdit(item)} className="text-brand-500 hover:text-brand-600 font-medium">
              Sửa
            </button>
            <button onClick={() => handleDelete(item.catId)} className="text-red-500 hover:text-red-600 font-medium">
              Xóa
            </button>
          </div>
        );
      },
    },
  ], [cancelEdit, editingId, editName, editType, savingId]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Danh mục chi phí</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý danh mục chi phí của thương hiệu.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Tên danh mục</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ví dụ: Chi phí vận chuyển"
              className="w-full sm:w-72 border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Loại</label>
            <select
              value={newType}
              onChange={(e) => setNewType(Number(e.target.value) as CostCategoryType)}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value={0}>VND</option>
              <option value={1}>% doanh thu</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {creating ? 'Đang tạo...' : '+ Tạo danh mục'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? (
          <SkeletonTable columns={4} rows={8} />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchKey="catName"
            searchPlaceholder="Tìm theo tên danh mục..."
            paginationMode="server"
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={size}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setSize(nextSize);
              setPage(1);
            }}
            defaultPageSize={size}
          />
        )}
      </div>
    </div>
  );
}