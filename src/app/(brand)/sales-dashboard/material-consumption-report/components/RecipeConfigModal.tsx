'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  getProductCompositions,
  updateProductCompositions,
  getBrandProductItems,
  cloneProductCompositions,
} from '@/services/materialReports';
import { BrandProductItem, ProductCompositionItem } from '@/types/materialReport';
import { TrashBinIcon, CloseIcon, PlusIcon } from '@/icons';

interface RecipeConfigModalProps {
  productId: number;
  productName: string;
  productCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface EditableRecipeRow {
  itemId: number;
  itemCode?: string;
  itemName?: string;
  unit?: string;
  unit2?: string;
  unitRate?: number;
  quantity: number;
}

export default function RecipeConfigModal({
  productId,
  productName,
  productCode,
  isOpen,
  onClose,
  onSaved,
}: RecipeConfigModalProps) {
  const [availableItems, setAvailableItems] = useState<BrandProductItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selected recipe rows for the current product
  const [recipeRows, setRecipeRows] = useState<EditableRecipeRow[]>([]);

  // Search in available materials
  const [searchTerm, setSearchTerm] = useState('');

  // Quick quantity for adding from list
  const [addQuantities, setAddQuantities] = useState<Record<number, number>>({});

  // Clone source id
  const [cloneSourceId, setCloneSourceId] = useState<string>('');
  const [showCloneBar, setShowCloneBar] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load available materials from HangHoa / ProductItem
    const fetchMaterials = async () => {
      setLoadingItems(true);
      try {
        const res = await getBrandProductItems(1, 500);
        if (res && res.data) {
          const items: BrandProductItem[] = Array.isArray(res.data)
            ? res.data
            : res.data.items || [];
          setAvailableItems(items);
        }
      } catch (err: any) {
        console.error('Failed to load materials:', err);
        toast.error('Lỗi khi tải danh sách vật tư');
      } finally {
        setLoadingItems(false);
      }
    };

    // Load current product's compositions
    const fetchCurrentRecipe = async () => {
      setLoadingRecipe(true);
      try {
        const res = await getProductCompositions(productId);
        if (res && res.data) {
          const items: ProductCompositionItem[] = Array.isArray(res.data)
            ? res.data
            : res.data.items || [];
          setRecipeRows(
            items.map((x) => ({
              itemId: x.itemId,
              itemCode: x.itemCode,
              itemName: x.itemName,
              unit: x.unit,
              unit2: x.unit2,
              unitRate: x.unitRate,
              quantity: x.quantity,
            }))
          );
        }
      } catch (err: any) {
        console.error('Failed to load recipe:', err);
        toast.error('Lỗi khi tải công thức định lượng');
      } finally {
        setLoadingRecipe(false);
      }
    };

    fetchMaterials();
    fetchCurrentRecipe();
  }, [isOpen, productId]);

  // Filtered available items based on search term
  const filteredAvailableItems = useMemo(() => {
    if (!searchTerm.trim()) return availableItems;
    const term = searchTerm.toLowerCase().trim();
    return availableItems.filter((mat) => {
      const name = (mat.itemName || '').toLowerCase();
      const code = (mat.itemCode || '').toLowerCase();
      return name.includes(term) || code.includes(term);
    });
  }, [availableItems, searchTerm]);

  if (!isOpen) return null;

  // Add material to recipe
  const handleAddMaterial = (mat: BrandProductItem) => {
    const qty = addQuantities[mat.itemId] && addQuantities[mat.itemId] > 0
      ? addQuantities[mat.itemId]
      : 1;

    const existingIndex = recipeRows.findIndex((r) => r.itemId === mat.itemId);
    if (existingIndex >= 0) {
      const updated = [...recipeRows];
      updated[existingIndex].quantity += qty;
      setRecipeRows(updated);
      toast.info(`Đã tăng số lượng ${mat.itemName} thêm ${qty}`);
    } else {
      setRecipeRows([
        ...recipeRows,
        {
          itemId: mat.itemId,
          itemCode: mat.itemCode,
          itemName: mat.itemName,
          unit: mat.unit,
          unit2: mat.unit2,
          unitRate: mat.unitRate,
          quantity: qty,
        },
      ]);
      toast.success(`Đã thêm ${mat.itemName}`);
    }

    setAddQuantities((prev) => ({ ...prev, [mat.itemId]: 1 }));
  };

  const handleQuantityInputChange = (itemId: number, val: number) => {
    setAddQuantities((prev) => ({ ...prev, [itemId]: val }));
  };

  const handleUpdateRecipeRowQty = (index: number, quantity: number) => {
    const updated = [...recipeRows];
    updated[index].quantity = quantity;
    setRecipeRows(updated);
  };

  const handleRemoveRecipeRow = (index: number) => {
    setRecipeRows(recipeRows.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const invalidRow = recipeRows.find((r) => !r.itemId || r.quantity <= 0);
    if (invalidRow) {
      toast.error('Vui lòng nhập định lượng lớn hơn 0');
      return;
    }

    setSaving(true);
    try {
      await updateProductCompositions(
        productId,
        recipeRows.map((r) => ({
          itemId: r.itemId,
          quantity: r.quantity,
        }))
      );
      toast.success('Đã lưu định lượng thành công');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi lưu định lượng');
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async () => {
    const sourceId = parseInt(cloneSourceId, 10);
    if (!sourceId || sourceId <= 0) {
      toast.error('Vui lòng nhập ID sản phẩm nguồn hợp lệ');
      return;
    }
    setSaving(true);
    try {
      await cloneProductCompositions(sourceId, productId);
      toast.success('Sao chép định lượng thành công');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi sao chép định lượng');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-5xl rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Cấu hình định lượng (BOM)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {productName} {productCode ? `• Mã: ${productCode}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCloneBar(!showCloneBar)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Sao chép từ món khác
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Clone Bar */}
        {showCloneBar && (
          <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              ID sản phẩm nguồn:
            </span>
            <input
              type="number"
              placeholder="Ví dụ: 7100244"
              value={cloneSourceId}
              onChange={(e) => setCloneSourceId(e.target.value)}
              className="w-48 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={handleClone}
              disabled={saving || !cloneSourceId}
              className="px-3 py-1.5 font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition disabled:opacity-50"
            >
              Áp dụng
            </button>
          </div>
        )}

        {/* Modal Main Body (2 Columns) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
          
          {/* Column 1: Danh sách vật tư */}
          <div className="flex flex-col p-4 overflow-hidden bg-gray-50/50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Danh sách vật tư
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {availableItems.length}
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Tìm theo mã hoặc tên vật tư..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            {/* Materials List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingItems ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  Đang tải danh sách vật tư...
                </div>
              ) : filteredAvailableItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  Không tìm thấy vật tư phù hợp
                </div>
              ) : (
                filteredAvailableItems.map((mat) => {
                  const inputQty = addQuantities[mat.itemId] ?? 1;
                  const displayUnit = mat.unit2 || mat.unit || 'đv';
                  const isAdded = recipeRows.some((r) => r.itemId === mat.itemId);

                  return (
                    <div
                      key={mat.itemId}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border transition ${
                        isAdded
                          ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/40'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                            {mat.itemCode || `VT-${mat.itemId}`}
                          </span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {mat.itemName}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          ĐVT: {displayUnit}
                          {mat.unitRate && mat.unitRate > 1 && mat.unit && (
                            <span className="ml-1 text-gray-400">
                              (1 {mat.unit} = {mat.unitRate.toLocaleString('vi-VN')} {displayUnit})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={inputQty}
                          onChange={(e) => handleQuantityInputChange(mat.itemId, parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-xs text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-brand-500"
                        />
                        <span className="text-[11px] text-gray-400 w-6 truncate">
                          {displayUnit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddMaterial(mat)}
                          className="w-7 h-7 rounded-lg bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center transition"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Định lượng món */}
          <div className="flex flex-col p-4 overflow-hidden bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Định lượng món
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 font-medium">
                  {recipeRows.length}
                </span>
              </div>
              {recipeRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecipeRows([])}
                  className="text-xs text-red-500 hover:underline"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Configured BOM List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingRecipe ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  Đang tải công thức định lượng...
                </div>
              ) : recipeRows.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-6 text-xs text-gray-400">
                  Chưa có định lượng cho món này.
                </div>
              ) : (
                recipeRows.map((row, idx) => {
                  const material = availableItems.find((m) => m.itemId === row.itemId);
                  const itemName = row.itemName || material?.itemName || `Vật tư #${row.itemId}`;
                  const itemCode = row.itemCode || material?.itemCode || `VT-${row.itemId}`;
                  const displayUnit = row.unit2 || material?.unit2 || row.unit || material?.unit || 'đv';

                  return (
                    <div
                      key={row.itemId}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                            {itemCode}
                          </span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {itemName}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          ĐVT: {displayUnit}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0.0001"
                          step="any"
                          value={row.quantity}
                          onChange={(e) => handleUpdateRecipeRowQty(idx, parseFloat(e.target.value) || 0)}
                          className="w-18 px-2 py-1 text-xs text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-brand-500"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 truncate">
                          {displayUnit}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeRow(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <TrashBinIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="text-xs text-gray-500">
            Tổng số: <strong className="text-gray-900 dark:text-white">{recipeRows.length}</strong> vật tư
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu định lượng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
