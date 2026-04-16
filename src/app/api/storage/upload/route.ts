import { NextResponse } from "next/server";
import { requireDashboardUser } from "@/src/lib/dashboard-auth";
import { createServiceRoleClient } from "@/src/lib/supabase-server";

function resolveBucketName(formBucket: unknown): string {
  if (typeof formBucket === "string" && formBucket.trim()) {
    return formBucket.trim();
  }

  const envBucket =
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    process.env.SUPABASE_STORAGE_BUCKET;

  if (envBucket && envBucket.trim()) {
    return envBucket.trim();
  }

  return "banners";
}

async function ensureBucketExists(bucket: string) {
  const supabase = await createServiceRoleClient();

  const { data: bucketData, error: getBucketError } = await supabase.storage.getBucket(bucket);

  if (!getBucketError && bucketData) {
    return supabase;
  }

  if (getBucketError && !/not found|does not exist/i.test(getBucketError.message)) {
    throw new Error(`Cannot inspect storage bucket: ${getBucketError.message}`);
  }

  const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
    public: true,
  });

  if (createBucketError && !/already exists|duplicate/i.test(createBucketError.message)) {
    throw new Error(`Cannot create storage bucket: ${createBucketError.message}`);
  }

  return supabase;
}

function createFilePath(file: File): string {
  const originalExt = file.name.includes(".") ? file.name.split(".").pop() ?? "bin" : "bin";
  const safeExt = originalExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const id = crypto.randomUUID().slice(0, 8);

  return `uploads/${Date.now()}-${id}.${safeExt}`;
}

export async function POST(request: Request) {
  const auth = await requireDashboardUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const bucket = resolveBucketName(formData.get("bucket"));
    const filePath = createFilePath(fileValue);

    const supabase = await ensureBucketExists(bucket);

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
