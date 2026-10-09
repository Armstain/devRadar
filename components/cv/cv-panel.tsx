"use client"

import { useState } from "react"
import axios from "axios"
import { Sparkles, Trash2, Upload } from "lucide-react"
import { CvUpload, PrivacyNote } from "@/components/cv/cv-upload"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { useCv } from "@/hooks/use-cv"
import { compareCvWithCode } from "@/lib/cv/compare"
import { redact } from "@/lib/cv/parse"
import type { CvProfile, CvRole } from "@/lib/cv/types"
import { years } from "@/lib/fit/cv"
import type { SkillProfile } from "@/lib/skills/types"
import { cn } from "@/lib/utils"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const fmtMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number)
  return `${MONTHS[m - 1]} ${y}`
}
const SENIORITY_LABEL: Record<string, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  staff: "Staff",
  lead: "Lead",
  principal: "Principal",
}

// The CV next to the code: what the CV claims, what the code backs up, and
// what the code shows that the CV leaves out.
export function CvPanel({ profile }: { profile: SkillProfile | null }) {
  const { cv, isLoading } = useCv()
  const [replacing, setReplacing] = useState(false)

  return (
    <Panel id="cv" className="scroll-mt-6">
      <div className="flex flex-col gap-5 p-6">
        <PanelHeader
          title="Your CV"
          description={
            cv
              ? `${cv.fileName} · read ${cv.source === "ai" ? "with AI" : "in this browser"} on ${new Date(cv.readAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
              : "Add your CV so job fit counts your work experience, not only your code"
          }
          action={cv && !replacing ? <CvActions cv={cv} onReplace={() => setReplacing(true)} /> : null}
        />
        {isLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : !cv || replacing ? (
          <div className="flex flex-col gap-3">
            <CvUpload onDone={() => setReplacing(false)} />
            {replacing ? (
              <Button variant="ghost" size="sm" className="w-fit" onClick={() => setReplacing(false)}>
                Keep the current CV
              </Button>
            ) : null}
          </div>
        ) : (
          <CvReading cv={cv} profile={profile} />
        )}
      </div>
    </Panel>
  )
}

function CvActions({ cv, onReplace }: { cv: CvProfile; onReplace: () => void }) {
  const { forget } = useCv()
  const [askAi, setAskAi] = useState(false)
  return (
    <div className="flex flex-wrap gap-2">
      {cv.source === "local" ? (
        <Button size="sm" variant="secondary" onClick={() => setAskAi(true)}>
          <Sparkles aria-hidden="true" />
          Read with AI
        </Button>
      ) : null}
      <Button size="sm" variant="secondary" onClick={onReplace}>
        <Upload aria-hidden="true" />
        Replace
      </Button>
      <Button size="sm" variant="ghost" onClick={() => forget.mutate()}>
        <Trash2 aria-hidden="true" />
        Forget my CV
      </Button>
      <AiReadDialog cv={cv} open={askAi} onOpenChange={setAskAi} />
    </div>
  )
}

// Says exactly what would be sent, and shows it, before anything is.
function AiReadDialog({ cv, open, onOpenChange }: { cv: CvProfile; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { readWithAi } = useCv()
  const error = readWithAi.error
  const message = axios.isAxiosError(error) ? (error.response?.data as { error?: string } | undefined)?.error : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Read your experience with AI?</DialogTitle>
          <DialogDescription>
            If your roles or dates look wrong, Gemini can read the CV instead of DevRadar’s rules. Your name, email, phone number,
            links and address are removed first. The text goes to Google for this one read; DevRadar doesn’t store it, and
            the result is saved only in this browser.
          </DialogDescription>
        </DialogHeader>
        <details className="rounded-lg border border-line bg-raised/60 px-3 py-2 text-[13px]">
          <summary className="cursor-pointer font-medium">See exactly what would be sent</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[12px] text-ink-soft">{redact(cv.text)}</pre>
        </details>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {message ?? "The AI read didn’t work. Your CV reading is unchanged."}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={readWithAi.isPending}
            onClick={() => readWithAi.mutate(cv, { onSuccess: () => onOpenChange(false) })}
          >
            <Sparkles aria-hidden="true" />
            {readWithAi.isPending ? "Reading…" : "Send and read"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CvReading({ cv, profile }: { cv: CvProfile; profile: SkillProfile | null }) {
  const compare = compareCvWithCode(cv, profile)
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section className="flex flex-col gap-3">
          <h3 className="label-quiet">Experience</h3>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-3xl font-semibold tracking-[-0.04em]">{cv.totalMonths ? years(cv.totalMonths) : "—"}</span>
            {cv.seniority ? <span className="text-ink-soft">· {SENIORITY_LABEL[cv.seniority]} level</span> : null}
          </p>
          {cv.roles.length ? (
            <ol className="flex flex-col">
              {cv.roles.map((role, i) => (
                <RoleRow key={`${role.title}-${role.start}`} role={role} last={i === cv.roles.length - 1} />
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-soft">
              No roles with dates found. If your CV uses columns or tables, “Read with AI” usually gets them.
            </p>
          )}
        </section>
        <section className="flex flex-col gap-3">
          <h3 className="label-quiet">Your CV vs your code</h3>
          <Group
            title="Backed up by your code"
            empty={profile ? "Nothing on your CV shows up in your repositories yet." : "Connect GitHub to see which claims your code backs up."}
            items={compare.both.map((t) => ({ key: t.id, name: t.name, note: t.months ? years(t.months) : null }))}
            marker="bg-brand"
          />
          <Group
            title="On your CV, not in your code"
            hint="A small public project would back these up."
            empty="Everything on your CV is backed up."
            items={compare.cvOnly.map((t) => ({ key: t.id, name: t.name, note: t.months ? years(t.months) : null }))}
            marker="border-[1.5px] border-brand bg-transparent"
          />
          {profile ? (
            <Group
              title="In your code, missing from your CV"
              hint="Your repositories prove these. Add them to your CV."
              empty="Your CV already lists what your code shows."
              items={compare.codeOnly.slice(0, CODE_ONLY_SHOWN).map((t) => ({ key: t.id, name: t.name, note: `${t.repoCount} repo${t.repoCount === 1 ? "" : "s"}` }))}
              total={compare.codeOnly.length}
              marker="tri bg-warn rounded-none"
            />
          ) : null}
        </section>
      </div>
      <PrivacyNote />
    </div>
  )
}

function RoleRow({ role, last }: { role: CvRole; last: boolean }) {
  return (
    <li className="flex gap-3">
      <span className="flex w-3 flex-col items-center" aria-hidden="true">
        <span className={cn("mt-1.5 size-2.5 rounded-full", role.end === null ? "bg-brand" : "border-[1.5px] border-muted")} />
        {!last ? <span className="mt-1 w-px flex-1 bg-line" /> : null}
      </span>
      <span className="flex min-w-0 flex-col pb-4">
        <span className="font-semibold">
          {role.title}
          {role.company ? <span className="font-normal text-ink-soft"> · {role.company}</span> : null}
        </span>
        <span className="text-[13px] text-muted tabular">
          {fmtMonth(role.start)} – {role.end ? fmtMonth(role.end) : "now"} · {years(role.months)}
        </span>
      </span>
    </li>
  )
}

// The strongest ones; past a dozen the list stops being advice
const CODE_ONLY_SHOWN = 12

function Group({
  title,
  hint,
  empty,
  items,
  total = items.length,
  marker,
}: {
  title: string
  hint?: string
  empty: string
  items: { key: string; name: string; note: string | null }[]
  total?: number
  marker: string
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-[13px] text-muted tabular">{total}</span>
      </div>
      {hint && items.length ? <p className="-mt-1 text-[13px] text-muted">{hint}</p> : null}
      {items.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li key={item.key} className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[13px]">
              <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-full", marker, marker.includes("tri") && "h-2 w-[9px]")} />
              {item.name}
              {item.note ? <span className="text-[11px] text-muted tabular">{item.note}</span> : null}
            </li>
          ))}
          {total > items.length ? <li className="px-1 py-1 text-[13px] text-muted">and {total - items.length} more</li> : null}
        </ul>
      ) : (
        <p className="text-[13px] text-muted">{empty}</p>
      )}
    </div>
  )
}
