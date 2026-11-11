"use client";

import Link from "next/link";
import { useState } from "react";
import { getNavigation } from "@/layout/navigation";
import { useAuthStore } from "@/store/authStore";
import { helpTopics, normalizeSearch, searchScore, topicKey } from "./topics";

export default function HelpPage() {
  const role = useAuthStore((state) => state.user?.role);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [input, setInput] = useState("");
  const query = normalizeSearch(input);

  const navigation = getNavigation(role);
  const results = navigation.flatMap((group) => {
    const items = group.subItems ?? (group.path ? [{ name: group.name, path: group.path }] : []);

    return items.map(({ name, path }) => {
      const topic = helpTopics[topicKey(path)];
      const location = group.subItems ? `${group.name} → ${name}` : name;
      const score = searchScore(query, name, `${location} ${topic?.keywords ?? ""} ${topic?.instruction ?? ""}`);

      return { name, path, topic, location, score };
    });
  }).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score);

  return (
    <main className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Hướng dẫn sử dụng</h1>
      <div className="mt-5">
        <label htmlFor="help-search" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Tìm chức năng hoặc công việc
        </label>
        <input
          id="help-search"
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ví dụ: đổi giá, tra đơn, doanh thu theo ca"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>
      <p role="status" className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {!isHydrated ? "Đang tải hướng dẫn…" : !navigation.length
          ? "Tài khoản chưa có danh mục hướng dẫn trên RIBMS Web."
          : results.length ? `${results.length} chức năng` : "Không tìm thấy chức năng. Thử tên màn hình hoặc từ khóa ngắn hơn."}
      </p>
      <ul className="mt-3 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white empty:hidden dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
        {results.map(({ name, path, topic, location }) => (
          <li key={path} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-white">{name}</h2>
              {location !== name && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{location}</p>}
              {topic && <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">{topic.instruction}</p>}
            </div>
            <Link
              href={path}
              prefetch={false}
              aria-label={`Mở ${name}`}
              className="w-fit shrink-0 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-gray-50 focus-visible:outline-brand-500 dark:border-gray-700 dark:text-brand-400 dark:hover:bg-gray-800"
            >
              Mở chức năng
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

