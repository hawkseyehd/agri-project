"use client";

import { Archive, X } from "lucide-react";
import { useState, useTransition } from "react";

type ArchiveResult = {
  ok: boolean;
  message?: string;
};

export function ArchiveActionButton({
  action,
  description
}: {
  action: () => Promise<ArchiveResult>;
  description: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function archiveRecord() {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message ?? "Record could not be archived.");
        return;
      }

      setIsOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900"
      >
        <Archive className="h-3.5 w-3.5" />
        Archive
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="archive-dialog-title">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 id="archive-dialog-title" className="text-base font-bold text-slate-950">Archive this record?</h2>
              <button type="button" onClick={() => setIsOpen(false)} disabled={isPending} className="p-1 text-slate-500 hover:text-slate-900" aria-label="Close archive confirmation">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm leading-6 text-slate-600">{description}</p>
              {error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setIsOpen(false)} disabled={isPending} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  Cancel
                </button>
                <button type="button" onClick={archiveRecord} disabled={isPending} className="inline-flex items-center gap-2 rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60">
                  <Archive className="h-4 w-4" />
                  {isPending ? "Archiving..." : "Archive"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
