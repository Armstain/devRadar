import { useState, useEffect } from 'react';

interface GitHubUser {
    login: string;
    avatar_url: string;
    name: string;
    public_repos: number;
    followers: number;
    following: number;
}

interface GitHubRepo {
    id: number;
    name: string;
    description: string;
    html_url: string;
    stargazers_count: number;
    language: string;
}

export function useGitHub() {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchGitHubData() {
            const token = localStorage.getItem('github_token');

            if (!token) {
                setError('No GitHub token found');
                setLoading(false);
                return;
            }

            try {
                // Fetch user data
                const userResponse = await fetch('https://api.github.com/user', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                });

                if (!userResponse.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const userData = await userResponse.json();
                setUser(userData);

                // Fetch repositories
                const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                });

                if (!reposResponse.ok) {
                    throw new Error('Failed to fetch repositories');
                }

                const reposData = await reposResponse.json();
                setRepos(reposData);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchGitHubData();
    }, []);

    return { user, repos, loading, error };
} 