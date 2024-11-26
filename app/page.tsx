
import { ModeToggle } from "@/components/ModeToggle";
import { MagicCard } from "@/components/ui/magic-card";


export default function Home() {
  return (
    
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <ModeToggle />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MagicCard className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Applications</p>
            <p className="text-2xl font-bold">12</p>
          </div>
        </MagicCard>
        <MagicCard className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Interviews</p>
            <p className="text-2xl font-bold">4</p>
          </div>
        </MagicCard>
        <MagicCard className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">GitHub Commits</p>
            <p className="text-2xl font-bold">156</p>
          </div>
        </MagicCard>
        <MagicCard className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Network Connections</p>
            <p className="text-2xl font-bold">89</p>
          </div>
        </MagicCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <MagicCard className="col-span-4">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Weekly Overview</h2>
            
          </div>
        </MagicCard>
        <MagicCard className="col-span-3">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
            
          </div>
        </MagicCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MagicCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">GitHub Activity</h2>
            
          </div>
        </MagicCard>
        <MagicCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Network Stats</h2>
            
          </div>
        </MagicCard>
      </div>
      
    </div>
  );
}