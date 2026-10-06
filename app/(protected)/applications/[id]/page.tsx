"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, Clock, ExternalLink, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import { DeleteApplication } from "@/components/applications/delete-application";
import { Button } from "@/components/ui/button";
import { Monogram } from "@/components/ui/monogram";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplication, useUpdateApplication } from "@/hooks/use-applications";
import { STATUS_LABELS, type Application, type ApplicationStatus, type ApplicationWithEvents } from "@/lib/applications";
import { plural, shortDate } from "@/lib/format";
import { daysSince, FOLLOW_UP_DAYS, lastActivity, needsFollowUp, relativeDays } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

const STEPS = (["applied", "in-progress", "offer"] as const).map((status) => ({ status, label: STATUS_LABELS[status] }));

function StageStepper({ app }: { app: Application }) {
  const update = useUpdateApplication();
  const rejected = app.status === "rejected";
  const currentIndex = STEPS.findIndex((s) => s.status === app.status);
  const setStatus = (status: ApplicationStatus) => update.mutate({ id: app.id, update: { status } });

  return (
    <div className="flex flex-col gap-3">
      <ol aria-label="Hiring stages" className="grid grid-cols-3 gap-3">
        {STEPS.map((step, i) => {
          const done = !rejected && i < currentIndex;
          const current = !rejected && i === currentIndex;
          return (
            <li key={step.status}>
              <button
                type="button"
                onClick={() => setStatus(step.status)}
                disabled={current}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "group flex w-full flex-col items-start gap-2 border-t-[3px] pt-3 text-left transition-colors disabled:cursor-default",
                  done || current ? "border-signal" : "border-line hover:border-muted"
                )}
              >
                <span className={cn("flex items-center gap-2 font-semibold", !done && !current && "text-muted group-hover:text-ink")}>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-[18px] items-center justify-center rounded-full",
                      done && "bg-signal text-signal-ink",
                      current && "bg-signal shadow-[inset_0_0_0_3px_var(--ground)] ring-2 ring-signal",
                      !done && !current && "border-[1.5px] border-muted"
                    )}
                  >
                    {done ? <Check className="size-3" strokeWidth={3} /> : null}
                  </span>
                  {step.label}
                </span>
                <span className="text-[13px] text-muted">
                  {current ? "Current stage" : done ? "Done" : `Move to ${step.label.toLowerCase()}`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {rejected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-raised px-4 py-3 text-sm">
          <span className="flex items-center gap-2">
            <X className="size-4 text-muted" aria-hidden="true" /> Closed without an offer.
          </span>
          <Button variant="ghost" size="sm" onClick={() => setStatus("applied")}>
            <RotateCcw aria-hidden="true" /> Reopen
          </Button>
        </div>
      ) : (
        <button type="button" onClick={() => setStatus("rejected")} className="w-fit text-[13px] text-muted hover:text-ink hover:underline">
          Mark as rejected
        </button>
      )}
    </div>
  );
}

function nextStep(app: Application, now: Date) {
  const quiet = daysSince(lastActivity(app), now);
  if (needsFollowUp(app, now)) {
    return {
      urgent: true,
      title: "Send a follow-up",
      body: `It’s been ${quiet} days without movement. A short, specific note to the recruiter keeps you on their radar.`,
    };
  }
  switch (app.status) {
    case "applied":
      return {
        urgent: false,
        title: "Wait for a response",
        body: `If you haven’t heard back in ${plural(FOLLOW_UP_DAYS - quiet, "more day")}, DevRadar will remind you to follow up.`,
      };
    case "in-progress":
      return { urgent: false, title: "Prepare for the next round", body: "Review the job post and practise the questions it suggests." };
    case "offer":
      return { urgent: false, title: "Review the offer", body: "Compare it with your other conversations before you reply." };
    default:
      return { urgent: false, title: "Nothing to do", body: "This application is closed. Reopen it if anything changes." };
  }
}

// Newest first: stage changes from the event history, plus the latest edit
// when it happened after the last stage change.
function timeline(app: ApplicationWithEvents) {
  const items = [...app.events].reverse().map((event) => ({
    key: event.id,
    when: event.createdAt,
    title:
      event.type === "created"
        ? `Added as ${STATUS_LABELS[event.toStatus ?? "applied"].toLowerCase()}`
        : `Moved from ${STATUS_LABELS[event.fromStatus ?? "applied"].toLowerCase()} to ${STATUS_LABELS[event.toStatus ?? "applied"].toLowerCase()}`,
  }));
  const lastEvent = app.events.at(-1);
  if (!lastEvent || new Date(app.updatedAt).getTime() - new Date(lastEvent.createdAt).getTime() > 60_000) {
    items.unshift({ key: "edited", when: app.updatedAt, title: "Details edited" });
  }
  return items;
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: app, isLoading } = useApplication(id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const now = new Date();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!app) {
    return (
      <Panel className="flex flex-col items-center gap-3 p-12 text-center">
        <h1 className="text-xl font-semibold">Application not found</h1>
        <p className="text-muted">It may have been deleted.</p>
        <Button asChild variant="secondary">
          <Link href="/applications">Back to pipeline</Link>
        </Button>
      </Panel>
    );
  }

  const step = nextStep(app, now);

  return (
    <div className="flex flex-col gap-7">
      <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-muted">
        <Link href="/applications" className="hover:text-ink hover:underline">Pipeline</Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink" aria-current="page">{app.company}</span>
      </nav>

      <header className="flex flex-wrap items-start gap-5">
        <Monogram name={app.company} size="lg" inverted />
        <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-[34px]">{app.position}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="font-medium text-ink">{app.company}</span>
            <span>Added {shortDate(app.createdAt)}</span>
            {app.link ? (
              <a href={app.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-signal hover:underline">
                Job post <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" /> Edit
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete application" onClick={() => setDeleting(true)}>
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </header>

      <StageStepper app={app} />

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader
              title="Notes"
              action={
                <button type="button" onClick={() => setEditing(true)} className="text-[13px] text-signal hover:underline">
                  {app.notes ? "Edit" : "Add notes"}
                </button>
              }
            />
            {app.notes ? (
              <p className="whitespace-pre-wrap leading-relaxed">{app.notes}</p>
            ) : (
              <p className="text-muted">Who you spoke to, what stood out, what they asked — write it down while it’s fresh.</p>
            )}
          </div>
        </Panel>

        <aside className="flex flex-col gap-6 lg:col-span-5">
          <Panel className={cn(step.urgent && "border-caution/40")}>
            <div className="flex flex-col gap-2 p-6">
              <span className={cn("label-mono flex items-center gap-1.5", step.urgent && "text-caution")}>
                {step.urgent ? <Clock className="size-3.5" aria-hidden="true" /> : null}
                Next step
              </span>
              <p className="text-lg font-semibold">{step.title}</p>
              <p className="text-sm text-muted">{step.body}</p>
            </div>
          </Panel>

          <Panel>
            <div className="flex flex-col gap-4 p-6">
              <PanelHeader title="Timeline" as="h2" />
              <ol className="flex flex-col">
                {timeline(app).map((event, i, list) => (
                  <li key={event.key} className="flex gap-3.5">
                    <span className="flex w-3 flex-col items-center">
                      <span
                        aria-hidden="true"
                        className={cn("mt-1.5 size-2.5 rounded-full", i === 0 ? "bg-signal" : "border-[1.5px] border-muted")}
                      />
                      {i < list.length - 1 ? <span className="mt-1 w-px flex-1 bg-line" /> : null}
                    </span>
                    <span className="flex flex-col pb-4">
                      <span className="font-medium">{event.title}</span>
                      <span className="font-mono text-xs text-muted">
                        {shortDate(event.when)} · {relativeDays(daysSince(new Date(event.when), now))}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Panel>
        </aside>
      </div>

      <ApplicationDialog application={app} trigger={null} open={editing} onOpenChange={setEditing} />
      <DeleteApplication
        application={deleting ? app : null}
        onOpenChange={setDeleting}
        onDeleted={() => router.push("/applications")}
      />
    </div>
  );
}
