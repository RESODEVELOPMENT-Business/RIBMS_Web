'use client';

import React, { useState } from 'react';
import { ProductConsumptionTree } from '@/types/materialReport';
import { ChevronDownIcon } from '@/icons';

interface ProductViewTableProps {
  items: ProductConsumptionTree[];
  onOpenRecipeModal: (productId: number, productName: string, productCode?: string) => void;
}

export default function ProductViewTable({ items, onOpenRecipeModal }: ProductViewTableProps) {
  const [expandedParents, setExpandedParents] = useState<Set<number>>(
    new Set(items.map((x) => x.parentProductId))
  );
  const [expandedSkus, setExpandedSkus] = useState<Set<number>>(new Set());

  const toggleParent = (parentId: number) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });
  };

  const toggleSku = (skuId: number) => {
    setExpandedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(skuId)) next.delete(skuId);
      else next.add(skuId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedParents(new Set(items.map((x) => x.parentProductId)));
    const allSkuIds = items.flatMap((p) => p.skus.map((s) => s.productId));
    setExpandedSkus(new Set(allSkuIds));
  };

  const collapseAll = () => {
    setExpandedParents(new Set());
    setExpandedSkus(new Set());
  };

  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center text-xs text-gray-400">
        Không có dữ liệu trong khoảng thời gian đã chọn.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Table control bar */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Gom theo món ({items.length} nhóm)</span>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="hover:text-brand-500 transition underline underline-offset-2"
          >
            Mở rộng tất cả
          </button>
          <span>•</span>
          <button
            onClick={collapseAll}
            className="hover:text-brand-500 transition underline underline-offset-2"
          >
            Thu gọn tất cả
          </button>
        </div>
      </div>

      {/* Product Tree Container */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((parent) => {
          const isParentExpanded = expandedParents.has(parent.parentProductId);

          return (
            <div key={parent.parentProductId} className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* Parent Header Row */}
              <div
                onClick={() => toggleParent(parent.parentProductId)}
                className="flex items-center justify-between px-4 py-3 bg-gray-50/70 dark:bg-gray-800/40 hover:bg-gray-100/60 dark:hover:bg-gray-800/80 cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-2.5">
                  <ChevronDownIcon
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      isParentExpanded ? '' : '-rotate-90'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white">
                      {parent.parentProductName}
                    </span>
                    {parent.parentProductCode && (
                      <span className="ml-2 font-mono text-[11px] text-gray-400">
                        {parent.parentProductCode}
                      </span>
                    )}
                    {parent.categoryName && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {parent.categoryName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-300">
                  <span>
                    Tổng bán: <strong className="text-brand-600 dark:text-brand-400">{parent.totalSold.toLocaleString('vi-VN')}</strong> ly
                  </span>
                  <span className="text-gray-400">({parent.skus.length} SKU)</span>
                </div>
              </div>

              {/* SKU List */}
              {isParentExpanded && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/40 bg-white dark:bg-gray-900">
                  {parent.skus.map((sku) => {
                    const isSkuExpanded = expandedSkus.has(sku.productId);

                    return (
                      <div key={sku.productId} className="pl-6 pr-4 py-3 space-y-2">
                        {/* SKU Summary line */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSku(sku.productId)}
                              className="text-gray-400 hover:text-brand-500 p-1"
                            >
                              <ChevronDownIcon
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isSkuExpanded ? '' : '-rotate-90'
                                }`}
                              />
                            </button>
                            <span className="font-medium text-xs text-gray-900 dark:text-white">
                              {sku.productName}
                            </span>
                            {sku.productCode && (
                              <span className="font-mono text-[11px] text-gray-400">
                                {sku.productCode}
                              </span>
                            )}
                            {!sku.hasRecipe && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                Chưa có định lượng
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              Đã bán: <strong className="text-gray-900 dark:text-white">{sku.quantitySold.toLocaleString('vi-VN')}</strong> ly
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenRecipeModal(sku.productId, sku.productName || '', sku.productCode);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 rounded-lg transition border border-brand-200 dark:border-brand-800"
                            >
                              {sku.hasRecipe ? 'Sửa định lượng' : 'Cấu hình'}
                            </button>
                          </div>
                        </div>

                        {/* SKU Materials Breakdown (when expanded) */}
                        {isSkuExpanded && (
                          <div className="ml-6 pt-1 pb-2">
                            {sku.hasRecipe && sku.materials.length > 0 ? (
                              <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 p-3 space-y-2">
                                <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                  Vật tư tiêu hao ({sku.materials.length} loại):
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {sku.materials.map((mat, mIdx) => (
                                    <div
                                      key={mIdx}
                                      className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
                                    >
                                      <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                                        {mat.itemName}
                                      </div>
                                      <div className="text-[11px] text-gray-400 mt-0.5">
                                        Định lượng: {mat.quantityPerCup} {mat.unit2 || mat.unit}/ly
                                      </div>
                                      <div className="font-semibold text-brand-600 dark:text-brand-400 mt-1">
                                        Tổng: {mat.totalConsumedPackage.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}{' '}
                                        {mat.unit}
                                        {mat.unit2 && mat.unitRate > 1 && (
                                          <span className="font-normal text-[10px] text-gray-400 ml-1">
                                            ({mat.totalConsumedBase.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} {mat.unit2})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Toppings associated */}
                                {sku.toppings.length > 0 && (
                                  <div className="mt-2.5 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                      Topping kèm theo:
                                    </div>
                                    <div className="space-y-1">
                                      {sku.toppings.map((top, tIdx) => (
                                        <div
                                          key={tIdx}
                                          className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                        >
                                          <div>
                                            <span className="font-medium text-gray-800 dark:text-gray-200">
                                              + {top.productName}
                                            </span>
                                            <span className="text-gray-400 ml-1.5">
                                              ({top.quantitySold} phần)
                                            </span>
                                          </div>
                                          <div className="text-gray-600 dark:text-gray-300">
                                            {top.materials.map((tm) => `${tm.itemName}: ${tm.totalConsumedBase} ${tm.unit2 || tm.unit}`).join(', ')}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                                Chưa có định lượng cho món này.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
