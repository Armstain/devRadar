"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyAiRead, type CvRead } from "@/lib/cv/ai";
import { redact } from "@/lib/cv/parse";
import { forgetAllCvs, forgetCv, loadCv, saveCv } from "@/lib/cv/store";
import type { CvProfile } from "@/lib/cv/types";

const cvKey = (userId: string | null | undefined) => ["cv", userId ?? "signed-out"] as const;

// The user's CV, read from this browser only.
export function useCv() {
    const { userId } = useAuth();
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: cvKey(userId),
        queryFn: () => (userId ? loadCv(userId) : null),
        enabled: Boolean(userId),
        staleTime: Infinity,
    });
    const save = useMutation({
        mutationFn: async (cv: CvProfile) => {
            if (userId) await saveCv(userId, cv);
            return cv;
        },
        onSuccess: (cv) => queryClient.setQueryData(cvKey(userId), cv),
    });
    const forget = useMutation({
        mutationFn: async () => {
            if (userId) await forgetCv(userId);
        },
        onSuccess: () => queryClient.setQueryData(cvKey(userId), null),
    });
    // Opt-in: the redacted text goes to /api/cv/read and comes back as roles;
    // the merged profile is saved here, like everything else
    const readWithAi = useMutation({
        mutationFn: async (cv: CvProfile) => {
            const { data } = await axios.post<CvRead>("/api/cv/read", { text: redact(cv.text).slice(0, 30_000) });
            return applyAiRead(cv, data);
        },
        onSuccess: (cv) => save.mutate(cv),
    });
    return { cv: query.data ?? null, isLoading: query.isLoading, save, forget, readWithAi };
}

// Mounted once in the root layout: when a session ends, every CV stored in
// this browser is removed.
export function CvSignOutGuard() {
    const { isLoaded, isSignedIn } = useAuth();
    const wasSignedIn = useRef(false);
    useEffect(() => {
        if (!isLoaded) return;
        if (isSignedIn) wasSignedIn.current = true;
        else if (wasSignedIn.current) void forgetAllCvs();
    }, [isLoaded, isSignedIn]);
    return null;
}
