/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import BlurFade from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  link: string;
  notes: string;
  createdAt: string;
}

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await axios.get('/api/applications');
      return response.data.map((app: any) => ({
        id: app._id,
        company: app.company,
        position: app.position,
        status: app.status,
        link: app.link,
        notes: app.notes,
        createdAt: app.createdAt,
      }));
    },
  });

  // Calculate counts for each status
  const counts = applications?.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // const counts = new Map();
  // applications?.forEach((app =>{
  //   const status = app.status;
  //   counts.set(status, (counts.get(status) || 0) + 1);
  // }))

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
              <p className="text-2xl font-bold">{counts['applied'] || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade key="in-progress" delay={0.5} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{counts['in-progress'] || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade key="offers" delay={0.75} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Offers</p>
              <p className="text-2xl font-bold">{counts['offers'] || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade key="rejected" delay={1} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{counts['rejected'] || 0}</p>
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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center">Loading...</td>
                  </tr>
                ) : applications?.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/50">
                    <td className="py-3 px-4">{app.company}</td>
                    <td className="py-3 px-4">{app.position}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                        <ApplicationDialog application={app} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </MagicCard>
    </div>
  );
}