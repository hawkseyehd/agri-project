export const uploadDir = process.env.UPLOAD_DIR ?? "public/uploads";
export const maxUploadBytes = 5 * 1024 * 1024;
export const allowedUploadAccept = "image/jpeg,image/png,image/webp,application/pdf";

export function isAllowedUploadType(mimeType: string) {
  return ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mimeType);
}

export function getUploadValidationError({ mimeType, size }: { mimeType: string; size: number }) {
  if (!isAllowedUploadType(mimeType)) {
    return "Unsupported file type.";
  }

  if (size > maxUploadBytes) {
    return "File is larger than 5 MB.";
  }

  return null;
}

export function buildStoredUploadName(originalName: string, uniqueId: string) {
  const trimmedName = originalName.trim().toLowerCase();
  const extensionMatch = trimmedName.match(/\.([a-z0-9]+)$/);
  const extension = extensionMatch ? `.${extensionMatch[1]}` : "";
  const baseName = trimmedName
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${uniqueId}-${baseName || "upload"}${extension}`;
}

export function resolveStoredUploadPath(publicPath: string) {
  if (!publicPath.startsWith("/uploads/")) {
    throw new Error("Upload path is invalid.");
  }

  const fileName = publicPath.replace("/uploads/", "");

  if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
    throw new Error("Upload path is invalid.");
  }

  return fileName;
}
