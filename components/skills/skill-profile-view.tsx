import { ChevronRight, ExternalLink, Lock, Star } from "lucide-react"
import { DotMeter } from "@/components/instrument/dot-meter"
import { AreaRadar } from "@/components/skills/area-radar"
import { ContributionHeatmap } from "@/components/skills/contribution-heatmap"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { SKILL_AREAS } from "@/lib/skills/catalog"
import type { AreaSkill, Insight, SkillProfile, TechnologySkill } from "@/lib/skills/types"
import { shortDate } from "@/lib/format"
import { cn } from "@/lib/utils"

// The whole skill profile. Used by the signed-in profile page and the public
// scan page, so it's a server-safe component: no hooks, no client state.

export function SkillProfileView({ profile, actions, notice }: { profile: SkillProfile; actions?: React.ReactNode; notice?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <ProfileHeader profile={profile} actions={actions} />
      {notice}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-6">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="Skill radar" description="Six areas, each scored 0–100 from your repositories" />
            <AreaRadar areas={profile.areas} className="mx-auto w-full max-w-[520px]" />
          </div>
        </Panel>
        <Panel className="lg:col-span-6">
          <div className="flex flex-col gap-2 p-6">
            <PanelHeader title="Where the scores come from" description="Open an area to see the technologies and repositories behind it" />
            <AreaBreakdown areas={profile.areas} technologies={profile.technologies} />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="What stands out" />
            <InsightList insights={profile.insights} />
          </div>
        </Panel>
        <Panel className="lg:col-span-5">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="Languages" description="Share of code across analysed repositories" />
            <LanguageBar languages={profile.languages} />
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-4 p-6">
          <PanelHeader
            title="Contributions"
            description="The last year on GitHub"
            action={
              <span className="text-[13px] text-muted tabular">
                {profile.activity.currentStreak}d current · {profile.activity.longestStreak}d longest streak
              </span>
            }
          />
          <ContributionHeatmap days={profile.activity.days} total={profile.activity.total} />
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-5 p-6">
          <PanelHeader
            title="Detected stack"
            description="Declared in a manifest, a config file or a real share of the code. The number is how many repositories use it."
          />
          <StackGrid technologies={profile.technologies} />
        </div>
      </Panel>

      <RepoList repos={profile.repos} />
      <Methodology profile={profile} />
    </div>
  )
}

function ProfileHeader({ profile, actions }: { profile: SkillProfile; actions?: React.ReactNode }) {
  const { user, stats, activity } = profile
  const facts = [
    { label: "Repositories analysed", value: stats.reposAnalyzed, detail: stats.repoCount > stats.reposAnalyzed ? `of ${stats.repoCount}` : null },
    { label: "Technologies detected", value: stats.technologyCount, detail: null },
    { label: "Contributions, last year", value: activity.total.toLocaleString("en-US"), detail: null },
    { label: "Stars earned", value: stats.stars.toLocaleString("en-US"), detail: null },
  ]

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- GitHub avatars are already sized and cached by GitHub's CDN */}
        <img src={user.avatarUrl} alt="" width={80} height={80} className="size-20 shrink-0 rounded-2xl border border-line bg-raised" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="label-quiet text-brand">{profile.archetype}</span>
          <h1 className="truncate text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{user.name ?? user.login}</h1>
          <p className="flex flex-wrap items-center gap-x-2 text-muted">
            <a href={user.url} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-ink hover:underline">
              @{user.login}
              <span className="sr-only"> on GitHub (opens in a new tab)</span>
            </a>
            {user.location ? <span>· {user.location}</span> : null}
            <span>· on GitHub since {new Date(user.createdAt).getUTCFullYear()}</span>
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <p className="max-w-3xl text-balance text-xl leading-snug tracking-tight sm:text-2xl">{profile.headline}</p>

      <dl className="grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {facts.map((fact, i) => (
          <div
            key={fact.label}
            className={cn("flex flex-col gap-1 py-4 pr-4", i % 2 === 1 && "border-l border-line pl-4", i >= 2 && "border-t border-line sm:border-t-0", i === 2 && "sm:border-l sm:pl-4")}
          >
            <dt className="label-quiet">{fact.label}</dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-[-0.03em] tabular">{fact.value}</span>
              {fact.detail ? <span className="text-[13px] text-muted">{fact.detail}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  )
}

function AreaBreakdown({ areas, technologies }: { areas: AreaSkill[]; technologies: TechnologySkill[] }) {
  const byId = new Map(technologies.map((t) => [t.id, t]))
  return (
    <ul className="flex flex-col">
      {[...areas]
        .sort((a, b) => b.score - a.score)
        .map((area) => (
          <li key={area.id} className="border-b border-line last:border-b-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90" aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{area.label}</span>
                    <span className="flex items-center gap-3">
                      <DotMeter value={area.score} />
                      <span className="w-14 text-right text-sm font-semibold tabular">
                        {area.score}
                        <span className="font-normal text-muted">/100</span>
                      </span>
                    </span>
                  </span>
                  <span className="truncate text-[13px] text-muted">
                    {area.technologies.length
                      ? area.technologies.slice(0, 4).map((t) => t.name).join(" · ") +
                        (area.technologies.length > 4 ? ` +${area.technologies.length - 4}` : "")
                      : "No evidence yet"}
                  </span>
                </span>
              </summary>
              <div className="flex flex-col gap-3 pb-4 pl-8">
                <p className="text-[13px] text-muted">
                  {area.description}. Seen in {area.repoCount} {area.repoCount === 1 ? "repository" : "repositories"}.
                </p>
                {area.technologies.length ? (
                  <ul className="flex flex-col gap-2.5">
                    {area.technologies.map(({ id }) => {
                      const tech = byId.get(id)!
                      return (
                        <li key={id} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-center gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_7.5rem_minmax(0,1fr)]">
                          <span className="truncate font-medium">{tech.name}</span>
                          <span className="flex items-center gap-2">
                            <DotMeter value={tech.strength} />
                            <span className="text-[12px] text-muted tabular">{tech.strength}</span>
                          </span>
                          <span className="col-span-2 truncate text-[13px] text-muted sm:col-span-1">
                            {tech.evidence.slice(0, 3).map((e, i) => (
                              <span key={e.repo}>
                                {i ? ", " : ""}
                                <a href={e.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[12.5px] hover:text-ink hover:underline">
                                  {e.repo}
                                </a>
                              </span>
                            ))}
                            {tech.repoCount > 3 ? ` +${tech.repoCount - 3}` : ""} · last push {shortDate(tech.lastUsed)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            </details>
          </li>
        ))}
    </ul>
  )
}

const insightMarker: Record<Insight["tone"], string> = {
  signal: "mt-[8px] size-2 rounded-full bg-brand",
  neutral: "mt-[8px] size-2 rounded-full border-[1.5px] border-muted",
  caution: "tri mt-[8px] h-[9px] w-[10px] bg-warn",
}

export function InsightList({ insights }: { insights: Insight[] }) {
  if (!insights.length) return <p className="text-sm text-muted">Nothing stands out yet.</p>
  return (
    <ul className="flex flex-col gap-3.5">
      {insights.map((insight) => (
        <li key={insight.text} className="flex gap-3 text-[15px] leading-relaxed">
          <span aria-hidden="true" className={cn("shrink-0", insightMarker[insight.tone])} />
          <span>
            {insight.tone === "caution" ? <span className="sr-only">Gap: </span> : null}
            {insight.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

// One accent, stepped down in opacity, with gaps between segments so they
// read apart without relying on colour.
const SHADES = [1, 0.72, 0.52, 0.38, 0.28, 0.2, 0.15, 0.11]

function LanguageBar({ languages }: { languages: SkillProfile["languages"] }) {
  if (!languages.length) return <p className="text-sm text-muted">No code found yet.</p>
  const shown = languages.filter((l) => l.share >= 0.01)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3 gap-[3px] overflow-hidden rounded-full" aria-hidden="true">
        {shown.map((l, i) => (
          <span key={l.name} className="h-full bg-brand first:rounded-l-full last:rounded-r-full" style={{ width: `${l.share * 100}%`, opacity: SHADES[i] }} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        {languages.map((l, i) => (
          <li key={l.name} className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px] bg-brand" style={{ opacity: SHADES[i] }} />
            <span className="truncate">{l.name}</span>
            <span className="ml-auto text-[13px] text-muted tabular">
              {l.share < 0.01 ? "<1" : Math.round(l.share * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StackGrid({ technologies }: { technologies: TechnologySkill[] }) {
  const groups = SKILL_AREAS.map((area) => ({
    area,
    techs: technologies.filter((t) => t.area === area.id && t.kind !== "language"),
  })).filter((g) => g.techs.length)

  if (!groups.length) return <p className="text-sm text-muted">No frameworks or tools detected yet.</p>

  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map(({ area, techs }) => (
        <section key={area.id} className="flex flex-col gap-2.5">
          <h3 className="label-quiet">{area.label}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {techs.map((t) => (
              <li
                key={t.id}
                title={`${t.name}: ${t.repoCount} ${t.repoCount === 1 ? "repository" : "repositories"}, last push ${shortDate(t.lastUsed)}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[13px]",
                  t.strength >= 70 ? "border-brand-dim bg-brand-soft" : "border-line"
                )}
              >
                {t.name}
                <span className="text-[11px] text-muted tabular">{t.repoCount}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function RepoList({ repos }: { repos: SkillProfile["repos"] }) {
  if (!repos.length) return null
  return (
    <Panel className="overflow-hidden">
      <div className="px-6 pb-3 pt-6">
        <PanelHeader title="Recently active repositories" description="Most recent push first, with the stack DevRadar found in each" />
      </div>
      <ul>
        {repos.map((repo) => (
          <li key={repo.url} className="border-t border-line">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-1 items-center gap-x-6 gap-y-2 px-6 py-4 transition-colors hover:bg-raised/50 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-mono text-[15px] font-medium">{repo.name}</span>
                  {repo.isPrivate ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-line px-1.5 py-px text-[11px] text-muted">
                      <Lock className="size-3" aria-hidden="true" />
                      Private
                    </span>
                  ) : null}
                  <ExternalLink className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </span>
                {repo.description ? <span className="truncate text-[13px] text-muted">{repo.description}</span> : null}
                {repo.technologies.length ? (
                  <span className="flex flex-wrap gap-1 pt-0.5">
                    {repo.technologies.map((name) => (
                      <span key={name} className="rounded border border-line px-1.5 py-px text-[12px] text-muted">
                        {name}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-4 text-[13px] text-muted sm:self-start">
                {repo.primaryLanguage ? <span className="hidden sm:inline">{repo.primaryLanguage}</span> : null}
                {repo.stars ? (
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">Stars:</span>
                    {repo.stars}
                  </span>
                ) : null}
                <span className="tabular">{shortDate(repo.pushedAt)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Methodology({ profile }: { profile: SkillProfile }) {
  return (
    <details className="group rounded-xl border border-dashed border-line px-6 py-4 text-[13px] text-muted">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-ink [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 text-muted transition-transform group-open:rotate-90" aria-hidden="true" />
        How this profile is scored
      </summary>
      <div className="flex max-w-3xl flex-col gap-2 pt-3 leading-relaxed">
        <p>
          DevRadar reads up to 100 of {profile.user.login}’s own, non-fork repositories
          {profile.includesPrivate ? ", including private ones (only you can see this page)" : " (public repositories only)"}: dependency
          manifests (package.json, requirements.txt, pyproject.toml, go.mod, Cargo.toml, Gemfile, composer.json, Maven and Gradle builds),
          the files at the root and the size of each language.
        </p>
        <p>
          A technology counts only when a repository declares it. Topics, names and READMEs are ignored. Recent work counts most: a
          repository’s weight halves for every year since its last push, and very small repositories count for less.
        </p>
        <p>
          An area’s score is three quarters depth (how many repositories use it) and one quarter breadth (how many of its technologies you
          use). Scores are relative signals for conversations, not grades. Last read from GitHub on {shortDate(profile.fetchedAt)}.
        </p>
      </div>
    </details>
  )
}
