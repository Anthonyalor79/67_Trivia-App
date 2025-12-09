import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Don't fail the production build because of ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
