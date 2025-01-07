"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { WavyBackground } from "@/components/ui/wavy-background";
import { RainbowButton } from "@/components/ui/rainbow-button";
import ShimmerButton from "@/components/ui/shimmer-button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function LandingPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good Morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
    else if (hour >= 17 && hour < 22) setGreeting("Good Evening");
    else setGreeting("Night Owl");

    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, router]);

  const handleNavigation = async (path: string) => {
    setIsLoading(true);
    router.push(path);
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-6"
        >
          <LoadingSpinner size="lg" />
          <p className="text-lg text-muted-foreground animate-pulse">
            Loading your experience...
          </p>
        </motion.div>
      </div>
    );
  }
  

  return (
    <WavyBackground className="h-screen" waveOpacity={0.3}>
    <div className="h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center space-y-8"
      >
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-400 to-white bg-clip-text text-transparent animate-gradient bg-300%">
          {greeting}!
        </h1>

        <TextGenerateEffect 
          className="text-xl md:text-2xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed" 
          duration={3} 
          filter={true} 
          words="Welcome to DevRadar, your personal development journey tracker." 
        />
        
        <div className="flex gap-4 justify-center mt-8">
          <RainbowButton 
            className="font-semibold" 
            onClick={() => handleNavigation("/sign-up")}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : "Get Started"}
          </RainbowButton>
          
          <ShimmerButton 
            className="font-semibold" 
            onClick={() => handleNavigation("/sign-in")}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : "Sign In"}
          </ShimmerButton>
        </div>
      </motion.div>

      {/* Credits Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-4 text-center text-sm text-muted-foreground"
      >
        <p>
          Made with ❤️ by <a href="https://github.com/armstain" className="text-foreground font-semibold">Adnan</a>
        </p>
      </motion.div>
    </div>
    </WavyBackground>
  );
} 