"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PromotionForm from "./PromotionForm";

interface Promotion {
  id: string;
  type: string;
  categoryName: string | null;
  name: string;
  price: number;
  priceNote: string | null;
  speed: string | null;
  validity: string | null;
  imageUrl: string | null;
  promoBadge: string | null;
  perks: any | null;
  details: any | null;
  status: boolean;
  displayOrder: number;
}

interface PromotionManagerProps {
  initialPromotions: Promotion[];
  initialType: string;
  initialSearchQuery: string;
  currentPage: number;
  totalPages: number;
  lockedType?: string;
}

const TABS = [
  { id: "broadband", label: "เน็ตบ้าน (Broadband)" },
  { id: "monthly", label: "รายเดือน (Monthly)" },
  { id: "topup", label: "เติมเงิน (Topup)" },
  { id: "solar", label: "โซล่าเซลล์ (wEnergy)" }
];

export default function PromotionManager({
  initialPromotions,
  initialType,
  initialSearchQuery,
  currentPage,
  totalPages,
  lockedType,
}: PromotionManagerProps) {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [activeTab, setActiveTab] = useState(lockedType || initialType);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Sync state when props change (after router.refresh())
  useEffect(() => {
    setPromotions(initialPromotions);
    setActiveTab(lockedType || initialType);
    setSearchQuery(initialSearchQuery);
  }, [initialPromotions, initialType, initialSearchQuery, lockedType]);

  const handleTabChange = (tabId: string) => {
    if (lockedType) return;
    setActiveTab(tabId);
    setSearchQuery(""); // Clear search on tab change
    router.push(`?type=${tabId}&page=1`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const qParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "";
    router.push(`?type=${activeTab}&page=${newPage}${qParam}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : "";
    router.push(`?type=${activeTab}&page=1${qParam}`);
  };

  const filteredPromotions = promotions; // already filtered and paginated from server

  const handleAddNew = () => {
    setEditingPromo(null);
    setShowForm(true);
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPromo(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPromo(null);
    router.refresh();
  };

  const handleToggleStatus = async (promo: Promotion) => {
    setTogglingId(promo.id);
    try {
      const res = await fetch(`/api/promotions/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !promo.status }),
      });
      if (!res.ok) throw new Error("Failed to toggle promotion");
      router.refresh();
    } catch (error) {
      console.error("Toggle failed:", error);
      alert("Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (promo: Promotion) => {
    if (!confirm(`ยืนยันการลบโปรโมชัน "${promo.name}"?`)) return;
    setDeletingId(promo.id);
    try {
      const res = await fetch(`/api/promotions/${promo.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete promotion");
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete promotion");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Search and Add Button Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="ค้นหาชื่อโปรโมชัน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-500"
          />
          <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                router.push(`?type=${activeTab}&page=1`);
              }}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>
        
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มโปรโมชัน
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2 w-full">
          {!lockedType && TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {lockedType && (
            <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-300">
              โหมดจัดการเฉพาะแพ็กเกจประเภทนี้
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">รูป/หมวดหมู่</th>
                <th className="px-6 py-4 font-medium">ชื่อโปรโมชัน</th>
                <th className="px-6 py-4 font-medium">ข้อมูลหลัก</th>
                <th className="px-6 py-4 font-medium">ราคา</th>
                <th className="px-6 py-4 font-medium">สถานะ</th>
                <th className="px-6 py-4 font-medium text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                    ไม่มีข้อมูลโปรโมชันในหมวดหมู่นี้
                  </td>
                </tr>
              ) : (
                filteredPromotions.map(promo => (
                  <tr key={promo.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {promo.imageUrl ? (
                          <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden relative shrink-0 border border-gray-700">
                            <Image src={promo.imageUrl} fill alt={promo.name} className="object-cover" sizes="48px" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <span className="text-gray-400 text-xs font-medium bg-gray-800 px-2 py-1 rounded-md max-w-[120px] truncate block" title={promo.categoryName || "ไม่มีหมวดหมู่"}>
                          {promo.categoryName || "ไม่มีหมวดหมู่"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-200 text-sm font-medium line-clamp-2" title={promo.name}>
                          {promo.name}
                        </span>
                        {promo.promoBadge && (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full w-fit">
                            {promo.promoBadge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-300 text-sm">{promo.speed || "-"}</span>
                        <span className="text-gray-500 text-xs">{promo.validity || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-blue-400 font-bold text-base">฿{promo.price.toLocaleString()}</span>
                        <span className="text-gray-500 text-xs">{promo.priceNote || ""}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleToggleStatus(promo)}
                        disabled={togglingId === promo.id}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          promo.status
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800"
                        }`}
                      >
                        {togglingId === promo.id ? "กำลังสลับ..." : promo.status ? "แสดงผล" : "ซ่อน"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(promo)}
                          className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(promo)}
                          disabled={deletingId === promo.id}
                          className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="ลบ"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-800 px-6 py-4 bg-gray-900/50">
            <div className="flex-1 text-sm text-gray-400">
              หน้า <span className="font-medium text-white">{currentPage}</span> จาก <span className="font-medium text-white">{totalPages}</span>
            </div>
            
            <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                  // Logic to show a limited number of page buttons with ellipsis
                  const isCurrent = currentPage === pageNum;
                  const isFirst = pageNum === 1;
                  const isLast = pageNum === totalPages;
                  const isWithinRange = Math.abs(currentPage - pageNum) <= 1;

                  if (isFirst || isLast || isWithinRange) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[36px] h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }

                  // Ellipsis logic
                  if (
                    (pageNum === 2 && currentPage > 3) ||
                    (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-600">
                        ...
                      </span>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
            
            <div className="flex-1"></div>
          </div>
        )}
      </div>

      {/* Promotion Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-white">
                {editingPromo ? "แก้ไขโปรโมชัน" : "เพิ่มโปรโมชันใหม่"}
              </h2>
              <button
                onClick={handleFormClose}
                className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <PromotionForm
                promotion={editingPromo}
                activeType={activeTab}
                lockType={Boolean(lockedType)}
                onSuccess={handleFormSuccess}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
