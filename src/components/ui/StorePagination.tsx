"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function StorePagination({ currentPage, totalPages }: { currentPage: number, totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex justify-center items-center gap-3 mt-8 pb-4">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-sm"
      >
        ย้อนกลับ
      </button>
      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              currentPage === pageNum
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-sm"
      >
        ถัดไป
      </button>
    </div>
  );
}
