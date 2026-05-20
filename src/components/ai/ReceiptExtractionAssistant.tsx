"use client";

import { ClipboardCheck, Sparkles } from "lucide-react";
import { useFormState } from "react-dom";

import { extractReceiptFieldsAction } from "@/server/actions/ai.actions";

type FarmOption = {
  id: string;
  name: string;
};

function fieldValue(value: string | number | undefined) {
  return value === undefined || value === "" ? "Not detected" : String(value);
}

export function ReceiptExtractionAssistant({ farms }: { farms: FarmOption[] }) {
  const [state, formAction] = useFormState(extractReceiptFieldsAction, { ok: false });

  return (
    <div className="space-y-4 rounded-lg border border-sky-100 bg-sky-50/40 p-4">
      <div className="flex items-start gap-2">
        <ClipboardCheck className="mt-0.5 h-4 w-4 text-sky-700" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">Receipt Extraction</h3>
          <p className="text-xs text-slate-600">Paste receipt text or file metadata to draft expense fields.</p>
        </div>
      </div>
      <form action={formAction} className="space-y-3">
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          Farm
          <select name="farmId" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" required>
            <option value="">Select farm</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
          {state.errors?.farmId?.[0] ? <span className="block text-xs text-red-600">{state.errors.farmId[0]}</span> : null}
        </label>
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          Uploaded file name
          <input name="fileName" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="receipt-agri-mart.jpg" />
        </label>
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          Receipt text
          <textarea
            name="receiptText"
            rows={5}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            placeholder="Vendor, date, category, amount, payment status..."
          />
          {state.errors?.receiptText?.[0] ? <span className="block text-xs text-red-600">{state.errors.receiptText[0]}</span> : null}
        </label>
        <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800">
          <Sparkles className="h-4 w-4" />
          Extract draft fields
        </button>
      </form>
      {state.message ? <p className={`rounded-md px-3 py-2 text-sm ${state.ok ? "bg-white text-sky-800" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null}
      {state.fields ? (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-700">Vendor:</span> {fieldValue(state.fields.vendor)}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Date:</span> {fieldValue(state.fields.date)}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Category:</span> {fieldValue(state.fields.category)}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Amount:</span> {fieldValue(state.fields.amount)}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Status:</span> {fieldValue(state.fields.paymentStatus)}
          </p>
        </div>
      ) : null}
      {state.confidenceNotes && state.confidenceNotes.length > 0 ? (
        <ul className="space-y-1 text-xs text-slate-500">
          {state.confidenceNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
