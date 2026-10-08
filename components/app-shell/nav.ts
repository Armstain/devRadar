import { CalendarClock, Clock, Hexagon, MessageSquareText, ScanSearch, SquareKanban, Trophy, type LucideIcon } from "lucide-react";
import { LogoMarkIcon } from "@/components/app-shell/radar-icon";
import type { PipelineView } from "@/lib/pipeline";

export interface NavItem {
  label: string;
  // Stable key for the item's view-transition name
  key: string;
  href: string;
  icon: LucideIcon | typeof LogoMarkIcon;
  match: (pathname: string) => boolean;
}

export const workspaceNav: NavItem[] = [
  { label: "Overview", key: "overview", href: "/dashboard", icon: LogoMarkIcon, match: (p) => p === "/dashboard" },
  { label: "Pipeline", key: "pipeline", href: "/applications", icon: SquareKanban, match: (p) => p.startsWith("/applications") },
  { label: "Job fit", key: "fit", href: "/fit", icon: ScanSearch, match: (p) => p.startsWith("/fit") },
  { label: "Skills", key: "skills", href: "/github", icon: Hexagon, match: (p) => p.startsWith("/github") },
  { label: "Interview prep", key: "prep", href: "/interviews", icon: MessageSquareText, match: (p) => p.startsWith("/interviews") },
];

export const pipelineViews: { view: PipelineView; label: string; icon: LucideIcon }[] = [
  { view: "follow-up", label: "Follow up", icon: Clock },
  { view: "interviews", label: "In interviews", icon: CalendarClock },
  { view: "offers", label: "Offers", icon: Trophy },
];
