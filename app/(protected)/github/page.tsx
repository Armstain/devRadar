"use client";

import {  useState } from 'react';
import { useRouter } from 'next/navigation';
import BlurFade from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { GitHubLoginButton } from "@/components/github-login-button";
import Link from 'next/link';

export default function GitHubActivityPage() {
  const router = useRouter();
  const [isGitHubConnected, setIsGitHubConnected] = useState<boolean | null>(null);
  const [starredPage, setStarredPage] = useState(1);
  const [commitsPage, setCommitsPage] = useState(1);
  const starredItemsPerPage = 3;
  const commitsItemsPerPage = 5;

  const paginateArray = (array: any[] = [], page: number, perPage: number) => {
    const start = (page - 1) * perPage;
    return array?.slice(start, start + perPage) || [];
  };

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
  const { data: githubData, isLoading, error } = useQuery({
    queryKey: ['github-data'],
    queryFn: async () => {
      try {
        const [
          userResponse,
          reposResponse,
          starredResponse,
          commitHistoryResponse,
          languagesResponse,
          contributionsResponse
        ] = await Promise.all([
          axios.get('/api/github/user'),
          axios.get('/api/github/repos'),
          axios.get('/api/github/starredRepo'),
          axios.get('/api/github/commitHistory'),
          axios.get('/api/github/languages'),
          axios.get('/api/github/contributions'),
        ]);

        return {
          user: userResponse.data,
          topRepos: reposResponse.data.topRepos,
          totalCommits: commitHistoryResponse.data.totalCommits,
          publicRepos: userResponse.data.public_repos,
          starred: starredResponse.data,
          commitCounts: commitHistoryResponse.data.commitCounts,
          languages: languagesResponse.data.languages,
          contributions: contributionsResponse.data,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('GitHub data fetch error:', error.response?.data);
        } else {
          console.error('GitHub data fetch error:', error);
        }
        throw error;
      }
    },
    enabled: isGitHubConnected === true,
  });
// most active commits
const mostActiveCommits = githubData?.commitCounts?.sort((a: any, b: any) => b.commitCount - a.commitCount).slice(0, 5);


  // Add error handling in the render
  if (error) {
    console.error('Error details:', error);
    return <div className="p-6">Error loading GitHub data. Please try again later.</div>;
  }

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
                {githubData?.topRepos?.length > 0 
                  ? githubData?.topRepos.reduce((acc: number, repo: any) => acc + repo.stars, 0) 
                  : 'no b-stars?'}
              </p>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={1.25} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Commits</p>
              <p className="text-2xl font-bold">{githubData?.totalCommits || 0}</p>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={1.5} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">
                {githubData?.contributions?.currentStreak || 0} days
              </p>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={1.75} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Contributions</p>
              <p className="text-2xl font-bold">
                {githubData?.contributions?.totalContributions || 0}
              </p>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={2} inView>
          <MagicCard className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Average Per Day</p>
              <p className="text-2xl font-bold">
                {githubData?.contributions?.averagePerDay || 0}
              </p>
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        

          
        <MagicCard>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">Most Active Commits</h2>
            <div className="space-y-3">
              {paginateArray(mostActiveCommits, commitsPage, commitsItemsPerPage)?.map((commit: any) => (
                <Link
                  href={`https://github.com/${commit.repo}`}
                  key={commit.repo}
                  className="block hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{commit.repo}</p>
                      <p className="text-sm text-muted-foreground">{commit.description}</p>
                      <p className="text-sm text-muted-foreground">{commit.language}</p>
                      <p className="text-sm text-muted-foreground">
                        {commit.commitCount} commit{commit.commitCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {githubData?.commitCounts && githubData.commitCounts.length > commitsItemsPerPage && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setCommitsPage(p => Math.max(1, p - 1))}
                    disabled={commitsPage === 1}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {commitsPage} of {Math.ceil((githubData?.commitCounts?.length || 0) / commitsItemsPerPage)}
                  </span>
                  <button
                    onClick={() => setCommitsPage(p => p + 1)}
                    disabled={commitsPage >= Math.ceil((githubData?.commitCounts?.length || 0) / commitsItemsPerPage)}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </MagicCard>
        <MagicCard>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-3">Starred Repositories</h2>
            <div className="space-y-3">
              {paginateArray(githubData?.starred, starredPage, starredItemsPerPage)?.map((repo: any) => (
                <Link 
                  href={repo.html_url}
                  key={repo.id}
                  className="block hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{repo.name}</p>
                      <p className="text-sm text-muted-foreground">{repo.description}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>stars ⭐ {repo.stars}</span>
                        <span>forks 🔀 {repo.forks}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
              {githubData?.starred && githubData.starred.length > starredItemsPerPage && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setStarredPage(p => Math.max(1, p - 1))}
                    disabled={starredPage === 1}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {starredPage} of {Math.ceil((githubData?.starred?.length || 0) / starredItemsPerPage)}
                  </span>
                  <button
                    onClick={() => setStarredPage(p => p + 1)}
                    disabled={starredPage >= Math.ceil((githubData?.starred?.length || 0) / starredItemsPerPage)}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </MagicCard>

        
        

        
      </div>
      <MagicCard className="col-span-full">
        <div className="p-6 w-full">
          <h2 className="text-xl font-semibold mb-4">Most Used Languages</h2>
          <div className="space-y-4 w-full">
            {githubData?.languages?.map((lang: any) => (
              <div key={lang.language} className="space-y-2 w-full">
                <div className="flex justify-between items-center w-full">
                  <span className="text-sm font-medium">{lang.language}</span>
                  <span className="text-sm text-muted-foreground">{lang.percentage}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${lang.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MagicCard>
    </div>
  );
}