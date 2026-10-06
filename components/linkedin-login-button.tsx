import { Button } from "@/components/ui/button";
import { FaLinkedin } from "react-icons/fa";

export function LinkedInLoginButton() {
    // A full-page navigation, so the server can set the OAuth state cookie
    // and redirect to LinkedIn.
    return (
        <Button asChild className="bg-[#0077b5] hover:bg-[#006699]">
            <a href="/api/auth/linkedin">
                <FaLinkedin className="mr-2 h-4 w-4" />
                Connect LinkedIn
            </a>
        </Button>
    );
}
