import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Hide the Next.js "N" floating badge in the bottom-left (dev only)
  devIndicators: false,
};

export default nextConfig;
