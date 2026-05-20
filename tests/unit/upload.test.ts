import { describe, expect, it } from "vitest";

import { buildStoredUploadName, getUploadValidationError, maxUploadBytes } from "@/lib/upload";

describe("getUploadValidationError", () => {
  it("accepts MVP receipt and photo file types within the size limit", () => {
    expect(getUploadValidationError({ mimeType: "image/jpeg", size: maxUploadBytes })).toBeNull();
    expect(getUploadValidationError({ mimeType: "image/png", size: 1024 })).toBeNull();
    expect(getUploadValidationError({ mimeType: "image/webp", size: 1024 })).toBeNull();
    expect(getUploadValidationError({ mimeType: "application/pdf", size: 1024 })).toBeNull();
  });

  it("rejects unsupported file types and oversized files", () => {
    expect(getUploadValidationError({ mimeType: "text/plain", size: 1024 })).toBe("Unsupported file type.");
    expect(getUploadValidationError({ mimeType: "image/png", size: maxUploadBytes + 1 })).toBe("File is larger than 5 MB.");
  });
});

describe("buildStoredUploadName", () => {
  it("creates a safe unique filename while preserving the extension", () => {
    const name = buildStoredUploadName("Receipt April 2026.PDF", "abc123");

    expect(name).toBe("abc123-receipt-april-2026.pdf");
  });
});
