'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createPaymentType } from '@/services/paymentTypes';

export default function CreatePaymentTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
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
      await createPaymentType(payload);
      toast.success('Payment type created successfully');
      router.push('/payment-types');
    } catch (err: any) {
      toast.error(`Error creating payment type: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">&larr; Back</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create Payment Type</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create a brand payment option for POS checkout</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" name="Name" required />
          <Field label="Position" name="Position" type="number" />
          <Field label="Icon" name="Icon" />

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
            <input type="checkbox" name="IsDisplay" defaultChecked className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            Display in POS
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
            <input type="checkbox" name="IsComfirm" className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            Require confirmation
          </label>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors disabled:opacity-60">{loading ? 'Saving...' : 'Create Payment Type'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="block md:col-span-1">
      <span className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{label}</span>
      <input required={required} type={type} name={name} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-colors" />
    </label>
  );
}