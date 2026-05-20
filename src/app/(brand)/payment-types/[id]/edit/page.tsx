'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getPaymentTypeById, updatePaymentType } from '@/services/paymentTypes';

export default function EditPaymentTypePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const paymentTypeId = params?.id;
  const [paymentType, setPaymentType] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentTypeId) return;
    fetchPaymentType();
  }, [paymentTypeId]);

  const fetchPaymentType = async () => {
    try {
      const res = await getPaymentTypeById(paymentTypeId);
      if (res && res.data) {
        setPaymentType(res.data);
      }
    } catch (error) {
      console.error('Error fetching payment type:', error);
      toast.error('Failed to load payment type');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      Name: String(formData.get('Name') || '').trim(),
      Position: formData.get('Position') ? Number(formData.get('Position')) : null,
      Icon: String(formData.get('Icon') || '').trim() || null,
      IsDisplay: formData.get('IsDisplay') === 'on',
      IsComfirm: formData.get('IsComfirm') === 'on',
    };

    try {
      if (!paymentTypeId) {
        toast.error('Missing payment type id');
        return;
      }
      await updatePaymentType(paymentTypeId, payload);
      toast.success('Payment type updated successfully');
      router.push('/payment-types');
    } catch (err: any) {
      toast.error(`Error updating payment type: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !paymentType) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentType) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-red-500">Payment type not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">&larr; Back</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Edit Payment Type</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update the label and visibility used in POS checkout</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" name="Name" defaultValue={paymentType?.name || paymentType?.Name || ''} required />
          <Field label="Position" name="Position" type="number" defaultValue={paymentType?.position ?? paymentType?.Position ?? ''} />
          <Field label="Icon" name="Icon" defaultValue={paymentType?.icon || paymentType?.Icon || ''} />

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
            <input type="checkbox" name="IsDisplay" defaultChecked={paymentType?.isDisplay ?? paymentType?.IsDisplay} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            Display in POS
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
            <input type="checkbox" name="IsComfirm" defaultChecked={paymentType?.isComfirm ?? paymentType?.IsComfirm} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            Require confirmation
          </label>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors disabled:opacity-60">{loading ? 'Saving...' : 'Update Payment Type'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text', defaultValue, required = false }: { label: string; name: string; type?: string; defaultValue?: string | number; required?: boolean }) {
  return (
    <label className="block md:col-span-1">
      <span className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{label}</span>
      <input required={required} type={type} name={name} defaultValue={defaultValue as any} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors" />
    </label>
  );
}