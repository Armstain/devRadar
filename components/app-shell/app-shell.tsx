"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Plus, Search } from "lucide-react";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import { CommandMenu } from "@/components/app-shell/command-menu";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const openAdd = useCallback(() => setAddOpen(true), []);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-signal px-4 py-2 font-semibold text-signal-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto border-r border-line lg:block">
        <Suspense>
          <Sidebar />
        </Suspense>
      </aside>

      <Dialog open={navOpen} onOpenChange={setNavOpen}>
        <DialogContent side="left" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <Suspense>
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </Suspense>
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-ground/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:border-b-0 lg:bg-ground lg:px-10 lg:pt-5 lg:backdrop-blur-none">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
            <Menu aria-hidden="true" />
          </Button>
          <Link href="/dashboard" className="lg:hidden" aria-label="DevRadar home">
            <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          </Link>
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-line bg-panel px-3.5 text-left text-[15px] text-muted transition-colors hover:border-muted/50 sm:max-w-md"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Search applications, pages…</span>
            <Kbd className="ml-auto hidden sm:inline">⌘K</Kbd>
          </button>
          <span className="hidden flex-1 sm:block" />
          <ApplicationDialog open={addOpen} onOpenChange={setAddOpen} trigger={null} />
          <Button onClick={openAdd} className="max-sm:px-3">
            <Plus aria-hidden="true" />
            <span className="max-sm:sr-only">Add application</span>
          </Button>
        </header>

        <main id="main" className="flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} onAddApplication={openAdd} />
    </div>
  );
}
