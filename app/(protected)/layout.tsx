import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell/app-shell";
import { LAYOUT_COOKIE, parseLayout } from "@/components/app-shell/layout-mode";

// The proxy (proxy.ts) already redirects signed-out visitors to sign in. The
// layout choice (top bar or sidebar) comes from a cookie so the first paint
// already matches it.
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const initialLayout = parseLayout((await cookies()).get(LAYOUT_COOKIE)?.value);
  return <AppShell initialLayout={initialLayout}>{children}</AppShell>;
}
