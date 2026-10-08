"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { StatusIcon } from "@/components/fit/status-icon"
import { ScoreReadout } from "@/components/instrument/score"
import { Panel } from "@/components/ui/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { useJobPost } from "@/hooks/use-job-posts"

// The fit summary on an application created from an analysed job post.
export function FitCard({ jobPostId }: { jobPostId: string }) {
  const { data: view, isLoading } = useJobPost(jobPostId)
  if (isLoading) return <Skeleton className="h-44 rounded-xl" />
  if (!view) return null

  const { fit } = view
  const gaps = fit.requirements.filter((r) => r.importance === "required" && (r.status === "gap" || r.status === "related")).slice(0, 3)

  return (
    <Panel>
      <div className="flex flex-col gap-4 p-6">
        <span className="label-quiet">Fit for this role</span>
        <ScoreReadout score={fit.score} verdict={fit.verdict} counts={fit.counts} size="md" />
        {gaps.length ? (
          <ul className="flex flex-col gap-2 text-sm">
            {gaps.map((r) => (
              <li key={r.skill} className="flex items-center gap-2.5">
                <StatusIcon status={r.status} className="size-4" />
                <span>{r.technology?.name ?? r.skill}</span>
                <span className="text-muted">{r.status === "related" ? `· close, via ${r.related?.name}` : "· gap"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{fit.summary}</p>
        )}
        <Link href={`/fit/${jobPostId}`} className="flex w-fit items-center gap-1.5 text-sm font-medium text-brand hover:underline">
          Fit report and interview prep <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Panel>
  )
}
