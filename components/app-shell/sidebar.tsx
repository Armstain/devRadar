"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, Plus, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { pipelineViews, workspaceNav } from "@/components/app-shell/nav";
import type { LayoutMode } from "@/components/app-shell/layout-mode";
import { useApplications } from "@/hooks/use-applications";
import { useHydrated } from "@/hooks/use-hydrated";
import { byPriority, isActive, matchesView } from "@/lib/pipeline";
import { useClerkAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";

const PINNED = 4;
const vt = (name: string) => ({ viewTransitionName: name }) as React.CSSProperties;

interface NavProps {
  layout: LayoutMode;
  // "drawer" is the phone menu: always vertical, no layout switch
  mode?: "shell" | "drawer";
  modKey: string;
  onToggleLayout?: () => void;
  onSearch: () => void;
  onAdd: () => void;
  onNavigate?: () => void;
  onMenu?: () => void;
}

// One nav element, two arrangements. In the top bar it's a single row; in
// the sidebar it's a column with the pipeline shortcuts underneath. Every item
// keeps a view-transition name, so switching layouts moves each one into place.
export function Nav({ layout, mode = "shell", modKey, onToggleLayout, onSearch, onAdd, onNavigate, onMenu }: NavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const applicationsQuery = useApplications();
  const clerkAppearance = useClerkAppearance();
  const side = layout === "side" || mode === "drawer";
  const names = mode === "shell";

  // Until hydrated, render what the server did: no client-cached data.
  const applications = hydrated ? applicationsQuery.data : undefined;
  const isLoading = !hydrated || applicationsQuery.isLoading;
  const now = new Date();
  const activeView = pathname === "/applications" ? searchParams.get("view") : null;
  const active = byPriority((applications ?? []).filter(isActive)).slice(0, PINNED);

  return (
    <nav
      aria-label="Main"
      className={cn(
        "flex min-w-0",
        side ? "h-full flex-col gap-1 overflow-y-auto px-3 py-4" : "items-center gap-1 px-4 py-2.5 sm:px-6"
      )}
    >
      {onMenu && !side ? (
        <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open navigation" onClick={onMenu}>
          <Menu aria-hidden="true" />
        </Button>
      ) : null}
      <Link href="/dashboard" onClick={onNavigate} className={cn("rounded-lg px-2 py-1.5", side ? "mb-3" : "mr-4")} style={names ? vt("nav-brand") : undefined}>
        <Logo />
      </Link>

      <div className={cn("flex min-w-0", side ? "flex-col gap-0.5" : "gap-0.5 max-lg:hidden")}>
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
              style={names ? vt(`nav-${item.key}`) : undefined}
              className={cn(
                "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 text-[14.5px] transition-colors",
                side ? "min-h-9" : "min-h-9",
                current ? "bg-raised font-semibold text-ink" : "text-muted hover:bg-raised hover:text-ink"
              )}
            >
              {side ? <Icon className={cn("size-4", current && "text-brand")} aria-hidden="true" /> : null}
              {item.label}
              {side && count ? <span className="ml-auto text-xs font-normal text-muted tabular">{count}</span> : null}
            </Link>
          );
        })}
      </div>

      {side ? (
        <div className="mt-5 flex flex-col gap-5" style={names ? vt("nav-extras") : undefined}>
          <div className="flex flex-col gap-0.5">
            <h2 className="label-quiet px-2.5 pb-1">Needs you</h2>
            {pipelineViews.map(({ view, label }) => {
              const count = applications?.filter((a) => matchesView(a, view, now)).length ?? 0;
              const urgent = view === "follow-up" && count > 0;
              const current = activeView === view;
              return (
                <Link
                  key={view}
                  href={`/applications?view=${view}`}
                  onClick={onNavigate}
                  aria-current={current ? "page" : undefined}
                  className={cn("flex min-h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm text-ink-soft transition-colors hover:bg-raised hover:text-ink", current && "bg-raised font-semibold text-ink")}
                >
                  {view === "follow-up" ? (
                    <span aria-hidden="true" className={cn("tri inline-block h-2 w-[9px]", urgent ? "bg-warn" : "bg-scope")} />
                  ) : view === "interviews" ? (
                    <span aria-hidden="true" className="size-[7px] rounded-full bg-brand" />
                  ) : (
                    <span aria-hidden="true" className="size-[7px] rounded-full border-[1.5px] border-muted" />
                  )}
                  {label}
                  <span className={cn("ml-auto text-xs tabular", urgent ? "font-semibold text-warn-ink" : "text-muted")}>{isLoading ? "–" : count}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="label-quiet px-2.5 pb-1">Active</h2>
            {isLoading ? (
              <div className="flex flex-col gap-2 px-2.5">
                <Skeleton className="h-6" />
                <Skeleton className="h-6" />
              </div>
            ) : active.length ? (
              active.map((app) => {
                const href = `/applications/${app.id}`;
                return (
                  <Link
                    key={app.id}
                    href={href}
                    onClick={onNavigate}
                    aria-current={pathname === href ? "page" : undefined}
                    className={cn("flex min-h-8 items-center gap-2 truncate rounded-lg px-2.5 text-sm text-ink-soft hover:bg-raised hover:text-ink", pathname === href && "bg-raised text-ink")}
                  >
                    <span className="truncate">{app.company}</span>
                  </Link>
                );
              })
            ) : (
              <p className="px-2.5 text-[13px] text-muted">Active applications appear here.</p>
            )}
          </div>
        </div>
      ) : null}

      <div className={cn("flex items-center gap-2", side ? "mt-auto flex-wrap pt-5" : "ml-auto")}>
        <button
          type="button"
          onClick={onSearch}
          style={names ? vt("nav-search") : undefined}
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-2.5 text-[13.5px] text-muted transition-colors hover:text-ink",
            side ? "order-first mb-1 w-full" : "max-sm:hidden"
          )}
        >
          <Search className="size-4" aria-hidden="true" />
          Search
          <Kbd className={cn("text-[11px]", side ? "ml-auto" : "ml-6")}>{modKey}K</Kbd>
        </button>
        {mode === "shell" ? (
          <Button size="sm" onClick={onAdd} style={vt("nav-add")} className={cn(side && "order-first mb-1 w-full")}>
            <Plus aria-hidden="true" />
            <span className={cn(!side && "max-sm:sr-only")}>Add application</span>
          </Button>
        ) : null}
        <span className={cn("flex items-center gap-1", side && "w-full")} style={names ? vt("nav-account") : undefined}>
          <UserButton appearance={clerkAppearance} />
          <span className={cn(side ? "ml-auto" : "")}>
            <ThemeToggle />
          </span>
          {onToggleLayout ? (
            <LayoutToggle layout={layout} modKey={modKey} onToggle={onToggleLayout} />
          ) : null}
        </span>
      </div>
    </nav>
  );
}

// A tiny window whose highlighted bar slides from the top edge to the left
// edge as the layout changes.
function LayoutToggle({ layout, modKey, onToggle }: { layout: LayoutMode; modKey: string; onToggle: () => void }) {
  const next = layout === "top" ? "sidebar" : "top bar";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${next} (${modKey}B)`}
      title={`Switch to ${next} (${modKey}B)`}
      className="group grid size-9 place-items-center rounded-lg border border-line bg-panel max-lg:hidden"
    >
      <svg viewBox="0 0 18 18" className="size-[18px]" aria-hidden="true">
        <rect x="0.75" y="0.75" width="16.5" height="16.5" rx="3.5" fill="none" className="stroke-ink-soft group-hover:stroke-ink" strokeWidth="1.5" />
        <rect
          x="2"
          y="2"
          rx="1.2"
          className="fill-brand transition-[width,height] duration-[380ms] ease-[var(--ease-instrument)]"
          style={{ width: layout === "top" ? 14 : 4, height: layout === "top" ? 4 : 14 }}
        />
      </svg>
    </button>
  );
}
