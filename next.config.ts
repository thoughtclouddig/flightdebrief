import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Replit's webview serves the dev server through a proxied *.replit.dev
  // domain, not localhost -- without this, Next 16 blocks dev asset/data
  // requests from that origin by default, which looks like a blank/stuck page.
  allowedDevOrigins: ["*.replit.dev", "*.repl.co"],
};

export default nextConfig;
