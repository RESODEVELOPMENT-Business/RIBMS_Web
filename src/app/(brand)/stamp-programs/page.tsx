'use client';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getStampPrograms, CONDITION_TYPE_LABELS } from '@/services/stampPrograms';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { ColumnDef } from '@tanstack/react-table';
import { PencilIcon } from '@/icons';

export default function StampProgramListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async (pageNum = page, pageSize = size) => {
    setLoading(true);
    try {
      const res = await getStampPrograms(pageNum, pageSize);
      if (res?.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setData(items);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || items.length);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, size]);

  useEffect(() => { fetchData(page, size); }, [fetchData, page, size]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'id', header: 'ID' },
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{String(info.getValue())}</span>,
    },
    {
      id: 'conditions',
      header: 'Conditions',
      cell: ({ row }) => {
        const conds: any[] = row.original.conditions || [];
        const labels = conds.map((c: any) => `${CONDITION_TYPE_LABELS[+c.conditionType] || c.conditionType}: ${c.value}`);
        return <span className="text-xs text-gray-600 dark:text-gray-400">{labels.join(', ') || '—'}</span>;
      },
    },
    {
      id: 'tiers',
      header: 'Reward Tiers',
      cell: ({ row }) => {
        const tiers: any[] = row.original.rewardTiers || [];
        return <span className="text-xs">{tiers.map(t => `${t.stampRequired} stamps → ${t.rewardDescription}`).join(', ') || '—'}</span>;
      },
    },
    {
      accessorKey: 'toDate',
      header: 'Active Until',
      cell: ({ row }) => {
        const d = row.original.toDate;
        return <span className="text-xs text-gray-500">{d ? new Date(d).toLocaleDateString('vi-VN') : '∞'}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const a = row.original.isActive;
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${a ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{a ? 'Active' : 'Inactive'}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-3">
          <Link href={`/stamp-programs/${row.original.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
            <PencilIcon className="w-4 h-4" /> Details
          </Link>
        </div>
      ),
    },
  ], []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Stamp Program Management</h1>
        <Link href="/stamp-programs/create" className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium text-sm shadow-sm">+ Create Program</Link>
      </div>
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
        {loading ? <SkeletonTable columns={7} rows={8} /> : (
          <DataTable columns={columns} data={data} searchKey="displayName" searchPlaceholder="Search..."
            paginationMode="server" currentPage={page} totalPages={totalPages} totalItems={totalItems}
            pageSize={size} onPageChange={setPage} onPageSizeChange={(s) => { setSize(s); setPage(1); }} defaultPageSize={size} />
        )}
      </div>
    </div>
  );
}
