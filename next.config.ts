import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The auth e2e run (e2e/auth-journey.mjs) spawns a second dev server on its
  // own port; a separate distDir keeps it from colliding with the main one.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Replit's webview serves the dev server through a proxied *.replit.dev
  // domain, not localhost -- without this, Next 16 blocks dev asset/data
  // requests from that origin by default, which looks like a blank/stuck page.
  // "*" matches exactly one subdomain label; Replit's preview hosts are two
  // levels deep (e.g. xxxx-00-xxxx.riker.replit.dev), so this needs "**"
  // (match one-or-more labels), not "*" -- the single-star version silently
  // blocked every dev asset request, leaving the page unhydrated/inert.
  allowedDevOrigins: ["**.replit.dev", "**.repl.co"],
};

export default nextConfig;
