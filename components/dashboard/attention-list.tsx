import Link from "next/link"
import { Clock } from "lucide-react"
import { Monogram } from "@/components/ui/monogram"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { StagePill } from "@/components/ui/stage-pill"
import type { Application } from "@/lib/applications"
import { daysSince, lastActivity, needsFollowUp, relativeDays } from "@/lib/pipeline"
import { cn } from "@/lib/utils"

const LIMIT = 6

function nextStep(app: Application, overdue: boolean): string {
  if (overdue) return "Send a follow-up"
  if (app.status === "offer") return "Review the offer"
  return "Prepare for the next round"
}

export function AttentionList({ applications, now }: { applications: Application[]; now: Date }) {
  const overdue = applications.filter((a) => needsFollowUp(a, now)).sort((a, b) => lastActivity(a).getTime() - lastActivity(b).getTime())
  const live = applications.filter((a) => (a.status === "in-progress" || a.status === "offer") && !needsFollowUp(a, now))
  const items = [...overdue, ...live].slice(0, LIMIT)

  return (
    <Panel className="overflow-hidden">
      <div className="px-6 pb-3 pt-6">
        <PanelHeader
          title="Needs attention"
          description={items.length ? "Quiet applications first, then live interviews and offers" : undefined}
          action={<Link href="/applications?view=follow-up" className="text-[13px] text-signal hover:underline">All follow-ups</Link>}
        />
      </div>
      {items.length ? (
        <ul>
          {items.map((app) => {
            const isOverdue = needsFollowUp(app, now)
            const days = daysSince(lastActivity(app), now)
            return (
              <li key={app.id} className="border-t border-line">
                <Link
                  href={`/applications/${app.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-6 py-3.5 transition-colors hover:bg-raised/60 md:grid-cols-[minmax(0,2.2fr)_130px_150px_minmax(0,1.6fr)]"
                >
                  <span className="flex min-w-0 items-center gap-3 max-md:col-span-2">
                    <Monogram name={app.company} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{app.company}</span>
                      <span className="truncate text-[13px] text-muted">{app.position}</span>
                    </span>
                  </span>
                  <span className="md:justify-self-start">
                    <StagePill status={app.status} />
                  </span>
                  <span className={cn("flex items-center gap-1.5 text-sm max-md:justify-self-end", isOverdue ? "text-caution" : "text-muted")}>
                    {isOverdue ? <Clock className="size-3.5" aria-label="Overdue" /> : null}
                    {relativeDays(days)}
                  </span>
                  <span className="hidden text-sm md:block">{nextStep(app, isOverdue)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="border-t border-line px-6 py-8 text-sm text-muted">
          Nothing needs you right now. Applications that go quiet for 10 days show up here.
        </p>
      )}
    </Panel>
  )
}
