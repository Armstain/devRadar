"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BlurFade from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { GitHubLoginButton } from "@/components/github-login-button";

export default function GitHubActivityPage() {
  const router = useRouter();
  const [isGitHubConnected, setIsGitHubConnected] = useState<boolean | null>(null);

  // Check if GitHub is connected
  useQuery({
    queryKey: ['github-connection'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/github/user');
        setIsGitHubConnected(true);
        return response.data;
      } catch (error) {
        setIsGitHubConnected(false);
        return null;
      }
    },
  });

  // Fetch GitHub data only if connected
  const { data: githubData, isLoading } = useQuery({
    queryKey: ['github-data'],
    queryFn: async () => {
      const [userResponse, reposResponse] = await Promise.all([
        axios.get('/api/github/user'),
        axios.get('/api/github/repos')
      ]);

      const repos = reposResponse.data;
      const user = userResponse.data;

      return {
        user,
        totalCommits: repos.reduce((acc: number, repo: any) => acc + (repo.commits || 0), 0),
        publicRepos: user.public_repos,
        topRepos: repos
          .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
          .slice(0, 5)
          .map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            description: repo.description,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
          })),
      };
    },
    enabled: isGitHubConnected === true, // Only run if GitHub is connected
  });

  // Show GitHub connection screen if not connected
  if (isGitHubConnected === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
        <h1 className="text-3xl font-bold mb-6">Connect GitHub</h1>
        <p className="text-muted-foreground mb-8">
          Connect your GitHub account to see your activity and statistics.
        </p>
        <GitHubLoginButton />
      </div>
    );
  }

  if (isLoading || isGitHubConnected === null) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">GitHub Activity</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <BlurFade delay={0.25} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Public Repos</p>
              <p className="text-2xl font-bold">{githubData?.publicRepos || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>
        
        <BlurFade delay={0.5} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Followers</p>
              <p className="text-2xl font-bold">{githubData?.user?.followers || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.75} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Following</p>
              <p className="text-2xl font-bold">{githubData?.user?.following || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={1} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Stars Received</p>
              <p className="text-2xl font-bold">
                {githubData?.topRepos?.reduce((acc: number, repo: any) => acc + repo.stars, 0) || 0}
              </p>
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MagicCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img 
                  src={githubData?.user?.avatar_url} 
                  alt="GitHub Avatar" 
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-medium">{githubData?.user?.name}</p>
                  <p className="text-sm text-muted-foreground">@{githubData?.user?.login}</p>
                </div>
              </div>
              <p className="text-muted-foreground">{githubData?.user?.bio}</p>
            </div>
          </div>
        </MagicCard>

        <MagicCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Top Repositories</h2>
            <div className="space-y-4">
              {githubData?.topRepos?.map((repo: any) => (
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
          </div>
        </MagicCard>
      </div>
    </div>
  );
}