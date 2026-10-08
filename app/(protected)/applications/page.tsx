"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ScanSearch, Search } from "lucide-react";
import { CSVImport } from "@/components/applications/csv-import";
import { PipelineTable } from "@/components/applications/pipeline-table";
import { FirstRun } from "@/components/dashboard/first-run";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications } from "@/hooks/use-applications";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Application } from "@/lib/applications";
import { plural } from "@/lib/format";
import { matchesView, type PipelineView } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

type Filter = "all" | PipelineView | "applied" | "rejected";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "follow-up", label: "Needs follow-up" },
  { id: "applied", label: "Applied" },
  { id: "interviews", label: "In progress" },
  { id: "offers", label: "Offers" },
  { id: "rejected", label: "Rejected" },
];

function applyFilter(apps: Application[], filter: Filter, now: Date) {
  if (filter === "all") return apps;
  if (filter === "applied" || filter === "rejected") return apps.filter((a) => a.status === filter);
  return apps.filter((a) => matchesView(a, filter, now));
}

function PipelinePage() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("view") as Filter | null;
  const filter: Filter = filters.some((f) => f.id === requested) ? (requested as Filter) : "all";
  const [query, setQuery] = useState("");
  // Hydrates inside a Suspense boundary, so wait until hydrated before using
  // cached data the server didn't render.
  const hydrated = useHydrated();
  const applicationsQuery = useApplications();
  const applications = hydrated ? applicationsQuery.data : undefined;
  const isLoading = !hydrated || applicationsQuery.isLoading;
  const isError = hydrated && applicationsQuery.isError;
  const now = new Date();

  const all = applications ?? [];
  const q = query.trim().toLowerCase();
  const visible = applyFilter(all, filter, now).filter(
    (a) => !q || a.company.toLowerCase().includes(q) || a.position.toLowerCase().includes(q)
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-[-0.025em]">Pipeline</h1>
          <p className="text-ink-soft tabular">{isLoading ? "Loading…" : `${plural(all.length, "application")} tracked`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CSVImport />
          <Button asChild>
            <Link href="/fit">
              <ScanSearch aria-hidden="true" />
              Add from job post
            </Link>
          </Button>
        </div>
      </header>

      {isError ? (
        <Panel className="p-8 text-center text-muted">Couldn’t load your applications. Refresh to try again.</Panel>
      ) : isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !all.length ? (
        <FirstRun />
      ) : (
        <Panel className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <nav aria-label="Filter applications" className="-mx-1 flex gap-1 overflow-x-auto px-1">
              {filters.map((f) => {
                const count = applyFilter(all, f.id, now).length;
                const current = f.id === filter;
                return (
                  <Link
                    key={f.id}
                    href={f.id === "all" ? "/applications" : `/applications?view=${f.id}`}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm transition-colors",
                      current ? "bg-raised font-semibold" : "text-muted hover:bg-raised hover:text-ink"
                    )}
                  >
                    {f.label}
                    <span
                      className={cn(
                        "text-xs tabular",
                        f.id === "follow-up" && count ? "font-semibold text-warn-ink" : "text-muted"
                      )}
                    >
                      {count}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by company or role"
                aria-label="Filter by company or role"
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>
          {visible.length ? (
            <PipelineTable applications={visible} now={now} />
          ) : (
            <p className="px-6 py-12 text-center text-muted">
              {q
                ? `No applications match “${query}”.`
                : filter === "follow-up"
                  ? "Nothing needs a follow-up. Applications that go quiet for 10 days appear here."
                  : "No applications in this stage yet."}
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <PipelinePage />
    </Suspense>
  );
}
