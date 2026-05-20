export type AiProviderName = "local" | "external";

type AiResponseBase = {
  provider: AiProviderName;
  model: string;
  generatedAt: string;
};

export type DailyReportSuggestion = {
  activities: string;
  labor: string;
  expenses: string;
  inventoryUsage: string;
  irrigation: string;
  inputApplications: string;
  issues: string;
  tomorrowPlan: string;
  notes: string;
};

export type DashboardAiInput = {
  activeCropSeasons: number;
  dailyReports: {
    submitted: number;
    due: number;
    pending: number;
  };
  seasonExpenses: number;
  expectedRevenue: number;
  profitEstimate: number;
  receivable: number;
  lowStockCount: number;
  presentWorkers: number;
  wagesToday: number;
};

export type ProfitLossAiRow = {
  farmName: string;
  blockName: string;
  cropSeasonName: string;
  expenses: number;
  revenue: number;
  profitLoss: number;
  receivable: number;
};

export type ReceiptExtractionInput = {
  text?: string;
  fileName?: string;
};

export type ReceiptExtractionFields = {
  vendor?: string;
  date?: string;
  category?: string;
  amount?: number;
  paymentStatus?: "PAID" | "PARTIAL" | "PENDING";
};

export type InventoryAlertInput = {
  items: Array<{
    name: string;
    farmName: string;
    quantity: number;
    lowStockLevel: number;
    unit: string;
  }>;
};

export type NotificationDraftInput = {
  lowStockItems: InventoryAlertInput["items"];
  missingReports: Array<{
    farmName: string;
    blockName: string;
    cropName: string;
  }>;
  receivableAmount: number;
  operationalWarnings: string[];
};

function responseBase(): AiResponseBase {
  const provider = process.env.AI_PROVIDER && process.env.AI_PROVIDER !== "local" ? "external" : "local";

  return {
    provider,
    model: provider === "local" ? "egri-local-deterministic-v1" : process.env.AI_PROVIDER ?? "external",
    generatedAt: new Date().toISOString()
  };
}

function money(value: number) {
  return `PKR ${Math.round(value).toLocaleString("en-PK")}`;
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitNotes(notes: string) {
  return compactText(notes)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findMatchingLines(lines: string[], patterns: RegExp[]) {
  return lines.filter((line) => patterns.some((pattern) => pattern.test(line)));
}

function fallbackLine(lines: string[], fallback: string) {
  return lines.length > 0 ? lines.join(" ") : fallback;
}

export async function structureDailyReportNotes(input: { notes: string }) {
  const lines = splitNotes(input.notes);
  const notes = compactText(input.notes);

  const activities = findMatchingLines(lines, [/block|field|crop|weed|harvest|spray|scout|prepare|sow|plant|clean/i]);
  const labor = findMatchingLines(lines, [/\bworker|labou?r|attendance|wage|team|staff|mazdoor|\d+\s*(workers?|labou?rers?)/i]);
  const expenses = findMatchingLines(lines, [/expense|bought|purchase|vendor|paid|unpaid|cash|diesel|petrol|rs\.?|pkr|\d{3,}/i]);
  const inventoryUsage = findMatchingLines(lines, [/used|stock|inventory|bags?|kg|liter|litre|urea|seed|fertili[sz]er|pesticide|diesel/i]);
  const irrigation = findMatchingLines(lines, [/irrigat|water|canal|tube\s*well|pump|acre|hours?/i]);
  const inputApplications = findMatchingLines(lines, [/apply|applied|spray|fertili[sz]er|pesticide|herbicide|fungicide|urea|dap|seed/i]);
  const issues = findMatchingLines(lines, [/issue|problem|risk|delay|broken|repair|pest|disease|weather|belt|pump/i]);
  const tomorrowPlan = findMatchingLines(lines, [/tomorrow|next|plan|follow|remaining|need to/i]);

  return {
    ...responseBase(),
    suggestions: {
      activities: fallbackLine(activities, notes || "No activity detail detected. Add field work completed today."),
      labor: fallbackLine(labor, "No labor detail detected. Add worker count, task, wage, paid amount, and balance if applicable."),
      expenses: fallbackLine(expenses, "No expense detail detected. Add category, amount, vendor, payment status, and receipt reference."),
      inventoryUsage: fallbackLine(inventoryUsage, "No inventory usage detected. Add item names, quantities, units, and purpose."),
      irrigation: fallbackLine(irrigation, "No irrigation note detected. Add area, source, hours, and water condition if relevant."),
      inputApplications: fallbackLine(inputApplications, "No input application detected. Add fertilizer, spray, seed, fuel, or treatment details if relevant."),
      issues: fallbackLine(issues, "No issue detected. Record pest, weather, labor, machinery, or access risks if any."),
      tomorrowPlan: fallbackLine(tomorrowPlan, "Confirm tomorrow's priority work, labor needs, purchases, and follow-up checks."),
      notes: notes || "Review the AI draft and keep only verified operational facts."
    } satisfies DailyReportSuggestion,
    reviewReminder: "Review these suggestions before saving. AI drafts do not create business records on their own."
  };
}

export async function summarizeDashboardStatus(input: DashboardAiInput) {
  const risks: string[] = [];
  const nextActions: string[] = [];

  if (input.dailyReports.pending > 0) {
    risks.push(`${input.dailyReports.pending} daily report is still pending.`);
    nextActions.push("Ask managers to submit missing end-of-day reports before closing operations.");
  }

  if (input.lowStockCount > 0) {
    risks.push(`${input.lowStockCount} inventory items are at or below reorder level.`);
    nextActions.push("Review low-stock items and confirm purchase needs before field work is delayed.");
  }

  if (input.receivable > 0) {
    risks.push(`${money(input.receivable)} is still receivable from booked sales.`);
    nextActions.push(`Follow up on ${money(input.receivable)} receivables.`);
  }

  if (input.profitEstimate < 0) {
    risks.push(`Current profit estimate is negative at ${money(input.profitEstimate)}.`);
    nextActions.push("Check large expense categories and confirm sale entries are complete.");
  }

  return {
    ...responseBase(),
    summary: `${input.activeCropSeasons} active crop seasons with ${input.dailyReports.submitted}/${input.dailyReports.due} reports submitted. Estimated profit is ${money(input.profitEstimate)} from ${money(input.expectedRevenue)} revenue and ${money(input.seasonExpenses)} expenses.`,
    risks: risks.length > 0 ? risks.slice(0, 4) : ["No immediate dashboard risk detected from the current records."],
    nextActions: nextActions.length > 0 ? nextActions.slice(0, 4) : ["Keep daily reports, inventory movements, expenses, and receipts current."]
  };
}

export async function explainReportTotals(input: { rows: ProfitLossAiRow[] }) {
  const totals = input.rows.reduce(
    (summary, row) => {
      summary.expenses += row.expenses;
      summary.revenue += row.revenue;
      summary.profitLoss += row.profitLoss;
      summary.receivable += row.receivable;
      return summary;
    },
    { expenses: 0, revenue: 0, profitLoss: 0, receivable: 0 }
  );
  const best = input.rows.reduce<ProfitLossAiRow | undefined>((winner, row) => (!winner || row.profitLoss > winner.profitLoss ? row : winner), undefined);
  const lossRows = input.rows.filter((row) => row.profitLoss < 0);

  return {
    ...responseBase(),
    summary: `This report shows ${money(totals.revenue)} revenue, ${money(totals.expenses)} expenses, ${money(totals.profitLoss)} profit/loss, and ${money(totals.receivable)} receivable.`,
    highlights: [
      best ? `${best.cropSeasonName} on ${best.farmName} / ${best.blockName} contributes the strongest result at ${money(best.profitLoss)}.` : "No crop-season rows are available for this filter.",
      totals.receivable > 0 ? `${money(totals.receivable)} is not collected yet and should be tracked against buyers.` : "No receivable balance is shown in the current filter."
    ],
    watchouts:
      lossRows.length > 0
        ? lossRows.slice(0, 3).map((row) => `${row.cropSeasonName} is negative at ${money(row.profitLoss)}; check expenses, missing sales, and pending receipts.`)
        : ["No loss-making crop season is visible in this filter."]
  };
}

function firstUsefulLine(text: string, fileName?: string) {
  const line = text
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => entry && !/^(date|total|amount|paid|category)\b/i.test(entry));

  if (line) {
    return line.replace(/^(vendor|shop|store)\s*[:\-]\s*/i, "");
  }

  return fileName?.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
}

function parseAmount(text: string, rawText = text) {
  const amountLine = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /\b(total|amount|rs\.?|pkr)\b/i.test(line));
  const match = (amountLine ?? text).match(/(?:total|amount|rs\.?|pkr)?\s*([0-9][0-9,\s]*(?:\.\d{1,2})?)/i);
  return match ? Number(match[1].replace(/[,\s]/g, "")) : undefined;
}

function parseDate(text: string) {
  const iso = text.match(/\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2})\b/);
  if (iso) {
    return iso[1].replaceAll("/", "-");
  }

  const short = text.match(/\b(\d{1,2}[-/]\d{1,2}[-/]20\d{2})\b/);
  if (!short) {
    return undefined;
  }

  const [day, month, year] = short[1].split(/[-/]/);
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseCategory(text: string, rawText = text) {
  const categoryLine = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^category\s*[:\-]/i.test(line));
  const explicit = categoryLine?.match(/category\s*[:\-]\s*([a-z ]+)/i) ?? text.match(/category\s*[:\-]\s*([a-z ]+?)(?:\s{2,}|$)/i);
  if (explicit) {
    return explicit[1].trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  const candidates: Array<[RegExp, string]> = [
    [/fertili[sz]er|urea|dap/i, "Fertilizer"],
    [/diesel|petrol|fuel/i, "Fuel"],
    [/seed/i, "Seed"],
    [/pesticide|spray|herbicide|fungicide/i, "Crop Protection"],
    [/labor|wage|worker/i, "Labor"],
    [/repair|belt|pump|machinery/i, "Repair"]
  ];
  return candidates.find(([pattern]) => pattern.test(text))?.[1];
}

function parsePaymentStatus(text: string): ReceiptExtractionFields["paymentStatus"] {
  if (/partial|advance/i.test(text)) {
    return "PARTIAL";
  }

  if (/paid|cash|settled|received/i.test(text)) {
    return "PAID";
  }

  if (/unpaid|pending|credit|due/i.test(text)) {
    return "PENDING";
  }

  return undefined;
}

export async function extractReceiptFields(input: ReceiptExtractionInput) {
  const text = compactText(input.text ?? "");
  const rawText = input.text ?? "";
  const fields: ReceiptExtractionFields = {
    vendor: firstUsefulLine(rawText, input.fileName),
    date: parseDate(text),
    category: parseCategory(text, rawText),
    amount: parseAmount(text, rawText),
    paymentStatus: parsePaymentStatus(text)
  };

  return {
    ...responseBase(),
    fields,
    confidenceNotes: [
      fields.amount ? "Amount was detected from receipt text." : "Amount was not detected. Enter it manually before saving.",
      fields.date ? "Date was detected from receipt text." : "Date was not detected. Confirm the expense date.",
      "Extraction is a draft from pasted text or file metadata; verify vendor, category, tax, and payment status."
    ]
  };
}

export async function explainInventoryAlerts(input: InventoryAlertInput) {
  const lowStock = input.items.filter((item) => item.quantity <= item.lowStockLevel);

  return {
    ...responseBase(),
    overallRisk:
      lowStock.length > 0
        ? `${lowStock.length} low-stock item needs review before the next field activity.`
        : "No low-stock risk is visible from the current inventory list.",
    alerts: lowStock.map((item) => {
      const gap = Math.max(item.lowStockLevel - item.quantity, 0);
      const reorder = Math.max(Math.ceil(gap + item.lowStockLevel), 1);

      return {
        itemName: item.name,
        farmName: item.farmName,
        message: `${item.name} at ${item.farmName} is ${item.quantity} ${item.unit} against a ${item.lowStockLevel} ${item.unit} reorder level.`,
        usageRisk: gap > 0 ? `Current stock is short by ${gap} ${item.unit}; field work may pause if usage continues.` : "Stock is exactly at the reorder level.",
        suggestedReorderQuantity: reorder,
        suggestion: `Consider purchasing about ${reorder} ${item.unit} after checking pending purchases and upcoming work.`
      };
    })
  };
}

export async function draftNotifications(input: NotificationDraftInput) {
  const drafts = [
    ...input.lowStockItems
      .filter((item) => item.quantity <= item.lowStockLevel)
      .slice(0, 3)
      .map((item) => ({
        type: "Inventory",
        priority: "Urgent",
        message: `${item.name} is low at ${item.farmName}: ${item.quantity}/${item.lowStockLevel} ${item.unit}. Please confirm reorder need.`
      })),
    ...input.missingReports.slice(0, 3).map((report) => ({
      type: "Daily Report",
      priority: "Today",
      message: `Daily report is pending for ${report.cropName} at ${report.farmName} / ${report.blockName}. Please submit today's update.`
    })),
    ...(input.receivableAmount > 0
      ? [
          {
            type: "Receivable",
            priority: "Follow up",
            message: `${money(input.receivableAmount)} is pending collection. Please confirm buyer follow-up and expected payment date.`
          }
        ]
      : []),
    ...input.operationalWarnings.slice(0, 3).map((warning) => ({
      type: "Operations",
      priority: "Review",
      message: warning
    }))
  ];

  return {
    ...responseBase(),
    drafts,
    reviewReminder: "These are draft notifications only; review recipients, timing, and wording before sending."
  };
}
