import { NextResponse } from "next/server";

import { getUploadValidationError } from "@/lib/upload";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required." }, { status: 400 });
  }

  const validationError = getUploadValidationError({
    mimeType: file.type,
    size: file.size
  });

  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  return NextResponse.json(
    {
      message: "File uploads need a persistent storage provider in production. Configure Vercel Blob, Supabase Storage, Cloudflare R2, or S3 before enabling uploads.",
      fileName: file.name,
      size: file.size,
      type: file.type
    },
    { status: 501 }
  );
}

export async function DELETE(request: Request) {
  await request.json().catch(() => undefined);

  return NextResponse.json(
    {
      message: "File deletion needs a persistent storage provider in production. Configure Vercel Blob, Supabase Storage, Cloudflare R2, or S3 before enabling uploads."
    },
    { status: 501 }
  );
}
