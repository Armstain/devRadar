"use client"

import { useId, useRef, useState } from "react"
import { FileText, Lock, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useCv } from "@/hooks/use-cv"
import { parseCv } from "@/lib/cv/parse"
import { CV_ACCEPT, CvReadError, readCvFile } from "@/lib/cv/read-file"
import { cn } from "@/lib/utils"

// Drop a CV, or paste it. Reading and parsing happen here in the browser;
// the result goes to IndexedDB and nowhere else.
export function CvUpload({ compact, onDone }: { compact?: boolean; onDone?: () => void }) {
  const { save } = useCv()
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const [state, setState] = useState<"idle" | "reading" | "paste">("idle")
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [pasted, setPasted] = useState("")

  const finish = async (text: string, fileName: string) => {
    await save.mutateAsync(parseCv(text, fileName))
    setState("idle")
    onDone?.()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setState("reading")
    try {
      await finish(await readCvFile(file), file.name)
    } catch (e) {
      setError(e instanceof CvReadError ? e.message : "That file couldn’t be read. Try a PDF exported from your editor, or paste the text.")
      setState("idle")
    }
  }

  if (state === "paste") {
    return (
      <div className="flex flex-col gap-3">
        <label htmlFor={`${id}-paste`} className="text-sm font-semibold">
          Paste your CV
        </label>
        <Textarea id={`${id}-paste`} rows={10} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Experience, roles with dates, skills…" />
        <div className="flex flex-wrap gap-2">
          <Button disabled={pasted.trim().length < 80} onClick={() => finish(pasted.trim(), "Pasted text")}>
            Read it
          </Button>
          <Button variant="ghost" onClick={() => setState("idle")}>
            Cancel
          </Button>
        </div>
        <PrivacyNote />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void handleFile(e.dataTransfer.files[0])
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border-[1.5px] border-dashed text-center transition-colors",
          compact ? "px-4 py-6" : "px-6 py-10",
          dragging ? "border-brand bg-brand-soft" : "border-scope bg-panel"
        )}
      >
        {state === "reading" ? (
          <>
            <FileText className="size-6 animate-pulse text-brand" aria-hidden="true" />
            <p className="text-sm font-medium" role="status">
              Reading your CV in this browser…
            </p>
          </>
        ) : (
          <>
            <Upload className="size-6 text-muted" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Drop your CV here</p>
              <p className="text-[13px] text-muted">PDF, DOCX or plain text, up to 5 MB</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={() => input.current?.click()}>
                Choose a file
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setState("paste")}>
                Paste text instead
              </Button>
            </div>
          </>
        )}
        <input
          ref={input}
          type="file"
          accept={CV_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label="CV file"
          onChange={(e) => {
            void handleFile(e.target.files?.[0])
            e.target.value = ""
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <PrivacyNote />
    </div>
  )
}

export function PrivacyNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-[13px] text-ink-soft", className)}>
      <Lock className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden="true" />
      Your CV is read in this browser and kept only here. It’s never uploaded, and it’s removed when you sign out.
    </p>
  )
}
