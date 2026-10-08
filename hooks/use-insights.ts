"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { Insights } from "@/lib/insights";

export function useInsights() {
    return useQuery({
        queryKey: ["insights"],
        queryFn: async () => (await axios.get<Insights>("/api/insights")).data,
    });
}
