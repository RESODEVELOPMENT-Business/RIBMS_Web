'use client';

import React from 'react';
import { DownloadIcon } from '@/icons';

interface Props {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Single source of truth for the "Export to Excel" button styling.
 * Each page wires its own data → sheet conversion in the click handler.
 */
export default function ExportExcelButton({ onClick, disabled, label = 'Xuất Excel' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm"
    >
      <DownloadIcon className="w-4 h-4" />
      {label}
    </button>
  );
}
