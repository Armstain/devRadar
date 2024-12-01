"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { MagicCard } from "@/components/ui/magic-card";
import BlurFade from "@/components/ui/blur-fade";
import { GitHubLoginButton } from "@/components/github-login-button";
import { LinkedInLoginButton } from "@/components/linkedin-login-button";
import { Briefcase, Github, LinkedinIcon, Users } from "lucide-react";
import DashboardCharts from "@/components/dashboard-charts";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import NumberTicker from "@/components/ui/number-ticker";

interface DashboardStats {
  applications: {
    total: number;
    applied: number;
    interviewing: number;
    offered: number;
    rejected: number;
  };
  github?: {
    connected: boolean;
    publicRepos?: number;
    followers?: number;
    following?: number;
    languages?: Array<{
      language: string;
      percentage: number;
    }>;
    contributions?: {
      currentStreak: number;
      totalContributions: number;
      averagePerDay: number;
    };
  };
  linkedin?: {
    connected: boolean;
    connections?: number;
    posts?: number;
  };
}

export default function DashboardPage() {
  
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => axios.get('/api/applications').then(res => res.data),
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
      } catch (error) {
        console.error('GitHub data fetch error:', error);
        return null;
      }
    },
    retry: false,
  });

  const { data: linkedinData, isLoading: isLoadingLinkedin } = useQuery({
    queryKey: ['linkedin-user'],
    queryFn: () => axios.get('/api/linkedin/user').then(res => res.data),
    retry: false, // Don't retry if LinkedIn is not connected
  });

  // Combine loading states
  const isLoading = isLoadingApps || isLoadingGithub || isLoadingLinkedin;

  // Transform data for stats
  const stats: DashboardStats = {
    applications: applications ? {
      total: applications.length,
      applied: applications.filter(app => app.status === 'applied').length,
      interviewing: applications.filter(app => app.status === 'interviewing').length,
      offered: applications.filter(app => app.status === 'offered').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    } : {
      total: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      rejected: 0,
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
    linkedin: linkedinData ? {
      connected: true,
      connections: linkedinData.numConnections,
      posts: linkedinData.numPosts,
    } : { connected: false },
  };

  if (isLoading) {
    return <LoadingSpinner className="h-screen flex justify-center items-center" />;
  }

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      {/* Application Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <BlurFade delay={0.1}>
          <MagicCard className="p-6">
            <div className="flex items-center gap-4">
              <Briefcase className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <div className="text-2xl font-bold">
                  <NumberTicker value={stats?.applications.total || 0} />
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.2}>
          <MagicCard className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Applied</p>
                <div className="text-2xl font-bold">
                  <NumberTicker value={stats?.applications.applied || 0} />
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.3}>
          <MagicCard className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats?.applications.interviewing || 0}</p>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.4}>
          <MagicCard className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats?.applications.rejected || 0}</p>
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      {/* Charts Section */}
      <DashboardCharts stats={stats} />

      {/* Integrations Status */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <BlurFade delay={0.5}>
          <MagicCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">GitHub Integration</h2>
            {stats?.github?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Github className="h-8 w-8" />
                  <div>
                    <p className="text-sm text-green-500">Connected</p>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Repositories</p>
                        <p className="text-xl font-bold">{stats.github.publicRepos}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Followers</p>
                        <p className="text-xl font-bold">{stats.github.followers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Following</p>
                        <p className="text-xl font-bold">{stats.github.following}</p>
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

        <BlurFade delay={0.6}>
          <MagicCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">LinkedIn Integration</h2>
            {stats?.linkedin?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <LinkedinIcon className="h-8 w-8" />
                  <div>
                    <p className="text-sm text-green-500">Connected</p>
                  </div>
                </div>
              </div>
            ) : (
              <LinkedInLoginButton />
            )}
          </MagicCard>
        </BlurFade>
      </div>
    </div>
  );
}