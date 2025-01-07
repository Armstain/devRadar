/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import BlurFade from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ApplicationsTable } from "@/components/applications/applications-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner";
// import { CSVImport } from "@/components/applications/csv-import"; 

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
      try {
        const response = await axios.delete(`/api/applications/${id}`);
        return response.data;
      } catch (error) {
        console.error('Error deleting application:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error) => {
      console.error('Delete mutation failed:', error);
      alert('Failed to delete application. Please try again.');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteApplication.mutate(id)
    }
  }

  const counts = applications?.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <LoadingSpinner className="w-12 h-12" />
        <p className="mt-4 text-lg text-muted-foreground animate-pulse">
          Loading applications...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Job Applications
        </h1>
        <div className="flex items-center gap-4">
          {/* <CSVImport /> */}
          <ApplicationDialog />
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <BlurFade delay={0.25} inView>
          <MagicCard className="p-6">
            <div className="space-y-3">
              <p className="text-base text-muted-foreground font-medium">Applied</p>
              <p className="text-3xl font-bold">{counts['applied'] || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade key="in-progress" delay={0.5} inView>
          <MagicCard className="p-6">
            <div className="space-y-3">
              <p className="text-base text-muted-foreground font-medium">In Progress</p>
              <p className="text-3xl font-bold">{counts['in-progress'] || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade key="offer" delay={0.75} inView>
          <MagicCard className="p-6">
            <div className="space-y-3">
              <p className="text-base text-muted-foreground font-medium">Offer</p>
              <p className="text-3xl font-bold">{counts['offer'] || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade key="rejected" delay={1} inView>
          <MagicCard className="p-6">
            <div className="space-y-3">
              <p className="text-base text-muted-foreground font-medium">Rejected</p>
              <p className="text-3xl font-bold">{counts['rejected'] || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      {/* Applications Table */}
      <div>
        <div className="p-6 space-y-6 overflow-x-auto rounded-lg bg-card/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              All Applications
            </h2>
            <div className="mt-2 sm:mt-0 text-lg text-muted-foreground">
              Total Applications: {applications?.length || 0}
            </div>
          </div>
          
          <ApplicationsTable 
            data={applications ?? []} 
            isLoading={isLoading}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}