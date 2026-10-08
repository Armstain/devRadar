"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import type {
    Application,
    ApplicationInput,
    ApplicationUpdate,
    ApplicationWithEvents,
    FollowUpAction,
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

const remindersKey = ["follow-up-reminders"] as const;

const SNOOZE_LABELS: Record<number, string> = { 3: "three days", 7: "a week", 14: "two weeks" };

// "I followed up" or a snooze. The server answers with the updated
// application, which replaces the cached copy in the list.
export function useFollowUp() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, action }: { id: string; action: FollowUpAction }) =>
            (await axios.post<Application>(`/api/applications/${id}/follow-up`, action)).data,
        onSuccess: (app, { action }) => {
            queryClient.setQueryData<Application[]>(applicationsKey, (apps) => apps?.map((a) => (a.id === app.id ? app : a)));
            queryClient.invalidateQueries({ queryKey: applicationsKey });
            queryClient.invalidateQueries({ queryKey: remindersKey });
            toast.success(
                action.action === "followed-up"
                    ? `Noted. DevRadar will check on ${app.company} again in 10 days.`
                    : `Snoozed for ${SNOOZE_LABELS[action.days]}.`
            );
        },
        onError: () => toast.error("Couldn’t save that. Please try again."),
    });
}

export interface Reminder {
    applicationId: string;
    dueAt: string;
}

// Follow-ups that became due since the user last looked (written by the
// daily reminders job).
export function useReminders() {
    return useQuery({
        queryKey: remindersKey,
        queryFn: async () => (await axios.get<Reminder[]>("/api/follow-ups/reminders")).data,
    });
}

// Doesn't refetch on success: the "new" markers stay for the rest of this
// visit and are gone on the next one.
export function useMarkRemindersSeen() {
    return useMutation({
        mutationFn: async () => (await axios.post<{ seen: number }>("/api/follow-ups/reminders")).data,
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
