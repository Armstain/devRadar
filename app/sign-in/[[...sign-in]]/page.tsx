import type { Metadata } from "next";
import { AuthFrame } from "@/components/auth-frame";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return <AuthFrame mode="sign-in" />;
}
