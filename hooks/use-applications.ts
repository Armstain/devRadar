"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import type {
    Application,
    ApplicationInput,
    ApplicationUpdate,
    ApplicationWithEvents,
} from "@/lib/applications";

export const applicationsKey = ["applications"] as const;
const applicationKey = (id: string) => ["applications", id] as const;

export function useApplications() {
    return useQuery({
        queryKey: applicationsKey,
        queryFn: async () => (await axios.get<Application[]>("/api/applications")).data,
    });
}

export function useApplication(id: string) {
    return useQuery({
        queryKey: applicationKey(id),
        queryFn: async () => (await axios.get<ApplicationWithEvents>(`/api/applications/${id}`)).data,
        retry: (count, error) => !(axios.isAxiosError(error) && error.response?.status === 404) && count < 2,
    });
}

export function useCreateApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: ApplicationInput) => (await axios.post<Application>("/api/applications", input)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationsKey }),
    });
}

// Applies the change to the cached list and detail immediately, and rolls
// both back if the server refuses it.
export function useUpdateApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, update }: { id: string; update: ApplicationUpdate }) =>
            (await axios.patch<Application>(`/api/applications/${id}`, update)).data,
        onMutate: async ({ id, update }) => {
            await queryClient.cancelQueries({ queryKey: applicationsKey });
            const previousList = queryClient.getQueryData<Application[]>(applicationsKey);
            const previousDetail = queryClient.getQueryData<ApplicationWithEvents>(applicationKey(id));
            const updatedAt = new Date().toISOString();
            queryClient.setQueryData<Application[]>(applicationsKey, (apps) =>
                apps?.map((a) => (a.id === id ? { ...a, ...update, updatedAt } : a))
            );
            queryClient.setQueryData<ApplicationWithEvents>(applicationKey(id), (app) =>
                app ? { ...app, ...update, updatedAt } : app
            );
            return { previousList, previousDetail };
        },
        onError: (_error, { id }, context) => {
            queryClient.setQueryData(applicationsKey, context?.previousList);
            queryClient.setQueryData(applicationKey(id), context?.previousDetail);
            toast.error("Couldn’t save that change. Please try again.");
        },
        // Invalidates the list and every detail query (they share the prefix).
        onSettled: () => queryClient.invalidateQueries({ queryKey: applicationsKey }),
    });
}

export function useDeleteApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/applications/${id}`);
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<Application[]>(applicationsKey, (apps) => apps?.filter((a) => a.id !== id));
            queryClient.removeQueries({ queryKey: applicationKey(id) });
            queryClient.invalidateQueries({ queryKey: applicationsKey, exact: true });
        },
    });
}

export interface Me {
    github: { connected: boolean; username: string | null; connectedAt: string | null };
}

export function useMe() {
    return useQuery({
        queryKey: ["me"],
        queryFn: async () => (await axios.get<Me>("/api/me")).data,
    });
}
