"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { MagicCard } from "@/components/ui/magic-card";
import BlurFade from "@/components/ui/blur-fade";
import { GitHubLoginButton } from "@/components/github-login-button";
import { Briefcase, Github, Users } from "lucide-react";
import DashboardCharts, { type DashboardStats } from "@/components/dashboard-charts";
import { normalizeStatus, type ApplicationStatus } from "@/lib/applications";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import NumberTicker from "@/components/ui/number-ticker";

export default function DashboardPage() {
  
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => axios.get<{ status: string }[]>('/api/applications').then(res => res.data),
  });

  const { data: githubData, isLoading: isLoadingGithub } = useQuery({
    queryKey: ['github-user'],
    queryFn: async () => {
      try {
        const [userResponse, languagesResponse, contributionsResponse] = await Promise.all([
          axios.get('/api/github/user'),
          axios.get('/api/github/languages'),
          axios.get('/api/github/contributions'),
        ]);

        return {
          ...userResponse.data,
          languages: languagesResponse.data.languages,
          contributions: contributionsResponse.data,
        };
      } catch {
        // Not connected (or GitHub is unavailable): show the connect button
        return null;
      }
    },
    retry: false,
  });

  // Combine loading states
  const isLoading = isLoadingApps || isLoadingGithub;

  const countStatus = (status: ApplicationStatus) =>
    applications?.filter(app => normalizeStatus(app.status) === status).length ?? 0;

  // Transform data for stats
  const stats: DashboardStats = {
    applications: {
      total: applications?.length ?? 0,
      applied: countStatus('applied'),
      interviewing: countStatus('in-progress'),
      offered: countStatus('offer'),
      rejected: countStatus('rejected'),
    },
    github: githubData ? {
      connected: true,
      publicRepos: githubData.public_repos,
      followers: githubData.followers,
      following: githubData.following,
      languages: githubData.languages || [],
      contributions: {
        currentStreak: githubData.contributions?.currentStreak || 0,
        totalContributions: githubData.contributions?.totalContributions || 0,
        averagePerDay: githubData.contributions?.averagePerDay || 0
      }
    } : { connected: false },
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <LoadingSpinner className="w-12 h-12" />
        <p className="mt-4 text-lg text-muted-foreground animate-pulse">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        Dashboard Overview
      </h1>

      {/* Application Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <BlurFade delay={0.1}>
          <MagicCard className="p-6">
            <div className="flex items-center gap-4">
              <Briefcase className="h-10 w-10 text-blue-500" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Total Applications</p>
                <div className="text-3xl font-bold">
                  <NumberTicker value={stats?.applications.total || 0} />
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.2}>
          <MagicCard className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-10 w-10 text-yellow-500" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Applied</p>
                <div className="text-3xl font-bold">
                  <NumberTicker value={stats?.applications.applied || 0} />
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.3}>
          <MagicCard className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-10 w-10 text-green-500" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">In Progress</p>
                <div className="text-3xl font-bold">
                  {stats?.applications.interviewing || 0}
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.4}>
          <MagicCard className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-10 w-10 text-red-500" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Rejected</p>
                <div className="text-3xl font-bold">
                  {stats?.applications.rejected || 0}
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      {/* Charts Section */}
      <DashboardCharts stats={stats} />

      {/* Integrations Status */}
      <div className="grid gap-6 grid-cols-1">
        <BlurFade delay={0.5}>
          <MagicCard className="p-6">
            <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              GitHub Integration
            </h2>
            {stats?.github?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Github className="h-10 w-10" />
                  <div>
                    <p className="text-sm text-green-500 font-medium">Connected</p>
                    <div className="grid grid-cols-3 gap-6 mt-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">Repositories</p>
                        <p className="text-2xl font-bold">{stats.github.publicRepos}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">Followers</p>
                        <p className="text-2xl font-bold">{stats.github.followers}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">Following</p>
                        <p className="text-2xl font-bold">{stats.github.following}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <GitHubLoginButton />
            )}
          </MagicCard>
        </BlurFade>

      </div>
    </div>
  );
}