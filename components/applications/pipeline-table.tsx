"use client";

import { useState } from "react";
import Link from "next/link";
import { AlarmClockOff, ArrowDown, ArrowUp, Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import { DeleteApplication } from "@/components/applications/delete-application";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Monogram } from "@/components/ui/monogram";
import { StagePill } from "@/components/ui/stage-pill";
import { useFollowUp, useUpdateApplication } from "@/hooks/use-applications";
import { APPLICATION_STATUSES, STATUS_LABELS, type Application, type ApplicationStatus } from "@/lib/applications";
import { shortDate } from "@/lib/format";
import { daysSince, lastActivity, needsFollowUp, relativeDays } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

type SortKey = "company" | "status" | "activity";

const stageOrder: Record<ApplicationStatus, number> = { applied: 0, "in-progress": 1, offer: 2, rejected: 3 };

function sortApplications(apps: Application[], key: SortKey, ascending: boolean) {
  const dir = ascending ? 1 : -1;
  return [...apps].sort((a, b) => {
    if (key === "company") return dir * a.company.localeCompare(b.company);
    if (key === "status") return dir * (stageOrder[a.status] - stageOrder[b.status]);
    return dir * (lastActivity(a).getTime() - lastActivity(b).getTime());
  });
}

type SortState = { key: SortKey; ascending: boolean };

function SortHeader({ column, label, sort, onSort }: {
  column: SortKey;
  label: string;
  sort: SortState;
  onSort: (sort: SortState) => void;
}) {
  const active = sort.key === column;
  const Icon = sort.ascending ? ArrowUp : ArrowDown;
  return (
    <span role="columnheader" aria-sort={active ? (sort.ascending ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort({ key: column, ascending: active ? !sort.ascending : column === "company" })}
        className={cn("label-quiet flex items-center gap-1 hover:text-ink", active && "text-ink")}
      >
        {label}
        {active ? <Icon className="size-3" aria-hidden="true" /> : null}
      </button>
    </span>
  );
}

const COLUMNS = "md:grid-cols-[minmax(0,2.4fr)_140px_150px_100px_44px]";

export function PipelineTable({ applications, now }: { applications: Application[]; now: Date }) {
  const [sort, setSort] = useState<SortState>({ key: "activity", ascending: false });
  const [editing, setEditing] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const update = useUpdateApplication();
  const followUp = useFollowUp();

  const rows = sortApplications(applications, sort.key, sort.ascending);

  return (
    <>
      <div role="table" aria-label="Applications" aria-rowcount={rows.length + 1}>
        <div role="row" className={cn("hidden items-center gap-4 border-b border-line px-6 py-2.5 md:grid", COLUMNS)}>
          <SortHeader column="company" label="Company · role" sort={sort} onSort={setSort} />
          <SortHeader column="status" label="Stage" sort={sort} onSort={setSort} />
          <SortHeader column="activity" label="Last activity" sort={sort} onSort={setSort} />
          <span role="columnheader" className="label-quiet">Added</span>
          <span role="columnheader" className="sr-only">Actions</span>
        </div>

        {rows.map((app) => {
          const overdue = needsFollowUp(app, now);
          return (
            <div
              key={app.id}
              role="row"
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line px-6 py-3.5 transition-colors last:border-b-0 hover:bg-raised/50",
                COLUMNS
              )}
            >
              <span role="cell" className="flex min-w-0 items-center gap-3">
                <Monogram name={app.company} />
                <span className="flex min-w-0 flex-col">
                  <Link href={`/applications/${app.id}`} className="truncate font-semibold hover:underline">
                    {app.company}
                  </Link>
                  <span className="truncate text-[13px] text-muted">{app.position}</span>
                </span>
              </span>
              <span role="cell" className="max-md:row-start-2">
                <StagePill status={app.status} />
              </span>
              <span
                role="cell"
                className={cn("flex items-center gap-2 text-sm tabular max-md:row-start-2 max-md:justify-self-end", overdue ? "font-medium text-warn-ink" : "text-muted")}
              >
                {overdue ? <span role="img" aria-label="Needs a follow-up" className="tri inline-block h-2 w-[9px] bg-warn" /> : null}
                {relativeDays(daysSince(lastActivity(app), now))}
              </span>
              <span role="cell" className="hidden text-sm text-muted tabular md:block">
                {shortDate(app.createdAt)}
              </span>
              <span role="cell" className="max-md:col-start-2 max-md:row-start-1 max-md:justify-self-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${app.company}`}>
                      <MoreHorizontal aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {overdue ? (
                      <>
                        <DropdownMenuItem onSelect={() => followUp.mutate({ id: app.id, action: { action: "followed-up" } })}>
                          <Check aria-hidden="true" /> I followed up
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => followUp.mutate({ id: app.id, action: { action: "snooze", days: 7 } })}>
                          <AlarmClockOff aria-hidden="true" /> Snooze for a week
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    ) : null}
                    <DropdownMenuLabel className="label-quiet px-3 py-2">Move to</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={app.status}
                      onValueChange={(status) => update.mutate({ id: app.id, update: { status: status as ApplicationStatus } })}
                    >
                      {APPLICATION_STATUSES.map((status) => (
                        <DropdownMenuRadioItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setEditing(app)}>
                      <Pencil aria-hidden="true" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDeleting(app)} className="text-danger focus:text-danger">
                      <Trash2 aria-hidden="true" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </span>
            </div>
          );
        })}
      </div>

      {editing ? (
        <ApplicationDialog
          application={editing}
          trigger={null}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
      <DeleteApplication application={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}
