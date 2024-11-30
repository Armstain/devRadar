"use client";

import { cn } from "@/lib/utils";
import {
  Briefcase,
  Github,
  LinkedinIcon,
  Users,
  LayoutDashboard,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MagicCard } from "./ui/magic-card";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-blue-500",
  },
  {
    label: "Job Applications",
    icon: Briefcase,
    href: "/applications",
    color: "text-green-500",
  },
  {
    label: "GitHub Activity",
    icon: Github,
    href: "/github",
    color: "text-purple-500",
  },
  {
    label: "LinkedIn",
    icon: LinkedinIcon,
    href: "/linkedin",
    color: "text-sky-500",
  },
  {
    label: "Interview Questions",
    icon: Users,
    href: "/interviews",
    color: "text-amber-500",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background/80 backdrop-blur-sm border"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <MagicCard
        className={cn(
          "fixed md:static",
          "transition-transform duration-300 ease-in-out",
          "py-2 flex flex-col h-full bg-background/80 backdrop-blur-sm",
          "w-64 md:w-auto",
          "min-h-screen md:min-h-0",
          "z-40",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="px-3 py-2">
          <h2
            className={cn(
              "mb-2 px-4 text-lg font-semibold tracking-tight",
              isMobile ? "text-right" : ""
            )}
          >
            DevRadar
          </h2>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2.5",
                  "text-sm font-medium transition-all duration-200",
                  "hover:bg-accent/50 hover:backdrop-blur-sm",
                  pathname === route.href
                    ? "bg-accent/50 backdrop-blur-sm text-accent-foreground"
                    : "text-muted-foreground",
                  "relative overflow-hidden"
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
                    route.color.replace("text-", "bg-")
                  )}
                />
                <route.icon className={cn("mr-3 h-5 w-5", route.color)} />
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </MagicCard>

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}