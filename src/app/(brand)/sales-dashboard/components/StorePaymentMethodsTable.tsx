'use client';

import React, { useMemo, useState } from 'react';

export default function StorePaymentMethodsTable({
  data,
}: {
  data: any[];
}) {
  const [pageSize, setPageSize] = useState(100);

  const displayData = data.slice(0, pageSize);

  const paymentMethods = useMemo(() => {
    const map = new Map<number, string>();

    data.forEach((store) => {
      store.paymentMethodRevenues?.forEach((payment: any) => {
        map.set(payment.paymentType, payment.paymentTypeName);
      });
    });

    return Array.from(map.entries())
      .map(([paymentType, paymentTypeName]) => ({
        paymentType,
        paymentTypeName,
      }))
      .sort((a, b) =>
        a.paymentTypeName.localeCompare(b.paymentTypeName)
      );
  }, [data]);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('en-US').format(value || 0);

  const getPaymentAmount = (
    row: any,
    paymentType: number
  ) => {
    const payment = row.paymentMethodRevenues?.find(
      (x: any) => x.paymentType === paymentType
    );

    return payment?.amount || 0;
  };

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
              <th className="px-4 py-3 text-center font-semibold border-r border-[#009045] whitespace-nowrap">
                Cửa hàng
              </th>

              {paymentMethods.map((payment) => (
                <th
                  key={payment.paymentType}
                  className="px-4 py-3 text-center font-semibold border-r border-[#009045] whitespace-nowrap"
                >
                  {payment.paymentTypeName}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row) => (
              <tr
                key={row.storeId}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-2.5 text-gray-700 font-medium border-r whitespace-nowrap">
                  {row.storeName}
                </td>

                {paymentMethods.map((payment) => (
                  <td
                    key={payment.paymentType}
                    className="px-4 py-2.5 text-right text-gray-600 border-r whitespace-nowrap"
                  >
                    {formatMoney(
                      getPaymentAmount(
                        row,
                        payment.paymentType
                      )
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {displayData.length === 0 && (
              <tr>
                <td
                  colSpan={paymentMethods.length + 1}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  Không tìm thấy dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}