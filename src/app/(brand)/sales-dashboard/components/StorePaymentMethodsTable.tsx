'use client';

import React, { useState } from 'react';

export default function StorePaymentMethodsTable({ data }: { data: any[] }) {
  const [pageSize, setPageSize] = useState(100);

  const displayData = data.slice(0, pageSize);

  return (
    <div className="space-y-4">
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

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-[#00a651] text-white">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-center font-semibold border-r border-b border-[#009045] align-middle">Cửa hàng</th>
              <th rowSpan={2} className="px-4 py-3 text-center font-semibold border-r border-b border-[#009045] align-middle">Tiền mặt bán<br/>hàng</th>
              <th rowSpan={2} className="px-4 py-3 text-center font-semibold border-r border-b border-[#009045] align-middle">Tiền mặt<br/>nạp thẻ</th>
              <th rowSpan={2} className="px-4 py-3 text-center font-semibold border-r border-b border-[#009045] align-middle">Tiền sử dụng<br/>TTV</th>
              <th rowSpan={2} className="px-4 py-3 text-center font-semibold border-r border-b border-[#009045] align-middle">Ngân hàng</th>
              <th colSpan={7} className="px-4 py-2 text-center font-semibold border-b border-[#009045]">Ví điện tử</th>
            </tr>
            <tr>
              <th className="px-3 py-2 text-center font-semibold border-r border-[#009045] border-t border-t-[#009045]">Momo</th>
              <th className="px-3 py-2 text-center font-semibold border-r border-[#009045] border-t border-t-[#009045]">Grabpay</th>
              <th className="px-3 py-2 text-center font-semibold border-r border-[#009045] border-t border-t-[#009045]">Grabfood</th>
              <th className="px-3 py-2 text-center font-semibold border-r border-[#009045] border-t border-t-[#009045]">VnPay</th>
              <th className="px-3 py-2 text-center font-semibold border-r border-[#009045] border-t border-t-[#009045]">BaeMin</th>
              <th className="px-3 py-2 text-center font-semibold border-r border-[#009045] border-t border-t-[#009045]">Shopeepay</th>
              <th className="px-3 py-2 text-center font-semibold border-t border-t-[#009045]">ZaloPay</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row) => (
              <tr key={row.storeId} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-700 font-medium border-r">{row.storeName}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.cashFromSales)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.cashFromCardTopUp)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.ttvUsage)}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.bank)}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.momo)}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.grabpay)}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.grabfood)}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.vnPay)}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.baeMin)}</td>
                <td className="px-3 py-2.5 text-right text-gray-600 border-r">{new Intl.NumberFormat('en-US').format(row.shopeepay)}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">{new Intl.NumberFormat('en-US').format(row.zaloPay)}</td>
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500">Không tìm thấy dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
