"use client";

import Link from "next/link";
import { FitReplies } from "@/components/insights/fit-replies";
import { ReplyTimes } from "@/components/insights/reply-times";
import { WeeklyChart } from "@/components/insights/weekly-chart";
import { Scope } from "@/components/scope";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsights } from "@/hooks/use-insights";
import { percent, plural } from "@/lib/format";
import { MIN_SAMPLE, type Insights } from "@/lib/insights";
import { cn } from "@/lib/utils";

const daysText = (d: number | null) => (d === null ? "—" : d < 1 ? "<1" : String(Math.round(d)));

function summary(i: Insights): string {
  if (i.responseRate === null) return "";
  const parts = [`${percent(i.responseRate)} of your applications have had an answer`];
  if (i.medianDaysToReply !== null) parts.push(`usually within ${Math.max(1, Math.round(i.medianDaysToReply))} days`);
  return `${parts.join(", ")}.${i.offers ? ` ${plural(i.offers, "offer")} so far.` : ""}`;
}

export default function InsightsPage() {
  const { data, isLoading, isError } = useInsights();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1.5">
        <span className="label-quiet">Insights</span>
        <h1 className="text-3xl font-semibold tracking-[-0.025em]">How your search is going</h1>
        {data && data.total >= MIN_SAMPLE ? <p className="max-w-2xl text-lg text-ink-soft">{summary(data)}</p> : null}
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading insights">
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-12">
            <Skeleton className="h-72 rounded-xl lg:col-span-7" />
            <Skeleton className="h-72 rounded-xl lg:col-span-5" />
          </div>
        </div>
      ) : isError || !data ? (
        <Panel className="p-8 text-muted">Couldn’t load your insights. Refresh to try again.</Panel>
      ) : data.total < MIN_SAMPLE ? (
        <Panel className="grid items-center gap-8 p-8 md:grid-cols-[minmax(0,1fr)_220px] md:p-12">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">Nothing to measure yet</h2>
            <p className="max-w-md text-ink-soft">
              Insights need at least {MIN_SAMPLE} applications. Add the roles you’ve applied for and move them along as you hear
              back; reply times, stage lengths and your reply rate by fit score build up from there.
            </p>
            <Button asChild className="w-fit">
              <Link href="/applications">Go to the pipeline</Link>
            </Button>
          </div>
          <Scope className="mx-auto max-w-[220px]" />
        </Panel>
      ) : (
        <Report insights={data} />
      )}
    </div>
  );
}

function Report({ insights: i }: { insights: Insights }) {
  const kpis = [
    { label: "Response rate", value: i.responseRate === null ? "—" : percent(i.responseRate), note: `${i.replied} of ${plural(i.total, "application")}` },
    { label: "Median time to reply", value: daysText(i.medianDaysToReply), unit: "days", note: plural(i.replyTimes.length, "reply", "replies") + " timed" },
    { label: "Reached interviews", value: String(i.interviews), note: i.total ? `${percent(i.interviews / i.total)} of applications` : "" },
    { label: "Offers", value: String(i.offers), note: i.interviews ? `from ${plural(i.interviews, "interview process", "interview processes")}` : "None yet" },
  ];
  const longest = Math.max(1, ...i.stages.map((s) => s.medianDays ?? 0));

  return (
    <>
      <section aria-label="Key numbers" className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
        {kpis.map((kpi, n) => (
          <div
            key={kpi.label}
            className={cn("flex flex-col gap-0.5 py-4", n % 2 === 1 && "pl-5 max-lg:border-l max-lg:border-line", n > 0 && "lg:border-l lg:border-line lg:pl-6", n >= 2 && "max-lg:border-t max-lg:border-line")}
          >
            <span className="label-quiet">{kpi.label}</span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-[-0.04em]">{kpi.value}</span>
              {kpi.unit ? <span className="text-sm text-muted">{kpi.unit}</span> : null}
            </span>
            <span className="text-[13px] text-muted">{kpi.note}</span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="Does fit predict replies?" description="Reply rate by the fit score of the job post each application came from" />
            <FitReplies byFit={i.byFit} />
          </div>
        </Panel>
        <Panel className="lg:col-span-5">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="Time to first reply" description="Days from adding an application to its first answer" />
            {i.replyTimes.length ? (
              <ReplyTimes replyTimes={i.replyTimes} median={i.medianDaysToReply} />
            ) : (
              <p className="text-sm text-muted">No replies recorded yet. Move an application on when you hear back and it shows up here.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="Applications per week" description="Sent in each of the last 12 weeks, and how many of those have had an answer" />
            <WeeklyChart weekly={i.weekly} />
          </div>
        </Panel>
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Panel>
            <div className="flex flex-col gap-4 p-6">
              <PanelHeader title="Time in each stage" description="Median days, for applications that have moved on" />
              <ul className="flex flex-col gap-4">
                {i.stages.map((s) => (
                  <li key={s.id} className="flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold">{s.label}</span>
                      <span className="tabular">
                        <span className="font-semibold">{daysText(s.medianDays)}</span>
                        <span className="text-muted"> days</span>
                      </span>
                    </span>
                    <span className="h-2 rounded-[4px] bg-raised" aria-hidden="true">
                      {s.medianDays !== null ? (
                        <span className="block h-2 rounded-[4px] bg-brand" style={{ width: `${Math.max(3, (s.medianDays / longest) * 100)}%` }} />
                      ) : null}
                    </span>
                    <span className="text-[12px] text-muted tabular">
                      {s.finished} moved on · {s.open} still here
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
          <Panel>
            <div className="flex flex-col gap-2 p-6">
              <PanelHeader title="Do follow-ups work?" />
              {i.followUps.followedUp ? (
                <>
                  <p className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold tracking-[-0.04em]">{i.followUps.answered}</span>
                    <span className="text-muted">of {i.followUps.followedUp}</span>
                  </p>
                  <p className="text-sm text-ink-soft">
                    applications you followed up got an answer within three weeks of the follow-up.
                  </p>
                </>
              ) : (
                <p className="text-sm text-ink-soft">
                  Mark an application as followed up when you chase it, and this shows how often a nudge gets an answer.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
