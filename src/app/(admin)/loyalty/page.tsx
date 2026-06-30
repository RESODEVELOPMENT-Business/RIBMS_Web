'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/services/apiClient';
import { addSuperVip, removeSuperVip } from '@/services/loyalty';
import { DataTable } from '@/components/ui/data-table';
import { SkeletonTable } from '@/components/ui/skeleton-table';
import { Modal } from '@/components/ui/modal';
import { ColumnDef } from '@tanstack/react-table';
import { PlusIcon } from '@/icons';

export default function LoyaltyAdminPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'supervip'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [superVips, setSuperVips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const res = await api.get('/loyalty/stats');
        setStats(res?.data || null);
      } else {
        const res = await api.get('/admin/super-vip/list');
        setSuperVips(res?.data || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const searchCustomers = async (q: string) => {
    if (q.length < 2) { setCustomerResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/admin/customers/search?q=${encodeURIComponent(q)}`);
      setCustomerResults(res?.data || []);
    } catch { setCustomerResults([]); }
    finally { setSearching(false); }
  };

  const handleAdd = async () => {
    if (!selectedCustomer) { toast.error('Select a customer'); return; }
    setSubmitting(true);
    try {
      await addSuperVip(selectedCustomer.customerId);
      toast.success(`Super VIP added: ${selectedCustomer.name}`);
      setShowModal(false);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setCustomerResults([]);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleRemove = async (customerId: number) => {
    if (!confirm('Remove Super VIP status from this customer?')) return;
    try {
      await api.delete(`/admin/super-vip/remove/${customerId}`);
      toast.success('Super VIP removed');
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'externalId', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'enrolledAt', header: 'Member Since',
      cell: ({ row }) => {
        const d = row.original.enrolledAt;
        return d ? new Date(d).toLocaleDateString('vi-VN') : '—';
      },
    },
    { id: 'actions', header: '', width: 50,
      cell: ({ row }) => (
        <button onClick={() => handleRemove(Number(row.original.externalId))}
          className="text-red-500 hover:text-red-700 text-lg" title="Remove">✕</button>
      )
    },
  ], []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Loyalty Management</h1>
      <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
        <button onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-t font-medium text-sm ${activeTab === 'stats' ? 'bg-white dark:bg-gray-800 border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          📊 Stats
        </button>
        <button onClick={() => setActiveTab('supervip')}
          className={`px-4 py-2 rounded-t font-medium text-sm ${activeTab === 'supervip' ? 'bg-white dark:bg-gray-800 border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
          ⭐ Super VIP
        </button>
      </div>

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Members', value: stats?.totalMembers ?? '—', color: '#2563EB' },
            { label: 'Active Orders (30d)', value: stats?.active30d ?? '—', color: '#16A34A' },
            { label: 'Completed Orders (30d)', value: stats?.totalOrders30d ?? '—', color: '#0D9488' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p style={{ color: s.color }} className="text-2xl font-bold mt-2">{String(s.value)}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'supervip' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
              <PlusIcon /> Add Super VIP
            </button>
          </div>
          <div className="bg-white rounded-lg shadow dark:bg-gray-800 p-6">
            {loading ? <SkeletonTable columns={6} rows={5} /> : (
              <DataTable columns={columns} data={superVips} searchKey="customerName" searchPlaceholder="Search..." />
            )}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedCustomer(null); setCustomerSearch(''); setCustomerResults([]); }} className="max-w-lg">
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">Add Super VIP</h2>

          {!selectedCustomer ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium">Search Customer</label>
              <input type="text" value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                placeholder="Type name, phone or email..." className="w-full border rounded-lg px-3 py-2 text-sm" />
              {searching && <p className="text-sm text-gray-400">Searching...</p>}
              {customerResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                  {customerResults.map((c: any) => (
                    <div key={c.customerId}
                      onClick={() => { setSelectedCustomer(c); setCustomerResults([]); }}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone} · {c.email}</p>
                      </div>
                      <span className="text-xs text-gray-400">ID: {c.customerId}</span>
                    </div>
                  ))}
                </div>
              )}
              {customerSearch.length >= 2 && customerResults.length === 0 && !searching && (
                <p className="text-sm text-gray-400">No customers found</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-xs text-gray-500">{selectedCustomer.phone} · ID: {selectedCustomer.customerId}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-red-500 text-sm">Change</button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setShowModal(false); setSelectedCustomer(null); setCustomerSearch(''); }}
                  className="px-4 py-2 border rounded text-sm">Cancel</button>
                <button onClick={handleAdd} disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Add Super VIP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
