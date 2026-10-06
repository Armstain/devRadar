"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Github, Star } from "lucide-react";
import { ActivityCard } from "@/components/dashboard/activity-card";
import { RadarChart } from "@/components/radar-chart";
import { Scope } from "@/components/scope";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-applications";
import { useGithubLanguages } from "@/hooks/use-github";
import { radarScale, shortDate } from "@/lib/format";

interface GithubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
}

interface Repo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  pushed_at: string;
}

const STALE = 10 * 60 * 1000;

export default function SkillProfilePage() {
  const { data: me, isLoading: loadingMe } = useMe();
  const connected = Boolean(me?.github.connected);

  const user = useQuery({
    queryKey: ["github", "user"],
    enabled: connected,
    staleTime: STALE,
    queryFn: async () => (await axios.get<GithubUser>("/api/github/user")).data,
  });
  const repos = useQuery({
    queryKey: ["github", "repos"],
    enabled: connected,
    staleTime: STALE,
    queryFn: async () => (await axios.get<Repo[]>("/api/github/repos")).data,
  });
  const languages = useGithubLanguages(connected);

  if (loadingMe) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  if (!connected) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">Skill profile</h1>
        <Panel>
          <div className="grid items-center gap-10 p-8 md:grid-cols-[minmax(0,1fr)_260px] md:p-12">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">Your skills, read from your code.</h2>
              <p className="max-w-lg text-muted">
                Connect GitHub and DevRadar reads your repositories to map the languages you actually ship in. Nothing is
                posted on your behalf.
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
      </div>
    );
  }

  const top = languages.data?.slice(0, 6) ?? [];
  const max = Math.max(1, ...top.map((l) => l.percentage));
  const ownRepos = (repos.data ?? [])
    .filter((r) => !r.fork)
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-center gap-5">
        {user.data ? (
          // eslint-disable-next-line @next/next/no-img-element -- GitHub avatars are already sized and cached by GitHub's CDN
          <img src={user.data.avatar_url} alt="" width={64} height={64} className="size-16 rounded-2xl" />
        ) : (
          <Skeleton className="size-16 rounded-2xl" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Skill profile</h1>
          <p className="text-muted">
            {user.data ? (
              <>
                <span className="font-mono">@{user.data.login}</span> · {user.data.public_repos} public repositories
              </>
            ) : (
              "Loading your GitHub profile…"
            )}
          </p>
        </div>
        {user.data ? (
          <Button asChild variant="secondary">
            <a href={user.data.html_url} target="_blank" rel="noopener noreferrer">
              View on GitHub <ExternalLink aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        ) : null}
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="Language radar" description="Share of code across your repositories" />
            {languages.isLoading ? (
              <Skeleton className="mx-auto aspect-[9/8] w-full max-w-[360px] rounded-full" />
            ) : top.length >= 3 ? (
              <RadarChart
                axes={top.map((l) => ({ label: l.language, value: radarScale(l.percentage, max), detail: `${l.percentage}%` }))}
                label={`Languages: ${top.map((l) => `${l.language} ${l.percentage}%`).join(", ")}`}
              />
            ) : (
              <p className="text-muted">Not enough code yet to draw a radar.</p>
            )}
          </div>
        </Panel>

        <Panel className="lg:col-span-5">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="Breakdown" />
            {languages.isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ul className="flex flex-col gap-3.5">
                {top.map((l) => (
                  <li key={l.language} className="flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between">
                      <span className="font-medium">{l.language}</span>
                      <span className="font-mono text-sm text-muted">{l.percentage}%</span>
                    </span>
                    <span className="h-1.5 rounded-full bg-raised">
                      <span className="block h-1.5 rounded-full bg-signal" style={{ width: `${(l.percentage / max) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="px-6 pb-3 pt-6">
          <PanelHeader title="Recently active repositories" description="Your own repositories, most recent push first" />
        </div>
        {repos.isLoading ? (
          <div className="flex flex-col gap-2 px-6 pb-6">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <ul>
            {ownRepos.map((repo) => (
              <li key={repo.id} className="border-t border-line">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 px-6 py-3.5 transition-colors hover:bg-raised/50"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-mono text-[15px] font-medium">{repo.name}</span>
                    {repo.description ? <span className="truncate text-[13px] text-muted">{repo.description}</span> : null}
                  </span>
                  <span className="flex items-center gap-4 text-[13px] text-muted">
                    {repo.language ? <span>{repo.language}</span> : null}
                    {repo.stargazers_count ? (
                      <span className="flex items-center gap-1">
                        <Star className="size-3.5" aria-hidden="true" />
                        <span className="sr-only">Stars:</span>
                        {repo.stargazers_count}
                      </span>
                    ) : null}
                    <span className="hidden font-mono sm:inline">{shortDate(repo.pushed_at)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ActivityCard />
    </div>
  );
}
