"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
    APPLICATION_STATUSES,
    normalizeStatus,
    type Application,
    type ApplicationInput,
    type ApplicationStatus,
    type ApplicationUpdate,
} from "@/lib/applications";

export const applicationsKey = ["applications"] as const;

interface StoredApplication {
    _id: string;
    company: string;
    position: string;
    status?: string;
    link?: string;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

function toStatus(value: unknown): ApplicationStatus {
    const status = normalizeStatus(value);
    return APPLICATION_STATUSES.includes(status as ApplicationStatus) ? (status as ApplicationStatus) : "applied";
}

export function normalizeApplication(raw: StoredApplication): Application {
    return {
        id: String(raw._id),
        company: raw.company,
        position: raw.position,
        status: toStatus(raw.status),
        link: raw.link ?? "",
        notes: raw.notes ?? "",
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
    };
}

export function useApplications() {
    return useQuery({
        queryKey: applicationsKey,
        queryFn: async () => {
            const { data } = await axios.get<StoredApplication[]>("/api/applications");
            return data.map(normalizeApplication);
        },
    });
}

export function useCreateApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: ApplicationInput) => {
            const { data } = await axios.post<StoredApplication>("/api/applications", input);
            return normalizeApplication({ ...data, _id: String((data as { id?: string }).id ?? data._id) });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationsKey }),
    });
}

// Applies the change to the cache immediately and rolls back if the server refuses it.
export function useUpdateApplication() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, update }: { id: string; update: ApplicationUpdate }) => {
            const { data } = await axios.patch<StoredApplication>(`/api/applications/${id}`, update);
            return normalizeApplication(data);
        },
        onMutate: async ({ id, update }) => {
            await queryClient.cancelQueries({ queryKey: applicationsKey });
            const previous = queryClient.getQueryData<Application[]>(applicationsKey);
            queryClient.setQueryData<Application[]>(applicationsKey, (apps) =>
                apps?.map((a) => (a.id === id ? { ...a, ...update, updatedAt: new Date().toISOString() } : a))
            );
            return { previous };
        },
        onError: (_error, _vars, context) => {
            queryClient.setQueryData(applicationsKey, context?.previous);
            toast.error("Couldn’t save that change. Please try again.");
        },
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
            queryClient.invalidateQueries({ queryKey: applicationsKey });
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
