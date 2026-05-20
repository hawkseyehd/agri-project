import { Sparkles } from "lucide-react";

export function AiInsightPanel({
  title,
  summary,
  items,
  footer
}: {
  title: string;
  summary: string;
  items?: string[];
  footer?: string;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <p className="font-medium text-slate-800">{summary}</p>
      </div>
      {items && items.length > 0 ? (
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
          <ul className="mt-2 space-y-2 text-slate-600">
            {items.map((item) => (
              <li key={item} className="border-l-2 border-emerald-200 pl-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {footer ? <p className="text-xs text-slate-500">{footer}</p> : null}
    </div>
  );
}
