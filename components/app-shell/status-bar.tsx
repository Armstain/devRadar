"use client";

import Link from "next/link";
import { useGithubProfile, syncInProgress } from "@/hooks/use-github";
import { useApplications, useReminders } from "@/hooks/use-applications";
import { useHydrated } from "@/hooks/use-hydrated";
import type { LayoutMode } from "@/components/app-shell/layout-mode";
import { timeAgo } from "@/lib/format";
import { needsFollowUp } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

// An editor-style status bar: the state a developer wants at a glance (sync,
// what was read, what's due) and the two shortcuts that drive the app.
export function StatusBar({
  layout,
  modKey,
  onCommand,
  onToggleLayout,
}: {
  layout: LayoutMode;
  modKey: string;
  onCommand: () => void;
  onToggleLayout: () => void;
}) {
  const hydrated = useHydrated();
  const { data: github } = useGithubProfile();
  const { data: applications } = useApplications();
  const { data: reminders } = useReminders();
  const now = new Date();
  const due = hydrated ? (applications ?? []).filter((a) => needsFollowUp(a, now)).length : 0;
  const syncing = syncInProgress(github);

  let githubText = "Checking GitHub…";
  if (hydrated && github) {
    if (!github.connected) githubText = "GitHub not connected";
    else if (syncing) githubText = "Syncing GitHub…";
    else if (github.status === "failed") githubText = "GitHub sync failed";
    else if (github.syncedAt) githubText = `GitHub synced ${timeAgo(github.syncedAt, now)}`;
    else githubText = "GitHub connected";
  }
  const githubOk = hydrated && github?.connected && github.status !== "failed";
  const profile = hydrated ? github?.profile : null;

  return (
    <footer
      aria-label="Status"
      className="flex h-[30px] items-center gap-5 overflow-hidden whitespace-nowrap border-t border-line bg-status px-3.5 text-[12.5px] text-ink-soft"
    >
      <Link href="/github" className="inline-flex items-center gap-2 hover:text-ink">
        <span
          aria-hidden="true"
          className={cn(
            "size-[7px] rounded-full",
            githubOk ? "bg-brand" : github?.status === "failed" ? "bg-danger" : "border-[1.5px] border-muted",
            syncing && "animate-pulse"
          )}
        />
        {githubText}
      </Link>
      {profile ? (
        <span className="hidden tabular sm:inline">
          {profile.stats.reposAnalyzed} repositories · {profile.stats.technologyCount} technologies
        </span>
      ) : null}
      {due ? (
        <Link href="/applications?view=follow-up" className="inline-flex items-center gap-2 hover:text-ink">
          <span aria-hidden="true" className="tri inline-block h-2 w-[9px] bg-warn" />
          <span className="tabular">{due}</span> follow-up{due === 1 ? "" : "s"} due
          {hydrated && reminders?.length ? <span className="font-semibold text-brand tabular">· {reminders.length} new</span> : null}
        </Link>
      ) : null}
      <span className="ml-auto flex items-center gap-4 max-sm:hidden">
        <button type="button" onClick={onCommand} className="hover:text-ink">
          <span className="font-mono text-[11.5px] text-muted">{modKey}K</span> commands
        </button>
        <button type="button" onClick={onToggleLayout} className="hover:text-ink max-lg:hidden">
          <span className="font-mono text-[11.5px] text-muted">{modKey}B</span> {layout === "top" ? "top bar" : "sidebar"}
        </button>
      </span>
    </footer>
  );
}
