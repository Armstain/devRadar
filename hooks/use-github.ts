"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import type { GithubProfileState } from "@/server/services/github-snapshots";

export type { GithubProfileState };

const PROFILE_KEY = ["github", "profile"] as const;

const isSyncing = (state: GithubProfileState | undefined) => state?.status === "queued" || state?.status === "syncing";

// The stored skill profile. While a sync is running it polls every few
// seconds, so the page fills in as soon as the background job finishes.
export function useGithubProfile() {
    return useQuery({
        queryKey: PROFILE_KEY,
        staleTime: 60_000,
        queryFn: async () => (await axios.get<GithubProfileState>("/api/github/profile")).data,
        refetchInterval: (query) => (isSyncing(query.state.data) ? 3_000 : false),
    });
}

export function useSyncGithub() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => (await axios.post("/api/github/sync")).data,
        onSuccess: () => {
            queryClient.setQueryData<GithubProfileState>(PROFILE_KEY, (state) => (state ? { ...state, status: "queued", error: null } : state));
            void queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
        },
        onError: (error) => {
            const message = axios.isAxiosError(error) ? (error.response?.data as { error?: string } | undefined)?.error : undefined;
            toast.error(message ?? "Couldn’t start a sync. Please try again.");
        },
    });
}

export function syncInProgress(state: GithubProfileState | undefined): boolean {
    return isSyncing(state);
}

// The last `days` UTC days of a contribution calendar, oldest first, with
// missing days filled with zero.
export function dailySeries(calendar: { date: string; count: number }[], days: number, today: Date) {
    const counts = new Map(calendar.map((c) => [c.date, c.count]));
    const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    return Array.from({ length: days }, (_, i) => {
        const key = new Date(base - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
        return { date: key, count: counts.get(key) ?? 0 };
    });
}
