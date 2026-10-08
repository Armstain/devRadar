import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { StatusIcon, STATUS_LABELS } from "@/components/fit/status-icon";
import { DotMeter } from "@/components/instrument/dot-meter";
import { ScoreReadout } from "@/components/instrument/score";
import { SAMPLE_AXES, SAMPLE_GAP } from "@/components/landing/sample";
import { Logo, LogoMark } from "@/components/logo";
import { RadarChart } from "@/components/radar-chart";
import { Scope } from "@/components/scope";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Monogram } from "@/components/ui/monogram";
import { Panel } from "@/components/ui/panel";
import { StagePill } from "@/components/ui/stage-pill";
import { APPLICATION_STATUSES } from "@/lib/applications";
import { contrast, tokenRoles, tokens, type ThemeName } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Instrument design system",
  description: "Tokens, type and components behind DevRadar.",
};

const principles = [
  { title: "Measure, don’t decorate", body: "Every mark on screen is a reading: a score, a requirement, a repository. Nothing is there to fill space." },
  { title: "Show the working", body: "A number always comes with what it was built from: the requirements behind a fit score, the repositories behind a skill." },
  { title: "Readable without colour", body: "States differ in shape as well as hue. A gap is a triangle, a partial match is half-filled, a guess is dashed." },
  { title: "Motion reports state", body: "The sweep turns only while something is being read. Buttons move a pixel when pressed. Nothing else moves." },
  { title: "Designed twice", body: "Day and night are separate palettes, each checked for contrast, not one inverted from the other." },
];

const typeScale = [
  { name: "Readout", spec: "Grotesk 600 · 84 · −6% · tabular", className: "text-[56px] leading-none font-semibold tracking-[-0.06em] tabular sm:text-[84px]", sample: "92" },
  { name: "Display", spec: "Grotesk 600 · 40/44 · −3%", className: "text-[40px] leading-[44px] font-semibold tracking-[-0.03em]", sample: "Good afternoon, Mara." },
  { name: "Heading", spec: "Grotesk 600 · 30/36 · −2.5%", className: "text-3xl font-semibold tracking-[-0.025em]", sample: "What the post asks for" },
  { name: "Title", spec: "Grotesk 600 · 18/26", className: "text-lg font-semibold tracking-tight", sample: "Needs you" },
  { name: "Body", spec: "Grotesk 400 · 15/24", className: "text-[15px]", sample: "Applications that go quiet for 10 days show up here." },
  { name: "Label", spec: "Grotesk 500 · 13/20 · muted", className: "label-quiet", sample: "Thursday 8 October" },
  { name: "Code", spec: "Plex Mono 400 · 13/20", className: "font-mono text-[13px]", sample: "orbit-commerce · package.json" },
];

const radii = [
  { name: "Controls", value: "8px", className: "rounded-lg" },
  { name: "Panels", value: "12px", className: "rounded-xl" },
  { name: "Reading card", value: "16px", className: "rounded-2xl shadow-lift" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6 border-t border-line pt-10">
      <h2 id={id} className="label-quiet">{title}</h2>
      {children}
    </section>
  );
}

function ThemeColumn({ theme }: { theme: ThemeName }) {
  const t = tokens[theme];
  return (
    <div className={cn(theme, "flex flex-col gap-6 rounded-2xl border border-line bg-ground p-6 text-ink sm:p-8")}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">{theme === "dark" ? "Night" : "Day"}</h3>
        <span className="text-[13px] text-muted">follows your system</span>
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {tokenRoles.map((role) => {
          const value = t[role.name];
          return (
            <li key={role.name} className="flex flex-col gap-1.5">
              <span className="h-12 rounded-lg border border-line" style={{ background: value }} />
              <span className="text-[13px] font-semibold">{role.label}</span>
              <span className="font-mono text-[11px] text-muted">{value}</span>
              <span className="text-[11px] text-muted tabular">
                {role.text ? `${contrast(value, t.ground).toFixed(1)}:1` : role.name === "warn" ? "marks only" : "surface"}
              </span>
            </li>
          );
        })}
      </ul>

      <Panel className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap gap-2">
          <Button>
            <Plus aria-hidden="true" /> Add application
          </Button>
          <Button variant="secondary">Edit</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">
            <Trash2 aria-hidden="true" /> Delete
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" htmlFor={`company-${theme}`}>
            <Input id={`company-${theme}`} defaultValue="Lumen Labs" />
          </Field>
          <Field label="Job post link" htmlFor={`link-${theme}`} error="Link must be an http(s) URL">
            <Input id={`link-${theme}`} defaultValue="lumenlabs.com/jobs" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {APPLICATION_STATUSES.map((s) => (
            <StagePill key={s} status={s} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Monogram name="Lumen Labs" />
          <Monogram name="Parcel" inverted />
          <span className="rounded-md bg-raised px-2 py-0.5 text-[13px]">TypeScript</span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-warn-soft px-2 py-0.5 text-[13px] text-warn-ink">
            <span aria-hidden="true" className="tri inline-block h-2 w-[9px] bg-warn" />
            GraphQL
          </span>
          <Kbd>⌘K</Kbd>
        </div>
      </Panel>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-5 py-8 sm:px-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="DevRadar home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <LogoMark className="size-14" />
          <h1 className="text-5xl font-semibold tracking-[-0.04em]">Instrument</h1>
        </div>
        <p className="max-w-2xl text-lg text-ink-soft">
          The design language behind DevRadar. It treats a developer’s GitHub like a reading on a precise instrument: calm
          surfaces, one petrol accent for evidence, amber for what’s missing, and every number showing how it was measured.
        </p>
      </section>

      <Section id="principles" title="Principles">
        <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {principles.map((p, i) => (
            <li key={p.title} className="flex gap-4">
              <span className="text-sm font-semibold text-brand tabular">{i + 1}</span>
              <span className="flex flex-col gap-1">
                <span className="font-semibold">{p.title}</span>
                <span className="text-ink-soft">{p.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="instruments" title="Instruments">
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-semibold">The dial</h3>
            <p className="text-ink-soft">
              Your code is the stippled shape with a solid edge: each dot is evidence. A role’s requirements are the dashed outline.
              A missing requirement is an amber triangle on its axis.
            </p>
            <RadarChart axes={SAMPLE_AXES} gap={SAMPLE_GAP} label="Example: your skills compared with a role’s requirements, with one gap" />
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">The readout</h3>
              <p className="text-ink-soft">A score never appears alone. The bar underneath is the requirements it was built from.</p>
              <ScoreReadout score={92} verdict="Strong fit" counts={{ strong: 7, some: 2, related: 0, gap: 1, unverifiable: 2 }} size="md" />
            </div>
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold">Meters and marks</h3>
              <ul className="flex flex-col gap-2.5 text-sm">
                {(["strong", "some", "related", "gap", "unverifiable"] as const).map((status, i) => (
                  <li key={status} className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-3">
                    <StatusIcon status={status} />
                    <span>{STATUS_LABELS[status]}</span>
                    {status === "unverifiable" ? <span /> : <DotMeter value={[87, 45, 30, 0][i]} gap={status === "gap"} />}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="grid items-center gap-8 border-t border-line pt-8 sm:grid-cols-[200px_200px_minmax(0,1fr)]">
          <Scope className="max-w-[200px]" />
          <Scope className="max-w-[200px]" sweeping />
          <p className="text-ink-soft">
            The scope is the empty state. It sits still when there’s nothing to read, and sweeps only while a scan or sync is running.
            The sweep stops for people who prefer reduced motion.
          </p>
        </div>
      </Section>

      <Section id="colour" title="Colour & components">
        <p className="max-w-2xl text-ink-soft">
          Contrast ratios are calculated from the tokens on each ground. Every text colour passes WCAG AA (4.5:1), checked in CI.
          Amber is only ever a mark next to an icon or shape; its text form is a darker ink.
        </p>
        <div className="grid gap-6 xl:grid-cols-2">
          <ThemeColumn theme="light" />
          <ThemeColumn theme="dark" />
        </div>
      </Section>

      <Section id="type" title="Type">
        <p className="max-w-2xl text-ink-soft">
          Schibsted Grotesk for everything a person reads, with tabular figures so scores line up. IBM Plex Mono only for what is
          literally code: file names, repositories, keys.
        </p>
        <ul className="flex flex-col">
          {typeScale.map((t) => (
            <li key={t.name} className="grid items-baseline gap-2 border-b border-line py-3 sm:grid-cols-[110px_minmax(0,1fr)_240px] sm:gap-6">
              <span className="text-[13px] text-muted">{t.name}</span>
              <span className={cn("truncate", t.className)}>{t.sample}</span>
              <span className="text-[13px] text-muted sm:text-right">{t.spec}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="shape" title="Shape & layout">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="text-ink-soft">
              Radius follows role, not taste. Surfaces are set apart by tone, never by shadow; the reading card is the one object
              that lifts off the page.
            </p>
            <ul className="flex flex-wrap gap-5">
              {radii.map((r) => (
                <li key={r.name} className="flex flex-col gap-2">
                  <span className={cn("block size-20 border border-line bg-panel", r.className)} />
                  <span className="text-[13px] font-semibold">{r.name}</span>
                  <span className="text-[13px] text-muted">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-ink-soft">
              The navigation is a top bar or a sidebar, and <Kbd>⌘B</Kbd> switches between them. Each item glides to its new place
              with a view transition, and an editor-style status bar keeps sync state and shortcuts in view.
            </p>
            <div className="grid grid-cols-2 gap-4" aria-hidden="true">
              {(["top", "side"] as const).map((layout) => (
                <div key={layout} className={cn("grid h-28 gap-1 overflow-hidden rounded-xl border border-line bg-panel p-1.5", layout === "top" ? "grid-rows-[10px_1fr_6px]" : "grid-cols-[28%_1fr] grid-rows-[1fr_6px]")}>
                  <span className={cn("rounded-[4px] bg-brand", layout === "side" && "row-span-1")} />
                  <span className="rounded-[4px] bg-raised" />
                  <span className={cn("rounded-[2px] bg-status", layout === "side" && "col-span-2")} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <footer className="border-t border-line py-8 text-sm text-muted">
        Built with Next.js, Tailwind CSS 4 and Radix primitives. Tokens live in <code className="font-mono">app/globals.css</code> and{" "}
        <code className="font-mono">lib/tokens.ts</code>, kept in sync by a test.
      </footer>
    </div>
  );
}
