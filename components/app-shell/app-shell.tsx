"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import { CommandMenu } from "@/components/app-shell/command-menu";
import type { LayoutMode } from "@/components/app-shell/layout-mode";
import { modKey as detectModKey, useLayoutMode } from "@/components/app-shell/use-layout-mode";
import { Nav } from "@/components/app-shell/sidebar";
import { StatusBar } from "@/components/app-shell/status-bar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));

// The app frame: one nav that sits on top or down the side (⌘B / Ctrl+B),
// the page, and an editor-style status bar along the bottom.
export function AppShell({ initialLayout, children }: { initialLayout: LayoutMode; children: React.ReactNode }) {
  const { layout, toggle } = useLayoutMode(initialLayout);
  const [commandOpen, setCommandOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const hydrated = useHydrated();
  const mod = hydrated ? detectModKey() : "⌘";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      } else if (key === "b" && !isTyping(event.target) && window.matchMedia("(min-width: 1024px)").matches) {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  const openAdd = useCallback(() => setAddOpen(true), []);
  const openSearch = useCallback(() => setCommandOpen(true), []);

  return (
    <div
      data-layout={layout}
      className={cn(
        "grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] [grid-template-areas:'nav'_'main'_'status']",
        layout === "side" &&
          "lg:grid-cols-[248px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_auto] lg:[grid-template-areas:'nav_main'_'status_status']"
      )}
    >
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-brand px-4 py-2 font-semibold text-brand-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <div className={cn("min-w-0 [grid-area:nav]", layout === "side" ? "border-b border-line lg:border-b-0 lg:border-r" : "border-b border-line")}>
        <Suspense>
          <Nav
            layout={hydrated ? layout : initialLayout}
            modKey={mod}
            onToggleLayout={toggle}
            onSearch={openSearch}
            onAdd={openAdd}
            onMenu={() => setNavOpen(true)}
          />
        </Suspense>
      </div>

      <Dialog open={navOpen} onOpenChange={setNavOpen}>
        <DialogContent side="left" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <Suspense>
            <Nav layout="side" mode="drawer" modKey={mod} onSearch={openSearch} onAdd={openAdd} onNavigate={() => setNavOpen(false)} />
          </Suspense>
        </DialogContent>
      </Dialog>

      <main id="main" className="min-w-0 overflow-y-auto [grid-area:main] [view-transition-name:app-main]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">{children}</div>
      </main>

      <div className="[grid-area:status]">
        <StatusBar layout={layout} modKey={mod} onCommand={openSearch} onToggleLayout={toggle} />
      </div>

      <ApplicationDialog open={addOpen} onOpenChange={setAddOpen} trigger={null} />
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} onAddApplication={openAdd} onToggleLayout={toggle} layout={layout} />
    </div>
  );
}
