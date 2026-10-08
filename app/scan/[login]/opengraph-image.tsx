import { ImageResponse } from "next/og";
import { RADAR_H, RADAR_W, radarGeometry } from "@/components/radar-chart";
import { getDb } from "@/server/db/client";
import { getCachedScan } from "@/server/services/github-scans";
import { parseGithubLogin } from "@/lib/github-login";
import { buildSkillProfile } from "@/lib/skills/profile";
import { tokens } from "@/lib/tokens";

export const alt = "DevRadar skill radar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const c = tokens.light;
const DIAL_W = 500;
const DIAL_H = (DIAL_W * RADAR_H) / RADAR_W;
const f = (n: number) => n.toFixed(1);

// Social card for a shared scan: the reading card, the one lifted object in
// the design, sitting on the ground colour. It only reads the cache: a link
// preview should never spend GitHub rate limit, and the page fills the cache.
export default async function Image({ params }: { params: Promise<{ login: string }> }) {
  const login = parseGithubLogin(decodeURIComponent((await params).login)) ?? "github";
  const cached = await getCachedScan(getDb(), login).catch(() => null);
  const profile = cached ? buildSkillProfile(cached.data) : null;
  const areas = profile?.areas ?? [];
  const g = areas.length >= 3 ? radarGeometry(areas.map((a) => ({ label: a.label, value: a.score / 100 }))) : null;
  const top = [...areas].sort((a, b) => b.score - a.score)[0];

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.ground, padding: 40, fontFamily: "sans-serif" }}>
        <div
          style={{
            display: "flex",
            flex: 1,
            background: c.panel,
            color: c.ink,
            border: `1px solid ${c.line}`,
            borderRadius: 24,
            padding: "48px 40px 48px 56px",
            boxShadow: "0 24px 48px -28px rgba(20, 21, 21, 0.45)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
              <svg width="32" height="32" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8.5" stroke={c.ink} strokeWidth="1.5" />
                <circle cx="10" cy="10" r="4" stroke={c.ink} strokeWidth="1.2" opacity="0.45" />
                <path d="M10 10 16 4.5" stroke={c.ink} strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="13.6" cy="12.4" r="1.8" fill={c.brand} />
              </svg>
              devradar
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: c.brand }}>{profile?.archetype ?? "Skill radar"}</div>
              <div style={{ display: "flex", fontSize: 76, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>@{profile?.user.login ?? login}</div>
              <div style={{ display: "flex", fontSize: 28, color: c["ink-soft"], maxWidth: 520, lineHeight: 1.35 }}>
                {profile
                  ? `${profile.stats.reposAnalyzed} repositories read · ${profile.stats.technologyCount} technologies${top ? ` · strongest in ${top.label}` : ""}`
                  : "Skills, read from the code they ship."}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 22, color: c.muted }}>Scan any GitHub profile at devradar</div>
          </div>
          {g ? (
            <div style={{ display: "flex", position: "relative", width: DIAL_W, height: DIAL_H, alignSelf: "center" }}>
              <svg width={DIAL_W} height={DIAL_H} viewBox={`0 0 ${RADAR_W} ${RADAR_H}`}>
                {g.ticks.map((t, i) => (
                  <line key={i} x1={f(t.x1)} y1={f(t.y1)} x2={f(t.x2)} y2={f(t.y2)} stroke={t.major ? c.ink : c.scope} strokeWidth={t.major ? 1.5 : 1} />
                ))}
                {[0.25, 0.5, 0.75, 1].map((k) => (
                  <circle key={k} cx={RADAR_W / 2} cy={RADAR_H / 2} r={118 * k} fill="none" stroke={k === 1 ? c.scope : c.line} strokeWidth="1" />
                ))}
                {g.stipple.map(([x, y], i) => (
                  <circle key={`s${i}`} cx={f(x)} cy={f(y)} r="1.3" fill={c.brand} opacity="0.55" />
                ))}
                <polygon points={g.shape} fill={c.brand} fillOpacity="0.07" stroke={c.brand} strokeWidth="2" strokeLinejoin="round" />
                {g.vertices.map(([x, y], i) => (
                  <circle key={`v${i}`} cx={f(x)} cy={f(y)} r="4.5" fill={c.brand} stroke={c.panel} strokeWidth="2" />
                ))}
              </svg>
              {areas.map((a, i) => {
                const x = (parseFloat(g.labels[i].left) / 100) * DIAL_W;
                const y = (parseFloat(g.labels[i].top) / 100) * DIAL_H;
                return (
                  <div
                    key={a.id}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "absolute", left: x - 60, top: y - 22, width: 120 }}
                  >
                    <div style={{ display: "flex", fontSize: 17, fontWeight: 700, color: c.ink }}>{a.label}</div>
                    <div style={{ display: "flex", fontSize: 16, color: c.muted }}>{String(a.score)}</div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    ),
    size
  );
}
