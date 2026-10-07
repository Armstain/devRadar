"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import type { Application } from "@/lib/applications";
import type { JobPostInput } from "@/lib/job-posts";
import type { JobPostSummary, JobPostView } from "@/server/services/job-posts";

export type { JobPostSummary, JobPostView };

const errorMessage = (error: unknown, fallback: string) =>
    (axios.isAxiosError(error) ? (error.response?.data as { error?: string } | undefined)?.error : undefined) ?? fallback;

export function useJobPosts() {
    return useQuery({
        queryKey: ["job-posts"],
        queryFn: async () => (await axios.get<JobPostSummary[]>("/api/job-posts")).data,
    });
}

export function useJobPost(id: string | null | undefined) {
    return useQuery({
        queryKey: ["job-posts", id],
        enabled: Boolean(id),
        queryFn: async () => (await axios.get<JobPostView>(`/api/job-posts/${id}`)).data,
    });
}

export function useAnalyzeJobPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: JobPostInput) => (await axios.post<JobPostView>("/api/job-posts", input)).data,
        onSuccess: (view) => {
            queryClient.setQueryData(["job-posts", view.id], view);
            void queryClient.invalidateQueries({ queryKey: ["job-posts"], exact: true });
        },
    });
}

export function useSaveToPipeline(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => (await axios.post<Application>(`/api/job-posts/${id}/application`, {})).data,
        onSuccess: (application) => {
            queryClient.setQueryData<JobPostView>(["job-posts", id], (view) => (view ? { ...view, applicationId: application.id } : view));
            void queryClient.invalidateQueries({ queryKey: ["applications"] });
            void queryClient.invalidateQueries({ queryKey: ["job-posts"], exact: true });
        },
        onError: (error) => toast.error(errorMessage(error, "Couldn’t add it to your pipeline. Please try again.")),
    });
}

export function useJobPrep(id: string, enabled: boolean) {
    return useQuery({
        queryKey: ["job-posts", id, "prep"],
        enabled,
        queryFn: async () => (await axios.get<{ prep: string | null }>(`/api/job-posts/${id}/prep`)).data.prep,
    });
}

export function useGenerateJobPrep(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (refresh: boolean) =>
            (await axios.post<{ prep: string }>(`/api/job-posts/${id}/prep${refresh ? "?refresh=1" : ""}`)).data.prep,
        onSuccess: (prep) => {
            queryClient.setQueryData(["job-posts", id, "prep"], prep);
            queryClient.setQueryData<JobPostView>(["job-posts", id], (view) => (view ? { ...view, hasPrep: true } : view));
        },
        onError: (error) => toast.error(errorMessage(error, "Couldn’t generate prep. Please try again.")),
    });
}

export { errorMessage as jobPostErrorMessage };
