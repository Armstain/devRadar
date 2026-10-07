import { CalendarClock, Clock, Hexagon, MessageSquareText, SquareKanban, Trophy, type LucideIcon } from "lucide-react";
import { LogoMarkIcon } from "@/components/app-shell/radar-icon";
import type { PipelineView } from "@/lib/pipeline";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon | typeof LogoMarkIcon;
  match: (pathname: string) => boolean;
}

export const workspaceNav: NavItem[] = [
  { label: "Radar", href: "/dashboard", icon: LogoMarkIcon, match: (p) => p === "/dashboard" },
  { label: "Pipeline", href: "/applications", icon: SquareKanban, match: (p) => p.startsWith("/applications") },
  { label: "Skill profile", href: "/github", icon: Hexagon, match: (p) => p.startsWith("/github") },
  { label: "Interview prep", href: "/interviews", icon: MessageSquareText, match: (p) => p.startsWith("/interviews") },
];

export const pipelineViews: { view: PipelineView; label: string; icon: LucideIcon }[] = [
  { view: "follow-up", label: "Needs follow-up", icon: Clock },
  { view: "interviews", label: "In interviews", icon: CalendarClock },
  { view: "offers", label: "Offers", icon: Trophy },
];
