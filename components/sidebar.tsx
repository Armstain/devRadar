"use client";

import { cn } from "@/lib/utils";
import {
  Briefcase,
  Github,
  LinkedinIcon,
  Users,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Job Applications",
    icon: Briefcase,
    href: "/jobs",
  },
  {
    label: "GitHub Activity",
    icon: Github,
    href: "/github",
  },
  {
    label: "LinkedIn",
    icon: LinkedinIcon,
    href: "/linkedin",
  },
  {
    label: "Network",
    icon: Users,
    href: "/network",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">DevConnect</h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className="h-5 w-5 mr-3" />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}