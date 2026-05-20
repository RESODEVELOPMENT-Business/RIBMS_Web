'use client';

import React, { useState, useMemo } from 'react';

export default function TopStoreRevenuesTable({ data }: { data: any[] }) {
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    return data.filter(item => item.storeName?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data, searchTerm]);

  const displayData = filteredData.slice(0, pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Hiển thị</span>
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 outline-none focus:border-emerald-500"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
          <span>dòng</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Tìm kiếm:</span>
          <input 
            type="text" 
            placeholder="Tên cửa hàng" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 outline-none focus:border-emerald-500 min-w-[250px]"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-[#00a651] text-white">
            <tr>
              <th className="px-4 py-3 text-center font-semibold border-r border-[#009045]">STT</th>
              <th className="px-4 py-3 text-left font-semibold border-r border-[#009045]">Tên cửa hàng</th>
              <th className="px-4 py-3 text-center font-semibold border-r border-[#009045]">Quận</th>
              <th className="px-4 py-3 text-right font-semibold border-r border-[#009045]">Tổng sản<br/>phẩm</th>
              <th className="px-4 py-3 text-right font-semibold border-r border-[#009045]">Hóa Đơn Bán<br/>Hàng</th>
              <th className="px-4 py-3 text-right font-semibold border-r border-[#009045]">Trung Bình<br/>Bill</th>
              <th className="px-4 py-3 text-right font-semibold border-r border-[#009045]">DT trước giảm<br/>giá</th>
              <th className="px-4 py-3 text-right font-semibold border-r border-[#009045]">Giảm giá</th>
              <th className="px-4 py-3 text-right font-semibold border-r border-[#009045]">Doanh thu sau<br/>giảm</th>
              <th className="px-4 py-3 text-right font-semibold border-r border-[#009045]">Hóa đơn<br/>nạp thẻ</th>
              <th className="px-4 py-3 text-right font-semibold">Doanh thu<br/>nạp thẻ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, index) => (
              <tr key={row.storeId} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-center text-gray-500 border-r">{index + 1}</td>
                <td className="px-4 py-2.5 text-gray-700 font-medium border-r">{row.storeName}</td>
                <td className="px-4 py-2.5 text-center text-gray-600 border-r">{row.districtName}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.totalProducts)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.salesInvoices)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.averageBill)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.revenueBeforeDiscount)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.discount)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.revenueAfterDiscount)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.cardTopUpInvoices)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">{new Intl.NumberFormat('en-US').format(row.cardTopUpRevenue)}</td>
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-gray-500">Không tìm thấy dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
