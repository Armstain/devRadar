"use client";

import BlurFade from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function GitHubActivityPage() {
  const { data: githubActivity, isLoading } = useQuery({
    queryKey: ['github-activity'],
    queryFn: async () => {
      const response = await axios.get('/api/github');
      return response.data;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">GitHub Activity</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <BlurFade delay={0.25} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Commits</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : githubActivity?.totalCommits || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
        
        <BlurFade delay={0.5} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Public Repos</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : githubActivity?.publicRepos || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.75} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pull Requests</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : githubActivity?.pullRequests || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={1} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Contributors</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : githubActivity?.contributors || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MagicCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Commits</h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="space-y-4">
                {githubActivity?.recentCommits?.map((commit: any) => (
                  <div key={commit.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{commit.message}</p>
                      <p className="text-sm text-muted-foreground">{commit.repo}</p>
                      <p className="text-xs text-muted-foreground">{new Date(commit.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MagicCard>

        <MagicCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Top Repositories</h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <div className="space-y-4">
                {githubActivity?.topRepos?.map((repo: any) => (
                  <div key={repo.id} className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{repo.name}</p>
                      <p className="text-sm text-muted-foreground">{repo.description}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>⭐ {repo.stars}</span>
                        <span>🔀 {repo.forks}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MagicCard>
      </div>
    </div>
  );
} 