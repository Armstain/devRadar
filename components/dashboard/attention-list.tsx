import Link from "next/link"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { STATUS_LABELS, type Application } from "@/lib/applications"
import { daysSince, lastActivity, needsFollowUp, relativeDays } from "@/lib/pipeline"
import { cn } from "@/lib/utils"

const LIMIT = 6

function nextStep(app: Application, overdue: boolean): string {
  if (overdue) return "send a follow-up"
  if (app.status === "offer") return "review the offer"
  return "prepare for the next round"
}

// What needs you: applications gone quiet first (a triangle marks each), then
// live interviews and offers.
export function AttentionList({ applications, now, className }: { applications: Application[]; now: Date; className?: string }) {
  const overdue = applications.filter((a) => needsFollowUp(a, now)).sort((a, b) => lastActivity(a).getTime() - lastActivity(b).getTime())
  const live = applications.filter((a) => (a.status === "in-progress" || a.status === "offer") && !needsFollowUp(a, now))
  const items = [...overdue, ...live].slice(0, LIMIT)

  return (
    <Panel className={className}>
      <div className="flex flex-col gap-2 p-5 sm:p-6">
        <PanelHeader
          title="Needs you"
          description={items.length ? "Sorted by how long they’ve been quiet" : undefined}
          action={<Link href="/applications?view=follow-up" className="text-[13px] text-brand hover:underline">All follow-ups</Link>}
        />
        {items.length ? (
          <ul className="mt-1">
            {items.map((app) => {
              const isOverdue = needsFollowUp(app, now)
              const days = daysSince(lastActivity(app), now)
              return (
                <li key={app.id} className="border-t border-line first:border-t-0">
                  <Link
                    href={`/applications/${app.id}`}
                    className="-mx-2 grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-raised/70"
                  >
                    {isOverdue ? (
                      <span aria-label="Gone quiet" className="tri inline-block h-2.5 w-[11px] bg-warn" />
                    ) : (
                      <span aria-hidden="true" className="size-[9px] rounded-full bg-brand" />
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{app.company}</span>
                      <span className="truncate text-[13px] text-muted">
                        {app.position} · {STATUS_LABELS[app.status].toLowerCase()} · {nextStep(app, isOverdue)}
                      </span>
                    </span>
                    <span className={cn("text-[13px] tabular", isOverdue ? "font-semibold text-warn-ink" : "text-ink-soft")}>{relativeDays(days)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-6 text-sm text-muted">Nothing needs you right now. Applications that go quiet for 10 days show up here.</p>
        )}
      </div>
    </Panel>
  )
}
