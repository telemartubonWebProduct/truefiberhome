import { NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/dashboard-auth";
import { createServiceRoleClient } from "@/src/lib/supabase-server";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function resolveBucketName(): string {
  const envBucket =
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    process.env.SUPABASE_STORAGE_BUCKET;

  if (envBucket && envBucket.trim()) {
    return envBucket.trim();
  }

  return "banners";
}

async function ensureBucketReady(bucket: string) {
  const supabase = await createServiceRoleClient();

  const { data: bucketData, error: getBucketError } = await supabase.storage.getBucket(bucket);

  if (getBucketError) {
    throw new Error(`Cannot inspect storage bucket: ${getBucketError.message}`);
  }

  if (!bucketData) {
    throw new Error(`Storage bucket \"${bucket}\" is not available`);
  }

  return supabase;
}

function createFilePath(file: File): string {
  const safeExt = MIME_EXTENSIONS[file.type] || "bin";
  const id = crypto.randomUUID().slice(0, 8);

  return `uploads/${Date.now()}-${id}.${safeExt}`;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (fileValue.size <= 0) {
      return NextResponse.json({ error: "file cannot be empty" }, { status: 400 });
    }

    if (fileValue.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: "file is too large (max 5 MB)" },
        { status: 413 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(fileValue.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Only jpg, png, webp, gif are allowed." },
        { status: 415 }
      );
    }

    const bucket = resolveBucketName();
    const filePath = createFilePath(fileValue);

    const supabase = await ensureBucketReady(bucket);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileValue, {
        cacheControl: "3600",
        upsert: false,
        contentType: fileValue.type || undefined,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({ publicUrl, bucket, filePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    if (/SUPABASE_SERVICE_ROLE_KEY is missing/i.test(message)) {
      return NextResponse.json(
        { error: "Upload failed: SUPABASE_SERVICE_ROLE_KEY is missing in server env" },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
