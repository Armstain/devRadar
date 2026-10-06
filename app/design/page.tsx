import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
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
  title: "Signal design system",
  description: "Tokens, type and components behind DevRadar.",
};

const principles = [
  { title: "Signal over noise", body: "One accent, reserved for the thing that matters right now. Everything else is ink, muted or line." },
  { title: "Data is the decoration", body: "No particles or gradients for their own sake. The radar, the funnel and the activity bars carry the visual weight." },
  { title: "Readable without colour", body: "States differ in shape as well as hue: filled vs. outlined, solid vs. dashed, an icon beside every warning." },
  { title: "Designed twice", body: "Light is its own palette, not dark inverted, with a deeper green so text keeps its contrast." },
];

const typeScale = [
  { name: "Display", spec: "Grotesk 600 · 40/44 · −3%", className: "text-[40px] leading-[44px] font-semibold tracking-[-0.03em]", sample: "Good afternoon." },
  { name: "Heading", spec: "Grotesk 600 · 30/36 · −2%", className: "text-3xl font-semibold tracking-tight", sample: "Senior Full-stack Engineer" },
  { name: "Title", spec: "Grotesk 600 · 18/26", className: "text-lg font-semibold tracking-tight", sample: "Needs attention" },
  { name: "Body", spec: "Grotesk 400 · 15/24", className: "text-[15px]", sample: "Applications that go quiet for 10 days show up here." },
  { name: "Small", spec: "Grotesk 400 · 13/20", className: "text-[13px]", sample: "Added 18 Sep · Job post" },
  { name: "Label", spec: "Mono 500 · 11/16 · +8% caps", className: "label-mono text-ink!", sample: "Pipeline · Week 41" },
  { name: "Data", spec: "Mono 500 · 34/40 · tabular", className: "font-mono text-[34px] font-medium tracking-tight tabular", sample: "18  39%  4" },
];

const sampleRadar = [
  { label: "Frontend", value: 0.92 },
  { label: "Backend", value: 0.74, target: 0.85 },
  { label: "Testing", value: 0.61, target: 0.55 },
  { label: "Data", value: 0.48, target: 0.5 },
  { label: "DevOps", value: 0.4, target: 0.75 },
  { label: "Systems", value: 0.33, target: 0.55 },
].map((a) => ({ ...a, target: a.target ?? 0.8 }));

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6 border-t border-line pt-10">
      <h2 id={id} className="label-mono">{title}</h2>
      {children}
    </section>
  );
}

function ThemeColumn({ theme }: { theme: ThemeName }) {
  const t = tokens[theme];
  return (
    <div className={cn(theme, "flex flex-col gap-6 rounded-2xl border border-line bg-ground p-6 text-ink sm:p-8")}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">{theme === "dark" ? "Dark · Scope" : "Light · Paper"}</h3>
        <span className="font-mono text-xs text-muted">{theme === "dark" ? "default" : "designed, not inverted"}</span>
      </div>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {tokenRoles.map((role) => {
          const value = t[role.name];
          return (
            <li key={role.name} className="flex flex-col gap-1.5">
              <span className="h-12 rounded-lg border border-line" style={{ background: value }} />
              <span className="text-[13px] font-semibold">{role.label}</span>
              <span className="font-mono text-[11px] text-muted">{value}</span>
              <span className="font-mono text-[11px] text-muted">
                {role.text ? `${contrast(value, t.ground).toFixed(1)}:1` : "surface"}
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
          <span className="rounded-md border border-dashed border-caution px-2 py-0.5 text-[13px] text-caution">Kubernetes</span>
          <Kbd>⌘K</Kbd>
        </div>
      </Panel>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="DevRadar home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <LogoMark className="size-14" sweeping />
          <h1 className="text-5xl font-bold tracking-[-0.04em]">Signal</h1>
        </div>
        <p className="max-w-2xl text-lg text-muted">
          The design language behind DevRadar. A job search is mostly noise; the interface should show the few things that
          need you, and get out of the way for the rest.
        </p>
      </section>

      <Section id="principles" title="Principles">
        <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {principles.map((p, i) => (
            <li key={p.title} className="flex gap-4">
              <span className="font-mono text-sm text-signal">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex flex-col gap-1">
                <span className="font-semibold">{p.title}</span>
                <span className="text-muted">{p.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="colour" title="Colour & components">
        <p className="max-w-2xl text-muted">
          Contrast ratios are calculated from the tokens on each ground; every text colour passes WCAG AA (4.5:1), checked in CI.
        </p>
        <div className="grid gap-6 xl:grid-cols-2">
          <ThemeColumn theme="dark" />
          <ThemeColumn theme="light" />
        </div>
      </Section>

      <Section id="type" title="Type">
        <p className="max-w-2xl text-muted">
          Schibsted Grotesk for the interface, JetBrains Mono for numbers and labels — data reads like an instrument panel.
        </p>
        <ul className="flex flex-col">
          {typeScale.map((t) => (
            <li key={t.name} className="grid items-baseline gap-2 border-b border-line py-3 sm:grid-cols-[110px_minmax(0,1fr)_230px] sm:gap-6">
              <span className="font-mono text-xs text-muted">{t.name}</span>
              <span className={cn("truncate", t.className)}>{t.sample}</span>
              <span className="font-mono text-xs text-muted sm:text-right">{t.spec}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="data" title="Data">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Radar</h3>
            <p className="text-muted">
              Your shape is filled with a solid stroke; a role’s requirements are an outline with a dashed stroke. The two never
              rely on colour alone.
            </p>
            <RadarChart axes={sampleRadar} label="Example: your skills compared with a role’s requirements" />
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold">Scope</h3>
            <p className="text-muted">
              The empty state: a slow sweep that says “listening” rather than “nothing here”. It stops for people who prefer
              reduced motion.
            </p>
            <Scope className="mx-auto max-w-[320px]" />
          </div>
        </div>
      </Section>

      <footer className="border-t border-line py-8 text-sm text-muted">
        Built with Next.js, Tailwind CSS 4 and Radix primitives. Tokens live in <code className="font-mono">app/globals.css</code>.
      </footer>
    </div>
  );
}
