'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/services/apiClient';
import { addSuperVip, removeSuperVip, changeTier } from '@/services/loyalty';
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
  const [brands, setBrands] = useState<any[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | ''>('');

  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);

  // Load brands on mount
  useEffect(() => {
    api.get('/brands?page=1&size=50').then(res => {
      const items = res?.data?.items || res?.data || [];
      setBrands(items);
      if (items.length > 0) setSelectedBrandId(items[0].id);
    }).catch(() => {});
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const url = selectedBrandId ? `/loyalty/stats?brandId=${selectedBrandId}` : '/loyalty/stats';
        const res = await api.get(url);
        setStats(res?.data || null);
      } else {
        const res = await api.get('/admin/super-vip/list');
        setSuperVips(res?.data || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, [activeTab, selectedBrandId]);

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

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'externalId', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'balance', header: 'Points',
      cell: ({ row }) => row.original.balance ?? 0,
    },
    { accessorKey: 'currentTierName', header: 'Tier',
      cell: ({ row }) => {
        const item = row.original;
        const currentTier = item.isSuperVip ? 'SUPERVIP' : 'BASESPEND';
        return (
          <select
            value={currentTier}
            onChange={async (e) => {
              const val = e.target.value;
              try {
                if (val === 'SUPERVIP') {
                  await addSuperVip(Number(item.externalId));
                  toast.success(`Super VIP status activated: ${item.name}`);
                } else {
                  await removeSuperVip(Number(item.externalId));
                  toast.success(`Reset to spend-based tier: ${item.name}`);
                }
                fetchAll();
              } catch (err: any) {
                toast.error(err.message || 'Failed to update tier');
              }
            }}
            className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="BASESPEND">Normal ({item.currentTierName || 'Member'})</option>
            <option value="SUPERVIP">SUPER VIP</option>
          </select>
        );
      }
    },
    { accessorKey: 'enrolledAt', header: 'Member Since',
      cell: ({ row }) => {
        const d = row.original.enrolledAt;
        return d ? new Date(d).toLocaleDateString('vi-VN') : '—';
      },
    },
  ], [fetchAll]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Loyalty Management</h1>
        {activeTab === 'stats' && brands.length > 0 && (
          <select
            value={selectedBrandId}
            onChange={e => setSelectedBrandId(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {brands.map((b: any) => (
              <option key={b.id} value={b.id}>{b.brandName}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setActiveTab('stats')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'stats'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}>
          Stats
        </button>
        <button onClick={() => setActiveTab('supervip')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'supervip'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}>
          Members
        </button>
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Tổng quan */}
          <div className="bg-white rounded-xl shadow-theme-sm dark:bg-gray-800 p-6">
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">Total Customers</p>
            <p className="text-title-sm text-gray-900 dark:text-white font-bold mt-1">
              {stats?.totalCustomers?.toLocaleString('vi-VN') ?? '—'}
            </p>
          </div>

          {/* Phân bố hạng */}
          <div className="bg-white rounded-xl shadow-theme-sm dark:bg-gray-800 p-6">
            <h3 className="text-title-sm text-gray-900 dark:text-white font-bold mb-5">Tier Distribution</h3>
            <div className="space-y-4">
              {stats?.tierDistribution?.length > 0 ? (
                stats.tierDistribution.map((t: any, i: number) => {
                  const total = stats.totalCustomers || 1;
                  const pct = Math.round((t.count / total) * 100);
                  const colors = ['#465FFF', '#6366F1', '#0EA5E9', '#8B5CF6'];
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300 w-20">{t.tier}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                      </div>
                      <span className="text-theme-sm text-gray-500 dark:text-gray-400 w-16 text-right">{t.count}</span>
                      <span className="text-theme-xs text-gray-400 w-12 text-right">{pct}%</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-theme-sm text-gray-400">Loading...</p>
              )}
            </div>
          </div>
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
              <DataTable columns={columns} data={superVips} searchKey="name" searchPlaceholder="Search..." />
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
