"use client";

import Link from "next/link";

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  query: string;
}

function buildHref(category: string, query: string): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/articles?${qs}` : "/articles";
}

export default function CategoryFilter({
  categories,
  selected,
  query,
}: CategoryFilterProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 mb-6">
      <Link
        href={buildHref("", query)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          !selected
            ? "bg-gray-900 text-white shadow-sm"
            : "bg-white text-gray-600 border border-gray-200 hover:border-rose-300 hover:text-rose-600"
        }`}
      >
        ทั้งหมด
      </Link>
      {categories.map((category) => {
        const isActive = selected.toLowerCase() === category.toLowerCase();
        return (
          <Link
            key={category}
            href={buildHref(category, query)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-rose-300 hover:text-rose-600"
            }`}
          >
            {category}
          </Link>
        );
      })}
    </div>
  );
}
