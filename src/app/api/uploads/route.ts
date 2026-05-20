import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildStoredUploadName, getUploadValidationError, resolveStoredUploadPath, uploadDir } from "@/lib/upload";

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

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageRoot = path.join(process.cwd(), uploadDir);
  const storedName = buildStoredUploadName(file.name, crypto.randomUUID());
  const storedPath = path.join(storageRoot, storedName);

  await mkdir(storageRoot, { recursive: true });
  await writeFile(storedPath, bytes);

  return NextResponse.json({
    fileName: file.name,
    path: `/uploads/${storedName}`,
    size: file.size,
    type: file.type
  });
}

export async function DELETE(request: Request) {
  let publicPath = "";

  try {
    const body = (await request.json()) as { path?: unknown };
    publicPath = typeof body.path === "string" ? body.path : "";
  } catch {
    return NextResponse.json({ message: "Upload path is required." }, { status: 400 });
  }

  try {
    const fileName = resolveStoredUploadPath(publicPath);
    const storedPath = path.join(process.cwd(), uploadDir, fileName);

    await unlink(storedPath);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "File could not be deleted." }, { status: 400 });
  }
}
