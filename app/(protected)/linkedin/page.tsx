"use client";

import {  useState } from 'react';
import BlurFade from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { LinkedInLoginButton } from "@/components/linkedin-login-button";
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function LinkedInActivityPage() {
  const [isLinkedInConnected, setIsLinkedInConnected] = useState<boolean | null>(null);
  const [postText, setPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const queryClient = useQueryClient();

  const { data: linkedinData, isLoading } = useQuery({
    queryKey: ['linkedin-user'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/linkedin/user');
        console.log('LinkedIn data:', response.data);
        setIsLinkedInConnected(true);
        return response.data;
      } catch (error) {
        console.error('LinkedIn fetch error:', error);
        setIsLinkedInConnected(false);
        throw error;
      }
    },
  });

  const handleCreatePost = async () => {
    if (!postText.trim()) return;

    try {
      setIsPosting(true);
      const response = await axios.post('/api/linkedin/post', { text: postText });
      
      if (response.data) {
        // Clear the text area
        setPostText('');
        // Refresh the posts list
        queryClient.invalidateQueries(['linkedin-user']);
        // Show success message
        toast.success('Post created successfully!');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isLinkedInConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
        <h1 className="text-3xl font-bold mb-6">Connect LinkedIn</h1>
        <p className="text-muted-foreground mb-8">
          Connect your LinkedIn account to see your professional profile.
        </p>
        <LinkedInLoginButton />
      </div>
    );
  }

  // Format locale for display
  const formatLocale = (locale: any) => {
    if (!locale) return 'Not available';
    if (typeof locale === 'object') {
      return `${locale.country || ''} ${locale.language || ''}`.trim();
    }
    return locale;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">LinkedIn Profile</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BlurFade delay={0.25} inView>
          <MagicCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {linkedinData?.picture && (
                    <Image
                      width={100}
                      height={100}
                      src={linkedinData?.picture}
                      alt="Profile" 
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{linkedinData?.name}</p>
                    <p className="text-sm text-muted-foreground">{linkedinData?.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Location: {formatLocale(linkedinData?.locale)}
                  </p>
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>

        <BlurFade delay={0.5} inView>
          <MagicCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Share Update</h2>
              <div className="space-y-4">
                <textarea 
                  className="w-full p-2 border rounded-md"
                  placeholder="What would you like to share on LinkedIn?"
                  rows={3}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  disabled={isPosting}
                />
                <button 
                  className="px-4 py-2 bg-[#0077b5] text-white rounded-md hover:bg-[#006699] disabled:opacity-50"
                  onClick={handleCreatePost}
                  disabled={isPosting || !postText.trim()}
                >
                  {isPosting ? 'Posting...' : 'Share on LinkedIn'}
                </button>
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      </div>

      <BlurFade delay={0.75} inView>
        <MagicCard>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className="space-y-2">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Successfully connected with LinkedIn
              </p>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(linkedinData?.lastUpdated || '').toLocaleString()}
              </p>
            </div>
          </div>
        </MagicCard>
      </BlurFade>
    </div>
  );
} 