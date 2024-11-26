import { ApplicationDialog } from "@/components/applications/application-dialog";
import BlurFade from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";

export default function ApplicationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Job Applications</h1>
        <ApplicationDialog />
      </div>

      {/* Status Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <BlurFade delay={0.25} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Applied</p>
            <p className="text-2xl font-bold">8</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade delay={0.5} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold">3</p>
          </div>
          </MagicCard>
        </BlurFade>
        <BlurFade delay={0.75} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Offers</p>
            <p className="text-2xl font-bold">1</p>
          </div>
          </MagicCard>
        </BlurFade>
        <BlurFade delay={1} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold">4</p>
          </div>
          </MagicCard>
        </BlurFade>
      </div>

      {/* Applications Table */}
      <MagicCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Applications</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Filter
              </Button>
              <Button variant="outline" size="sm">
                Sort
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Company</th>
                  <th className="py-3 px-4 text-left font-medium">Position</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-left font-medium">Applied Date</th>
                  <th className="py-3 px-4 text-left font-medium">Last Update</th>
                  <th className="py-3 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-muted/50">
                  <td className="py-3 px-4">Google</td>
                  <td className="py-3 px-4">Senior Frontend Developer</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                      In Progress
                    </span>
                  </td>
                  <td className="py-3 px-4">2024-03-15</td>
                  <td className="py-3 px-4">2024-03-18</td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
                {/* Add more rows as needed */}
              </tbody>
            </table>
          </div>
        </div>
      </MagicCard>
    </div>
  );
} 