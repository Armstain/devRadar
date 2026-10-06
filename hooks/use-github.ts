"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export interface LanguageShare {
    language: string;
    percentage: number;
    bytes: number;
}

export interface Contributions {
    totalContributions: number;
    currentStreak: number;
    averagePerDay: number;
    recentContributions: { date: string; count: number }[];
}

// Both endpoints fan out to the GitHub API, so cache them for a while.
const STALE = 10 * 60 * 1000;

export function useGithubLanguages(enabled: boolean) {
    return useQuery({
        queryKey: ["github", "languages"],
        enabled,
        staleTime: STALE,
        retry: false,
        queryFn: async () => (await axios.get<{ languages: LanguageShare[] }>("/api/github/languages")).data.languages,
    });
}

export function useGithubContributions(enabled: boolean) {
    return useQuery({
        queryKey: ["github", "contributions"],
        enabled,
        staleTime: STALE,
        retry: false,
        queryFn: async () => (await axios.get<Contributions>("/api/github/contributions")).data,
    });
}

// Fills the days GitHub reported nothing for, oldest first. GitHub's dates
// are UTC calendar days, so the series is built in UTC too.
export function dailySeries(contributions: Contributions["recentContributions"], days: number, today: Date) {
    const counts = new Map(contributions.map((c) => [c.date, c.count]));
    const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return Array.from({ length: days }, (_, i) => {
        const key = new Date(base - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
        return { date: key, count: counts.get(key) ?? 0 };
    });
}
