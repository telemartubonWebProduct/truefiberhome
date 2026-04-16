"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { deleteBannerImage } from "@/src/lib/storage";
import BannerForm from "./BannerForm";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BannerListProps {
  initialBanners: Banner[];
}

export default function BannerList({ initialBanners }: BannerListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showNewForm = searchParams.get("action") === "new";

  const [banners] = useState<Banner[]>(initialBanners);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(showNewForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleAddNew = () => {
    setEditingBanner(null);
    setShowForm(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBanner(null);
    router.refresh();
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBanner(null);
    router.refresh();
  };

  const handleToggleActive = async (banner: Banner) => {
    setTogglingId(banner.id);
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });

      if (!res.ok) throw new Error("Failed to toggle banner");
      router.refresh();
    } catch (error) {
      console.error("Toggle failed:", error);
      alert("Failed to toggle banner status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`Are you sure you want to delete "${banner.title}"?`)) return;

    setDeletingId(banner.id);
    try {
      // Delete the image from storage first
      try {
        await deleteBannerImage(banner.imageUrl);
      } catch (e) {
        console.warn("Failed to delete image from storage:", e);
      }

      // Delete the banner record
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete banner");
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete banner");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Add New Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium rounded-xl shadow-lg shadow-red-500/20 transition-all duration-200 text-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Banner
        </button>
      </div>

      {/* Banner Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-white">
                {editingBanner ? "Edit Banner" : "Add New Banner"}
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
              <BannerForm
                banner={editingBanner}
                onSuccess={handleFormSuccess}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        </div>
      )}

      {/* Banner Cards */}
      {banners.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-800 mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg">No banners yet</h3>
          <p className="text-gray-400 text-sm mt-1">
            Click &quot;Add Banner&quot; to create your first banner slide.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all duration-200"
            >
              <div className="flex flex-col md:flex-row">
                {/* Image Preview */}
                <div className="relative w-full md:w-72 h-48 md:h-auto shrink-0 bg-gray-800">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 288px"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold text-lg">
                          {banner.title}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            banner.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-gray-700/50 text-gray-400 border border-gray-600/30"
                          }`}
                        >
                          {banner.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        Order: {banner.displayOrder}
                      </span>
                    </div>

                    {banner.description && (
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {banner.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-800">
                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleActive(banner)}
                      disabled={togglingId === banner.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 ${
                        banner.isActive
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {togglingId === banner.id ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : banner.isActive ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(banner)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(banner)}
                      disabled={deletingId === banner.id}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      {deletingId === banner.id ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
