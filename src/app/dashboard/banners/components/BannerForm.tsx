"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { uploadBannerImage, deleteBannerImage } from "@/src/lib/storage";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

interface BannerFormProps {
  banner?: Banner | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BannerForm({
  banner,
  onSuccess,
  onCancel,
}: BannerFormProps) {
  const isEditing = !!banner;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(banner?.title || "");
  const [description, setDescription] = useState(banner?.description || "");
  const [displayOrder, setDisplayOrder] = useState(banner?.displayOrder || 0);
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    banner?.imageUrl || null
  );
  const [isDragOver, setIsDragOver] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setImageFile(file);
    setError(null);

    // Create local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let imageUrl = banner?.imageUrl || "";

      // Upload new image if a file was selected
      if (imageFile) {
        imageUrl = await uploadBannerImage(imageFile);

        // Delete old image if editing and a new one was uploaded
        if (isEditing && banner?.imageUrl && banner.imageUrl.startsWith("http")) {
          try {
            // Only try to delete if it looks like a Supabase URL, avoid failing on external URLs
            if (banner.imageUrl.includes("supabase.co")) {
              await deleteBannerImage(banner.imageUrl);
            }
          } catch (e) {
            console.warn("Failed to delete old image:", e);
          }
        }
      } else if (imagePreview && !imagePreview.includes("blob:")) {
        // Use external URL directly
        imageUrl = imagePreview;
      }

      if (!imageUrl && !isEditing) {
        setError("Please upload an image or provide an image URL");
        setSaving(false);
        return;
      }

      // Build the request body
      const body: Record<string, unknown> = {
        title,
        description: description || null,
        displayOrder,
        isActive,
      };

      // Only include imageUrl if we have a new one/it changed
      if (imageFile || !isEditing || imageUrl !== banner?.imageUrl) {
        body.imageUrl = imageUrl;
      }

      const url = isEditing
        ? `/api/banners/${banner.id}`
        : "/api/banners";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save banner");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Image Upload Area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Banner Image <span className="text-red-400">*</span>
          </label>
        </div>

        {/* URL Input Option */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">
            Or paste an external Image URL
          </label>
          <input
            type="url"
            value={!imageFile && imagePreview && !imagePreview.includes('blob:') ? imagePreview : ''}
            onChange={(e) => {
              const url = e.target.value;
              setImageFile(null); // Clear file
              setImagePreview(url);
              setError(null);
            }}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm"
          />
        </div>

        {imagePreview && imageFile ? (
          /* New Image File Preview */
          <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
            <div className="relative h-48 w-full">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={removeImage}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                title="Remove image file"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-2 bg-gray-800/80 text-xs text-gray-400">
              {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          </div>
        ) : imagePreview ? (
          /* Current Image or External URL Preview */
          <div className="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800 mt-2">
            <div className="relative h-48 w-full">
              <Image
                src={imagePreview}
                alt={banner?.title || "Banner preview"}
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div className="px-4 py-2 bg-gray-800/80 text-xs text-gray-400 flex items-center justify-between">
              <span>{isEditing && imagePreview === banner?.imageUrl ? "Current image" : "External URL Preview"}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Upload local file instead
              </button>
            </div>
          </div>
        ) : (
          /* Drop Zone */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-2 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? "border-red-500 bg-red-500/5"
                : "border-gray-700 hover:border-gray-500 bg-gray-800/30"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <p className="text-gray-300 text-sm font-medium">
                  Drop an image here or click to browse
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="banner-title" className="block text-sm font-medium text-gray-300 mb-2">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="banner-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., New Year Promotion"
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="banner-description" className="block text-sm font-medium text-gray-300 mb-2">
          Description
          <span className="text-gray-500 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          id="banner-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description for this banner..."
          rows={3}
          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm resize-none"
        />
      </div>

      {/* Display Order & Active Toggle Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="banner-order" className="block text-sm font-medium text-gray-300 mb-2">
            Display Order
          </label>
          <input
            id="banner-order"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            min={0}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
              isActive
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-gray-800/50 border-gray-700 text-gray-400"
            }`}
          >
            {isActive ? "✓ Active" : "○ Inactive"}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {isEditing ? "Saving..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Banner"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-all duration-200 text-sm disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
