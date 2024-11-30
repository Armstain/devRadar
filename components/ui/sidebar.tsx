"use client"

import { cn } from "@/lib/utils"
import {
  Briefcase,
  Github,
  LinkedinIcon,
  Users,
  LayoutDashboard,
  Menu,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
   
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
    label: "Interview Prep",
    icon: Users,
    href: "/interviews",
    
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsOpen(window.innerWidth >= 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-purple-500/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        className={cn(
          "fixed md:static",
          "transition-all duration-300 ease-in-out",
          "py-2 flex flex-col h-full bg-background/80 backdrop-blur-sm",
          "w-64 md:w-auto",
          "min-h-screen md:min-h-0",
          "z-40",
          "border-r border-purple-500/20",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="px-3 py-2 flex-1">
          <h2 className="mb-6 px-4 text-center text-2xl font-bold tracking-tight animate-gradient bg-gradient-to-r from-[#6C5CE7] via-[#E879F9] to-[#6C5CE7] bg-300% text-transparent bg-clip-text">
            DevRadar
          </h2>
          <div className="space-y-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2.5",
                  "text-lg font-medium transition-all duration-200",
                  "hover:bg-purple-500/10",
                  pathname === route.href
                    ? "bg-purple-500/10 text-white"
                    : "text-muted-foreground hover:text-white",
                  "relative overflow-hidden"
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
                   
                  )}
                />
                <route.icon className={cn("mr-3 h-4 w-4")} />
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
