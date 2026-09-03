import { isContentPublic } from "@/lib/content/visibility";
import type { MetadataRoute } from "next";
import { getRepository } from "@/lib/data";
import { appOrigin } from "@/lib/email";

const STATIC_ROUTES = [
  "/",
  "/how-it-works",
  "/instructors",
  "/schools",
  "/enterprise",
  "/demo",
  "/what-is-afterflight",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = appOrigin() ?? "https://getafterflight.com";
  const repo = getRepository();
  const [topics, articles, reports] = await Promise.all([
    repo.listResourceTopics(),
    repo.listArticles({ status: "published" }),
    repo.listResearchReports({ status: "published" }),
  ]);
  const topicBySlugId = new Map(topics.map((t) => [t.id, t.slug]));

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${origin}${path}`,
    lastModified: new Date(),
  }));

  // Gated with the pages themselves -- listing URLs that 404 is worse than
  // listing nothing, and a sitemap is the fastest way to get unfinished
  // content crawled. See lib/content/visibility.ts.
  if (!isContentPublic()) return entries;

  entries.push({ url: `${origin}/field-notes`, lastModified: new Date() });
  for (const topic of topics) {
    entries.push({ url: `${origin}/field-notes/${topic.slug}`, lastModified: new Date() });
  }
  for (const article of articles) {
    const topicSlug = (article.topicId && topicBySlugId.get(article.topicId)) || "afterflight";
    entries.push({
      url: `${origin}/field-notes/${topicSlug}/${article.slug}`,
      lastModified: new Date(article.updatedAt),
    });
  }

  entries.push({ url: `${origin}/research`, lastModified: new Date() });
  for (const report of reports) {
    entries.push({ url: `${origin}/research/${report.slug}`, lastModified: new Date(report.updatedAt) });
  }

  return entries;
}
