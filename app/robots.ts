import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/email";

export default function robots(): MetadataRoute.Robots {
  const origin = appOrigin() ?? "https://getafterflight.com";
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${origin}/sitemap.xml`,
  };
}
