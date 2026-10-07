import { AppShell } from "@/components/app-shell/app-shell";

// The proxy (proxy.ts) already redirects signed-out visitors to sign in.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
