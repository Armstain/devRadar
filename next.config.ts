import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't generate AGENTS.md / CLAUDE.md when `next dev` runs under an AI coding agent.
  agentRules: false,
};

export default nextConfig;
