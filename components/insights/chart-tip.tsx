import { cn } from "@/lib/utils"

// A hover/focus readout for one mark. Pure CSS: the mark is a `group` and the
// tip shows while it's hovered or focused. Values lead, labels follow.
export function ChartTip({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <span
      role="presentation"
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 flex -translate-x-1/2 flex-col whitespace-nowrap rounded-lg border border-line bg-panel px-2.5 py-1.5 text-left opacity-0 shadow-overlay transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100",
        className
      )}
    >
      <span className="text-[13px] font-semibold tabular text-ink">{value}</span>
      <span className="text-[12px] text-muted">{label}</span>
    </span>
  )
}

export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="group/table text-[13px]">
      <summary className="w-fit cursor-pointer list-none text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="group-open/table:hidden">Show as a table</span>
        <span className="hidden group-open/table:inline">Hide the table</span>
      </summary>
      <table className="mt-3 w-full">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-left text-muted">
            {head.map((h, i) => (
              <th key={h} scope="col" className={cn("py-1.5 font-medium", i > 0 && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])} className="border-b border-line last:border-b-0">
              {row.map((cell, i) => (
                <td key={i} className={cn("py-1.5", i > 0 && "text-right tabular")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
