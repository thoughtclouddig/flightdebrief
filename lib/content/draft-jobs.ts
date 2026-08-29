import { randomUUID } from "crypto";

/**
 * In-flight drafting jobs.
 *
 * Writing an article now takes minutes: a web-search research pass, four
 * model calls, and an image. Replit's proxy gives up on the HTTP request long
 * before that and returns its own 502, so the browser saw a failure while the
 * work carried on and the article landed anyway -- the worst of both, since
 * the desk reported an error for something that succeeded.
 *
 * So the request starts the job and returns immediately; the desk polls. Held
 * in memory rather than a table because a job is only interesting while it's
 * running: a restart loses the status, and the article it produced is still
 * in the database where it belongs.
 */
export type DraftJobState = "running" | "done" | "failed";

export interface DraftJob {
  id: string;
  state: DraftJobState;
  error: string | null;
  articleId: string | null;
  startedAt: number;
}

const jobs = new Map<string, DraftJob>();

/** Long enough to survive a slow pipeline, short enough not to leak. */
const RETENTION_MS = 30 * 60 * 1000;

function sweep(): void {
  const cutoff = Date.now() - RETENTION_MS;
  for (const [id, job] of jobs) {
    if (job.startedAt < cutoff) jobs.delete(id);
  }
}

export function startDraftJob(work: () => Promise<{ articleId: string }>): DraftJob {
  sweep();
  const job: DraftJob = { id: randomUUID(), state: "running", error: null, articleId: null, startedAt: Date.now() };
  jobs.set(job.id, job);

  // Deliberately not awaited: the caller returns while this runs. Any throw
  // is captured onto the job rather than becoming an unhandled rejection.
  void work()
    .then(({ articleId }) => {
      job.state = "done";
      job.articleId = articleId;
    })
    .catch((err: unknown) => {
      console.error("[content-pipeline] draft job failed:", err);
      job.state = "failed";
      job.error = err instanceof Error ? err.message : "Drafting failed.";
    });

  return job;
}

export function getDraftJob(id: string): DraftJob | null {
  return jobs.get(id) ?? null;
}
