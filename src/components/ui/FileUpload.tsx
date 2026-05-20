"use client";

import { useState, useTransition } from "react";

import { allowedUploadAccept } from "@/lib/upload";

type UploadState = {
  path: string;
  fileName: string;
};

type FileUploadProps = {
  name?: string;
  defaultValue?: string;
};

export function FileUpload({ name = "filePath", defaultValue = "" }: FileUploadProps) {
  const [upload, setUpload] = useState<UploadState>({
    path: defaultValue,
    fileName: defaultValue ? defaultValue.split("/").pop() ?? defaultValue : ""
  });
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function uploadFile(file: File) {
    startTransition(async () => {
      setMessage(undefined);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as { path?: string; fileName?: string; message?: string };

      if (!response.ok || !result.path) {
        setMessage(result.message ?? "File could not be uploaded.");
        return;
      }

      setUpload({
        path: result.path,
        fileName: result.fileName ?? file.name
      });
    });
  }

  function removeUpload() {
    const path = upload.path;

    setUpload({ path: "", fileName: "" });
    setMessage(undefined);

    if (!path) {
      return;
    }

    startTransition(async () => {
      await fetch("/api/uploads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ path })
      });
    });
  }

  return (
    <div className="space-y-2">
      <input name={name} type="hidden" value={upload.path} />
      <input
        type="file"
        accept={allowedUploadAccept}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        disabled={isPending}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];

          if (file) {
            uploadFile(file);
          }
        }}
      />
      {upload.path ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <span>{upload.fileName || upload.path}</span>
          <button type="button" className="font-semibold text-emerald-800 hover:text-emerald-950" disabled={isPending} onClick={removeUpload}>
            Remove
          </button>
        </div>
      ) : null}
      {isPending ? <p className="text-xs text-slate-500">Uploading...</p> : null}
      {message ? <p className="text-xs text-red-600">{message}</p> : null}
    </div>
  );
}
