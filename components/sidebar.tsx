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

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Job Applications",
    icon: Briefcase,
    href: "/applications",
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
    label: "Interview Questions",
    icon: Users,
    href: "/interviews",
  },
  
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(()=>{
    const handleResize = () =>{
        setIsMobile(window.innerWidth < 768)
        setIsOpen(window.innerWidth >= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  },[])


  return (
    <>
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-6 w-6 text-white" />
      </button>

      <div className={cn(
        "fixed md:static",
        "transition-transform duration-300 ease-in-out",
        "space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white",
        "w-64 md:w-auto",
        "min-h-screen md:min-h-0",
        "z-40",
        isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
      )}>
        <div className="px-3 py-2">
          <h2 className={cn(
            "mb-2 px-4 text-lg font-semibold",
            isMobile ? "text-right" : ""
          )}>DevRadar</h2>
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

      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}