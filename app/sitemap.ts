import type { MetadataRoute } from "next";
import { getRepository } from "@/lib/data";
import { appOrigin } from "@/lib/email";

const STATIC_ROUTES = [
  "/",
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

  entries.push({ url: `${origin}/resources`, lastModified: new Date() });
  for (const topic of topics) {
    entries.push({ url: `${origin}/resources/${topic.slug}`, lastModified: new Date() });
  }
  for (const article of articles) {
    const topicSlug = (article.topicId && topicBySlugId.get(article.topicId)) || "afterflight";
    entries.push({
      url: `${origin}/resources/${topicSlug}/${article.slug}`,
      lastModified: new Date(article.updatedAt),
    });
  }

  entries.push({ url: `${origin}/research`, lastModified: new Date() });
  for (const report of reports) {
    entries.push({ url: `${origin}/research/${report.slug}`, lastModified: new Date(report.updatedAt) });
  }

  return entries;
}
