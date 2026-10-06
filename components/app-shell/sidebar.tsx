"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Github } from "lucide-react";
import { Logo } from "@/components/logo";
import { Monogram } from "@/components/ui/monogram";
import { Skeleton } from "@/components/ui/skeleton";
import { StageDot } from "@/components/ui/stage-pill";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { pipelineViews, workspaceNav } from "@/components/app-shell/nav";
import { useApplications, useMe } from "@/hooks/use-applications";
import { useHydrated } from "@/hooks/use-hydrated";
import { STATUS_LABELS } from "@/lib/applications";
import { byPriority, isActive, matchesView } from "@/lib/pipeline";
import { useClerkAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";

const PINNED = 4;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="label-mono px-2.5 pb-1.5">{children}</h2>;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const applicationsQuery = useApplications();
  const meQuery = useMe();
  // Until hydrated, render exactly what the server did: the loading state.
  const applications = hydrated ? applicationsQuery.data : undefined;
  const isLoading = !hydrated || applicationsQuery.isLoading;
  const me = hydrated ? meQuery.data : undefined;
  const { user } = useUser();
  const clerkAppearance = useClerkAppearance();

  const now = new Date();
  const activeView = pathname === "/applications" ? searchParams.get("view") : null;
  const active = byPriority((applications ?? []).filter(isActive));
  const pinned = active.slice(0, PINNED);
  const github = me?.github;

  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-7 px-4 py-6">
      <Link href="/dashboard" onClick={onNavigate} className="px-2">
        <Logo />
      </Link>

      <div className="flex flex-col gap-0.5">
        <SectionLabel>Workspace</SectionLabel>
        {workspaceNav.map((item) => {
          const current = item.match(pathname) && !activeView;
          const Icon = item.icon;
          const count = item.href === "/applications" ? applications?.length : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[15px] transition-colors",
                current ? "bg-raised font-semibold text-ink" : "text-muted hover:bg-raised hover:text-ink"
              )}
            >
              <Icon className={cn("size-4", current && "text-signal")} aria-hidden="true" />
              {item.label}
              {count ? <span className="ml-auto font-mono text-xs font-normal text-muted">{count}</span> : null}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-0.5">
        <SectionLabel>Views</SectionLabel>
        {pipelineViews.map(({ view, label, icon: Icon }) => {
          const count = applications?.filter((a) => matchesView(a, view, now)).length ?? 0;
          const urgent = view === "follow-up" && count > 0;
          const current = activeView === view;
          return (
            <Link
              key={view}
              href={`/applications?view=${view}`}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors hover:bg-raised",
                current && "bg-raised font-semibold"
              )}
            >
              <Icon className={cn("size-4", urgent ? "text-caution" : "text-muted")} aria-hidden="true" />
              {label}
              <span
                className={cn(
                  "ml-auto min-w-[22px] rounded-md px-1.5 py-px text-center font-mono text-xs",
                  urgent ? "bg-caution-soft text-caution" : "text-muted"
                )}
              >
                {isLoading ? "–" : count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-0.5">
        <SectionLabel>Active</SectionLabel>
        {isLoading ? (
          <div className="flex flex-col gap-2 px-2.5">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : pinned.length ? (
          <>
            {pinned.map((app) => {
              const href = `/applications/${app.id}`;
              const current = pathname === href;
              return (
                <Link
                  key={app.id}
                  href={href}
                  onClick={onNavigate}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors hover:bg-raised",
                    current && "bg-raised"
                  )}
                >
                  <Monogram name={app.company} size="sm" />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate font-medium">{app.company}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <StageDot status={app.status} className="size-1.5" />
                      {STATUS_LABELS[app.status]}
                    </span>
                  </span>
                </Link>
              );
            })}
            {active.length > PINNED ? (
              <Link href="/applications" onClick={onNavigate} className="flex min-h-9 items-center px-2.5 text-[13px] text-muted hover:text-ink">
                + {active.length - PINNED} more in your pipeline
              </Link>
            ) : null}
          </>
        ) : (
          <p className="px-2.5 text-[13px] text-muted">Active applications appear here for one-click access.</p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {github?.connected ? (
          <Link
            href="/github"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-xl border border-line p-3 text-[13px] hover:bg-raised"
          >
            <span className="size-2 shrink-0 rounded-full bg-signal" aria-hidden="true" />
            <span className="flex min-w-0 flex-col leading-snug">
              <span>GitHub connected</span>
              <span className="truncate font-mono text-[11px] text-muted">@{github.username}</span>
            </span>
          </Link>
        ) : me ? (
          <a href="/api/auth/github" className="flex items-center gap-2.5 rounded-xl border border-dashed border-line p-3 text-[13px] hover:bg-raised">
            <Github className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="flex flex-col leading-snug">
              <span className="font-medium">Connect GitHub</span>
              <span className="text-[12px] text-muted">Draws your skill radar</span>
            </span>
          </a>
        ) : null}
        <div className="flex items-center gap-2.5 pl-1.5">
          <UserButton appearance={clerkAppearance} />
          <span className="truncate text-sm font-medium">{user?.firstName ?? user?.username ?? ""}</span>
          <span className="ml-auto">
            <ThemeToggle />
          </span>
        </div>
      </div>
    </nav>
  );
}
