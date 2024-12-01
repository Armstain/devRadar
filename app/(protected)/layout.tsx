"use client";

import { UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/ui/sidebar";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <SignedIn>
        <Sidebar />
      </SignedIn>
      <main className="flex-1 overflow-auto">
        <SignedIn>
          <div className="flex justify-end p-4">
            <UserButton />
          </div>
          {children}
        </SignedIn>
        <SignedOut>
          <div className="flex h-full items-center justify-center">
            <SignInButton mode="modal">
              
            </SignInButton>
          </div>
        </SignedOut>
      </main>
    </div>
  );
} 