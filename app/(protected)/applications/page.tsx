/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import BlurFade from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ApplicationsTable } from "@/components/applications/applications-table"

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
  const queryClient = useQueryClient()
  
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

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/applications/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteApplication.mutate(id)
    }
  }

  const counts = applications?.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

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
        <BlurFade key="offer" delay={0.75} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Offer</p>
              <p className="text-2xl font-bold">{counts['offer'] || 0}</p>
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
        <div className="p-6 space-y-6 space-x-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Applications</h2>
            <div className="flex gap-2">
              Total Applications: {applications?.length || 0}
            </div>
          </div>
          
          <ApplicationsTable 
            data={applications ?? []} 
            isLoading={isLoading}
            onDelete={handleDelete}
          />
        </div>
      </MagicCard>
    </div>
  );
}