"use client"

import { Github, Plus } from "lucide-react"
import { ApplicationDialog } from "@/components/applications/application-dialog"
import { CSVImport } from "@/components/applications/csv-import"
import { Scope } from "@/components/scope"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { useMe } from "@/hooks/use-applications"

// Shown instead of empty charts when there are no applications yet.
export function FirstRun() {
  const { data: me } = useMe()

  return (
    <Panel className="overflow-hidden">
      <div className="grid items-center gap-10 p-8 md:grid-cols-[minmax(0,1fr)_280px] md:p-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="label-quiet text-brand">Getting started</span>
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">Put your first application on the radar.</h2>
            <p className="max-w-lg text-muted">
              Add a role you’ve applied for, or import the spreadsheet you already keep. DevRadar tracks where each one stands
              and tells you when it’s time to follow up.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ApplicationDialog
              trigger={
                <Button size="lg">
                  <Plus aria-hidden="true" />
                  Add your first application
                </Button>
              }
            />
            <CSVImport size="lg" />
          </div>
          {me && !me.github.connected ? (
            <a href="/api/auth/github" className="flex w-fit items-center gap-2 text-sm text-muted hover:text-ink">
              <Github className="size-4" aria-hidden="true" />
              Connect GitHub to draw your skill radar
            </a>
          ) : null}
        </div>
        <Scope className="mx-auto max-w-[280px]" />
      </div>
    </Panel>
  )
}
