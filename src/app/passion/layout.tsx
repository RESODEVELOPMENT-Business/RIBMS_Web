import type { ReactNode } from "react";

export default function PassionLayout({ children }: { children: ReactNode }) {
  return (
    <main lang="vi" className="min-h-screen bg-white px-5 py-12 text-gray-900 sm:px-8 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-2xl space-y-6 text-base leading-7 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline dark:[&_a]:text-blue-300 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold">
        <p className="font-semibold">Passion Coffee</p>
        {children}
      </div>
    </main>
  );
}
