import { ImageResponse } from "next/og";
import { getDb } from "@/server/db/client";
import { getCachedScan } from "@/server/services/github-scans";
import { parseGithubLogin } from "@/lib/github-login";
import { buildSkillProfile } from "@/lib/skills/profile";
import { tokens } from "@/lib/tokens";

export const alt = "DevRadar skill radar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const c = tokens.dark;

// Social card for a shared scan. It only reads the cache: a link preview
// should never spend GitHub rate limit, and the page itself fills the cache.
export default async function Image({ params }: { params: Promise<{ login: string }> }) {
  const login = parseGithubLogin(decodeURIComponent((await params).login)) ?? "github";
  const cached = await getCachedScan(getDb(), login).catch(() => null);
  const profile = cached ? buildSkillProfile(cached.data) : null;

  const R = 190;
  const center = 230;
  const point = (i: number, n: number, r: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return `${(center + Math.cos(angle) * r).toFixed(1)},${(center + Math.sin(angle) * r).toFixed(1)}`;
  };
  const areas = profile?.areas ?? [];
  const ring = (k: number) => areas.map((_, i) => point(i, areas.length, R * k)).join(" ");

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.ground, color: c.ink, padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700 }}>
            <div style={{ display: "flex", width: 34, height: 34, borderRadius: 17, border: `2px solid ${c.muted}`, alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, background: c.signal }} />
            </div>
            DevRadar
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", fontSize: 26, color: c.signal, letterSpacing: 2, textTransform: "uppercase" }}>
              {profile?.archetype ?? "Skill radar"}
            </div>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>@{profile?.user.login ?? login}</div>
            <div style={{ display: "flex", fontSize: 30, color: c.muted, maxWidth: 640, lineHeight: 1.3 }}>
              {profile ? `${profile.stats.reposAnalyzed} repositories · ${profile.stats.technologyCount} technologies detected` : "Skills, read from the code they ship."}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 24, color: c.muted }}>devradar · scan any GitHub profile</div>
        </div>
        {areas.length >= 3 ? (
          <div style={{ display: "flex", position: "relative", width: 460, height: 460, alignSelf: "center" }}>
            <svg width="460" height="460" viewBox="0 0 460 460">
              {[0.25, 0.5, 0.75, 1].map((k) => (
                <polygon key={k} points={ring(k)} fill="none" stroke={c.line} strokeWidth="2" />
              ))}
              <polygon
                points={areas.map((a, i) => point(i, areas.length, R * Math.max(0.03, a.score / 100))).join(" ")}
                fill="rgba(61, 220, 151, 0.16)"
                stroke={c.signal}
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
            {areas.map((a, i) => {
              const [x, y] = point(i, areas.length, R + 26).split(",").map(Number);
              return (
                <div
                  key={a.id}
                  style={{ display: "flex", position: "absolute", left: x - 70, top: y - 16, width: 140, justifyContent: "center", fontSize: 22, color: c.ink }}
                >
                  {`${a.label} ${a.score}`}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    ),
    size
  );
}
