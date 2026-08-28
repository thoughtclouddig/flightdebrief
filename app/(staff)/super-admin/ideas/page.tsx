import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";
import { IdeaReviewList } from "@/components/admin/idea-review-list";

export const dynamic = "force-dynamic";

export default async function AdminIdeasPage() {
  const repo = getRepository();
  const [ideas, topics] = await Promise.all([repo.listArticleIdeas(), repo.listResourceTopics()]);
  const topicNames = Object.fromEntries(topics.map((t) => [t.id, t.name]));

  const proposed = ideas.filter((i) => i.status === "proposed");
  // Approved-but-not-yet-drafted is the queue the drafting run consumes --
  // worth showing so it's obvious the decision went somewhere.
  const approved = ideas.filter((i) => i.status === "approved");
  const drafted = ideas.filter((i) => i.status === "drafted");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Article Ideas</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          Approve an idea and it gets drafted on the next run. Nothing is written until you say so.
        </p>
      </div>

      <IdeaReviewList ideas={proposed} topicNames={topicNames} />

      {approved.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground-soft">Approved, awaiting draft ({approved.length})</h2>
          <div className="flex flex-col gap-2">
            {approved.map((idea) => (
              <Card key={idea.id}>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <p className="text-sm text-foreground">{idea.title}</p>
                  <Badge variant="neutral">Queued</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {drafted.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground-soft">Drafted ({drafted.length})</h2>
          <div className="flex flex-col gap-2">
            {drafted.map((idea) => (
              <Card key={idea.id}>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <p className="text-sm text-foreground">{idea.title}</p>
                  {idea.articleId ? (
                    <Link href={`/super-admin/articles/${idea.articleId}`} className="text-sm font-medium text-brand hover:underline">
                      Open draft
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
