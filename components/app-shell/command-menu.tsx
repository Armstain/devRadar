"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CornerDownLeft, Plus, Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { Monogram } from "@/components/ui/monogram";
import { pipelineViews, workspaceNav } from "@/components/app-shell/nav";
import { useApplications } from "@/hooks/use-applications";
import { STATUS_LABELS } from "@/lib/applications";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  group: "Go to" | "Applications" | "Actions";
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  keywords?: string;
  run: () => void;
}

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddApplication: () => void;
}

export function CommandMenu({ open, onOpenChange, onAddApplication }: CommandMenuProps) {
  const router = useRouter();
  const { data: applications } = useApplications();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo<CommandItem[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      {
        id: "add",
        group: "Actions",
        label: "Add application",
        icon: <Plus className="size-4" aria-hidden="true" />,
        keywords: "new create",
        run: onAddApplication,
      },
      ...workspaceNav.map((item) => ({
        id: `nav-${item.href}`,
        group: "Go to" as const,
        label: item.label,
        icon: <item.icon className="size-4" aria-hidden="true" />,
        run: go(item.href),
      })),
      ...pipelineViews.map((view) => ({
        id: `view-${view.view}`,
        group: "Go to" as const,
        label: view.label,
        hint: "View",
        icon: <view.icon className="size-4" aria-hidden="true" />,
        run: go(`/applications?view=${view.view}`),
      })),
      ...(applications ?? []).map((app) => ({
        id: `app-${app.id}`,
        group: "Applications" as const,
        label: `${app.company} — ${app.position}`,
        hint: STATUS_LABELS[app.status],
        icon: <Monogram name={app.company} size="sm" />,
        run: go(`/applications/${app.id}`),
      })),
    ];
  }, [applications, router, onAddApplication]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.filter((item) => item.group !== "Applications").concat(items.filter((i) => i.group === "Applications").slice(0, 5));
    return items.filter((item) => `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setQuery("");
      setActiveIndex(0);
    }
    onOpenChange(next);
  };

  const select = (item: CommandItem | undefined) => {
    if (!item) return;
    onOpenChange(false);
    item.run();
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(results[activeIndex]);
    }
  };

  let lastGroup = "";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ground/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[12vh] z-50 flex max-h-[70vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Search DevRadar</DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={results[activeIndex] ? `${listId}-${results[activeIndex].id}` : undefined}
              aria-label="Search applications and pages"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search applications, pages, actions…"
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
            />
            <Kbd>esc</Kbd>
          </div>
          <ul id={listId} ref={listRef} role="listbox" aria-label="Results" className="flex-1 overflow-y-auto p-2">
            {results.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-muted">No matches for “{query}”.</li>
            ) : (
              results.map((item, index) => {
                const header = item.group !== lastGroup ? item.group : null;
                lastGroup = item.group;
                return (
                  <li key={item.id} role="presentation">
                    {header ? <div className="label-mono px-3 pb-1 pt-3" aria-hidden="true">{header}</div> : null}
                    <div
                      id={`${listId}-${item.id}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      data-index={index}
                      onMouseMove={() => setActiveIndex(index)}
                      onClick={() => select(item)}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-[15px]",
                        index === activeIndex && "bg-raised"
                      )}
                    >
                      <span className="flex size-5 items-center justify-center text-muted">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                      {item.hint ? <span className="ml-auto shrink-0 text-[13px] text-muted">{item.hint}</span> : null}
                      {index === activeIndex ? <CornerDownLeft className={cn("size-3.5 shrink-0 text-muted", !item.hint && "ml-auto")} aria-hidden="true" /> : null}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
          <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-muted">
            <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> to move</span>
            <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> to open</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
