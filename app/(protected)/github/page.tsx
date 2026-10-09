"use client";

import Link from "next/link";
import { AlertTriangle, Github, Globe, RefreshCw } from "lucide-react";
import { CvPanel } from "@/components/cv/cv-panel";
import { Scanning } from "@/components/skills/scanning";
import { SkillProfileView } from "@/components/skills/skill-profile-view";
import { Scope } from "@/components/scope";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { syncInProgress, useGithubProfile, useSyncGithub, type GithubProfileState } from "@/hooks/use-github";
import { useHydrated } from "@/hooks/use-hydrated";
import { timeAgo } from "@/lib/format";

export default function SkillProfilePage() {
  const { data: state, isLoading, isError, refetch } = useGithubProfile();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading your skill profile">
        <Skeleton className="h-40 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 rounded-xl lg:col-span-5" />
          <Skeleton className="h-96 rounded-xl lg:col-span-7" />
        </div>
      </div>
    );
  }

  if (isError || !state) {
    return (
      <Panel>
        <div className="flex flex-col items-start gap-3 p-8">
          <p className="font-medium">Couldn’t load your skill profile.</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </Panel>
    );
  }

  if (!state.connected) return <ConnectPrompt />;

  if (!state.profile) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-[-0.025em]">Skill profile</h1>
        <Panel>
          {state.status === "failed" ? (
            <SyncFailed state={state} />
          ) : syncInProgress(state) ? (
            <Scanning
              title={`Reading @${state.username}’s code`}
              subtitle="The first sync takes under a minute. You can leave this page; it runs in the background."
            />
          ) : (
            <FirstSync />
          )}
        </Panel>
      </div>
    );
  }

  return (
    <SkillProfileView
      profile={state.profile}
      actions={<ProfileActions state={state} />}
      notice={state.status === "failed" && state.error ? <FailureBanner message={state.error} /> : null}
    >
      <CvPanel profile={state.profile} />
    </SkillProfileView>
  );
}

function ProfileActions({ state }: { state: GithubProfileState }) {
  const sync = useSyncGithub();
  const hydrated = useHydrated();
  const syncing = syncInProgress(state) || sync.isPending;

  return (
    <>
      <span className="text-[13px] text-muted" aria-live="polite">
        {syncing ? "Syncing…" : state.syncedAt && hydrated ? `Synced ${timeAgo(state.syncedAt)}` : null}
      </span>
      <Button variant="secondary" size="sm" onClick={() => sync.mutate()} disabled={syncing}>
        <RefreshCw className={syncing ? "animate-spin" : undefined} aria-hidden="true" />
        Sync now
      </Button>
      {state.username ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={`/scan/${state.username.toLowerCase()}`}>
            <Globe aria-hidden="true" />
            Public view
          </Link>
        </Button>
      ) : null}
    </>
  );
}

function FailureBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn-ink" aria-hidden="true" />
      <p>
        The last sync failed: {message} Showing the previous results.
        {/reconnect/i.test(message) ? (
          <>
            {" "}
            <a href="/api/auth/github" className="font-medium text-brand hover:underline">
              Reconnect GitHub
            </a>
          </>
        ) : null}
      </p>
    </div>
  );
}

function SyncFailed({ state }: { state: GithubProfileState }) {
  const sync = useSyncGithub();
  return (
    <div className="flex flex-col items-start gap-4 p-8">
      <AlertTriangle className="size-6 text-warn-ink" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold">The sync didn’t finish</p>
        <p className="max-w-lg text-muted">{state.error ?? "Something went wrong while reading GitHub."}</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
          Try again
        </Button>
        <Button asChild variant="secondary">
          <a href="/api/auth/github">Reconnect GitHub</a>
        </Button>
      </div>
    </div>
  );
}

function FirstSync() {
  const sync = useSyncGithub();
  return (
    <div className="grid items-center gap-10 p-8 md:grid-cols-[minmax(0,1fr)_220px] md:p-12">
      <div className="flex flex-col items-start gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">GitHub is connected. Time for a first read.</h2>
        <p className="max-w-lg text-muted">DevRadar reads your repositories in the background and keeps the profile fresh every night.</p>
        <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
          <RefreshCw aria-hidden="true" />
          Read my repositories
        </Button>
      </div>
      <Scope className="mx-auto max-w-[220px]" />
    </div>
  );
}

function ConnectPrompt() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-[-0.025em]">Skill profile</h1>
      <Panel>
        <div className="grid items-center gap-10 p-8 md:grid-cols-[minmax(0,1fr)_260px] md:p-12">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Your skills, read from your code.</h2>
            <p className="max-w-lg text-muted">
              Connect GitHub and DevRadar reads the manifests, config files and languages of your repositories, including private
              ones, to score six skill areas with the evidence behind each. Nothing is posted on your behalf.
            </p>
            <Button asChild size="lg" className="w-fit">
              <a href="/api/auth/github">
                <Github aria-hidden="true" />
                Connect GitHub
              </a>
            </Button>
          </div>
          <Scope className="mx-auto max-w-[260px]" />
        </div>
      </Panel>
      <CvPanel profile={null} />
    </div>
  );
}
