import React from 'react';

export function SkeletonTable({ columns = 5, rows = 5 }) {
  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-pulse">
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border-b dark:border-gray-700 flex justify-between">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/6"></div>
        ))}
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex justify-between items-center space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/6"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
