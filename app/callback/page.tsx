"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GITHUB_CONFIG } from "@/lib/github-config";

export default function CallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        async function handleCallback() {
            const code = searchParams.get("code");
            
            if (!code) {
                console.error("No code received from GitHub");
                router.push("/");
                return;
            }

            try {
                // Exchange code for token
                const tokenResponse = await fetch("/api/auth/github", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code }),
                });

                const data = await tokenResponse.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                // Store token in localStorage
                localStorage.setItem("github_token", data.access_token);

                // Redirect to dashboard or home
                router.push("/dashboard");

            } catch (error) {
                console.error("Error during GitHub authentication:", error);
                router.push("/?error=github_auth_failed");
            }
        }

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Connecting to GitHub...</h2>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
} 