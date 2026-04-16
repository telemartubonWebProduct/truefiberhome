import { createClient } from "./supabase";

const DEFAULT_BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "banners";

/**
 * Upload a banner image file to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadBannerImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", DEFAULT_BUCKET_NAME);

  const res = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  const json = (await res.json()) as { publicUrl?: string; error?: string };

  if (!res.ok || !json.publicUrl) {
    throw new Error(json.error || "Failed to upload image");
  }

  return json.publicUrl;
}

export async function deleteBannerImage(imageUrl: string): Promise<void> {
  await deleteImageByUrl(imageUrl);
}

/**
 * Generic function to delete an image by its Supabase public URL.
 * Automatically extracts the bucket name and the file path.
 */
export async function deleteImageByUrl(imageUrl: string): Promise<void> {
  if (!imageUrl) return;
  try {
    const supabase = createClient();
    const url = new URL(imageUrl);
    
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filename>
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!match) {
      console.warn("Could not extract bucket and file path from URL:", imageUrl);
      return;
    }

    const bucketName = decodeURIComponent(match[1]);
    const filePath = decodeURIComponent(match[2]);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`Failed to delete image from bucket ${bucketName}:`, error.message);
    }
  } catch (error) {
    console.error("Error parsing URL for image deletion:", error);
  }
}
