"use client";

import { useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { AttentionList } from "@/components/dashboard/attention-list";
import { FirstRun } from "@/components/dashboard/first-run";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { SkillRadarCard } from "@/components/dashboard/skill-radar-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications, useMarkRemindersSeen, useReminders } from "@/hooks/use-applications";
import { dateLine, greeting, plural } from "@/lib/format";
import { pipelineStats, type PipelineStats } from "@/lib/pipeline";

function summary(stats: PipelineStats): string {
  if (!stats.total) return "Let’s get your search on the radar.";
  const parts: string[] = [];
  const quiet = stats.followUps.length;
  if (quiet) {
    parts.push(
      quiet === 1
        ? "One application has gone quiet and could use a follow-up."
        : `${quiet} applications have gone quiet and could use a follow-up.`
    );
  } else if (stats.active) {
    parts.push("Nothing has gone quiet — every active application has moved in the last 10 days.");
  } else {
    parts.push("You have no active applications right now.");
  }
  if (stats.inProgress) parts.push(`You’re in interviews with ${plural(stats.inProgress, "company", "companies")}.`);
  if (stats.offers) parts.push(`${plural(stats.offers, "offer")} on the table.`);
  return parts.join(" ");
}

export default function DashboardPage() {
  const { user } = useUser();
  const { data: applications, isLoading } = useApplications();
  const now = new Date();
  const stats = pipelineStats(applications ?? [], now);
  const name = user?.firstName;

  // Reminders that arrived since the last visit get a "New" marker, and
  // seeing them here counts as seen.
  const { data: reminders } = useReminders();
  const markSeen = useMarkRemindersSeen();
  const fresh = useMemo(() => new Set((reminders ?? []).map((r) => r.applicationId)), [reminders]);
  const { mutate: markRemindersSeen } = markSeen;
  const unseen = reminders?.length ?? 0;
  useEffect(() => {
    if (unseen) markRemindersSeen();
  }, [unseen, markRemindersSeen]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2.5">
        <span className="label-quiet" suppressHydrationWarning>
          {dateLine(now)}
        </span>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-[40px] sm:leading-[1.1]" suppressHydrationWarning>
          {greeting(now.getHours())}
          {name ? `, ${name}` : ""}.
        </h1>
        {isLoading ? (
          <Skeleton className="h-6 w-full max-w-xl" />
        ) : (
          <p className="max-w-2xl text-lg text-ink-soft">{summary(stats)}</p>
        )}
      </section>

      {isLoading ? (
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading your dashboard">
          <div className="grid gap-6 lg:grid-cols-12">
            <Skeleton className="h-96 rounded-xl lg:col-span-7" />
            <Skeleton className="h-96 rounded-xl lg:col-span-5" />
          </div>
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : !stats.total ? (
        <FirstRun />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-12">
            <AttentionList applications={applications ?? []} now={now} fresh={fresh} className="lg:col-span-7" />
            <SkillRadarCard className="lg:col-span-5" />
          </div>
          <KpiStrip stats={stats} />
          <div className="grid gap-6 lg:grid-cols-12">
            <PipelineFunnel stats={stats} className="lg:col-span-7" />
            <ActivityCard className="lg:col-span-5" />
          </div>
        </>
      )}
    </div>
  );
}
