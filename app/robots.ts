import type { MetadataRoute } from "next";
import { isSiteGateEnabled } from "@/lib/auth/session";
import { appOrigin } from "@/lib/email";

/**
 * When the shared-password gate is on, the site is private -- so robots.txt
 * stops inviting crawlers and stops advertising the sitemap.
 *
 * The gate already stops a crawler reading anything: every marketing path
 * redirects to /gate. But the sitemap it pointed at is a complete, public list
 * of every URL on the site, so a gated site was still publishing its own map.
 * Disallowed here rather than left to the redirect, because "you cannot read
 * this" and "you should not know this exists" are different claims and only
 * one of them was being made.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = appOrigin() ?? "https://getafterflight.com";

  if (isSiteGateEnabled()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${origin}/sitemap.xml`,
  };
}
