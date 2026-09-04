import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The auth e2e run (e2e/auth-journey.mjs) spawns a second dev server on its
  // own port; a separate distDir keeps it from colliding with the main one.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // Development and E2E servers generate their own route-validator files.
  // Keep production type-checking isolated from those concurrently-written
  // caches; a partially-written dev validator must never break publishing.
  typescript: {
    tsconfigPath: process.env.AFTERFLIGHT_BUILD ? "tsconfig.build.json" : "tsconfig.json",
  },
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
  allowedDevOrigins: ["127.0.0.1", "localhost", "**.replit.dev", "**.repl.co"],
  // /resources moved to /field-notes. Permanent rather than temporary because
  // the move is final, and kept rather than dropped because a link that has
  // been crawled or shared outlives our decision to rename the section.
  async redirects() {
    return [
      { source: "/resources", destination: "/field-notes", permanent: true },
      { source: "/resources/:path*", destination: "/field-notes/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
