'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { requestInvoice, getInvoiceRequestLink } from '@/services/invoices';

function InvoiceRequestForm() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode') || '';

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [expired, setExpired] = useState(false);

  const [buyerName, setBuyerName] = useState('');
  const [buyerTaxCode, setBuyerTaxCode] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (orderCode) {
      fetchOrderInfo();
    } else {
      setLoading(false);
      toast.error('Thiếu mã đơn hàng');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode]);

  const fetchOrderInfo = async () => {
    try {
      const res = await getInvoiceRequestLink(orderCode);
      const data = res?.data?.data || res?.data;
      if (data) {
        setOrder(data);
        if (data.invoiceRequestExpireAt) {
          const expireAt = new Date(data.invoiceRequestExpireAt);
          if (expireAt < new Date()) {
            setExpired(true);
          }
        }
        if (data.isCustomerRequested) {
          setSubmitted(true);
        }
      } else {
        toast.error('Không tìm thấy đơn hàng');
      }
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      toast.error('Vui lòng nhập tên người mua');
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestInvoice(orderCode, {
        buyerName: buyerName.trim(),
        buyerTaxCode: buyerTaxCode.trim() || undefined,
        buyerEmail: buyerEmail.trim() || undefined,
        buyerAddress: buyerAddress.trim() || undefined,
        buyerPhoneNumber: buyerPhone.trim() || undefined,
      });
      const status = res?.status ?? res?.data?.status;
      if (status === 200) {
        toast.success('Yêu cầu xuất hóa đơn thành công!');
        setSubmitted(true);
      } else {
        toast.error(res?.data?.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Yêu cầu xuất hóa đơn</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Đơn hàng: {orderCode || '---'}</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải...</p>
          </div>
        ) : expired ? (
          <div className="text-center py-6">
            <div className="text-amber-500 text-4xl mb-3">&#128337;</div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Đã hết hạn yêu cầu</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Link yêu cầu xuất hóa đơn đã hết hạn sau 4 giờ. Hóa đơn sẽ được xuất tự động theo cấu hình của cửa hàng.
            </p>
          </div>
        ) : submitted ? (
          <div className="text-center py-6">
            <div className="text-emerald-500 text-4xl mb-3">&#10003;</div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Đã nhận yêu cầu</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Yêu cầu xuất hóa đơn của bạn đã được ghi nhận. Hóa đơn sẽ được gửi qua email trong thời gian sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên người mua / Tên công ty <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="VD: Công ty TNHH ABC"
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mã số thuế (nếu có)
              </label>
              <input
                type="text"
                value={buyerTaxCode}
                onChange={(e) => setBuyerTaxCode(e.target.value)}
                placeholder="VD: 0123456789"
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email nhận hóa đơn
              </label>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="VD: email@company.com"
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu xuất hóa đơn'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Mỗi bill chỉ có 4 giờ để yêu cầu xuất hóa đơn. Sau 4 giờ hệ thống sẽ tự động xuất theo cấu hình của cửa hàng.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function InvoiceRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Đang tải...</p>
        </div>
      </div>
    }>
      <InvoiceRequestForm />
    </Suspense>
  );
}
