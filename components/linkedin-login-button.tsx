"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaLinkedin } from "react-icons/fa";

export function LinkedInLoginButton() {
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const response = await axios.get('/api/auth/linkedin');
            if (response.data.url) {
                router.push(response.data.url);
            }
        } catch (error) {
            console.error('Failed to initiate LinkedIn login:', error);
        }
    };

    return (
        <Button 
            onClick={handleLogin}
            className="bg-[#0077b5] hover:bg-[#006699]"
        >
            <FaLinkedin className="mr-2 h-4 w-4" />
            Connect LinkedIn
        </Button>
    );
} 