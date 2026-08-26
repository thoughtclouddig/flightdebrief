import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  copilot: "Copilot",
  claude: "Claude",
  bing: "Bing",
  search_google: "Google Search",
  direct: "Direct",
  other: "Other",
};

const AI_SOURCES = new Set(["chatgpt", "perplexity", "gemini", "copilot", "claude"]);

export default async function AdminAiReferralsPage() {
  const repo = getRepository();
  const summary = await repo.getReferralSummary({ days: 30 });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">AI Referrals</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Last 30 days, classified by referrer host. Bing and Google can&rsquo;t be split into chat vs. search from
          the referrer alone -- those two rows are reported at the coarser level rather than guessed. Direct
          citation counts require Bing Webmaster Tools API access, which isn&rsquo;t connected yet.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">By Source</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.bySource.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No pageviews recorded yet.</p>
          ) : (
            summary.bySource.map((row) => (
              <Card key={row.source}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-2">
                    {AI_SOURCES.has(row.source) ? <Badge variant="brand">AI</Badge> : null}
                    <p className="font-medium text-slate-900 dark:text-white">{SOURCE_LABEL[row.source] ?? row.source}</p>
                  </div>
                  <p className="tabular-nums text-slate-500 dark:text-slate-400">{row.count}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Top Pages</h2>
        <div className="flex flex-col gap-2">
          {summary.byPath.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No pageviews recorded yet.</p>
          ) : (
            summary.byPath.map((row, i) => (
              <Card key={i}>
                <CardContent className="flex items-center justify-between gap-4 py-3">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{row.path}</p>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant="neutral">{SOURCE_LABEL[row.source] ?? row.source}</Badge>
                    <p className="tabular-nums text-slate-500 dark:text-slate-400">{row.count}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
