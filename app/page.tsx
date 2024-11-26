import { ModeToggle } from "@/components/ModeToggle";
import BlurFade from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";

export default function Home() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Developer Dashboard</h1>
        <ModeToggle />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
       <BlurFade delay={0.25} inView>
       <MagicCard className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Active Applications</p>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">+3 this week</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade delay={0.5} inView>
          <MagicCard className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Interview Pipeline</p>
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-muted-foreground">2 upcoming</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade delay={0.75} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
            <p className="text-sm text-muted-foreground">GitHub Activity</p>
            <p className="text-2xl font-bold">156</p>
            <p className="text-xs text-muted-foreground">commits this month</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade delay={1} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Network Growth</p>
            <p className="text-2xl font-bold">89</p>
            <p className="text-xs text-muted-foreground">+12 new connections</p>
          </div>
          </MagicCard>
        </BlurFade>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <MagicCard className="col-span-4">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Application Progress</h2>
            {/* We'll add a chart component here */}
          </div>
        </MagicCard>
        <MagicCard className="col-span-3">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
            {/* We'll add a list of recent applications */}
          </div>
        </MagicCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MagicCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">GitHub Activity</h2>
            {/* We'll add GitHub activity feed */}
          </div>
        </MagicCard>
        <MagicCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Network Insights</h2>
            {/* We'll add networking metrics and alerts */}
          </div>
        </MagicCard>
      </div>
    </div>
  );
}