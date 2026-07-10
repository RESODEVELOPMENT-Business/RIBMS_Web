'use client';

import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  PaginationState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  paginationMode?: 'client' | 'server';
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  pageSizeOptions = [10, 20, 50, 100],
  defaultPageSize = 10,
  paginationMode = 'client',
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(paginationMode === 'client' ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    ...(paginationMode === 'client' ? { onPaginationChange: setPagination } : {}),
    ...(paginationMode === 'server' ? { manualPagination: true, pageCount: totalPages } : {}),
    state: {
      sorting,
      columnFilters,
      ...(paginationMode === 'client' ? { pagination } : {}),
    },
  });

  const activePage = paginationMode === 'server' ? currentPage : table.getState().pagination.pageIndex + 1;
  const activeTotalPages = paginationMode === 'server' ? totalPages : table.getPageCount() || 1;
  const totalRowCount = paginationMode === 'server' ? (totalItems ?? data.length) : table.getFilteredRowModel().rows.length;

  const handlePageSizeChange = (value: number) => {
    if (paginationMode === 'server') {
      onPageSizeChange?.(value);
      return;
    }

    table.setPageSize(value);
  };

  const handlePreviousPage = () => {
    if (paginationMode === 'server') {
      onPageChange?.(Math.max(activePage - 1, 1));
      return;
    }

    table.previousPage();
  };

  const handleNextPage = () => {
    if (paginationMode === 'server') {
      onPageChange?.(Math.min(activePage + 1, activeTotalPages));
      return;
    }

    table.nextPage();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-xl shadow-gray-100/50 dark:shadow-none space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {searchKey ? (
            <div className="w-full md:w-80 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Tìm kiếm
              </label>
              <input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none dark:text-white"
              />
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Hiển thị</span>
            <select
              value={paginationMode === 'server' ? (pageSize ?? defaultPageSize) : table.getState().pagination.pageSize}
              onChange={(event) => handlePageSizeChange(Number(event.target.value))}
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:border-brand-500 dark:bg-gray-800 dark:text-white"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} dòng
                </option>
              ))}
            </select>
            <span>
              trong tổng số <b>{totalRowCount}</b> kết quả
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-gray-100/50 dark:shadow-none overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableCell key={header.id} isHeader className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500 dark:text-gray-400">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Trang <b>{activePage}</b> / <b>{activeTotalPages}</b>
        </span>

        <div className="flex items-center gap-2">
          <button
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handlePreviousPage}
            disabled={paginationMode === 'server' ? activePage <= 1 : !table.getCanPreviousPage()}
          >
            Trang Trước
          </button>
          <button
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleNextPage}
            disabled={paginationMode === 'server' ? activePage >= activeTotalPages : !table.getCanNextPage()}
          >
            Trang Sau
          </button>
        </div>
      </div>
    </div>
  );
}
