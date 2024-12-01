import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['media.licdn.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
