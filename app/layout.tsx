import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import QueryProvider from "./providers/query-client-provider";

const grotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DevRadar — your skills, the way a hiring manager sees them",
    template: "%s · DevRadar",
  },
  description:
    "Scan your GitHub to map your skills, see how you fit each job, and track every application to the offer.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0d0b" },
    { media: "(prefers-color-scheme: light)", color: "#f4f5f2" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        options: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "iconButton",
        },
      }}
    >
      <html suppressHydrationWarning lang="en" className={`${grotesk.variable} ${mono.variable}`}>
        <body>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <QueryProvider>{children}</QueryProvider>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--panel)",
                  color: "var(--ink)",
                  border: "1px solid var(--line)",
                  boxShadow: "var(--shadow-overlay)",
                  borderRadius: 12,
                  fontSize: 14,
                },
                success: { iconTheme: { primary: "var(--signal)", secondary: "var(--signal-ink)" } },
                error: { iconTheme: { primary: "var(--danger)", secondary: "var(--panel)" } },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
