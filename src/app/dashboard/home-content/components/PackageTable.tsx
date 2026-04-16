"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PackageForm from "./PackageForm";

interface Package {
  id: string;
  code: string;
  name: string;
  imageUrl: string | null;
  freebie: unknown | null;
  speed: string;
  price: number;
  details: unknown | null;
  type: string | null;
  status: boolean;
  displayOrder: number;
}

interface PackageTableProps {
  initialPackages: Package[];
}

const CATEGORIES = ["ทั้งหมด", "โปรเน็ตบ้าน", "เน็ตซิมรายวัน", "เน็ตซิมรายเดือน", "ไวไฟฮอตสปอต"];

function toLabelArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const data = item as Record<string, unknown>;
          const raw = data.label ?? data.text ?? data.name;
          return typeof raw === "string" ? raw.trim() : "";
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export default function PackageTable({ initialPackages }: PackageTableProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Sync state when props change (after router.refresh())
  useEffect(() => {
    setPackages(initialPackages);
  }, [initialPackages]);

  const filteredPackages = activeTab === "ทั้งหมด" 
    ? packages 
    : packages.filter(p => p.type === activeTab);

  const handleAddNew = () => {
    setEditingPkg(null);
    setShowForm(true);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPkg(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPkg(null);
    router.refresh();
  };

  const handleToggleStatus = async (pkg: Package) => {
    setTogglingId(pkg.id);
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !pkg.status }),
      });
      if (!res.ok) throw new Error("Failed to toggle package");
      router.refresh();
    } catch (error) {
      console.error("Toggle failed:", error);
      alert("Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Are you sure you want to delete package "${pkg.code}"?`)) return;
    setDeletingId(pkg.id);
    try {
      const res = await fetch(`/api/packages/${pkg.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete package");
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete package");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Filters and Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg transition-all text-sm whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">รหัสสินค้า</th>
                <th className="px-6 py-4 font-medium">โปร / Name</th>
                <th className="px-6 py-4 font-medium">ของแถม</th>
                <th className="px-6 py-4 font-medium">Speed</th>
                <th className="px-6 py-4 font-medium">ราคาบริการ</th>
                <th className="px-6 py-4 font-medium">รายละเอียด</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No packages found in this category.
                  </td>
                </tr>
              ) : (
                filteredPackages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{pkg.code}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {pkg.imageUrl ? (
                          <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden relative shrink-0">
                            <Image src={pkg.imageUrl} fill alt={pkg.name} className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <span className="text-gray-300 text-sm max-w-[150px] truncate">{pkg.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {toLabelArray(pkg.freebie).join(", ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-medium">{pkg.speed}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">฿{pkg.price.toFixed(2)}</td>
                    <td
                      className="px-6 py-4 text-sm text-gray-400 max-w-[150px] truncate"
                      title={toLabelArray(pkg.details).join(", ")}
                    >
                      {toLabelArray(pkg.details).join(", ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(pkg)}
                        disabled={togglingId === pkg.id}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          pkg.status
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        }`}
                      >
                        {togglingId === pkg.id ? "..." : pkg.status ? "แสดง" : "ซ่อน"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(pkg)}
                          className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(pkg)}
                          disabled={deletingId === pkg.id}
                          className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
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
      </div>

      {/* Package Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-white">
                {editingPkg ? "Edit Package" : "Add New Package"}
              </h2>
              <button
                onClick={handleFormClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <PackageForm
                pkg={editingPkg}
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
