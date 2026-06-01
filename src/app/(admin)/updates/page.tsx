'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { triggerAdminUpdate } from '@/services/updates';

export default function UpdatesPage() {
  const [isTriggering, setIsTriggering] = useState(false);

  const handleForceUpdate = async () => {
    setIsTriggering(true);
    try {
      await triggerAdminUpdate();
      toast.success('Đã kích hoạt update cưỡng chế cho POS.');
    } catch (error: any) {
      toast.error(error?.message || 'Không thể kích hoạt update.');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 dark:text-brand-300">
          System Update
        </p>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          POS Update Control
        </h1>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Force update POS
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gọi API admin trigger để POS nhận cờ cưỡng chế update.
            </p>
          </div>

          <button
            type="button"
            onClick={handleForceUpdate}
            disabled={isTriggering}
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTriggering ? 'Đang kích hoạt...' : 'Kích hoạt update cưỡng chế'}
          </button>
        </div>
      </div>
    </div>
  );
}