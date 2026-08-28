import { isContentPublic } from "@/lib/content/visibility";
import { getRepository } from "@/lib/data";
import { appOrigin } from "@/lib/email";

/**
 * Experimental discovery file for LLMs/AI agents (llmstxt.org convention) --
 * not a replacement for the sitemap/robots.txt SEO plumbing. Generated at
 * request time from the same repository the public site reads, so the link
 * list can't go stale the way a hand-maintained file would. Only public
 * marketing content is linked here -- no admin/product/account routes.
 */
export async function GET() {
  const origin = appOrigin() ?? "https://getafterflight.com";

  type Topics = Awaited<ReturnType<ReturnType<typeof getRepository>["listResourceTopics"]>>;
  type Articles = Awaited<ReturnType<ReturnType<typeof getRepository>["listArticles"]>>;
  type Reports = Awaited<ReturnType<ReturnType<typeof getRepository>["listResearchReports"]>>;
  let topics: Topics = [];
  let articles: Articles = [];
  let reports: Reports = [];
  try {
    const repo = getRepository();
    [topics, articles, reports] = await Promise.all([
      repo.listResourceTopics(),
      repo.listArticles({ status: "published" }),
      repo.listResearchReports({ status: "published" }),
    ]);
  } catch {
    // No DATABASE_URL in local/dev sandboxes -- fall back to the static
    // sections below rather than failing the whole file.
  }

  const articlesByTopic = new Map<string, typeof articles>();
  for (const article of articles) {
    const key = article.topicId ?? "";
    articlesByTopic.set(key, [...(articlesByTopic.get(key) ?? []), article]);
  }

  const lines: string[] = [];
  const push = (line = "") => lines.push(line);

  push("# AfterFlight");
  push();
  push(
    "> AfterFlight is a structured debrief tool for flight training. It captures the post-flight conversation between a CFI and student, organizes it into what went well, what to work on, and what to study, and carries that forward into the next lesson.",
  );
  push();
  push(
    "AfterFlight serves student pilots, CFIs (individual instructors and those working within a school), and flight schools that want a consistent debrief process and visibility into training progress. The problem it solves: what's discussed in a flight-training debrief is usually said once and forgotten, so lessons don't build on each other. AfterFlight turns that conversation into a structured, carried-forward record.",
  );
  push();
  push("Core capabilities: guided CFI-led debriefs, AI-organized debrief summaries, ACS-aligned study resources, a Next Flight brief that carries context into the following lesson, and training-progress visibility for CFIs and schools.");
  push();

  push("## Start here");
  push();
  push(`- [What Is AfterFlight?](${origin}/what-is-afterflight): the canonical explanation of what AfterFlight is, who it's for, and how it works.`);
  push(`- [For Flight Instructors](${origin}/instructors)`);
  push(`- [For Flight Schools](${origin}/schools)`);
  push(`- [Enterprise](${origin}/enterprise)`);
  push(`- [Pricing](${origin}/#pricing)`);
  push();

  // Same gate. llms.txt exists to tell models what's worth reading; pointing
  // them at content that isn't ready is the one thing it must not do.
  if (!isContentPublic()) {
    return new Response(lines.join("\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  push("## Resources");
  push();
  push(`- [Resources hub](${origin}/resources)`);
  for (const topic of topics) {
    push(`- [${topic.name}](${origin}/resources/${topic.slug}): ${topic.description}`);
    for (const article of articlesByTopic.get(topic.id) ?? []) {
      push(`  - [${article.title}](${origin}/resources/${topic.slug}/${article.slug})`);
    }
  }
  push();

  push("## Research");
  push();
  if (reports.length) {
    push(`- [Research hub](${origin}/research)`);
    for (const report of reports) {
      push(`  - [${report.title}](${origin}/research/${report.slug})`);
    }
  } else {
    push(`- [Research hub](${origin}/research): original AfterFlight research, published as the anonymized aggregate dataset matures. Nothing published yet.`);
  }
  push();

  push("## Company");
  push();
  push(`- [Privacy Policy](${origin}/privacy)`);
  push(`- [Terms of Service](${origin}/terms)`);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
