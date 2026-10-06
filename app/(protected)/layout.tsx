"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ModeToggle";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Show when="signed-in">
        <Sidebar />
      </Show>
      <main className="flex-1 overflow-auto">
        <Show when="signed-in">
          <div className="flex justify-end items-center gap-3 p-4">
            <ModeToggle />
            <UserButton />
          </div>
          {children}
        </Show>
        <Show when="signed-out">
          <div className="flex h-full items-center justify-center">
            <SignInButton mode="modal" />
          </div>
        </Show>
      </main>
    </div>
  );
} 