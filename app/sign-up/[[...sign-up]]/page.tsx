import type { Metadata } from "next";
import { AuthFrame } from "@/components/auth-frame";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return <AuthFrame mode="sign-up" />;
}
